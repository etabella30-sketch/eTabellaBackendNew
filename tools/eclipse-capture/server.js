#!/usr/bin/env node
/**
 * Eclipse 12 wire-capture rig — Phase 1 of docs/eclipse-wss-ingest-plan.md.
 *
 * Accepts raw WebSocket connections (and optionally plain TCP) from Eclipse 12
 * and records EVERYTHING needed for the protocol memo:
 *   - the full HTTP upgrade request (raw header order preserved — auth placement!)
 *   - every message: opcode, timestamp, size, hex payload
 *     (note: ws delivers reassembled MESSAGES, not raw fragments — fine for
 *      payload ground truth; fragment boundaries are not observable here)
 *   - ping/pong/close semantics
 *   - a concatenated payload.bin per connection, directly replayable through the
 *     existing parser via POST /startfeed (Bridge 'B' sessions only — see README.md)
 *
 * Design rule: this rig NEVER crashes on weird client behavior — it records.
 * Zero backend impact: standalone script, uses the `ws` package already present
 * in node_modules (socket.io dependency). Run from the repo root:
 *
 *   node tools/eclipse-capture/server.js --port 8090
 *   node tools/eclipse-capture/server.js --port 8443 --cert cert.pem --key key.pem   (direct wss)
 *   node tools/eclipse-capture/server.js --port 8090 --tcp-port 2500                 (also capture Socket Connection output)
 *
 * Captures land in tools/eclipse-capture/captures/<mode>_<n>_<timestamp>/
 */
'use strict';

const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { BridgePreviewDecoder } = require('./bridge-preview');

const MAX_WS_PAYLOAD = 16 * 1024 * 1024; // 16 MiB per message — far above any steno feed
const MAX_HTTP_CAPTURES = 20; // plain-HTTP probes recorded at most this many times (scanner spam guard)
const MAX_FEED_EVENTS = 5000; // in-memory ring for the live viewer

// ---------------------------------------------------------------------------
// live viewer event ring — lets a browser watch the feed arrive in real time
// ---------------------------------------------------------------------------
const feedEvents = [];
let eventSeq = 0;
const displayProtocolStates = new Map();

function pushEvent(evt) {
  eventSeq += 1;
  feedEvents.push({ id: eventSeq, ts: new Date().toISOString(), ...evt });
  if (feedEvents.length > MAX_FEED_EVENTS) feedEvents.shift();
}

function emptyDisplayCursor() {
  return { page: null, line: null, format: 0, timecode: null };
}

function copyTimecode(value) {
  return value ? { hour: value.hour, minute: value.minute, second: value.second, frame: value.frame } : null;
}

function copyDisplayCursor(cursor) {
  return {
    page: cursor.page,
    line: cursor.line,
    format: cursor.format,
    timecode: copyTimecode(cursor.timecode),
  };
}

function applyCursorOperation(cursor, operation) {
  switch (operation.command) {
    case 'P':
      if (cursor.page !== operation.page) {
        cursor.page = operation.page;
        cursor.line = null;
      }
      break;
    case 'N':
      cursor.line = operation.line;
      break;
    case 'F':
      cursor.format = operation.format;
      break;
    case 'T':
      cursor.timecode = copyTimecode(operation.timecode);
      break;
    default:
      break;
  }
}

/**
 * Preserve enough Bridge positioning state outside the bounded event ring for
 * a newly opened browser to start mid-page or mid-refresh without creating
 * unkeyed/duplicate rows. This is display metadata only; raw captures remain
 * untouched.
 */
function contextualizeDisplayOperations(mode, operations) {
  if (!displayProtocolStates.has(mode)) {
    displayProtocolStates.set(mode, { live: emptyDisplayCursor(), refresh: null });
  }
  const state = displayProtocolStates.get(mode);

  for (const operation of operations || []) {
    if (operation.type !== 'command') continue;
    if (operation.command === 'G' && operation.filenameMarker && !state.refresh) {
      state.live = emptyDisplayCursor();
      continue;
    }
    if (operation.command === 'R') {
      state.refresh = {
        start: copyTimecode(operation.start),
        end: copyTimecode(operation.end),
        base: copyDisplayCursor(state.live),
        cursor: copyDisplayCursor(state.live),
      };
      continue;
    }
    if (state.refresh) {
      if (operation.command === 'E') {
        state.refresh = null;
      } else {
        applyCursorOperation(state.refresh.cursor, operation);
      }
      continue;
    }
    applyCursorOperation(state.live, operation);
  }

  if (state.refresh) {
    return {
      cursor: copyDisplayCursor(state.refresh.cursor),
      inRefresh: true,
      refreshStart: copyTimecode(state.refresh.start),
      refreshEnd: copyTimecode(state.refresh.end),
      refreshBase: copyDisplayCursor(state.refresh.base),
    };
  }
  return { cursor: copyDisplayCursor(state.live), inRefresh: false };
}

