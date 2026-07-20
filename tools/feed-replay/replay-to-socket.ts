/**
 * replay-to-socket — drive the NEW libs/feed-parse parser and stream its output
 * to the Angular frontend, so the vendor-parity fixes can be seen in a real
 * browser without building the full Phase-3 ingest app.
 *
 * How it fits: realtime-server receives 'TCP-DATA' from an upstream socket.io
 * client and fans out 'message' to browser room S<nSesid>
 * (apps/realtime-server/src/events/events.gateway.ts:129-144). This harness IS
 * that upstream client: it runs a scripted Bridge feed through
 * BridgeFramingService -> BridgeParserService and its FeedSink forwards the
 * parser's 'TCP-DATA' / 'feed-refresh-data' emits straight onto the socket.
 *
 * The scripted feed deliberately exercises the fixes:
 *   - a CP1252 smart-quote (byte 0x92) -> renders as U+2019 (’), not a control
 *     char, proving D2 end-to-end (the FE decodes with plain String.fromCharCode
 *     and NO charmap, so the correct glyph only appears because the parser mapped
 *     the byte);
 *   - a R..E refresh that corrects earlier lines -> proves the half-open range
 *     (D5) + refresh splice land in the browser.
 *
 * Run (dry-run, no server needed — prints the payloads it WOULD emit):
 *   npx ts-node tools/feed-replay/replay-to-socket.ts --dry-run
 *
 * Run (live, against a running realtime-server, FE watching the session):
 *   npx ts-node tools/feed-replay/replay-to-socket.ts --nSesid <sessionId> [--url http://localhost:5005] [--delay 500]
 *
 * See tools/feed-replay/README.md for the full FE runbook.
 */
