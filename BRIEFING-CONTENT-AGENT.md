# Briefing: Autonome Content Agent voor pages.paperdigits.nl

## Achtergrond

We beheren een subdomein (pages.paperdigits.nl) met AI-gegenereerde blogcontent over digital marketing, SEO, GTM, GA4, conversie-optimalisatie en aanverwante onderwerpen. De content wordt beheerd via een custom-built CMS (Node.js/Express) en gedeployed als statische HTML via FTP.

Er staan momenteel 27 artikelen live. Alle content is in het Nederlands.

## Doel

Bouw een **lokaal draaiende, autonome agent** die:

1. Nieuwe blogpagina's genereert op basis van een lijst met content-onderwerpen
2. Content schrijft in onze tone of voice (Nederlands)
3. Een passende hero image selecteert uit `images/images-raw/`
4. Alle ad-metadata (headlines, descriptions) genereert voor de Channable-feed
5. De output direct klaarzet in ons CMS-formaat zodat we het kunnen reviewen en publiceren
6. Leert van feedback om de tone of voice steeds scherper te krijgen

---

## Wat de agent moet doen

### Input
- Een lijst met content-onderwerpen in `content-topics.json` — **wij beheren en vullen dit bestand zelf**
- De agent pakt hier het volgende nog niet verwerkte onderwerp uit

**Formaat van `content-topics.json`:**
```json
[
  {
    "slug": "enhanced-conversions-inrichten",
    "title": "Enhanced Conversions Inrichten",
    "category": "Google Tag Manager",
    "keywords": ["enhanced conversions", "google ads conversies", "first-party data"]
  }
]
```

### Output per onderwerp
De agent moet per onderwerp het volgende opleveren:

1. **Volledig HTML-bestand** in `content/` — passend in het bestaande template-formaat
2. **Metadata inclusief ad-velden** — zie sectie "Ad-metadata & Channable feed" hieronder
3. **Hero image** — geselecteerd uit de lokale `images/images-raw/` map (zie sectie "Hero images")

---

## Hero images: lokale Unsplash-beeldbank

### Opzet
De map `images/images-raw/` bevat Unsplash-afbeeldingen die wij zelf uploaden en beheren. Elke afbeelding heeft een **beschrijvende bestandsnaam** zodat de agent puur op bestandsnaam kan matchen — geen aparte index nodig.

**Naamgevingsconventie:**
`onderwerp-context-detail.jpg`

**Voorbeelden van huidige bestandsnamen:**
```
images/images-raw/
├── analytics-dashboard-cohort-retentie-data.jpg
├── google-ads-app-telefoon-bureau.jpg
├── google-ads-logo-3d-blauw.jpg
├── google-zoeken-telefoon-darkmode.jpg
└── ... (wij vullen deze map zelf aan)
```

### Hoe de agent een image selecteert
1. Agent leest de bestandsnamen in `images/images-raw/`
2. Op basis van het onderwerp matcht de agent de best passende afbeelding op bestandsnaam
3. De gekozen afbeelding wordt gekopieerd naar `uploads/` met de juiste naamconventie (`header-{timestamp}-{slug}`)
4. Het bestaande CMS image processing (Sharp) genereert automatisch alle varianten (desktop, mobile, 2x, square1200, PNG-varianten voor social)

**Belangrijk:** De `export-static.js` genereert al automatisch alle benodigde formaten vanuit de upload:
- `{slug}-desktop.jpg` / `-mobile.jpg` / `-2x.jpg` / `-thumb.jpg`
- `{slug}-square1200.jpg` (1200x1200)
- `{slug}-1200x1200.png` / `-1200x628.png` / `-960x1200.png` / `-1440x1800.png` / `-1080x1920.png`

De agent hoeft dus alleen het bronbestand in `uploads/` te plaatsen en de metadata correct in te vullen. De build pipeline doet de rest.

---

## Ad-metadata & Channable feed

