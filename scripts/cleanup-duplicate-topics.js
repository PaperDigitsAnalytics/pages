const fs = require('fs');
const path = require('path');
const { scoreTopics } = require('./topic-selection');

const ROOT = path.resolve(__dirname, '..');
const TOPICS_PATH = path.join(ROOT, 'content-topics.json');

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

const topics = readJson(TOPICS_PATH, []);
const scored = scoreTopics(topics);
const threshold = 0.75;
let changed = 0;
for (const topic of scored) {
  if (!['idea', 'scaffolded'].includes(topic.status)) continue;
  if ((topic.duplicateRisk || 0) >= threshold) {
    topic.status = 'rejected_duplicate';
    changed += 1;
  }
}
writeJson(TOPICS_PATH, scored);
console.log(JSON.stringify({ changed, threshold, remainingQueued: scored.filter(t => ['idea','scaffolded'].includes(t.status)).length }, null, 2));
