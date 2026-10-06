'use strict';
/**
 * package:box core (Phase 2 of the shared-libraries plan, 2026-10-06): one reproducible, stamped venue box package
 * from the backend and FE working trees, staged under dist/box/<version>/ and zipped next to it.
 *
 *   1. preflight (read-only): the git state of both trees (tool-state noise such as .claude-flow/ set aside), their
 *      HEAD commits, the packaging folder, the FE ng binary, the baseline and the gate scripts. A tree with real
 *      changes refuses unless --wip, which stamps "+wip" on the version and lists the dirty paths in release.json.
 *   2. gates: G1 (the guard, boundary and purity suites) before the builds; G6 (box-externals-gate) right after the
 *      backend build, against the package.json this package ships.
 *   3. builds: scripts/build-all-apps.js rt-edge, then ng build --configuration edge in the FE repo.
 *   4. stage: main.js, public/ (the FE edge build without .claude-flow/), the packaging files
 *      (apps/rt-edge/packaging/windows) and release.json.
 *   5. zip: dist/box/<version>.zip. Never data/, box.json or .env.production: the packaging folder has none, and the
 *      stage refuses them a second time.
 *   6. --smoke: boot the staged package once in dist/box-smoke/<version> on its own ports (smoke.js).
 *
 * Every side effect comes in through `deps` (tools/ci/release-edge/system.js), so package-box.spec.ts runs nothing
 * for real. The version is <yyyymmdd>-<backend 9>-<fe 9>[+wip]: at most 32 characters, under the 40 the box accepts
 * in release.json (ports/box-config.ts reads only version, backendCommit and feCommit; the rest is for people).
 */

const path = require('path');
const crypto = require('crypto');
const nodeModule = require('module');
const { parseArgs, UsageError } = require('../release-edge/args');
const gitq = require('../release-edge/git');
const { VERSION_FILE, readFeedParseVersion } = require('../release-edge/feed-parse-version');
const { hashTree, hashFiles } = require('../release-edge/tree-hash');
const { runSmoke, SMOKE_SETTINGS } = require('./smoke');

