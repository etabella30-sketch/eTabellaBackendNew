/**
 * multi-session-bridge — run N concurrent Bridge sessions through the NEW
 * parser, each on its own TCP port, each fully isolated (own SessionContext,
 * page store, and room S<nSesid>). This is the real exercise of the whole
 * point of libs/feed-parse: many hearings parse at once with zero cross-session
 * contamination.
 *
 * Topology:
 *   Eclipse machine A ── TCP :5555 ─┐
 *   Eclipse machine B ── TCP :5556 ─┤   multi-session-bridge (one process)
 *   (scripted / more)  ── TCP :55.. ─┘     ├─ worker per port: framing+parser+ctx+pages
 *                                          └─ one socket.io client -> realtime-server
 *                                             emits TCP-DATA {date:nSesid} -> room S<nSesid> -> FE
 *
 * Config (JSON file, --config): [{ "port": 5555, "nSesid": "...", "label": "C1/S1" }, ...]
 *
 * Run:
 *   npx ts-node --compiler-options '{"module":"commonjs"}' tools/feed-replay/multi-session-bridge.ts --config tools/feed-replay/sessions.json
 *
 * Each worker persists per-page JSON (captures/pages/dt_<nSesid>/page_N.json) and
 * rehydrates on start, so restarts continue the line index (no overwrite) —
 * same durability model as replay-to-socket.ts --listen.
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

function argOf(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const url = argOf('--url') || 'http://localhost:5005';
const configPath = argOf('--config') || path.join(__dirname, 'sessions.json');

interface SessionCfg { port: number; nSesid: string; label?: string; nLines?: number; }

const PAGES_ROOT = path.join(__dirname, 'captures', 'pages');
const pagesDir = (sesid: string) => path.join(PAGES_ROOT, `dt_${sesid}`);

/** One fully-isolated session: its own parser context, page store and TCP port. */
class SessionWorker {
  readonly framing = new BridgeFramingService();
  readonly parser = new BridgeParserService();
  readonly ctx: SessionContext;
  private dirty = false;
  private nextId = 1;
  private bytes = 0;
  readonly sink: FeedSink;

  constructor(private cfg: SessionCfg, private socket: Socket) {
    this.ctx = createSessionContext({ nSesid: cfg.nSesid, protocol: 'B', sink: undefined as any, nLines: cfg.nLines || 25 });
    this.sink = {
      emitLocal: () => {},
      emitDelivery: (event: string, payload: any) => this.socket.emit(event, payload),
      saveLine: async (_n: string, id: number) => { this.dirty = true; return id || this.nextId++; },
      saveMetaData: async () => { this.dirty = true; return 1; },
      removeLines: async () => { this.dirty = true; return 1; },
      savePageData: async () => { this.dirty = true; return 1; },
      runAnnotTransfer: async () => 1,
      log: () => {},
    };
    (this.ctx as any).sink = this.sink;
  }

  get nLines() { return this.cfg.nLines || 25; }

  rehydrate(): number {
    const dir = pagesDir(this.cfg.nSesid);
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
    this.ctx.job.lineBuffer = buf;
    this.ctx.job.lineCount = buf.length - 1;
    const last = buf[buf.length - 1] || [];
    this.ctx.job.currentTimestamp = last[0] || null;
    this.ctx.job.currentFormat = last[3] || null;
    this.ctx.job.currentPage = last[4] || 1;
    this.ctx.job.currentLineNumber = last[5] || 1;
    return buf.length;
  }

  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    const buf: any[] = this.ctx.job.lineBuffer || [];
    const dir = pagesDir(this.cfg.nSesid);
    fs.mkdirSync(dir, { recursive: true });
    const totalPages = Math.max(1, Math.ceil(buf.length / this.nLines));
    for (let p = 1; p <= totalPages; p++) {
      const page = buf.slice((p - 1) * this.nLines, p * this.nLines);
      try { fs.writeFileSync(path.join(dir, `page_${p}.json`), JSON.stringify(page)); } catch (e) {}
    }
  }

  listen() {
    const onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => this.parser.sendToParseData(cx, hex, cmd);
    const capFile = path.join(PAGES_ROOT, '..', `eclipse_live_${this.cfg.nSesid}.bin`);
    const cap = fs.createWriteStream(capFile, { flags: 'a' });
    const server = net.createServer((sock) => {
      console.log(`[${this.cfg.label || this.cfg.port}] Eclipse connected from ${sock.remoteAddress}`);
      sock.on('data', (chunk: Buffer) => {
        this.bytes += chunk.length;
        cap.write(chunk);
        this.framing.splitCommands(this.ctx, chunk, onCommand);
      });
      sock.on('close', () => console.log(`[${this.cfg.label || this.cfg.port}] Eclipse disconnected (${this.bytes} bytes)`));
      sock.on('error', (e) => console.error(`[${this.cfg.label || this.cfg.port}] sock err: ${e.message}`));
    });
    server.on('error', (e: any) => console.error(`[${this.cfg.label || this.cfg.port}] listen ${this.cfg.port} FAILED: ${e.code || e.message}`));
    server.listen(this.cfg.port, () => {
      const r = this.rehydrate();
      console.log(`[${this.cfg.label || this.cfg.port}] :${this.cfg.port} -> S${this.cfg.nSesid}` + (r ? ` (rehydrated ${r})` : ''));
    });
    return server;
  }
}

async function main() {
  if (!fs.existsSync(configPath)) {
    console.error(`config not found: ${configPath}\nExpected JSON: [{ "port":5555, "nSesid":"...", "label":"C1/S1" }, ...]`);
    process.exit(1);
  }
  const cfgs: SessionCfg[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const ports = new Set(cfgs.map((c) => c.port));
  if (ports.size !== cfgs.length) { console.error('duplicate ports in config'); process.exit(1); }

  const socket: Socket = io(url, { transports: ['websocket'], reconnection: true });
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', (e) => reject(e));
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });
  console.log(`connected to ${url} — ${cfgs.length} session(s)`);

  const workers = cfgs.map((c) => new SessionWorker(c, socket));
  const servers = workers.map((w) => w.listen());
  const flushTimer = setInterval(() => workers.forEach((w) => w.flush()), 400);

  console.log('\nPort map (point each Eclipse "Socket Connection", format Bridge, at its port):');
  for (const c of cfgs) console.log(`  ${c.label || ''}  :${c.port}  ->  /rt/session/${c.nSesid}`);
  console.log('\nCtrl+C to stop.');

  process.on('SIGINT', () => {
    clearInterval(flushTimer);
    workers.forEach((w) => w.flush());
    servers.forEach((s) => s.close());
    socket.disconnect();
    process.exit(0);
  });
}

main().catch((e) => { console.error('multi-session bridge failed:', e); process.exit(1); });
