const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_DIR = path.join(ROOT, 'logs', 'nightly-content');
const SUMMARY_PATH = path.join(LOG_DIR, 'latest-summary.json');

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeSummary(summary) {
  ensureDir(LOG_DIR);
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  const raw = process.argv[2];
  if (!raw) process.exit(2);
  writeSummary(JSON.parse(raw));
}

module.exports = { writeSummary, SUMMARY_PATH };
