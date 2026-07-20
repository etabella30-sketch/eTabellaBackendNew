#!/usr/bin/env node
/**
 * Smoke test for the capture rig — no Eclipse needed.
 * Starts the server in-process on ephemeral ports, connects a WS client
 * (with auth header + query token + subprotocol, the three candidate auth
 * placements) and a TCP client, sends known bytes, then asserts the capture
 * files contain exactly what was sent. Also regression-tests the crash and
 * flush hardening (malformed request line, shutdown with open connection).
 *
 *   node tools/eclipse-capture/smoke-test.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const http = require('http');
const WebSocket = require('ws');
const { startCapture } = require('./server');
const { convert, diff } = require('./convert');

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'eclipse-capture-smoke-'));
let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ok    ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${msg}`);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getHttp(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            statusCode: res.statusCode,
            contentType: res.headers['content-type'] || '',
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      })
      .on('error', reject);
  });
}

async function main() {
  // tcpPort 0 = ephemeral (null would disable it)
  const rig = startCapture({ port: 0, tcpPort: 0, out: OUT, cert: '', key: '', ping: 0 });
  await delay(200);
  const wsPort = rig.httpServer.address().port;
  const tcpPort = rig.tcpServer.address().port;

  const viewer = await getHttp(`http://127.0.0.1:${wsPort}/`);
  assert(viewer.statusCode === 200, 'live-feed viewer answers on /');
  assert(viewer.contentType.includes('text/html'), 'live-feed viewer is served as HTML');
  assert(viewer.body.includes('Eclipse Live Feed'), 'live-feed viewer contains its heading');

  // Known payload: one text frame + two binary frames (STX/ETX-flavored bytes,
  // Bridge-protocol-shaped, including 0x02/0x03 INSIDE data to prove the rig
  // never interprets payload bytes).
  const t = Buffer.from('hello transcript line 1\n', 'utf8');
  const b1 = Buffer.from([0x02, 0x50, 0x00, 0x01, 0x03]);
  const b2 = Buffer.from([0x02, 0x54, 0x0a, 0x1f, 0x2c, 0x00, 0x03, 0x51, 0x2e, 0x20, 0x47, 0x6f, 0x6f, 0x64, 0x02, 0x03]);
  const expected = Buffer.concat([t, b1, b2]);

  // --- crash hardening: malformed absolute-form request line ---------------
  await new Promise((resolve) => {
    const c = net.connect(wsPort, '127.0.0.1', () => {
      c.write('GET http:// HTTP/1.1\r\nHost: x\r\n\r\n');
      setTimeout(() => {
        c.destroy();
        resolve();
      }, 150);
    });
    c.on('error', () => resolve());
  });
  await new Promise((resolve) => {
    http
      .get(`http://127.0.0.1:${wsPort}/still-alive`, (res) => {
        assert(res.statusCode === 200, 'rig survives malformed request line (GET http://) and still answers');
        res.resume();
        resolve();
      })
      .on('error', () => {
        assert(false, 'rig survives malformed request line (GET http://) and still answers');
        resolve();
      });
  });

  // --- WS leg -------------------------------------------------------------
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${wsPort}/eclipse?token=SMOKETOKEN&nSesid=test-123`, ['eclipse-rt'], {
      headers: { Authorization: 'Basic c21va2U6dGVzdA==', 'X-Custom-Probe': 'smoke' },
    });
    ws.on('open', async () => {
      ws.send(t.toString('utf8')); // text frame
      await delay(50);
      ws.send(b1); // binary frame
      await delay(50);
      ws.send(b2); // binary frame
      await delay(50);
      ws.ping(Buffer.from('kp'));
      await delay(50);
      ws.close(1000, 'done');
    });
    ws.on('close', () => resolve());
    ws.on('error', reject);
  });

  // --- TCP browser noise: capture it, but never render it as transcript ----
  await new Promise((resolve, reject) => {
    const c = net.connect(tcpPort, '127.0.0.1', () => {
      c.end('GET /not-a-feed HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n');
    });
    c.on('close', resolve);
    c.on('error', reject);
  });

  // --- TCP leg: same bytes, split mid-record on purpose --------------------
  await new Promise((resolve, reject) => {
    const c = net.connect(tcpPort, '127.0.0.1', () => {
      c.write(expected.subarray(0, 7));
      setTimeout(() => {
        c.write(expected.subarray(7));
        setTimeout(() => c.end(), 100);
      }, 50);
    });
    c.on('close', resolve);
    c.on('error', reject);
  });
  await delay(300);

  const feedResponse = await getHttp(`http://127.0.0.1:${wsPort}/api/feed?after=0`);
  const wsOnlyResponse = await getHttp(`http://127.0.0.1:${wsPort}/api/feed?mode=ws&after=0`);
  const tcpOnlyResponse = await getHttp(`http://127.0.0.1:${wsPort}/api/feed?mode=tcp&after=0`);
  let feedBody = null;
  let wsOnlyBody = null;
  let tcpOnlyBody = null;
  try {
    feedBody = JSON.parse(feedResponse.body);
    wsOnlyBody = JSON.parse(wsOnlyResponse.body);
    tcpOnlyBody = JSON.parse(tcpOnlyResponse.body);
  } catch (_) {
    // Assertion below reports a useful failure instead of crashing the test.
  }
  assert(feedResponse.contentType.includes('application/json'), 'live-feed API is served as JSON');
  assert(Array.isArray(feedBody?.events), 'live-feed API returns an event list');
  assert(
    (wsOnlyBody?.events || []).every((event) => event.mode === 'ws'),
    'live-feed API isolates WebSocket events when mode=ws',
  );
  assert(
    (tcpOnlyBody?.events || []).every((event) => event.mode === 'tcp'),
    'live-feed API isolates TCP events when mode=tcp',
  );
  assert(
    !(feedBody?.events || []).some((event) => event.type === 'connection' || event.type === 'close'),
    'live-feed API omits per-socket lifecycle noise',
  );
  const liveText = (feedBody?.events || [])
    .filter((event) => event.type === 'data')
    .map((event) => event.utf8)
    .join('');
  const displayOperations = (feedBody?.events || [])
    .filter((event) => event.type === 'data' && Array.isArray(event.displayOps))
    .flatMap((event) => event.displayOps);
  const decodedText = displayOperations
    .filter((operation) => operation.type === 'text')
    .map((operation) => operation.text)
    .join('');
  const decodedCommands = displayOperations
    .filter((operation) => operation.type === 'command')
    .map((operation) => operation.command);
  assert(liveText.includes('hello transcript line 1'), 'live-feed API exposes received transcript bytes');
  assert(!liveText.includes('GET /not-a-feed'), 'live-feed API hides browser probes sent to the TCP port');
  assert(decodedText.includes('hello transcript line 1'), 'live-feed API exposes decoded transcript operations');
  assert(!decodedText.includes('GET /not-a-feed'), 'decoded transcript operations hide TCP browser probes');
  assert(decodedCommands.includes('P') && decodedCommands.includes('T'), 'live-feed API identifies Bridge control commands');
  assert(
    (wsOnlyBody?.events || []).filter((event) => event.type === 'data').every((event) => event.displayContext),
    'WebSocket feed events carry replay-safe Bridge position context',
  );

  // --- shutdown-flush hardening: open connection, close rig, expect flush --
  const openWs = new WebSocket(`ws://127.0.0.1:${wsPort}/flush-test`);
  await new Promise((resolve, reject) => {
    openWs.on('open', () => {
      openWs.send(b2);
      setTimeout(resolve, 100);
    });
    openWs.on('error', reject);
  });
  await rig.close(); // client deliberately NOT closed first

  // --- assertions ----------------------------------------------------------
  console.log(`\ncaptures in ${OUT}:`);
  const dirs = fs.readdirSync(OUT).sort();
  dirs.forEach((d) => console.log(`  ${d}`));

  const wsDirs = dirs.filter((d) => d.startsWith('ws_'));
  const wsDir = wsDirs[0];
  const flushDir = wsDirs[1];
  const tcpDirs = dirs.filter((d) => d.startsWith('tcp_'));
  const tcpDir = tcpDirs.find((d) => fs.readFileSync(path.join(OUT, d, 'payload.bin')).equals(expected));
  const tcpProbeDir = tcpDirs.find((d) =>
    fs.readFileSync(path.join(OUT, d, 'payload.bin')).toString('ascii').startsWith('GET /not-a-feed'),
  );
  const httpDir = dirs.find((d) => d.startsWith('http_'));
  assert(!!wsDir, 'ws capture directory created');
  assert(!!tcpDir, 'tcp capture directory created');
  assert(!!tcpProbeDir, 'TCP browser probe is still preserved in forensic captures');
  assert(!!httpDir, 'plain-HTTP probe recorded as http_* capture');

  if (wsDir) {
    const up = JSON.parse(fs.readFileSync(path.join(OUT, wsDir, 'upgrade.json'), 'utf8'));
    assert(up.query.token === 'SMOKETOKEN', 'upgrade.json records query token');
    assert(up.headers.authorization === 'Basic c21va2U6dGVzdA==', 'upgrade.json records Authorization header');
    assert(up.headers['sec-websocket-protocol'] === 'eclipse-rt', 'upgrade.json records offered subprotocol');
    assert(up.path === '/eclipse', 'upgrade.json records path');
    assert(Array.isArray(up.rawHeaders) && up.rawHeaders.length > 0, 'upgrade.json preserves rawHeaders order');

    const payload = fs.readFileSync(path.join(OUT, wsDir, 'payload.bin'));
    assert(payload.equals(expected), `ws payload.bin matches sent bytes (${payload.length}B)`);

    const frames = fs
      .readFileSync(path.join(OUT, wsDir, 'frames.ndjson'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    const kinds = frames.map((f) => f.kind);
    assert(kinds.includes('text') && kinds.includes('binary'), 'frames.ndjson recorded text + binary opcodes');
    assert(kinds.includes('ping'), 'frames.ndjson recorded client ping');
    const closeRec = frames.find((f) => f.kind === 'close');
    assert(!!closeRec && closeRec.code === 1000, 'frames.ndjson recorded close code 1000');

    const summary = JSON.parse(fs.readFileSync(path.join(OUT, wsDir, 'summary.json'), 'utf8'));
    assert(summary.closeCode === 1000, 'summary.json has closeCode');
  }

  if (tcpDir) {
    const payload = fs.readFileSync(path.join(OUT, tcpDir, 'payload.bin'));
    assert(payload.equals(expected), `tcp payload.bin matches sent bytes despite chunk split (${payload.length}B)`);
    const frames = fs
      .readFileSync(path.join(OUT, tcpDir, 'frames.ndjson'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    assert(frames.filter((f) => f.kind === 'tcp-data').length === 2, 'tcp capture preserved 2 arrival chunks');
  }

  if (flushDir) {
    const summaryPath = path.join(OUT, flushDir, 'summary.json');
    assert(fs.existsSync(summaryPath), 'rig shutdown wrote summary.json for still-open connection');
    const payload = fs.readFileSync(path.join(OUT, flushDir, 'payload.bin'));
    assert(payload.equals(b2), 'rig shutdown flushed buffered payload of still-open connection');
  } else {
    assert(false, 'second ws capture dir (flush test) exists');
  }

  // --- convert + diff round-trip -------------------------------------------
  if (wsDir && tcpDir) {
    const rc = diff(path.join(OUT, wsDir), path.join(OUT, tcpDir));
    assert(rc === 0, 'convert.js diff: ws payload IDENTICAL to tcp payload');
    convert(path.join(OUT, wsDir), 'smoke');
    assert(fs.existsSync(path.join(OUT, wsDir, 'smoke.law')), 'convert.js produced .law replay file');
    const law = fs.readFileSync(path.join(OUT, wsDir, 'smoke.law'));
    assert(law.equals(expected), '.law file is byte-identical to payload');
  }

  try {
    openWs.terminate();
  } catch (_) {
    /* already gone */
  }

  console.log(failures === 0 ? '\nSMOKE TEST PASSED' : `\nSMOKE TEST FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exit(1);
});
