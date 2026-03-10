# PaperDigits Blog CMS

Een eenvoudige, statische blog CMS voor PaperDigits. Dit project genereert statische HTML bestanden die direct op een webserver kunnen worden gehost.

## 🚀 Snelle Start

### 1. Installeer dependencies
```bash
npm install
```

### 2. Start de CMS server
```bash
npm start
```

### 3. Open de CMS
Ga naar `http://localhost:3001/cms.html` in je browser.

## 📁 Project Structuur

```
pages v2/
├── 📄 cms.html              # CMS interface
├── 📄 cms.js               # CMS frontend JavaScript
├── 📄 server.js            # CMS backend server
├── 📄 styles.css           # Styling voor blog
├── 📄 cms-styles.css       # Styling voor CMS
├── 📄 export-static.js     # Statische export tool
├── 📁 content/             # Gegenereerde blog posts
├── 📁 images/              # Statische afbeeldingen
├── 📁 uploads/             # Geüploade afbeeldingen
└── 📁 static-export/       # Statische versie (gegenereerd)
    ├── 📄 index.html       # Blog overzicht (hoofdpagina)
    ├── 📄 posts.json       # Blog data
    ├── 📄 posts.js         # Blog data (JS)
    └── 📁 content/         # Blog posts
```

## 🔄 Workflow

### Content Toevoegen
1. **Start de server**: `npm start`
2. **Open CMS**: `http://localhost:3001/cms.html`
3. **Maak nieuwe post**: Vul het formulier in
4. **Upload afbeeldingen**: Via de CMS interface
5. **Sla op**: Content wordt opgeslagen in `content/` map

### Statische Versie Genereren
```bash
node export-static.js
```

Dit genereert:
- Geoptimaliseerde afbeeldingen
- Responsive image sets
- Statische HTML bestanden
- Blog overzicht pagina

### Deployen
1. **Genereer statische versie**: `node export-static.js`
2. **Upload `static-export/` map** naar je hosting
3. **Of gebruik**: `deploy.bat` (Windows) of `deploy.sh` (Unix/Mac)

## 🎯 Wanneer gebruik je `export-static.js`?

Je hebt `export-static.js` nodig wanneer je:

- **Nieuwe content toevoegt** via de CMS
- **De blog-overview wilt updaten** met nieuwe posts  
- **Geoptimaliseerde images wilt genereren** voor productie
- **De statische versie wilt deployen** naar je hosting
- **Cache busting wilt updaten** voor CSS/JS bestanden

## 📝 Content Management

### Via CMS (Aanbevolen)
- Gebruik `http://localhost:3001/cms.html`
- Automatische image optimalisatie
- Responsive image generatie
- Metadata management

### Handmatig
- Voeg HTML bestanden toe aan `content/` map
- Update `blog-metadata.json` handmatig
- Run `export-static.js` om te genereren

## 🛠️ Technische Details

### Backend (server.js)
- Express.js server op poort 3001
- Image upload met Multer
- Image optimalisatie met Sharp
- Responsive image generatie
- Content opslag in `content/` map

### Frontend (cms.js)
- Vanilla JavaScript CMS
- HTML textarea editor
- Image upload interface
- Preview functionaliteit
- File management

### Statische Export (export-static.js)
- Kopieert content naar `static-export/`
- Genereert geoptimaliseerde afbeeldingen
- Maakt responsive image sets
- Update cache busting parameters

## 🌐 Deployment

### Optie 1: Statische Hosting
1. Run `node export-static.js`
2. Upload `static-export/` map naar je hosting
3. Geen server nodig op hosting

### Optie 2: CMS + Statische Export
1. Host de CMS op een server
2. Genereer statische versie voor productie
3. Upload statische versie naar CDN/hosting

## 📋 Vereisten

- Node.js 14+
- npm
- FTP toegang voor deployment

## 🔧 Troubleshooting

- **CMS laadt niet**: Check of `npm start` draait
- **Images uploaden niet**: Check uploads/ map permissions
- **Export faalt**: Check of alle dependencies geïnstalleerd zijn
- **Deploy werkt niet**: Check FTP credentials in deploy scripts