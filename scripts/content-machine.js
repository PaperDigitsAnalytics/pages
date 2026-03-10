const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOPICS_PATH = path.join(ROOT, 'content-topics.json');
const METADATA_PATH = path.join(ROOT, 'blog-metadata.json');
const OUTPUT_DIR = path.join(ROOT, 'copywriter-artikelen');
const IMAGES_DIR = path.join(ROOT, 'images-pages');

const STATUS_FLOW = ['idea', 'scaffolded', 'draft', 'review', 'approved', 'published', 'live'];
// States where placeholder brackets [text] are NOT allowed
const STRICT_STATES = ['review', 'approved', 'published', 'live'];

const REQUIRED_FM = [
  'filename', 'slug', 'title', 'description',
  'adDescription', 'adDescription2',
  'headline1', 'headline2', 'headline3',
  'category', 'author', 'date', 'heroImageAlt',
];

const BANNED_WORDS = [
  'innovatief', 'oplossing', 'oplossingen', 'optimaliseren', 'synergie',
  'aggregaatgetal', 'data-gedreven', 'end-to-end', 'best-in-class', 'gamechanger',
  'ruis', 'schijnzekere', 'verkenningsrapport', 'merkcampagnes', 'budgetkeuzes',
  'door te schalen', 'marketingverstand', 'mist',
];

const IMAGE_KEYWORDS = {
  analytics: ['analytics', 'dashboard', 'ga4', 'report', 'retention', 'cohort', 'metrics'],
  google: ['google', 'ads', 'search', 'shopping', 'chrome'],
  gtm: ['tag', 'flowchart', 'wireframe', 'decision', 'checklist'],
  planning: ['roadmap', 'checklist', 'planning', 'brainstorming', 'writing'],
  data: ['data', 'dashboard', 'analytics', 'server', 'drive', 'metrics'],
  social: ['social', 'smartphones', 'phone', 'app'],
};

// ── helpers ─────────────────────────────────────────────────────────────────

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function slugToDateText(date = new Date()) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam',
  }).format(date);
}

function limit(value, max) {
  const s = String(value || '').trim();
  if (s.length <= max) return s;
  const clipped = s.slice(0, max + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return (lastSpace > Math.floor(max * 0.6) ? clipped.slice(0, lastSpace) : s.slice(0, max)).trim();
}

function uniqueId() {
  return Math.floor(100000000 + Math.random() * 900000000);
}

function loadImageNames() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return fs.readdirSync(IMAGES_DIR).filter(n => /\.(jpg|jpeg|png|webp)$/i.test(n));
}

