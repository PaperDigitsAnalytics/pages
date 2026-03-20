const fs = require('fs');
const path = require('path');
const { fallbackMeta } = require('./frontmatter-helpers');

function parseFrontmatter(raw) {
  const match = String(raw || '').match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);
  if (!match) return null;
  const fields = {};
  for (const line of match[2].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > -1) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { start: match[1], fields, sep: match[3], body: match[4] };
}

function repairFrontmatter(raw, topic) {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return { changed: false, content: raw };
  const defaults = fallbackMeta(topic, parsed.fields);
  const required = ['title','description','adDescription','adDescription2','headline1','headline2','headline3','heroImageAlt'];
  let changed = false;
  for (const key of required) {
    if (!String(parsed.fields[key] || '').trim()) {
      parsed.fields[key] = defaults[key];
      changed = true;
    }
  }
  const order = ['filename','slug','timestamp','title','description','adDescription','adDescription2','headline1','headline2','headline3','category','author','date','readCount','heroImage','heroImageAlt'];
  const lines = order.filter(k => parsed.fields[k] !== undefined).map(k => `${k}: ${parsed.fields[k]}`);
  return { changed, content: parsed.start + lines.join('\n') + parsed.sep + parsed.body };
}

if (require.main === module) {
  const file = process.argv[2];
  const topicJson = process.argv[3];
  if (!file || !topicJson) process.exit(2);
  const raw = fs.readFileSync(path.resolve(file), 'utf8');
  const result = repairFrontmatter(raw, JSON.parse(topicJson));
  if (result.changed) fs.writeFileSync(path.resolve(file), result.content, 'utf8');
  console.log(JSON.stringify({ changed: result.changed }, null, 2));
}

module.exports = { repairFrontmatter };
