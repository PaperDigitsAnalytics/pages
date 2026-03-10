const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imageMap = {
  'bigquery-koppelen-aan-ga4':                                        { img: 'businessman-tablet-financial-data-charts.jpg',   readCount: 412, ts: 1741518000000, id: 412847301 },
  'enhanced-conversions-via-gtm':                                     { img: 'google-logo-iphone-desk.jpg',                    readCount: 538, ts: 1741519000000, id: 538102847 },
  'meta-conversion-api':                                              { img: 'social-media-management-laptop-phone.jpg',       readCount: 291, ts: 1741520000000, id: 291836547 },
  'marketing-mix-modeling-voor-marketingmanagers':                    { img: 'business-finance-chart-fountain-pen.jpg',        readCount: 673, ts: 1741521000000, id: 673492810 },
  'attributie-in-ga4-wat-kun-je-nog-vertrouwen':                      { img: 'saas-business-dashboard-metrics.jpg',            readCount: 356, ts: 1741522000000, id: 356821047 },
  'offline-conversies-importeren-in-google-ads':                      { img: 'google-search-analytics-mobile.jpg',             readCount: 489, ts: 1741523000000, id: 489302718 },
  'bigquery-voor-customer-360-in-marketing':                          { img: 'business-meeting-collaboration-laptops.jpg',     readCount: 0,   ts: 1773140400000, id: 360412187 },
  'cohortanalyse-met-bigquery-en-ga4':                                { img: 'roadmap-planning-sticky-notes.jpg',              readCount: 0,   ts: 1773140700000, id: 472918036 },
  'bigquery-ml-voor-customer-segmentatie':                            { img: 'team-brainstorming-whiteboard-collaboration.jpg', readCount: 0,  ts: 1773141000000, id: 519283047 },
  'bigquery-contribution-analysis-voor-campagneveranderingen':        { img: 'saas-business-dashboard-metrics.jpg',            readCount: 0,   ts: 1773141300000, id: 683091274 },
  'bigquery-voor-assortimentsanalyse-in-shopping':                    { img: 'google-shopping-ecommerce-icon-3d.jpg',          readCount: 0,   ts: 1773141600000, id: 247819036 },
  'linkedin-insight-tag-via-gtm':                                     { img: 'social-media-management-laptop-phone.jpg',       readCount: 0,   ts: 1773133800000, id: 319475820 },
  'tiktok-pixel-via-gtm':                                             { img: 'social-media-apps-icons-phone.jpg',              readCount: 0,   ts: 1773134100000, id: 482039167 },
  'microsoft-clarity-via-gtm':                                        { img: 'ux-research-user-goals-sketch.jpg',              readCount: 0,   ts: 1773134700000, id: 573810294 },
  'pinterest-tag-via-gtm':                                            { img: 'people-using-smartphones-blurred.jpg',           readCount: 0,   ts: 1773134400000, id: 628401753 },
  'microsoft-ads-uet-tag-via-gtm':                                    { img: 'typing-on-laptop-google-search.jpg',             readCount: 0,   ts: 1773135000000, id: 794316028 },
};

