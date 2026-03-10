const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOPICS_PATH = path.join(ROOT, 'content-topics.json');
const FEEDBACK_PATH = path.join(ROOT, 'feedback.md');
const COPYWRITER_PATH = path.join(ROOT, 'copy-writer.txt');
const MANIFEST_PATH = path.join(ROOT, 'content-machine-manifest.json');
const METADATA_PATH = path.join(ROOT, 'blog-metadata.json');
const OUTPUT_DIR = path.join(ROOT, 'copywriter-artikelen');
const IMAGES_DIR = path.join(ROOT, 'images-pages');

const IMAGE_KEYWORDS = {
  analytics: ['analytics', 'dashboard', 'ga4', 'report', 'retention', 'cohort', 'metrics'],
  google: ['google', 'ads', 'search', 'shopping', 'chrome'],
  gtm: ['tag', 'flowchart', 'wireframe', 'decision', 'checklist'],
  planning: ['roadmap', 'checklist', 'planning', 'brainstorming', 'writing'],
  data: ['data', 'dashboard', 'analytics', 'server', 'drive', 'metrics'],
  social: ['social', 'smartphones', 'phone', 'app'],
};

const BANNED_WORDS = [
  'innovatief',
  'oplossing',
  'oplossingen',
  'optimaliseren',
  'synergie',
  'aggregaatgetal',
  'data-gedreven',
  'end-to-end',
  'best-in-class',
  'gamechanger',
  'ruis',
  'schijnzekere',
  'verkenningsrapport',
  'merkcampagnes',
  'budgetkeuzes',
  'door te schalen',
  'marketingverstand',
  'mist'
];

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function slugToDateText(date = new Date()) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Amsterdam',
  }).format(date);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sentenceCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function limit(value, max) {
  const normalized = String(value || '').trim();
  if (normalized.length <= max) return normalized;
  const clipped = normalized.slice(0, max + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return (lastSpace > Math.floor(max * 0.6) ? clipped.slice(0, lastSpace) : normalized.slice(0, max)).trim();
}

function uniqueId() {
  return Math.floor(100000000 + Math.random() * 900000000);
}

function loadImageNames() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return fs.readdirSync(IMAGES_DIR).filter(name => /\.(jpg|jpeg|png|webp)$/i.test(name));
}

function scoreImage(name, topic) {
  const haystack = `${name} ${topic.slug} ${topic.title} ${(topic.keywords || []).join(' ')} ${topic.category || ''}`.toLowerCase();
  let score = 0;

  for (const keyword of topic.keywords || []) {
    if (name.toLowerCase().includes(keyword.toLowerCase())) score += 4;
  }

  if (haystack.includes('google tag manager') || haystack.includes('gtm')) {
    for (const token of IMAGE_KEYWORDS.gtm) if (name.toLowerCase().includes(token)) score += 2;
  }
  if (haystack.includes('google')) {
    for (const token of IMAGE_KEYWORDS.google) if (name.toLowerCase().includes(token)) score += 2;
  }
  if (haystack.includes('enhanced conversions') || haystack.includes('google ads conversies')) {
    if (name.toLowerCase().includes('google-logo-iphone-desk')) score += 8;
    if (name.toLowerCase().includes('google-search-analytics-mobile')) score += 6;
  }
  if (haystack.includes('analytics') || haystack.includes('ga4') || haystack.includes('bigquery')) {
    for (const token of IMAGE_KEYWORDS.analytics) if (name.toLowerCase().includes(token)) score += 2;
  }
  if (haystack.includes('data')) {
    for (const token of IMAGE_KEYWORDS.data) if (name.toLowerCase().includes(token)) score += 1;
  }

  if (name.toLowerCase().includes('google-logo-iphone-desk')) score += 1;
  if (name.toLowerCase().includes('dashboard')) score += 1;
  return score;
}

