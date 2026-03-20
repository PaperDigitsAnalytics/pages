const fs = require('fs');
const path = require('path');
const { scoreTopics } = require('./topic-selection');

const ROOT = path.resolve(__dirname, '..');
const TOPICS_PATH = path.join(ROOT, 'content-topics.json');
const IDEAS_PATH = path.join(ROOT, 'artikel-ideeen.txt');

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
function titleCaseDutch(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function inferCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('gtm') || t.includes('google tag manager') || t.includes('consent mode') || t.includes('pixel') || t.includes('tag ')) return 'Google Tag Manager';
  if (t.includes('ga4') || t.includes('looker studio') || t.includes('dashboard') || t.includes('utm') || t.includes('attributie')) return 'Analytics';
  if (t.includes('bigquery')) return 'BigQuery';
  if (t.includes('seo')) return 'SEO';
  if (t.includes('cro') || t.includes('landingspagina')) return 'Conversion Rate Optimization';
  return 'Digital Marketing';
}
function inferKeywords(text) {
  const cleaned = String(text || '').toLowerCase().replace(/[,:]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleaned.split(' ').filter(Boolean);
  const phrases = [];
  phrases.push(cleaned);
  if (cleaned.includes(' via ')) phrases.push(cleaned.split(' via ')[0].trim());
  if (cleaned.includes(' met ')) phrases.push(cleaned.split(' met ')[0].trim());
  if (tokens.length >= 2) phrases.push(tokens.slice(0, 2).join(' '));
  if (tokens.length >= 3) phrases.push(tokens.slice(0, 3).join(' '));
  const uniq = [];
  for (const p of phrases.map(x => x.trim()).filter(Boolean)) {
    if (!uniq.includes(p)) uniq.push(p);
    if (uniq.length >= 3) break;
  }
  return uniq;
}
function loadIdeas() {
  if (!fs.existsSync(IDEAS_PATH)) return [];
  return fs.readFileSync(IDEAS_PATH, 'utf8')
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => !x.startsWith('#'));
}
function main() {
  const topics = readJson(TOPICS_PATH, []);
  const ideas = loadIdeas();
  const existingSlugs = new Set(topics.map(t => t.slug));
  const existingTitles = new Set(topics.map(t => String(t.title || '').toLowerCase()));
  let added = 0;
  for (const idea of ideas) {
    const slug = slugify(idea);
    const title = titleCaseDutch(idea);
    if (!slug) continue;
    if (existingSlugs.has(slug) || existingTitles.has(title.toLowerCase())) continue;
    topics.push({
      slug,
      title,
      category: inferCategory(idea),
      keywords: inferKeywords(idea),
      status: 'idea'
    });
    existingSlugs.add(slug);
    existingTitles.add(title.toLowerCase());
    added += 1;
  }
  const rescored = scoreTopics(topics).sort((a,b) => (b.pipelineScore || 0) - (a.pipelineScore || 0));
  writeJson(TOPICS_PATH, rescored);
  console.log(JSON.stringify({ added, total: rescored.length, queued: rescored.filter(x => ['idea','scaffolded'].includes(x.status)).length }, null, 2));
}

main();
