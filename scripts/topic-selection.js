const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOPICS_PATH = path.join(ROOT, 'content-topics.json');
const METADATA_PATH = path.join(ROOT, 'blog-metadata.json');
const CLUSTERS_PATH = path.join(ROOT, 'content-clusters.json');

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}
function jaccard(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  const inter = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union ? inter / union : 0;
}
function inferCluster(topic, clusters) {
  const hay = normalize([topic.slug, topic.title, ...(topic.keywords || []), topic.category || ''].join(' '));
  let best = { key: 'misc', score: 0, priority: 0 };
  for (const [key, cfg] of Object.entries(clusters || {})) {
    let score = 0;
    for (const p of cfg.patterns || []) if (hay.includes(normalize(p))) score += 1;
    if (score > best.score || (score === best.score && (cfg.priority || 0) > best.priority)) {
      best = { key, score, priority: cfg.priority || 0 };
    }
  }
  return best.key;
}
function liveCorpus() {
  const metadata = readJson(METADATA_PATH, []);
  return metadata.map(item => {
    const meta = item.metadata || {};
    return {
      slug: meta.slug || item.filename?.replace(/\.html$/, '') || '',
      title: meta.title || '',
      text: normalize([meta.title || '', meta.description || '', item.filename || ''].join(' ')),
      tokens: tokenize([meta.title || '', meta.description || '', item.filename || ''].join(' ')),
    };
  });
}
function topicText(topic) {
  return normalize([topic.slug, topic.title, ...(topic.keywords || []), topic.category || ''].join(' '));
}
function duplicateRisk(topic, allTopics, corpus) {
  const selfText = topicText(topic);
  const selfTokens = tokenize(selfText);
  let risk = 0;
  let nearest = null;
  for (const other of allTopics) {
    if (other.slug === topic.slug) continue;
    const otherTokens = tokenize(topicText(other));
    const score = jaccard(selfTokens, otherTokens);
    if (score > risk) { risk = score; nearest = other.slug; }
  }
  for (const live of corpus) {
    const score = jaccard(selfTokens, live.tokens);
    if (score > risk) { risk = score; nearest = live.slug; }
  }
  return { risk, nearest };
}
function commercialScore(topic) {
  const hay = topicText(topic);
  let score = 0;
  const high = ['google ads', 'gtm', 'ga4', 'server side', 'consent mode', 'conversion api', 'tracking', 'bigquery'];
  const mid = ['utm', 'dashboard', 'seo', 'hotjar', 'cro', 'lead'];
  for (const p of high) if (hay.includes(normalize(p))) score += 3;
  for (const p of mid) if (hay.includes(normalize(p))) score += 1;
  return score;
}
function scoreTopics(topics) {
  const clusters = readJson(CLUSTERS_PATH, {});
  const corpus = liveCorpus();
  const clusterCounts = {};
  for (const t of topics.filter(x => ['published','live'].includes(x.status))) {
    const c = inferCluster(t, clusters);
    clusterCounts[c] = (clusterCounts[c] || 0) + 1;
  }
  return topics.map(topic => {
    const cluster = inferCluster(topic, clusters);
    const dup = duplicateRisk(topic, topics, corpus);
    const clusterLoad = clusterCounts[cluster] || 0;
    const freshnessBonus = ['idea','scaffolded'].includes(topic.status) ? 2 : 0;
    const statusBonus = topic.status === 'idea' ? 2 : 1;
    const priority = (clusters[cluster] && clusters[cluster].priority) || 1;
    const score = (priority * 2) + commercialScore(topic) + freshnessBonus + statusBonus - Math.round(dup.risk * 20) - clusterLoad;
    return {
      ...topic,
      cluster,
      duplicateRisk: Number(dup.risk.toFixed(3)),
      nearestExisting: dup.nearest,
      pipelineScore: score,
    };
  });
}

if (require.main === module) {
  const topics = readJson(TOPICS_PATH, []);
  const scored = scoreTopics(topics)
    .filter(x => ['idea','scaffolded'].includes(x.status))
    .sort((a,b) => b.pipelineScore - a.pipelineScore || a.duplicateRisk - b.duplicateRisk);
  console.log(JSON.stringify(scored.slice(0, 20), null, 2));
}

module.exports = { scoreTopics, inferCluster };
