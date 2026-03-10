# pages-v2 — Agent Handleiding

Custom Node.js CMS + statische sitegenerator voor **pages.paperdigits.nl** (PaperDigits blog). Nederlandstalige content over GA4, GTM, BigQuery en performance marketing.

---

## Project overzicht

```
blog-metadata.json          ← metadata van alle artikelen (title, hero, ad-copy, etc.)
content/                    ← HTML-bestanden van alle artikelen
copywriter-artikelen/       ← markdown-drafts (input voor publicatie)
uploads/                    ← hero-afbeeldingen (bronbestanden + Sharp-varianten)
images-pages/               ← stockfoto's om uit te kiezen bij publicatie
images/images-raw/          ← (ouder) alternatieve stockfoto's
static-export/              ← output van de build (live site)
_publish-articles.js        ← het publicatiescript voor copywriter-artikelen
export-static.js            ← bouwt de statische site + feed.xml + image-varianten
sync-ftp.js                 ← uploadt static-export/ naar de server via FTP
```

**Live URL:** https://pages.paperdigits.nl
**FTP:** srv1.boringdigital.nl, user: pages@paperdigits.nl, remotePath: `/` (root = webroot)

---

## De workflow in één oogopslag

```
content-topics.json          ← single source of truth voor topic-config, status én afbeelding/related
copywriter-artikelen/*.md    ← markdown-scaffolds + inhoud door copywriter
        ↓
node scripts/content-machine.js scaffold   ← genereert .md scaffold + schrijft img/ts/id/related terug
        ↓
[copywriter schrijft body]
        ↓
node scripts/content-machine.js review <slug>   ← draft → review
node scripts/content-machine.js approve <slug>  ← review → approved (blokkeert bij issues)
        ↓
node _publish-articles.js     ← verwerkt alleen 'approved' artikelen → HTML + afbeeldingen + metadata
                                 zet status automatisch op 'published'
        ↓
npm run deploy                ← export-static.js + sync-ftp.js
        ↓
live op pages.paperdigits.nl + feed.xml → Channable → Google Ads campagnes
```

### Status flow

`idea` → `scaffolded` → `draft` → `review` → `approved` → `published` → `live`

**Commands:**
```bash
npm run content:scaffold         # scaffold nieuwe topics
npm run content:status           # overzicht van alle topics
npm run content:validate         # valideer alle markdown-bestanden
npm run content:review -- <slug> # stuur draft naar review
npm run content:approve -- <slug># keur goed (blokkeert bij placeholder/lengte issues)
npm run content:reject -- <slug> # stuur terug naar draft

node _publish-articles.js        # publiceer goedgekeurde artikelen
```

**Vereiste configuratie per nieuwe slug in `content-topics.json`:**

Naast slug/title/category/keywords/status heeft elk topic ook:
```json
{
  "slug": "mijn-artikel",
  "img": "naam-van-foto.jpg",
  "readCount": 0,
  "ts": 1773140400000,
  "id": 360412187,
  "related": [["gerelateerde-slug", "Gerelateerde titel"]]
}
```

`scaffold` vult `img`, `ts`, `id` en `related` automatisch in als ze ontbreken.

---

## Artikelen publiceren: het juiste script

### `_publish-articles.js` — gebruik dit altijd

Dit script verwerkt markdown-bestanden uit `copywriter-artikelen/` en doet alles:
1. Parsert frontmatter + markdown body
2. Genereert **alle** Sharp-varianten (`-desktop.jpg`, `-mobile.jpg`, `-2x.jpg`, `-square1200.jpg`, `-1200x628.png`, `-1200x1200.png`, `-960x1200.png`, `-1080x1920.png`, `-1440x1800.png`)
3. Schrijft het HTML-bestand naar `content/`
4. Update `blog-metadata.json`

**Script draaien:**
```bash
node _publish-articles.js
```
Verwerkt alleen artikelen met status `approved` in `content-topics.json`. Gebruik `npm run content:approve -- <slug>` om een artikel goed te keuren.

