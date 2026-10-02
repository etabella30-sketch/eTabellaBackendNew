'use strict';
/**
 * release-edge core (plan R-SC1 / D6): one venue box release from one
 * annotated backend tag.
 *
 *   1. refuse unless the backend tree is clean and HEAD is at an annotated
 *      tag, the FE tree (--fe) is clean, the golden replay gate exists,
 *      FEED_PARSE_VERSION reads, and every component can be built (or is
 *      missing and --allow-missing was given);
 *   2. run the golden replay gate (D13); a non-zero exit blocks the release;
 *   3. build the components (FE edge bundle, then the rt-edge image);
 *   4. write dist/release/<tag>/manifest.json;
 *   5. push the image to $REGISTRY, only with --push.
 *
 * Tests stay a manual pre-tag step (D6). Signing and A/B updates are
 * deferred (D2). All side effects come in through `deps` (system.js).
 */

const path = require('path');
const { parseArgs, UsageError } = require('./args');
const gitq = require('./git');
const { VERSION_FILE, readFeedParseVersion } = require('./feed-parse-version');
const { COMPONENTS, toPosix, failure } = require('./components');

const GATE_SCRIPT = 'tools/ci/golden-replay-gate.js';
const MANIFEST_SCHEMA = 1;
/** Registry host[:port] plus an optional namespace path; no scheme, no tag. */
const REGISTRY_RE = /^[A-Za-z0-9.-]+(:[0-9]{1,5})?(\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*$/;

const ARG_SPEC = {
  '--fe': 'value',
  '--tag': 'value',
  '--allow-missing': 'flag',
  '--push': 'flag',
  '--dry-run': 'flag',
  '--help': 'flag',
};

const USAGE = [
  'Usage: node tools/ci/release-edge.js --fe <path to the Angular repo> [options]',
  '',
  'Builds a venue box release from the annotated tag at HEAD and writes',
  'dist/release/<tag>/manifest.json (backend commit, FE commit, FEED_PARSE_VERSION).',
  '',
  '  --fe <path>      the Angular repo; must be clean, its commit goes into the manifest',
  '  --tag <name>     the release tag, when HEAD carries more than one annotated tag',
  '  --allow-missing  release even when a component\'s code does not exist yet',
  '                   (recorded in the manifest as missing)',
  '  --push           push the built image to $REGISTRY (default: no push)',
  '  --dry-run        print the checks, the plan and the manifest; run, build,',
  '                   write and push nothing',
  '  --help           this text',
  '',
  'Exit: 0 released (dry run: would release); 1 refused, gate blocked, build',
  'or push failed (dry run: would refuse); 2 usage error.',
].join('\n');

/* ------------------------------------------------------------ helpers ---- */

function preview(lines) {
  const shown = lines.slice(0, 5).map((l) => l.trim()).join(', ');
  return lines.length > 5 ? shown + ', …' : shown;
}

/** A path for humans: relative to the backend root when inside it, '/'-separated. */
function show(ctx, p) {
  if (typeof p !== 'string' || !path.isAbsolute(p)) return p;
  const rel = path.relative(ctx.repoRoot, p);
  return toPosix(rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : p);
}

function quote(arg) {
  return /\s/.test(arg) ? JSON.stringify(arg) : arg;
}

function renderStep(step, ctx) {
  if (step.rm) return 'remove ' + show(ctx, step.rm);
  if (step.write) return 'write ' + show(ctx, step.write.file);
  const e = step.exec;
  const where = path.resolve(e.cwd) === path.resolve(ctx.repoRoot) ? '' : '(in ' + show(ctx, e.cwd) + ') ';
  return where + [e.cmd, ...e.args.map((a) => quote(show(ctx, a)))].join(' ');
}

function manifestPath(ctx) {
  return path.join(ctx.releaseDir, 'manifest.json');
}

/** Remote repository name for a local image ('etabella/rt-edge:tag' -> 'rt-edge'). */
function remoteName(image) {
  return image.split(':')[0].split('/').pop();
}

/* ---------------------------------------------------------- preflight ---- */

/**
 * Read-only checks. Runs git queries and, when apps/rt-edge exists,
 * `docker version` / `docker image inspect`; never builds or writes.
 * Returns { ctx, checks, components, refusals }.
 */
function preflight(opts, deps) {
  const { repoRoot, fs, exec } = deps;
  const checks = [];
  const pass = (text) => checks.push({ ok: true, text });
  const refuse = (text) => checks.push({ ok: false, text });
  const ctx = {
    repoRoot,
    feRoot: path.resolve(deps.cwd, opts.fe),
    tag: null,
    backendCommit: null,
    feCommit: null,
    feedParseVersion: null,
    registry: null,
    releaseDir: null,
    gateExitCode: null,
  };

  // Backend: clean tree, HEAD at exactly one annotated tag.
  try {
    const dirty = gitq.dirtyEntries(exec, repoRoot);
    if (dirty.length > 0) refuse('backend working tree is not clean (' + dirty.length + ' change(s)): ' + preview(dirty));
    else pass('backend working tree is clean');
    ctx.backendCommit = gitq.headCommit(exec, repoRoot);
    const shortHead = ctx.backendCommit.slice(0, 9);
    const pick = gitq.pickReleaseTag(gitq.tagsAtHead(exec, repoRoot), opts.tag, shortHead);
    if (pick.error) {
      refuse(pick.error);
    } else {
      ctx.tag = pick.tag;
      pass('backend HEAD ' + shortHead + ' is at annotated tag ' + pick.tag);
    }
  } catch (err) {
    refuse('backend: ' + err.message);
  }

  // FE: clean tree; its commit is pinned in the manifest.
  if (!fs.existsSync(ctx.feRoot)) {
    refuse('--fe ' + toPosix(ctx.feRoot) + ' does not exist');
  } else {
    try {
      const dirty = gitq.dirtyEntries(exec, ctx.feRoot);
      ctx.feCommit = gitq.headCommit(exec, ctx.feRoot);
      if (dirty.length > 0) refuse('FE working tree ' + toPosix(ctx.feRoot) + ' is not clean (' + dirty.length + ' change(s)): ' + preview(dirty));
      else pass('FE working tree is clean at ' + ctx.feCommit.slice(0, 9));
    } catch (err) {
      refuse('FE: ' + err.message);
    }
  }

  // Golden replay gate (D13): never optional.
  if (fs.existsSync(path.join(repoRoot, ...GATE_SCRIPT.split('/')))) {
    pass('golden replay gate present: ' + GATE_SCRIPT);
  } else {
    refuse('golden replay gate missing: ' + GATE_SCRIPT + ' does not exist; a release cannot run without it (D13)');
  }

  try {
    ctx.feedParseVersion = readFeedParseVersion(fs, path.join(repoRoot, ...VERSION_FILE.split('/')));
    pass('FEED_PARSE_VERSION ' + ctx.feedParseVersion + ' (' + VERSION_FILE + ')');
  } catch (err) {
    refuse(err.message);
  }

  if (opts.push) {
    const registry = String(deps.env.REGISTRY || '').trim().replace(/\/+$/, '');
    if (!registry) {
      refuse('--push needs the REGISTRY environment variable (registry host and namespace, e.g. registry.example.com/etabella)');
    } else if (!REGISTRY_RE.test(registry)) {
      refuse('REGISTRY "' + registry + '" is not a registry host[/namespace] (no scheme, no tag)');
    } else {
      ctx.registry = registry;
      pass('push target: ' + registry);
    }
  }

  ctx.releaseDir = path.join(repoRoot, 'dist', 'release', ctx.tag || '<tag>');

  const components = COMPONENTS.map((comp) => {
    let res;
    try {
      res = comp.detect(ctx, deps);
    } catch (err) {
      res = { status: 'blocked', reason: err.message };
    }
    if (res.info) ctx[comp.name] = res.info;
    return { comp, status: res.status, reason: res.reason || null };
  });

  const refusals = checks.filter((c) => !c.ok).map((c) => c.text);
  for (const c of components) {
    if (c.status === 'blocked') {
      refusals.push('component ' + c.comp.name + ' cannot be built: ' + c.reason);
    } else if (c.status === 'missing' && !opts.allowMissing) {
      refusals.push('component ' + c.comp.name + ' is missing (' + c.reason + '); pass --allow-missing to release without it');
    }
  }
  return { ctx, checks, components, refusals };
}

/* ----------------------------------------------------------- manifest ---- */

function buildManifest(ctx, opts, deps, components, push) {
  return {
    schemaVersion: MANIFEST_SCHEMA,
    tag: ctx.tag,
    backendCommit: ctx.backendCommit,
    feCommit: ctx.feCommit,
    FEED_PARSE_VERSION: ctx.feedParseVersion,
    node: deps.nodeVersion,
    createdAt: deps.now().toISOString(),
    gate: { script: GATE_SCRIPT, exitCode: ctx.gateExitCode },
    allowMissing: Boolean(opts.allowMissing),
    components,
    push,
  };
}

function writeManifest(ctx, deps, manifest) {
  deps.fs.writeFileSync(manifestPath(ctx), JSON.stringify(manifest, null, 2) + '\n');
}

function notBuilt(c) {
  return { name: c.comp.name, kind: c.comp.kind, status: c.status, reason: c.reason };
}

/* --------------------------------------------------------------- plan ---- */

function planLines(pre, opts) {
  const { ctx, components } = pre;
  const lines = ['node ' + GATE_SCRIPT + '   (exit 0 = pass; anything else blocks the release)'];
  const results = {};
  for (const c of components) {
    if (c.status !== 'available') {
      lines.push('skip ' + c.comp.name + ': ' + c.reason);
      continue;
    }
    for (const step of c.comp.steps(ctx, results)) lines.push(renderStep(step, ctx));
    results[c.comp.name] = c.comp.planned(ctx);
  }
  lines.push('write ' + show(ctx, manifestPath(ctx)));
  const images = components.filter((c) => c.comp.kind === 'docker-image' && c.status === 'available');
  if (!opts.push) {
    lines.push('no push (pass --push with REGISTRY set to push)');
  } else if (images.length === 0) {
    lines.push('push: nothing to push (no image is built)');
  } else {
    for (const c of images) {
      const local = c.comp.image(ctx.tag || '<tag>');
      const ref = (ctx.registry || '$REGISTRY') + '/' + remoteName(local) + ':' + (ctx.tag || '<tag>');
      lines.push('docker tag ' + local + ' ' + ref);
      lines.push('docker push ' + ref);
    }
  }
  return lines;
}

function dryRunManifest(pre, opts, deps) {
  const { ctx, components } = pre;
  const entries = components.map((c) => (c.status === 'available'
    ? { name: c.comp.name, kind: c.comp.kind, status: 'would-build', ...c.comp.planned(ctx) }
    : notBuilt(c)));
  const push = opts.push
    ? { requested: true, registry: ctx.registry, status: 'would-push', images: [] }
    : { requested: false, registry: null, status: 'not-requested', images: [] };
  return buildManifest(ctx, opts, deps, entries, push);
}

/* ---------------------------------------------------------------- run ---- */

function runStep(step, ctx, deps) {
  const releaseRoot = path.join(ctx.repoRoot, 'dist', 'release') + path.sep;
  if (step.rm) {
    if (!path.resolve(step.rm).startsWith(releaseRoot)) throw new Error('refusing to remove ' + step.rm + ' (outside dist/release)');
    deps.fs.rmSync(step.rm, { recursive: true, force: true });
    return;
  }
  if (step.write) {
    deps.fs.writeFileSync(step.write.file, step.write.content);
    return;
  }
  const e = step.exec;
  const line = renderStep(step, ctx);
  deps.log('$ ' + line);
  const res = deps.exec(e.cmd, e.args, { cwd: e.cwd, env: e.env, inherit: true });
  if (res.error || res.status !== 0) throw new Error(line + ' failed: ' + (res.error || 'exit ' + res.status));
}

function capture(deps, args, cwd) {
  const res = deps.exec('docker', args, { cwd });
  if (res.error || res.status !== 0) throw new Error('docker ' + args.join(' ') + ' failed: ' + failure(res));
  return String(res.stdout).trim();
}

/** Tags and pushes every built image; returns the manifest's push record. */
function pushImages(ctx, deps, entries) {
  const images = entries.filter((e) => e.kind === 'docker-image' && e.status === 'built');
  const record = { requested: true, registry: ctx.registry, status: 'pushed', images: [] };
  if (images.length === 0) return { ...record, status: 'nothing-to-push' };
  try {
    for (const e of images) {
      const repo = ctx.registry + '/' + remoteName(e.image);
      const ref = repo + ':' + ctx.tag;
      capture(deps, ['tag', e.image, ref], ctx.repoRoot);
      deps.log('$ docker push ' + ref);
      const res = deps.exec('docker', ['push', ref], { cwd: ctx.repoRoot, inherit: true });
      if (res.error || res.status !== 0) throw new Error('docker push ' + ref + ' failed: ' + (res.error || 'exit ' + res.status));
      const digests = JSON.parse(capture(deps, ['image', 'inspect', ref, '--format', '{{json .RepoDigests}}'], ctx.repoRoot) || '[]');
      const repoDigest = (digests || []).find((d) => d.startsWith(repo + '@')) || null;
      if (!repoDigest) deps.error('release-edge: WARNING: pushed ' + ref + ' but docker reports no ' + repo + '@sha256 digest; the manifest records null.');
      record.images.push({ image: e.image, ref, repoDigest });
    }
  } catch (err) {
    return { ...record, status: 'failed', error: err.message };
  }
  return record;
}

function runRelease(pre, opts, deps) {
  const { ctx, components } = pre;

  deps.log('release-edge: running the golden replay gate (' + GATE_SCRIPT + ')');
  const gate = deps.exec('node', [GATE_SCRIPT], { cwd: ctx.repoRoot, inherit: true });
  ctx.gateExitCode = gate.status;
  if (gate.error || gate.status !== 0) {
    deps.error('release-edge: BLOCKED: the golden replay gate '
      + (gate.error ? 'did not run (' + gate.error + ')' : 'exited ' + gate.status) + '; nothing was built.');
    return 1;
  }

  deps.fs.mkdirSync(ctx.releaseDir, { recursive: true });
  const results = {};
  const entries = [];
  for (const c of components) {
    if (c.status !== 'available') {
      deps.log('release-edge: ' + c.comp.name + ' not built: ' + c.reason);
      entries.push(notBuilt(c));
      continue;
    }
    deps.log('release-edge: building ' + c.comp.name);
    try {
      for (const step of c.comp.steps(ctx, results)) runStep(step, ctx, deps);
      results[c.comp.name] = c.comp.collect(ctx, deps, results);
    } catch (err) {
      deps.error('release-edge: FAILED building ' + c.comp.name + ': ' + err.message + '; no manifest written.');
      return 1;
    }
    entries.push({ name: c.comp.name, kind: c.comp.kind, status: 'built', ...results[c.comp.name] });
  }

  const file = manifestPath(ctx);
  const push = opts.push
    ? { requested: true, registry: ctx.registry, status: 'pending', images: [] }
    : { requested: false, registry: null, status: 'not-requested', images: [] };
  const manifest = buildManifest(ctx, opts, deps, entries, push);
  if (deps.fs.existsSync(file)) deps.log('release-edge: replacing the existing ' + show(ctx, file));
  writeManifest(ctx, deps, manifest);

  if (opts.push) {
    manifest.push = pushImages(ctx, deps, entries);
    writeManifest(ctx, deps, manifest);
    if (manifest.push.status === 'failed') {
      deps.error('release-edge: PUSH FAILED: ' + manifest.push.error + ' (recorded in ' + show(ctx, file) + ')');
      return 1;
    }
    if (manifest.push.status === 'nothing-to-push') deps.log('release-edge: --push given but no image was built; nothing pushed.');
  } else if (deps.env.REGISTRY) {
    deps.log('release-edge: REGISTRY is set but --push was not given; nothing pushed.');
  }

  deps.log('release-edge: RELEASED ' + ctx.tag + ' (FEED_PARSE_VERSION ' + ctx.feedParseVersion + ')');
  for (const e of entries) {
    const what = e.status === 'built' ? (e.imageId || e.sha256) : e.reason;
    deps.log('  ' + e.name.padEnd(8) + ' ' + e.status.padEnd(8) + ' ' + what);
  }
  deps.log('  manifest ' + show(ctx, file));
  return 0;
}

/* --------------------------------------------------------------- main ---- */

function printPreflight(pre, deps) {
  deps.log('release-edge: checks');
  for (const c of pre.checks) deps.log('  ' + (c.ok ? 'ok    ' : 'REFUSE') + '  ' + c.text);
  deps.log('release-edge: components');
  for (const c of pre.components) {
    deps.log('  ' + c.comp.name.padEnd(8) + ' ' + c.status + (c.reason ? ': ' + c.reason : ''));
  }
}

/** Returns the process exit code. */
function main(argv, deps) {
  let opts;
  try {
    opts = parseArgs(argv, ARG_SPEC);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    deps.error('release-edge: ' + err.message);
    deps.error(USAGE);
    return 2;
  }
  if (opts.help) {
    deps.log(USAGE);
    return 0;
  }
  if (!opts.fe) {
    deps.error('release-edge: --fe <path to the Angular repo> is required');
    deps.error(USAGE);
    return 2;
  }

  if (opts.dryRun) deps.log('release-edge: DRY RUN: nothing is run, built, written or pushed.');
  const pre = preflight(opts, deps);
  printPreflight(pre, deps);

  if (opts.dryRun) {
    deps.log('release-edge: plan');
    planLines(pre, opts).forEach((l, i) => deps.log('  ' + (i + 1) + '. ' + l));
    deps.log('release-edge: manifest (would write ' + show(pre.ctx, manifestPath(pre.ctx)) + ')');
    deps.log(JSON.stringify(dryRunManifest(pre, opts, deps), null, 2));
    if (pre.refusals.length > 0) {
      deps.error('release-edge: a real run would REFUSE:');
      for (const r of pre.refusals) deps.error('  - ' + r);
      return 1;
    }
    deps.log('release-edge: a real run would release ' + pre.ctx.tag + '.');
    return 0;
  }

  if (pre.refusals.length > 0) {
    deps.error('release-edge: REFUSED:');
    for (const r of pre.refusals) deps.error('  - ' + r);
    return 1;
  }
  return runRelease(pre, opts, deps);
}

module.exports = {
  main,
  preflight,
  planLines,
  buildManifest,
  pushImages,
  GATE_SCRIPT,
  REGISTRY_RE,
  USAGE,
};
