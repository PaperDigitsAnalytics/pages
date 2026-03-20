const fs = require('fs');
const path = require('path');

const BANNED_PHRASES = [
  'steeds complexer digitaal landschap',
  'data-gedreven besluitvorming',
  'voorop willen blijven lopen',
  'versnipperde databronnen',
  'gemiste kansen',
  'innovatieve oplossing',
  'onmisbaar voor',
  'naar een hoger niveau tilt',
  'slimme modellen',
  'realtime inzichten',
  'betere resultaten',
  'end-to-end',
  'gamechanger'
];

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

function sentences(text) {
  return String(text || '').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

function checkFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(raw);
  if (!parsed) return ['geen geldige frontmatter'];

  const issues = [];
  const body = parsed.body.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (body.includes(phrase)) issues.push(`verboden frase: ${phrase}`);
  }

  const sents = sentences(parsed.body);
  const long = sents.filter(s => s.length > 240).length;
  if (long > 3) issues.push(`te veel lange zinnen (${long})`);

  const markdownOnlyBody = parsed.body.replace(/<section[\s\S]*?<\/section>/gi, '');
  const h2s = (markdownOnlyBody.match(/^## /gm) || []).length;
  if (h2s < 5) issues.push(`verwacht minimaal 5 h2-koppen, kreeg ${h2s}`);

  const paperDigitsMentions = (parsed.body.match(/paperdigits/gi) || []).length;
  if (paperDigitsMentions > 3) issues.push(`te vaak PaperDigits genoemd (${paperDigitsMentions})`);

  const introChunk = parsed.body.split(/^## /m)[0] || '';
  if (/\?/.test(introChunk)) issues.push('intro gebruikt vraagteken / te veel vraagopening');

  return issues;
}

function resultForFile(filePath) {
  const issues = checkFile(filePath);
  return { ok: issues.length === 0, issues };
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/quality-gate.js <markdown-file>');
    process.exit(2);
  }

  const result = resultForFile(path.resolve(filePath));
  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

module.exports = { checkFile, resultForFile };