function resetDisplayProtocolStates() {
  displayProtocolStates.clear();
}

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    port: 8090,
    tcpPort: null, // null = TCP capture off; 0 = ephemeral
    out: path.join(__dirname, 'captures'),
    cert: '',
    key: '',
    ping: 30, // seconds; 0 disables keepalive pings
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') args.port = parseInt(argv[++i], 10);
    else if (a === '--tcp-port') args.tcpPort = parseInt(argv[++i], 10);
    else if (a === '--out') args.out = path.resolve(argv[++i]);
    else if (a === '--cert') args.cert = argv[++i];
    else if (a === '--key') args.key = argv[++i];
    else if (a === '--ping') args.ping = parseInt(argv[++i], 10);
    else if (a === '--help' || a === '-h') {
      console.log('usage: node server.js [--port 8090] [--tcp-port 2500] [--out dir] [--cert pem --key pem] [--ping 30]');
      process.exit(0);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// capture writer — one instance per connection
// ---------------------------------------------------------------------------
let connSeq = 0;
const liveCaptures = new Set();

class Capture {
  constructor(outRoot, mode) {
    connSeq += 1;
    this.seq = connSeq;
    this.mode = mode;
    this.t0 = Date.now();
    this.corrupt = null;
    this.closed = false;
    this.suppressViewer = false;
    const stamp = new Date(this.t0).toISOString().replace(/[:.]/g, '-');
    this.dir = path.join(outRoot, `${mode}_${String(this.seq).padStart(3, '0')}_${stamp}`);
    fs.mkdirSync(this.dir, { recursive: true });
    this.framesPath = path.join(this.dir, 'frames.ndjson');
    this.payloadPath = path.join(this.dir, 'payload.bin');
    this.frames = fs.createWriteStream(this.framesPath, { flags: 'a' });
    this.payload = fs.createWriteStream(this.payloadPath, { flags: 'a' });
    this.previewDecoder = mode === 'ws' || mode === 'tcp' ? new BridgePreviewDecoder() : null;
    // fs stream 'error' with no listener = process crash. Degrade to a
    // marked-corrupt capture instead — the rig must never die mid-hearing.
    const onErr = (which) => (err) => {
      this.corrupt = `${which}: ${err.code || err.message}`;
      console.error(`[capture#${this.seq}] STREAM ERROR (${this.corrupt}) — capture marked corrupt, rig continues`);
    };
    this.frames.on('error', onErr('frames.ndjson'));
    this.payload.on('error', onErr('payload.bin'));
    this.frameCount = 0;
    this.byteCount = 0;
    liveCaptures.add(this);
  }

  meta(name, obj) {
    try {
      fs.writeFileSync(path.join(this.dir, name), JSON.stringify(obj, null, 2));
    } catch (err) {
      this.corrupt = this.corrupt || `${name}: ${err.code || err.message}`;
    }
  }

  frame(kind, buf, extra) {
    if (this.closed || this.corrupt) return null;
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf == null ? [] : buf);
    this.frameCount += 1;
    const rec = {
      i: this.frameCount,
      ts: new Date().toISOString(),
      dtMs: Date.now() - this.t0,
      kind,
      bytes: b.length,
      hex: b.toString('hex'),
      // lossy preview only — the hex field is the ground truth
      utf8: b.toString('utf8').replace(/[^\x20-\x7e]/g, '.'),
      ...(extra || {}),
    };
    this.frames.write(JSON.stringify(rec) + '\n');
    // payload.bin = data frames only (text + binary), in arrival order.
    const isData = kind === 'text' || kind === 'binary' || kind === 'tcp-data';
    const displayOps = isData && this.previewDecoder ? this.previewDecoder.push(b) : [];
    const displayContext = isData && this.previewDecoder
      ? contextualizeDisplayOperations(this.mode, displayOps)
      : null;
    if (isData) {
      this.payload.write(b);
      this.byteCount += b.length;
    }
    if (!this.suppressViewer) {
      pushEvent({
        type: isData ? 'data' : 'meta',
        mode: this.mode,
        seq: this.seq,
        kind,
        bytes: b.length,
        utf8: rec.utf8,
        displayOps,
        displayContext,
        note: isData ? undefined : kind,
      });
    }
    return rec;
  }

  /** Flushes both streams; resolves when bytes are on disk. Safe to call twice. */
  close(summary) {
    if (this.closed) return this.donePromise || Promise.resolve();
    this.closed = true;
    liveCaptures.delete(this);
    this.meta('summary.json', {
      frames: this.frameCount,
      payloadBytes: this.byteCount,
      durationMs: Date.now() - this.t0,
      ...(this.corrupt ? { corrupt: this.corrupt } : {}),
      ...(summary || {}),
    });
    const finish = (stream) =>
      new Promise((resolve) => {
        if (stream.destroyed || stream.closed) return resolve();
        stream.on('close', resolve);
        stream.on('error', resolve);
        stream.end();
      });
    this.donePromise = Promise.all([finish(this.frames), finish(this.payload)]);
    return this.donePromise;
  }
}