function scoreImage(name, topic) {
  const haystack = `${name} ${topic.slug} ${topic.title} ${(topic.keywords || []).join(' ')} ${topic.category || ''}`.toLowerCase();
  let score = 0;
  for (const kw of topic.keywords || []) {
    if (name.toLowerCase().includes(kw.toLowerCase())) score += 4;
  }
  if (haystack.includes('google tag manager') || haystack.includes('gtm'))
    for (const t of IMAGE_KEYWORDS.gtm) if (name.toLowerCase().includes(t)) score += 2;
  if (haystack.includes('google'))
    for (const t of IMAGE_KEYWORDS.google) if (name.toLowerCase().includes(t)) score += 2;
  if (haystack.includes('enhanced conversions') || haystack.includes('google ads conversies')) {
    if (name.toLowerCase().includes('google-logo-iphone-desk')) score += 8;
    if (name.toLowerCase().includes('google-search-analytics-mobile')) score += 6;
  }
  if (haystack.includes('analytics') || haystack.includes('ga4') || haystack.includes('bigquery'))
    for (const t of IMAGE_KEYWORDS.analytics) if (name.toLowerCase().includes(t)) score += 2;
  if (haystack.includes('data'))
    for (const t of IMAGE_KEYWORDS.data) if (name.toLowerCase().includes(t)) score += 1;
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
  const normCat = (topic.category || '').toLowerCase();
  const keys = (topic.keywords || []).map(k => k.toLowerCase());
  return metadata
    .map(item => {
      const meta = item.metadata || {};
      const text = `${item.filename} ${meta.title || ''} ${meta.description || ''} ${meta.category || ''}`.toLowerCase();
      let score = 0;
      if ((meta.category || '').toLowerCase() === normCat) score += 3;
      for (const k of keys) if (text.includes(k)) score += 2;
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
  const kwText = (topic.keywords || []).slice(0, 3).join(', ');
  return {
    description: `${topic.title} laat zien waar meting of sturing vaak misgaat. Je ziet wat teams al proberen, waar het vastloopt en wat PaperDigits concreet anders doet.`,
    ad1: limit(`${topic.title}: minder giswerk in rapportage en meer zicht op wat campagnes echt bijdragen.`, 90),
    ad2: limit(`Praktische uitleg over ${kwText || topic.category || 'marketingdata'} zonder bureaufluff of vaagheden.`, 90),
    h1: limit(topic.title, 30),
    h2: limit('Minder twijfel in rapportage', 30),
    h3: limit('Praktische aanpak van PD', 30),
  };
}

function buildBody(topic) {
  const kw = topic.keywords || [];
  const k1 = kw[0] || topic.title;
  const k2 = kw[1] || topic.category || 'rapportage';
  return `# ${topic.title}

[Open met een herkenbare situatie. Geen vraag. Geen trendopening. Maak direct concreet wat een marketingmanager nu ziet in dashboards, campagnes of overleg.]

## [Beweging 1: status quo als scherpe observatie]

[Beschrijf de huidige situatie. Hou zinnen kort. Noem een concreet voorbeeld uit de praktijk. Laat zien waar ${k1} of ${k2} in de dagelijkse sturing wringt.]

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

function renderMarkdown(frontmatter, body) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${String(value)}`);
  }
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
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

// ── validation ───────────────────────────────────────────────────────────────

function validateFile(filePath, topicStatus = null) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(raw);
  const name = path.basename(filePath);
  if (!parsed) return [`${name}: geen geldige frontmatter`];

  const issues = [];
  const { meta, body } = parsed;

  // Required frontmatter fields
  for (const field of REQUIRED_FM) {
    if (!meta[field] || !meta[field].trim()) {
      issues.push(`${name}: verplicht veld ontbreekt: ${field}`);
    }
  }

  // Ad/headline lengths
  ['headline1', 'headline2', 'headline3'].forEach(k => {
    if ((meta[k] || '').length > 30) issues.push(`${name}: ${k} langer dan 30 tekens (${(meta[k] || '').length})`);
  });
  ['adDescription', 'adDescription2'].forEach(k => {
    if ((meta[k] || '').length > 90) issues.push(`${name}: ${k} langer dan 90 tekens (${(meta[k] || '').length})`);
  });

  // Content checks
  if ((body.match(/^## /gm) || []).length < 5) {
    issues.push(`${name}: minder dan 5 h2-secties`);
  }

  const lower = body.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) issues.push(`${name}: verboden woord gevonden: "${word}"`);
  }

  if (lower.includes('## de status quo') || lower.includes('## wat ze al geprobeerd hebben')) {
    issues.push(`${name}: bewegingstitels mogen niet letterlijk gebruikt worden`);
  }

  // Placeholder bracket check for strict states
  if (STRICT_STATES.includes(topicStatus)) {
    // Match [text] NOT followed by ( (to avoid counting markdown links)
    const placeholders = [...body.matchAll(/\[([^\]]+)\](?!\()/g)]
      .filter(m => !m[1].startsWith('!')) // skip image alt in markdown
      .map(m => m[0]);
    if (placeholders.length > 0) {
      issues.push(`${name}: ${placeholders.length} placeholder(s) gevonden in status '${topicStatus}' — verwijder bracket-tekst vóór publicatie`);
    }
  }

  // Image existence check (only if img is set on the topic)
  // (Checked separately in validateTopics)

  return issues;
}

// ── commands ─────────────────────────────────────────────────────────────────

