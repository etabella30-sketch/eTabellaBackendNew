#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validateCapture } = require('./validate-bridge');

function command(name, data = []) {
  return Buffer.from([0x02, name.charCodeAt(0), ...data, 0x03]);
}

function globalReplacement(search, replacement) {
  const searchBytes = Buffer.from(search, 'ascii');
  const replacementBytes = Buffer.from(replacement, 'ascii');
  return Buffer.concat([
    Buffer.from([0x02, 0x47, searchBytes.length]),
    searchBytes,
    Buffer.from([replacementBytes.length]),
    replacementBytes,
    Buffer.from([0x03]),
  ]);
}

function writeCapture(dir, buffers, closed = true) {
  fs.mkdirSync(dir, { recursive: true });
  const records = buffers.map((buf, index) =>
    JSON.stringify({ i: index + 1, kind: 'binary', bytes: buf.length, hex: buf.toString('hex') }),
  );
  fs.writeFileSync(path.join(dir, 'frames.ndjson'), `${records.join('\n')}\n`);
  if (closed) fs.writeFileSync(path.join(dir, 'summary.json'), '{}\n');
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-validator-'));
  try {
    const validDir = path.join(root, 'valid');
    writeCapture(validDir, [
      globalReplacement('{FILENAME}', 'TEST-JOB'),
      command('P', [0x01, 0x00]),
      command('N', [0x02]),
      command('T', [12, 34, 56, 29]),
      Buffer.from('transcript omitted from validator output', 'utf8'),
      command('R', [12, 34, 50, 0, 12, 34, 56, 29]),
      command('F', [0x01]),
      command('E'),
      command('D'),
      command('K'),
    ]);
    const valid = await validateCapture(validDir);
    assert.strictEqual(valid.status, 'PASS');
    assert.strictEqual(valid.errors.length, 0);
    assert.strictEqual(valid.filenameMarkers, 1);
    assert.strictEqual(valid.commands.R, 1);
    assert.strictEqual(valid.commands.E, 1);
    assert.strictEqual(valid.transcriptMessages, 1);

    const eclipseExtensionDir = path.join(root, 'eclipse-extension');
    writeCapture(eclipseExtensionDir, [
      globalReplacement('{FILENAME}', 'TEST-JOB'),
      command('R', [12, 34, 50, 0, 0x54, 0x1f, 0x17, 0x13]),
      command('E'),
    ]);
    const eclipseExtension = await validateCapture(eclipseExtensionDir);
    assert.strictEqual(eclipseExtension.status, 'PASS_WITH_WARNINGS');
    assert.strictEqual(eclipseExtension.undocumentedRefreshEndMarkers, 1);
    assert.strictEqual(eclipseExtension.errors.length, 0);

    const invalidDir = path.join(root, 'invalid');
    writeCapture(invalidDir, [
      globalReplacement('{FILENAME}', 'TEST-JOB'),
      command('T', [24, 0, 0, 0]),
      command('R', [12, 0, 0, 0, 25, 0, 0, 0]),
      command('E'),
      command('H'),
      command('E'),
    ]);
    const invalid = await validateCapture(invalidDir);
    assert.strictEqual(invalid.status, 'FAIL');
    assert(invalid.errors.some((issue) => issue.message.includes('out-of-range timecode')));
    assert(invalid.errors.some((issue) => issue.message.includes('out-of-range ending timecode')));
    assert(invalid.errors.some((issue) => issue.message.includes('legacy parser')));
    assert(invalid.errors.some((issue) => issue.message.includes('without an open R')));

    console.log('BRIDGE VALIDATOR TEST PASSED');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`BRIDGE VALIDATOR TEST FAILED: ${err.stack || err.message}`);
  process.exit(1);
});
