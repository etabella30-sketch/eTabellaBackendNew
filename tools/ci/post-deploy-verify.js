#!/usr/bin/env node
/**
 * post-deploy-verify: the checks to run AFTER an upload set (upload-<date>/README.txt) is installed, from a machine
 * that reaches the cloud and, when given, the venue box. Read-only: GET requests only, nothing is written anywhere.
 *
 *   node tools/ci/post-deploy-verify.js --cloud https://etabella.net [--box https://192.168.20.2:4000]
 *                                       [--case <nCaseid>] [--edge-token-env EDGE_TOKEN] [--insecure]
 *
 * Checks (each prints PASS / FAIL / SKIP with one line of evidence; exit 1 when any FAIL):
 *   cloud.realtime.swagger   realtime-server answers its Swagger document, and the shared DTO docs of D9 are in it
 *                            (TeamUsersRealtimeQuery.nCaseid 'Case ID', FactsheetSaveBody.nRv 'Review status ...').
 *   cloud.core.swagger       coreapi answers its Swagger document with TeamUsersCoreQuery.nCaseid documented.
 *   cloud.fe.bundle          the web root serves an index whose main bundle carries the 2026-10-06 FE work:
 *                            the @ mention picker (app-fact-note-mentions), the one-band mark height
 *                            (--rt-text-band) and the DocLink card open (openLinkedDocument).
 *   box.ping                 the box answers /edge/ping (when --box is given).
 *   box.teamusers            GET <box>/realtimeapi/factsheet/teamusers?nCaseid=<case> with the edge token from the
 *                            named environment variable answers 200 and a JSON array (the shared team-users controller
 *                            relaying to the cloud). Needs --box, --case and --edge-token-env. The token is read from
 *                            the environment and never printed.
 *   box.marknav              GET <box>/realtimeapi/marknav/quickmarklist?nSesid=<uuid> with the same token answers
 *                            200 (the Phase 8 shared controller relaying; an unknown session answers a 200/403 JSON
 *                            body, never a 500). Needs --box and --edge-token-env; --session <nSesid> optional.
 *
 * The visual checks stay manual (README.txt "After the upload"): the @ picker lists participants and adds one to the
 * fact, a DocLink card opens the linked document, Compare keeps one zoom for both panes, Fact and Quick Mark bands
 * share one height.
 */
'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

const cloud = (arg('cloud', '') || '').replace(/\/$/, '');
const box = (arg('box', '') || '').replace(/\/$/, '');
const nCaseid = arg('case', '');
const nSesid = arg('session', '00000000-0000-4000-8000-000000000000');
const tokenEnv = arg('edge-token-env', '');
const insecure = flag('insecure');

if (!cloud) {
  console.error('usage: node tools/ci/post-deploy-verify.js --cloud https://etabella.net [--box https://host:port] [--case <nCaseid>] [--edge-token-env EDGE_TOKEN] [--session <nSesid>] [--insecure]');
  process.exit(2);
}

/** GET with a byte cap; never follows redirects (a redirect is reported as its status). */
function get(url, headers = {}, maxBytes = 12 * 1024 * 1024) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(u, { method: 'GET', headers: { accept: '*/*', ...headers }, rejectUnauthorized: !insecure, timeout: 20000 }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size <= maxBytes) chunks.push(c);
      });
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, text: Buffer.concat(chunks).toString('utf8'), truncated: size > maxBytes }));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (err) => resolve({ status: 0, headers: {}, text: '', error: err.message }));
    req.end();
  });
}

const results = [];
function report(name, ok, evidence) {
  results.push({ name, ok });
  console.log(`${ok === null ? 'SKIP' : ok ? 'PASS' : 'FAIL'}  ${name}  ${evidence}`);
}

function schemaProp(doc, schema, prop) {
  return doc && doc.components && doc.components.schemas && doc.components.schemas[schema] && doc.components.schemas[schema].properties
    ? doc.components.schemas[schema].properties[prop]
    : undefined;
}

