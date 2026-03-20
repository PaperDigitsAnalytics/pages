const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'nightly-content.config.json'), 'utf8'));
const time = config.scheduledTime || '02:30';
const taskName = 'PaperDigits Nightly Content';
const nodeExe = process.execPath;
const script = path.join(ROOT, 'scripts', 'nightly-content-pipeline.js');
const cmd = `\"${nodeExe}\" \"${script}\"`;

cp.execFileSync('schtasks.exe', [
  '/Create',
  '/F',
  '/SC', 'DAILY',
  '/TN', taskName,
  '/TR', cmd,
  '/ST', time,
], { stdio: 'inherit' });

console.log(`Installed task: ${taskName} at ${time}`);
