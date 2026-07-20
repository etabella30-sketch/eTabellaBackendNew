#!/usr/bin/env node
/**
 * Convert / inspect eclipse-capture output.
 *
 *   node convert.js <captureDir> [--name mycapture]
 *       Produces, next to the capture:
 *         <name>.law          raw payload bytes — copy into ${ASSETS}law/ and replay
 *                             with POST /startfeed {file:"<name>.law", batch:16, nDelay:50}
 *                             BRIDGE ('B') SESSIONS ONLY — /startfeed always calls
 *                             splitCommands; a CaseView capture would hit the wrong parser
 *         <name>.frames.json  [{i, kind, bytes, hex}] — frame boundaries preserved
 *         <name>.hexdump.txt  human-readable dump of the payload stream
 *
 *   node convert.js diff <a> <b>
 *       Byte-diff two payload.bin files (e.g. tcp_* vs ws_* capture of the same
 *       feed) — prints sizes, common prefix length, first divergence offset.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function hexdump(buf) {
  const lines = [];
  for (let off = 0; off < buf.length; off += 16) {
    const slice = buf.subarray(off, Math.min(off + 16, buf.length));
    const hex = [...slice].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = [...slice].map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.')).join('');
    lines.push(`${off.toString(16).padStart(8, '0')}  ${hex.padEnd(47)}  |${ascii}|`);
  }
  return lines.join('\n') + '\n';
}

function convert(captureDir, name) {
  const payloadPath = path.join(captureDir, 'payload.bin');
  const framesPath = path.join(captureDir, 'frames.ndjson');
  if (!fs.existsSync(payloadPath)) {
    console.error(`no payload.bin in ${captureDir}`);
    process.exit(1);
  }
  const base = name || path.basename(captureDir);
  const payload = fs.readFileSync(payloadPath);

  const lawPath = path.join(captureDir, `${base}.law`);
  fs.writeFileSync(lawPath, payload);

  let frames = [];
  if (fs.existsSync(framesPath)) {
    frames = fs
      .readFileSync(framesPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch (_) {
          // torn final line from a hard-killed rig — skip, warn
          console.warn('warning: skipping unparseable frames.ndjson line (rig killed mid-write?)');
          return null;
        }
      })
      .filter((f) => f && (f.kind === 'text' || f.kind === 'binary' || f.kind === 'tcp-data'))
      .map((f) => ({ i: f.i, kind: f.kind, bytes: f.bytes, hex: f.hex }));
  }
  fs.writeFileSync(path.join(captureDir, `${base}.frames.json`), JSON.stringify(frames, null, 1));
  fs.writeFileSync(path.join(captureDir, `${base}.hexdump.txt`), hexdump(payload));

  console.log(`payload : ${payload.length} bytes, ${frames.length} data frames`);
  console.log(`law     : ${lawPath}`);
  console.log(`replay  : copy to \${ASSETS}law/ then POST /startfeed {"file":"${base}.law","batch":16,"nDelay":50}`);
  console.log(`          (Bridge 'B' sessions only; batch = HEX CHARS, must be even — 16 = 8 bytes/chunk)`);
}

function resolvePayload(p) {
  // Accept either a payload.bin path or a capture dir.
  if (fs.statSync(p).isDirectory()) return path.join(p, 'payload.bin');
  return p;
}

function diff(aPath, bPath) {
  const a = fs.readFileSync(resolvePayload(aPath));
  const b = fs.readFileSync(resolvePayload(bPath));
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      firstDiff = i;
      break;
    }
  }
  console.log(`A: ${a.length} bytes  (${aPath})`);
  console.log(`B: ${b.length} bytes  (${bPath})`);
  if (firstDiff === -1 && a.length === b.length) {
    console.log('IDENTICAL — WS payload matches TCP stream byte-for-byte.');
    return 0;
  }
  if (firstDiff === -1) {
    console.log(`PREFIX MATCH for ${n} bytes; ${a.length > b.length ? 'A' : 'B'} has ${Math.abs(a.length - b.length)} extra trailing bytes.`);
    return 1;
  }
  console.log(`FIRST DIVERGENCE at offset ${firstDiff} (0x${firstDiff.toString(16)})`);
  const ctx = 16;
  const lo = Math.max(0, firstDiff - ctx);
  console.log(`A[${lo}..]: ${a.subarray(lo, firstDiff + ctx).toString('hex')}`);
  console.log(`B[${lo}..]: ${b.subarray(lo, firstDiff + ctx).toString('hex')}`);
  return 1;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv[0] === 'diff') {
    if (argv.length < 3) {
      console.error('usage: node convert.js diff <a(payload.bin|dir)> <b(payload.bin|dir)>');
      process.exit(2);
    }
    process.exit(diff(argv[1], argv[2]));
  }
  if (!argv[0]) {
    console.error('usage: node convert.js <captureDir> [--name out] | node convert.js diff <a> <b>');
    process.exit(2);
  }
  const nameIdx = argv.indexOf('--name');
  convert(argv[0], nameIdx > -1 ? argv[nameIdx + 1] : undefined);
}

module.exports = { convert, diff, hexdump };
