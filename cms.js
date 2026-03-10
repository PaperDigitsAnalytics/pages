// CMS JavaScript functionality
class BlogCMS {
    constructor() {
        // BlogManager removed - backend handles everything now
        this.authorMapping = {
            'Wouter Naber': 'images/writers/Wouter Naber.jpg',
            'Lasse Botman': 'images/writers/Lasse Botman.png'
        };
        this.init();
    }

    init() {
        // HTML textarea editor - no initialization needed
        this.initEventListeners();
        this.setDefaultDate();
        this.loadFilesList();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        // Load files list when switching to manage tab
        if (tabName === 'manage') {
            this.loadFilesList();
        }
    }

    async loadFilesList() {
        const filesList = document.getElementById('files-list');
        
        try {
            const response = await fetch('/api/blog-posts');
            const savedFiles = await response.json();
            
            if (savedFiles.length === 0) {
                filesList.innerHTML = `
                    <div class="empty-state">
                        <h3>Geen blog posts in content map</h3>
                        <p>Maak je eerste blog post om te beginnen!</p>
                    </div>
                `;
                return;
            }
            
            filesList.innerHTML = savedFiles.map(file => `
                <div class="file-item">
                    <div class="file-info">
                        <h3>${file.filename}</h3>
                        <p>Gegenereerd: ${new Date(file.timestamp).toLocaleString('nl-NL')}</p>
                        <p>Pad: ${file.path}</p>
                        ${file.metadata ? `<p>Titel: ${file.metadata.title}</p>` : ''}
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-small btn-primary" onclick="cms.editFile('${file.filename}')">Bewerken</button>
                        <button class="btn btn-small btn-secondary" onclick="cms.downloadFile('${file.filename}')">Download</button>
                        <button class="btn btn-small btn-danger" onclick="cms.deleteFile('${file.filename}')">Verwijder</button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading files list:', error);
            filesList.innerHTML = `
                <div class="empty-state">
                    <h3>Fout bij laden van bestanden</h3>
                    <p>Controleer of de backend server draait op localhost:3000</p>
                </div>
            `;
        }
    }

    async downloadFile(filename) {
        try {
            const response = await fetch(`/api/blog-posts/${filename}`);
            const result = await response.json();
            
            if (result.success) {
                const blob = new Blob([result.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `content/${filename}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                this.showError(`Fout bij downloaden: ${result.error}`);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showError('Fout bij downloaden van bestand');
        }
    }

    async editFile(filename) {
        try {
            // Get the blog post data
            const response = await fetch(`/api/blog-posts/${filename}`);
            const result = await response.json();
            
            if (!result.success) {
                this.showError(`Fout bij laden: ${result.error}`);
                return;
            }
            
            // Get metadata from the files list
            const filesResponse = await fetch('/api/blog-posts');
            const files = await filesResponse.json();
            const fileData = files.find(file => file.filename === filename);
            
            if (!fileData || !fileData.metadata) {
                this.showError('Geen metadata gevonden voor deze blog post');
                return;
            }
            
            // Switch to create tab
            this.switchTab('create');
            
            // Fill form with existing data
            this.populateForm(fileData.metadata, result.html);
            
            this.showSuccess(`Blog post "${fileData.metadata.title}" geladen voor bewerking`);
            
        } catch (error) {
            console.error('Error editing file:', error);
            this.showError('Fout bij laden van blog post voor bewerking');
        }
    }

    populateForm(metadata, htmlContent) {
        // Fill form fields
        document.getElementById('post-title').value = metadata.title || '';
        document.getElementById('post-description').value = metadata.description || '';
        document.getElementById('post-ad-description').value = metadata.adDescription || '';
        document.getElementById('post-ad-description-2').value = metadata.adDescription2 || '';
        document.getElementById('post-headline-1').value = metadata.headline1 || '';
        document.getElementById('post-headline-2').value = metadata.headline2 || '';
        document.getElementById('post-headline-3').value = metadata.headline3 || '';
        document.getElementById('post-category').value = metadata.category || '';
        document.getElementById('post-author').value = metadata.author || '';
        document.getElementById('post-date').value = metadata.date || '';
        document.getElementById('post-read-count').value = metadata.readCount || '';
        document.getElementById('post-hero-image').value = metadata.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg';
        
        // Generate alt text from title
        if (metadata.title) {
            this.generateAltText(metadata.title);
        } else {
            document.getElementById('post-hero-alt').value = '';
        }
        
        // Fill content
        document.getElementById('content').value = htmlContent || '';
        
        // Update image preview if hero image exists
        if (metadata.heroImage && metadata.heroImage !== 'images/Hetportretbureau_LR__T1A1116.jpg') {
            const imagePreview = document.getElementById('image-preview');
            const previewImg = document.getElementById('preview-img');
            const imageFilename = document.getElementById('image-filename');
            const uploadArea = document.getElementById('upload-area');
            
            uploadArea.style.display = 'none';
            imagePreview.style.display = 'flex';
            previewImg.src = `../${metadata.heroImage}`;
            imageFilename.textContent = metadata.heroImage.split('/').pop();
        }
    }

    async deleteFile(filename) {
        if (confirm(`Weet je zeker dat je ${filename} wilt verwijderen?`)) {
            try {
                const response = await fetch(`/api/blog-posts/${filename}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess(`Blog post ${filename} is verwijderd`);
                    await this.loadFilesList();
                } else {
                    this.showError(`Fout bij verwijderen: ${result.error}`);
                }
            } catch (error) {
                console.error('Error deleting file:', error);
                this.showError('Fout bij verwijderen van bestand');
            }
        }
    }

    async clearAllFiles() {
        if (confirm('Weet je zeker dat je alle gegenereerde bestanden wilt verwijderen?')) {
            try {
                // Get all files first
                const response = await fetch('/api/blog-posts');
                const files = await response.json();
                
                // Delete each file
                for (const file of files) {
                    await fetch(`/api/blog-posts/${file.filename}`, {
                        method: 'DELETE'
                    });
                }
                
                this.showSuccess('Alle blog posts zijn verwijderd');
                await this.loadFilesList();
                
            } catch (error) {
                console.error('Error clearing all files:', error);
                this.showError('Fout bij verwijderen van alle bestanden');
            }
        }
    }

    // HTML textarea editor - no initialization needed

    initImageUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('image-upload');
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        const imageFilename = document.getElementById('image-filename');
        const removeImageBtn = document.getElementById('remove-image');
        const heroImageInput = document.getElementById('post-hero-image');

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0]);
            }
        });

        // Remove image
        removeImageBtn.addEventListener('click', () => {
            this.removeUploadedImage();
        });
    }

    async handleImageUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showError('Alleen afbeeldingen zijn toegestaan');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showError('Bestand is te groot. Maximaal 5MB toegestaan');
            return;
        }

        // Show preview
        this.showImagePreview(file);

        // Upload to server
        const formData = new FormData();
        formData.append('image', file);

        try {
            console.log('Starting image upload...', file.name, file.size, file.type);
            
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            console.log('Upload response status:', response.status);
            console.log('Upload response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Upload result:', result);

            if (result.success) {
                // Update hidden input with uploaded image URL
                document.getElementById('post-hero-image').value = result.imageUrl;
                
                // Store responsive image URLs for later use
                if (result.responsiveImages) {
                    this.responsiveImages = result.responsiveImages;
                }
                
                this.showSuccess(`Afbeelding succesvol geüpload en geoptimaliseerd! (${result.filename})`);
            } else {
                this.showError(`Upload mislukt: ${result.error || 'Onbekende fout'}`);
                this.removeUploadedImage();
            }
        } catch (error) {
            console.error('Upload error details:', error);
            this.showError(`Upload fout: ${error.message}`);
            this.removeUploadedImage();
        }
    }

    showImagePreview(file) {
        const uploadArea = document.getElementById('upload-area');
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        const imageFilename = document.getElementById('image-filename');

        // Hide upload area, show preview
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'flex';

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Show filename
        imageFilename.textContent = file.name;
    }

    removeUploadedImage() {
        const uploadArea = document.getElementById('upload-area');
        const imagePreview = document.getElementById('image-preview');
        const heroImageInput = document.getElementById('post-hero-image');

        // Reset to default
        uploadArea.style.display = 'block';
        imagePreview.style.display = 'none';
        heroImageInput.value = 'images/Hetportretbureau_LR__T1A1116.jpg';
        
        // Clear responsive images
        this.responsiveImages = null;
        
        // Clear file input
        document.getElementById('image-upload').value = '';
    }

    initEventListeners() {
        // Form submission
        document.getElementById('blog-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBlogPost();
        });

        // Preview button
        document.getElementById('preview-btn').addEventListener('click', () => {
            this.showPreview();
        });

        // Auto-generate alt text when title changes
        document.getElementById('post-title').addEventListener('input', (e) => {
            this.generateAltText(e.target.value);
        });

        // Character counters for ad descriptions and headlines
        document.getElementById('post-ad-description').addEventListener('input', (e) => {
            this.updateCounter('ad-description-counter', e.target.value, 90);
        });
        
        document.getElementById('post-ad-description-2').addEventListener('input', (e) => {
            this.updateCounter('ad-description-2-counter', e.target.value, 90);
        });
        
        document.getElementById('post-headline-1').addEventListener('input', (e) => {
            this.updateCounter('headline-1-counter', e.target.value, 30);
        });
        
        document.getElementById('post-headline-2').addEventListener('input', (e) => {
            this.updateCounter('headline-2-counter', e.target.value, 30);
        });
        
        document.getElementById('post-headline-3').addEventListener('input', (e) => {
            this.updateCounter('headline-3-counter', e.target.value, 30);
        });


        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('preview-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Tab switching
        document.getElementById('create-tab').addEventListener('click', () => {
            this.switchTab('create');
        });

        document.getElementById('manage-tab').addEventListener('click', () => {
            this.switchTab('manage');
        });

        // File manager actions
        document.getElementById('refresh-files').addEventListener('click', () => {
            this.loadFilesList();
        });

        document.getElementById('clear-files').addEventListener('click', () => {
            this.clearAllFiles();
        });

        // Image upload functionality
        this.initImageUpload();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('post-date').value = today;
    }


    getFormData() {
        const formData = new FormData(document.getElementById('blog-form'));
        const data = {};
        
        // Get basic form data
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Add responsive image URLs if available
        if (this.responsiveImages) {
            const mobileImg = this.responsiveImages.find(img => img.suffix === '-mobile');
            const desktopImg = this.responsiveImages.find(img => img.suffix === '-desktop');
            const retinaImg = this.responsiveImages.find(img => img.suffix === '-2x');
            
            if (mobileImg) data.heroImageMobile = mobileImg.url;
            if (desktopImg) data.heroImageDesktop = desktopImg.url;
            if (retinaImg) data.heroImage2x = retinaImg.url;
        }

        // Content is already included in FormData since textarea has name="content"
        // Just ensure it's not empty
        if (!data.content) {
            data.content = '';
            console.warn('No content provided');
        }

        return data;
    }


    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    generateAltText(title) {
        if (!title || title.trim() === '') {
            return;
        }
        
        const altText = this.generateAltTextFromTitle(title);
        
        // Update the alt text field
        const altField = document.getElementById('post-hero-alt');
        if (altField) {
            altField.value = altText;
        }
    }

    generateAltTextFromTitle(title) {
        if (!title || title.trim() === '') {
            return 'paperdigits';
        }
        
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-') + '-paperdigits';
    }

    updateCounter(counterId, text, maxLength) {
        const counter = document.getElementById(counterId);
        const length = text ? text.length : 0;
        counter.textContent = length;
        
        // Add warning style if over max length
        const parent = counter.parentElement;
        if (length > maxLength) {
            parent.style.color = '#e74c3c';
        } else {
            parent.style.color = '#666';
        }
    }

    getAuthorAvatar(authorName) {
        return this.authorMapping[authorName] || this.authorMapping['Wouter Naber'];
    }

    generateBlogPostHTML(data) {
        const slug = this.generateSlug(data.title);
        const date = new Date(data.date);
        const formattedDate = date.toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });


        // Generate structured data
        const structuredData = `
            <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": "${data.title}",
                "description": "${data.description}",
                "url": "https://paperdigits.nl/blog/${slug}/",
                "datePublished": "${data.date}",
                "dateModified": "${data.date}",
                "author": {
                    "@type": "Person",
                    "name": "${data.author}"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "PaperDigits",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://paperdigits.nl/wp-content/uploads/2024/01/paperdigits-logo.png"
                    }
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": "https://paperdigits.nl/blog/${slug}/"
                },
                "image": {
                    "@type": "ImageObject",
                    "url": "https://paperdigits.nl/wp-content/uploads/2025/01/${slug}-og.jpg"
                }
            }
            </script>
        `;

        // Try to load template, fallback to inline template if it fails
        return fetch('/blog-post-template.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(template => {
                return template
                    .replace(/\{\{title\}\}/g, data.title)
                    .replace(/\{\{description\}\}/g, data.description)
                    .replace(/\{\{canonical_url\}\}/g, `https://paperdigits.nl/blog/${slug}/`)
                    .replace(/\{\{og_image\}\}/g, `https://paperdigits.nl/wp-content/uploads/2025/01/${slug}-og.jpg`)
                    .replace(/\{\{structured_data\}\}/g, structuredData)
                    .replace(/\{\{category\}\}/g, data.category)
                    .replace(/\{\{author\}\}/g, data.author)
                    .replace(/\{\{author_avatar\}\}/g, this.getAuthorAvatar(data.author))
                    .replace(/\{\{date_published\}\}/g, formattedDate)
                    .replace(/\{\{read_count\}\}/g, data.readCount || '0')
                    .replace(/\{\{hero_image\}\}/g, data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg')
                    .replace(/\{\{hero_image_mobile\}\}/g, data.heroImageMobile || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg')
                    .replace(/\{\{hero_image_desktop\}\}/g, data.heroImageDesktop || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg')
                    .replace(/\{\{hero_image_2x\}\}/g, data.heroImage2x || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg')
                    .replace(/\{\{hero_alt\}\}/g, data.heroAlt || this.generateAltTextFromTitle(data.title))
                    .replace(/\{\{content\}\}/g, data.content)
                    .replace(/\{\{faq_section\}\}/g, '')
                    .replace(/\{\{cta_section\}\}/g, '');
            })
            .catch(error => {
                console.warn('Template not found, using fallback HTML:', error.message);
                // Fallback: generate HTML without template
                return this.generateFallbackHTML(data, slug, formattedDate, structuredData);
            });
    }

    generateFallbackHTML(data, slug, formattedDate, structuredData) {
        // Generate a complete HTML page without template
        return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} | PaperDigits</title>
    <meta name="description" content="${data.description}">
    <link rel="canonical" href="https://paperdigits.nl/blog/${slug}/">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${data.title}">
    <meta property="og:description" content="${data.description}">
    <meta property="og:image" content="https://paperdigits.nl/wp-content/uploads/2025/01/${slug}-og.jpg">
    <meta property="og:url" content="https://paperdigits.nl/blog/${slug}/">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PaperDigits">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${data.title}">
    <meta name="twitter:description" content="${data.description}">
    <meta name="twitter:image" content="https://paperdigits.nl/wp-content/uploads/2025/01/${slug}-og.jpg">
    
    <link rel="stylesheet" href="/styles.css">
    
    ${structuredData}
</head>
<body>
    <header class="header">
        <div class="header__container">
            <a class="header__logo" href="/">
                <img src="/images/logo/PaperDigits_logo.png" alt="PaperDigits - SEO en Digital Marketing Agency" class="logo-image">
            </a>
            <button class="hamburger" aria-label="Toggle menu">
                <span class="hamburger__line"></span>
                <span class="hamburger__line"></span>
                <span class="hamburger__line"></span>
            </button>
            <nav class="header__nav">
                <ul class="nav__list">
                    <li class="nav__item">
                        <a href="#" class="nav__link">Services</a>
                    </li>
                    <li class="nav__item">
                        <a href="#" class="nav__link">Technologie</a>
                    </li>
                    <li class="nav__item">
                        <a href="#" class="nav__link">Stories</a>
                    </li>
                    <li class="nav__item">
                        <a href="#" class="nav__link">Vacatures</a>
                    </li>
                    <li class="nav__item">
                        <a href="#" class="nav__link">Contact</a>
                    </li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main">
        <article class="blog-post">
            <header class="post-header">
                <h1 class="post-title">${data.title}</h1>
            </header>

            <div class="post-content">
                <p class="post-intro">
                    ${data.description}
                </p>

                <div class="post-meta">
                    <div class="author-info">
                        <div class="author-avatar">
                            <img src="/${this.getAuthorAvatar(data.author)}" alt="Auteur" class="avatar-img" loading="lazy">
                        </div>
                        <div class="author-details">
                            <span class="author-name">${data.author}</span>
                            <span class="post-date">${formattedDate}, 06:45</span>
                            <span class="read-count">${data.readCount || '0'} x gelezen</span>
                        </div>
                    </div>
                </div>

                    <div class="hero-image">
                        <img src="/${data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'}" 
                             alt="${data.heroAlt || this.generateAltTextFromTitle(data.title)}" 
                             class="hero-img"
                             srcset="../${data.heroImageMobile || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'} 750w,
                                     /${data.heroImageDesktop || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'} 1200w,
                                     ../${data.heroImage2x || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'} 2400w"
                             sizes="(max-width: 768px) 750px, 1200px"
                             loading="eager">
                    </div>

                ${data.content}
            </div>
        </article>
    </main>

    <footer class="footer">
        <div class="footer__row">
            <nav class="footer__nav">
                <ul class="footer__list footer__list--main">
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Services</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Stories</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Technologie</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Vacatures</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Contact</span>
                            </a>
                        </div>
                    </li>
                </ul>
                
                <ul class="footer__list footer__list--sub">
                    <li class="small-body font-bold">Services</li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Advertising</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Marketplaces Consultancy</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Audit & Strategie</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Data</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Social Advertising</span>
                            </a>
                        </div>
                    </li>
                </ul>
                
                <ul class="footer__list footer__list--sub">
                    <li class="small-body font-bold">Tech</li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Google BigQuery</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Channable</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Google Analytics 4 (GA4)</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Server Side Tagging</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Looker Studio</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Cookie Consent</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="#">
                                <span class="footer__text">Google Tag Manager</span>
                            </a>
                        </div>
                    </li>
                </ul>
                
                <div class="footer__contact">
                    <p class="small-body font-bold">Contactgegevens</p>
                    <div class="p small-body">
                        <p>Noorderstraat 1Q,<br>1823 CS Alkmaar</p>
                        <p><a href="tel:+31722340777">+31 (0)72 234 0777</a><br>
                        <a href="mailto:info@paperdigits.nl">info@paperdigits.nl</a></p>
                    </div>
                    <div class="socials">
                        <a href="https://www.linkedin.com/company/paperdigits">
                            <svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                <g fill-rule="evenodd">
                                    <path d="M21.3333,24 L2.66667,24 C1.19391,24 0,22.8061 0,21.3333 L0,2.66667 C0,1.19391 1.19391,0 2.66667,0 L21.3333,0 C22.8061,0 24,1.19391 24,2.66667 L24,21.3333 C24,22.8061 22.8061,24 21.3333,24 Z M17.1052,20.6667 L20.6667,20.6667 L20.6667,13.3504 C20.6667,10.2548 18.9119,8.75807 16.4609,8.75807 C14.0087,8.75807 12.9767,10.6676 12.9767,10.6676 L12.9767,9.11111 L9.54444,9.11111 L9.54444,20.6667 L12.9767,20.6667 L12.9767,14.6007 C12.9767,12.9754 13.7249,12.0082 15.1569,12.0082 C16.4733,12.0082 17.1052,12.9376 17.1052,14.6007 L17.1052,20.6667 Z M3.33333,5.46567 C3.33333,6.64322 4.28069,7.598 5.44978,7.598 C6.61888,7.598 7.56567,6.64322 7.56567,5.46567 C7.56567,4.28812 6.61888,3.33333 5.44978,3.33333 C4.28069,3.33333 3.33333,4.28812 3.33333,5.46567 Z M7.25647,20.6667 L3.67752,20.6667 L3.67752,9.11111 L7.25647,9.11111 L7.25647,20.6667 Z" id="Shape"></path>
                                </g>
                            </svg>
                            <span class="sr-only">linkedin</span>
                        </a>
                    </div>
                </div>
                
                <div class="footer__contact-button">
                    <a href="https://paperdigits.nl/contact/" target="" rel="noopener" class="button medium-body button--anchor background--dark color--light has-dot">
                        <span class="button__text">Contact opnemen</span>
                        <span class="button-dot color--psea"></span>
                    </a>
                </div>
            </nav>
            
            <div class="footer__bottom">
                <div class="footer__bottom-left">
                    <div class="footer__awards">
                        <p class="small-body font-bold">Awards:</p>
                        <a href="https://dutchsearchawards.nl/winnaars/">
                            <img width="300" height="105" src="https://paperdigits.nl/wp-content/uploads/2025/04/3.png" class="attachment-medium size-medium" alt="" decoding="async" loading="lazy">
                        </a>
                        <a href="https://www.noordhollandsdagblad.nl/cnt/dmf20231127_59218977?utm_source=google&utm_medium=organic">
                            <img width="300" height="105" src="https://paperdigits.nl/wp-content/uploads/2025/04/8.png" class="attachment-medium size-medium" alt="" decoding="async" loading="lazy">
                        </a>
                    </div>
                    <div class="footer__legal-nav">
                        <ul class="footer__list footer__list--legal">
                            <li class="footer__item xsmall-body color--psea">
                                <div class="footer__text-container">
                                    <a class="footer__link" href="https://paperdigits.nl/privacybeleid/">
                                        <span class="footer__text">Privacybeleid</span>
                                    </a>
                                </div>
                            </li>
                            <li class="footer__item xsmall-body color--psea">
                                <div class="footer__text-container">
                                    <a class="footer__link" href="https://paperdigits.nl/cookiebeleid/">
                                        <span class="footer__text">Cookiebeleid</span>
                                    </a>
                                </div>
                            </li>
                        </ul>
                        <p class="footer__copyright xsmall-body">
                            Copyright ©2025 PaperDigits
                        </p>
                    </div>
                </div>
                <div class="footer__bottom-right background--plightgrey">
                    <img width="299" height="286" src="https://paperdigits.nl/wp-content/uploads/2024/02/PremierPartner-RGB-1.png" class="attachment-medium size-medium" alt="" decoding="async" loading="lazy">
                    <img width="300" height="172" src="https://paperdigits.nl/wp-content/uploads/2024/02/MBP-Badge-Light-backgrounds@4x-300x172.png" class="attachment-medium size-medium" alt="" decoding="async" loading="lazy">
                    <img width="300" height="135" src="https://paperdigits.nl/wp-content/uploads/2024/07/PaperDigits_Leadinfo_parnter-300x135.png" class="attachment-medium size-medium" alt="" decoding="async" loading="lazy">
                    <img width="300" height="178" src="https://paperdigits.nl/wp-content/uploads/2024/03/PaperDigits_cookiebot_partner_cookie_consent_mode_v2-300x178.png" class="attachment-medium size-medium" alt="" decoding="async" loading="lazy">
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Hamburger menu functionality
        const hamburger = document.querySelector('.hamburger');
        const nav = document.querySelector('.header__nav');
        
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('hamburger--active');
            nav.classList.toggle('header__nav--active');
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('hamburger--active');
                nav.classList.remove('header__nav--active');
            });
        });
        
        // FAQ toggle functionality
        function toggleFAQ(element) {
            const faqItem = element;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        }
    </script>
</body>
</html>`;
    }

    async saveBlogPost() {
        try {
            const data = this.getFormData();
            
            // Validate required fields
            if (!data.title || !data.description || !data.category || !data.author || !data.date) {
                this.showError('Vul alle verplichte velden in.');
                return;
            }

            if (!data.content || data.content.trim() === '' || data.content.trim() === '<p></p>' || data.content.trim() === '<p><br></p>') {
                this.showError('Voeg content toe aan je blog post.');
                return;
            }

            // Generate HTML
            const html = await this.generateBlogPostHTML(data);
            const slug = this.generateSlug(data.title);
            const filename = `${slug}.html`;

            // Save to content folder
            await this.saveToContentFolder(html, filename);

            // Blog overview is automatically updated by the backend

            this.showSuccess(`Blog post "${data.title}" is succesvol gegenereerd en opgeslagen in de content/ map!`);
            
            // Reset form
            this.resetForm();

        } catch (error) {
            console.error('Error saving blog post:', error);
            
            // More specific error messages
            if (error.message.includes('fetch')) {
                this.showError('Kon de template niet laden. Probeer het opnieuw of controleer je internetverbinding.');
            } else if (error.message.includes('Blob')) {
                this.showError('Er is een fout opgetreden bij het genereren van het bestand. Probeer het opnieuw.');
            } else {
                this.showError(`Er is een fout opgetreden: ${error.message}`);
            }
        }
    }

    async saveToContentFolder(html, filename) {
        try {
            // Get form data for metadata
            const formData = this.getFormData();
            
            // Send to backend API
            const response = await fetch('/api/save-blog-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    html: html,
                    metadata: {
                        title: formData.title,
                        description: formData.description,
                        adDescription: formData.adDescription,
                        adDescription2: formData.adDescription2,
                        headline1: formData.headline1,
                        headline2: formData.headline2,
                        headline3: formData.headline3,
                        category: formData.category,
                        author: formData.author,
                        date: formData.date,
                        readCount: formData.readCount,
                        heroImage: formData.heroImage,
                        heroImageAlt: formData.heroImageAlt
                    }
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to save blog post');
            }
            
            console.log(`Blog post saved: ${result.path}`);
            
            // Update file manager
            await this.loadFilesList();
            
            // Show success message
            this.showFileInstructions(filename, result.path);
            
        } catch (error) {
            console.error('Error saving blog post to backend:', error);
            throw error;
        }
    }

    showFileInstructions(filename, filePath) {
        const instructions = `
            <div class="file-instructions">
                <h3>✅ Blog post opgeslagen!</h3>
                <p><strong>Bestand:</strong> <code>${filePath || `content/${filename}`}</code></p>
                <p><strong>Status:</strong> Direct opgeslagen in content map via backend</p>
                <p><strong>Voor live deployment:</strong></p>
                <ol>
                    <li>Upload de <code>content/</code> map naar je server</li>
                    <li>Update de blog-overview.html met de nieuwe post</li>
                    <li>Test de nieuwe blog post</li>
                </ol>
                <p><strong>Lokale test:</strong></p>
                <p>Open <code>content/${filename}</code> in je browser om te testen.</p>
            </div>
        `;
        
        // Add instructions to the success message
        const successDiv = document.querySelector('.success-message');
        if (successDiv) {
            successDiv.innerHTML += instructions;
        }
    }

    // updateBlogOverview is now handled by the backend server

    showPreview() {
        const data = this.getFormData();
        
        if (!data.title) {
            this.showError('Vul tenminste een titel in voor de preview.');
            return;
        }
        
        if (!data.content || (data.content.trim() === '' || data.content.trim() === '<p></p>')) {
            this.showError('Vul content in voor de preview.');
            return;
        }

        const previewContent = `
            <article class="blog-post">
                <header class="post-header">
                    <h1 class="post-title">${data.title}</h1>
                </header>
                <div class="post-content">
                    <p class="post-intro">${data.description || ''}</p>
                    <div class="post-meta">
                        <div class="author-info">
                            <div class="author-avatar">
                                <img src="../${this.getAuthorAvatar(data.author || 'Wouter Naber')}" alt="Auteur" class="avatar-img" loading="lazy">
                            </div>
                            <div class="author-details">
                                <span class="author-name">${data.author || 'Wouter Naber'}</span>
                                <span class="post-date">${new Date(data.date).toLocaleDateString('nl-NL')}, 06:45</span>
                                <span class="read-count">${data.readCount || '0'} x gelezen</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <img src="/${data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'}" 
                             alt="${data.heroAlt || this.generateAltTextFromTitle(data.title)}" 
                             class="hero-img"
                             srcset="../${data.heroImageMobile || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'} 750w,
                                     /${data.heroImageDesktop || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'} 1200w,
                                     ../${data.heroImage2x || data.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg'} 2400w"
                             sizes="(max-width: 768px) 750px, 1200px"
                             loading="eager">
                    </div>
                    ${data.content}
                </div>
            </article>
        `;

        document.getElementById('preview-content').innerHTML = previewContent;
        document.getElementById('preview-modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('preview-modal').style.display = 'none';
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';

        // Insert at top of form
        const form = document.getElementById('blog-form');
        form.insertBefore(messageDiv, form.firstChild);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    resetForm() {
        document.getElementById('blog-form').reset();
        
        // Reset HTML textarea
        const contentElement = document.getElementById('content');
        if (contentElement) {
            contentElement.value = '';
        }
        
        // Reset image upload
        this.removeUploadedImage();
        
        // Reset alt text
        document.getElementById('post-hero-alt').value = '';
        
        // Reset all counters
        this.updateCounter('ad-description-counter', '', 90);
        this.updateCounter('ad-description-2-counter', '', 90);
        this.updateCounter('headline-1-counter', '', 30);
        this.updateCounter('headline-2-counter', '', 30);
        this.updateCounter('headline-3-counter', '', 30);
        
        this.setDefaultDate();
    }
}

// Initialize CMS when DOM is loaded
let cms;
document.addEventListener('DOMContentLoaded', () => {
    cms = new BlogCMS();
});

// FAQ toggle function for preview
function toggleFAQ(element) {
    const faqItem = element;
    const isActive = faqItem.classList.contains('active');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current item
    if (!isActive) {
        faqItem.classList.add('active');
    }
}
