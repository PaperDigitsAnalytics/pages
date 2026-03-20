const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'nightly-content.config.json');
const TOPICS_PATH = path.join(ROOT, 'content-topics.json');
const OUTPUT_DIR = path.join(ROOT, 'copywriter-artikelen');
const LOG_DIR_DEFAULT = path.join(ROOT, 'logs', 'nightly-content');
const LOCK_PATH = path.join(ROOT, '.nightly-content.lock');
const { scoreTopics } = require('./topic-selection');
const { resultForFile } = require('./quality-gate');
const { writeSummary } = require('./write-nightly-summary');
const { autofixMarkdown, splitFrontmatter } = require('./autofix-draft');
const { clampWords, fallbackMeta } = require('./frontmatter-helpers');
const { repairFrontmatter } = require('./repair-frontmatter');

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function nowIso() { return new Date().toISOString(); }
function nlDateText(date = new Date()) {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(date);
}
function uniqueId() { return Math.floor(100000000 + Math.random() * 900000000); }
function loadConfig() {
  const cfg = readJson(CONFIG_PATH, {});
  cfg.paths = cfg.paths || {};
  cfg.paths.logDir = path.join(ROOT, cfg.paths.logDir || 'logs/nightly-content');
  cfg.paths.stylePack = path.join(ROOT, cfg.paths.stylePack || 'prompts/nightly-article-style-pack.md');
  return cfg;
}
function logFactory(dir) {
  ensureDir(dir);
  const file = path.join(dir, `${new Date().toISOString().slice(0,10)}.log`);
  return (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(file, line + '\n', 'utf8');
  };
}
function run(command, args, opts = {}) {
  const isCmdScript = /\.cmd$/i.test(command);
  const isNpmCmd = /npm(\.cmd)?$/i.test(command);
  const finalCommand = (isNpmCmd || isCmdScript) ? 'cmd.exe' : command;
  const finalArgs = isNpmCmd
    ? ['/c', 'npm', ...args]
    : isCmdScript
      ? ['/c', command, ...args]
      : args;
  const res = cp.spawnSync(finalCommand, finalArgs, {
    cwd: opts.cwd || ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: opts.timeoutMs || 1000 * 60 * 15,
    maxBuffer: 1024 * 1024 * 20,
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    const err = new Error(`${command} failed (${res.status}): ${(res.stderr || res.stdout || '').trim()}`);
    err.stdout = res.stdout;
    err.stderr = res.stderr;
    throw err;
  }
  return (res.stdout || '').trim();
}
function tryRun(command, args, opts = {}) {
  try { return { ok: true, output: run(command, args, opts) }; }
  catch (error) { return { ok: false, error }; }
}
function cleanJsonText(raw) {
  const trimmed = String(raw || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  return start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate;
}
function parseModelJson(raw) {
  return JSON.parse(cleanJsonText(raw));
}
function sanitizeField(text) {
  return String(text || '').replace(/\r/g, '').trim();
}
function sanitizeParagraph(text) {
  return sanitizeField(text).replace(/\n{2,}/g, '\n').replace(/\n/g, ' ');
}
function sanitizeHeading(text) {
  return sanitizeField(text).replace(/^#+\s*/, '');
}
function readStylePack(cfg) {
  return fs.existsSync(cfg.paths.stylePack) ? fs.readFileSync(cfg.paths.stylePack, 'utf8') : '';
}
function loadTopics() {
  return readJson(TOPICS_PATH, []);
}
function saveTopics(topics) {
  writeJson(TOPICS_PATH, topics);
}
function queuedTopics(topics, cfg) {
  const allowed = new Set((cfg.topicSelection && cfg.topicSelection.allowedStatuses) || ['idea', 'scaffolded']);
  return topics.filter(t => allowed.has(t.status || 'idea'));
}
function sortQueued(topics, cfg) {
  return scoreTopics(topics)
    .filter(t => ['idea', 'scaffolded'].includes(t.status || 'idea'))
    .filter(t => (t.duplicateRisk || 0) <= Number(cfg.maxDuplicateRisk ?? 0.72))
    .sort((a, b) => {
      const clusterA = a.cluster === cfg.preferCluster ? 1 : 0;
      const clusterB = b.cluster === cfg.preferCluster ? 1 : 0;
      return clusterB - clusterA || (b.pipelineScore || 0) - (a.pipelineScore || 0) || (a.duplicateRisk || 0) - (b.duplicateRisk || 0);
    });
}
function pickTopic(topics, cfg) {
  return sortQueued(topics, cfg)[0] || null;
}
function ensureTopicQueue(cfg, log) {
  const current = loadTopics();
  const minQueued = Number(cfg.minQueuedTopics || 0);
  if (queuedTopics(current, cfg).length >= minQueued) return scoreTopics(current);
  log('Queue below threshold, generating topics from artikel-ideeen.txt');
  run('node', [path.join(ROOT, 'scripts', 'auto-topic-generator.js')], { cwd: ROOT, timeoutMs: 1000 * 60 * 2 });
  run('node', [path.join(ROOT, 'scripts', 'cleanup-duplicate-topics.js')], { cwd: ROOT, timeoutMs: 1000 * 60 * 2 });
  return scoreTopics(loadTopics());
}
function ensureScaffold(slug, log) {
  const mdPath = path.join(OUTPUT_DIR, `${slug}.md`);
  if (fs.existsSync(mdPath)) return mdPath;
  log(`Scaffolding ${slug}`);
  run('npm.cmd', ['run', 'content:scaffold'], { cwd: ROOT, timeoutMs: 1000 * 60 * 5 });
  if (!fs.existsSync(mdPath)) throw new Error(`Scaffold did not create ${mdPath}`);
  return mdPath;
}
function buildPrompt(topic, stylePack) {
  return `Schrijf 1 Nederlands marketingartikel als JSON.\n\n${stylePack}\n\nTopic:\n- slug: ${topic.slug}\n- title: ${topic.title}\n- category: ${topic.category || 'Digital Marketing'}\n- keywords: ${(topic.keywords || []).join(', ')}\n\nVereisten:\n- output alleen JSON\n- geen markdown fences\n- geen bullets\n- geen FAQ\n- geen tabellen in modeloutput\n- headlines max 30 tekens\n- adDescription velden max 90 tekens\n- schrijf compact en publiceerbaar\n\nGeef precies dit JSON-shape:\n{\n  "title": "...",\n  "description": "...",\n  "adDescription": "...",\n  "adDescription2": "...",\n  "headline1": "...",\n  "headline2": "...",\n  "headline3": "...",\n  "heroImageAlt": "...",\n  "lead": "...",\n  "sections": [\n    { "heading": "...", "paragraphs": ["...", "..."] },\n    { "heading": "...", "paragraphs": ["...", "..."] },\n    { "heading": "...", "paragraphs": ["...", "..."] },\n    { "heading": "...", "paragraphs": ["...", "..."] },\n    { "heading": "...", "paragraphs": ["...", "..."] }\n  ]\n}`;
}
function generateWithGemini(prompt) {
  const geminiCmd = path.join(process.env.APPDATA || '', 'npm', 'gemini.cmd');
  if (fs.existsSync(geminiCmd)) {
    return run(geminiCmd, ['-p', prompt, '--output-format', 'text'], { cwd: ROOT, timeoutMs: 1000 * 60 * 10 });
  }
  return run('gemini', ['-p', prompt, '--output-format', 'text'], { cwd: ROOT, timeoutMs: 1000 * 60 * 10 });
}
function generateWithClaude(prompt) {
  return run('claude', ['--permission-mode', 'bypassPermissions', '--print', prompt], { cwd: ROOT, timeoutMs: 1000 * 60 * 10 });
}
function generateDraft(topic, cfg, log) {
  const prompt = buildPrompt(topic, readStylePack(cfg));
  const order = [cfg.provider, cfg.fallbackProvider].filter(Boolean);
  let lastErr;
  for (const provider of order) {
    try {
      log(`Generating ${topic.slug} via ${provider}`);
      const raw = provider === 'claude' ? generateWithClaude(prompt) : generateWithGemini(prompt);
      const parsed = parseModelJson(raw);
      parsed.__provider = provider;
      return parsed;
    } catch (error) {
      lastErr = error;
      log(`Provider ${provider} failed for ${topic.slug}: ${error.message}`);
    }
  }
  throw lastErr || new Error('No provider available');
}
function buildVisualBlock(topic) {
  const title = clampWords(topic.title, 70);
  return `\n<!-- Verplicht visueel element -->\n<section class="hs-impact" aria-labelledby="${topic.slug}-impact-title">\n  <h2 id="${topic.slug}-impact-title">Waar het verschil vaak zichtbaar wordt</h2>\n  <p class="hs-impact__intro">Deze vergelijking laat indicatief zien waar de oude aanpak meestal vastloopt en waar een scherpere aanpak verschil maakt.</p>\n  <div class="table-wrap">\n    <table class="hs-table">\n      <caption class="visually-hidden">Vergelijking huidige aanpak versus scherpere aanpak voor ${title}</caption>\n      <thead>\n        <tr>\n          <th scope="col">Aspect</th>\n          <th scope="col" class="num">Huidige aanpak</th>\n          <th scope="col" class="num">Scherpere aanpak</th>\n        </tr>\n      </thead>\n      <tbody>\n        <tr>\n          <th scope="row">Rapportagevertrouwen</th>\n          <td><div class="mbar is-bad" style="--w:35%"><span class="mbar__label">twijfel</span></div></td>\n          <td><div class="mbar is-good" style="--w:85%"><span class="mbar__label">helderder</span></div></td>\n        </tr>\n        <tr>\n          <th scope="row">Handmatig werk</th>\n          <td><div class="mbar is-bad" style="--w:55%"><span class="mbar__label">veel</span></div></td>\n          <td><div class="mbar is-good" style="--w:30%"><span class="mbar__label">minder</span></div></td>\n        </tr>\n        <tr>\n          <th scope="row">Snelheid van bijsturen</th>\n          <td><div class="mbar" style="--w:40%"><span class="mbar__label">later</span></div></td>\n          <td><div class="mbar is-good" style="--w:88%"><span class="mbar__label">eerder</span></div></td>\n        </tr>\n        <tr>\n          <th scope="row">Bijsturen</th>\n          <td><div class="mbar is-bad" style="--w:45%"><span class="mbar__label">op gevoel</span></div></td>\n          <td><div class="mbar is-good" style="--w:90%"><span class="mbar__label">concreter</span></div></td>\n        </tr>\n      </tbody>\n    </table>\n    <p class="hs-source">Indicatieve benchmark op basis van PaperDigits cases 2024-2026.</p>\n  </div>\n</section>\n`;
}
function renderMarkdown(topic, draft) {
  const ts = topic.ts || Date.now();
  const metaFallbacks = fallbackMeta(topic, draft);
  const fm = {
    filename: `${topic.slug}.html`,
    slug: topic.slug,
    timestamp: new Date(ts).toISOString(),
    title: metaFallbacks.title,
    description: metaFallbacks.description,
    adDescription: metaFallbacks.adDescription,
    adDescription2: metaFallbacks.adDescription2,
    headline1: metaFallbacks.headline1,
    headline2: metaFallbacks.headline2,
    headline3: metaFallbacks.headline3,
    category: topic.category || 'Digital Marketing',
    author: 'Wouter Naber',
    date: nlDateText(new Date(ts)),
    readCount: topic.readCount || 320,
    heroImage: `images/${topic.img || 'google-logo-iphone-desk.jpg'}`,
    heroImageAlt: metaFallbacks.heroImageAlt,
  };
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) lines.push(`${k}: ${v}`);
  lines.push('---', '', `# ${fm.title}`, '', sanitizeParagraph(draft.lead), '');
  (draft.sections || []).slice(0, 5).forEach((section, idx) => {
    lines.push(`## ${sanitizeHeading(section.heading)}`,'');
    const paras = Array.isArray(section.paragraphs) ? section.paragraphs : [];
    paras.slice(0, 2).forEach(p => lines.push(sanitizeParagraph(p), ''));
    if (idx === 2) lines.push(buildVisualBlock(topic), '');
  });
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
function setTopicStatus(topics, slug, status) {
  const topic = topics.find(t => t.slug === slug);
  if (topic) topic.status = status;
}
function qualityCheckResult(slug) {
  const mdPath = path.join(OUTPUT_DIR, `${slug}.md`);
  return resultForFile(mdPath);
}
function buildRepairPrompt(topic, body, issues, stylePack) {
  return `Herschrijf alleen de BODY van dit bestaande markdown-artikel zodat alleen deze issues opgelost worden.\n\n${stylePack}\n\nTopic:\n- slug: ${topic.slug}\n- title: ${topic.title}\n\nIssues die je MOET oplossen:\n- ${issues.join('\n- ')}\n\nRegels:\n- behoud exact 5 h2-secties\n- verander de frontmatter niet; die krijg je niet mee\n- output alleen de body markdown, zonder frontmatter en zonder uitleg\n- begin direct met de bestaande titelregel of intro-inhoud\n- verwijder agency/AI-achtige formuleringen\n- maak het compacter als dat nodig is\n\nBestaande body markdown:\n${body}`;
}
function selfHealDraft(topic, cfg, log) {
  const retries = Number(cfg.selfHealRetries || 0);
  if (retries <= 0) return;
  const mdPath = path.join(OUTPUT_DIR, `${topic.slug}.md`);
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const result = qualityCheckResult(topic.slug);
    if (result.ok) return;

    const current = fs.readFileSync(mdPath, 'utf8');
    const autofixed = autofixMarkdown(current);
    if (autofixed.changed) {
      fs.writeFileSync(mdPath, autofixed.content, 'utf8');
      log(`Applied local autofix for ${topic.slug}: ${autofixed.fixes.join(', ')}`);
      const afterAutofix = qualityCheckResult(topic.slug);
      if (afterAutofix.ok) return;
    }

    const parts = splitFrontmatter(fs.readFileSync(mdPath, 'utf8'));
    if (!parts.frontmatter) throw new Error('Self-heal aborted: missing frontmatter before repair');
    const prompt = buildRepairPrompt(topic, parts.body, result.issues, readStylePack(cfg));
    log(`Quality gate failed for ${topic.slug}; self-heal attempt ${attempt}`);

    let repairedBody;
    try {
      repairedBody = run(path.join(process.env.APPDATA || '', 'npm', 'gemini.cmd'), ['--prompt', prompt, '--output-format', 'text'], { cwd: ROOT, timeoutMs: Number(cfg.selfHealTimeoutMs || 180000) });
    } catch (_) {
      repairedBody = run('claude', ['--permission-mode', 'bypassPermissions', '--print', prompt], { cwd: ROOT, timeoutMs: Number(cfg.selfHealTimeoutMs || 180000) });
    }

    const cleanedBody = String(repairedBody || '').trim().replace(/^```(?:markdown)?\s*/i, '').replace(/```$/i, '').trim();
    fs.writeFileSync(mdPath, parts.frontmatter + cleanedBody + '\n', 'utf8');
  }
  const finalResult = qualityCheckResult(topic.slug);
  if (!finalResult.ok) {
    throw new Error(`Quality gate failed after self-heal: ${finalResult.issues.join('; ')}`);
  }
}
function publishAndDeploy(topic, cfg, log) {
  selfHealDraft(topic, cfg, log);
  const mdPath = path.join(OUTPUT_DIR, `${topic.slug}.md`);
  const repaired = repairFrontmatter(fs.readFileSync(mdPath, 'utf8'), topic);
  if (repaired.changed) {
    fs.writeFileSync(mdPath, repaired.content, 'utf8');
    log(`Repaired missing frontmatter fields for ${topic.slug}`);
  }
  const finalQuality = qualityCheckResult(topic.slug);
  if (!finalQuality.ok) throw new Error(`Quality gate failed: ${finalQuality.issues.join('; ')}`);
  run('npm.cmd', ['run', 'content:review', '--', topic.slug], { cwd: ROOT, timeoutMs: 1000 * 60 * 5 });
  run('npm.cmd', ['run', 'content:approve', '--', topic.slug], { cwd: ROOT, timeoutMs: 1000 * 60 * 5 });
  run('npm.cmd', ['run', 'content:publish', '--', topic.slug], { cwd: ROOT, timeoutMs: 1000 * 60 * 10 });
  if (cfg.autoDeploy) {
    run('npm.cmd', ['run', 'deploy'], { cwd: ROOT, timeoutMs: 1000 * 60 * 20 });
  }
}
function markPublishedLive(topics, slug) {
  const topic = topics.find(t => t.slug === slug);
  if (topic) topic.status = 'live';
}
function acquireLock() {
  if (fs.existsSync(LOCK_PATH)) throw new Error('Nightly content pipeline is already running');
  fs.writeFileSync(LOCK_PATH, String(process.pid), 'utf8');
}
function releaseLock() {
  if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
}

(function main() {
  const cfg = loadConfig();
  const log = logFactory(cfg.paths.logDir || LOG_DIR_DEFAULT);
  const startedAt = new Date();
  const summary = {
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    ok: false,
    topic: null,
    provider: null,
    autoDeploy: !!cfg.autoDeploy,
    error: null,
    durationSeconds: null
  };
  if (!cfg.enabled) return log('Nightly pipeline disabled in config');
  acquireLock();
  try {
    const topics = ensureTopicQueue(cfg, log);
    const target = pickTopic(topics, cfg);
    if (!target) {
      summary.finishedAt = new Date().toISOString();
      summary.durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
      writeSummary(summary);
      return log('No eligible topics found after auto-topic generation');
    }
    summary.topic = target.slug;
    ensureScaffold(target.slug, log);
    const refreshedTopics = loadTopics();
    const topic = refreshedTopics.find(t => t.slug === target.slug) || target;
    const draft = generateDraft(topic, cfg, log);
    summary.provider = draft.__provider || null;
    const md = renderMarkdown(topic, draft);
    const mdPath = path.join(OUTPUT_DIR, `${topic.slug}.md`);
    fs.writeFileSync(mdPath, md, 'utf8');
    setTopicStatus(refreshedTopics, topic.slug, 'draft');
    saveTopics(refreshedTopics);
    log(`Draft written: ${topic.slug}`);
    publishAndDeploy(topic, cfg, log);
    const afterTopics = loadTopics();
    markPublishedLive(afterTopics, topic.slug);
    saveTopics(afterTopics);
    summary.ok = true;
    log(`Completed nightly article: ${topic.slug} via ${draft.__provider}`);
  } catch (error) {
    const cfg2 = loadConfig();
    const log = logFactory(cfg2.paths.logDir || LOG_DIR_DEFAULT);
    summary.error = error.message;
    log(`ERROR: ${error.stack || error.message}`);
    process.exitCode = 1;
  } finally {
    summary.finishedAt = new Date().toISOString();
    summary.durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
    writeSummary(summary);
    releaseLock();
  }
})();
