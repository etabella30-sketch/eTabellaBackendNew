'use strict';
/**
 * preflight-check.js: the in-image half of edge-preflight.sh (docker/edge/README.md).
 *
 * edge-preflight.sh runs it with the RELEASED image's own node, in a throw-away container
 * (--network none --read-only --cap-drop ALL), with the box config mounted read-only. So it checks what the box
 * will really run with: the image's Node, the image's file system and the box's config.
 *
 * Installed on the box as /usr/local/lib/etabella-edge/preflight-check.js. Plain CommonJS, no dependencies, so the
 * same file runs under the image's node and under the specs (docker/edge/edge-deploy.spec.ts).
 *
 * Input (environment):
 *   PREFLIGHT_CONFIG        the box config to read (default /preflight/box-config.json)
 *   PREFLIGHT_CONFIG_DIR    the directory the config lives in INSIDE the rt-edge container, used to resolve
 *                           relative paths exactly as box-config.ts does (default /etc/etabella-edge)
 *   PREFLIGHT_DATA_MOUNT    the only writable mount of the rt-edge container (default /var/lib/etabella-edge)
 *   PREFLIGHT_LAB           '1' on a lab box: "dev mode" and "no FE bundle" become warnings
 *   LABEL_VERSION           image label org.opencontainers.image.version ('' when absent)
 *   LABEL_REVISION          image label org.opencontainers.image.revision (backend commit)
 *   LABEL_FE_COMMIT         image label com.etabella.fe-commit
 *   PREFLIGHT_SQLITE_MODULE the builtin to probe (default node:sqlite; specs use it to simulate an old Node)
 *
 * Output: one finding per line on stdout, "REFUSE <text>" or "WARN <text>", then exit 0. Any other exit status
 * means the check itself failed, and edge-preflight.sh refuses to start.
 *
 * It does not re-validate the whole config: the app does that at start (exit 78, every problem listed). It checks
 * what the app cannot see: the release discipline (D6), the runtime the image ships, and the container layout —
 * plus the one config rule tied to the compose file, `shutdownTimeoutMs` against the stop_grace_period, refused here
 * with the app's own words so a box never starts with a shutdown budget Docker would cut short.
 */
const fs = require('fs');
const path = require('path');

// Paths use the platform's rules, exactly like box-config.ts (`path.resolve`); in the container that is POSIX.
const env = process.env;
const CONFIG = env.PREFLIGHT_CONFIG || '/preflight/box-config.json';
const CONFIG_DIR = env.PREFLIGHT_CONFIG_DIR || '/etc/etabella-edge';
const DATA_MOUNT = path.resolve(env.PREFLIGHT_DATA_MOUNT || '/var/lib/etabella-edge');
const LAB = env.PREFLIGHT_LAB === '1';
const SQLITE_MODULE = env.PREFLIGHT_SQLITE_MODULE || 'node:sqlite';
/** box-config.ts defaults (`paths.dataDir`, `paths.publicDir`). */
const DEFAULT_DATA_DIR = '/var/lib/etabella-edge';
const DEFAULT_PUBLIC_DIR = '/app/public';
/** The compose healthcheck probes 127.0.0.1 on this port. */
const HEALTHCHECK_PORT = 443;
/**
 * The shutdown budget, the same numbers as box-config.ts (EDGE_STOP_GRACE_MS, EDGE_SHUTDOWN_STEPS,
 * EDGE_SHUTDOWN_RESERVE_MS; edge-deploy.spec.ts keeps them equal): five shutdown steps, each bounded by
 * `shutdownTimeoutMs`, plus a 20 s reserve must end inside the compose file's 120 s stop_grace_period.
 */
const STOP_GRACE_MS = 120000;
const SHUTDOWN_STEPS = 5;
const SHUTDOWN_RESERVE_MS = 20000;
const SHUTDOWN_STEP_MAX_MS = Math.floor((STOP_GRACE_MS - SHUTDOWN_RESERVE_MS) / SHUTDOWN_STEPS);