import 'reflect-metadata';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { io, Socket } from 'socket.io-client';
import {
  BridgeFramingService,
  BridgeParserService,
  createSessionContext,
  FeedSink,
  SessionContext,
} from '../../libs/feed-parse/src';

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
function argOf(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const hasArg = (flag: string) => process.argv.includes(flag);

const nSesid = argOf('--nSesid') || 'demo-replay';
const url = argOf('--url') || 'http://localhost:5005';
const delayMs = Number(argOf('--delay') || 500);
const dryRun = hasArg('--dry-run');
const listenPort = argOf('--listen') ? Number(argOf('--listen')) : null; // live: Eclipse TCP -> parser -> FE

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Bridge byte builders (0x02 <cmd> <data...> 0x03; text is raw bytes)
// ---------------------------------------------------------------------------
const c = (ch: string) => ch.charCodeAt(0);
const STX = (letter: string, data: number[] = []) => [0x02, c(letter), ...data, 0x03];
const P = (page: number) => STX('P', [page & 0xff, (page >> 8) & 0xff]); // little-endian
const N = (line: number) => STX('N', [line & 0xff]);
const T = (h: number, m: number, s: number, f: number) => STX('T', [h, m, s, f]);
const R = (a: number[], b: number[]) => STX('R', [...a, ...b]); // start TC + end TC (4 bytes each)
const E = () => STX('E');
const TXT = (str: string) => [...Buffer.from(str, 'latin1')]; // ASCII text bytes

// A scripted courtroom feed. 0x92 = CP1252 right single quote (’).
const SCRIPT: Array<{ label: string; bytes: number[] }> = [
  { label: 'page 1', bytes: [...P(1)] },
  { label: 'L1', bytes: [...T(10, 31, 0, 0), ...N(1), ...TXT('PRESIDENT:  Good morning, everybody.')] },
  { label: 'L2', bytes: [...T(10, 31, 5, 0), ...N(2), ...TXT('MR STEPHEN:  Thank you, sir.')] },
  {
    label: 'L3 (CP1252 smart quotes)',
    bytes: [...T(10, 31, 10, 0), ...N(3), ...TXT('THE COURT:  It'), 0x92, ...TXT('s a fine day'), 0x92, ...TXT('s work.')],
  },
  { label: 'L4', bytes: [...T(10, 31, 15, 0), ...N(4), ...TXT('MR LUKE:  Agreed, sir.')] },
  { label: 'L5', bytes: [...T(10, 31, 20, 0), ...N(5), ...TXT('(short pause)')] },
  // Refresh: correct lines whose timecodes fall in [10:31:05, 10:31:15).
  { label: 'REFRESH begin', bytes: [...R([10, 31, 5, 0], [10, 31, 15, 0])] },
  { label: 'refresh L2', bytes: [...T(10, 31, 5, 0), ...N(2), ...TXT('MR STEPHEN:  Thank you very much, sir.')] },
  { label: 'refresh L3', bytes: [...T(10, 31, 10, 0), ...N(3), ...TXT('THE COURT:  Indeed it is.')] },
  { label: 'REFRESH end', bytes: [...E()] },
];

// ---------------------------------------------------------------------------
// sink — forwards the parser's delivery emits to realtime-server (or logs)
// ---------------------------------------------------------------------------
function decodeRow(row: any): string {
  const codes = Array.isArray(row?.[1]) ? row[1] : [];
  return String.fromCharCode(...codes);
}
function summarize(event: string, payload: any): string {
  if (event === 'TCP-DATA') {
    const rows = (payload.d || []).map((r: any) => `  [idx ${r[2]} ${r[0]}] ${JSON.stringify(decodeRow(r))}`);
    return `TCP-DATA date=${payload.date} p=${payload.p} l=${payload.l}\n${rows.join('\n')}`;
  }
  if (event === 'feed-refresh-data') {
    const rows = (payload.newLines || []).map((r: any) => `  [line ${r[5]} ${r[0]}] ${JSON.stringify(decodeRow(r))}`);
    return `feed-refresh-data nSesid=${payload.nSesid} range=${payload.start}..${payload.end} startPage=${payload.startPage}\n${rows.join('\n')}`;
  }
  return `${event} ${JSON.stringify(payload).slice(0, 120)}`;
}

let socket: Socket | null = null;
let nextId = 1;

// ---------------------------------------------------------------------------
// Per-page persistence + rehydration — the legacy Bridge durability model.
// The FULL line buffer is the source of truth; each page is written as a
// complete JSON array (mirrors session-store.saveSession: page_i = buffer
// slice). On (re)start we rehydrate the buffer from those files so the global
// line index CONTINUES instead of resetting to 0 — which is what caused new
// lines to overwrite earlier ones (backward timecodes) after a restart/refresh.
// ---------------------------------------------------------------------------
const PAGES_ROOT = path.join(__dirname, 'captures', 'pages');
const pagesDir = (sesid: string) => path.join(PAGES_ROOT, `dt_${sesid}`);
let activeJob: any = null; // ctx.job — set after ctx creation
let pagesDirty = false;

function persistPages(sesid: string, nLines: number) {
  if (!activeJob) return;
  const buf: any[] = activeJob.lineBuffer || [];
  const dir = pagesDir(sesid);
  fs.mkdirSync(dir, { recursive: true });
  const totalPages = Math.max(1, Math.ceil(buf.length / nLines));
  for (let p = 1; p <= totalPages; p++) {
    const page = buf.slice((p - 1) * nLines, p * nLines);
    try { fs.writeFileSync(path.join(dir, `page_${p}.json`), JSON.stringify(page)); } catch (e) {}
  }
}

/** Seed ctx.job.lineBuffer + counters from persisted pages so a[2] continues. */
function rehydrate(ctx: SessionContext, nLines: number): number {
  const dir = pagesDir(ctx.nSesid);
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir)
    .filter((f) => /^page_\d+\.json$/.test(f))
    .sort((a, b) => (+a.match(/\d+/)![0]) - (+b.match(/\d+/)![0]));
  const buf: any[] = [];
  for (const f of files) {
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (Array.isArray(arr)) buf.push(...arr);
    } catch (e) { /* skip torn page */ }
  }
  if (!buf.length) return 0;
  ctx.job.lineBuffer = buf;
  ctx.job.lineCount = buf.length - 1;
  const last = buf[buf.length - 1] || [];
  ctx.job.currentTimestamp = last[0] || null;
  ctx.job.currentFormat = last[3] || null;
  ctx.job.currentPage = last[4] || 1;
  ctx.job.currentLineNumber = last[5] || 1;
  return buf.length;
}

const sink: FeedSink = {
  emitLocal() { /* realtime-server does the 'message' fan-out; nothing to do here */ },
  emitDelivery(event: string, payload: any) {
    if (dryRun) {
      console.log(summarize(event, payload));
      return;
    }
    socket?.emit(event, payload);
  },
  async saveLine(_nSesid: string, id: number) { pagesDirty = true; return id || nextId++; },
  async saveMetaData() { pagesDirty = true; return 1; },
  async removeLines() { pagesDirty = true; return 1; },
  async savePageData() { pagesDirty = true; return 1; },
  async runAnnotTransfer() { return 1; },
  log() { /* silence per-session file logs */ },
};

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
async function connectSocket() {
  socket = io(url, { transports: ['websocket'], reconnection: false });
  await new Promise<void>((resolve, reject) => {
    socket!.on('connect', () => { console.log(`connected to ${url} (socket ${socket!.id})`); resolve(); });
    socket!.on('connect_error', (e) => reject(e));
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });
}