const PACKAGING_DIR = 'apps/rt-edge/packaging/windows';
/** What a package ships beside main.js, public/ and release.json: the launcher, as the installed box has it. */
const PACKAGING_FILES = Object.freeze([
  'run.bat',
  'stop.bat',
  'realtime.config.js',
  'env-config.js',
  'box-url.js',
  'make-cert.ps1',
  'send-to-box.js',
  'README.md',
  'package.json',
  'package-lock.json',
  '.env.production.example',
]);
/** Files of an installed box that must never travel in a package: identity, recordings, settings, generated config. */
const NEVER_PACKAGED = Object.freeze(['.env.production', 'box.json', 'data', 'box.log', 'node_modules']);
/** Working-tree entries that are tool state, not source: they never make a package "+wip". */
const TOOL_STATE_NOISE = Object.freeze([/(^|\/)\.claude-flow\//, /^\.swarm\//, /^\.hive-mind\//, /^\.mcp\.json$/, /^\.vscode\/mcp\.json$/, /^\.claude\//]);
const BASELINE_FILE = 'tools/ci/box-externals.baseline.json';
const EXTERNALS_GATE = 'tools/ci/box-externals-gate.js';
const BUILD_SCRIPT = 'scripts/build-all-apps.js';
const BUNDLE = 'dist/apps/rt-edge/main.js';
const FE_DIST = 'dist/edge';
const FE_NG = 'node_modules/@angular/cli/bin/ng.js';
const JEST = 'node_modules/jest/bin/jest.js';
/** G1: the guard, boundary and purity suites, as jest path patterns. */
const G1_PATTERNS = Object.freeze(['tools/ci/guards', 'boundary.spec', 'purity.spec']);
const RELEASE_SCHEMA = 2;
const BOX_VERSION_MAX = 40;
const DEFAULT_FE = '../eTabella angular 21';
const DEFAULT_INSTALLED = 'D:/etabella tech/rt-edge-box';
const DEFAULT_OUT = 'dist/box';
const DIRTY_LIST_MAX = 50;

const ARG_SPEC = {
  '--fe': 'value',
  '--wip': 'flag',
  '--dry-run': 'flag',
  '--skip-gates': 'flag',
  '--skip-be-build': 'flag',
  '--skip-fe-build': 'flag',
  '--no-zip': 'flag',
  '--smoke': 'flag',
  '--installed': 'value',
  '--out': 'value',
  '--help': 'flag',
};

const USAGE = [
  'Usage: node tools/ci/package-box.js [options]      (npm run package:box -- [options])',
  '',
  'Stages one venue box package, dist/box/<version>/ plus dist/box/<version>.zip, from the backend and',
  'FE working trees: main.js, public/, the launcher (apps/rt-edge/packaging/windows) and release.json.',
  '',
  '  --fe <path>        the Angular repo (default: ' + DEFAULT_FE + ' next to this repo)',
  '  --wip              package a tree with uncommitted changes; the version gets "+wip" and the',
  '                     changed paths go into release.json',
  '  --dry-run          print the checks and the plan; run, build and write nothing',
  '  --skip-gates       skip G1 (guard specs) and G6 (box externals); never for a release',
  '  --skip-be-build    reuse ' + BUNDLE + ' as it is',
  '  --skip-fe-build    reuse <fe>/' + FE_DIST + ' as it is',
  '  --no-zip           stage the folder only',
  '  --smoke            boot the staged package once in dist/box-smoke/<version> (ports ' + SMOKE_SETTINGS.PORT + '/'
    + SMOKE_SETTINGS.TCP_PORT + '/' + SMOKE_SETTINGS.CONSOLE_PORT + ')',
  '  --installed <dir>  an installed box folder to compare package.json against for depsChanged',
  '                     (default: ' + DEFAULT_INSTALLED + ' when it exists)',
  '  --out <dir>        where to stage (default ' + DEFAULT_OUT + ')',
  '  --help             this text',
  '',
  'Exit: 0 staged; 1 refused, a gate or build failed, or the smoke test failed; 2 usage error.',
].join('\n');

/* ------------------------------------------------------------ helpers ---- */

const toPosix = (p) => p.split(path.sep).join('/');

/** `XY path` or `XY old -> new` from git status --porcelain=v1; the new name counts. */
function porcelainPath(line) {
  const body = line.slice(3);
  const arrow = body.indexOf(' -> ');
  return arrow === -1 ? body : body.slice(arrow + 4);
}

function splitNoise(paths) {
  const real = [];
  const noise = [];
  for (const p of paths) (TOOL_STATE_NOISE.some((re) => re.test(p)) ? noise : real).push(p);
  return { real, noise };
}

function yyyymmdd(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function short(sha) {
  return sha.slice(0, 9);
}

function fmtBytes(n) {
  return n.toLocaleString('en-US');
}

function signed(n) {
  return (n >= 0 ? '+' : '') + fmtBytes(n);
}

const BUILTINS = new Set(nodeModule.builtinModules);

/** The package a require specifier names (`@nestjs/common/x` -> `@nestjs/common`); null for builtins and paths. */
function packageOf(spec) {
  if (spec.startsWith('node:') || spec.startsWith('.') || spec.startsWith('/')) return null;
  const parts = spec.split('/');
  const name = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return BUILTINS.has(name) ? null : name;
}

/** Every package the bundle still requires at runtime (what the box must have installed). */
function externalsOf(bundleText) {
  const out = new Set();
  for (const m of bundleText.matchAll(/require\("([^"]+)"\)/g)) {
    const pkg = packageOf(m[1]);
    if (pkg) out.add(pkg);
  }
  return [...out].sort();
}

function copyFile(fs, from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, fs.readFileSync(from));
}

function copyTree(fs, from, to, skip) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(fs, src, dst, skip);
    else if (entry.isFile()) copyFile(fs, src, dst);
  }
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/* ---------------------------------------------------------- preflight ---- */

/** The git state of one tree: HEAD and the dirty paths, tool-state noise set aside. */
function treeState(exec, root) {
  const { real, noise } = splitNoise(gitq.dirtyEntries(exec, root).map(porcelainPath));
  return { commit: gitq.headCommit(exec, root), real, noise };
}

/**
 * Read-only checks. Returns { ctx, checks, refusals }: a refusal is a check that failed; nothing is built or written.
 */
function preflight(opts, deps) {
  const { repoRoot, fs, exec } = deps;
  const checks = [];
  const pass = (text) => checks.push({ ok: true, text });
  const refuse = (text) => checks.push({ ok: false, text });
  const at = (...rel) => path.join(repoRoot, ...rel.join('/').split('/'));

  const ctx = {
    repoRoot,
    feRoot: opts.fe ? path.resolve(deps.cwd, opts.fe) : path.resolve(repoRoot, DEFAULT_FE),
    packagingDir: at(PACKAGING_DIR),
    backend: null,
    fe: null,
    wip: false,
    version: null,
    outDir: path.resolve(repoRoot, opts.out || DEFAULT_OUT),
    stageDir: null,
    zipFile: null,
    installedDir: null,
    feedParseVersion: null,
    builtAt: deps.now(),
    // Git Bash puts GNU tar first on PATH, and GNU tar cannot write a zip; Windows' own tar (bsdtar) can.
    tar: process.platform === 'win32' && fs.existsSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'))
      ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
      : 'tar',
  };

  // Both trees: HEAD, and real changes only with --wip.
  try {
    ctx.backend = treeState(exec, repoRoot);
    pass('backend HEAD ' + short(ctx.backend.commit) + (ctx.backend.real.length ? ', ' + ctx.backend.real.length + ' uncommitted change(s)' : ', clean')
      + (ctx.backend.noise.length ? ' (' + ctx.backend.noise.length + ' tool-state file(s) set aside)' : ''));
  } catch (err) {
    refuse('backend: ' + err.message);
  }
  if (!fs.existsSync(ctx.feRoot)) {
    refuse('FE repo ' + toPosix(ctx.feRoot) + ' does not exist (pass --fe <path>)');
  } else {
    try {
      ctx.fe = treeState(exec, ctx.feRoot);
      pass('FE HEAD ' + short(ctx.fe.commit) + (ctx.fe.real.length ? ', ' + ctx.fe.real.length + ' uncommitted change(s)' : ', clean')
        + (ctx.fe.noise.length ? ' (' + ctx.fe.noise.length + ' tool-state file(s) set aside)' : ''));
    } catch (err) {
      refuse('FE: ' + err.message);
    }
  }
  if (ctx.backend && ctx.fe) {
    ctx.wip = ctx.backend.real.length > 0 || ctx.fe.real.length > 0;
    if (ctx.wip && !opts.wip) {
      const where = [ctx.backend.real.length ? 'backend' : null, ctx.fe.real.length ? 'FE' : null].filter(Boolean).join(' and ');
      refuse('the ' + where + ' working tree has uncommitted changes: commit them, or pass --wip to package them as a "+wip" build');
    } else if (opts.wip && !ctx.wip) {
      pass('--wip given but both trees are clean: the version carries no +wip');
    } else if (ctx.wip) {
      pass('--wip: the version carries +wip and release.json lists the changed paths');
    }
    ctx.version = yyyymmdd(ctx.builtAt) + '-' + short(ctx.backend.commit) + '-' + short(ctx.fe.commit) + (ctx.wip ? '+wip' : '');
    if (ctx.version.length > BOX_VERSION_MAX) refuse('version "' + ctx.version + '" is longer than the ' + BOX_VERSION_MAX + ' characters the box reads');
    ctx.stageDir = path.join(ctx.outDir, ctx.version);
    ctx.zipFile = path.join(ctx.outDir, ctx.version + '.zip');
  }

  // The launcher folder: complete, and nothing of an installed box in it.
  const missing = PACKAGING_FILES.filter((f) => !fs.existsSync(path.join(ctx.packagingDir, f)));
  if (missing.length) refuse(PACKAGING_DIR + ' is missing ' + missing.join(', '));
  else pass(PACKAGING_DIR + ': all ' + PACKAGING_FILES.length + ' launcher files present');
  const forbidden = NEVER_PACKAGED.filter((f) => fs.existsSync(path.join(ctx.packagingDir, f)));
  if (forbidden.length) refuse(PACKAGING_DIR + ' holds ' + forbidden.join(', ') + ', which must never be packaged');

  // Tools and inputs.
  for (const file of [BUILD_SCRIPT, EXTERNALS_GATE, BASELINE_FILE]) {
    if (!fs.existsSync(at(file))) refuse(file + ' is missing');
  }
  if (!opts.skipGates && !fs.existsSync(at(JEST))) refuse(JEST + ' is missing (npm install), or pass --skip-gates');
  if (opts.skipBeBuild && !fs.existsSync(at(BUNDLE))) refuse('--skip-be-build but ' + BUNDLE + ' does not exist');
  if (!opts.skipFeBuild && ctx.fe && !fs.existsSync(path.join(ctx.feRoot, ...FE_NG.split('/')))) refuse('FE ' + FE_NG + ' is missing (npm install in the FE repo), or pass --skip-fe-build');
  if (opts.skipFeBuild && ctx.fe && !fs.existsSync(path.join(ctx.feRoot, ...FE_DIST.split('/'), 'index.html'))) refuse('--skip-fe-build but <fe>/' + FE_DIST + '/index.html does not exist');
  try {
    ctx.feedParseVersion = readFeedParseVersion(fs, at(VERSION_FILE));
    pass('FEED_PARSE_VERSION ' + ctx.feedParseVersion);
  } catch (err) {
    refuse(err.message);
  }

  if (opts.installed) {
    ctx.installedDir = path.resolve(deps.cwd, opts.installed);
    if (!fs.existsSync(path.join(ctx.installedDir, 'package.json'))) refuse('--installed ' + toPosix(ctx.installedDir) + ' has no package.json');
    else pass('depsChanged compared against ' + toPosix(ctx.installedDir));
  } else if (fs.existsSync(path.join(DEFAULT_INSTALLED, 'package.json'))) {
    ctx.installedDir = DEFAULT_INSTALLED;
    pass('depsChanged compared against the installed box ' + DEFAULT_INSTALLED);
  } else {
    pass('no installed box to compare: depsChanged = new externals against the baseline only');
  }

  return { ctx, checks, refusals: checks.filter((c) => !c.ok).map((c) => c.text) };
}

/* --------------------------------------------------------------- plan ---- */

/** The steps, as data: dry runs print them, real runs execute them in this order. */
function plan(ctx, opts) {
  const { repoRoot, feRoot } = ctx;
  const steps = [];
  if (!opts.skipGates) steps.push({ label: 'G1 guard, boundary and purity specs', exec: { cmd: 'node', args: [path.join(repoRoot, ...JEST.split('/')), ...G1_PATTERNS], cwd: repoRoot } });
  if (!opts.skipBeBuild) steps.push({ label: 'build rt-edge', exec: { cmd: 'node', args: [BUILD_SCRIPT, 'rt-edge'], cwd: repoRoot } });
  if (!opts.skipGates) {
    steps.push({
      label: 'G6 box externals',
      exec: { cmd: 'node', args: [EXTERNALS_GATE, '--bundle', BUNDLE, '--box-package', PACKAGING_DIR + '/package.json'], cwd: repoRoot },
    });
  }
  if (!opts.skipFeBuild) steps.push({ label: 'build the FE edge bundle', exec: { cmd: 'node', args: [path.join(feRoot, ...FE_NG.split('/')), 'build', '--configuration', 'edge'], cwd: feRoot } });
  steps.push({ label: 'stage ' + toPosix(path.relative(repoRoot, ctx.stageDir)), stage: true });
  // The smoke verdict goes into release.json and smoke.json, so it runs before the zip is cut from the stage.
  if (opts.smoke) steps.push({ label: 'smoke test in dist/box-smoke/' + ctx.version, smoke: true });
  if (!opts.noZip) steps.push({ label: 'zip', exec: { cmd: ctx.tar, args: ['-a', '-c', '-f', ctx.zipFile, '-C', ctx.stageDir, '.'], cwd: repoRoot } });
  return steps;
}

function show(ctx, p) {
  if (typeof p !== 'string' || !path.isAbsolute(p)) return p;
  const rel = path.relative(ctx.repoRoot, p);
  return toPosix(rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : p);
}

function renderStep(step, ctx) {
  if (!step.exec) return step.label;
  const e = step.exec;
  const where = path.resolve(e.cwd) === path.resolve(ctx.repoRoot) ? '' : '(in ' + show(ctx, e.cwd) + ') ';
  return where + [e.cmd, ...e.args.map((a) => (/\s/.test(show(ctx, a)) ? JSON.stringify(show(ctx, a)) : show(ctx, a)))].join(' ');
}

/* -------------------------------------------------------------- stage ---- */

/** Copies the built pieces into stageDir and writes release.json. Returns the release record. */
function stageRelease(ctx, opts, deps, gates) {
  const { fs, repoRoot } = deps;
  const at = (...rel) => path.join(repoRoot, ...rel.join('/').split('/'));
  const mainJs = at(BUNDLE);
  const feDist = path.join(ctx.feRoot, ...FE_DIST.split('/'));
  if (!fs.existsSync(mainJs)) throw new Error('backend bundle missing: ' + BUNDLE);
  if (!fs.existsSync(path.join(feDist, 'index.html'))) throw new Error('FE edge build missing: ' + toPosix(feDist) + '/index.html');

  fs.rmSync(ctx.stageDir, { recursive: true, force: true });
  fs.mkdirSync(ctx.stageDir, { recursive: true });
  const bundle = fs.readFileSync(mainJs);
  fs.writeFileSync(path.join(ctx.stageDir, 'main.js'), bundle);
  copyTree(fs, feDist, path.join(ctx.stageDir, 'public'), (name) => name === '.claude-flow');
  for (const f of PACKAGING_FILES) copyFile(fs, path.join(ctx.packagingDir, f), path.join(ctx.stageDir, f));
  const leaked = NEVER_PACKAGED.filter((f) => fs.existsSync(path.join(ctx.stageDir, f)));
  if (leaked.length) throw new Error('the stage holds ' + leaked.join(', ') + ', which must never be packaged');

  const baseline = JSON.parse(fs.readFileSync(at(BASELINE_FILE), 'utf8'));
  const externals = externalsOf(bundle.toString('utf8'));
  const externalsNew = externals.filter((e) => !baseline.externals.includes(e));
  const forbidden = externals.filter((e) => baseline.neverOnTheBox.includes(e));
  if (forbidden.length) throw new Error('the bundle requires ' + forbidden.join(', ') + ', which must never be on the box (G6)');

  const publicTree = hashTree(fs, path.join(ctx.stageDir, 'public'));
  const libsTree = hashTree(fs, at('libs'));
  const depsHash = hashFiles(fs, ctx.packagingDir, ['package-lock.json', 'package.json']).sha256;
  const packagedDeps = JSON.parse(fs.readFileSync(path.join(ctx.packagingDir, 'package.json'), 'utf8')).dependencies || {};
  let depsDiff = [];
  if (ctx.installedDir) {
    const installedDeps = JSON.parse(fs.readFileSync(path.join(ctx.installedDir, 'package.json'), 'utf8')).dependencies || {};
    const names = new Set([...Object.keys(packagedDeps), ...Object.keys(installedDeps)]);
    depsDiff = [...names].filter((n) => packagedDeps[n] !== installedDeps[n]).sort()
      .map((n) => n + ': ' + (installedDeps[n] || 'absent') + ' -> ' + (packagedDeps[n] || 'absent'));
  }
  const depsChanged = externalsNew.length > 0 || depsDiff.length > 0;
  const wipTag = ctx.wip ? '+wip' : '';

  const release = {
    schemaVersion: RELEASE_SCHEMA,
    version: ctx.version,
    backendCommit: short(ctx.backend.commit) + wipTag,
    feCommit: short(ctx.fe.commit) + wipTag,
    backendCommitFull: ctx.backend.commit,
    feCommitFull: ctx.fe.commit,
    wip: ctx.wip,
    dirty: {
      backend: ctx.backend.real.slice(0, DIRTY_LIST_MAX),
      backendCount: ctx.backend.real.length,
      fe: ctx.fe.real.slice(0, DIRTY_LIST_MAX),
      feCount: ctx.fe.real.length,
    },
    builtAt: ctx.builtAt.toISOString(),
    node: deps.nodeVersion,
    FEED_PARSE_VERSION: ctx.feedParseVersion,
    mainJsBytes: bundle.length,
    mainSha256: sha256(bundle),
    baselineMainJsBytes: baseline.mainJsBytes,
    sizeDeltaBytes: bundle.length - baseline.mainJsBytes,
    public: { files: publicTree.files, bytes: publicTree.bytes, sha256: publicTree.sha256 },
    libsHash: libsTree.sha256,
    externals,
    externalsNew,
    depsSha256: depsHash,
    depsChanged,
    depsComparedTo: ctx.installedDir ? toPosix(ctx.installedDir) : null,
    depsDiff,
    gates,
    install: {
      cloudFirst: 'deploy realtime-server at ' + short(ctx.backend.commit) + ' (run tools/ci/rt-deploy-check.js first) and verify the relayed routes with an edge token before this box',
      boxLast: 'README.md "Updating": stop, keep the .prev files, copy main.js + public + release.json, start; never touch data, box.json or .env.production',
      npmCi: depsChanged ? 'release.json says depsChanged: copy package.json + package-lock.json and run npm ci --omit=dev before the start' : 'no dependency change: node_modules stays',
    },
  };
  fs.writeFileSync(path.join(ctx.stageDir, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  return release;
}

/* ---------------------------------------------------------------- run ---- */

function runExec(step, ctx, deps) {
  const line = renderStep(step, ctx);
  deps.log('$ ' + line);
  const res = deps.exec(step.exec.cmd, step.exec.args, { cwd: step.exec.cwd, inherit: true });
  if (res.error || res.status !== 0) throw new Error(step.label + ' failed: ' + (res.error || 'exit ' + res.status));
}

async function run(pre, opts, deps) {
  const { ctx } = pre;
  const gates = { g1: opts.skipGates ? 'skipped' : 'pending', g6: opts.skipGates ? 'skipped' : 'pending' };
  let release = null;
  let smoke = null;
  for (const step of plan(ctx, opts)) {
    deps.log('package-box: ' + step.label);
    try {
      if (step.exec) {
        if (step.label.startsWith('zip')) {
          deps.fs.rmSync(ctx.zipFile, { force: true });
          deps.fs.mkdirSync(path.dirname(ctx.zipFile), { recursive: true });
        }
        runExec(step, ctx, deps);
        if (step.label.startsWith('G1')) gates.g1 = 'passed';
        if (step.label.startsWith('G6')) gates.g6 = 'passed';
      } else if (step.stage) {
        release = stageRelease(ctx, opts, deps, gates);
      } else if (step.smoke) {
        smoke = await runSmoke(ctx, deps);
        release.smoke = smoke;
        deps.fs.writeFileSync(path.join(ctx.stageDir, 'release.json'), JSON.stringify(release, null, 2) + '\n');
        if (!smoke.ok) throw new Error('the staged package did not pass the smoke test: ' + smoke.problems.join('; ') + ' (details in ' + show(ctx, path.join(ctx.stageDir, 'smoke.json')) + ')');
      }
    } catch (err) {
      deps.error('package-box: FAILED: ' + err.message);
      if (release) deps.error('package-box: the stage ' + show(ctx, ctx.stageDir) + ' is kept for inspection; do not install it.');
      return 1;
    }
  }

  deps.log('package-box: STAGED ' + show(ctx, ctx.stageDir) + (opts.noZip ? '' : '  (zip ' + show(ctx, ctx.zipFile) + ')'));
  deps.log('  version      ' + release.version + (release.wip ? '   (WIP: backend ' + release.dirty.backendCount + ', FE ' + release.dirty.feCount + ' uncommitted paths; see release.json)' : ''));
  deps.log('  main.js      ' + fmtBytes(release.mainJsBytes) + ' B (' + signed(release.sizeDeltaBytes) + ' vs the baseline), externals ' + release.externals.length
    + (release.externalsNew.length ? ', NEW: ' + release.externalsNew.join(', ') : ', none new'));
  deps.log('  public/      ' + release.public.files + ' files, ' + fmtBytes(release.public.bytes) + ' B');
  deps.log('  depsChanged  ' + release.depsChanged + (release.depsDiff.length ? ' (' + release.depsDiff.join('; ') + ')' : '') + (release.depsComparedTo ? '  [vs ' + release.depsComparedTo + ']' : ''));
  deps.log('  gates        G1 ' + gates.g1 + ', G6 ' + gates.g6 + (smoke ? ', smoke ' + (smoke.ok ? 'passed' : 'FAILED') : ''));
  deps.log('  install      cloud first: ' + release.install.cloudFirst);
  deps.log('               box last: ' + release.install.boxLast);
  if (release.depsChanged) deps.log('               ' + release.install.npmCi);
  return 0;
}

/* --------------------------------------------------------------- main ---- */

function printPreflight(pre, deps) {
  deps.log('package-box: checks');
  for (const c of pre.checks) deps.log('  ' + (c.ok ? 'ok    ' : 'REFUSE') + '  ' + c.text);
}

/** Returns the process exit code. */
async function main(argv, deps) {
  let opts;
  try {
    opts = parseArgs(argv, ARG_SPEC);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    deps.error('package-box: ' + err.message);
    deps.error(USAGE);
    return 2;
  }
  if (opts.help) {
    deps.log(USAGE);
    return 0;
  }

  if (opts.dryRun) deps.log('package-box: DRY RUN: nothing is run, built or written.');
  const pre = preflight(opts, deps);
  printPreflight(pre, deps);

  if (opts.dryRun) {
    if (pre.ctx.version) {
      deps.log('package-box: plan for ' + pre.ctx.version);
      plan(pre.ctx, opts).forEach((s, i) => deps.log('  ' + (i + 1) + '. ' + renderStep(s, pre.ctx)));
    }
    if (pre.refusals.length) {
      deps.error('package-box: a real run would REFUSE:');
      for (const r of pre.refusals) deps.error('  - ' + r);
      return 1;
    }
    deps.log('package-box: a real run would stage ' + show(pre.ctx, pre.ctx.stageDir) + '.');
    return 0;
  }
  if (pre.refusals.length) {
    deps.error('package-box: REFUSED:');
    for (const r of pre.refusals) deps.error('  - ' + r);
    return 1;
  }
  return run(pre, opts, deps);
}

module.exports = {
  main,
  preflight,
  plan,
  renderStep,
  stageRelease,
  externalsOf,
  packageOf,
  splitNoise,
  porcelainPath,
  PACKAGING_DIR,
  PACKAGING_FILES,
  NEVER_PACKAGED,
  TOOL_STATE_NOISE,
  G1_PATTERNS,
  BOX_VERSION_MAX,
  USAGE,
};
