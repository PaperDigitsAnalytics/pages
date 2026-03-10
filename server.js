const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// Create HTTP server with Express - handle upgrade requests at the lowest level
const server = http.createServer((req, res) => {
    // Strip upgrade headers immediately
    if (req.headers.upgrade) {
        delete req.headers.upgrade;
    }
    if (req.headers.connection) {
        const conn = req.headers.connection.toLowerCase();
        if (conn.includes('upgrade')) {
            req.headers.connection = conn.replace(/upgrade/gi, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') || 'keep-alive';
        }
    }
    // Pass to Express
    app(req, res);
});

// Prevent 426 by handling upgrade events and NOT sending a response
server.on('upgrade', (request, socket, head) => {
    // Immediately close without sending 426
    socket.end();
});

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strip upgrade headers from requests to prevent 426 errors
app.use((req, res, next) => {
    if (req.headers.upgrade) {
        delete req.headers.upgrade;
    }
    if (req.headers.connection && typeof req.headers.connection === 'string') {
        req.headers.connection = req.headers.connection.replace(/upgrade/gi, 'keep-alive').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
        if (!req.headers.connection || req.headers.connection.trim() === '') {
            req.headers.connection = 'keep-alive';
        }
    }
    next();
});

// URL rewriting middleware - remove .html from URLs
app.use((req, res, next) => {
    // If the request is for a content page without .html extension
    if (req.path.match(/^\/content\/[^\/]+$/) && !req.path.endsWith('.html')) {
        // Check if the corresponding .html file exists
        const htmlPath = req.path + '.html';
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(__dirname, htmlPath);
        
        if (fs.existsSync(fullPath)) {
            // Rewrite the URL to include .html
            req.url = htmlPath;
        }
    }
    next();
});

app.use(express.static('.')); // Serve static files from current directory

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'header-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Ensure directories exist
const contentDir = path.join(__dirname, 'content');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Image optimization function
async function optimizeImage(inputPath, outputPath, options = {}) {
    const {
        width = 1200,  // Default width for hero images
        height = 500,  // Default height for hero images
        quality = 85,  // JPEG quality
        format = 'jpeg'
    } = options;

    try {
        let pipeline = sharp(inputPath)
            .resize(width, height, {
                fit: 'cover',
                position: 'center'
            });

        if (format === 'png') {
            pipeline = pipeline.png({ quality: quality, compressionLevel: 9 });
        } else {
            pipeline = pipeline.jpeg({ quality });
        }

        await pipeline.toFile(outputPath);
        
        console.log(`✅ Image optimized: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('❌ Error optimizing image:', error);
        return false;
    }
}

// Generate responsive images
async function generateResponsiveImages(inputPath, baseFilename) {
    const sizes = [
        { width: 750, height: 500, suffix: '-mobile' },    // Mobile
        { width: 1200, height: 500, suffix: '-desktop' },  // Desktop
        { width: 2400, height: 1000, suffix: '-2x' }       // High DPI
    ];

    const optimizedImages = [];

    for (const size of sizes) {
        const outputFilename = baseFilename.replace(/\.[^/.]+$/, `${size.suffix}.jpg`);
        const outputPath = path.join(uploadsDir, outputFilename);
        
        const success = await optimizeImage(inputPath, outputPath, {
            width: size.width,
            height: size.height,
            quality: 85
        });

        if (success) {
            optimizedImages.push({
                url: `/uploads/${outputFilename}`,
                width: size.width,
                suffix: size.suffix
            });
        }
    }

    return optimizedImages;
}

// Generate a 1200x1200 square variant for feeds/cards
async function generateSquareImage1200(inputPath, baseFilename) {
    const outputFilename = baseFilename.replace(/\.[^/.]+$/, '-square1200.jpg');
    const outputPath = path.join(uploadsDir, outputFilename);
    const success = await optimizeImage(inputPath, outputPath, {
        width: 1200,
        height: 1200,
        quality: 85
    });
    if (success) {
        return {
            url: `/uploads/${outputFilename}`,
            width: 1200,
            height: 1200,
            suffix: '-square1200'
        };
    }
    return null;
}

// Generate requested PNG variants for social formats
async function generatePngVariants(inputPath, baseFilename) {
    const variants = [
        { width: 1200, height: 1200, suffix: '-1200x1200', purpose: 'square' },          // 1:1
        { width: 1440, height: 1800, suffix: '-1440x1800', purpose: 'meta_4_5' },        // 4:5
        { width: 1080, height: 1920, suffix: '-1080x1920', purpose: 'vertical_9_16' },   // 9:16
        { width: 1200, height: 628, suffix: '-1200x628', purpose: 'landscape_1_91_1' },  // 1.91:1
        { width: 960, height: 1200, suffix: '-960x1200', purpose: 'portrait_4_5' }       // 4:5
    ];

    const outputs = [];
    for (const v of variants) {
        const outputFilename = baseFilename.replace(/\.[^/.]+$/, `${v.suffix}.png`);
        const outputPath = path.join(uploadsDir, outputFilename);
        const ok = await optimizeImage(inputPath, outputPath, { width: v.width, height: v.height, quality: 90, format: 'png' });
        if (ok) {
            outputs.push({ url: `/uploads/${outputFilename}`, width: v.width, height: v.height, suffix: v.suffix, purpose: v.purpose, format: 'png' });
        }
    }
    return outputs;
}

// Optimize avatar images
async function optimizeAvatarImage(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(80, 80, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
        
        console.log(`✅ Avatar image optimized: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('❌ Error optimizing avatar image:', error);
        return false;
    }
}

// API Routes

// Upload image
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
        console.log('Upload request received:', {
            hasFile: !!req.file,
            body: req.body,
            headers: req.headers
        });

        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ 
                success: false, 
                error: 'Geen afbeelding bestand ontvangen. Controleer of je een geldige afbeelding hebt geselecteerd.' 
            });
        }

        console.log('File details:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        // Generate optimized images
        console.log('🔄 Optimizing images...');
        const responsiveImages = await generateResponsiveImages(req.file.path, req.file.filename);
        
        // Also generate a square 1200x1200 variant
        console.log('🔄 Generating 1200x1200 square...');
        const squareImage = await generateSquareImage1200(req.file.path, req.file.filename);
        if (squareImage) {
            responsiveImages.push(squareImage);
        }
        
        // Generate additional PNG variants for social formats
        console.log('🔄 Generating PNG variants...');
        const pngVariants = await generatePngVariants(req.file.path, req.file.filename);
        const allImages = responsiveImages.concat(pngVariants);
        
        if (allImages.length === 0) {
            console.error('❌ Failed to generate optimized images');
            return res.status(500).json({ 
                success: false, 
                error: 'Fout bij het optimaliseren van de afbeelding' 
            });
        }

        // Use the desktop version as the main image URL
        const mainImage = responsiveImages.find(img => img.suffix === '-desktop') || responsiveImages[0];
        const imageUrl = mainImage.url;
        
        console.log(`✅ Image uploaded and optimized successfully: ${req.file.filename}`);
        console.log(`📊 Generated ${allImages.length} optimized versions (${responsiveImages.length} JPEG + ${pngVariants.length} PNG)`);
        
        res.json({ 
            success: true, 
            message: 'Afbeelding succesvol geüpload en geoptimaliseerd',
            imageUrl: imageUrl,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            responsiveImages: allImages,
            square1200: squareImage ? squareImage.url : null,
            pngVariants: pngVariants,
            originalSize: req.file.size
        });
        
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({ 
            success: false, 
            error: `Server fout: ${error.message}` 
        });
    }
});