### Waarom dit cruciaal is
De `feed.xml` wordt ingelezen door **Channable** en zet automatisch Google Ads campagnes aan voor elk nieuw artikel. Zonder correcte ad-metadata gaan er geen campagnes live. Dit is dus geen "nice to have" — het is een kernonderdeel.

### Velden die de agent moet genereren

| Veld | Max. tekens | Doel | Voorbeeld |
|---|---|---|---|
| `title` | — | Paginatitel + SEO | "Enhanced Conversions Inrichten via Google Tag Manager" |
| `description` | ~300 | Meta description + RSS | Volledige samenvatting van het artikel |
| `adDescription` | **90** | Google Ads description regel 1 | "Verbeter je conversiedata met enhanced conversions. Eenvoudig via GTM." |
| `adDescription2` | **90** | Google Ads description regel 2 | "First-party data, betere matching, meer conversies. Wij richten het in." |
| `headline1` | **30** | Google Ads headline 1 | "Betere conversiedata" |
| `headline2` | **30** | Google Ads headline 2 | "Enhanced conversions opzet" |
| `headline3` | **30** | Google Ads headline 3 | "Stap voor stap via GTM" |
| `category` | — | Channable feed filter | "Google Tag Manager" |
| `heroAlt` | — | Alt-tekst hero image | "Enhanced conversions instellen in Google Tag Manager" |

**Tekenlimieten zijn hard.** Google Ads keurt ads af die te lang zijn. De agent moet dit valideren.

### Hoe de feed werkt
De `export-static.js` genereert automatisch een `feed.xml` met een custom `pd:` namespace:

```xml
<item>
  <title>Enhanced Conversions Inrichten</title>
  <link>https://pages.paperdigits.nl/enhanced-conversions-inrichten/</link>
  <description><![CDATA[...]]></description>
  <pd:adDescription><![CDATA[...max 90 tekens...]]></pd:adDescription>
  <pd:adDescription2><![CDATA[...max 90 tekens...]]></pd:adDescription2>
  <pd:headline1><![CDATA[...max 30 tekens...]]></pd:headline1>
  <pd:headline2><![CDATA[...max 30 tekens...]]></pd:headline2>
  <pd:headline3><![CDATA[...max 30 tekens...]]></pd:headline3>
  <pd:image1200x1200>https://pages.paperdigits.nl/images/heroes/...-1200x1200.png</pd:image1200x1200>
  <pd:image1200x628>https://pages.paperdigits.nl/images/heroes/...-1200x628.png</pd:image1200x628>
  <pd:image960x1200>https://pages.paperdigits.nl/images/heroes/...-960x1200.png</pd:image960x1200>
  <enclosure url="...-square1200.jpg" type="image/jpeg" length="300000" />
  <media:content ... />
</item>
```

Channable leest deze feed en maakt op basis hiervan automatisch Google Ads campagnes aan. De `pd:headline1-3` en `pd:adDescription1-2` worden direct als ad copy gebruikt. De images worden als ad visuals ingezet.

### Flow: van agent naar live campagne
```
Agent genereert artikel + metadata
        ↓
Content in content/ + metadata in blog-metadata.json
        ↓
Review in CMS (handmatig)
        ↓
npm run deploy (export + FTP sync)
        ↓
feed.xml wordt geüpdatet op pages.paperdigits.nl/feed.xml
        ↓
Channable leest feed.xml in
        ↓
Channable maakt Google Ads campagne aan met headlines, descriptions & images
        ↓
Campagne gaat automatisch live
```

---

## Verplicht visueel element: vergelijkingstabel of donut-chart

Elk artikel moet **één visueel data-element** bevatten dat de kernboodschap ondersteunt. Dit is geen decoratie — het moet de meest relevante claim of vergelijking uit het artikel illustreren.

### Plaatsing
Voeg het element in na het tweede of derde tekstblok, vóór de "Hoe wij het aanpakken"-sectie. Niet aan het einde.