function cmdScaffold() {
  const topics = readJson(TOPICS_PATH, []);
  const metadata = readJson(METADATA_PATH, []);
  const images = loadImageNames();
  const created = [];
  const skipped = [];

  for (const topic of topics) {
    if (!topic.slug || !topic.title) {
      skipped.push('topic zonder slug/title overgeslagen');
      continue;
    }

    const filePath = path.join(OUTPUT_DIR, `${topic.slug}.md`);

    if (fs.existsSync(filePath)) {
      skipped.push(`${topic.slug} bestaat al`);
      // Ensure topic has img/ts/id/related if missing
      if (!topic.img) topic.img = pickImage(topic, images);
      if (!topic.ts) topic.ts = Date.now();
      if (!topic.id) topic.id = uniqueId();
      if (!topic.related) topic.related = findRelated(topic, metadata);
      if (topic.status === 'idea') topic.status = 'scaffolded';
      continue;
    }

    const selectedImage = pickImage(topic, images);
    const related = findRelated(topic, metadata);
    const ts = topic.ts || Date.now();
    const id = topic.id || uniqueId();
    const descriptions = buildDescriptions(topic);

    const frontmatter = {
      filename: `${topic.slug}.html`,
      slug: topic.slug,
      timestamp: new Date(ts).toISOString(),
      title: topic.title,
      description: descriptions.description,
      adDescription: descriptions.ad1,
      adDescription2: descriptions.ad2,
      headline1: descriptions.h1,
      headline2: descriptions.h2,
      headline3: descriptions.h3,
      category: topic.category || 'Digital Marketing',
      author: 'Wouter Naber',
      date: slugToDateText(),
      readCount: topic.readCount || 0,
      heroImage: selectedImage ? `images-pages/${selectedImage}` : 'images-pages/[kies-afbeelding.jpg]',
      heroImageAlt: `${topic.title} voor PaperDigits`,
    };

    const markdown = renderMarkdown(frontmatter, buildBody(topic));
    fs.writeFileSync(filePath, markdown, 'utf8');

    // Write image/related data into topic entry
    topic.img = selectedImage;
    topic.ts = ts;
    topic.id = id;
    topic.related = related;
    topic.status = 'scaffolded';

    created.push({ slug: topic.slug, file: path.relative(ROOT, filePath), image: selectedImage, related: related.length });
  }

  writeJson(TOPICS_PATH, topics);

  console.log('Scaffold klaar.');
  created.forEach(item => console.log(`+ ${item.slug} -> ${item.file} | image: ${item.image || 'geen'} | related: ${item.related}`));
  skipped.forEach(item => console.log(`- ${item}`));
}

function cmdValidate(filterSlug = null) {
  const topics = readJson(TOPICS_PATH, []);
  const images = loadImageNames();
  let checked = 0;
  const issues = [];

  for (const topic of topics) {
    if (filterSlug && topic.slug !== filterSlug) continue;
    const filePath = path.join(OUTPUT_DIR, `${topic.slug}.md`);
    if (!fs.existsSync(filePath)) {
      issues.push(`${topic.slug}: markdown-bestand niet gevonden`);
      continue;
    }
    checked++;
    const fileIssues = validateFile(filePath, topic.status);
    issues.push(...fileIssues);

    // Image existence check
    if (topic.img && !images.includes(topic.img)) {
      issues.push(`${topic.slug}: afbeelding '${topic.img}' niet gevonden in images-pages/`);
    }
  }

  console.log(`Gecontroleerd: ${checked} bestand(en)`);
  if (!issues.length) {
    console.log('Geen issues gevonden.');
    return;
  }
  issues.forEach(issue => console.log(`- ${issue}`));
  process.exitCode = 1;
}

function cmdStatus() {
  const topics = readJson(TOPICS_PATH, []);
  if (!topics.length) { console.log('Geen topics gevonden.'); return; }

  const maxSlug = Math.max(...topics.map(t => t.slug.length), 4);
  const maxStatus = Math.max(...topics.map(t => (t.status || '').length), 6);

  console.log(`\n${'SLUG'.padEnd(maxSlug)}  ${'STATUS'.padEnd(maxStatus)}  IMG`);
  console.log('-'.repeat(maxSlug + maxStatus + 8));

  for (const topic of topics) {
    const img = topic.img ? '✓' : '✗';
    const related = topic.related ? `${topic.related.length} related` : 'geen related';
    console.log(`${topic.slug.padEnd(maxSlug)}  ${(topic.status || '?').padEnd(maxStatus)}  ${img}  ${related}`);
  }
  console.log('');
}

