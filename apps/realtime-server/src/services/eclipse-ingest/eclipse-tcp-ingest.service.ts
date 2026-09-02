import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';

import {
    BridgeFramingService,
    BridgeParserService,
    CaseviewParserService,
    createSessionContext,
    FeedSink,
    SessionContext,
} from '@app/feed-parse';

import { EventsGateway } from '../../events/events.gateway';
import { EclipseSessionService } from '../eclipse-session/eclipse-session.service';

/**
 * Embedded Eclipse 12 TCP ingest — the multi-session-bridge auth-router folded
 * into realtime-server so no separate bridge process is needed.
 *
 * Eclipse's "Socket Connection" prepends `username\r\npassword\r\n` before the
 * Bridge byte stream (confirmed by wire capture). This service listens on
 * ECLIPSE_AUTH_PORT, matches the handshake against the runtime route file that
 * `POST /session/eclipse` writes (re-read on EVERY handshake, so new sessions
 * need no restart), and feeds the remaining stream into a per-session
 * libs/feed-parse context. Parser deliveries dispatch IN-PROCESS to the same
 * gateway handlers the external bridge reached over socket.io.
 *
 * Per-page JSON persistence + rehydration uses the SAME directory layout as
 * tools/feed-replay (captures/pages/dt_<nSesid>/page_N.json relative to the
 * repo root), so switching between embedded and external bridge keeps line
 * continuity across restarts.
 *
 * Enabled only when ECLIPSE_TCP_INGEST=1 — default OFF so an externally-run
 * bridge never fights this service for the port.
 */
@Injectable()
export class EclipseTcpIngestService implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger(EclipseTcpIngestService.name);
    private server: net.Server | null = null;
    private flushTimer: NodeJS.Timeout | null = null;
    private readonly workers = new Map<string, IngestSessionWorker>();

    constructor(
        private readonly config: ConfigService,
        private readonly gateway: EventsGateway,
        private readonly eclipseSession: EclipseSessionService,
    ) { }

    onModuleInit(): void {
        if (String(this.config.get('ECLIPSE_TCP_INGEST') ?? '') !== '1') {
            this.logger.log('Eclipse TCP ingest disabled (set ECLIPSE_TCP_INGEST=1 to enable)');
            return;
        }
        const port = Number(this.config.get('ECLIPSE_AUTH_PORT')) || 2500;
        this.server = net.createServer(sock => this.handleConnection(sock));
        this.server.on('error', (e: any) => {
            this.logger.error(`Eclipse ingest listen :${port} FAILED: ${e?.code || e?.message} — is an external bridge already running?`);
            this.server = null;
        });
        this.server.listen(port, () => {
            this.logger.log(`Eclipse ingest listening on :${port} — routing by Eclipse credentials`);
        });
        this.flushTimer = setInterval(() => this.workers.forEach(w => w.flush()), 400);
    }

    onModuleDestroy(): void {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.workers.forEach(w => w.flush());
        this.server?.close();
    }

    private handleConnection(sock: net.Socket): void {
        let buf = Buffer.alloc(0);
        let worker: IngestSessionWorker | null = null;
        let handshakeDone = false;
        sock.on('data', (chunk: Buffer) => {
            void (async () => {
                if (handshakeDone) {
                    // A session end removes its route; kill the stream with it.
                    const routeStillActive = worker
                        && (await this.safeRoutes()).some(route => String(route?.nSesid ?? '') === worker!.nSesid);
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
                worker = await this.resolveWorker(user, pass);
                if (!worker) {
                    this.logger.warn(`[auth] invalid credentials for '${user}' from ${sock.remoteAddress} — dropping`);
                    sock.destroy();
                    return;
                }
                this.logger.log(`[auth] '${user}' -> S${worker.nSesid} (${worker.label})`);
                handshakeDone = true;
                const rest = buf.slice(second + 2);
                buf = Buffer.alloc(0);
                if (rest.length) worker.feed(rest);
            })().catch(e => {
                this.logger.error(`Eclipse ingest stream error: ${e?.message ?? e}`);
                sock.destroy();
            });
        });
        sock.on('error', () => { });
        sock.on('close', () => {
            if (worker) this.logger.log(`[${worker.label}] Eclipse disconnected`);
        });
    }

    private async safeRoutes(): Promise<Record<string, any>[]> {
        try {
            return await this.eclipseSession.readEclipseRoutes();
        } catch {
            return [];
        }
    }

    private async resolveWorker(user: string, pass: string): Promise<IngestSessionWorker | null> {
        const route = (await this.safeRoutes()).find(candidate =>
            String(candidate?.user ?? '') === user && this.eclipseSession.eclipsePasswordMatches(candidate, pass));
        if (!route) return null;
        const nSesid = String(route.nSesid ?? '');
        if (!nSesid) return null;
        let worker = this.workers.get(nSesid);
        if (!worker) {
            worker = new IngestSessionWorker(
                {
                    nSesid,
                    label: String(route.label ?? user),
                    nLines: Number(route.nLines) || 25,
                    cTimezone: route.cTimezone ? String(route.cTimezone) : undefined,
                },
                (event, payload) => this.dispatch(event, payload),
                this.logger,
            );
            this.workers.set(nSesid, worker);
        }
        return worker;
    }

    /** In-process replacement for the bridge's socket.io emits. */
    private dispatch(event: string, payload: any): void {
        try {
            if (event === 'TCP-DATA') {
                void this.gateway.handleTcpData(payload);
            } else if (event === 'feed-refresh-data') {
                void this.gateway.feedRefreshData(payload);
            } else if (event === 'annot-refresh-transfer') {
                void this.gateway.handleAnnotTransferData(payload);
            } else {
                // Unmapped delivery (e.g. line-replace) — broadcast to the
                // session room exactly as the gateway would.
                const room = String(payload?.date ?? payload?.nSesid ?? '');
                if (room) this.gateway.server.to(`S${room}`).emit(event, payload);
                else this.logger.warn(`Eclipse ingest: unroutable delivery '${event}'`);
            }
        } catch (error) {
            this.logger.error(`Eclipse ingest dispatch '${event}' failed: ${error?.message ?? error}`);
        }
    }
}