// ---------------------------------------------------------------------------
// WebSocket capture server
// ---------------------------------------------------------------------------
function startCapture(opts) {
  const outRoot = opts.out;
  fs.mkdirSync(outRoot, { recursive: true });
  let httpCaptureCount = 0;
  const activeViewerConnections = new Map();
  const viewerHtml = fs.readFileSync(path.join(__dirname, 'viewer.html'));

  const tls = !!(opts.cert && opts.key);
  const httpServer = tls
    ? https.createServer({ cert: fs.readFileSync(opts.cert), key: fs.readFileSync(opts.key) })
    : http.createServer();

  httpServer.on('error', (err) => {
    console.error(`FATAL: http server error on port ${opts.port}: ${err.code || err.message}`);
    if (err.code === 'EADDRINUSE') console.error('Port already in use — is another rig instance running?');
    process.exit(1);
  });

  httpServer.on('request', (req, res) => {
    try {
      // Live viewer routes — never recorded as probe captures.
      let reqPath = req.url;
      try {
        reqPath = new URL(req.url, 'http://placeholder').pathname;
      } catch (_) { /* keep raw url */ }
      if (req.method === 'GET' && reqPath === '/') {
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(viewerHtml);
        return;
      }
      if (req.method === 'GET' && reqPath === '/api/feed') {
        let after = 0;
        let mode = '';
        try {
          const params = new URL(req.url, 'http://placeholder').searchParams;
          after = parseInt(params.get('after') || '0', 10) || 0;
          const requestedMode = params.get('mode') || '';
          mode = requestedMode === 'ws' || requestedMode === 'tcp' ? requestedMode : '';
        } catch (_) { /* default 0 */ }
        const events = feedEvents.filter((e) => e.id > after && (!mode || e.mode === mode));
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(JSON.stringify({
          events,
          next: eventSeq,
          activeConnections: [...activeViewerConnections.values()].filter((connection) => !mode || connection.mode === mode),
          mode: mode || 'all',
        }));
        return;
      }
      if (req.method === 'GET' && reqPath === '/health') {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
        res.end('eclipse-capture rig up\n');
        return;
      }
      // Plain HTTP request (no upgrade) — Eclipse probing? Record it (capped:
      // internet scanners must not fill the disk with capture dirs).
      if (httpCaptureCount < MAX_HTTP_CAPTURES) {
        httpCaptureCount += 1;
        const cap = new Capture(outRoot, 'http');
        cap.meta('request.json', describeRequest(req));
        cap.close({ note: 'plain HTTP request, no websocket upgrade' });
        console.log(`[http] ${req.method} ${req.url} — recorded to ${path.basename(cap.dir)}`);
      } else {
        console.log(`[http] ${req.method} ${req.url} — NOT recorded (cap of ${MAX_HTTP_CAPTURES} reached)`);
      }
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('eclipse-capture rig up\n');
    } catch (err) {
      console.error(`[http] handler error (ignored): ${err.message}`);
      try { res.destroy(); } catch (_) { /* already gone */ }
    }
  });

  const wss = new WebSocket.Server({
    noServer: true,
    maxPayload: MAX_WS_PAYLOAD,
    // Accept whatever subprotocol Eclipse offers (some clients drop the
    // connection if their offered subprotocol is not selected). Log it.
    handleProtocols: (protocols) => {
      const first = protocols.values().next().value;
      return first === undefined ? false : first;
    },
  });

  httpServer.on('upgrade', (req, socket, head) => {
    try {
      const info = describeRequest(req);
      console.log(`[ws] UPGRADE ${req.url}`);
      console.log(`[ws]   auth header : ${describeCredentialHeader(req.headers['authorization'])}`);
      console.log(`[ws]   subprotocol : ${req.headers['sec-websocket-protocol'] || '(none)'}`);

      wss.handleUpgrade(req, socket, head, (ws) => {
        const cap = new Capture(outRoot, 'ws');
        const viewerConnectionKey = `ws:${cap.seq}`;
        const viewerConnection = {
          mode: 'ws',
          connection: cap.seq,
          remoteAddress: req.socket.remoteAddress,
          remotePort: req.socket.remotePort,
        };
        activeViewerConnections.set(viewerConnectionKey, viewerConnection);
        cap.meta('upgrade.json', info);
        console.log(`[ws] connection #${cap.seq} -> ${path.basename(cap.dir)}`);

        let pinger = null;
        if (opts.ping > 0) {
          pinger = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.ping();
          }, opts.ping * 1000);
        }

        ws.on('message', (data, isBinary) => {
          const rec = cap.frame(isBinary ? 'binary' : 'text', data);
          if (rec && (cap.frameCount <= 5 || cap.frameCount % 100 === 0)) {
            console.log(`[ws#${cap.seq}] frame ${rec.i} ${rec.kind} ${rec.bytes}B  ${rec.utf8.slice(0, 60)}`);
          }
        });
        ws.on('ping', (data) => cap.frame('ping', data));
        ws.on('pong', (data) => cap.frame('pong', data));
        ws.on('error', (err) => cap.frame('error', Buffer.from(String(err.message || err))));
        ws.on('close', (code, reason) => {
          if (pinger) clearInterval(pinger);
          activeViewerConnections.delete(viewerConnectionKey);
          cap.frame('close', reason, { code });
          cap.close({ closeCode: code, closeReason: reason ? reason.toString('utf8') : '' });
          console.log(`[ws#${cap.seq}] CLOSED code=${code} frames=${cap.frameCount} payload=${cap.byteCount}B`);
        });
      });
    } catch (err) {
      // A malformed upgrade must never kill the rig (and every other capture).
      console.error(`[ws] upgrade handler error (socket dropped): ${err.message}`);
      try { socket.destroy(); } catch (_) { /* already gone */ }
    }
  });

  httpServer.listen(opts.port, () => {
    const scheme = tls ? 'wss' : 'ws';
    console.log(`eclipse-capture listening: ${scheme}://0.0.0.0:${httpServer.address().port}/  (any path accepted)`);
    console.log(`captures -> ${outRoot}`);
  });

  // Optional plain-TCP capture (Eclipse "Socket Connection" output) for
  // byte-diffing the WS payload against the classic TCP stream.
  let tcpServer = null;
  const tcpSockets = new Set();
  if (opts.tcpPort !== null && opts.tcpPort !== undefined && opts.tcpPort >= 0) {
    tcpServer = net.createServer((socket) => {
      tcpSockets.add(socket);
      socket.on('close', () => tcpSockets.delete(socket));
      const cap = new Capture(outRoot, 'tcp');
      const viewerConnectionKey = `tcp:${cap.seq}`;
      const viewerConnection = {
        mode: 'tcp',
        connection: cap.seq,
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
      };
      cap.meta('socket.json', {
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
        localPort: socket.localPort,
      });
      console.log(`[tcp] connection #${cap.seq} from ${socket.remoteAddress} -> ${path.basename(cap.dir)}`);
      socket.on('data', (chunk) => {
        if (cap.frameCount === 0) {
          cap.suppressViewer = /^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/i.test(chunk.toString('ascii', 0, 16));
          if (!cap.suppressViewer) {
            activeViewerConnections.set(viewerConnectionKey, viewerConnection);
          }
        }
        const rec = cap.frame('tcp-data', chunk);
        if (rec && (cap.frameCount <= 5 || cap.frameCount % 100 === 0)) {
          console.log(`[tcp#${cap.seq}] chunk ${rec.i} ${rec.bytes}B  ${rec.utf8.slice(0, 60)}`);
        }
      });
      socket.on('error', (err) => cap.frame('error', Buffer.from(String(err.message || err))));
      socket.on('close', (hadError) => {
        activeViewerConnections.delete(viewerConnectionKey);
        cap.close({ hadError });
        console.log(`[tcp#${cap.seq}] CLOSED chunks=${cap.frameCount} payload=${cap.byteCount}B`);
      });
    });
    tcpServer.on('error', (err) => {
      console.error(`FATAL: tcp capture listener error on port ${opts.tcpPort}: ${err.code || err.message}`);
      if (err.code === 'EADDRINUSE') console.error('TCP port already in use — pick another with --tcp-port.');
      process.exit(1);
    });
    tcpServer.listen(opts.tcpPort, () => {
      console.log(`tcp-capture listening: 0.0.0.0:${tcpServer.address().port} (Eclipse "Socket Connection" target)`);
    });
  }

  return {
    httpServer,
    tcpServer,
    /** Stops listeners AND flushes every still-open capture to disk. */
    async close() {
      // Flush captures FIRST (snapshot), then drop client sockets — otherwise
      // httpServer.close()/tcpServer.close() wait forever on open connections.
      const flushes = [...liveCaptures].map((cap) => cap.close({ note: 'terminated by rig shutdown' }));
      for (const client of wss.clients) {
        try { client.terminate(); } catch (_) { /* already gone */ }
      }
      for (const socket of tcpSockets) {
        try { socket.destroy(); } catch (_) { /* already gone */ }
      }
      wss.close();
      await Promise.all(flushes);
      await Promise.all(
        [
          new Promise((r) => httpServer.close(r)),
          tcpServer ? new Promise((r) => tcpServer.close(r)) : Promise.resolve(),
        ],
      );
    },
  };
}