const findings = [];
const refuse = text => findings.push('REFUSE ' + text);
const warn = text => findings.push('WARN ' + text);
/** A lab box downgrades some refusals to warnings. */
const refuseUnlessLab = text => (LAB ? warn(text + ' (allowed on a lab box)') : refuse(text));

/** True when node:sqlite loads and opens a database (Node >= 22.13 without flags; spec: node:sqlite WAL). */
function sqliteWorks() {
  let mod;
  try {
    mod = typeof process.getBuiltinModule === 'function' ? process.getBuiltinModule(SQLITE_MODULE) : require(SQLITE_MODULE);
  } catch (err) {
    return false;
  }
  if (!mod || typeof mod.DatabaseSync !== 'function') return false;
  try {
    const db = new mod.DatabaseSync(':memory:');
    db.exec('CREATE TABLE t (x INTEGER); INSERT INTO t VALUES (1);');
    db.close();
    return true;
  } catch (err) {
    return false;
  }
}

/** Strip the release-tag prefix so `rt-edge-v1.0.0`, `v1.0.0` and `1.0.0` compare equal. */
function semverOf(value) {
  return String(value || '').trim().replace(/^rt-edge-v/i, '').replace(/^v/i, '');
}

/** A config commit matches a label commit when it is a 7+ hex prefix of it. */
function commitMatches(configValue, labelValue) {
  const c = String(configValue || '').trim().toLowerCase();
  const l = String(labelValue || '').trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(c) && l.startsWith(c);
}

/** A label value docker printed for a missing label. */
function label(name) {
  const value = String(env[name] || '').trim();
  return value === '<no value>' ? '' : value;
}

