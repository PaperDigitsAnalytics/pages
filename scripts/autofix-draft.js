const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function splitFrontmatter(markdown) {
  const match = String(markdown || '').match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: String(markdown || '') };
  return { frontmatter: match[1], body: match[2] };
}

function autofixMarkdown(raw) {
  const { frontmatter, body } = splitFrontmatter(raw);
  if (!frontmatter) return { changed: false, content: raw, fixes: ['missing frontmatter'] };
  let next = body;
  const fixes = [];

  const replacements = [
    [/ruis/gi, 'verlies'],
    [/budgetkeuzes/gi, 'bijsturen'],
    [/steeds complexer digitaal landschap/gi, 'praktijk'],
    [/data-gedreven besluitvorming/gi, 'besluiten op basis van data'],
    [/gemiste kansen/gi, 'blinde vlekken'],
    [/naar een hoger niveau tilt/gi, 'sterker maakt']
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement);
      fixes.push(`replace:${pattern}`);
    }
  }

  next = next.replace(/<h2(\s|>)/gi, '<h3$1');
  next = next.replace(/<\/h2>/gi, '</h3>');

  const changed = next !== body;
  return { changed, content: frontmatter + next, fixes };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) process.exit(2);
  const full = path.resolve(file);
  const raw = fs.readFileSync(full, 'utf8');
  const result = autofixMarkdown(raw);
  if (result.changed) fs.writeFileSync(full, result.content, 'utf8');
  console.log(JSON.stringify({ changed: result.changed, fixes: result.fixes }, null, 2));
}

module.exports = { autofixMarkdown, splitFrontmatter };
