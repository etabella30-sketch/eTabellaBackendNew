'use strict';
/**
 * --smoke of package:box: boot the staged package once, in a disposable folder, the way an operator would, and ask
 * it what a never-enrolled box answers without a sign-in: `node main.js status --json` (the CLI against a fresh
 * data/), then on the page port GET /edge/ping (200, cloudLinked false), GET / (the FE edge build's index.html),
 * GET /edge-config.json (404 `not_found` "not configured yet": the route exists, the box has no identity; an
 * unknown route says "no such route") and GET /edge/local/status (503 `box_not_configured`; an enrolled staging box
 * answers 401/403 instead). 404 "no such route" or any other 5xx fails: the route is gone or the box crashed.
 *
 * The staging rule of the README is kept: an own folder (dist/box-smoke/<version>), own ports (4100 page, 5655
 * reporter, 2701 console), a fresh data/, nothing copied from an installed box (so no identity exists twice), and
 * LIVE_URL = https://smoke.invalid so the box never calls etabella.net from here. NODE_PATH points at the backend's
 * node_modules, which holds every package the box pins, so no npm install runs.
 */

const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const SMOKE_SETTINGS = Object.freeze({
  BOX_NAME: 'Package smoke test',
  TIME_ZONE: 'UTC',
  LIVE_URL: 'https://smoke.invalid',
  PORT: '4100',
  TCP_PORT: '5655',
  CONSOLE_PORT: '2701',
  HTTPS: 'off',
  SIGN_IN: 'password',
  DATA_DIR: './data',
  PUBLIC_DIR: './public',
});
const SMOKE_DIR = 'dist/box-smoke';
const BOOT_WAIT_MS = 30000;
const POLL_MS = 500;
const EXIT_WAIT_MS = 10000;
const LOG_TAIL = 40;

/** The shipped template with the smoke values set (a key the template lacks is appended). */
function smokeEnv(exampleText, settings = SMOKE_SETTINGS) {
  const seen = new Set();
  const lines = exampleText.split(/\r?\n/).map((line) => {
    const m = /^([A-Z_]+)=/.exec(line);
    if (m && settings[m[1]] !== undefined) {
      seen.add(m[1]);
      return m[1] + '=' + settings[m[1]];
    }
    return line;
  });
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  for (const [key, value] of Object.entries(settings)) if (!seen.has(key)) lines.push(key + '=' + value);
  return lines.join('\n') + '\n';
}

/** The box's error envelope `{ msg: -1, error: <code>, message }`, or null when the body is not one. */
function envelope(probe) {
  const j = probe.json;
  return j && j.msg === -1 && typeof j.error === 'string' ? j : null;
}

function answered(probe) {
  return probe.code === null || probe.code === undefined ? 'nothing (' + (probe.error || 'no answer') + ')' : String(probe.code) + (envelope(probe) ? ' ' + envelope(probe).error : '');
}

/** What a passing smoke looks like on a never-enrolled (or enrolled, signed-out) box; every problem is named. */
function judge(result) {
  const problems = [];
  if (result.envConfig.exitCode !== 0) problems.push('env-config.js exited ' + result.envConfig.exitCode);
  if (result.status.exitCode === null) problems.push('main.js status did not run: ' + result.status.error);
  else if (!result.status.json) problems.push('main.js status --json printed no JSON (exit ' + result.status.exitCode + ')');

  if (result.ping.code !== 200) problems.push('GET /edge/ping answered ' + answered(result.ping) + ' within ' + BOOT_WAIT_MS / 1000 + ' s');
  else if (!result.ping.json || result.ping.json.msg !== 1 || result.ping.json.cloudLinked !== false) problems.push('GET /edge/ping body is not the box ping (msg 1, cloudLinked false): ' + JSON.stringify(result.ping.json));

  if (result.index.code !== 200 || !/^\s*<!doctype html>/i.test(result.index.body || '')) problems.push('GET / did not serve the FE index.html from public/ (answered ' + answered(result.index) + ')');

  const cfg = envelope(result.config);
  const configOk = (result.config.code === 200 && result.config.json && result.config.json.signIn === SMOKE_SETTINGS.SIGN_IN)
    || (result.config.code === 404 && cfg && cfg.error === 'not_found' && /not configured/i.test(cfg.message || ''));
  if (!configOk) problems.push('GET /edge-config.json answered ' + answered(result.config) + ' (expected 200 with signIn "' + SMOKE_SETTINGS.SIGN_IN + '", or 404 not_found "not configured yet" on a never-enrolled box; "no such route" means the route is gone)');

  const ls = envelope(result.localStatus);
  const localOk = result.localStatus.code === 401 || result.localStatus.code === 403
    || (result.localStatus.code === 503 && ls && (ls.error === 'box_not_configured' || ls.error === 'box_not_linked'));
  if (!localOk) problems.push('GET /edge/local/status answered ' + answered(result.localStatus) + ' (expected 401/403 signed out, or 503 box_not_configured on a never-enrolled box; 404 means the route is gone, another 5xx a crash)');

  if (result.serve.exit && result.serve.exit.beforeKill) problems.push('the box exited by itself with code ' + result.serve.exit.code + ' before the checks ended');
  return problems;
}

