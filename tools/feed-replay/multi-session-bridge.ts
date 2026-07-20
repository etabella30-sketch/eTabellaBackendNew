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
import { scryptSync, timingSafeEqual } from 'crypto';
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
const runtimeConfigPath = argOf('--runtime-config') || path.join(__dirname, 'sessions.runtime.json');
// Single-port auth-routing: one TCP port, route by the Eclipse handshake
// (username\r\npassword\r\n preamble). The credential pair identifies a session.
const authPort = argOf('--auth-port') ? Number(argOf('--auth-port')) : null;

interface SessionCfg {
  port?: number;
  nSesid: string;
  label?: string;
  nLines?: number;
  user?: string;
  /** Plaintext is retained only for backwards compatibility with sessions.json. */
  pass?: string;
  passwordSalt?: string;
  passwordHash?: string;
}

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
  get user() { return this.cfg.user; }
  get pass() { return this.cfg.pass; }
  get nSesid() { return this.cfg.nSesid; }
  get label() { return this.cfg.label || this.cfg.user || String(this.cfg.port || ''); }

  private cap?: fs.WriteStream;
  private rehydrated = false;
  private bytesFed = 0;
  private readonly onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => this.parser.sendToParseData(cx, hex, cmd);

  ensureRehydrated() {
    if (this.rehydrated) return;
    this.rehydrated = true;
    const r = this.rehydrate();
    console.log(`[${this.label}] active -> S${this.cfg.nSesid}` + (r ? ` (rehydrated ${r})` : ''));
  }

  /** Feed raw Bridge bytes into this session's isolated parser context. */
  feed(chunk: Buffer) {
    this.ensureRehydrated();
    if (!this.cap) {
      fs.mkdirSync(PAGES_ROOT, { recursive: true });
      this.cap = fs.createWriteStream(path.join(PAGES_ROOT, '..', `eclipse_live_${this.cfg.nSesid}.bin`), { flags: 'a' });
    }
    this.bytesFed += chunk.length;
    this.cap.write(chunk);
    this.framing.splitCommands(this.ctx, chunk, this.onCommand);
  }

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

  /** Port-per-session mode: dedicated TCP port, raw stream (no handshake). */
  listen() {
    const server = net.createServer((sock) => {
      console.log(`[${this.label}] Eclipse connected from ${sock.remoteAddress}`);
      sock.on('data', (chunk: Buffer) => this.feed(chunk));
      sock.on('close', () => console.log(`[${this.label}] Eclipse disconnected (${this.bytesFed} bytes)`));
      sock.on('error', (e) => console.error(`[${this.label}] sock err: ${e.message}`));
    });
    server.on('error', (e: any) => console.error(`[${this.label}] listen ${this.cfg.port} FAILED: ${e.code || e.message}`));
    server.listen(this.cfg.port, () => this.ensureRehydrated());
    return server;
  }
}

/**
 * Single-port auth-router. Eclipse's TCP "Socket Connection" prepends
 * `username\r\npassword\r\n` before the Bridge stream (confirmed by wire
 * capture). Read that handshake, map credentials -> session worker, feed the rest.
 * One port for all cases + all sessions.
 */
