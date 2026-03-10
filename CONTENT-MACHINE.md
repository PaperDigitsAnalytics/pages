# Content machine

Lokale pipeline voor nieuwe artikelen. Beheert de volledige lifecycle van topic-idee tot publicatie.

---

## Status flow

```
idea → scaffolded → draft → review → approved → published → live
```

| Status | Betekenis |
|--------|-----------|
| `idea` | Topic staat in `content-topics.json`, nog niet gescaffold |
| `scaffolded` | Markdown-scaffold aangemaakt in `copywriter-artikelen/` |
| `draft` | Copywriter is bezig |
| `review` | Klaar voor beoordeling (basis-validatie gedaan) |
| `approved` | Goedgekeurd, klaar voor publicatie (strikte validatie gedaan) |
| `published` | HTML-bestand aangemaakt, metadata bijgewerkt |
| `live` | Gedeployed naar de server |

---

## Single source of truth

**`content-topics.json`** beheert alle topic-config inclusief status, afbeelding, timestamp, ID en gerelateerde artikelen. `_publish-articles.js` leest dit bestand en merged het automatisch met de hardcoded maps — nieuwe topics hoeven niet meer handmatig in het publicatiescript gezet te worden.

---

## Commando's

```bash
# Overzicht van alle topics en hun status
npm run content:status

# Scaffold nieuwe topics (alle topics met status 'idea' die nog geen .md hebben)
npm run content:scaffold

# Valideer alle markdown-bestanden
npm run content:validate

# Stuur een draft naar review (voert basis-validatie uit)
npm run content:review -- <slug>

# Keur een artikel goed (blokkeert bij validatieproblemen)
npm run content:approve -- <slug>

# Stuur een artikel terug naar draft
npm run content:reject -- <slug>

# Publiceer alle goedgekeurde artikelen
node _publish-articles.js

# Publiceer één specifiek artikel (selectief)
node _publish-articles.js --slug <slug>
```

---

## Workflow stap voor stap

### 1. Topic toevoegen

Voeg een nieuw topic toe aan `content-topics.json` met status `idea`:

```json
{
  "slug": "mijn-artikel",
  "title": "Mijn artikel titel",
  "category": "Analytics",
  "keywords": ["keyword1", "keyword2"],
  "status": "idea"
}
```

### 2. Scaffold aanmaken

```bash
npm run content:scaffold
```

Dit maakt een markdown-scaffold aan in `copywriter-artikelen/mijn-artikel.md` en vult `img`, `ts`, `id` en `related` automatisch in `content-topics.json`. Status wordt `scaffolded`.

### 3. Markdown schrijven

Werk `copywriter-artikelen/mijn-artikel.md` af:
- Vervang alle bracket-placeholders (bijv. `[beschrijf de situatie]`)
- Houd exact 5 inhoudelijke `##`-koppen
- Laat 1 visueel element in de body staan
- Houd de copywriter-regels leidend (copy-writer.txt + BRIEFING-CONTENT-AGENT.md)

Zet status handmatig op `draft` in `content-topics.json` als je klaar bent.

### 4. Naar review

```bash
npm run content:review -- mijn-artikel
```

Voert basis-validatie uit (waarschuwingen zonder blokkade). Status wordt `review`.

### 5. Goedkeuren

```bash
npm run content:approve -- mijn-artikel
```

Voert strikte validatie uit. **Blokkeert** bij:
- Bracket-placeholders (`[...]`) die nog niet vervangen zijn
- Headlines > 30 tekens
- Ad descriptions > 90 tekens
- Minder dan 5 `##`-koppen
- Verboden woorden
- Letterlijke bewegingskoppen

Bij succes: status wordt `approved`.

### 6. Publiceren

```bash
# Eén artikel publiceren (aanbevolen tijdens ontwikkeling)
node _publish-articles.js --slug mijn-artikel

# Alle goedgekeurde artikelen publiceren
node _publish-articles.js
```

Het script:
1. Verifieert dat het artikel status `approved` heeft
2. Genereert alle 9 Sharp-varianten in `uploads/`
3. Schrijft HTML naar `content/`
4. Update `blog-metadata.json`
5. Zet status automatisch op `published`

Artikelen met een andere status worden **overgeslagen** (niet gepubliceerd, geen fout).

### 7. Deployen

```bash
npm run deploy   # export-static.js + sync naar FTP
```

---

## Validatieregels

| Regel | Drempel | Geblokkeerd bij |
|-------|---------|-----------------|
| Headline lengte | max 30 tekens | `approve` |
| Ad description lengte | max 90 tekens | `approve` |
| Minimum secties | min 5 `##`-koppen | `approve` |
| Bracket-placeholders | geen `[...]` | `approve` |
| Verboden woorden | zie lijst | `approve` |
| Bewegingskoppen letterlijk | niet gebruiken | `approve` |

Bij `review` gelden dezelfde regels maar als **waarschuwing** (geen blokkade).

---

## Veelgemaakte fouten

| Fout | Oorzaak | Oplossing |
|------|---------|-----------|
| Artikel overgeslagen bij publicatie | Status is niet `approved` | `npm run content:approve -- <slug>` |
| Approve blokkeert | Bracket-placeholders niet vervangen | Zoek `[` in het markdown-bestand |
| Geen afbeelding in feed | Sharp-varianten niet gegenereerd | Draai `node _publish-articles.js --slug <slug>` opnieuw |
| FAQ-placeholder ontbreekt | Handmatig HTML gemaakt | Voeg `{{faq_structured_data}}`-blok toe na BlogPosting-schema in `<head>` |
