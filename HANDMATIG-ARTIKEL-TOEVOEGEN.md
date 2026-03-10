# Handmatig een artikel toevoegen (zonder CMS)

## Overzicht van het systeem

```
blog-metadata.json   ← bevat alle metadata per artikel (title, description, hero, etc.)
content/             ← bevat de HTML-bestanden van de artikelen
uploads/             ← hero-afbeeldingen
export-static.js     ← genereert de statische site (posts.json, feed.xml, index.html)
static-export/       ← output: de live site
```

**Hoe het werkt:**
1. Er staat een HTML-bestand in `content/slug.html`
2. Er staat een entry in `blog-metadata.json` met alle metadata
3. `node export-static.js` genereert alles: overzichtspagina, RSS-feed, posts.json, sitemap

---

## Stap 1: Maak het HTML-bestand aan

Maak een nieuw bestand in `content/` met de slug als bestandsnaam.
Voorbeeld: `content/mijn-nieuwe-artikel.html`

Gebruik dit template (kopieer en pas aan):

```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JOUW TITEL | PaperDigits</title>
    <meta name="description" content="JOUW META DESCRIPTION (max 160 tekens)">
    <link rel="canonical" href="https://pages.paperdigits.nl/JOUW-SLUG/">

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="JOUW TITEL">
    <meta property="og:description" content="JOUW META DESCRIPTION">
    <meta property="og:image" content="https://pages.paperdigits.nl/uploads/JOUW-AFBEELDING-desktop.jpg">
    <meta property="og:url" content="https://pages.paperdigits.nl/JOUW-SLUG/">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="PaperDigits">

    <link rel="stylesheet" href="../styles.css">

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-11476910514"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-11476910514');
    </script>

    <!-- Structured Data (Schema Markup) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://pages.paperdigits.nl/JOUW-SLUG/#blogposting",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "https://pages.paperdigits.nl/JOUW-SLUG/" },
      "url": "https://pages.paperdigits.nl/JOUW-SLUG/",
      "headline": "JOUW TITEL",
      "description": "JOUW META DESCRIPTION",
      "inLanguage": "nl-NL",
      "articleSection": "CATEGORIE",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "isAccessibleForFree": true,
      "datePublished": "2026-03-09T09:00:00+01:00",
      "dateModified": "2026-03-09T09:00:00+01:00",
      "author": {
        "@type": "Person",
        "@id": "https://pages.paperdigits.nl/#person-wouter-naber",
        "name": "Wouter Naber",
        "url": "https://pages.paperdigits.nl/over/wouter-naber/"
      },
      "publisher": {
        "@type": "Organization",
        "@id": "https://pages.paperdigits.nl/#organization",
        "name": "PaperDigits",
        "url": "https://pages.paperdigits.nl/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://pages.paperdigits.nl/images/logo/PaperDigits_logo.png",
          "width": 512,
          "height": 512
        }
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://pages.paperdigits.nl/uploads/JOUW-AFBEELDING-desktop.jpg",
        "width": 1200,
        "height": 630
      },
      "copyrightYear": 2026,
      "copyrightHolder": { "@id": "https://pages.paperdigits.nl/#organization" }
    }
    </script>

    <script>
    window.GADS_SEND_TO = 'AW-11476910514/8heqCIDBwKAbELKDz-Aq';
    window.GADS_SEND_TO_VIEW = 'AW-11476910514/-6THCNK6waAbELKDz-Aq';
    </script>
</head>
<body>
    <header class="header">
        <div class="header__container">
            <a class="header__logo" href="/">
                <img src="../images/logo/PaperDigits_logo.png" alt="PaperDigits - Performance Marketing Agency" class="logo-image">
            </a>
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
                <h1 class="post-title">JOUW TITEL</h1>
            </header>

            <div class="post-content">
                <p class="post-intro">
                    JOUW META DESCRIPTION (wordt ook als intro getoond)
                </p>

                <div class="post-meta">
                    <div class="meta inner-column flex fl">
                        <div class="flex meta-item meta-author">
                            <img src="../images/writers/Wouter Naber.jpg" alt="Auteur" class="avatar-img" loading="lazy">
                            <span class="author-name">Wouter Naber</span>
                        </div>
                        <div class="flex fl meta-other">
                            <span class="meta-item">9 maart 2026</span>
                            <span class="meta-item">0 x gelezen</span>
                        </div>
                    </div>
                </div>

                <div class="hero-image">
                    <img src="..//uploads/JOUW-AFBEELDING-desktop.jpg"
                         alt="JOUW-SLUG-paperdigits"
                         class="hero-img"
                         srcset="..//uploads/JOUW-AFBEELDING-mobile.jpg 750w,
                                 ..//uploads/JOUW-AFBEELDING-desktop.jpg 1200w,
                                 ..//uploads/JOUW-AFBEELDING-2x.jpg 2400w"
                         sizes="(max-width: 768px) 750px, 1200px"
                         loading="eager">
                </div>

                <!-- JOUW ARTIKEL CONTENT HIER -->
                <h2>Eerste sectie</h2>
                <p>Tekst...</p>

                <h2>Tweede sectie</h2>
                <p>Tekst...</p>

            </div>
        </article>
    </main>

    <!-- Footer kopieer je van een ander artikel -->
</body>
</html>
```