### Keuze: tabel óf donut-chart

**Gebruik een vergelijkingstabel** wanneer het artikel twee aanpakken, tools of strategieën tegenover elkaar zet (bijv. "handmatig vs. geautomatiseerd", "voor vs. na", "tool A vs. tool B").

**Gebruik een donut-chart** wanneer het artikel gaat over verdeling, segmentatie of aandeel (bijv. LTV-segmenten, kanaalverdeling, budgetverdeling). De donut toont één verdeling — geen vergelijking nodig. Één ring met een legenda is voldoende.

---

### Template 1: Vergelijkingstabel (`.hs-impact`)

```html
<!-- Vergelijkingstabel -->
<section class="hs-impact" aria-labelledby="[slug]-impact-title">
  <h2 id="[slug]-impact-title">[Titel die de vergelijking samenvat]</h2>
  <p class="hs-impact__intro">[1-2 zinnen die uitleggen wat de lezer in de tabel ziet.]</p>

  <div class="table-wrap">
    <table class="hs-table">
      <caption class="visually-hidden">Vergelijking [optie A] vs. [optie B]</caption>
      <thead>
        <tr>
          <th scope="col">Aspect</th>
          <th scope="col" class="num">[Optie A]</th>
          <th scope="col" class="num">[Optie B]</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">[Aspect 1]</th>
          <td><div class="mbar is-bad" style="--w:30%"><span class="mbar__label">[label]</span></div></td>
          <td><div class="mbar is-good" style="--w:90%"><span class="mbar__label">[label]</span></div></td>
        </tr>
        <tr>
          <th scope="row">[Aspect 2]</th>
          <td><div class="mbar is-bad" style="--w:40%"><span class="mbar__label">[label]</span></div></td>
          <td><div class="mbar is-good" style="--w:85%"><span class="mbar__label">[label]</span></div></td>
        </tr>
        <tr>
          <th scope="row">[Aspect 3]</th>
          <td><div class="mbar" style="--w:20%"><span class="mbar__label">[label]</span></div></td>
          <td><div class="mbar is-good" style="--w:100%"><span class="mbar__label">[label]</span></div></td>
        </tr>
        <tr>
          <th scope="row">[Aspect 4]</th>
          <td><div class="mbar is-bad" style="--w:50%"><span class="mbar__label">[label]</span></div></td>
          <td><div class="mbar is-good" style="--w:80%"><span class="mbar__label">[label]</span></div></td>
        </tr>
        <tr>
          <th scope="row">[Aspect 5]</th>
          <td><div class="mbar" style="--w:25%"><span class="mbar__label">[label]</span></div></td>
          <td><div class="mbar is-good" style="--w:95%"><span class="mbar__label">[label]</span></div></td>
        </tr>
      </tbody>
    </table>

    <p class="hs-source">
      [Bronvermelding of: "Indicatieve benchmark op basis van PaperDigits cases 2024–2025."]
    </p>
  </div>
</section>
```

**Regels voor de balk-percentages (`--w`):**
- `is-good` (groen→paars): voor de "betere" optie. Geef een realistisch percentage (60–100%).
- `is-bad` (rood→oranje): voor de "slechtere" optie. Gebruik 20–55%.
- Geen modifier (grijs): voor neutrale waarden.
- De `--w` waarde is visueel — gebruik het om de *relatieve verhouding* te tonen, niet een absoluut getal.

**Minimaal 4, maximaal 6 rijen.**

---

### Template 2: Donut-chart (`.ltv-chart-wrap`)

Gebruik dit wanneer je verdeling of segmentatie wilt tonen. Één donut met een legenda is voldoende — een tweede vergelijkende donut is optioneel. De CSS staat al in `styles.css`.