const relatedMap = {
  'bigquery-koppelen-aan-ga4': [
    ['ga4-implementeren', 'GA4 implementeren'],
    ['ga4-rapportages-en-dashboards', 'GA4 rapportages en dashboards'],
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4'],
    ['data-layer-opzetten', 'Data layer opzetten'],
    ['ga4-events-meten', 'GA4 events meten'],
  ],
  'enhanced-conversions-via-gtm': [
    ['google-ads-tracking-via-gtm', 'Google Ads tracking via GTM'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
    ['offline-conversies-importeren-in-google-ads', 'Offline conversies importeren in Google Ads'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['formuliertracking-ga4-zonder-developers', 'Formuliertracking in GA4 zonder developers'],
  ],
  'meta-conversion-api': [
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['server-side-tagging', 'Server-side tagging'],
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
    ['ga4-implementeren', 'GA4 implementeren'],
  ],
  'marketing-mix-modeling-voor-marketingmanagers': [
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4'],
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['ga4-rapportages-en-dashboards', 'GA4 rapportages en dashboards'],
    ['offline-conversies-importeren-in-google-ads', 'Offline conversies importeren in Google Ads'],
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
  ],
  'attributie-in-ga4-wat-kun-je-nog-vertrouwen': [
    ['ga4-implementeren', 'GA4 implementeren'],
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['marketing-mix-modeling-voor-marketingmanagers', 'Marketing Mix Modeling'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['ga4-events-meten', 'GA4 events meten'],
  ],
  'offline-conversies-importeren-in-google-ads': [
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
    ['google-ads-tracking-via-gtm', 'Google Ads tracking via GTM'],
    ['formuliertracking-ga4-zonder-developers', 'Formuliertracking in GA4'],
    ['ga4-implementeren', 'GA4 implementeren'],
    ['hubspot-integratie-via-gtm', 'HubSpot integratie via GTM'],
  ],
  'bigquery-voor-customer-360-in-marketing': [
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['bigquery-voor-kanaalsturing-met-crm-data', 'BigQuery voor kanaalsturing met CRM-data'],
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4: wat kun je nog vertrouwen?'],
    ['marketing-mix-modeling-voor-marketingmanagers', 'Marketing Mix Modeling voor marketingmanagers'],
    ['offline-conversies-importeren-in-google-ads', 'Offline conversies importeren in Google Ads'],
  ],
  'cohortanalyse-met-bigquery-en-ga4': [
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['bigquery-ml-voor-klantwaarde-en-koopkans', 'BigQuery ML voor klantwaarde en koopkans'],
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4: wat kun je nog vertrouwen?'],
    ['ga4-rapportages-en-dashboards', 'GA4 rapportages en dashboards'],
    ['marketing-mix-modeling-voor-marketingmanagers', 'Marketing Mix Modeling voor marketingmanagers'],
  ],
  'bigquery-ml-voor-customer-segmentatie': [
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['bigquery-ml-voor-klantwaarde-en-koopkans', 'BigQuery ML voor klantwaarde en koopkans'],
    ['bigquery-voor-audience-segmentatie-en-activatie', 'BigQuery voor audience segmentatie en activatie'],
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4: wat kun je nog vertrouwen?'],
    ['marketing-mix-modeling-voor-marketingmanagers', 'Marketing Mix Modeling voor marketingmanagers'],
  ],
  'bigquery-contribution-analysis-voor-campagneveranderingen': [
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['bigquery-voor-anomaly-detection-in-marketingdata', 'BigQuery voor anomaly detection in marketingdata'],
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4: wat kun je nog vertrouwen?'],
    ['ga4-rapportages-en-dashboards', 'GA4 rapportages en dashboards'],
    ['marketing-mix-modeling-voor-marketingmanagers', 'Marketing Mix Modeling voor marketingmanagers'],
  ],
  'bigquery-voor-assortimentsanalyse-in-shopping': [
    ['bigquery-koppelen-aan-ga4', 'BigQuery koppelen aan GA4'],
    ['bigquery-voor-pricing-in-shopping-campagnes', 'BigQuery voor pricing in Shopping campagnes'],
    ['wat-is-een-goede-roas-en-hoe-stuur-je-erop', 'Wat is een goede ROAS en hoe stuur je erop'],
    ['marketing-budget-bepalen', 'Marketing budget bepalen'],
    ['attributie-in-ga4-wat-kun-je-nog-vertrouwen', 'Attributie in GA4: wat kun je nog vertrouwen?'],
  ],
  'linkedin-insight-tag-via-gtm': [
    ['meta-conversion-api', 'Meta Conversion API'],
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
    ['offline-conversies-importeren-in-google-ads', 'Offline conversies importeren in Google Ads'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
  ],
  'tiktok-pixel-via-gtm': [
    ['meta-conversion-api', 'Meta Conversion API'],
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['server-side-tagging', 'Server-side tagging'],
  ],
  'microsoft-clarity-via-gtm': [
    ['hotjar-integratie-via-gtm', 'Hotjar integratie via GTM'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
    ['formuliertracking-ga4-zonder-developers', 'Formuliertracking in GA4 zonder developers'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['ga4-events-meten', 'GA4 events meten'],
  ],
  'pinterest-tag-via-gtm': [
    ['meta-conversion-api', 'Meta Conversion API'],
    ['google-ads-tracking-via-gtm', 'Google Ads tracking via GTM'],
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
  ],
  'microsoft-ads-uet-tag-via-gtm': [
    ['google-ads-tracking-via-gtm', 'Google Ads tracking via GTM'],
    ['enhanced-conversions-via-gtm', 'Enhanced Conversions via GTM'],
    ['offline-conversies-importeren-in-google-ads', 'Offline conversies importeren in Google Ads'],
    ['consent-mode-correct-instellen', 'Consent Mode correct instellen'],
    ['google-tag-manager-installeren', 'Google Tag Manager installeren'],
  ],
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { fm, body: match[2].trim() };
}

function dutchDateToISO(d) {
  const months = { 'januari':'01','februari':'02','maart':'03','april':'04','mei':'05','juni':'06','juli':'07','augustus':'08','september':'09','oktober':'10','november':'11','december':'12' };
  const parts = d.toLowerCase().split(' ');
  return `${parts[2]}-${months[parts[1]]}-${parts[0].padStart(2,'0')}`;
}

function mdToHtml(body) {
  const lines = body.split('\n');
  let html = '';
  let para = [];
  const flush = () => { if (para.length) { html += '<p>' + para.join(' ') + '</p>\n'; para = []; } };
  for (const line of lines) {
    if (line.startsWith('# ')) continue;
    else if (line.startsWith('## ')) { flush(); html += '<h2>' + line.slice(3) + '</h2>\n'; }
    else if (line.trim() === '') flush();
    else para.push(line.trim());
  }
  flush();
  return html;
}

const REVIEWS_HTML = `
                <section class="reviews-section" aria-label="Klantreviews">
                    <h2 class="reviews-title">Wat klanten zeggen</h2>
                    <div class="reviews-list">
                        <article class="review-card">
                            <div class="review-avatar"><img src="/images/clients/bernice goudt.jpeg" alt="Bernice Goudt, Dopper" loading="lazy"></div>
                            <div class="review-content">
                                <blockquote class="review-quote">PaperDigits tilt onze performance marketing naar een hoger niveau en optimaliseert voor internationale groei. Hun proactieve aanpak en snelle communicatie maken hen onmisbaar voor ons online succes.</blockquote>
                                <div class="review-author"><span class="review-name">Bernice Goudt</span><span class="review-role">Marketing Manager, Dopper</span></div>
                            </div>
                        </article>
                        <article class="review-card">
                            <div class="review-avatar"><img src="/images/clients/koen duits.jpeg" alt="Koen Duits, Fietsenwinkel.nl" loading="lazy"></div>
                            <div class="review-content">
                                <blockquote class="review-quote">We halen alles uit onze performancekanalen en blijven doorontwikkelen op tracking en BI. PaperDigits schakelt snel en leeft ons merk—een prettige en effectieve samenwerking.</blockquote>
                                <div class="review-author"><span class="review-name">Koen Duits</span><span class="review-role">Marketing Manager, Fietsenwinkel.nl</span></div>
                            </div>
                        </article>
                        <article class="review-card">
                            <div class="review-avatar"><img src="/images/clients/age huitema.jpeg" alt="Age Huitema, Quatt" loading="lazy"></div>
                            <div class="review-content">
                                <blockquote class="review-quote">Met hulp van PaperDigits groeide Quatt als nieuw merk uit tot marktleider in warmtepompen. Hun datagedreven aanpak zet schaalbare campagnes op die onze doelgroep in beweging krijgen.</blockquote>
                                <div class="review-author"><span class="review-name">Age Huitema</span><span class="review-role">Marketing Manager, Quatt</span></div>
                            </div>
                        </article>
                    </div>
                </section>
                <script type="application/ld+json">
                {"@context":"https://schema.org","@graph":[
                  {"@type":"Review","about":{"@type":"Organization","name":"PaperDigits"},"author":{"@type":"Person","name":"Bernice Goudt"},"reviewBody":"PaperDigits tilt onze performance marketing naar een hoger niveau en optimaliseert voor internationale groei. Hun proactieve aanpak en snelle communicatie maken hen onmisbaar voor ons online succes."},
                  {"@type":"Review","about":{"@type":"Organization","name":"PaperDigits"},"author":{"@type":"Person","name":"Koen Duits"},"reviewBody":"We halen alles uit onze performancekanalen en blijven doorontwikkelen op tracking en BI. PaperDigits schakelt snel en leeft ons merk—een prettige en effectieve samenwerking."},
                  {"@type":"Review","about":{"@type":"Organization","name":"PaperDigits"},"author":{"@type":"Person","name":"Age Huitema"},"reviewBody":"Met hulp van PaperDigits groeide Quatt als nieuw merk uit tot marktleider in warmtepompen. Hun datagedreven aanpak zet schaalbare campagnes op die onze doelgroep in beweging krijgen."}
                ]}
                </script>`;

function buildHtml(fm, bodyHtml, slug, uploadBase, related) {
  const canonical = `https://pages.paperdigits.nl/${slug}/`;
  const imgUrl = `https://pages.paperdigits.nl/uploads/${uploadBase}.jpg`;
  const isoDate = dutchDateToISO(fm.date);
  const relatedLinks = related.map(([s, t]) => `                        <li><a href="/${s}/">${t}</a></li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fm.title} | PaperDigits</title>
    <meta name="description" content="${fm.description}">
    <link rel="canonical" href="${canonical}">

    <meta property="og:title" content="${fm.title}">
    <meta property="og:description" content="${fm.description}">
    <meta property="og:image" content="${imgUrl}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PaperDigits">

    <link rel="stylesheet" href="../styles.css">

    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-11476910514"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-11476910514');
    </script>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "${canonical}#blogposting",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "${canonical}" },
      "url": "${canonical}",
      "headline": "${fm.title}",
      "description": "${fm.description}",
      "inLanguage": "nl-NL",
      "articleSection": "${fm.category}",
      "isAccessibleForFree": true,
      "datePublished": "${isoDate}T09:00:00+01:00",
      "dateModified": "${isoDate}T09:00:00+01:00",
      "author": { "@type": "Person", "@id": "https://pages.paperdigits.nl/#person-wouter-naber", "name": "Wouter Naber", "url": "https://pages.paperdigits.nl/over/wouter-naber/" },
      "publisher": {
        "@type": "Organization",
        "@id": "https://pages.paperdigits.nl/#organization",
        "name": "PaperDigits",
        "url": "https://pages.paperdigits.nl/",
        "logo": { "@type": "ImageObject", "url": "https://pages.paperdigits.nl/images/logo/PaperDigits_logo.png", "width": 512, "height": 512 }
      },
      "image": { "@type": "ImageObject", "url": "${imgUrl}", "width": 1200, "height": 630 },
      "copyrightYear": 2026,
      "copyrightHolder": { "@id": "https://pages.paperdigits.nl/#organization" }
    }
    </script>
    <!-- FAQ Schema -->
    <script type="application/ld+json">
    {{faq_structured_data}}
    </script>
    <script>
    window.GADS_SEND_TO = 'AW-11476910514/8heqCIDBwKAbELKDz-Aq';
    window.GADS_SEND_TO_VIEW = 'AW-11476910514/-6THCNK6waAbELKDz-Aq';
    window.GADS_SEND_TO_CTA = 'AW-11476910514/zc8tCKbG8IUcELKDz-Aq';
    </script>
</head>
<body>
    <header class="header">
        <div class="header__container">
            <a class="header__logo" href="https://paperdigits.nl/"><img src="../images/logo/PaperDigits_logo.png" alt="PaperDigits - Performance Marketing Agency" class="logo-image"></a>
            <button class="hamburger" aria-label="Toggle menu">
                <span class="hamburger__line"></span>
                <span class="hamburger__line"></span>
                <span class="hamburger__line"></span>
            </button>
            <nav class="header__nav">
                <ul class="nav__list">
                    <li class="nav__item"><a href="https://paperdigits.nl/services/" class="nav__link">Services</a></li>
                    <li class="nav__item"><a href="https://paperdigits.nl/technologie/" class="nav__link">Technologie</a></li>
                    <li class="nav__item"><a href="https://paperdigits.nl/stories/" class="nav__link">Stories</a></li>
                    <li class="nav__item"><a href="https://paperdigits.nl/vacatures/" class="nav__link">Vacatures</a></li>
                    <li class="nav__item"><a href="https://paperdigits.nl/contact/" class="nav__link">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main">
        <article class="blog-post">
            <header class="post-header">
                <h1 class="post-title">${fm.title}</h1>
            </header>

            <div class="post-content">
                <p class="post-intro">${fm.description}</p>

                <div class="post-meta">
                    <div class="meta inner-column flex fl">
                        <div class="flex meta-item meta-author">
                            <img src="../images/writers/Wouter Naber.jpg" alt="Auteur" class="avatar-img" loading="lazy">
                            <span class="author-name">Wouter Naber</span>
                        </div>
                        <div class="flex fl meta-other">
                            <span class="meta-item">${fm.date}</span>
                            <span class="meta-item">${fm.readCount} x gelezen</span>
                        </div>
                    </div>
                </div>

                <div class="hero-image">
                    <img src="../uploads/${uploadBase}.jpg"
                         alt="${fm.heroImageAlt}"
                         class="hero-img"
                         loading="eager">
                </div>

${bodyHtml}
                <section class="related-posts" aria-label="Gerelateerde artikelen">
                    <h2>Gerelateerde artikelen</h2>
                    <ul class="related-list">
${relatedLinks}
                    </ul>
                </section>

                <div class="whatsapp-contact-section">
                    <div class="whatsapp-contact-card">
                        <div class="whatsapp-contact-content">
                            <div class="whatsapp-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="currentColor"/></svg>
                            </div>
                            <div class="whatsapp-text">
                                <h3>Meer informatie nodig?</h3>
                                <p>Heb je vragen over dit onderwerp? Stuur ons een WhatsApp bericht en we helpen je graag verder!</p>
                            </div>
                        </div>
                        <a href="https://wa.me/31647958133?text=Hoi! Ik heb een vraag. " class="whatsapp-button" target="_blank" rel="noopener noreferrer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="currentColor"/></svg>
                            WhatsApp ons
                        </a>
                    </div>
                </div>
            </div>
${REVIEWS_HTML}
</article>
    </main>

    <footer class="footer">
        <div class="footer__row">
            <nav class="footer__nav">
                <ul class="footer__list footer__list--main">
                    <li class="footer__item footer-heading"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/services/"><span class="footer__text">Services</span></a></div></li>
                    <li class="footer__item footer-heading"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/stories/"><span class="footer__text">Stories</span></a></div></li>
                    <li class="footer__item footer-heading"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/technologie/"><span class="footer__text">Technologie</span></a></div></li>
                    <li class="footer__item footer-heading"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/vacatures/"><span class="footer__text">Vacatures</span></a></div></li>
                    <li class="footer__item footer-heading"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/contact/"><span class="footer__text">Contact</span></a></div></li>
                </ul>
                <div class="footer__contact">
                    <p class="small-body font-bold">Contactgegevens</p>
                    <div class="p small-body">
                        <p>Noorderstraat 1Q,<br>1823 CS Alkmaar</p>
                        <p><a href="tel:+31722340777">+31 (0)72 234 0777</a><br><a href="mailto:info@paperdigits.nl">info@paperdigits.nl</a></p>
                    </div>
                </div>
                <div class="footer__contact-button">
                    <a href="https://paperdigits.nl/contact/" rel="noopener" class="button medium-body button--anchor background--dark color--light has-dot">
                        <span class="button__text">Contact opnemen</span>
                        <span class="button-dot color--psea"></span>
                    </a>
                </div>
            </nav>
            <div class="footer__bottom">
                <div class="footer__bottom-left">
                    <div class="footer__legal-nav">
                        <ul class="footer__list footer__list--legal">
                            <li class="footer__item xsmall-body color--psea"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/privacybeleid/"><span class="footer__text">Privacybeleid</span></a></div></li>
                            <li class="footer__item xsmall-body color--psea"><div class="footer__text-container"><a class="footer__link" href="https://paperdigits.nl/cookiebeleid/"><span class="footer__text">Cookiebeleid</span></a></div></li>
                        </ul>
                        <p class="footer__copyright xsmall-body">Copyright ©2026 PaperDigits</p>
                    </div>
                </div>
                <div class="footer__bottom-right background--plightgrey">
                    <img width="299" height="286" src="https://paperdigits.nl/wp-content/uploads/2024/02/PremierPartner-RGB-1.png" alt="" decoding="async" loading="lazy">
                    <img width="300" height="172" src="https://paperdigits.nl/wp-content/uploads/2024/02/MBP-Badge-Light-backgrounds@4x-300x172.png" alt="" decoding="async" loading="lazy">
                    <img width="300" height="135" src="https://paperdigits.nl/wp-content/uploads/2024/07/PaperDigits_Leadinfo_parnter-300x135.png" alt="" decoding="async" loading="lazy">
                    <img width="300" height="178" src="https://paperdigits.nl/wp-content/uploads/2024/03/PaperDigits_cookiebot_partner_cookie_consent_mode_v2-300x178.png" alt="" decoding="async" loading="lazy">
                </div>
            </div>
        </div>
    </footer>

    <script>
        const hamburger = document.querySelector('.hamburger');
        const nav = document.querySelector('.header__nav');
        hamburger.addEventListener('click', () => { hamburger.classList.toggle('hamburger--active'); nav.classList.toggle('header__nav--active'); });
        document.querySelectorAll('.nav__link').forEach(link => { link.addEventListener('click', () => { hamburger.classList.remove('hamburger--active'); nav.classList.remove('header__nav--active'); }); });
    </script>
    <script>
        (function(){
            function fire(){ try { if(window.dataLayer) window.dataLayer.push({event:'whatsapp_click'}); if(typeof window.gtag==='function'&&window.GADS_SEND_TO) window.gtag('event','conversion',{send_to:window.GADS_SEND_TO}); if(typeof window.gtag==='function'&&window.GADS_SEND_TO_CTA) window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_CTA}); } catch(e){} }
            document.addEventListener('click',function(e){ var b=e.target&&e.target.closest?e.target.closest('a.whatsapp-button'):null; if(!b)return; fire(); },true);
        })();
    </script>
    <script>
        (function(){
            var fired=false;
            function fireView(){ if(fired)return; fired=true; try{ if(window.dataLayer) window.dataLayer.push({event:'whatsapp_view'}); if(typeof window.gtag==='function'&&window.GADS_SEND_TO_VIEW) window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_VIEW}); }catch(e){} }
            function observe(){ var b=document.querySelector('a.whatsapp-button'); if(!b)return; if(!('IntersectionObserver' in window)){fireView();return;} var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting&&e.intersectionRatio>0){fireView();io.disconnect();}});},{root:null,threshold:[0,0.01]}); io.observe(b); }
            if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe); else observe();
        })();
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
            try { if(window.dataLayer) window.dataLayer.push({event:'post_cta_click'}); } catch(ex){}
            try { if(typeof window.gtag==='function'&&window.GADS_SEND_TO_CTA) window.gtag('event','conversion',{send_to:window.GADS_SEND_TO_CTA}); } catch(ex){}
        }, true);
    })();
    </script>
</body>
</html>`;
}

const VARIANTS = [
  { suffix: '-square1200.jpg', w: 1200, h: 1200, fmt: 'jpeg' },
  { suffix: '-mobile.jpg',     w: 750,  h: 500,  fmt: 'jpeg' },
  { suffix: '-desktop.jpg',    w: 1200, h: 500,  fmt: 'jpeg' },
  { suffix: '-2x.jpg',         w: 2400, h: 1000, fmt: 'jpeg' },
  { suffix: '-1200x628.png',   w: 1200, h: 628,  fmt: 'png' },
  { suffix: '-1200x1200.png',  w: 1200, h: 1200, fmt: 'png' },
  { suffix: '-960x1200.png',   w: 960,  h: 1200, fmt: 'png' },
  { suffix: '-1080x1920.png',  w: 1080, h: 1920, fmt: 'png' },
  { suffix: '-1440x1800.png',  w: 1440, h: 1800, fmt: 'png' },
];

(async () => {
  const mdFiles = fs.readdirSync('copywriter-artikelen').filter(f => f.endsWith('.md'));
  const metadata = JSON.parse(fs.readFileSync('blog-metadata.json', 'utf8'));

  for (const file of mdFiles) {
    const raw = fs.readFileSync(path.join('copywriter-artikelen', file), 'utf8');
    const { fm, body } = parseFrontmatter(raw);
    const slug = fm.slug;
    const info = imageMap[slug];
    if (!info) { console.warn(`⚠️  No image mapped for: ${slug}`); continue; }

    const uploadBase = `header-${info.ts}-${info.id}`;
    const srcImg = path.join('images-pages', info.img);
    const destImg = path.join('uploads', uploadBase + '.jpg');

    // Copy base image and generate all variants from source
    const absSrcImg = path.resolve(srcImg);
    const absDestImg = path.resolve(destImg);

    // Generate base copy via sharp (ensures file is fully written before variants)
    await sharp(absSrcImg).jpeg({ quality: 95 }).toFile(absDestImg);

    // Generate all variants
    for (const v of VARIANTS) {
      const absOut = path.resolve(path.join('uploads', uploadBase + v.suffix));
      let s = sharp(absSrcImg).resize(v.w, v.h, { fit: 'cover', position: 'center' });
      s = v.fmt === 'jpeg' ? s.jpeg({ quality: 85 }) : s.png({ compressionLevel: 9 });
      await s.toFile(absOut);
    }
    console.log(`✅ Images ready: ${slug}`);

    // Generate HTML
    const bodyHtml = mdToHtml(body);
    const html = buildHtml({ ...fm, readCount: info.readCount }, bodyHtml, slug, uploadBase, relatedMap[slug] || []);
    fs.writeFileSync(path.join('content', fm.filename), html, 'utf8');
    console.log(`✅ Content written: ${fm.filename}`);

    // Update metadata
    const isoDate = dutchDateToISO(fm.date);
    const entry = {
      filename: fm.filename,
      html: '',
      timestamp: fm.timestamp,
      path: `content/${fm.filename}`,
      metadata: {
        title: fm.title,
        description: fm.description,
        adDescription: fm.adDescription,
        adDescription2: fm.adDescription2,
        headline1: fm.headline1,
        headline2: fm.headline2,
        headline3: fm.headline3,
        category: fm.category,
        author: fm.author,
        date: isoDate,
        readCount: String(info.readCount),
        heroImage: `uploads/${uploadBase}.jpg`,
        heroImageAlt: fm.heroImageAlt,
        slug: fm.slug,
      }
    };

    const existing = metadata.findIndex(m => m.filename === fm.filename);
    if (existing >= 0) metadata[existing] = entry;
    else metadata.push(entry);
    console.log(`✅ Metadata updated: ${slug}`);
  }

  fs.writeFileSync('blog-metadata.json', JSON.stringify(metadata, null, 2));
  console.log('\n🎉 All articles processed!');
})().catch(console.error);
