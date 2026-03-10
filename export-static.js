const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const config = {
    outputDir: 'static-export',
    contentDir: 'content',
    imagesDir: 'images',
    uploadsDir: 'uploads'
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
}

// Copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Optimize image
async function optimizeImage(inputPath, outputPath, options = {}) {
    const {
        width = 1200,
        height = 500,
        quality = 85
    } = options;

    try {
        await sharp(inputPath)
            .resize(width, height, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality })
            .toFile(outputPath);
        
        console.log(`✅ Optimized: ${path.basename(outputPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Error optimizing ${inputPath}:`, error.message);
        return false;
    }
}

// Generate responsive images for hero images
async function generateResponsiveImages(inputPath, baseName) {
    const sizes = [
        { width: 750, height: 500, suffix: '-mobile' },
        { width: 1200, height: 500, suffix: '-desktop' },
        { width: 2400, height: 1000, suffix: '-2x' }
    ];

    const optimizedImages = [];

    for (const size of sizes) {
        const outputFilename = `${baseName}${size.suffix}.jpg`;
        const outputPath = path.join(config.outputDir, 'images', 'heroes', outputFilename);
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const success = await optimizeImage(inputPath, outputPath, {
            width: size.width,
            height: size.height,
            quality: 85
        });

        if (success) {
            optimizedImages.push({
                url: `/images/heroes/${outputFilename}`,
                width: size.width,
                suffix: size.suffix
            });
        }
    }

    return optimizedImages;
}

// Prepare smaller images for blog overview cards
async function prepareOverviewImages(inputPath, baseName) {
    const outputs = {};
    const outDir = path.join(config.outputDir, 'images', 'heroes');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // 600x300 thumbnail
    const thumbName = `${baseName}-thumb.jpg`;
    const thumbPath = path.join(outDir, thumbName);
    await optimizeImage(inputPath, thumbPath, { width: 600, height: 300, quality: 80 });
    outputs.thumb = `images/heroes/${thumbName}`;

    // 1200x500 desktop (for 2x or large cards)
    const desktopName = `${baseName}-desktop.jpg`;
    const desktopPath = path.join(outDir, desktopName);
    if (!fs.existsSync(desktopPath)) {
        await optimizeImage(inputPath, desktopPath, { width: 1200, height: 500, quality: 85 });
    }
    outputs.desktop = `images/heroes/${desktopName}`;

    return outputs;
}


// Optimize avatar images
async function optimizeAvatar(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(80, 80, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
        
        console.log(`✅ Avatar optimized: ${path.basename(outputPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Error optimizing avatar ${inputPath}:`, error.message);
        return false;
    }
}

// Optimize client images (reviews) to small square JPGs
async function optimizeClientImages() {
    try {
        const clientsDir = path.join(process.cwd(), config.imagesDir, 'clients');
        const outDir = path.join(process.cwd(), config.outputDir, config.imagesDir, 'clients');
        if (!fs.existsSync(clientsDir)) {
            console.log('ℹ️  No images/clients directory found, skipping client image optimization');
            return;
        }
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const files = fs.readdirSync(clientsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
        for (const file of files) {
            const input = path.join(clientsDir, file);
            const base = path.parse(file).name.replace(/\s+/g, ' ').trim();
            const safe = base; // preserve spaces as in source for current usage
            const output = path.join(outDir, `${safe}.jpg`);
            try {
                await sharp(input)
                    .resize(256, 256, { fit: 'cover', position: 'center' })
                    .jpeg({ quality: 80 })
                    .toFile(output);
                console.log(`✅ Optimized client: ${file} → ${path.basename(output)}`);
            } catch (e) {
                console.warn(`⚠️  Failed optimizing client image ${file}:`, e.message);
            }
        }
    } catch (e) {
        console.warn('⚠️  optimizeClientImages error:', e.message);
    }
}

// Generate blog post HTML
function generateBlogPostHTML(postData, responsiveImages = []) {
    const mobileImg = responsiveImages.find(img => img.suffix === '-mobile');
    const desktopImg = responsiveImages.find(img => img.suffix === '-desktop');
    const retinaImg = responsiveImages.find(img => img.suffix === '-2x');
    
    // Use root-relative paths so they work from /content/slug/
    const normalizePath = (p) => p.startsWith('/') ? p : `/${p}`;
    const heroImageSrc = desktopImg ? desktopImg.url : normalizePath(postData.heroImage);
    const heroImageSrcset = responsiveImages.length > 0 ? 
        `${(mobileImg?.url || normalizePath(postData.heroImage))} 750w, ${(desktopImg?.url || heroImageSrc)} 1200w, ${(retinaImg?.url || heroImageSrc)} 2400w` : 
        '';

    return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${postData.title} | PaperDigits</title>
    <meta name="description" content="${postData.description}">
    <link rel="canonical" href="https://pages.paperdigits.nl/${postData.slug}/">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${postData.title}">
    <meta property="og:description" content="${postData.description}">
    <meta property="og:image" content="https://pages.paperdigits.nl/${heroImageSrc}">
    <meta property="og:url" content="https://pages.paperdigits.nl/${postData.slug}/">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PaperDigits">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${postData.title}">
    <meta name="twitter:description" content="${postData.description}">
    <meta name="twitter:image" content="https://pages.paperdigits.nl/${heroImageSrc}">
    
    <link rel="stylesheet" href="styles.css?v=0">
</head>
<body>
    <header class="header">
        <div class="header__container">
            <a class="header__logo" href="https://paperdigits.nl/">
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
                <h1 class="post-title">${postData.title}</h1>
            </header>

            <div class="post-content">
                <p class="post-intro">
                    ${postData.description}
                </p>

                <div class="post-meta">
                    <div class="meta inner-column flex fl">
                        <div class="flex meta-item meta-author">
                            <img src="${postData.author === 'Lasse Botman' ? '/images/writers/Lasse Botman.png' : '/images/writers/Wouter Naber.jpg'}" alt="${postData.author}" class="avatar-img" loading="lazy">
                            <span class="author-name">${postData.author}</span>
                        </div>
                        <div class="flex fl meta-other">
                            <span class="meta-item">${postData.date}</span>
                            <span class="meta-item">${postData.readCount || 0} x gelezen</span>
                        </div>
                    </div>
                </div>

                <div class="hero-image">
                    <img src="${heroImageSrc}" 
                         alt="${postData.heroAlt || postData.title}" 
                         class="hero-img"
                         ${heroImageSrcset ? `srcset="${heroImageSrcset}" sizes="(max-width: 768px) 750px, 1200px"` : ''}
                         loading="eager">
                </div>

                ${postData.content}
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
                
                <div class="footer__contact">
                    <p class="small-body font-bold">Contactgegevens</p>
                    <div class="p small-body">
                        <p>Noorderstraat 1Q,<br>1823 CS Alkmaar</p>
                        <p><a href="tel:+31722340777">+31 (0)72 234 0777</a><br>
                        <a href="mailto:info@paperdigits.nl">info@paperdigits.nl</a></p>
                    </div>
                </div>
            </nav>
            
            <div class="footer__bottom">
                <div class="footer__bottom-left">
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
    </script>

    <!-- Sticky CTA Bar -->
    <style>
    #pd-sticky-bar{position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#f3f3f3;color:#03113a;padding:14px 20px;box-shadow:0 -3px 16px rgba(0,0,0,.12);border-top:1px solid #e0e0e0;display:flex;align-items:center;gap:16px;transform:translateY(100%);transition:transform .35s ease;}
    #pd-sticky-bar.is-visible{transform:translateY(0);}
    #pd-sticky-bar__title{margin:0;font-size:15px;font-weight:700;line-height:1.3;}
    #pd-sticky-bar__sub{margin:3px 0 0;font-size:13px;opacity:.7;line-height:1.4;}
    #pd-sticky-bar__text{flex:1;min-width:0;}
    #pd-sticky-bar__btn{flex-shrink:0;display:inline-flex;align-items:center;background:#508991;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:4px;white-space:nowrap;transition:background .2s;}
    #pd-sticky-bar__btn:hover{background:#3d6e75;}
    #pd-sticky-bar__close{flex-shrink:0;background:none;border:none;color:rgba(3,17,58,.4);font-size:24px;line-height:1;cursor:pointer;padding:4px 6px;margin-left:4px;}
    #pd-sticky-bar__close:hover{color:#fff;}
    @media(max-width:640px){#pd-sticky-bar{flex-wrap:wrap;padding:12px 16px;gap:10px;}#pd-sticky-bar__text{flex:1 1 100%;}#pd-sticky-bar__btn{flex:1;justify-content:center;font-size:13px;padding:10px 14px;}}
    </style>
    <div id="pd-sticky-bar" role="complementary" aria-label="Kennismaking inplannen">
        <div id="pd-sticky-bar__text">
            <p id="pd-sticky-bar__title">Plan een gratis kennismaking</p>
            <p id="pd-sticky-bar__sub">Samen kijken we of we je kunnen helpen.</p>
        </div>
        <a id="pd-sticky-bar__btn" href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0-0s4_3pHJ_zmmKz1rn6ZpvlpSPF0RLYlN_RVk1mfzwNFS9iD-YCsf_IUWOZfGc4fK6y3rm0XX?gv=true" target="_blank" rel="noopener noreferrer">Kies een moment &rarr;</a>
        <button id="pd-sticky-bar__close" aria-label="Sluiten">&times;</button>
    </div>
    <script>
    (function(){
        var KEY='pd_sticky_dismissed',DAYS=7;
        var bar=document.getElementById('pd-sticky-bar');
        if(!bar)return;
        try{var v=localStorage.getItem(KEY);if(v&&Date.now()<parseInt(v,10))return;}catch(e){}
        setTimeout(function(){
            bar.classList.add('is-visible');
            try{if(window.dataLayer)window.dataLayer.push({event:'sticky_cta_view'});}catch(e){}
        },5000);
        document.getElementById('pd-sticky-bar__close').addEventListener('click',function(){
            bar.classList.remove('is-visible');
            try{localStorage.setItem(KEY,Date.now()+DAYS*86400000);if(window.dataLayer)window.dataLayer.push({event:'sticky_cta_dismiss'});}catch(e){}
        });
        document.getElementById('pd-sticky-bar__btn').addEventListener('click',function(){
            try{if(window.dataLayer)window.dataLayer.push({event:'sticky_cta_click'});}catch(e){}
            try{if(typeof window.gtag==='function'&&window.GADS_SEND_TO_CTA)window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_CTA});}catch(e){}
        });
    })();
    </script>
    <script>
    (function(){
        document.addEventListener('click', function(e){
            var link = e.target && e.target.closest ? e.target.closest('a.cta-link') : null;
            if (!link) return;
            try { if(window.dataLayer) window.dataLayer.push({event:'post_cta_click'}); } catch(e){}
            try { if(typeof window.gtag==='function'&&window.GADS_SEND_TO_CTA) window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_CTA}); } catch(e){}
        }, true);
    })();
    </script>
