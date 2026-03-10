# Content machine MVP

Snelle lokale pipeline voor nieuwe artikelen, zonder Gemini-runtime dependency.

## Wat dit doet

`npm run content:scaffold` leest `content-topics.json` en maakt per topic:

- een markdown-scaffold in `copywriter-artikelen/`
- een publish-manifest in `content-machine-manifest.json`
- een status-update in `content-topics.json` (`pending` -> `scaffolded`)

De markdown-scaffold is expres streng ingericht rond de regels uit `copy-writer.txt` en `BRIEFING-CONTENT-AGENT.md`:

- 5-bewegingen structuur
- korte, concrete secties
- verplichte plek voor 1 visueel element
- ad-velden in frontmatter
- publicatie blijft lopen via `_publish-articles.js`

## Workflow

1. Voeg topics toe aan `content-topics.json`
2. Run:

```bash
npm run content:scaffold
```

3. Werk de gegenereerde markdown in `copywriter-artikelen/*.md` af
   - vervang alle bracket-placeholders
   - hou de copywriter-regels leidend
   - laat exact 5 inhoudelijke `##`-koppen staan
   - laat 1 visueel element in de body staan

4. Controleer:

```bash
npm run content:validate
```

5. Publiceer met de bestaande flow:

```bash
node _publish-articles.js
```

Daarna kun je zoals altijd export/deploy doen met de bestaande scripts.

## Waarom `content-machine-manifest.json` bestaat

`_publish-articles.js` had eerst alleen hardcoded `imageMap` en `relatedMap` blokken. De MVP laadt nu ook `content-machine-manifest.json` in en merge die met de bestaande maps.

Dat betekent:

- oude artikelen blijven werken
- nieuwe topics hoeven niet meer handmatig in `_publish-articles.js` gezet te worden
- later kan een AI-stap dezelfde scaffold + manifest invullen

## Wat de validator nu controleert

- headlines max 30 tekens
- ad descriptions max 90 tekens
- minimaal 5 `##`-koppen
- bekende verboden woorden uit `copy-writer.txt`
- geen letterlijke bewegingskoppen zoals `De status quo`

## Grenzen van deze MVP

- schrijft nog geen volledige copy automatisch
- kiest related articles en hero image heuristisch
- valideert simpel, niet semantisch

Dat is bewust. Het doel is een werkende, snelle content-machine die past op de bestaande repo-flow en later eenvoudig uitgebreid kan worden met Gemini of een andere draft-stap.