function describeRequest(req) {
  const sock = req.socket;
  // llhttp lets structurally-invalid request targets through (e.g. "GET http://").
  // new URL() throwing here must not kill the rig — raw url/rawHeaders are the
  // ground truth anyway.
  let pathName = req.url;
  const query = {};
  try {
    const u = new URL(req.url, 'http://placeholder');
    pathName = u.pathname;
    for (const [k, v] of u.searchParams) query[k] = v;
  } catch (_) {
    // keep raw url as pathName, empty query
  }
  const out = {
    ts: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: pathName,
    query,
    httpVersion: req.httpVersion,
    // rawHeaders preserves order AND casing — critical for the protocol memo.
    rawHeaders: req.rawHeaders,
    headers: req.headers,
    remoteAddress: sock.remoteAddress,
    remotePort: sock.remotePort,
  };
  if (sock.encrypted) {
    out.tls = {
      protocol: sock.getProtocol && sock.getProtocol(),
      cipher: sock.getCipher && sock.getCipher(),
      servername: sock.servername,
    };
  }
  return out;
}

/**
 * The raw Authorization value remains in the local upgrade.json evidence because
 * Phase 1 must determine Eclipse's exact credential transport. Never mirror the
 * secret into terminal logs, CI output, or screen recordings.
 */