// Upload avatar image
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        console.log('Avatar upload request received:', {
            hasFile: !!req.file,
            body: req.body,
            headers: req.headers
        });

        if (!req.file) {
            console.log('No avatar file in request');
            return res.status(400).json({ 
                success: false, 
                error: 'Geen avatar bestand ontvangen. Controleer of je een geldige afbeelding hebt geselecteerd.' 
            });
        }

        console.log('Avatar file details:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        // Optimize avatar image
        console.log('🔄 Optimizing avatar image...');
        const avatarFilename = req.file.filename.replace(/\.[^/.]+$/, '-avatar.jpg');
        const avatarPath = path.join(uploadsDir, avatarFilename);
        
        const success = await optimizeAvatarImage(req.file.path, avatarPath);
        
        if (!success) {
            console.error('❌ Failed to optimize avatar image');
            return res.status(500).json({ 
                success: false, 
                error: 'Fout bij het optimaliseren van de avatar afbeelding' 
            });
        }

        const avatarUrl = `/uploads/${avatarFilename}`;
        
        console.log(`✅ Avatar uploaded and optimized successfully: ${avatarFilename}`);
        
        res.json({ 
            success: true, 
            message: 'Avatar succesvol geüpload en geoptimaliseerd',
            avatarUrl: avatarUrl,
            filename: avatarFilename,
            originalSize: req.file.size,
            optimizedSize: fs.statSync(avatarPath).size
        });
        
    } catch (error) {
        console.error('❌ Error uploading avatar:', error);
        res.status(500).json({ 
            success: false, 
            error: `Server fout: ${error.message}` 
        });
    }
});

