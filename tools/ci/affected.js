#!/usr/bin/env node
/**
 * affected: after a change, which backend apps must be rebuilt and uploaded, and in what order.
 *
 * Phase 2 of the shared-libraries plan (2026-10-06). The plan had Jenkins rebuild every consumer of a changed lib;
 * deploys here are uploads by hand, so this answers the same question on the command line: a lib change reaches
 * every host that imports it (directly, or through another lib such as @app/global), or the "fix once" objective
 * silently fails on the hosts that were not rebuilt.
 *
 *   node tools/ci/affected.js                      changes since the upstream branch (or HEAD~1) plus the working tree
 *   node tools/ci/affected.js --since <ref>        changes since <ref> (a commit, tag or branch) plus the working tree
 *   node tools/ci/affected.js --committed-only     leave the working tree out
 *   node tools/ci/affected.js --files a.ts,b.ts    classify these paths, no git
 *   node tools/ci/affected.js --json               machine-readable
 *
 * Inputs: nest-cli.json (the apps), tools/ci/lib-consumers.json (lib -> apps, kept honest by
 * tools/ci/guards/lib-consumers.spec.ts) and the libs' own imports (lib -> lib, scanned here from libs/<lib>/src).
 * Rules: apps/<app>/src (not specs) -> that app; libs/<lib>/src (not specs) -> every consumer of that lib and of
 * the libs that import it; the root build files -> every app; assets/sql-migrations -> a DB note;
 * apps/rt-edge/packaging -> package:box; tools/, scripts/, docs/, specs -> no rebuild.
 * Exit 0 always (it informs); 2 on a usage error.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, UsageError } = require('./release-edge/args');
const { systemDeps } = require('./release-edge/system');
const gitq = require('./release-edge/git');

const CONSUMERS_FILE = 'tools/ci/lib-consumers.json';
/** A change here rebuilds every app: dependencies, the Nest project list, the compiler and bundler settings. */
const ROOT_CONFIG = Object.freeze(['package.json', 'package-lock.json', 'nest-cli.json', 'tsconfig.json', 'tsconfig.build.json', 'webpack.config.js', 'webpack-hmr.config.js']);
/** Upload order on the cloud: realtime-server carries the edge-token allowlist, so it goes first; the box is last. */
const DEPLOY_ORDER = Object.freeze(['realtime-server', 'authapi', 'coreapi', 'download', 'downloadapi', 'export', 'upload', 'socket-app', 'indexapi', 'hyperlink', 'pagination', 'presentation', 'batchfile', 'sfu', 'realtime', 'backup', 'rt-edge']);
const BOX_APP = 'rt-edge';

const ARG_SPEC = {
  '--since': 'value',
  '--committed-only': 'flag',
  '--files': 'value',
  '--json': 'flag',
  '--help': 'flag',
};

const USAGE = [
  'Usage: node tools/ci/affected.js [--since <ref>] [--committed-only] [--files <a,b,...>] [--json]',
  '',
  'Lists the backend apps a change makes stale (rebuild + upload), the libs behind that, DB migrations to apply',
  'and the upload order. Default: the commits since the upstream branch (or HEAD~1) plus the working tree.',
].join('\n');

/* --------------------------------------------------------------- scan ---- */

/** Blank out // and block comments, keeping newlines and string literals (same rule as lib-consumers.spec.ts). */
function stripComments(src) {
  let out = '';
  let state = 'code';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const d = src[i + 1];
    if (state === 'code') {
      if (c === '/' && d === '/') { state = 'line'; out += '  '; i++; }
      else if (c === '/' && d === '*') { state = 'block'; out += '  '; i++; }
      else { if (c === "'" || c === '"' || c === '`') state = c; out += c; }
    } else if (state === 'line') {
      if (c === '\n') { state = 'code'; out += c; } else out += ' ';
    } else if (state === 'block') {
      if (c === '*' && d === '/') { state = 'code'; out += '  '; i++; } else out += c === '\n' ? c : ' ';
    } else {
      if (c === '\\') { out += c + (d ?? ''); i++; continue; }
      if (c === state || (c === '\n' && state !== '`')) state = 'code';
      out += c;
    }
  }
  return out;
}

/** Every import specifier: `from '...'`, side-effect `import '...'`, `require('...')` and `import('...')`. */
function specifiers(code) {
  const found = [];
  for (const re of [/\bfrom\s*['"]([^'"]+)['"]/g, /\bimport\s*['"]([^'"]+)['"]/g, /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g, /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g]) {
    for (const m of code.matchAll(re)) found.push(m[1]);
  }
  return found;
}