```html
<!-- Donut-chart -->
<section class="hs-impact" aria-labelledby="[slug]-chart-title">
  <h2 id="[slug]-chart-title">[Titel die de verdeling samenvat]</h2>
  <p class="hs-impact__intro">[1-2 zinnen die uitleggen wat de lezer ziet.]</p>

  <div class="ltv-chart-wrap">

    <div class="ltv-donut-block">
      <div class="ltv-donut-label-top">[Label boven de donut]</div>
      <svg viewBox="0 0 100 100" class="ltv-donut" role="img" aria-label="[beschrijving]">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f2f5" stroke-width="17"/>
        <!-- Segment 1: [X]% -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#6c7ae0" stroke-width="17"
          stroke-dasharray="[X*2.513] [251.3-(X*2.513)]" stroke-dashoffset="0"
          transform="rotate(-90 50 50)"/>
        <!-- Segment 2: [Y]% — dashoffset = -(X*2.513) -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f6a45b" stroke-width="17"
          stroke-dasharray="[Y*2.513] [251.3-(Y*2.513)]" stroke-dashoffset="-[X*2.513]"
          transform="rotate(-90 50 50)"/>
        <!-- Segment 3: rest — dashoffset = -((X+Y)*2.513) -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="17"
          stroke-dasharray="[(100-X-Y)*2.513] [X*2.513+Y*2.513]" stroke-dashoffset="-[(X+Y)*2.513]"
          transform="rotate(-90 50 50)"/>
        <text x="50" y="47" text-anchor="middle" fill="#03113a" font-size="9" font-weight="700" font-family="inherit">[regel 1]</text>
        <text x="50" y="58" text-anchor="middle" fill="#6c7ae0" font-size="8" font-family="inherit">[regel 2]</text>
      </svg>
    </div>

    <div class="ltv-legend">
      <div class="ltv-legend-item">
        <span class="ltv-dot" style="background:#6c7ae0"></span>
        <div>
          <strong>[Segment 1 naam]</strong>
          <div class="ltv-compare"><span>[waarde of beschrijving]</span></div>
        </div>
      </div>
      <div class="ltv-legend-item">
        <span class="ltv-dot" style="background:#f6a45b"></span>
        <div>
          <strong>[Segment 2 naam]</strong>
          <div class="ltv-compare"><span>[waarde of beschrijving]</span></div>
        </div>
      </div>
      <div class="ltv-legend-item">
        <span class="ltv-dot" style="background:#e2e8f0; border:1px solid #d0d5dd"></span>
        <div>
          <strong>[Segment 3 naam]</strong>
          <div class="ltv-compare"><span>[waarde of beschrijving]</span></div>
        </div>
      </div>
    </div>

  </div>

  <p class="hs-source">
    [Bronvermelding of toelichting op de data.]
  </p>
</section>
```

**Optioneel:** voeg een tweede `.ltv-donut-block` toe náást de legenda als je twee verdelingen wilt vergelijken (bijv. klantenaandeel vs. omzetaandeel). Dit is niet verplicht.

**SVG-formule** (circumference = 251.3, r = 40):
- Segment van X%: `stroke-dasharray="(X * 2.513) (251.3 - X * 2.513)"`
- Dashoffset van segment N: `-(som van alle vorige segmenten * 2.513)`
- Altijd `transform="rotate(-90 50 50)"` zodat segment 1 bovenaan start

---

### Vuistregels voor de inhoud

- **Gebruik fictieve maar realistische data** als er geen echte benchmarks zijn. Vermeld dit in de bronvermelding.
- **Gebruik echte data** als die beschikbaar is in het artikel zelf (bijv. branchecijfers).
- **Titel van de sectie** moet de conclusie samenvatten, niet alleen beschrijven wat er staat (bijv. "Kleine groep klanten, grote omzetbijdrage" i.p.v. "Klantenverdeling").
- **Maximaal 5 aspecten** in een tabel. Niet alles hoeft erin — kies wat het meest overtuigt.

---

## Tone of voice

