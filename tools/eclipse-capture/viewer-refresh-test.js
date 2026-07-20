#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WebSocket = require('ws');
const puppeteer = require('puppeteer');
const { startCapture } = require('./server');

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'eclipse-viewer-refresh-'));
const STX = 0x02;
const ETX = 0x03;

function command(name, ...data) {
  return Buffer.from([STX, name.charCodeAt(0), ...data, ETX]);
}

function page(value) {
  return command('P', value & 0xff, (value >> 8) & 0xff);
}

function line(value) {
  return command('N', value);
}

function format(value) {
  return command('F', value);
}

function time(hour, minute, second, frame) {
  return command('T', hour, minute, second, frame);
}

function refresh(start, end) {
  return command('R', ...start, ...end);
}

function text(value) {
  return Buffer.from(value, 'utf8');
}

function replacementSnapshot(rows) {
  const start = [17, 52, 22, 1];
  // Observed Eclipse 12 marker: the ending bytes are not a valid timecode.
  const undocumentedEnd = [0x54, 0x1f, 0x17, 0x13];
  const parts = [refresh(start, undocumentedEnd), page(6), format(15)];
  rows.forEach((row) => {
    parts.push(line(row.line), time(...row.time), text(row.text));
  });
  parts.push(command('E'));
  return Buffer.concat(parts);
}

function liveRows(rows) {
  const parts = [page(6), format(15)];
  rows.forEach((row) => {
    parts.push(line(row.line), time(...row.time), text(row.text));
  });
  return Buffer.concat(parts);
}

function sendSnapshot(port, payload) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/eclipse`);
    ws.once('open', () => {
      ws.send(payload, (error) => {
        if (error) {
          reject(error);
          return;
        }
        ws.close(1000, 'snapshot complete');
      });
    });
    ws.once('close', resolve);
    ws.once('error', reject);
  });
}

async function main() {
  const rig = startCapture({ port: 0, tcpPort: null, out: OUT, cert: '', key: '', ping: 0 });
  let browser;

  try {
    const port = rig.httpServer.address().port;
    browser = await puppeteer.launch({ headless: true });
    const viewer = await browser.newPage();
    await viewer.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });

    await sendSnapshot(port, liveRows([
      { line: 1, time: [17, 52, 20, 0], text: 'unaffected before refresh' },
      { line: 20, time: [18, 0, 0, 0], text: 'stale tail removed by refresh' },
    ]));
    await sendSnapshot(port, replacementSnapshot([
      { line: 7, time: [17, 59, 41, 0], text: 'first version one' },
      { line: 8, time: [17, 59, 42, 0], text: 'first version two' },
      { line: 9, time: [17, 59, 45, 0], text: 'first version three' },
    ]));
    await viewer.waitForFunction(() => document.querySelectorAll('.transcript-line').length === 4);

    // Eclipse sends another complete replacement snapshot. Its line timecodes
    // can move, so canonical row keys differ even though the time span is the
    // same. The older snapshot must be removed atomically at E.
    await sendSnapshot(port, replacementSnapshot([
      { line: 7, time: [17, 59, 42, 1], text: 'corrected version one' },
      { line: 8, time: [17, 59, 44, 0], text: 'corrected version two' },
      { line: 9, time: [17, 59, 45, 2], text: 'corrected version three' },
    ]));
    await sendSnapshot(port, liveRows([
      { line: 10, time: [18, 0, 10, 0], text: 'new live row after refresh' },
    ]));
    await viewer.waitForFunction(() => document.querySelector('#chunks').textContent === '4');

    const state = await viewer.evaluate(() => ({
      rowCount: document.querySelectorAll('.transcript-line').length,
      firstVersionCount: [...document.querySelectorAll('.line-text')]
        .filter((node) => node.textContent.includes('first version')).length,
      correctedVersionCount: [...document.querySelectorAll('.line-text')]
        .filter((node) => node.textContent.includes('corrected version')).length,
      beforeRefreshCount: [...document.querySelectorAll('.line-text')]
        .filter((node) => node.textContent.includes('unaffected before')).length,
      staleTailCount: [...document.querySelectorAll('.line-text')]
        .filter((node) => node.textContent.includes('stale tail')).length,
      postRefreshCount: [...document.querySelectorAll('.line-text')]
        .filter((node) => node.textContent.includes('new live row')).length,
    }));

    assert.strictEqual(state.rowCount, 5, 'only the latest replacement rows and valid live rows remain');
    assert.strictEqual(state.firstVersionCount, 0, 'superseded refresh rows are removed');
    assert.strictEqual(state.correctedVersionCount, 3, 'all corrected refresh rows are visible');
    assert.strictEqual(state.beforeRefreshCount, 1, 'rows before the refresh start are preserved');
    assert.strictEqual(state.staleTailCount, 0, 'the Eclipse end sentinel removes the stale document tail');
    assert.strictEqual(state.postRefreshCount, 1, 'new realtime rows after E remain visible');
    console.log('VIEWER REFRESH TEST PASSED');
  } finally {
    if (browser) await browser.close();
    await rig.close();
  }
}

main().catch((error) => {
  console.error('VIEWER REFRESH TEST FAILED:', error.message);
  process.exitCode = 1;
});