function libOf(specifier, libs) {
  if (!specifier.startsWith('@app/')) return null;
  const name = specifier.slice('@app/'.length).split('/')[0];
  return libs.includes(name) ? name : null;
}

function isProductionTs(name) {
  return name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts');
}

function productionFiles(fsx, dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fsx.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(p); }
      else if (isProductionTs(e.name)) out.push(p);
    }
  };
  if (fsx.existsSync(dir)) walk(dir);
  return out.sort();
}

/** The repo's build graph: apps, libs, lib -> apps (lib-consumers.json) and lib -> libs it imports (scanned). */
function loadGraph(fsx, repoRoot) {
  const cli = JSON.parse(fsx.readFileSync(path.join(repoRoot, 'nest-cli.json'), 'utf8'));
  const apps = Object.entries(cli.projects || {}).filter(([, p]) => p.type === 'application').map(([name]) => name).sort();
  const consumers = JSON.parse(fsx.readFileSync(path.join(repoRoot, ...CONSUMERS_FILE.split('/')), 'utf8')).libs;
  const libs = Object.keys(consumers).sort();
  const libImports = {};
  for (const lib of libs) {
    const imports = new Set();
    for (const file of productionFiles(fsx, path.join(repoRoot, 'libs', lib, 'src'))) {
      for (const s of specifiers(stripComments(fsx.readFileSync(file, 'utf8')))) {
        const other = libOf(s, libs);
        if (other && other !== lib) imports.add(other);
      }
    }
    libImports[lib] = [...imports].sort();
  }
  return { apps, libs, consumers, libImports };
}

/* ----------------------------------------------------------- classify ---- */

/** Every lib made stale by `changed`: the changed libs plus, transitively, the libs that import them. */
function staleLibs(changed, libImports) {
  const stale = new Map(changed.map((lib) => [lib, lib]));
  let grew = true;
  while (grew) {
    grew = false;
    for (const [lib, imports] of Object.entries(libImports)) {
      if (stale.has(lib)) continue;
      const via = imports.find((i) => stale.has(i));
      if (via) { stale.set(lib, stale.get(via)); grew = true; }
    }
  }
  return stale; // lib -> the changed lib it traces back to
}