---

## Markdown-formaat in copywriter-artikelen/

```yaml
---
filename: mijn-artikel.html
slug: mijn-artikel
timestamp: 2026-03-10T11:00:00.000Z
title: Titel van het artikel
description: Meta description, ook gebruikt als post-intro. Beschrijvend en informatief.
adDescription: Max 90 tekens. Actiegericht. Voor Google Ads.
adDescription2: Max 90 tekens. Tweede variant.
headline1: Max 30 tekens
headline2: Max 30 tekens
headline3: Max 30 tekens
category: Analytics          # of: Google Tag Manager / Digital Marketing
author: Wouter Naber
date: 10 maart 2026
readCount: 0
heroImage: images/...        # wordt genegeerd door _publish-articles.js (die gebruikt imageMap)
heroImageAlt: Beschrijvende alt-tekst
---

# Titel (h1, wordt genegeerd in body — staat al in post-header)

Intro-alinea...

## Sectie 1 (## = h2)

Tekst...

## Sectie 2

Tekst...
```

---

## Kritische vereisten voor HTML-bestanden

### 1. FAQ-placeholder is verplicht

Staat in de `<head>`, direct na het BlogPosting-schema:

```html
<!-- FAQ Schema -->
<script type="application/ld+json">
{{faq_structured_data}}
</script>
```

**Zonder dit slokt de export-regex de volledige paginacontent op.** Alle bestaande artikelen hebben dit. `_publish-articles.js` voegt het automatisch in.

### 2. Afbeeldingsvarianten moeten bestaan vóór export

`export-static.js` zoekt in `uploads/` naar `-square1200.jpg`, `-1200x628.png`, etc. om de feed te vullen. Als die ontbreken krijgen de artikelen geen afbeeldingen in de RSS-feed (en dus geen Google Ads visuals).

`_publish-articles.js` genereert deze automatisch via Sharp. Doe je het handmatig, genereer dan de varianten zelf:

```js
const VARIANTS = [
  { suffix: '-square1200.jpg', w: 1200, h: 1200, fmt: 'jpeg' },
  { suffix: '-mobile.jpg',     w: 750,  h: 500,  fmt: 'jpeg' },
  { suffix: '-desktop.jpg',    w: 1200, h: 500,  fmt: 'jpeg' },
  { suffix: '-2x.jpg',         w: 2400, h: 1000, fmt: 'jpeg' },
  { suffix: '-1200x628.png',   w: 1200, h: 628,  fmt: 'png'  },
  { suffix: '-1200x1200.png',  w: 1200, h: 1200, fmt: 'png'  },
  { suffix: '-960x1200.png',   w: 960,  h: 1200, fmt: 'png'  },
  { suffix: '-1080x1920.png',  w: 1080, h: 1920, fmt: 'png'  },
  { suffix: '-1440x1800.png',  w: 1440, h: 1800, fmt: 'png'  },
];
```

### 3. Ad-tekenlimieten zijn hard

| Veld | Max |
|------|-----|
| `headline1/2/3` | **30 tekens** (incl. spaties) |
| `adDescription` / `adDescription2` | **90 tekens** (incl. spaties) |

Google Ads keurt te lange ads af. Altijd controleren.

### 4. blog-metadata.json entry-formaat

```json
{
  "filename": "mijn-artikel.html",
  "html": "",
  "timestamp": "2026-03-10T11:00:00.000Z",
  "path": "content/mijn-artikel.html",
  "metadata": {
    "title": "...",
    "description": "...",
    "adDescription": "...",
    "adDescription2": "...",
    "headline1": "...",
    "headline2": "...",
    "headline3": "...",
    "category": "Analytics",
    "author": "Wouter Naber",
    "date": "10 maart 2026",
    "readCount": "0",
    "heroImage": "uploads/header-{timestamp}-{id}.jpg",
    "heroImageAlt": "...",
    "slug": "mijn-artikel"
  }
}
```