function pickImage(topic, images) {
  const best = images
    .map(name => ({ name, score: scoreImage(name, topic) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))[0];
  return best && best.score > 0 ? best.name : (images[0] || null);
}

function findRelated(topic, metadata) {
  const normalizedCategory = (topic.category || '').toLowerCase();
  const keys = (topic.keywords || []).map(k => k.toLowerCase());

  return metadata
    .map(item => {
      const meta = item.metadata || {};
      const text = `${item.filename} ${meta.title || ''} ${meta.description || ''} ${meta.category || ''}`.toLowerCase();
      let score = 0;
      if ((meta.category || '').toLowerCase() === normalizedCategory) score += 3;
      for (const key of keys) if (text.includes(key)) score += 2;
      if (text.includes('gtm') && topic.slug.includes('gtm')) score += 2;
      if (text.includes('google ads') && keys.some(k => k.includes('google ads') || k.includes('enhanced conversions'))) score += 2;
      return {
        slug: meta.slug || item.filename.replace(/\.html$/, ''),
        title: meta.title || item.filename.replace(/\.html$/, ''),
        score,
      };
    })
    .filter(item => item.slug !== topic.slug && item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 5)
    .map(item => [item.slug, item.title]);
}

function buildDescriptions(topic) {
  const keywordText = (topic.keywords || []).slice(0, 3).join(', ');
  const description = `${topic.title} laat zien waar meting of sturing vaak misgaat. Je ziet wat teams al proberen, waar het vastloopt en wat PaperDigits concreet anders doet.`;
  const ad1 = limit(`${topic.title}: minder giswerk in rapportage en meer zicht op wat campagnes echt bijdragen.`, 90);
  const ad2 = limit(`Praktische uitleg over ${keywordText || topic.category || 'marketingdata'} zonder bureaufluff of vaagheden.`, 90);
  const h1 = limit(topic.title, 30);
  const h2 = limit('Minder twijfel in rapportage', 30);
  const h3 = limit('Praktische aanpak van PD', 30);
  return { description, ad1, ad2, h1, h2, h3 };
}

function buildBody(topic) {
  const kw = topic.keywords || [];
  const firstKeyword = kw[0] || topic.title;
  const secondKeyword = kw[1] || topic.category || 'rapportage';

  return `# ${topic.title}

[Open met een herkenbare situatie. Geen vraag. Geen trendopening. Maak direct concreet wat een marketingmanager nu ziet in dashboards, campagnes of overleg.]

## [Beweging 1: status quo als scherpe observatie]

[Beschrijf de huidige situatie. Hou zinnen kort. Noem een concreet voorbeeld uit de praktijk. Laat zien waar ${firstKeyword} of ${secondKeyword} in de dagelijkse sturing wringt.]

## [Beweging 2: wat teams al geprobeerd hebben]

[Noem bekende fixes, tools of workarounds. Denk aan dashboards, extra tags, exports, agencyrapportages of handwerk. Leg uit waarom dat logisch was. Laat daarna zien waarom het gat blijft bestaan.]

## [Beweging 3: het onderliggende idee]

[Leg het principe uit in gewone taal. Gebruik technische termen alleen met directe uitleg tussen haakjes als dat nodig is. Verbind het meteen aan een beslissing, budgetkeuze of rapportagegevolg.]

<!-- Verplicht visueel element: kies hieronder 1 optie en vervang de placeholders. Zet dit na het tweede of derde tekstblok. -->
<section class="hs-impact" aria-labelledby="${topic.slug}-impact-title">
  <h2 id="${topic.slug}-impact-title">[Samenvattende conclusie van de vergelijking]</h2>
  <p class="hs-impact__intro">[1-2 zinnen over wat de lezer ziet.]</p>
  <div class="table-wrap">
    <table class="hs-table">
      <caption class="visually-hidden">Vergelijking oude aanpak versus nieuwe aanpak</caption>
      <thead>
        <tr>
          <th scope="col">Aspect</th>
          <th scope="col" class="num">Huidige aanpak</th>
          <th scope="col" class="num">Betere aanpak</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Rapportagevertrouwen</th>
          <td><div class="mbar is-bad" style="--w:35%"><span class="mbar__label">twijfel</span></div></td>
          <td><div class="mbar is-good" style="--w:85%"><span class="mbar__label">duidelijker</span></div></td>
        </tr>
        <tr>
          <th scope="row">Handmatig werk</th>
          <td><div class="mbar is-bad" style="--w:55%"><span class="mbar__label">veel</span></div></td>
          <td><div class="mbar is-good" style="--w:30%"><span class="mbar__label">minder</span></div></td>
        </tr>
        <tr>
          <th scope="row">Snelheid van bijsturen</th>
          <td><div class="mbar" style="--w:40%"><span class="mbar__label">traag</span></div></td>
          <td><div class="mbar is-good" style="--w:88%"><span class="mbar__label">eerder</span></div></td>
        </tr>
        <tr>
          <th scope="row">Beslissingen over budget</th>
          <td><div class="mbar is-bad" style="--w:45%"><span class="mbar__label">op gevoel</span></div></td>
          <td><div class="mbar is-good" style="--w:90%"><span class="mbar__label">concreter</span></div></td>
        </tr>
      </tbody>
    </table>
    <p class="hs-source">Indicatieve benchmark op basis van PaperDigits cases 2024-2026.</p>
  </div>
</section>

## [Beweging 4: wat PaperDigits concreet doet]

[Schrijf alleen hier over PaperDigits. Maak het operationeel. Wat koppelen we? Wat maken we expliciet? Wat ziet de klant daarna scherper? Geen salespraat.] 

## [Beweging 5: nieuwe situatie in voor/na-termen]

[Gebruik het patroon: Waar je nu X ziet, zie je straks Y. Maak zichtbaar wat sneller, bruikbaarder of eerlijker wordt in rapportage en budgetsturing. Eindig rustig.]
`;
}

function buildFrontmatter(topic, imageName, related, existingManifestEntry) {
  const now = new Date();
  const timestamp = now.toISOString();
  const ts = existingManifestEntry?.ts || now.getTime();
  const id = existingManifestEntry?.id || uniqueId();
  const descriptions = buildDescriptions(topic);
  const readCount = existingManifestEntry?.readCount || 0;

  return {
    filename: `${topic.slug}.html`,
    slug: topic.slug,
    timestamp,
    title: topic.title,
    description: descriptions.description,
    adDescription: descriptions.ad1,
    adDescription2: descriptions.ad2,
    headline1: descriptions.h1,
    headline2: descriptions.h2,
    headline3: descriptions.h3,
    category: topic.category || 'Digital Marketing',
    author: 'Wouter Naber',
    date: slugToDateText(now),
    readCount,
    heroImage: imageName ? `images-pages/${imageName}` : 'images-pages/[kies-afbeelding.jpg]',
    heroImageAlt: `${topic.title} voor PaperDigits`,
    _machine: {
      selectedImage: imageName,
      related,
      ts,
      id,
    },
  };
}

function renderMarkdown(frontmatter, body) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === '_machine') continue;
    lines.push(`${key}: ${String(value)}`);
  }
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
}