/** Classifies changed paths ('/'-separated, repo-relative). */
function classify(paths, graph) {
  const apps = new Map(); // app -> Set of reasons
  const reason = (app, why) => {
    if (!apps.has(app)) apps.set(app, new Set());
    apps.get(app).add(why);
  };
  const changedLibs = new Map(); // lib -> paths
  const result = { apps: {}, libs: { changed: [], stale: [] }, db: [], packaging: [], tests: [], other: [], ignored: [] };

  for (const raw of paths) {
    const p = raw.replace(/\\/g, '/').replace(/^\.\//, '');
    let m;
    if ((m = /^apps\/([^/]+)\/packaging\//.exec(p))) { result.packaging.push(p); continue; }
    if ((m = /^apps\/([^/]+)\/e2e\//.exec(p))) { result.tests.push(p); continue; }
    if ((m = /^apps\/([^/]+)\/(src\/.*\.ts|tsconfig[^/]*\.json)$/.exec(p))) {
      if (p.endsWith('.spec.ts')) result.tests.push(p);
      else if (graph.apps.includes(m[1])) reason(m[1], p);
      else result.other.push(p);
      continue;
    }
    if ((m = /^libs\/([^/]+)\/(src\/.*\.ts|tsconfig[^/]*\.json)$/.exec(p))) {
      if (p.endsWith('.spec.ts')) result.tests.push(p);
      else if (graph.libs.includes(m[1])) { if (!changedLibs.has(m[1])) changedLibs.set(m[1], []); changedLibs.get(m[1]).push(p); }
      else result.other.push(p);
      continue;
    }
    if (ROOT_CONFIG.includes(p)) { for (const app of graph.apps) reason(app, p + ' (root build file: every app)'); continue; }
    if (/^assets\/sql-migrations\//.test(p)) { result.db.push(p); continue; }
    if (/^(tools|scripts|docs|docker)\//.test(p) || /\.(md|txt)$/i.test(p) || /(^|\/)\.claude-flow\//.test(p)) { result.ignored.push(p); continue; }
    result.other.push(p);
  }

  const stale = staleLibs([...changedLibs.keys()], graph.libImports);
  result.libs.changed = [...changedLibs.keys()].sort();
  result.libs.stale = [...stale.keys()].filter((l) => !changedLibs.has(l)).sort();
  for (const [lib, origin] of stale) {
    const why = lib === origin ? 'libs/' + lib : 'libs/' + origin + ' -> libs/' + lib;
    for (const app of graph.consumers[lib] || []) reason(app, why);
  }

  for (const app of [...apps.keys()].sort()) result.apps[app] = [...apps.get(app)].sort();
  // Known cloud apps in their upload order, apps the table does not know after them, the box always last.
  const known = DEPLOY_ORDER.filter((a) => apps.has(a) && a !== BOX_APP);
  const unknown = [...apps.keys()].filter((a) => !DEPLOY_ORDER.includes(a)).sort();
  result.deployOrder = [...known, ...unknown, ...(apps.has(BOX_APP) ? [BOX_APP] : [])];
  return result;
}

/* -------------------------------------------------------------- input ---- */

function changedPaths(deps, opts) {
  const { exec, repoRoot } = deps;
  if (opts.files) return { paths: opts.files.split(',').map((s) => s.trim()).filter(Boolean), source: '--files' };
  let since = opts.since;
  if (!since) {
    const up = exec('git', ['--no-optional-locks', 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: repoRoot });
    since = up.status === 0 && String(up.stdout).trim() ? String(up.stdout).trim() : 'HEAD~1';
  }
  const committed = gitq.git(exec, repoRoot, ['diff', '--name-only', since + '...HEAD']).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tree = opts.committedOnly ? [] : gitq.dirtyEntries(exec, repoRoot).map((line) => {
    const body = line.slice(3);
    const arrow = body.indexOf(' -> ');
    return arrow === -1 ? body : body.slice(arrow + 4);
  });
  return { paths: [...new Set([...committed, ...tree])].sort(), source: 'since ' + since + (opts.committedOnly ? ' (commits only)' : ' + working tree'), committed: committed.length, tree: tree.length };
}

/* ------------------------------------------------------------- render ---- */

function render(result, source) {
  const lines = ['affected: ' + source];
  const apps = Object.keys(result.apps);
  if (!apps.length) lines.push('  no app needs a rebuild');
  for (const app of result.deployOrder) {
    const note = app === BOX_APP ? '   -> npm run package:box' : '';
    lines.push('  rebuild ' + app.padEnd(16) + result.apps[app].join('; ') + note);
  }
  if (result.libs.stale.length) lines.push('  libs stale through imports: ' + result.libs.stale.join(', '));
  for (const p of result.db) lines.push('  DB migration (apply by hand, dev first): ' + p);
  for (const p of result.packaging) lines.push('  box launcher changed (package:box picks it up): ' + p);
  if (result.tests.length) lines.push('  tests only (' + result.tests.length + '): no rebuild');
  if (result.other.length) lines.push('  not classified (' + result.other.length + '): ' + result.other.slice(0, 8).join(', ') + (result.other.length > 8 ? ', …' : ''));
  if (result.ignored.length) lines.push('  tooling / docs (' + result.ignored.length + '): no rebuild');
  if (apps.length) {
    const cloud = result.deployOrder.filter((a) => a !== BOX_APP);
    lines.push('  upload order: ' + (cloud.length ? cloud.join(' -> ') + (cloud[0] === 'realtime-server' ? ' (rt-deploy-check first)' : '') : 'no cloud app')
      + (result.apps[BOX_APP] ? (cloud.length ? ' -> ' : '') + 'the box last (no live session)' : ''));
  }
  return lines;
}

function main(argv, deps) {
  let opts;
  try {
    opts = parseArgs(argv, ARG_SPEC);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    deps.error('affected: ' + err.message);
    deps.error(USAGE);
    return 2;
  }
  if (opts.help) { deps.log(USAGE); return 0; }
  const graph = loadGraph(deps.fs, deps.repoRoot);
  const input = changedPaths(deps, opts);
  const result = classify(input.paths, graph);
  if (opts.json) deps.log(JSON.stringify({ source: input.source, paths: input.paths, ...result }, null, 2));
  else for (const line of render(result, input.source + ' (' + input.paths.length + ' path(s))')) deps.log(line);
  return 0;
}

module.exports = { main, classify, loadGraph, staleLibs, stripComments, specifiers, render, ROOT_CONFIG, DEPLOY_ORDER };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2), systemDeps(path.resolve(__dirname, '..', '..')));
}
