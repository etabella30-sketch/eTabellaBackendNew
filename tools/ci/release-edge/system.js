'use strict';
/**
 * The real side effects behind release-edge.js and rt-deploy-check.js.
 * Everything else in this folder takes these as an argument, so the specs
 * swap in fakes and never touch git, docker, the disk or a database.
 */

const fs = require('fs');
const { spawnSync } = require('child_process');

/**
 * Runs a program without a shell. `cmd` 'node' means this node binary.
 * opts.inherit streams output to this terminal (gate and builds); otherwise
 * stdout/stderr are captured. Returns { status, stdout, stderr, error }.
 */
function exec(cmd, args, opts = {}) {
  const res = spawnSync(cmd === 'node' ? process.execPath : cmd, args, {
    cwd: opts.cwd,
    env: opts.env ? { ...process.env, ...opts.env } : process.env,
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error ? res.error.message : null,
  };
}

/** Opens a pg client; loaded lazily so --sessions-file runs need no driver. */
async function pgConnect(connectionString) {
  const { Client } = require('pg');
  const client = new Client({
    connectionString,
    application_name: 'rt-deploy-check',
    connectionTimeoutMillis: 15000,
    statement_timeout: 15000,
  });
  await client.connect();
  return client;
}

function systemDeps(repoRoot) {
  return {
    repoRoot,
    cwd: process.cwd(),
    exec,
    fs,
    env: process.env,
    now: () => new Date(),
    nodeVersion: process.version,
    pgConnect,
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  };
}

module.exports = { systemDeps };