function str(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** True when absolute path `p` is `dir` or inside it. */
function under(dir, p) {
  const rel = path.relative(dir, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function checkRuntime() {
  if (!sqliteWorks()) {
    refuse(
      'the image runs Node ' + process.version + ' without a working ' + SQLITE_MODULE + ': rt-edge keeps its state and checkpoints in ' +
        'node:sqlite (Node >= 22.13). Rebuild monorepo-base on a newer Node (docker/edge/README.md, "Node runtime").',
    );
  }
}

function readConfig() {
  let text;
  try {
    text = fs.readFileSync(CONFIG, 'utf8');
  } catch (err) {
    refuse('cannot read the box config ' + CONFIG + ' (' + (err && err.code ? err.code : String(err)) + ')');
    return null;
  }
  let raw;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch (err) {
    refuse('the box config is not valid JSON (' + err.message + ')');
    return null;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    refuse('the box config must be a JSON object');
    return null;
  }
  return raw;
}

function section(raw, key) {
  const value = raw[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function checkMode(raw) {
  const mode = raw.mode === undefined ? 'production' : raw.mode;
  if (mode === 'dev') refuseUnlessLab('the box config is in dev mode (plain HTTP allowed): never on a venue box');
  const http = section(raw, 'http');
  if (http.tls === null) refuseUnlessLab('http.tls is null (plain HTTP): HTTPS with HSTS is mandatory on a venue box (spec §8.3)');
  const host = http.host === undefined ? '0.0.0.0' : http.host;
  if (host !== '0.0.0.0') warn('http.host is ' + JSON.stringify(host) + ': the compose healthcheck probes 127.0.0.1 and will report unhealthy');
  const port = http.port === undefined ? HEALTHCHECK_PORT : http.port;
  if (port !== HEALTHCHECK_PORT) warn('http.port is ' + JSON.stringify(port) + ': the compose healthcheck probes ' + HEALTHCHECK_PORT + ' and will report unhealthy');
}

/** Every path the box WRITES must sit on the data mount, else it fails on the read-only container root. */
function checkWritablePaths(raw) {
  const paths = section(raw, 'paths');
  const resolve = p => path.resolve(CONFIG_DIR, p);
  const dataDir = resolve(str(paths.dataDir) || DEFAULT_DATA_DIR);
  const written = {
    'paths.dataDir': dataDir,
    'paths.stateDb': resolve(str(paths.stateDb) || path.join(dataDir, 'edge.sqlite')),
    'paths.journalDir': resolve(str(paths.journalDir) || path.join(dataDir, 'journal')),
    'paths.captureDir': resolve(str(paths.captureDir) || path.join(dataDir, 'capture')),
    'paths.certDir': resolve(str(paths.certDir) || path.join(dataDir, 'certs')),
    'paths.deviceKeyFile': resolve(str(paths.deviceKeyFile) || path.join(dataDir, 'device-key.pem')),
  };
  const tls = section(section(raw, 'http'), 'tls');
  for (const key of ['certFile', 'keyFile']) {
    const value = str(tls[key]);
    if (value) written['http.tls.' + key] = resolve(value);
  }
  for (const [key, value] of Object.entries(written)) {
    if (!under(DATA_MOUNT, value)) {
      refuse(key + ' resolves to ' + value + ', outside ' + DATA_MOUNT + ' (the only writable mount; the container root is read-only)');
    }
  }
  const publicDir = resolve(str(paths.publicDir) || DEFAULT_PUBLIC_DIR);
  if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
    refuseUnlessLab(
      'no FE edge bundle at paths.publicDir ' + publicDir + ' (no index.html in the image): the room could not load the box page. ' +
        'release-edge bakes the bundle at /usr/src/app/fe-edge',
    );
  }
}

/**
 * The shutdown budget (box-config.ts `shutdownTimeoutMs`, same rule and same words): an integer 1..20000, so that
 * 5 x value + 20 s reserve <= the 120 s stop_grace_period. A larger value would let the container be SIGKILLed in the
 * middle of the journal flush. Absent or null = the default (20000).
 */
function checkShutdownTimeout(raw) {
  const value = raw.shutdownTimeoutMs;
  if (value === undefined || value === null) return;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > SHUTDOWN_STEP_MAX_MS) {
    refuse(
      'shutdownTimeoutMs must be an integer 1-' + SHUTDOWN_STEP_MAX_MS + ' (the ' + SHUTDOWN_STEPS + ' shutdown steps run one after another and must end ' +
        "inside the container's " + STOP_GRACE_MS / 1000 + ' s stop_grace_period)',
    );
  }
}

/** D6: the config's release fields must describe the image that runs (BoxDetails, e.status `sw`). */
function checkRelease(raw) {
  const release = section(raw, 'release');
  const version = str(release.version);
  const backendCommit = str(release.backendCommit);
  const feCommit = str(release.feCommit);
  const labelVersion = label('LABEL_VERSION');
  const labelRevision = label('LABEL_REVISION');
  const labelFe = label('LABEL_FE_COMMIT');

  if (!labelVersion) {
    warn('the image has no org.opencontainers.image.version label: it was not built by tools/ci/release-edge.js, so nothing ties it to a release manifest');
  } else if (!version) {
    refuse('release.version is not set; the image is ' + labelVersion + ' (copy it from the release manifest)');
  } else if (semverOf(version) !== semverOf(labelVersion)) {
    refuse('release.version ' + JSON.stringify(version) + ' does not match the image (' + labelVersion + ')');
  }

  const commitCheck = (field, configValue, labelValue) => {
    if (!labelValue) return;
    if (!configValue) {
      warn(field + ' is not set; the image says ' + labelValue);
    } else if (!commitMatches(configValue, labelValue)) {
      refuse(field + ' ' + JSON.stringify(configValue) + ' does not match the image (' + labelValue + '); copy it from the release manifest');
    }
  };
  commitCheck('release.backendCommit', backendCommit, labelRevision);
  commitCheck('release.feCommit', feCommit, labelFe);
}

function main() {
  checkRuntime();
  const raw = readConfig();
  if (raw) {
    checkMode(raw);
    checkWritablePaths(raw);
    checkShutdownTimeout(raw);
    checkRelease(raw);
  }
  for (const line of findings) process.stdout.write(line + '\n');
}

main();