/**
 * LIVE mode: a TCP server on --listen <port>. Eclipse's classic "Socket
 * Connection" (Bridge format) output points here; raw bytes flow through the
 * NEW parser and its FeedSink emits to realtime-server room S<nSesid>, which
 * fans out 'message' to the FE. Partial commands split across TCP chunks
 * reassemble via ctx.framing — exactly the per-session carry-over the port
 * was built for. Raw bytes are also mirrored to a capture file for fixtures.
 */
async function runListen() {
  const framing = new BridgeFramingService();
  const parser = new BridgeParserService();
  const ctx: SessionContext = createSessionContext({ nSesid, protocol: 'B', sink, nLines: 25 });
  const onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => parser.sendToParseData(cx, hex, cmd);

  // Rehydrate from persisted pages BEFORE feeding new bytes, so the global line
  // index continues (no reset -> no overwrite). Then throttle-flush pages.
  const restored = rehydrate(ctx, 25);
  activeJob = ctx.job;
  if (restored) console.log(`[persist] rehydrated ${restored} line(s) from ${pagesDir(nSesid)} — index resumes at ${restored}`);
  const flushTimer = setInterval(() => {
    if (pagesDirty) { pagesDirty = false; persistPages(nSesid, 25); }
  }, 400);

  await connectSocket();

  const capDir = path.join(__dirname, 'captures');
  fs.mkdirSync(capDir, { recursive: true });
  const capFile = path.join(capDir, `eclipse_live_${nSesid}.bin`);
  const capStream = fs.createWriteStream(capFile, { flags: 'a' });
  let totalBytes = 0;

  const server = net.createServer((sock) => {
    console.log(`[listen] Eclipse connected from ${sock.remoteAddress}:${sock.remotePort}`);
    sock.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      capStream.write(chunk);
      framing.splitCommands(ctx, chunk, onCommand); // real-time; framing carries partial cmds across chunks
      process.stdout.write(`\r[listen] bytes in: ${totalBytes}   `);
    });
    sock.on('close', () => console.log(`\n[listen] Eclipse disconnected (total ${totalBytes} bytes)`));
    sock.on('error', (e) => console.error(`\n[listen] socket error: ${e.message}`));
  });
  server.on('error', (e: any) => {
    console.error(`FATAL: TCP listen on ${listenPort} failed: ${e.code || e.message}`);
    process.exit(1);
  });
  server.listen(listenPort, () => {
    console.log(`[listen] Bridge TCP server on 0.0.0.0:${listenPort} -> parser -> S${nSesid} -> FE`);
    console.log(`         point Eclipse "Socket Connection" (format Bridge) at <this-ip>:${listenPort}`);
    console.log(`         raw capture -> ${capFile}`);
    console.log(`         open /rt/session/${nSesid} in the FE, then type in Eclipse. Ctrl+C to stop.`);
  });

  process.on('SIGINT', () => {
    clearInterval(flushTimer);
    persistPages(nSesid, 25); // final flush so no tail is lost on shutdown
    capStream.end();
    server.close();
    socket?.disconnect();
    process.exit(0);
  });
}

async function runScripted() {
  const framing = new BridgeFramingService();
  const parser = new BridgeParserService();
  const ctx: SessionContext = createSessionContext({ nSesid, protocol: 'B', sink, nLines: 25 });
  const onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => parser.sendToParseData(cx, hex, cmd);

  if (!dryRun) {
    await connectSocket();
    console.log(`streaming session S${nSesid} — open /rt/session/${nSesid} in the FE`);
  } else {
    console.log(`DRY RUN — session ${nSesid}, no socket. Payloads that WOULD be emitted:\n`);
  }

  for (const step of SCRIPT) {
    framing.splitCommands(ctx, Buffer.from(step.bytes), onCommand);
    await sleep(delayMs); // let the per-session queues drain + pace like a live feed
    if (!dryRun) console.log(`sent: ${step.label}`);
  }

  console.log('\ndone.');
  if (socket) { await sleep(500); socket.disconnect(); }
}

async function run() {
  if (listenPort) return runListen();
  return runScripted();
}

run().catch((err) => { console.error('replay failed:', err); process.exit(1); });
