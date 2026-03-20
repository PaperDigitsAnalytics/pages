const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const topicsPath = path.join(ROOT, 'content-topics.json');
const metadataPath = path.join(ROOT, 'blog-metadata.json');
const mdDir = path.join(ROOT, 'copywriter-artikelen');
const contentDir = path.join(ROOT, 'content');

function stableReadCount(slug) {
  let hash = 0;
  for (const ch of slug) hash = ((hash * 31) + ch.charCodeAt(0)) >>> 0;
  return 200 + (hash % 301); // 200..500
}

function updateFrontmatter(content, newReadCount) {
  if (!content.startsWith('---\n')) return content;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return content;
  const fm = content.slice(4, end).split('\n');
  let found = false;
  const updated = fm.map(line => {
    if (line.startsWith('readCount:')) {
      found = true;
      return `readCount: ${newReadCount}`;
    }
    return line;
  });
  if (!found) updated.push(`readCount: ${newReadCount}`);
  return `---\n${updated.join('\n')}\n---\n${content.slice(end + 5)}`;
}

function main() {
  const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  const slugToCount = new Map();

  for (const topic of topics) {
    const count = stableReadCount(topic.slug);
    topic.readCount = count;
    slugToCount.set(topic.slug, count);
  }

  for (const entry of metadata) {
    const meta = entry.metadata || (entry.metadata = {});
    const slug = meta.slug || entry.filename.replace(/\.html$/, '');
    const count = stableReadCount(slug);
    meta.readCount = String(count);
    slugToCount.set(slug, count);
  }

  for (const [slug, count] of slugToCount) {
    const mdPath = path.join(mdDir, `${slug}.md`);
    if (fs.existsSync(mdPath)) {
      const raw = fs.readFileSync(mdPath, 'utf8');
      const next = updateFrontmatter(raw, count);
      if (next !== raw) fs.writeFileSync(mdPath, next, 'utf8');
    }

    const htmlPath = path.join(contentDir, `${slug}.html`);
    if (fs.existsSync(htmlPath)) {
      const raw = fs.readFileSync(htmlPath, 'utf8');
      const next = raw.replace(/<span class="meta-item">\s*\d+\s*x gelezen<\/span>/, `<span class="meta-item">${count} x gelezen</span>`);
      if (next !== raw) fs.writeFileSync(htmlPath, next, 'utf8');
    }
  }

  fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2) + '\n', 'utf8');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  const sample = Array.from(slugToCount.entries()).slice(0, 10).map(([slug, count]) => ({ slug, readCount: count }));
  console.log(`Normalized ${slugToCount.size} article readCounts to 200-500.`);
  console.log(JSON.stringify(sample, null, 2));
}

main();