async function swaggerCheck(name, base, expectations) {
  const res = await get(`${base}/swagger-json`);
  if (res.status !== 200) return report(name, false, `${base}/swagger-json answered ${res.status}${res.error ? ' ' + res.error : ''}`);
  let doc;
  try {
    doc = JSON.parse(res.text);
  } catch {
    return report(name, false, 'swagger-json is not JSON');
  }
  const missing = expectations.filter(([schema, prop, description]) => {
    const p = schemaProp(doc, schema, prop);
    return !p || (description && !String(p.description || '').startsWith(description));
  });
  report(name, missing.length === 0, missing.length === 0 ? `${expectations.length} documented DTO fields present` : `missing: ${missing.map(([s, p]) => `${s}.${p}`).join(', ')}`);
}

async function feBundleCheck() {
  const index = await get(`${cloud}/index.html`);
  if (index.status !== 200) return report('cloud.fe.bundle', false, `index.html answered ${index.status}${index.error ? ' ' + index.error : ''}`);
  const m = index.text.match(/src="\/?(main-[A-Za-z0-9]+\.js)"/);
  if (!m) return report('cloud.fe.bundle', false, 'index.html names no main-*.js bundle');
  const bundle = await get(`${cloud}/${m[1]}`);
  if (bundle.status !== 200) return report('cloud.fe.bundle', false, `${m[1]} answered ${bundle.status}`);
  const markers = ['app-fact-note-mentions', '--rt-text-band', 'openLinkedDocument'];
  const missing = markers.filter((s) => !bundle.text.includes(s));
  report('cloud.fe.bundle', missing.length === 0, missing.length === 0 ? `${m[1]} carries ${markers.join(', ')}` : `${m[1]} lacks ${missing.join(', ')}`);
}

async function boxChecks() {
  if (!box) return report('box.ping', null, 'no --box given');
  const ping = await get(`${box}/edge/ping`);
  report('box.ping', ping.status === 200, `/edge/ping answered ${ping.status}${ping.error ? ' ' + ping.error : ''}`);
  const token = tokenEnv ? process.env[tokenEnv] : '';
  if (!tokenEnv || !token) {
    report('box.teamusers', null, 'no --edge-token-env (or the variable is empty)');
    report('box.marknav', null, 'no --edge-token-env (or the variable is empty)');
    return;
  }
  const auth = { authorization: `Bearer ${token}` };
  if (!nCaseid) report('box.teamusers', null, 'no --case given');
  else {
    const res = await get(`${box}/realtimeapi/factsheet/teamusers?nCaseid=${encodeURIComponent(nCaseid)}`, auth);
    let body;
    try { body = JSON.parse(res.text); } catch { body = undefined; }
    const ok = res.status === 200 && Array.isArray(body);
    report('box.teamusers', ok, ok ? `200, ${body.length} team member(s), x-edge-source=${res.headers['x-edge-source'] || '-'}` : `answered ${res.status} ${res.text.slice(0, 160)}`);
  }
  const marks = await get(`${box}/realtimeapi/marknav/quickmarklist?nSesid=${encodeURIComponent(nSesid)}`, auth);
  const isJson = /json/.test(String(marks.headers['content-type'] || ''));
  const ok = isJson && marks.status < 500;
  report('box.marknav', ok, `answered ${marks.status} ${isJson ? 'JSON' : marks.headers['content-type'] || ''} x-edge-source=${marks.headers['x-edge-source'] || '-'}`);
}

(async () => {
  await swaggerCheck('cloud.realtime.swagger', `${cloud}/realtimeapi`, [
    ['TeamUsersRealtimeQuery', 'nCaseid', 'Case ID'],
    ['FactsheetSaveBody', 'nRv', 'Review status'],
    ['FactsheetQuery', 'nFSid', 'nFSid'],
  ]);
  await swaggerCheck('cloud.core.swagger', `${cloud}/coreapi`, [['TeamUsersCoreQuery', 'nCaseid', 'nCaseid']]);
  await feBundleCheck();
  await boxChecks();
  const failed = results.filter((r) => r.ok === false);
  console.log(`\n${results.filter((r) => r.ok === true).length} passed, ${failed.length} failed, ${results.filter((r) => r.ok === null).length} skipped`);
  process.exitCode = failed.length ? 1 : 0;
})();