---

## Stap 2: Voeg een entry toe aan blog-metadata.json

Open `blog-metadata.json` en voeg een nieuw object toe aan het array.
**Voeg toe aan het einde van het array (voor de laatste `]`).**

```json
{
  "filename": "mijn-nieuwe-artikel.html",
  "html": "",
  "timestamp": "2026-03-09T09:00:00.000Z",
  "path": "content/mijn-nieuwe-artikel.html",
  "metadata": {
    "title": "Mijn nieuwe artikel titel",
    "description": "De meta description van dit artikel. Maximaal 160 tekens, beschrijft wat de lezer leert.",
    "adDescription": "Korte ad-tekst voor Google Ads (90 tekens max)",
    "adDescription2": "Tweede ad-tekst variant (90 tekens max)",
    "headline1": "Headline voor Google Ads (30 tekens max)",
    "headline2": "Tweede headline (30 tekens max)",
    "headline3": "Derde headline (30 tekens max)",
    "category": "Technologie",
    "author": "Wouter Naber",
    "date": "9 maart 2026",
    "readCount": 0,
    "heroImage": "uploads/JOUW-AFBEELDING-desktop.jpg",
    "heroImageAlt": "mijn-nieuwe-artikel-paperdigits"
  }
}
```

### Verplichte velden voor de feed (RSS/posts.json)

| Veld | Gebruikt in | Opmerking |
|------|-------------|-----------|
| `filename` | overzicht, feed | moet exact overeenkomen met bestandsnaam in `content/` |
| `timestamp` | deduplicatie | ISO 8601 formaat |
| `metadata.title` | alles | titel van het artikel |
| `metadata.description` | meta, feed, intro | ook de post-intro op de pagina |
| `metadata.category` | filter overzicht | bv. `Technologie`, `SEO`, `Digital Marketing` |
| `metadata.author` | post-meta | `Wouter Naber` of `Lasse Botman` |
| `metadata.date` | post-meta, sortering | bv. `9 maart 2026` |
| `metadata.heroImage` | overzicht, feed | pad naar de afbeelding (`uploads/...`) |
| `metadata.heroImageAlt` | afbeelding alt-tekst | bv. `slug-paperdigits` |

### Velden voor Google Ads RSS-feed — zelf verzinnen

In het CMS vul je deze velden handmatig in. Bij handmatig toevoegen moet je ze zelf schrijven. Ze komen in de RSS-feed terecht en worden gebruikt voor Google Ads.

**Regels:**
- `adDescription` / `adDescription2` — maximaal 90 tekens, actiegericht, sluit aan op het artikel
- `headline1/2/3` — maximaal 30 tekens per stuk, puntig en prikkelend