function describeCredentialHeader(value) {
  if (!value) return '(none)';
  const text = String(value);
  const scheme = text.split(/\s+/, 1)[0] || 'present';
  return `(present: ${scheme}, ${Buffer.byteLength(text, 'utf8')} bytes; value captured locally)`;
}

module.exports = {
  startCapture,
  parseArgs,
  contextualizeDisplayOperations,
  resetDisplayProtocolStates,
};

if (require.main === module) {
  const opts = parseArgs(process.argv);
  const rig = startCapture(opts);
  // Last-resort: never die silently — log the stack, flush captures, keep running
  // where safe (an isolated handler error must not end a live courtroom capture).
  process.on('uncaughtException', (err) => {
    console.error(`UNCAUGHT EXCEPTION (rig continues): ${err.stack || err}`);
  });
  process.on('unhandledRejection', (reason) => {
    console.error(`UNHANDLED REJECTION (rig continues): ${(reason && reason.stack) || reason}`);
  });
  process.on('exit', (code) => {
    console.error(`rig exiting with code ${code}`);
  });
  // Ctrl+C is the operator's normal shutdown, usually right after the hearing
  // ends — exactly when the capture tail is still in stream buffers. Flush
  // everything before exiting; process.exit() alone DISCARDS buffered writes.
  let shuttingDown = false;
  const shutdown = (sig) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${sig} — flushing ${liveCaptures.size} open capture(s) to disk...`);
    const timeout = new Promise((r) => setTimeout(r, 5000));
    Promise.race([rig.close(), timeout]).then(() => {
      console.log('shutdown complete');
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