function ensureManifest() {
  return readJson(MANIFEST_PATH, { imageMap: {}, relatedMap: {} });
}

function updateManifest(manifest, topic, frontmatter) {
  manifest.imageMap[topic.slug] = {
    img: frontmatter._machine.selectedImage,
    readCount: Number(frontmatter.readCount || 0),
    ts: frontmatter._machine.ts,
    id: frontmatter._machine.id,
  };
  manifest.relatedMap[topic.slug] = frontmatter._machine.related;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > -1) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: match[2] };
}

function validateFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(raw);
  if (!parsed) return [`${path.basename(filePath)}: geen geldige frontmatter`];

  const issues = [];
  const { meta, body } = parsed;
  ['headline1', 'headline2', 'headline3'].forEach(key => {
    if ((meta[key] || '').length > 30) issues.push(`${path.basename(filePath)}: ${key} langer dan 30 tekens`);
  });
  ['adDescription', 'adDescription2'].forEach(key => {
    if ((meta[key] || '').length > 90) issues.push(`${path.basename(filePath)}: ${key} langer dan 90 tekens`);
  });
  if ((body.match(/^## /gm) || []).length < 5) issues.push(`${path.basename(filePath)}: minder dan 5 h2-secties`);
  const lower = body.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) issues.push(`${path.basename(filePath)}: verboden woord/zin gevonden: ${word}`);
  }
  if (lower.includes('## de status quo') || lower.includes('## wat ze al geprobeerd hebben')) {
    issues.push(`${path.basename(filePath)}: bewegingstitels mogen niet letterlijk gebruikt worden`);
  }
  return issues;
}

