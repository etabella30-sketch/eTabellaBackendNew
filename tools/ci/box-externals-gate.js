#!/usr/bin/env node
/**
 * box-externals-gate: refuse a venue box bundle that needs a runtime package the installed box does not have
 * (gate G6 of the shared-libraries plan, Phase 1, 2026-10-06).
 *
 * The box runs ONE file, main.js, against a node_modules installed from its own package.json. Webpack leaves
 * every package it did not bundle behind as `require("x")`, so the set of those specifiers is exactly what the
 * box must have installed. Run after the bundle is built, from the repo root:
 *
 *   node scripts/build-all-apps.js rt-edge
 *   node tools/ci/box-externals-gate.js
 *   node tools/ci/box-externals-gate.js --bundle dist/apps/rt-edge/main.js --box-package "D:/etabella tech/rt-edge-box/package.json"
 *
 * Options (each optional):
 *   --bundle <path>       the built bundle             (default dist/apps/rt-edge/main.js)
 *   --baseline <path>     the externals baseline       (default tools/ci/box-externals.baseline.json)
 *   --box-package <path>  the installed box's package.json, read only (default D:/etabella tech/rt-edge-box/package.json)
 *
 * Verdict:
 *   - a package on the baseline's `neverOnTheBox` list always refuses: pg, ioredis, kafkajs, ... are the live
 *     kernel and must never reach the box, pinned there or not;
 *   - every other package must be on the baseline `externals` list OR pinned (exact version) in the box
 *     package.json `dependencies`: the box installs with `npm ci --omit=dev` and run.bat skips the install when
 *     node_modules exists, so a range or a missing entry means "not installed";
 *   - Node builtins (`fs`, `node:crypto`, `node:sqlite`, ...) are ignored; a deep or scoped specifier counts as
 *     its package (`@nestjs/common/x` -> `@nestjs/common`, `rxjs/operators` -> `rxjs`);
 *   - the externals delta and the size delta against `baseline.mainJsBytes` are always printed, pass or fail.
 *
 * Exit 0 = PASS, 1 = REFUSED (every offender listed), 2 = usage or input error (the check could not be made;
 * treat as refused, like rt-deploy-check). Nothing is written; the box package.json is never modified.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const nodeModule = require('module');
const { parseArgs, UsageError } = require('./release-edge/args');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GATE_SCRIPT = __filename;
const DEFAULTS = Object.freeze({
  bundle: path.join(REPO_ROOT, 'dist', 'apps', 'rt-edge', 'main.js'),
  baseline: path.join(__dirname, 'box-externals.baseline.json'),
  boxPackage: 'D:/etabella tech/rt-edge-box/package.json',
});
const ARG_SPEC = { '--bundle': 'value', '--baseline': 'value', '--box-package': 'value' };
const USAGE = 'usage: node tools/ci/box-externals-gate.js [--bundle <main.js>] [--baseline <baseline.json>] [--box-package <package.json>]';

/** Every string-literal require in a webpack bundle; both quote styles, no newline inside the specifier. */
const REQUIRE_RE = /\brequire\(\s*(["'])([^"'\n]+)\1\s*\)/g;
/** An exact pin: plain semver, optionally with a pre-release or build tag. Ranges (^ ~ * x >=) are not pins. */
const EXACT_VERSION_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

/** `fs`, `fs/promises`, `node:crypto`, `node:sqlite`: the `node:` prefix names a builtin by definition, which keeps
 *  the check independent of which builtins this node version lists (node:sqlite only exists from 22.5). */
function isNodeBuiltin(specifier) {
  if (specifier.startsWith('node:')) return true;
  if (typeof nodeModule.isBuiltin === 'function') return nodeModule.isBuiltin(specifier);
  return nodeModule.builtinModules.includes(specifier);
}

/** The package a specifier installs from: `@scope/name/deep` -> `@scope/name`, `name/deep` -> `name`. */
function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** A relative, absolute or drive-letter specifier is a file, not a package. */
function isPathSpecifier(specifier) {
  return specifier.startsWith('.') || specifier.startsWith('/') || /^[A-Za-z]:[\\/]/.test(specifier);
}

/** The sorted, de-duplicated package names a bundle requires at runtime. */
function externalsOf(source) {
  const found = new Set();
  for (const m of source.matchAll(REQUIRE_RE)) {
    const specifier = m[2];
    if (isPathSpecifier(specifier) || isNodeBuiltin(specifier)) continue;
    found.add(packageName(specifier));
  }
  return [...found].sort();
}

function isExactVersion(version) {
  return typeof version === 'string' && EXACT_VERSION_RE.test(version);
}

/**
 * The verdict, as data. `boxDependencies` is the `dependencies` map of the box package.json.
 * Returns { ok, refusals: [{name, reason}], added, removed, unpinnedBaseline, bundleBytes, baselineBytes, sizeDelta }.
 */
function evaluate({ externals, baseline, boxDependencies, bundleBytes }) {
  const allowed = new Set(baseline.externals);
  const never = new Set(baseline.neverOnTheBox);
  const refusals = [];
  for (const name of externals) {
    if (never.has(name)) {
      refusals.push({ name, reason: 'never allowed on the box (baseline neverOnTheBox)' });
      continue;
    }
    if (allowed.has(name)) continue;
    const version = boxDependencies[name];
    if (version === undefined) {
      refusals.push({ name, reason: 'not on the baseline and not in the box package.json dependencies' });
    } else if (!isExactVersion(version)) {
      refusals.push({ name, reason: 'not on the baseline and the box package.json has "' + version + '", not an exact pin' });
    }
  }
  return {
    ok: refusals.length === 0,
    refusals,
    added: externals.filter((name) => !allowed.has(name)),
    removed: baseline.externals.filter((name) => !externals.includes(name)),
    // On the baseline but not installed on the box: the gate passes (the baseline is the contract) but says so,
    // because the installed box would fail to load that bundle.
    unpinnedBaseline: externals.filter((name) => allowed.has(name) && !isExactVersion(boxDependencies[name])),
    bundleBytes,
    baselineBytes: baseline.mainJsBytes,
    sizeDelta: bundleBytes - baseline.mainJsBytes,
  };
}

function readJson(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new UsageError(what + ' not readable: ' + file + ' (' + err.message + ')');
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new UsageError(what + ' is not JSON: ' + file + ' (' + err.message + ')');
  }
}

function checkBaseline(baseline, file) {
  const isStringList = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string');
  if (!isStringList(baseline.externals) || !isStringList(baseline.neverOnTheBox) || !Number.isInteger(baseline.mainJsBytes)) {
    throw new UsageError('baseline needs string lists "externals" and "neverOnTheBox" and an integer "mainJsBytes": ' + file);
  }
}

function withSign(n) {
  return (n < 0 ? '-' : '+') + Math.abs(n).toLocaleString('en-US');
}

function report(verdict, ctx) {
  const lines = [];
  lines.push('box-externals-gate: ' + ctx.bundle);
  lines.push('  externals (' + verdict.externals.length + '): ' + (verdict.externals.join(', ') || 'none'));
  lines.push('  box package.json: ' + ctx.boxPackage + ' (' + ctx.pinnedCount + ' dependencies)');
  const added = verdict.added.map((name) => {
    const version = ctx.boxDependencies[name];
    return name + (isExactVersion(version) ? ' (pinned ' + version + ' on the box)' : '');
  });
  lines.push('  vs baseline: +' + (added.join(', ') || 'none') + '  -' + (verdict.removed.join(', ') || 'none'));
  if (verdict.unpinnedBaseline.length) {
    lines.push('  WARNING on the baseline but not pinned on the box: ' + verdict.unpinnedBaseline.join(', '));
  }
  const pct = verdict.baselineBytes ? ((verdict.sizeDelta / verdict.baselineBytes) * 100).toFixed(2) : '0.00';
  lines.push(
    '  size: ' + verdict.bundleBytes.toLocaleString('en-US') + ' B = baseline ' + verdict.baselineBytes.toLocaleString('en-US') +
      ' B ' + withSign(verdict.sizeDelta) + ' B (' + (verdict.sizeDelta < 0 ? '' : '+') + pct + '%)',
  );
  if (verdict.ok) {
    lines.push('PASS');
  } else {
    lines.push('REFUSED: ' + verdict.refusals.length + ' package(s)');
    for (const r of verdict.refusals) lines.push('  ' + r.name + ': ' + r.reason);
  }
  return lines;
}

/** Runs the gate; returns the exit code. `io` defaults to the console so a spec can capture the lines. */
function main(argv, io = { log: console.log, error: console.error }) {
  try {
    const args = parseArgs(argv, ARG_SPEC);
    const bundle = path.resolve(args.bundle || DEFAULTS.bundle);
    const baselineFile = path.resolve(args.baseline || DEFAULTS.baseline);
    const boxPackage = path.resolve(args.boxPackage || DEFAULTS.boxPackage);

    let source;
    try {
      source = fs.readFileSync(bundle, 'utf8');
    } catch (err) {
      throw new UsageError('bundle not readable (build it first: node scripts/build-all-apps.js rt-edge): ' + bundle + ' (' + err.message + ')');
    }
    const baseline = readJson(baselineFile, 'baseline');
    checkBaseline(baseline, baselineFile);
    const pkg = readJson(boxPackage, 'box package.json (pass --box-package)');
    const boxDependencies = pkg.dependencies && typeof pkg.dependencies === 'object' ? pkg.dependencies : {};

    const externals = externalsOf(source);
    const verdict = evaluate({ externals, baseline, boxDependencies, bundleBytes: Buffer.byteLength(source, 'utf8') });
    const lines = report({ ...verdict, externals }, { bundle, boxPackage, boxDependencies, pinnedCount: Object.keys(boxDependencies).length });
    for (const line of lines) io.log(line);
    return verdict.ok ? 0 : 1;
  } catch (err) {
    if (err instanceof UsageError) {
      io.error('box-externals-gate: ' + err.message);
      io.error(USAGE);
      return 2;
    }
    throw err;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  main,
  evaluate,
  externalsOf,
  packageName,
  isNodeBuiltin,
  isPathSpecifier,
  isExactVersion,
  report,
  DEFAULTS,
  GATE_SCRIPT,
  USAGE,
};