`filename` moet exact overeenkomen met het bestand in `content/`. Dubbele entries voor dezelfde filename zorgen voor dubbele posts in het overzicht.

---

## Visueel element per artikel

Elk artikel bevat één visueel data-element (tabel of donut-chart). `_publish-articles.js` voegt dit niet automatisch in — de copywriter-markdown heeft dit al of het wordt handmatig toegevoegd aan de HTML.

**Vergelijkingstabel** (`.hs-impact` met `.hs-table` en `.mbar`-balken) — gebruik bij voor/na of A vs. B vergelijkingen.

**Donut-chart** (`.ltv-chart-wrap`) — gebruik bij verdeling of segmentatie.

Zie `BRIEFING-CONTENT-AGENT.md` voor de volledige HTML-templates van beide elementen. Zie `content/enhanced-conversions-via-gtm.html` als concreet voorbeeld van een tabel.

---

## Deployment

```bash
npm run deploy        # export + FTP sync (aanbevolen)
npm run export        # alleen static-export/ genereren
npm run sync          # alleen uploaden naar FTP
npm run sync:verbose  # uploaden met gedetailleerde FTP-logging
```

`export-static.js` genereert:
- `static-export/posts/SLUG/index.html` (pretty URLs)
- `static-export/feed.xml` (RSS met `pd:`-namespace voor Channable)
- `static-export/sitemap.xml`
- `static-export/images/heroes/` (afbeeldingsvarianten voor de feed)

Na deploy leest Channable de feed in en maakt automatisch Google Ads campagnes aan op basis van `pd:headline1-3`, `pd:adDescription1-2` en `pd:image1200x628` etc.

---

## Tone of voice (copy-writer.txt samenvatting)

- **Taal:** Nederlands, "je/jij" niet "u"
- **Stijl:** Kalm, concreet, precies — scherpe observator, geen docent
- **Zinnen:** Kort, max ~20 woorden. Één idee per zin.
- **Paragrafen:** Max 3-4 zinnen
- **Lengte:** ~500 woorden per artikel

**5-bewegingen structuur:**
1. Status quo — situatie die de lezer herkent
2. Wat ze al geprobeerd hebben — benoem specifieke tools/workarounds
3. Het idee — principe achter de aanpak
4. Wat PaperDigits doet — operationeel, concreet
5. Nieuwe situatie — "Waar je nu X ziet, zie je straks Y"

**Verboden woorden:** innovatief, oplossing, optimaliseren, synergie, data-gedreven, end-to-end, best-in-class, gamechanger, schijnzekere, verkenningsrapport, merkcampagnes, budgetkeuzes, door te schalen, marketingverstand, mist

---

## Feedback (feedback.md)

Huidige algemene feedback:
- Zinnen korter. Max 20 woorden per zin.
- Meer concrete voorbeelden uit de praktijk van klanten
- Niet te veel opsommingen achter elkaar

---

## Veelgemaakte fouten

| Fout | Oorzaak | Oplossing |
|------|---------|-----------|
| Artikel heeft geen afbeeldingen in feed | Sharp-varianten niet gegenereerd vóór export | `_publish-articles.js` doet dit automatisch; handmatig: zie VARIANTS-lijst hierboven |
| Paginacontent verdwijnt na export | FAQ-placeholder ontbreekt in `<head>` | Voeg `{{faq_structured_data}}`-blok toe na BlogPosting-schema |
| Artikel verschijnt niet in overzicht | `filename` in metadata ≠ bestandsnaam in `content/` | Controleer exacte spelling incl. `.html` |
| Dubbele post in overzicht | Twee entries in `blog-metadata.json` met zelfde filename | Verwijder de oudste entry |
| Google Ads keurt ads af | Headline of description te lang | headline max 30, description max 90 tekens |
| Slug overgeslagen door `_publish-articles.js` | Slug staat niet in `imageMap` | Voeg slug toe aan `imageMap` én `relatedMap` |
