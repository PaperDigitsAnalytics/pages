const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const geminiCmd = path.join(process.env.APPDATA || '', 'npm', 'gemini.cmd');

function run(command, args) {
  const isCmdScript = /\.cmd$/i.test(command);
  const finalCommand = isCmdScript ? 'cmd.exe' : command;
  const finalArgs = isCmdScript ? ['/c', command, ...args] : args;
  const res = cp.spawnSync(finalCommand, finalArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: 1000 * 60 * 3,
    maxBuffer: 1024 * 1024 * 10,
  });
  return {
    status: res.status,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    error: res.error ? String(res.error) : null,
  };
}

const result = run(geminiCmd, ['--prompt', 'Antwoord alleen met het woord ok.', '--output-format', 'text']);
console.log(JSON.stringify(result, null, 2));
process.exit(result.status || 0);