// Error handler for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('Multer error:', error);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Bestand is te groot. Maximaal 5MB toegestaan.'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Upload fout: ${error.message}`
        });
    }
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
            success: false,
            error: 'Alleen afbeelding bestanden zijn toegestaan (JPG, PNG, GIF, etc.)'
        });
    }
    next(error);
});

// Save blog post
app.post('/api/save-blog-post', (req, res) => {
    try {
        const { filename, html, metadata } = req.body;
        
        if (!filename || !html) {
            return res.status(400).json({ 
                success: false, 
                error: 'Filename and HTML content are required' 
            });
        }
        
        // Save HTML file to content directory
        const filePath = path.join(contentDir, filename);
        fs.writeFileSync(filePath, html, 'utf8');
        
        // Save metadata to localStorage file (for file manager)
        const metadataFile = path.join(__dirname, 'blog-metadata.json');
        let metadataList = [];
        
        if (fs.existsSync(metadataFile)) {
            metadataList = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        }
        
        const fileInfo = {
            filename: filename,
            html: html,
            timestamp: new Date().toISOString(),
            path: `content/${filename}`,
            metadata: metadata
        };
        
        metadataList.push(fileInfo);
        fs.writeFileSync(metadataFile, JSON.stringify(metadataList, null, 2));
        
        console.log(`Blog post saved: ${filePath}`);
        
        // Blog overview is now handled by index.html in static export
        
        res.json({ 
            success: true, 
            message: `Blog post saved to content/${filename}`,
            path: `content/${filename}`
        });
        
    } catch (error) {
        console.error('Error saving blog post:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get all blog posts
app.get('/api/blog-posts', (req, res) => {
    try {
        const metadataFile = path.join(__dirname, 'blog-metadata.json');
        
        if (!fs.existsSync(metadataFile)) {
            return res.json([]);
        }
        
        const metadataList = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        res.json(metadataList);
        
    } catch (error) {
        console.error('Error getting blog posts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Delete blog post
app.delete('/api/blog-posts/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        
        // Remove HTML file
        const filePath = path.join(contentDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove from metadata
        const metadataFile = path.join(__dirname, 'blog-metadata.json');
        if (fs.existsSync(metadataFile)) {
            let metadataList = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
            metadataList = metadataList.filter(file => file.filename !== filename);
            fs.writeFileSync(metadataFile, JSON.stringify(metadataList, null, 2));
        }
        
        res.json({ 
            success: true, 
            message: `Blog post ${filename} deleted` 
        });
        
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get blog post content
app.get('/api/blog-posts/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(contentDir, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Blog post not found' 
            });
        }
        
        const html = fs.readFileSync(filePath, 'utf8');
        res.json({ 
            success: true, 
            html: html 
        });
        
    } catch (error) {
        console.error('Error getting blog post:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Blog overview is now handled by index.html in static export

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Blog CMS Backend running on http://localhost:${PORT}`);
    console.log(`📁 Content directory: ${contentDir}`);
    console.log(`📝 CMS available at: http://localhost:${PORT}/cms.html`);
});