- **Direct en no-nonsense** — "Geen marketing fluff, wel concrete resultaten"
- **Informeel maar professioneel** — Gebruik "je/jij", niet "u"
- **Data-driven** — Gebruik concrete cijfers, percentages, benchmarks
- **Actiegericht** — Duidelijke CTAs, scanbare structuur met bullets en koppen
- **Technisch maar toegankelijk** — Leg complexe onderwerpen helder uit zonder jargon-overload

**Contentstructuur die we consequent volgen:**
1. Probleemstelling / haak
2. Waarom dit belangrijk is
3. Wat het oplevert
4. Onze aanpak / stappen
5. Veelgemaakte fouten
6. Call-to-action

Refereer naar de bestaande artikelen als levende voorbeelden.

### Content-formaat
Elke pagina is een volledig standalone HTML-document met:
- `<html lang="nl">`
- Volledige `<head>` met meta tags, Open Graph, canonical URL, Schema.org (BlogPosting)
- Google Analytics/Ads tracking scripts
- Header met navigatie
- Article met: h1, intro, post-meta, hero image, body content
- WhatsApp contact-sectie
- Gerelateerde artikelen
- Reviews-sectie
- About-sectie
- Footer

**Belangrijk:** Kijk naar de bestaande 27 artikelen in `/content/` als template. De structuur, classes, en secties moeten identiek zijn. Alleen de inhoud verschilt.

---

## Feedback-loop

### feedback.md in Git
Maak een bestand `feedback.md` in de root van de repo. Hierin houden we per artikel en/of generiek feedback bij die de agent meeneemt bij volgende runs.

**Structuur voorstel (`feedback.md`):**
```markdown
# Content Agent Feedback

## Algemene feedback
- Zinnen korter. Max 20 woorden per zin.
- Meer concrete voorbeelden uit de praktijk van onze klanten
- Niet te veel opsommingen achter elkaar

## Per artikel
### enhanced-conversions-inrichten
- Intro was te lang, moet pakkender
- Meer nadruk op wat het de adverteerder oplevert in euro's
- CTA onderaan was te soft

### server-side-tagging
- Goed voorbeeld van de juiste toon
```

De agent leest dit bestand bij elke run en past de output hierop aan.

---

## Technische architectuur

### Stack
- **Runtime:** Node.js (draait al in het project)
- **LLM API:** Anthropic Claude API (aanbevolen: Claude Sonnet 4.5 voor de juiste balans tussen kwaliteit en kosten)
- **Lokaal draaien:** Op een aparte server hier op kantoor

### Account & kosten
- **Benodigd:** Anthropic API account op https://console.anthropic.com
- **Pricing:** Claude Sonnet 4.5 — $3 per 1M input tokens, $15 per 1M output tokens
- **Geschatte kosten per artikel:** ~$0.10-0.30 (afhankelijk van lengte en aantal iteraties)
- **Aanbeveling:** Start met $50 credit, dat is genoeg voor honderden artikelen

### Hoe het werkt (high-level flow)
```
1. Lees content-topics.json              → volgende onderwerp pakken
2. Lees feedback.md                      → feedback meenemen als context
3. Lees 2-3 bestaande artikelen          → als tone of voice referentie
4. Lees bestandsnamen in images/images-raw/ → beschikbare hero images
5. Genereer HTML via Claude API          → volledig artikel in ons formaat
6. Genereer ad-metadata                  → headlines (30 tekens), descriptions (90 tekens)
7. Selecteer & kopieer hero image        → van images-raw/ naar uploads/
8. Sla op in content/                    → klaar voor review in CMS
9. Update blog-metadata.json             → metadata + ad-velden toevoegen
10. (Na deploy) Stuur Google Chat notificatie
```

### Integratie met bestaand CMS
Het CMS leest uit `content/` en `blog-metadata.json`. De agent hoeft dus alleen:
- Een `.html` bestand in `content/` te plaatsen
- De metadata (inclusief alle ad-velden) in `blog-metadata.json` bij te werken
- De hero image in `uploads/` te plaatsen
- Daarna is het artikel zichtbaar in het CMS voor review