</body>
</html>`;
}

// Generate index.html (blog overview)
function generateIndexHTML(posts) {
    return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data-gedreven Marketing Inzichten | PaperDigits</title>
    <meta name="description" content="Geen marketing fluff, wel concrete resultaten. Data-gedreven inzichten voor SEO en digital marketing die écht werken. Van kleine bedrijven tot enterprise.">
    <link rel="canonical" href="https://paperdigits.nl/blog/">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Blog Overzicht | Data-gedreven Marketing Inzichten | PaperDigits">
    <meta property="og:description" content="Geen marketing fluff, wel concrete resultaten. Data-gedreven inzichten voor SEO en digital marketing die écht werken. Van kleine bedrijven tot enterprise.">
    <meta property="og:image" content="https://paperdigits.nl/wp-content/uploads/2025/01/blog-overview-og.jpg">
    <meta property="og:url" content="https://paperdigits.nl/blog/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="PaperDigits">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Blog Overzicht | Data-gedreven Marketing Inzichten | PaperDigits">
    <meta name="twitter:description" content="Geen marketing fluff, wel concrete resultaten. Data-gedreven inzichten voor SEO en digital marketing die écht werken. Van kleine bedrijven tot enterprise.">
    <meta name="twitter:image" content="https://paperdigits.nl/wp-content/uploads/2025/01/blog-overview-og.jpg">
    
    <link rel="stylesheet" href="styles.css?v=0">
    
    <!-- Structured Data (Schema Markup) -->
    <script type="application/ld+json" id="schema-blog">
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "PaperDigits Blog",
      "description": "Digital Marketing inzichten voor ambitieuze bedrijven en marketeers",
      "url": "https://paperdigits.nl/blog/",
      "publisher": {
        "@type": "Organization",
        "name": "PaperDigits",
        "logo": {
          "@type": "ImageObject",
          "url": "https://paperdigits.nl/wp-content/uploads/2024/01/paperdigits-logo.png"
        }
      },
      "blogPost": []
    }
    </script>
    <script type="application/ld+json" id="schema-org">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "PaperDigits",
      "url": "https://paperdigits.nl/",
      "logo": "https://paperdigits.nl/wp-content/uploads/2024/01/paperdigits-logo.png"
    }
    </script>
    <script type="application/ld+json" id="schema-website">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "PaperDigits",
      "url": "https://paperdigits.nl/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://paperdigits.nl/?s={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
    <script src="posts.js?v=0"></script>
</head>
<body>
    <header class="header">
        <div class="header__container">
            <a class="header__logo" href="https://paperdigits.nl/">
                <img src="images/logo/PaperDigits_logo.png" alt="PaperDigits - SEO en Digital Marketing Agency" class="logo-image">
            </a>
            <button class="hamburger" aria-label="Toggle menu">
                <span class="hamburger__line"></span>
                <span class="hamburger__line"></span>
                <span class="hamburger__line"></span>
            </button>
            <nav class="header__nav">
                <ul class="nav__list">
                    <li class="nav__item">
                        <a href="https://paperdigits.nl/services/" class="nav__link">Services</a>
                    </li>
                    <li class="nav__item">
                        <a href="https://paperdigits.nl/technologie/" class="nav__link">Technologie</a>
                    </li>
                    <li class="nav__item">
                        <a href="https://paperdigits.nl/stories/" class="nav__link">Stories</a>
                    </li>
                    <li class="nav__item">
                        <a href="https://paperdigits.nl/vacatures/" class="nav__link">Vacatures</a>
                    </li>
                    <li class="nav__item">
                        <a href="https://paperdigits.nl/contact/" class="nav__link">Contact</a>
                    </li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main">
        <section class="blog-overview">
            <div class="blog-overview__container">
                <header class="blog-overview__header">
                    <h1 class="blog-overview__title">Blog Overzicht</h1>
                    <p class="blog-overview__subtitle">
                        Data-gedreven inzichten voor digital marketing.
                    </p>
                </header>

                <!-- Filter Section -->
                <div class="blog-filters">
                    <div class="filter-group">
                        <label for="category-filter" class="filter-label">Categorie</label>
                        <select id="category-filter" class="filter-select">
                            <option value="all">Alle categorieën</option>
                            <option value="SEO">SEO</option>
                            <option value="Content Marketing">Content Marketing</option>
                            <option value="Digital Marketing">Digital Marketing</option>
                            <option value="Social Media Marketing">Social Media Marketing</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="sort-filter" class="filter-label">Sorteren op</label>
                        <select id="sort-filter" class="filter-select">
                            <option value="newest">Nieuwste eerst</option>
                            <option value="oldest">Oudste eerst</option>
                            <option value="title">Titel A-Z</option>
                        </select>
                    </div>
                </div>

                <!-- Blog Posts Grid -->
                <div class="blog-posts-grid" id="blog-posts-grid">
                    <!-- Blog posts will be dynamically loaded here -->
                </div>

            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer__row">
            <nav class="footer__nav">
                <ul class="footer__list footer__list--main">
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/services/">
                                <span class="footer__text">Services</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/stories/">
                                <span class="footer__text">Stories</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/">
                                <span class="footer__text">Technologie</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/vacatures/">
                                <span class="footer__text">Vacatures</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item footer-heading">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/contact/">
                                <span class="footer__text">Contact</span>
                            </a>
                        </div>
                    </li>
                </ul>
                
                <ul class="footer__list footer__list--sub">
                    <li class="small-body font-bold">Services</li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/service/digital-advertising/">
                                <span class="footer__text">Advertising</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/service/marketplaces-consultancy/">
                                <span class="footer__text">Marketplaces Consultancy</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/service/aduti-en-strategie/">
                                <span class="footer__text">Audit & Strategie</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/service/data/">
                                <span class="footer__text">Data</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/service/social-advertising/">
                                <span class="footer__text">Social Advertising</span>
                            </a>
                        </div>
                    </li>
                </ul>
                
                <ul class="footer__list footer__list--sub">
                    <li class="small-body font-bold">Tech</li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/google-bigquery/">
                                <span class="footer__text">Google BigQuery</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/channable/">
                                <span class="footer__text">Channable</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/google-analytics-4-ga4/">
                                <span class="footer__text">Google Analytics 4 (GA4)</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/server-side-tagging/">
                                <span class="footer__text">Server Side Tagging</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/looker-studio/">
                                <span class="footer__text">Looker Studio</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/cookie-consent-mode-v2/">
                                <span class="footer__text">Cookie Consent</span>
                            </a>
                        </div>
                    </li>
                    <li class="footer__item small-body">
                        <div class="footer__text-container">
                            <a class="footer__link" href="https://paperdigits.nl/technologie/google-tag-manager/">
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
        // Blog posts data - loaded dynamically from the backend API
        let blogPosts = [];
        
        // Author mapping for avatars
        const authorMapping = {
            'Wouter Naber': 'images/writers/Wouter Naber.jpg',
            'Lasse Botman': 'images/writers/Lasse Botman.png'
        };
        
        function getAuthorAvatar(authorName) {
            return authorMapping[authorName] || authorMapping['Wouter Naber'];
        }

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

        // Function to truncate text to a specific number of words
        function truncateText(text, maxWords = 20) {
            if (!text) return '';
            
            const words = text.split(' ');
            if (words.length <= maxWords) {
                return text;
            }
            
            return words.slice(0, maxWords).join(' ') + '...';
        }

        // Function to create blog post card HTML
        function createBlogPostCard(post) {
            const truncatedDescription = truncateText(post.description, 20);
            const isTruncated = post.description && post.description.split(' ').length > 20;
            
            const imgSrc = post.heroImageThumb || post.heroImage;
            const imgSrcset = [
                post.heroImageThumb ? \`\${post.heroImageThumb} 600w\` : null,
                post.heroImageDesktop ? \`\${post.heroImageDesktop} 1200w\` : null
            ].filter(Boolean).join(', ');

            return \`
                <article class="blog-post-card" data-category="\${post.category}" data-date="\${post.date}">
                    <div class="blog-post-card__image">
                        <img src="\${imgSrc}" \${imgSrcset ? \`srcset="\${imgSrcset}" sizes="(max-width: 768px) 600px, 1200px"\` : ''} alt="\${post.heroAlt}" class="card-image" loading="lazy" decoding="async" width="600" height="300">
                    </div>
                    <div class="blog-post-card__content">
                        <div class="blog-post-card__meta">
                            <span class="post-category">\${post.category}</span>
                            <span class="post-date">\${formatDate(post.date)}</span>
                        </div>
                        <h2 class="blog-post-card__title">
                            <a href="\${post.id}/" class="card-title-link">
                                \${post.title}
                            </a>
                        </h2>
                        <div class="blog-post-card__excerpt">
                            <p class="excerpt-text">\${truncatedDescription}</p>
                            \${isTruncated ? \`<button class="read-more-btn" onclick="toggleExcerpt(this)">Lees meer</button>\` : ''}
                        </div>
                        <div class="blog-post-card__footer">
                            <div class="author-info">
                                <img src="\${post.authorAvatar}" alt="\${post.author}" class="author-avatar">
                                <span class="author-name">\${post.author}</span>
                            </div>
                            <div class="post-stats">
                                <span class="read-count">\${post.readCount}</span>
                            </div>
                        </div>
                    </div>
                </article>
            \`;
        }

        // Function to toggle excerpt between truncated and full text
        function toggleExcerpt(button) {
            const excerptDiv = button.closest('.blog-post-card__excerpt');
            const excerptText = excerptDiv.querySelector('.excerpt-text');
            const postCard = excerptDiv.closest('.blog-post-card');
            const href = postCard.querySelector('.card-title-link').href;
            const parts = href.split('/').filter(Boolean);
            const postId = parts[parts.length - 1];
            
            // Find the original post data to get full description
            const originalPost = blogPosts.find(post => post.id === postId);
            
            if (originalPost) {
                const isExpanded = button.textContent === 'Lees minder';
                
                if (isExpanded) {
                    excerptText.textContent = truncateText(originalPost.description, 20);
                    button.textContent = 'Lees meer';
                } else {
                    excerptText.textContent = originalPost.description;
                    button.textContent = 'Lees minder';
                }
            }
        }

        // Function to format date from YYYY-MM-DD to Dutch format
        function formatDate(dateString) {
            const date = new Date(dateString);
            const months = [
                'januari', 'februari', 'maart', 'april', 'mei', 'juni',
                'juli', 'augustus', 'september', 'oktober', 'november', 'december'
            ];
            return \`\${date.getDate()} \${months[date.getMonth()]} \${date.getFullYear()}\`;
        }

        // Function to load blog posts from the API
        async function loadBlogPostsFromAPI() {
            try {
                console.log('Fetching blog posts from API...');
                const response = await fetch('/api/blog-posts');
                if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }
                const savedFiles = await response.json();
                console.log('API response:', savedFiles);
                
                // Transform the API data to match our expected format
                blogPosts = savedFiles.map(file => {
                    const metadata = file.metadata || {};
                    const slug = file.filename.replace('.html', '');
                    
                    // Normalize hero image path
                    let heroImage = metadata.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg';
                    if (!heroImage.startsWith('/')) {
                        heroImage = '/' + heroImage;
                    }
                    
                    return {
                        id: slug,
                        title: metadata.title || 'Untitled',
                        description: metadata.description || '',
                        category: metadata.category || 'Uncategorized',
                        author: metadata.author || 'Wouter Naber',
                        date: metadata.date || new Date().toISOString().split('T')[0],
                        readCount: metadata.readCount || 0,
                        authorAvatar: getAuthorAvatar(metadata.author || 'Wouter Naber'),
                        heroImage: heroImage,
                        heroAlt: metadata.heroImageAlt || metadata.title || 'Blog post image',
                        slug: slug
                    };
                });
                
                console.log(\`✅ Loaded \${blogPosts.length} blog posts from API:\`, blogPosts);
                return blogPosts;
                
            } catch (error) {
                console.error('❌ Error loading blog posts from API:', error);
                // Fallback to empty array if API fails
                blogPosts = [];
                return [];
            }
        }

        // Function to load and display blog posts
        async function loadBlogPosts() {
            const blogGrid = document.getElementById('blog-posts-grid');
            
            // Show loading state
            blogGrid.innerHTML = '<div class="loading-state">Blog posts laden...</div>';
            
            try {
                // Load posts from API
                await loadBlogPostsFromAPI();
                
                // Clear existing content
                blogGrid.innerHTML = '';
                
                if (blogPosts.length === 0) {
                    blogGrid.innerHTML = \`
                        <div class="empty-state">
                            <h3>Geen blog posts gevonden</h3>
                            <p>Er zijn nog geen blog posts beschikbaar. Maak je eerste blog post via het CMS!</p>
                        </div>
                    \`;
                    return;
                }
                
                // Sort posts by date (newest first)
                const sortedPosts = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
                
                console.log('Displaying sorted posts:', sortedPosts);
                
                // Create and append blog post cards
                sortedPosts.forEach(post => {
                    const postCard = createBlogPostCard(post);
                    blogGrid.insertAdjacentHTML('beforeend', postCard);
                });
                
                console.log(\`✅ Successfully displayed \${sortedPosts.length} blog posts\`);
                
            } catch (error) {
                console.error('❌ Error in loadBlogPosts:', error);
                blogGrid.innerHTML = \`
                    <div class="error-state">
                        <h3>Fout bij laden van blog posts</h3>
                        <p>Er is een fout opgetreden bij het laden van de blog posts. Controleer of de server draait.</p>
                        <button onclick="loadBlogPosts()" class="retry-button">Opnieuw proberen</button>
                    </div>
                \`;
            }
        }

        // Blog filtering and sorting functionality
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        const blogGrid = document.getElementById('blog-posts-grid');

        function filterAndSortPosts() {
            const selectedCategory = categoryFilter.value;
            const selectedSort = sortFilter.value;
            const posts = Array.from(blogGrid.children);

            // Filter posts
            const filteredPosts = posts.filter(post => {
                if (selectedCategory === 'all') return true;
                return post.dataset.category === selectedCategory;
            });

            // Sort posts
            filteredPosts.sort((a, b) => {
                switch (selectedSort) {
                    case 'newest':
                        return new Date(b.dataset.date) - new Date(a.dataset.date);
                    case 'oldest':
                        return new Date(a.dataset.date) - new Date(b.dataset.date);
                    case 'title':
                        return a.querySelector('.card-title-link').textContent.localeCompare(b.querySelector('.card-title-link').textContent);
                    default:
                        return 0;
                }
            });

            // Clear grid and re-append sorted posts
            blogGrid.innerHTML = '';
            filteredPosts.forEach(post => blogGrid.appendChild(post));
        }

        // Function to update category filter options based on available posts
        function updateCategoryFilter() {
            const categories = [...new Set(blogPosts.map(post => post.category))];
            const categoryFilter = document.getElementById('category-filter');
            
            // Clear existing options except "Alle categorieën"
            categoryFilter.innerHTML = '<option value="all">Alle categorieën</option>';
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }

        // Function to update structured data
        function updateStructuredData() {
            const postsAsBlogPosting = blogPosts.map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.description,
                "url": \`https://paperdigits.nl/blog/\${post.id}/\`,
                "datePublished": post.date,
                "author": { "@type": "Person", "name": post.author }
            }));

            const itemList = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "itemListElement": blogPosts.map((post, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": \`https://paperdigits.nl/blog/\${post.id}/\`
                }))
            };

            const blogSchemaEl = document.getElementById('schema-blog');
            if (blogSchemaEl) {
                const data = JSON.parse(blogSchemaEl.textContent);
                data.blogPost = postsAsBlogPosting;
                blogSchemaEl.textContent = JSON.stringify(data, null, 2);
            }

            // Inject or update ItemList schema
            let itemListEl = document.getElementById('schema-itemlist');
            if (!itemListEl) {
                itemListEl = document.createElement('script');
                itemListEl.type = 'application/ld+json';
                itemListEl.id = 'schema-itemlist';
                document.head.appendChild(itemListEl);
            }
            itemListEl.textContent = JSON.stringify(itemList, null, 2);
        }

        // Override loadBlogPostsFromAPI to use posts.js data first
        const originalLoadBlogPostsFromAPI = window.loadBlogPostsFromAPI;
        window.loadBlogPostsFromAPI = async function(){
            try {
                if (Array.isArray(window.blogPosts) && window.blogPosts.length) {
                    blogPosts = window.blogPosts;
                    return blogPosts;
                }
                const res = await fetch('posts.json', { cache: 'no-store' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                blogPosts = Array.isArray(data) ? data : [];
                return blogPosts;
            } catch(e){
                if (typeof originalLoadBlogPostsFromAPI === 'function') {
                    return originalLoadBlogPostsFromAPI();
                }
                console.error('Fallback loader failed', e);
                blogPosts = [];
                return [];
            }
        };

        // Initialize the page
        document.addEventListener('DOMContentLoaded', async function() {
            await loadBlogPosts();
            updateCategoryFilter();
            updateStructuredData();
            
            // Add event listeners
            categoryFilter.addEventListener('change', filterAndSortPosts);
            sortFilter.addEventListener('change', filterAndSortPosts);
        });

    </script>

    <!-- Sticky CTA Bar -->
    <style>
    #pd-sticky-bar{position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#f3f3f3;color:#03113a;padding:14px 20px;box-shadow:0 -3px 16px rgba(0,0,0,.12);border-top:1px solid #e0e0e0;display:flex;align-items:center;gap:16px;transform:translateY(100%);transition:transform .35s ease;}
    #pd-sticky-bar.is-visible{transform:translateY(0);}
    #pd-sticky-bar__title{margin:0;font-size:15px;font-weight:700;line-height:1.3;}
    #pd-sticky-bar__sub{margin:3px 0 0;font-size:13px;opacity:.7;line-height:1.4;}
    #pd-sticky-bar__text{flex:1;min-width:0;}
    #pd-sticky-bar__btn{flex-shrink:0;display:inline-flex;align-items:center;background:#508991;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:4px;white-space:nowrap;transition:background .2s;}
    #pd-sticky-bar__btn:hover{background:#3d6e75;}
    #pd-sticky-bar__close{flex-shrink:0;background:none;border:none;color:rgba(3,17,58,.4);font-size:24px;line-height:1;cursor:pointer;padding:4px 6px;margin-left:4px;}
    #pd-sticky-bar__close:hover{color:#fff;}
    @media(max-width:640px){#pd-sticky-bar{flex-wrap:wrap;padding:12px 16px;gap:10px;}#pd-sticky-bar__text{flex:1 1 100%;}#pd-sticky-bar__btn{flex:1;justify-content:center;font-size:13px;padding:10px 14px;}}
    </style>
    <div id="pd-sticky-bar" role="complementary" aria-label="Kennismaking inplannen">
        <div id="pd-sticky-bar__text">
            <p id="pd-sticky-bar__title">Plan een gratis kennismaking</p>
            <p id="pd-sticky-bar__sub">Samen kijken we of we je kunnen helpen.</p>
        </div>
        <a id="pd-sticky-bar__btn" href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0-0s4_3pHJ_zmmKz1rn6ZpvlpSPF0RLYlN_RVk1mfzwNFS9iD-YCsf_IUWOZfGc4fK6y3rm0XX?gv=true" target="_blank" rel="noopener noreferrer">Kies een moment &rarr;</a>
        <button id="pd-sticky-bar__close" aria-label="Sluiten">&times;</button>
    </div>
    <script>
    (function(){
        var KEY='pd_sticky_dismissed',DAYS=7;
        var bar=document.getElementById('pd-sticky-bar');
        if(!bar)return;
        try{var v=localStorage.getItem(KEY);if(v&&Date.now()<parseInt(v,10))return;}catch(e){}
        setTimeout(function(){
            bar.classList.add('is-visible');
            try{if(window.dataLayer)window.dataLayer.push({event:'sticky_cta_view'});}catch(e){}
        },5000);
        document.getElementById('pd-sticky-bar__close').addEventListener('click',function(){
            bar.classList.remove('is-visible');
            try{localStorage.setItem(KEY,Date.now()+DAYS*86400000);if(window.dataLayer)window.dataLayer.push({event:'sticky_cta_dismiss'});}catch(e){}
        });
        document.getElementById('pd-sticky-bar__btn').addEventListener('click',function(){
            try{if(window.dataLayer)window.dataLayer.push({event:'sticky_cta_click'});}catch(e){}
            try{if(typeof window.gtag==='function'&&window.GADS_SEND_TO_CTA)window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_CTA});}catch(e){}
        });
    })();
    </script>
    <script>
    (function(){
        document.addEventListener('click', function(e){
            var link = e.target && e.target.closest ? e.target.closest('a.cta-link') : null;
            if (!link) return;
            try { if(window.dataLayer) window.dataLayer.push({event:'post_cta_click'}); } catch(e){}
            try { if(typeof window.gtag==='function'&&window.GADS_SEND_TO_CTA) window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_CTA}); } catch(e){}
        }, true);
    })();
    </script>
</body>
</html>`;
}