function startAuthRouter(
  baseCfgs: SessionCfg[],
  workers: Map<string, SessionWorker>,
  socket: Socket,
  port: number,
): net.Server {
  const currentRoutes = (): SessionCfg[] => {
    // Once this file exists it is authoritative, including an empty array
    // after a live session ends. Before then, preserve manual sessions.json.
    return fs.existsSync(runtimeConfigPath)
      ? readSessionConfig(runtimeConfigPath, false)
      : baseCfgs;
  };

  const resolveRoute = (user: string, pass: string): { cfg: SessionCfg; worker: SessionWorker } | null => {
    const cfg = currentRoutes().find(candidate =>
      candidate.user === user && passwordMatches(candidate, pass));
    if (!cfg) return null;
    let worker = workers.get(cfg.nSesid);
    if (!worker) {
      worker = new SessionWorker(cfg, socket);
      workers.set(cfg.nSesid, worker);
    }
    return { cfg, worker };
  };

  const server = net.createServer((sock) => {
    let buf = Buffer.alloc(0);
    let worker: SessionWorker | null = null;
    let handshakeDone = false;
    sock.on('data', (chunk: Buffer) => {
      if (handshakeDone) {
        const routeStillActive = worker
          && currentRoutes().some(candidate => candidate.nSesid === worker!.nSesid);
        if (!worker || !routeStillActive) {
          sock.destroy();
          return;
        }
        worker.feed(chunk);
        return;
      }
      buf = Buffer.concat([buf, chunk]);
      // need two CRLF-terminated lines: username, password
      const first = buf.indexOf('\r\n');
      if (first < 0) { if (buf.length > 512) sock.destroy(); return; }
      const second = buf.indexOf('\r\n', first + 2);
      if (second < 0) { if (buf.length > 512) sock.destroy(); return; }
      const user = buf.slice(0, first).toString('latin1');
      const pass = buf.slice(first + 2, second).toString('latin1');
      const route = resolveRoute(user, pass);
      worker = route?.worker ?? null;
      if (!route || !worker) { console.error(`[auth] invalid credentials for '${user}' from ${sock.remoteAddress} — dropping`); sock.destroy(); return; }
      console.log(`[auth] '${user}' -> S${worker.nSesid} (${worker.label})`);
      handshakeDone = true;
      const rest = buf.slice(second + 2);
      if (rest.length) worker.feed(rest);
    });
    sock.on('error', () => {});
  });
  server.on('error', (e: any) => { console.error(`auth-router listen ${port} FAILED: ${e.code || e.message}`); process.exit(1); });
  server.listen(port, () => {
    console.log(`[auth-router] ONE port :${port} — route by Eclipse credentials`);
    console.log(`  runtime routes: ${runtimeConfigPath}`);
  });
  return server;
}

function readSessionConfig(filePath: string, required: boolean): SessionCfg[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('expected a JSON array');
    return parsed;
  } catch (error: any) {
    if (required || error?.code !== 'ENOENT') {
      console.error(`could not read session config ${filePath}: ${error?.message ?? error}`);
    }
    return [];
  }
}

function passwordMatches(cfg: SessionCfg, supplied: string): boolean {
  if (cfg.passwordSalt && cfg.passwordHash) {
    try {
      const expected = Buffer.from(cfg.passwordHash, 'base64');
      const actual = scryptSync(supplied, Buffer.from(cfg.passwordSalt, 'base64'), expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }
  return cfg.pass === undefined || cfg.pass === supplied;
}

async function main() {
  if (!fs.existsSync(configPath)) {
    console.error(`config not found: ${configPath}\nExpected JSON: [{ "port":5555, "nSesid":"...", "label":"C1/S1" }, ...]`);
    process.exit(1);
  }
  const cfgs = readSessionConfig(configPath, true);
  const ports = new Set(cfgs.map((c) => c.port));
  if (ports.size !== cfgs.length) { console.error('duplicate ports in config'); process.exit(1); }

  const socket: Socket = io(url, { transports: ['websocket'], reconnection: true });
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', (e) => reject(e));
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });
  console.log(`connected to ${url} — ${cfgs.length} session(s)`);

  const workers = new Map(cfgs.map((c) => [c.nSesid, new SessionWorker(c, socket)] as const));
  const flushTimer = setInterval(() => workers.forEach((w) => w.flush()), 400);

  let servers: net.Server[];
  if (authPort) {
    // Single-port: every Eclipse points at this one port; the username in its
    // handshake selects the session. No per-session ports.
    const missing = cfgs.filter((cfg) => !cfg.user);
    if (missing.length) { console.error(`--auth-port needs a "user" on every session; missing: ${missing.map((cfg) => cfg.nSesid).join(', ')}`); process.exit(1); }
    servers = [startAuthRouter(cfgs, workers, socket, authPort)];
  } else {
    // Port-per-session: each session on its own dedicated port.
    servers = Array.from(workers.values(), (w) => w.listen());
    console.log('\nPort map (point each Eclipse "Socket Connection", format Bridge, at its port):');
    for (const c of cfgs) console.log(`  ${c.label || ''}  :${c.port}  ->  /rt/session/${c.nSesid}`);
  }
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