### Publicatie & feed-update
Na review in het CMS:
```bash
npm run deploy   # export (genereert feed.xml + image varianten) + FTP sync
```
Dit update automatisch de `feed.xml` die Channable inleest. Nieuwe artikelen verschijnen dus automatisch als campagnes.

---

## Google Chat notificatie (bonus)

Stuur een bericht naar een Google Chat space wanneer een nieuw artikel live gaat.

### Aanpak
- Gebruik een **Google Chat Incoming Webhook**
- Trigger na succesvolle `npm run deploy`
- Stuur een bericht met: titel, URL, categorie

**Voorbeeld implementatie:**
```javascript
// notify-chat.js
const fetch = require('node-fetch');

async function notifyGoogleChat(title, url, category) {
  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Nieuw artikel live! *${title}*\nCategorie: ${category}\n${url}`
    })
  });
}
```

Setup: Maak een webhook aan in Google Chat > Space > Apps & integrations > Webhooks.

---

## Gewenste oplevering

### Fase 1 — MVP
- [ ] Script dat 1 artikel genereert op basis van een topic
- [ ] Output in correct HTML-formaat (identiek aan bestaande artikelen)
- [ ] Ad-metadata wordt gegenereerd met correcte tekenlimieten (30/90)
- [ ] Hero image wordt geselecteerd uit `images/images-raw/`
- [ ] Leest feedback.md mee als context
- [ ] Metadata + ad-velden worden correct in blog-metadata.json gezet

### Fase 2 — Automatisering
- [ ] Batch-verwerking van meerdere topics uit content-topics.json
- [ ] Status tracking (welke topics zijn al gegenereerd)
- [ ] Validatie: tekenlimieten headlines/descriptions, verplichte velden

### Fase 3 — Notificaties & polish
- [ ] Google Chat webhook na deploy
- [ ] Logging van wat er gegenereerd is
- [ ] Eventueel: automatische deploy na goedkeuring

---

## Bestanden in de repo die relevant zijn

| Bestand | Wat het doet |
|---|---|
| `content/*.html` | Bestaande artikelen — gebruik als template |
| `blog-metadata.json` | Metadata van alle artikelen (inclusief ad-velden) |
| `server.js` | CMS backend — lees hoe content wordt opgeslagen |
| `export-static.js` | Statische site generator — genereert feed.xml, image varianten, sitemap |
| `static-export/feed.xml` | De Channable feed — bekijk het formaat met pd: namespace |
| `scripts/inject-reviews.js` | Voorbeeld van bulk-bewerking op content |
| `posts.json` | Overzicht van alle posts |
| `uploads/` | Hero images (bronbestanden) |
| `images/images-raw/` | Lokale Unsplash beeldbank (wij beheren de inhoud) |
| `content-topics.json` | Lijst met te genereren onderwerpen (wij beheren dit) |
| `feedback.md` | Feedback voor de agent (wij beheren dit) |

---

## Samenvatting

| Wat | Detail |
|---|---|
| **Taal** | Nederlands |
| **LLM** | Anthropic Claude API (Sonnet 4.5) |
| **Account nodig** | Anthropic Console — ~$50 startbudget |
| **Draait op** | Lokale server op kantoor |
| **Input** | JSON met topics |
| **Output** | HTML + metadata + ad-copy + hero image in CMS-formaat |
| **Hero images** | Lokale Unsplash-map (`images/images-raw/`) met beschrijvende namen |
| **Feed** | feed.xml met pd: namespace → Channable → Google Ads campagnes |
| **Ad-velden** | 3x headline (30 tekens), 2x description (90 tekens) |
| **Feedback** | feedback.md in Git |
| **Notificatie** | Google Chat webhook |
| **Referentie** | 27 bestaande artikelen als voorbeeld |