interface IngestCfg {
    nSesid: string;
    label: string;
    nLines: number;
    /** hearing venue IANA zone from the Eclipse route file; absent = server zone */
    cTimezone?: string;
}

/** Same layout as tools/feed-replay so both ingest modes share durability. */
const PAGES_ROOT = path.join(process.cwd(), 'tools', 'feed-replay', 'captures', 'pages');
const pagesDir = (sesid: string) => path.join(PAGES_ROOT, `dt_${sesid}`);

/** One fully-isolated session: its own parser context and page store.
 *  Exported for unit tests only — not part of the service surface. */
export class IngestSessionWorker {
    private readonly framing = new BridgeFramingService();
    private readonly parser = new BridgeParserService();
    private readonly caseview = new CaseviewParserService();
    private readonly sink: FeedSink;
    /** Eclipse's output-format dropdown decides the wire format; detected from
     *  the first feed byte (Bridge is STX 0x02 command frames, CaseView is a
     *  raw ASCII/control stream). Null until the first byte arrives. */
    private protocol: 'B' | 'C' | null = null;
    private ctx: SessionContext | null = null;
    private dirty = false;
    private nextId = 1;
    private cap?: fs.WriteStream;
    private rehydrated = false;
    private readonly onCommand = (cx: SessionContext, hex: Buffer, cmd: any) => this.parser.sendToParseData(cx, hex, cmd);

    constructor(
        private readonly cfg: IngestCfg,
        emitDelivery: (event: string, payload: any) => void,
        private readonly logger: Logger,
    ) {
        this.sink = {
            emitLocal: () => { },
            emitDelivery,
            saveLine: async (_n: string, id: number) => { this.dirty = true; return id || this.nextId++; },
            saveMetaData: async () => { this.dirty = true; return 1; },
            removeLines: async () => { this.dirty = true; return 1; },
            savePageData: async () => { this.dirty = true; return 1; },
            runAnnotTransfer: async () => 1,
            log: () => { },
        };
    }

    get nSesid(): string { return this.cfg.nSesid; }
    get label(): string { return this.cfg.label; }

    /** Feed raw Eclipse bytes into this session's isolated parser context. */
    feed(chunk: Buffer): void {
        if (!chunk.length) return;
        if (!this.ctx) {
            this.protocol = chunk[0] === 0x02 ? 'B' : 'C';
            this.ctx = createSessionContext({ nSesid: this.cfg.nSesid, protocol: this.protocol, sink: this.sink, nLines: this.cfg.nLines, cTimezone: this.cfg.cTimezone });
            this.logger.log(`[${this.label}] detected ${this.protocol === 'B' ? 'Bridge' : 'CaseView'} feed format`);
        }
        this.ensureRehydrated();
        if (!this.cap) {
            fs.mkdirSync(PAGES_ROOT, { recursive: true });
            this.cap = fs.createWriteStream(path.join(PAGES_ROOT, '..', `eclipse_live_${this.cfg.nSesid}.bin`), { flags: 'a' });
        }
        this.cap.write(chunk);
        if (this.protocol === 'B') {
            this.framing.splitCommands(this.ctx, chunk, this.onCommand);
        } else {
            void this.caseview.parseData(this.ctx, chunk);
        }
    }

    private ensureRehydrated(): void {
        if (this.rehydrated) return;
        this.rehydrated = true;
        const restored = this.rehydrate();
        this.logger.log(`[${this.label}] active -> S${this.cfg.nSesid}` + (restored ? ` (rehydrated ${restored})` : ''));
    }

    private rehydrate(): number {
        if (!this.ctx) return 0;
        const dir = pagesDir(this.cfg.nSesid);
        if (!fs.existsSync(dir)) return 0;
        const files = fs.readdirSync(dir)
            .filter(f => /^page_\d+\.json$/.test(f))
            .sort((a, b) => (+a.match(/\d+/)![0]) - (+b.match(/\d+/)![0]));
        const buf: any[] = [];
        for (const f of files) {
            try {
                const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
                if (Array.isArray(arr)) buf.push(...arr);
            } catch { /* skip torn page */ }
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

    flush(): void {
        if (!this.dirty || !this.ctx) return;
        this.dirty = false;
        const buf: any[] = this.ctx.job.lineBuffer || [];
        const dir = pagesDir(this.cfg.nSesid);
        fs.mkdirSync(dir, { recursive: true });
        const totalPages = Math.max(1, Math.ceil(buf.length / this.cfg.nLines));
        for (let p = 1; p <= totalPages; p++) {
            const page = buf.slice((p - 1) * this.cfg.nLines, p * this.cfg.nLines);
            try { fs.writeFileSync(path.join(dir, `page_${p}.json`), JSON.stringify(page)); } catch { }
        }
    }
}