**Voorbeeld voor een artikel over GA4 implementeren:**
```json
"adDescription": "Betrouwbare GA4-setup zonder gedoe. Events, datalayer en Ads-koppelingen correct.",
"adDescription2": "Mis geen conversies meer. Wij zetten GA4 strak op voor jouw site of app.",
"headline1": "GA4 correct instellen",
"headline2": "Betrouwbare tracking data",
"headline3": "Wij regelen het voor je"
```

**Tips:**
- `headline1` = het onderwerp (wat)
- `headline2` = het voordeel (waarom)
- `headline3` = de CTA of USP (actie/onderscheid)
- Gebruik de `description` als inspiratiebron voor de ad-teksten, maar maak het korter en directer
- Tel tekens mee: spaties tellen ook

| Veld | Doel | Max tekens |
|------|------|-----------|
| `metadata.adDescription` | Primaire ad-tekst in RSS feed | 90 |
| `metadata.adDescription2` | Tweede ad-tekst variant | 90 |
| `metadata.headline1` | Headline Google Ads | 30 |
| `metadata.headline2` | Tweede headline | 30 |
| `metadata.headline3` | Derde headline | 30 |
| `metadata.readCount` | Teller, altijd beginnen met `0` | — |

---

## Stap 3: Afbeelding plaatsen

Zet de hero-afbeelding in de `uploads/` map. De export maakt automatisch deze varianten aan:
- `NAAM-mobile.jpg` (750x500)
- `NAAM-desktop.jpg` (1200x500)
- `NAAM-2x.jpg` (2400x1000)
- `NAAM-thumb.jpg` (600x300) — voor het overzicht

> Je hebt maar één bronafbeelding nodig. Zorg dat die minimaal 1200px breed is.
> Bestandsnaam zonder spaties, gebruik koppeltekens.

Als je **geen** afbeelding uploadt, gebruikt het systeem de standaard fallback:
`images/Hetportretbureau_LR__T1A1116.jpg`

---

## Stap 4: Genereer de statische site

```bash
node export-static.js
```

Dit doet:
- Leest alle entries uit `blog-metadata.json`
- Controleert of het HTML-bestand in `content/` bestaat
- Genereert afbeeldingsvarianten
- Schrijft `static-export/posts.json` en `static-export/posts.js`
- Genereert `static-export/feed.xml` (RSS met alle velden)
- Genereert `static-export/sitemap.xml`
- Maakt pretty URLs: `static-export/SLUG/index.html`
- Update de `index.html` (blog overzicht)

---

## Stap 5: Deploy

```bash
# Upload de static-export/ map naar de server
# Of gebruik het bestaande sync script:
node sync-ftp.js
```

---

## Checklist

- [ ] `content/SLUG.html` aangemaakt
- [ ] Alle `JOUW-TITEL`, `JOUW-SLUG`, `JOUW-AFBEELDING` vervangen in HTML
- [ ] Entry toegevoegd aan `blog-metadata.json`
- [ ] `filename` in metadata = exacte bestandsnaam (met `.html`)
- [ ] `timestamp` is geldig ISO 8601 formaat
- [ ] Hero-afbeelding staat in `uploads/`
- [ ] `node export-static.js` succesvol uitgevoerd
- [ ] Gedeployed

---

## Veelgemaakte fouten

**Artikel verschijnt niet in overzicht**
→ Check of `filename` in `blog-metadata.json` exact overeenkomt met de naam in `content/`

**RSS-feed mist velden**
→ Zorg dat `adDescription`, `headline1/2/3` zijn ingevuld in de metadata

**Afbeelding kapot na export**
→ Controleer het pad in `metadata.heroImage`. Moet beginnen met `uploads/` (zonder leading slash)

**Dubbele post in overzicht**
→ Er zijn meerdere entries in `blog-metadata.json` met dezelfde filename. Verwijder de oudste.