// Validation function to check if export is correct
async function validateExport() {
    // Prefer validating inside posts directory if present
    const postsDir = path.join(config.outputDir, 'posts');
    const contentDir = fs.existsSync(postsDir) ? postsDir : config.outputDir;
    let issues = [];
    let validated = 0;
    
    if (fs.existsSync(contentDir)) {
        const entries = fs.readdirSync(contentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (["images", "uploads", "logo", "content", "posts"].includes(entry.name)) continue;
                const indexFile = path.join(contentDir, entry.name, 'index.html');
                if (fs.existsSync(indexFile)) {
                    const content = fs.readFileSync(indexFile, 'utf8');
                    validated++;
                    
                    // Check for problematic relative paths
                    if (content.includes('href="../styles.css"')) {
                        issues.push(`${entry.name}/index.html: CSS still uses relative path`);
                    }
                    if (content.includes('src="../images/')) {
                        issues.push(`${entry.name}/index.html: Images still use relative paths`);
                    }
                    if (content.includes('src="../uploads/')) {
                        issues.push(`${entry.name}/index.html: Uploads still use relative paths`);
                    }
                    if (content.includes('srcset="../')) {
                        issues.push(`${entry.name}/index.html: Srcset still uses relative paths`);
                    }
                }
            }
        }
    }
    
    console.log(`📊 Validated ${validated} blog post files`);
    if (issues.length === 0) {
        console.log('✅ All paths are correctly root-relative!');
    } else {
        console.log('❌ Found issues:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        throw new Error('Export validation failed - some paths are still relative');
    }
}