function scaffoldTopics() {
  const topics = readJson(TOPICS_PATH, []);
  const metadata = readJson(METADATA_PATH, []);
  const manifest = ensureManifest();
  const images = loadImageNames();
  const created = [];
  const skipped = [];

  for (const topic of topics) {
    if (!topic.slug || !topic.title) {
      skipped.push(`topic zonder slug/title overgeslagen`);
      continue;
    }

    const filePath = path.join(OUTPUT_DIR, `${topic.slug}.md`);
    if (fs.existsSync(filePath)) {
      skipped.push(`${topic.slug} bestaat al`);
      if (!manifest.imageMap[topic.slug]) {
        const existingImage = pickImage(topic, images);
        const related = findRelated(topic, metadata);
        const fm = buildFrontmatter(topic, existingImage, related, manifest.imageMap[topic.slug]);
        updateManifest(manifest, topic, fm);
      }
      if (topic.status === 'pending') topic.status = 'scaffolded';
      continue;
    }

    const selectedImage = pickImage(topic, images);
    const related = findRelated(topic, metadata);
    const frontmatter = buildFrontmatter(topic, selectedImage, related, manifest.imageMap[topic.slug]);
    const markdown = renderMarkdown(frontmatter, buildBody(topic));

    fs.writeFileSync(filePath, markdown, 'utf8');
    updateManifest(manifest, topic, frontmatter);
    topic.status = 'scaffolded';
    created.push({ slug: topic.slug, file: path.relative(ROOT, filePath), image: selectedImage, related: related.length });
  }

  writeJson(TOPICS_PATH, topics);
  writeJson(MANIFEST_PATH, manifest);

  return { created, skipped };
}

function validateTopics() {
  const topics = readJson(TOPICS_PATH, []);
  const files = topics
    .map(topic => path.join(OUTPUT_DIR, `${topic.slug}.md`))
    .filter(file => fs.existsSync(file));

  const issues = files.flatMap(validateFile);
  return { files: files.length, issues };
}

function printUsage() {
  console.log(`Content machine\n\nCommands:\n  node scripts/content-machine.js scaffold   Maak markdown-scaffolds + manifest voor topics\n  node scripts/content-machine.js validate   Controleer copywriter-regels op gegenereerde markdown\n`);
}

function main() {
  const command = process.argv[2] || 'scaffold';

  if (command === 'scaffold') {
    const result = scaffoldTopics();
    console.log('Scaffold klaar.');
    result.created.forEach(item => console.log(`+ ${item.slug} -> ${item.file} | image: ${item.image || 'geen'} | related: ${item.related}`));
    result.skipped.forEach(item => console.log(`- ${item}`));
    console.log(`Manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
    return;
  }

  if (command === 'validate') {
    const result = validateTopics();
    console.log(`Gecontroleerd: ${result.files} markdown-bestanden`);
    if (!result.issues.length) {
      console.log('Geen blokkerende issues gevonden.');
      return;
    }
    result.issues.forEach(issue => console.log(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main();