function cmdTransition(slug, fromStates, toStatus) {
  const topics = readJson(TOPICS_PATH, []);
  const topic = topics.find(t => t.slug === slug);
  if (!topic) { console.error(`Topic niet gevonden: ${slug}`); process.exitCode = 1; return; }

  const current = topic.status || '';
  if (!fromStates.includes(current)) {
    console.error(`${slug}: status is '${current}', verwacht: ${fromStates.join(' of ')}`);
    process.exitCode = 1;
    return;
  }

  topic.status = toStatus;
  writeJson(TOPICS_PATH, topics);
  console.log(`${slug}: ${current} → ${toStatus}`);
}

function cmdReview(slug) {
  // Run validate first and warn
  const topics = readJson(TOPICS_PATH, []);
  const topic = topics.find(t => t.slug === slug);
  if (!topic) { console.error(`Topic niet gevonden: ${slug}`); process.exitCode = 1; return; }

  const filePath = path.join(OUTPUT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    console.error(`Markdown-bestand niet gevonden: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  // Validate at draft level (no strict placeholder check yet)
  const issues = validateFile(filePath, 'draft');
  if (issues.length) {
    console.log(`Waarschuwingen voor ${slug}:`);
    issues.forEach(i => console.log(`  - ${i}`));
  }

  cmdTransition(slug, ['draft', 'scaffolded'], 'review');
}

function cmdApprove(slug) {
  // Run strict validation before approving
  const topics = readJson(TOPICS_PATH, []);
  const topic = topics.find(t => t.slug === slug);
  if (!topic) { console.error(`Topic niet gevonden: ${slug}`); process.exitCode = 1; return; }

  const filePath = path.join(OUTPUT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    console.error(`Markdown-bestand niet gevonden: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  // Validate at review level (strict: checks placeholders)
  const issues = validateFile(filePath, 'review');
  if (issues.length) {
    console.error(`${slug} kan niet worden goedgekeurd — los eerst deze issues op:`);
    issues.forEach(i => console.error(`  - ${i}`));
    process.exitCode = 1;
    return;
  }

  cmdTransition(slug, ['review'], 'approved');
}

function cmdReject(slug) {
  cmdTransition(slug, ['review', 'approved'], 'draft');
}

function printUsage() {
  console.log(`
Content machine

Commands:
  scaffold              Maak scaffolds voor nieuwe topics in content-topics.json
  validate [slug]       Controleer copywriter-regels (alle of één slug)
  status                Overzicht van alle topics met status
  review <slug>         Zet topic van draft/scaffolded naar review
  approve <slug>        Zet topic van review naar approved (blokkeert bij issues)
  reject <slug>         Zet topic van review/approved terug naar draft

Status flow:
  idea → scaffolded → draft → review → approved → published → live

Publishing:
  node _publish-articles.js verwerkt alleen articles met status 'approved'.
  Na publicatie wordt status automatisch 'published'.
`);
}

function main() {
  const [,, command, arg] = process.argv;

  if (!command || command === 'help') { printUsage(); return; }
  if (command === 'scaffold') { cmdScaffold(); return; }
  if (command === 'validate') { cmdValidate(arg || null); return; }
  if (command === 'status') { cmdStatus(); return; }
  if (command === 'review') {
    if (!arg) { console.error('Gebruik: content-machine.js review <slug>'); process.exitCode = 1; return; }
    cmdReview(arg); return;
  }
  if (command === 'approve') {
    if (!arg) { console.error('Gebruik: content-machine.js approve <slug>'); process.exitCode = 1; return; }
    cmdApprove(arg); return;
  }
  if (command === 'reject') {
    if (!arg) { console.error('Gebruik: content-machine.js reject <slug>'); process.exitCode = 1; return; }
    cmdReject(arg); return;
  }

  console.error(`Onbekend commando: ${command}`);
  printUsage();
  process.exitCode = 1;
}

main();