function realRuntime() {
  return {
    spawn: (cmd, args, opts) => spawn(cmd === 'node' ? process.execPath : cmd, args, opts),
    httpGet: (url, timeoutMs) => new Promise((resolve) => {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ code: res.statusCode, body }));
      });
      req.on('timeout', () => { req.destroy(new Error('timeout')); });
      req.on('error', (err) => resolve({ code: null, error: err.message }));
    }),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function copyTree(fs, from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(fs, src, dst);
    else if (entry.isFile()) fs.writeFileSync(dst, fs.readFileSync(src));
  }
}

/** Boots the staged package once; returns the smoke record (also written to <stageDir>/smoke.json). */
async function runSmoke(ctx, deps, rt = realRuntime()) {
  const { fs, repoRoot } = deps;
  const dir = path.join(repoRoot, ...SMOKE_DIR.split('/'), ctx.version);
  const base = 'http://127.0.0.1:' + SMOKE_SETTINGS.PORT;
  const env = { ...process.env, NODE_ENV: 'production', NODE_PATH: path.join(repoRoot, 'node_modules') };
  const result = {
    dir: dir.split(path.sep).join('/'),
    ports: { page: Number(SMOKE_SETTINGS.PORT), reporter: Number(SMOKE_SETTINGS.TCP_PORT), console: Number(SMOKE_SETTINGS.CONSOLE_PORT) },
    startedAt: deps.now().toISOString(),
    envConfig: { exitCode: null, output: '' },
    status: { exitCode: null, json: null, error: null },
    ping: { code: null, ms: null, json: null },
    index: { code: null },
    config: { code: null, json: null },
    localStatus: { code: null, json: null },
    serve: { exit: null, logTail: [] },
    ok: false,
    problems: [],
  };

  fs.rmSync(dir, { recursive: true, force: true });
  copyTree(fs, ctx.stageDir, dir);
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.env.production'), smokeEnv(fs.readFileSync(path.join(dir, '.env.production.example'), 'utf8')));

  const envConfig = deps.exec('node', ['env-config.js'], { cwd: dir });
  result.envConfig = { exitCode: envConfig.error ? null : envConfig.status, output: (envConfig.stdout + envConfig.stderr).trim() };

  if (result.envConfig.exitCode === 0) {
    const status = deps.exec('node', ['main.js', 'status', '--json', '--config', 'box.json'], { cwd: dir, env });
    result.status = { exitCode: status.error ? null : status.status, json: tryJson(status.stdout), error: status.error || (status.stderr || '').trim().slice(0, 500) || null };

    const child = rt.spawn('node', ['main.js', '--config', 'box.json'], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const tail = [];
    const keep = (chunk) => {
      for (const line of String(chunk).split(/\r?\n/)) if (line.trim()) tail.push(line);
      while (tail.length > LOG_TAIL) tail.shift();
    };
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    let exited = null;
    const exitPromise = new Promise((resolve) => child.on('exit', (code, signal) => { exited = { code, signal }; resolve(); }));

    const probe = async (route) => {
      const r = await rt.httpGet(base + route, 5000);
      return { code: r.code, json: tryJson(r.body || ''), body: (r.body || '').slice(0, 300), error: r.error || null };
    };
    const t0 = Date.now();
    while (Date.now() - t0 < BOOT_WAIT_MS && !exited) {
      const ping = await probe('/edge/ping');
      if (ping.code !== null) {
        result.ping = { ...ping, ms: Date.now() - t0 };
        break;
      }
      await rt.sleep(POLL_MS);
    }
    if (result.ping.code !== null) {
      result.index = await probe('/');
      result.config = await probe('/edge-config.json');
      result.localStatus = await probe('/edge/local/status');
    }
    const beforeKill = !!exited;
    if (!exited) {
      child.kill();
      await Promise.race([exitPromise, rt.sleep(EXIT_WAIT_MS)]);
      if (!exited) child.kill('SIGKILL');
    }
    result.serve = { exit: exited ? { ...exited, beforeKill } : { code: null, signal: 'unanswered', beforeKill: false }, logTail: tail };
  }

  result.problems = judge(result);
  result.ok = result.problems.length === 0;
  result.endedAt = deps.now().toISOString();
  fs.writeFileSync(path.join(ctx.stageDir, 'smoke.json'), JSON.stringify(result, null, 2) + '\n');
  deps.log('package-box: smoke ' + (result.ok ? 'PASSED' : 'FAILED') + ' in ' + result.dir
    + (result.ping.ms !== null ? ' (ping after ' + result.ping.ms + ' ms)' : ''));
  for (const p of result.problems) deps.error('  - ' + p);
  return result;
}

module.exports = { runSmoke, smokeEnv, judge, envelope, SMOKE_SETTINGS, SMOKE_DIR, BOOT_WAIT_MS };