// Main export function
async function exportStatic() {
    console.log('🚀 Starting static export...');
    
    try {
        // Copy static files
        console.log('📁 Copying static files...');
        copyDir('images', path.join(config.outputDir, 'images'));
        fs.copyFileSync('styles.css', path.join(config.outputDir, 'styles.css'));
        // Copy robots.txt to root if present
        try {
            if (fs.existsSync('robots.txt')) {
                fs.copyFileSync('robots.txt', path.join(config.outputDir, 'robots.txt'));
                console.log('🤖 Copied robots.txt');
            } else {
                console.log('ℹ️ No robots.txt found to copy');
            }
        } catch (e) {
            console.warn('⚠️  Failed to copy robots.txt:', e.message);
        }
        // Note: CMS files are not copied to static export as they're not needed for static hosting
        
        // Also copy uploads so existing /uploads/... links keep working
        if (fs.existsSync('uploads')) {
            console.log('📦 Copying uploads folder...');
            copyDir('uploads', path.join(config.outputDir, 'uploads'));
        } else {
            console.log('ℹ️ No uploads folder found to copy');
        }
        
        // Optimize avatars
        console.log('🔄 Optimizing avatars...');
        const avatars = [
            { input: 'images/writers/Wouter Naber.jpg', output: 'images/writers/Wouter Naber.jpg' },
            { input: 'images/writers/Lasse Botman.png', output: 'images/writers/Lasse Botman.png' }
        ];
        
        for (const avatar of avatars) {
            if (fs.existsSync(avatar.input)) {
                const avatarOutput = path.join(config.outputDir, avatar.output);
                await optimizeAvatar(avatar.input, avatarOutput);
            } else {
                console.warn(`⚠️  Avatar not found: ${avatar.input}`);
            }
        }

        // Optimize client images (reviews)
        console.log('🧑‍💼 Optimizing client images...');
        await optimizeClientImages();
        
        // Read existing blog posts metadata (for overview) - only include posts that exist in content/
        console.log('📖 Reading blog posts...');
        const posts = [];
        // Track latest metadata per slug to avoid stale duplicates
        const slugToPost = new Map();
        
        if (fs.existsSync('blog-metadata.json')) {
            const metadata = JSON.parse(fs.readFileSync('blog-metadata.json', 'utf8'));
            for (const post of metadata) {
                if (post.metadata) {
                    const slug = post.filename.replace('.html', '');
                    const ts = Date.parse(post.timestamp || 0) || 0;

                    // Check if the actual content file exists
                    const contentFile = path.join(config.contentDir, post.filename);
                    if (fs.existsSync(contentFile)) {
                        // Normalize hero path
                        let hero = post.metadata.heroImage || 'images/Hetportretbureau_LR__T1A1116.jpg';
                        if (hero.startsWith('/')) hero = hero.substring(1);
                        const basePost = {
                            id: slug,
                            title: post.metadata.title,
                            description: post.metadata.description,
                            adDescription: post.metadata.adDescription,
                            adDescription2: post.metadata.adDescription2,
                            headline1: post.metadata.headline1,
                            headline2: post.metadata.headline2,
                            headline3: post.metadata.headline3,
                            category: post.metadata.category,
                            author: post.metadata.author,
                            date: post.metadata.date,
                            readCount: post.metadata.readCount || 0,
                            authorAvatar: post.metadata.author === 'Lasse Botman' ? 'images/writers/Lasse Botman.png' : 'images/writers/Wouter Naber.jpg',
                            heroImage: hero,
                            heroImageAlt: post.metadata.heroImageAlt || post.metadata.title,
                            slug: slug,
                            _timestamp: ts
                        };
                        // Merge strategy: prefer latest timestamp; if equal, prefer uploads/* hero over default images/*
                        const existing = slugToPost.get(slug);
                        const isUploadsHero = typeof hero === 'string' && hero.startsWith('uploads/');
                        if (!existing || basePost._timestamp > (existing._timestamp || 0) || (basePost._timestamp === (existing._timestamp || 0) && isUploadsHero)) {
                            slugToPost.set(slug, basePost);
                            console.log(`✅ Including/updated post: ${post.filename}`);
                        } else {
                            console.log(`⚠️  Skipping older/less-specific duplicate post: ${post.filename}`);
                        }
                    } else {
                        console.log(`⚠️  Skipping deleted post: ${post.filename}`);
                    }
                }
            }
        }
        
        // Generate pretty URLs directly from source content into /posts and ensure no /content/ folder in export
        if (fs.existsSync(config.contentDir)) {
            // Remove any previous content export folder if it exists
            const exportedContentDir = path.join(config.outputDir, 'content');
            if (fs.existsSync(exportedContentDir)) {
                try { fs.rmSync(exportedContentDir, { recursive: true, force: true }); } catch (e) { console.warn('⚠️  Failed removing old content folder:', e.message); }
            }
            // Remove any previous root-level slug folders for a clean structure
            try {
                const rootEntries = fs.readdirSync(config.outputDir, { withFileTypes: true });
                for (const entry of rootEntries) {
                    if (entry.isDirectory() && !["images", "uploads"].includes(entry.name)) {
                        const maybeIndex = path.join(config.outputDir, entry.name, 'index.html');
                        if (fs.existsSync(maybeIndex)) {
                            fs.rmSync(path.join(config.outputDir, entry.name), { recursive: true, force: true });
                        }
                    }
                }
            } catch (e) { console.warn('⚠️  Cleanup of root-level slug folders failed:', e.message); }

            // Create directory-based URLs under /posts: /posts/slug/index.html
            console.log('🔗 Creating pretty URLs (/posts/slug/index.html)...');
            const entries = fs.readdirSync(config.contentDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.html')) {
                    const slug = entry.name.replace(/\.html$/, '');
                    const srcFile = path.join(config.contentDir, entry.name);
                    const destDir = path.join(config.outputDir, 'posts', slug);
                    const destFile = path.join(destDir, 'index.html');
                    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                    try {
                        fs.copyFileSync(srcFile, destFile);
                        
                        // Fix relative paths in the copied file
                        let content = fs.readFileSync(destFile, 'utf8');
                        let changed = false;
                        
                        // Fix CSS path
                        if (content.includes('href="../styles.css"')) {
                            content = content.replace('href="../styles.css"', 'href="/styles.css"');
                            changed = true;
                        }
                        
                        // Fix all relative paths (including double slash variants and multiline srcset)
                        const replacements = [
                            ['src="../images/logo/', 'src="/images/logo/'],
                            ['src="../images/writers/', 'src="/images/writers/'],
                            ['src="../images/', 'src="/images/'],  // Fix general images path
                            ['src="../uploads/', 'src="/uploads/'],
                            ['srcset="../uploads/', 'srcset="/uploads/'],
                            ['srcset="..//uploads/', 'srcset="/uploads/'],
                            ['srcset="../images/', 'srcset="/images/'],  // Fix general images in srcset
                            ['srcset="..//images/', 'srcset="/images/'],  // Fix double slash images in srcset
                            ['..//uploads/', '/uploads/'],  // Fix multiline srcset
                            ['../uploads/', '/uploads/'],   // Fix any remaining relative uploads
                            ['..//images/', '/images/'],    // Fix multiline images srcset
                            ['../images/', '/images/'],     // Fix any remaining relative images
                            ['src="../images/heroes/', 'src="/images/heroes/'],
                            ['srcset="../images/heroes/', 'srcset="/images/heroes/'],
                            ['srcset="..//images/heroes/', 'srcset="/images/heroes/'],
                            ['..//images/heroes/', '/images/heroes/'],  // Fix multiline srcset
                            ['../images/heroes/', '/images/heroes/']    // Fix any remaining relative heroes
                        ];
                        
                        for (const [oldPath, newPath] of replacements) {
                            if (content.includes(oldPath)) {
                                content = content.replaceAll(oldPath, newPath);
                                changed = true;
                            }
                        }

                        // Remove unresolved FAQ placeholder script blocks
                        try {
                            const faqPlaceholder = /\s*<!-- FAQ Schema -->\s*<script type="application\/ld\+json">\s*\{\{faq_structured_data\}\}\s*<\/script>/g;
                            if (faqPlaceholder.test(content)) {
                                content = content.replace(faqPlaceholder, '');
                                changed = true;
                            }
                        } catch (e) {
                            console.warn(`⚠️  FAQ placeholder cleanup failed for ${entry.name}:`, e.message);
                        }

                        // Ensure structural placement: move reviews/about sections inside the article wrapper
                        try {
                            const ensureSectionInsideArticle = (html, sectionClass) => {
                                const sectionRegex = new RegExp(`<section[^>]*class=\"[^\"]*${sectionClass}[^\"]*\"[\s\S]*?<\\/section>`, 'i');
                                const articleOpenIdx = html.indexOf('<article');
                                const articleCloseIdx = html.indexOf('</article>');
                                if (articleOpenIdx === -1 || articleCloseIdx === -1) {
                                    return html; // nothing to do if no article wrapper
                                }

                                // Find all occurrences of the section
                                const matches = [];
                                let m;
                                const globalRegex = new RegExp(sectionRegex, 'gi');
                                while ((m = globalRegex.exec(html)) !== null) {
                                    matches.push({ start: m.index, end: globalRegex.lastIndex, chunk: m[0] });
                                }

                                if (!matches.length) return html;

                                // Keep only the first occurrence; remove all others
                                const first = matches[0];
                                let cleaned = html.substring(0, first.start) + html.substring(first.end);

                                // Remove subsequent occurrences by searching again
                                let dup;
                                while ((dup = sectionRegex.exec(cleaned)) !== null) {
                                    cleaned = cleaned.slice(0, dup.index) + cleaned.slice(dup.index + dup[0].length);
                                    sectionRegex.lastIndex = 0;
                                }

                                // Recompute article close after removals
                                const newArticleClose = cleaned.indexOf('</article>');
                                if (newArticleClose === -1) return cleaned; // safety

                                // Determine where the original kept section was relative to </article>
                                const originalSectionAfterArticle = first.start > articleCloseIdx;

                                // If the section was outside the article, insert it just before </article>
                                if (originalSectionAfterArticle) {
                                    const insertion = first.chunk;
                                    cleaned = cleaned.slice(0, newArticleClose) + insertion + cleaned.slice(newArticleClose);
                                } else {
                                    // If it was already inside, put it back where it was by inserting at the nearest logical position.
                                    // We choose before </article> for consistency to avoid layout surprises.
                                    const insertion = first.chunk;
                                    cleaned = cleaned.slice(0, newArticleClose) + insertion + cleaned.slice(newArticleClose);
                                }

                                return cleaned;
                            };

                            const before = content;
                            content = ensureSectionInsideArticle(content, 'reviews-section');
                            content = ensureSectionInsideArticle(content, 'about-section');
                            if (content !== before) changed = true;
                        } catch (e) {
                            console.warn(`⚠️  Section relocation failed for ${entry.name}:`, e.message);
                        }

                        // Inject "Over ons" section after reviews on each post page if not already present
                        if (!content.includes('about-section')) {
                            const aboutHtml = `\n\n                <section class="about-section" aria-label="Over ons">\n                    <h2 class="about-title">Over ons</h2>\n                    <div class="about-content">\n                        <img src="/images/about/vincent-wouter.jpg" alt="Vincent en Wouter - PaperDigits" class="about-image" loading="lazy">\n                        <p>PaperDigits is ontstaan uit de levenslange vriendschap van Wouter en Vincent, met roots in Alkmaar en een gedeelde drive om marketing ‘beter’ te maken. We helpen merken groeien met scherpe analyses, slimme systemen en een partnership dat verder gaat dan cijfers.</p>\n                    </div>\n                </section>`;

                            const reviewsIdx = content.indexOf('reviews-section');
                            if (reviewsIdx !== -1) {
                                // Insert right after the closing </section> of the reviews block
                                const afterReviewsCloseIdx = content.indexOf('</section>', reviewsIdx);
                                if (afterReviewsCloseIdx !== -1) {
                                    content = content.slice(0, afterReviewsCloseIdx + '</section>'.length) + aboutHtml + content.slice(afterReviewsCloseIdx + '</section>'.length);
                                    changed = true;
                                }
                            }

                            // Fallback: insert before closing </article>
                            if (!content.includes('about-section')) {
                                const closeArticleIdx = content.indexOf('</article>');
                                if (closeArticleIdx !== -1) {
                                    content = content.slice(0, closeArticleIdx) + aboutHtml + '\n' + content.slice(closeArticleIdx);
                                    changed = true;
                                }
                            }
                        }

                        // Inject subtle CTA before the 2nd H2 in the main post content
                        try {
                            const ctaHtml = `\n                <div class="post-cta">\n                    <a class="cta-link" href="https://paperdigits.nl/contact/" target="_blank" rel="noopener">Contact opnemen</a>\n                </div>\n`;

                            // Locate post-content wrapper and split by H2s inside it only
                            const postContentStart = content.indexOf('<div class="post-content">');
                            const postContentEnd = content.indexOf('</div>', postContentStart);
                            if (postContentStart !== -1 && postContentEnd !== -1 && postContentEnd > postContentStart) {
                                const before = content.slice(0, postContentStart);
                                let inside = content.slice(postContentStart, postContentEnd);
                                const after = content.slice(postContentEnd);

                                // Remove any existing CTA inside post-content to avoid duplicates
                                const ctaBlockRegex = /\n?\s*<div class=\"post-cta\">[\s\S]*?<\/div>\n?/g;
                                if (ctaBlockRegex.test(inside)) {
                                    inside = inside.replace(ctaBlockRegex, '');
                                    changed = true;
                                }

                                // Count H2 occurrences and insert before the second one
                                let h2Count = 0;
                                const h2Regex = /<h2\b[^>]*>/g;
                                let match; let insertIdx = -1;
                                while ((match = h2Regex.exec(inside)) !== null) {
                                    h2Count++;
                                    if (h2Count === 2) {
                                        insertIdx = match.index;
                                        break;
                                    }
                                }

                                if (insertIdx !== -1) {
                                    const newInside = inside.slice(0, insertIdx) + ctaHtml + inside.slice(insertIdx);
                                    content = before + newInside + after;
                                    changed = true;
                                } else {
                                    // Fallback: if fewer than 2 H2s, put CTA after intro paragraph inside post-content
                                    const introClose = inside.indexOf('</p>');
                                    if (introClose !== -1) {
                                        const newInside = inside.slice(0, introClose + 4) + ctaHtml + inside.slice(introClose + 4);
                                        content = before + newInside + after;
                                        changed = true;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(`⚠️  CTA injection failed for ${entry.name}:`, e.message);
                        }
                        
                        if (changed) {
                            fs.writeFileSync(destFile, content, 'utf8');
                        }
                    } catch (e) {
                        console.warn(`⚠️  Failed to create pretty URL for ${entry.name}:`, e.message);
                    }
                }
            }
        }

        // Post-process ALL exported posts to enforce structure even if source file missing in content/
        try {
            const postsRoot = path.join(config.outputDir, 'posts');
            if (fs.existsSync(postsRoot)) {
                const slugs = fs.readdirSync(postsRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
                const reloc = (html, sectionClass) => {
                    const sectionRegex = new RegExp(`<section[^>]*class=\"[^\"]*${sectionClass}[^\"]*\"[\s\S]*?<\\/section>`, 'i');
                    const articleOpenIdx = html.indexOf('<article');
                    const articleCloseIdx = html.indexOf('</article>');
                    if (articleOpenIdx === -1 || articleCloseIdx === -1) return html;
                    const matches = [];
                    let m;
                    const globalRegex = new RegExp(sectionRegex, 'gi');
                    while ((m = globalRegex.exec(html)) !== null) {
                        matches.push({ start: m.index, end: globalRegex.lastIndex, chunk: m[0] });
                    }
                    if (!matches.length) return html;
                    const first = matches[0];
                    let cleaned = html.substring(0, first.start) + html.substring(first.end);
                    let dup;
                    while ((dup = sectionRegex.exec(cleaned)) !== null) {
                        cleaned = cleaned.slice(0, dup.index) + cleaned.slice(dup.index + dup[0].length);
                        sectionRegex.lastIndex = 0;
                    }
                    const newArticleClose = cleaned.indexOf('</article>');
                    if (newArticleClose === -1) return cleaned;
                    const insertion = first.chunk;
                    cleaned = cleaned.slice(0, newArticleClose) + insertion + cleaned.slice(newArticleClose);
                    return cleaned;
                };

                for (const slug of slugs) {
                    const f = path.join(postsRoot, slug, 'index.html');
                    if (!fs.existsSync(f)) continue;
                    try {
                        let html = fs.readFileSync(f, 'utf8');
                        const before = html;
                        html = reloc(html, 'reviews-section');
                        html = reloc(html, 'about-section');
                        if (html !== before) {
                            fs.writeFileSync(f, html, 'utf8');
                            console.log(`🔧 Fixed section placement in: ${slug}/index.html`);
                        }
                    } catch (e) {
                        console.warn(`⚠️  Post-process failed for ${slug}:`, e.message);
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️  Export-wide post-processing failed:', e.message);
        }
        
        // Materialize posts array from latest-per-slug map
        if (slugToPost.size > 0) {
            posts.length = 0;
            for (const p of slugToPost.values()) {
                // Clean internal fields
                delete p._timestamp;
                posts.push(p);
            }
        }

        // Generate optimized hero images for overview cards (website only)
        console.log('🖼️  Generating optimized hero images for website...');
        // Collect a manifest of hero variants per post for recognition/debugging
        const heroesManifest = {};

        for (let i = 0; i < posts.length; i++) {
            const p = posts[i];
            try {
                // Try to resolve the uploaded file robustly (handle leading '/')
                const heroRel = p.heroImage.startsWith('/') ? p.heroImage.slice(1) : p.heroImage;
                let heroPath = path.join(process.cwd(), heroRel);
                console.log(`🔍 Looking for hero image for ${p.slug}: ${heroRel}`);

                if (!fs.existsSync(heroPath)) {
                    // If we were given a responsive variant, try to resolve the original base file name next to uploads
                    const cleanFilename = heroRel
                        .replace(/-desktop\.jpg$/i, '.jpg')
                        .replace(/-mobile\.jpg$/i, '.jpg')
                        .replace(/-2x\.jpg$/i, '.jpg');
                    const uploadsPath = path.join(process.cwd(), 'uploads', path.basename(cleanFilename));
                    console.log(`🔍 Trying cleaned uploads path: ${uploadsPath}`);

                    if (fs.existsSync(uploadsPath)) {
                        heroPath = uploadsPath;
                        console.log(`✅ Using cleaned original upload for ${p.slug}: ${path.basename(uploadsPath)}`);
                    }
                } else {
                    console.log(`✅ Using metadata path for ${p.slug}: ${heroRel}`);
                }
                
                if (fs.existsSync(heroPath)) {
                    console.log(`🎯 Using file for ${p.slug}: ${heroPath}`);
                    const baseName = p.slug;
                    const prepared = await prepareOverviewImages(heroPath, baseName);
                    if (prepared) {
                        p.heroImageThumb = prepared.thumb;
                        p.heroImageDesktop = prepared.desktop;
                    }

                    // Copy matching 1200x1200 square image from uploads to heroes (for RSS feed)
                    try {
                        const uploadsDir = path.join(process.cwd(), 'uploads');
                        const heroesDir = path.join(config.outputDir, 'images', 'heroes');
                        if (fs.existsSync(uploadsDir)) {
                            const files = fs.readdirSync(uploadsDir);

                            // Determine the base of the uploaded hero filename (without responsive suffixes)
                            // Example: header-1757516146705-683340379-desktop.jpg -> header-1757516146705-683340379
                            const heroFilename = path.basename(p.heroImage || '');
                            const baseStem = heroFilename
                                ? heroFilename
                                    .replace(/-desktop\.[^.]+$/, '')
                                    .replace(/-mobile\.[^.]+$/, '')
                                    .replace(/-2x\.[^.]+$/, '')
                                    .replace(/\.jpg$/i, '')
                                    .replace(/\.jpeg$/i, '')
                                : '';

                            // Prefer an exact matching square file for this post
                            let squareFile = baseStem
                                ? files.find(file => file.startsWith(baseStem) && file.endsWith('-square1200.jpg'))
                                : undefined;

                            // If not found via stem, try to infer from the heroPath original upload name
                            if (!squareFile) {
                                const originalStem = path.basename(heroPath, path.extname(heroPath));
                                if (originalStem) {
                                    squareFile = files.find(file => file.startsWith(originalStem) && file.endsWith('-square1200.jpg'));
                                }
                            }

                            if (squareFile) {
                                const sourcePath = path.join(uploadsDir, squareFile);
                                const destPath = path.join(heroesDir, `${baseName}-square1200.jpg`);
                                fs.copyFileSync(sourcePath, destPath);
                                
                                p.heroImageSquare1200 = `images/heroes/${baseName}-square1200.jpg`;
                                console.log(`✅ Copied matching square for ${p.slug}: ${squareFile} → ${baseName}-square1200.jpg`);
                            } else {
                                console.log(`ℹ️ No matching square1200 found for ${p.slug}. Skipping RSS image for this post.`);
                            }

                            // Also copy other uploaded variants belonging to this hero (e.g., -mobile, -desktop, -2x, other sizes)
                            const variantPatterns = [
                                ['-mobile.jpg', `${baseName}-mobile.jpg`],
                                ['-desktop.jpg', `${baseName}-desktop.jpg`],
                                ['-2x.jpg', `${baseName}-2x.jpg`],
                                ['-1200x1200.png', `${baseName}-1200x1200.png`],
                                ['-960x1200.png', `${baseName}-960x1200.png`],
                                ['-1200x628.png', `${baseName}-1200x628.png`],
                                ['-1080x1920.png', `${baseName}-1080x1920.png`],
                                ['-1440x1800.png', `${baseName}-1440x1800.png`],
                                ['-2x.jpg', `${baseName}-2x.jpg`]
                            ];

                            const copiedVariants = {};

                            // Build a set of candidate stems to match against
                            const candidateStems = new Set([baseStem]);
                            const heroBaseFromPath = path.basename(heroPath, path.extname(heroPath));
                            if (heroBaseFromPath) candidateStems.add(heroBaseFromPath);

                            for (const file of files) {
                                for (const stem of candidateStems) {
                                    if (stem && file.startsWith(stem)) {
                                        const ext = path.extname(file).toLowerCase();
                                        const isVariant = /-(mobile|desktop|2x|square1200|\d+x\d+)\.(jpg|jpeg|png)$/i.test(file);
                                        if (isVariant) {
                                            const source = path.join(uploadsDir, file);
                                            // Keep the original variant suffix naming but rename prefix to slug for recognition
                                            const suffix = file.substring(stem.length); // includes leading '-...ext'
                                            const dest = path.join(heroesDir, `${baseName}${suffix}`);
                                            try {
                                                fs.copyFileSync(source, dest);
                                                const rel = `images/heroes/${baseName}${suffix}`;
                                                copiedVariants[suffix.replace(/^-/,'').replace(ext,'')] = rel;
                                            } catch(e) {
                                                console.warn(`⚠️  Failed copying variant ${file} → ${baseName}${suffix}:`, e.message);
                                            }
                                        }
                                    }
                                }
                            }

                            // Attach discovered/copies to post object for recognition
                            if (Object.keys(copiedVariants).length) {
                                p.heroVariants = copiedVariants;
                            }

                            // Accumulate in manifest
                            heroesManifest[p.slug] = {
                                slug: p.slug,
                                sourceHero: p.heroImage,
                                prepared: {
                                    thumb: p.heroImageThumb || null,
                                    desktop: p.heroImageDesktop || null,
                                    square1200: p.heroImageSquare1200 || null
                                },
                                variants: copiedVariants
                            };
                        }
                    } catch (e) {
                        console.warn(`⚠️  Failed copying square for ${p.slug}:`, e.message);
                    }
                } else {
                    console.warn(`⚠️  Hero source not found for ${p.slug}: ${p.heroImage}. Skipping image prep and RSS square.`);
                }
            } catch (e) {
                console.warn(`⚠️  Failed preparing images for ${p.slug}:`, e.message);
            }
        }

        // Write heroes manifest for external recognition
        try {
            const heroesDir = path.join(config.outputDir, 'images', 'heroes');
            if (!fs.existsSync(heroesDir)) {
                fs.mkdirSync(heroesDir, { recursive: true });
            }
            const manifestPath = path.join(heroesDir, 'manifest.json');
            fs.writeFileSync(manifestPath, JSON.stringify(heroesManifest, null, 2));
            console.log(`🧾 Wrote heroes manifest with ${Object.keys(heroesManifest).length} entries`);
        } catch(e) {
            console.warn('⚠️  Failed writing heroes manifest:', e.message);
        }

        // Generate index.html (blog overview)
        console.log('📄 Generating index.html...');
        const indexHTML = generateIndexHTML(posts);
        const indexPath = path.join(config.outputDir, 'index.html');
        fs.writeFileSync(indexPath, indexHTML, 'utf8');
        
        // Update cache busting parameters in index.html and all post pages
        console.log('🔄 Updating cache busting parameters...');
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Generate new cache version based on current date and time
        const now = new Date();
        const cacheVersion = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Update CSS cache busting
        indexContent = indexContent.replace(/styles\.css\?v=[\d-]+/g, `styles.css?v=${cacheVersion}`);
        
        // Update posts.js cache busting
        indexContent = indexContent.replace(/posts\.js\?v=[\d-]+/g, `posts.js?v=${cacheVersion}`);
        
        // Update posts.json cache busting
        indexContent = indexContent.replace(/posts\.json\?v=[\d-]+/g, `posts.json?v=${cacheVersion}`);
        
        fs.writeFileSync(indexPath, indexContent, 'utf8');
        console.log(`✅ Updated cache busting on index to v=${cacheVersion}`);

        // Also update styles.css reference on all exported post pages for cache busting
        try {
            const postsRoot = path.join(config.outputDir, 'posts');
            if (fs.existsSync(postsRoot)) {
                const slugs = fs.readdirSync(postsRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
                for (const slug of slugs) {
                    const f = path.join(postsRoot, slug, 'index.html');
                    if (!fs.existsSync(f)) continue;
                    let html = fs.readFileSync(f, 'utf8');
                    const before = html;
                    // Normalize any styles.css link to include the cache param
                    html = html.replace(/href=["']\/?styles\.css["']/g, `href="/styles.css?v=${cacheVersion}"`);
                    html = html.replace(/href=["']\/?styles\.css\?v=[\d-]+["']/g, `href="/styles.css?v=${cacheVersion}"`);
                    if (html !== before) {
                        fs.writeFileSync(f, html, 'utf8');
                    }
                }
                console.log('✅ Updated CSS cache busting on all post pages');
            }
        } catch (e) {
            console.warn('⚠️  Failed updating cache busting on post pages:', e.message);
        }
        
        // Generate data files for the index.html
        console.log('📊 Generating data files...');
        const postsJsonPath = path.join(config.outputDir, 'posts.json');
        const postsJsPath = path.join(config.outputDir, 'posts.js');
        fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2));
        fs.writeFileSync(postsJsPath, `window.blogPosts = ${JSON.stringify(posts, null, 2)};`);
        
        // Generate RSS feed (feed.xml)
        console.log('📰 Generating RSS feed...');
        const siteUrl = 'https://pages.paperdigits.nl';
        const rssEscape = (str) => String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        
        // Sort posts by date (newest first)
        const sortedPosts = [...posts].sort((a, b) => {
            const da = new Date(a.date || 0).getTime();
            const db = new Date(b.date || 0).getTime();
            return db - da;
        });
        
        const lastBuildDate = new Date().toUTCString();
        const rssItems = sortedPosts.map(post => {
            const postUrl = `${siteUrl}/${post.id}/`;
            // Use current date for pubDate to avoid future dates
            const pubDate = new Date().toUTCString();
            const title = rssEscape(post.title || post.id);
            const descriptionCdata = `<![CDATA[${(post.description || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
            const adDescriptionCdata = post.adDescription ? `<![CDATA[${post.adDescription.replace(/]]>/g, ']]]]><![CDATA[>')}]]>` : '';
            const adDescription2Cdata = post.adDescription2 ? `<![CDATA[${post.adDescription2.replace(/]]>/g, ']]]]><![CDATA[>')}]]>` : '';
            const headline1Cdata = post.headline1 ? `<![CDATA[${post.headline1.replace(/]]>/g, ']]]]><![CDATA[>')}]]>` : '';
            const headline2Cdata = post.headline2 ? `<![CDATA[${post.headline2.replace(/]]>/g, ']]]]><![CDATA[>')}]]>` : '';
            const headline3Cdata = post.headline3 ? `<![CDATA[${post.headline3.replace(/]]>/g, ']]]]><![CDATA[>')}]]>` : '';
            const category = post.category ? `<category>${rssEscape(post.category)}</category>` : '';
            
            // Build specific image format URLs
            const heroBase = post.heroImageSquare1200 ? post.heroImageSquare1200.replace('-square1200.jpg', '') : '';
            const image1200x1200 = heroBase ? `${siteUrl}/images/heroes/${post.id}-1200x1200.png` : '';
            const image1200x628 = heroBase ? `${siteUrl}/images/heroes/${post.id}-1200x628.png` : '';
            const image960x1200 = heroBase ? `${siteUrl}/images/heroes/${post.id}-960x1200.png` : '';
            
            // Add hero image; prefer existing 1200x1200 square from CMS if available
            let imageTag = '';
            const mediaTags = [];
            const pushMedia = (url, typeHint) => {
                if (!url) return;
                const abs = url.startsWith('http') ? url : `${siteUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
                const lower = abs.toLowerCase();
                const type = typeHint || (lower.endsWith('.png') ? 'image/png' : 'image/jpeg');
                mediaTags.push(`      <media:content url="${rssEscape(abs)}" type="${type}" medium="image" />`);
            };
            const pushVariantMap = (variantsObj) => {
                if (!variantsObj) return;
                for (const key of Object.keys(variantsObj)) {
                    pushMedia(variantsObj[key]);
                }
            };
            if (post.heroImageSquare1200) {
                // Use the original square image from CMS uploads
                const imageUrl = post.heroImageSquare1200.startsWith('http') ? post.heroImageSquare1200 : `${siteUrl}/${post.heroImageSquare1200}`;
                // Use a reasonable file size estimate for 1200x1200 JPEG (around 300KB)
                const estimatedSize = 300000;
                imageTag = `      <enclosure url="${rssEscape(imageUrl)}" type="image/jpeg" length="${estimatedSize}" />\n`;
                console.log(`📰 RSS using square image: ${post.heroImageSquare1200}`);
            } else {
                console.log(`⚠️  No square image available for RSS: ${post.slug}`);
            }

            // Add Media RSS entries for all discovered variants
            pushMedia(post.heroImageThumb);
            pushMedia(post.heroImageDesktop);
            pushMedia(post.heroImageSquare1200);
            pushMedia(post.heroImage);
            if (post.heroVariants) {
                pushVariantMap(post.heroVariants);
            }
            
            return (
                `    <item>\n` +
                `      <title>${title}</title>\n` +
                `      <link>${postUrl}</link>\n` +
                `      <guid isPermaLink="true">${postUrl}</guid>\n` +
                `      <pd:id>${rssEscape(post.id)}</pd:id>\n` +
                `      <pubDate>${pubDate}</pubDate>\n` +
                (post.author ? `      <author>${rssEscape(post.author)}</author>\n` : '') +
                (category ? `      ${category}\n` : '') +
                `      <description>${descriptionCdata}</description>\n` +
                (adDescriptionCdata ? `      <pd:adDescription>${adDescriptionCdata}</pd:adDescription>\n` : '') +
                (adDescription2Cdata ? `      <pd:adDescription2>${adDescription2Cdata}</pd:adDescription2>\n` : '') +
                (headline1Cdata ? `      <pd:headline1>${headline1Cdata}</pd:headline1>\n` : '') +
                (headline2Cdata ? `      <pd:headline2>${headline2Cdata}</pd:headline2>\n` : '') +
                (headline3Cdata ? `      <pd:headline3>${headline3Cdata}</pd:headline3>\n` : '') +
                (image1200x1200 ? `      <pd:image1200x1200>${rssEscape(image1200x1200)}</pd:image1200x1200>\n` : '') +
                (image1200x628 ? `      <pd:image1200x628>${rssEscape(image1200x628)}</pd:image1200x628>\n` : '') +
                (image960x1200 ? `      <pd:image960x1200>${rssEscape(image960x1200)}</pd:image960x1200>\n` : '') +
                imageTag +
                (mediaTags.length ? mediaTags.join('\n') + '\n' : '') +
                `    </item>`
            );
        }).join('\n');
        
        const rss = `<?xml version="1.0" encoding="UTF-8"?>\n` +
`<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:pd="https://pages.paperdigits.nl/ns/pd">\n` +
`  <channel>\n` +
`    <title>PaperDigits Blog</title>\n` +
`    <link>${siteUrl}</link>\n` +
`    <description>Updates van het PaperDigits blog</description>\n` +
`    <language>nl-nl</language>\n` +
`    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n` +
`${rssItems}\n` +
`  </channel>\n` +
`</rss>\n`;
        fs.writeFileSync(path.join(config.outputDir, 'feed.xml'), rss);

        // Ensure no CSV feed is present anymore (cleanup old exports)
        try {
            const csvPath = path.join(config.outputDir, 'feed.csv');
            if (fs.existsSync(csvPath)) {
                fs.unlinkSync(csvPath);
                console.log('🧹 Removed legacy feed.csv');
            }
        } catch (e) {
            console.warn('⚠️  Could not remove legacy feed.csv:', e.message);
        }
        
        // Generate sitemap.xml
        console.log('🗺️  Generating sitemap.xml...');
        const toIsoDate = (d) => {
            try {
                const dt = d ? new Date(d) : new Date();
                return dt.toISOString();
            } catch (_) { return new Date().toISOString(); }
        };
        const escapeXml = (str) => String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        const makeAbs = (p) => {
            if (!p) return '';
            if (p.startsWith('http')) return p;
            const pathClean = p.startsWith('/') ? p : '/' + p;
            return siteUrl + pathClean;
        };
        const urlEntries = [];
        // Homepage
        urlEntries.push(
            '  <url>\n' +
            `    <loc>${siteUrl}/</loc>\n` +
            `    <lastmod>${toIsoDate()}</lastmod>\n` +
            '    <changefreq>weekly</changefreq>\n' +
            '    <priority>1.0</priority>\n' +
            '  </url>'
        );
        // Posts
        for (const post of sortedPosts) {
            const postLoc = `${siteUrl}/${post.id}/`;
            const lastmod = toIsoDate(post.date);
            // Choose best image available
            const imgRel = post.heroImageDesktop || post.heroImageThumb || post.heroImageSquare1200 || post.heroImage;
            const imgLoc = imgRel ? makeAbs(imgRel) : '';
            const pieces = [
                '  <url>',
                `    <loc>${escapeXml(postLoc)}</loc>`,
                `    <lastmod>${lastmod}</lastmod>`,
                '    <changefreq>monthly</changefreq>',
                '    <priority>0.8</priority>'
            ];
            if (imgLoc) {
                pieces.push('    <image:image>');
                pieces.push(`      <image:loc>${escapeXml(imgLoc)}</image:loc>`);
                if (post.title) pieces.push(`      <image:title>${escapeXml(post.title)}</image:title>`);
                pieces.push('    </image:image>');
            }
            pieces.push('  </url>');
            urlEntries.push(pieces.join('\n'));
        }
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
urlEntries.join('\n') +
`\n</urlset>\n`;
        fs.writeFileSync(path.join(config.outputDir, 'sitemap.xml'), sitemap);
        
        // Validate export - check if paths are correct
        console.log('🔍 Validating export...');
        await validateExport();
        
        console.log('✅ Static export completed!');
        console.log(`📁 Output directory: ${config.outputDir}`);
        console.log(`🌐 Ready for upload to pages.paperdigits.nl`);
        
    } catch (error) {
        console.error('❌ Export failed:', error);
    }
}

// Run export
exportStatic();
