import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';

import {
    BridgeFramingService,
    BridgeParserService,
    CaseviewParserService,
    createSessionContext,
    DETECT_WINDOW_BYTES,
    detectProtocol,
    FeedProtocolName,
    FeedSink,
    protocolEvidence,
    protocolLetter,
    SessionContext,
} from '@app/feed-parse';

import { EdgeHeldStream, EdgeRawStoreService } from '../../edge/edge-raw-store.service';
import { EventsGateway } from '../../events/events.gateway';
import { EclipseSessionService } from '../eclipse-session/eclipse-session.service';

/** A route written for a venue-box session (spec §4.2 "Dormant route"): its direct handshakes are held, never parsed. */
export function isHeldRoute(route: Record<string, any> | null | undefined): boolean {
    return String(route?.feedSource ?? '').trim().toUpperCase() === 'E';
}

/**
 * The protocol a route configures, when it carries one (a hand-written route may say `protocol: 'B'` or
 * `'bridge'`). Routes written by POST /session/eclipse carry none: the stream's own bytes decide (DET-4).
 */
export function configuredProtocol(route: Record<string, any> | null | undefined): FeedProtocolName | undefined {
    const raw = String(route?.protocol ?? '').trim().toLowerCase();
    if (raw === 'b' || raw === 'bridge') return 'bridge';
    if (raw === 'c' || raw === 'caseview') return 'caseview';
    return undefined;
}

/** What resolveWorker answers for a handshake that matched a venue-box ('E') route: hold it, never parse it. */
export interface HeldRouteMatch {
    held: true;
    route: Record<string, any>;
}

const isHeldMatch = (value: unknown): value is HeldRouteMatch => !!value && (value as HeldRouteMatch).held === true;

/**
 * How long stream bytes may wait, in memory only, for the protocol decision (DET-4) before the hold limit
 * decides on what they show (IngestSessionWorker.decideHeld 'hold-limit'). The raw capture keeps every byte,
 * but nothing replays it: bytes still held at a restart never reach the parser.
 */
export const DETECT_HOLD_MS = 30_000;

/**
 * Why the held bytes are decided without waiting for more:
 *  - 'end'        the session's stream is over (its route is gone): the box's end-of-stream rule;
 *  - 'hold-limit' they have been held DETECT_HOLD_MS;
 *  - 'disconnect' the connection closed (or the service stops) while the session goes on.
 */
export type HeldDecisionReason = 'end' | 'hold-limit' | 'disconnect';

/** An admin alert a session worker raises (PROTOCOL_FALLBACK); the service hands it to EventsGateway.adminAlert. */
export interface IngestAlert {
    kind: string;
    tier: 'P1' | 'P2' | 'info';
    nSesid: string;
    message: string;
    data?: Record<string, unknown>;
}

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
 *
 * Protocol (DET-4, spec §6.1): the parser is chosen from the stream's own
 * framing by libs/feed-parse detectProtocol, not from its first byte (Eclipse
 * connects mid-page, so a real Bridge stream usually starts with text and was
 * parsed as CaseView). See IngestSessionWorker.feed.
 *
 * Venue-box sessions (spec §4.2, §4.5 "Direct handshake for a live 'E'
 * session"): their route is a DORMANT copy (`feedSource: 'E'`). A reporter
 * whose Eclipse reaches this listener directly is accepted against it, but
 * the stream is HELD: the post-handshake bytes go to EdgeRawStoreService
 * (orphan 'H', P1 alert) and are never parsed. Without the edge module the
 * connection is dropped, never parsed.
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
        // Provided by the edge module (exported by EdgeModule); absent, a venue session's direct stream is dropped.
        @Optional() private readonly rawStore?: EdgeRawStoreService,
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
        this.flushTimer = setInterval(() => this.tick(), 400);
    }

    /** Every 400 ms: bytes held past DETECT_HOLD_MS are decided by the hold limit, then dirty pages are written. */
    private tick(now: number = Date.now()): void {
        this.workers.forEach(w => {
            try {
                w.expireHeld(now);
            } catch (error) {
                this.logger.error(`[${w.label}] deciding the held feed bytes failed: ${error?.message ?? error}`);
            }
            w.flush();
        });
    }

    async onModuleDestroy(): Promise<void> {
        if (this.flushTimer) clearInterval(this.flushTimer);
        // Bytes still held would be lost with the process: decide them on what they show (the hearing goes on,
        // so never blindly), let the parse they start settle, then write the pages.
        let decided = false;
        this.workers.forEach(w => {
            try {
                if (w.undecided && w.decideHeld('disconnect')) decided = true;
            } catch (error) {
                this.logger.error(`[${w.label}] deciding the held feed bytes failed: ${error?.message ?? error}`);
            }
        });
        if (decided) await new Promise(resolve => setImmediate(resolve));
        this.workers.forEach(w => w.flush());
        this.server?.close();
    }

    /**
     * A parsed stream's connection closed while its bytes are still held undecided (review item 34). When the
     * session's route is gone (the session ended or was deleted) the stream is over: the end-of-stream rule
     * decides them (the box's: the framing rule, else CaseView, with an alert). Otherwise the hearing goes on and
     * Eclipse may reconnect into the same worker: the disconnect rule decides only on what the bytes show. A route
     * file that cannot be read counts as "still there".
     */
    private async settleHeldOnClose(worker: IngestSessionWorker): Promise<void> {
        if (!worker.undecided) return;
        let routes: Record<string, any>[] | null;
        try {
            routes = await this.eclipseSession.readEclipseRoutes();
        } catch {
            routes = null;
        }
        if (!worker.undecided) return; // a reconnect decided it meanwhile
        const routed = routes === null || routes.some(route => String(route?.nSesid ?? '') === worker.nSesid);
        worker.decideHeld(routed ? 'disconnect' : 'end');
    }

    /** A worker's alert to the admins (EventsGateway.adminAlert: the edge module's alerts when loaded, else an error line). */
    private raiseAlert(alert: IngestAlert): void {
        try {
            const gateway: any = this.gateway;
            if (typeof gateway?.adminAlert === 'function') gateway.adminAlert(alert);
            else this.logger.error(`[rt-edge alert ${alert.tier}] ${alert.kind}: ${alert.message}`);
        } catch {
            /* an alert must never break the feed */
        }
    }

    private handleConnection(sock: net.Socket): void {
        let buf = Buffer.alloc(0);
        let worker: IngestSessionWorker | null = null;
        let held: HeldConnection | null = null;
        let handshakeDone = false;
        let closed = false;
        sock.on('data', (chunk: Buffer) => {
            // A held stream records every byte in arrival order, before any await (never parsed).
            if (held) {
                held.push(chunk);
                void this.checkHeldRoute(held, sock);
                return;
            }
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
                const match = await this.resolveWorker(user, pass);
                if (isHeldMatch(match)) {
                    // A chunk that arrived during the route read re-ran this handshake; the first run holds it.
                    if (held || handshakeDone) return;
                    const rest = buf.slice(second + 2);
                    buf = Buffer.alloc(0);
                    handshakeDone = true;
                    held = this.holdConnection(sock, user, match.route);
                    if (!held) {
                        sock.destroy();
                        return;
                    }
                    if (rest.length) held.push(rest);
                    if (closed) held.close('closed');
                    return;
                }
                worker = match;
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
            closed = true;
            if (held) held.close('closed');
            if (worker) {
                this.logger.log(`[${worker.label}] Eclipse disconnected`);
                if (worker.undecided) {
                    const closing = worker;
                    void this.settleHeldOnClose(closing).catch(e => this.logger.error(`[${closing.label}] deciding the held feed bytes failed: ${e?.message ?? e}`));
                }
            }
        });
    }

    /**
     * A verified direct handshake for a venue-box session (spec §4.5): the connection is accepted and its bytes are
     * journaled to a held capture (EdgeRawStoreService.openHeldStream: orphan 'H', P1 alert), never parsed. Bytes that
     * arrive before the capture is open are kept in order and written once it is. Null (the caller drops the
     * connection) when the edge module is not there to hold it: a venue session's stream is never parsed here.
     */
    private holdConnection(sock: net.Socket, user: string, route: Record<string, any>): HeldConnection | null {
        const nSesid = String(route?.nSesid ?? '').trim();
        if (!nSesid) return null;
        if (!this.rawStore) {
            this.logger.error(`[held] '${user}' -> S${nSesid} is a venue-box session, but the edge module is not loaded: dropping the direct stream (it is never parsed here)`);
            return null;
        }
        const connId = randomUUID();
        const peer = String(sock.remoteAddress ?? '');
        this.logger.warn(`[held] '${user}' -> S${nSesid} (venue-box session) from ${peer}: direct stream HELD, not parsed`);
        const connection = new HeldConnection(nSesid, this.logger);
        connection.attach(this.rawStore.openHeldStream({
            nSesid,
            user,
            peer,
            connId,
            nEdgeid: route?.nEdgeid ? String(route.nEdgeid) : null,
        }), () => sock.destroy());
        return connection;
    }

    /**
     * A held stream lasts only while its session still has a venue-box route: a split (Part 1's route removed), an
     * end (route removed at the seal) or "Use direct cloud instead" (route rewritten as 'D') closes it, so the
     * reporter's reconnect is matched afresh. One route read at a time per connection.
     */
    private async checkHeldRoute(held: HeldConnection, sock: net.Socket): Promise<void> {
        if (held.checking || held.isClosed) return;
        held.checking = true;
        try {
            const routes = await this.safeRoutes();
            const still = routes.some(route => String(route?.nSesid ?? '').trim() === held.nSesid && isHeldRoute(route));
            if (!still) {
                this.logger.warn(`[held] S${held.nSesid} no longer has a venue-box route: closing the held direct stream`);
                held.close('route-gone');
                sock.destroy();
            }
        } finally {
            held.checking = false;
        }
    }

    private async safeRoutes(): Promise<Record<string, any>[]> {
        try {
            return await this.eclipseSession.readEclipseRoutes();
        } catch {
            return [];
        }
    }

    /**
     * The session worker a handshake feeds; null for no matching route. A route of a venue-box session
     * (`feedSource: 'E'`) never gets a worker: the caller holds that stream (HeldRouteMatch).
     */
    private async resolveWorker(user: string, pass: string): Promise<IngestSessionWorker | HeldRouteMatch | null> {
        const route = (await this.safeRoutes()).find(candidate =>
            String(candidate?.user ?? '') === user && this.eclipseSession.eclipsePasswordMatches(candidate, pass));
        if (!route) return null;
        const nSesid = String(route.nSesid ?? '');
        if (!nSesid) return null;
        if (isHeldRoute(route)) return { held: true, route };
        let worker = this.workers.get(nSesid);
        if (!worker) {
            const protocol = configuredProtocol(route);
            worker = new IngestSessionWorker(
                {
                    nSesid,
                    label: String(route.label ?? user),
                    nLines: Number(route.nLines) || 25,
                    cTimezone: route.cTimezone ? String(route.cTimezone) : undefined,
                    ...(protocol ? { protocol } : {}),
                },
                (event, payload) => this.dispatch(event, payload),
                this.logger,
                alert => this.raiseAlert(alert),
            );
            this.workers.set(nSesid, worker);
        }
        return worker;
    }

    /**
     * In-process replacement for the bridge's socket.io emits. Calls the gateway's ingest* bodies
     * directly: this stream already passed the Eclipse route-file credential check, and the
     * socket.io handlers now require a service socket, which an in-process call does not have.
     */
    private dispatch(event: string, payload: any): void {
        try {
            if (event === 'TCP-DATA') {
                void this.gateway.ingestTcpData(payload);
            } else if (event === 'feed-refresh-data') {
                void this.gateway.ingestFeedRefresh(payload);
            } else if (event === 'annot-refresh-transfer') {
                void this.gateway.ingestAnnotRefresh(payload);
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
    /** a protocol the route itself configures (wins over detection); absent = detected from the stream (DET-4) */
    protocol?: FeedProtocolName;
}

/**
 * One held direct connection of a venue-box session: the bytes in arrival order, written into the raw store's held
 * capture once it is open (spec §4.5). Exported for unit tests only.
 */
export class HeldConnection {
    /** a route re-read for this connection is in flight */
    checking = false;
    private stream: EdgeHeldStream | null = null;
    private pending: Array<{ bytes: Buffer; tRecv: number }> = [];
    private closeReason: string | null = null;
    private failed = false;

    constructor(readonly nSesid: string, private readonly logger: Pick<Logger, 'error' | 'warn'>) { }

    get isClosed(): boolean {
        return this.closeReason !== null || this.failed;
    }

    /** Wire the raw store's handle; `onFail` drops the connection when it cannot be opened. */
    attach(opening: Promise<EdgeHeldStream>, onFail: () => void): void {
        opening.then(
            stream => {
                this.stream = stream;
                const queued = this.pending;
                this.pending = [];
                try {
                    for (const part of queued) stream.write(part.bytes, part.tRecv);
                } catch (error) {
                    this.logger.error(`[held] S${this.nSesid}: writing the held bytes failed (${(error as Error)?.message ?? error})`);
                }
                if (this.closeReason !== null) void stream.close(this.closeReason);
            },
            error => {
                this.failed = true;
                this.pending = [];
                this.logger.error(`[held] S${this.nSesid}: the held capture could not be opened (${error?.message ?? error}); dropping the direct stream`);
                onFail();
            },
        );
    }

    /** Record a chunk (never parsed). Ignored once closed or failed. */
    push(chunk: Buffer, tRecv: number = Date.now()): void {
        if (!chunk?.length || this.isClosed) return;
        if (!this.stream) {
            this.pending.push({ bytes: Buffer.from(chunk), tRecv });
            return;
        }
        try {
            this.stream.write(chunk, tRecv);
        } catch (error) {
            this.logger.error(`[held] S${this.nSesid}: writing the held bytes failed (${(error as Error)?.message ?? error})`);
        }
    }

    /** Close once: the capture is finalised (and its orphan row updated) by the raw store. */
    close(reason: string): void {
        if (this.closeReason !== null || this.failed) return;
        this.closeReason = reason;
        if (this.stream) void this.stream.close(reason);
    }
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
    /** Eclipse's output-format dropdown decides the wire format. DET-4: decided
     *  once by libs/feed-parse detectProtocol from the stream's framing
     *  (complete Bridge frames vs CaseView line markers), or by the route's
     *  configured protocol; CaseView once DETECT_WINDOW_BYTES arrived with no
     *  decision (today's default). Null while undecided. */
    private protocol: 'B' | 'C' | null = null;
    /** Bytes received while the protocol is undecided, in order, with their receive times. */
    private pending: Array<{ bytes: Buffer; tRecv: number }> = [];
    private pendingBytes = 0;
    /** When (Date.now()) the oldest byte still held arrived; null while nothing is held. */
    private heldSince: number | null = null;
    /** The hold limit found nothing to decide on yet (said once per hold). */
    private holdNoted = false;
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
        /** Admin alerts (PROTOCOL_FALLBACK); absent, the logger line is all there is. */
        private readonly onAlert?: (alert: IngestAlert) => void,
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

    /**
     * Feed raw Eclipse bytes into this session's isolated parser context. `tRecv` is the receive time
     * (DET-1; default: now). Until the protocol is decided the bytes are kept, in order, and parsed once
     * it is, each with its own receive time; the raw capture gets every byte as it arrives. Held bytes are
     * also decided without more input: at the hold limit (expireHeld), a disconnect or the end of the
     * stream (decideHeld).
     */
    feed(chunk: Buffer, tRecv: number = Date.now()): void {
        if (!chunk.length) return;
        this.capture(chunk);
        if (!this.ctx) {
            this.pending.push({ bytes: chunk, tRecv });
            this.pendingBytes += chunk.length;
            if (this.heldSince === null) this.heldSince = Date.now();
            const protocol = this.decideProtocol();
            if (protocol) this.commit(protocol);
            return;
        }
        this.ensureRehydrated();
        this.parse(chunk, tRecv);
    }

    /** True while bytes are held back because the protocol is not decided yet. */
    get undecided(): boolean {
        return !this.ctx && this.pendingBytes > 0;
    }

    /** Opens the parser lane on the decided protocol and parses the held bytes first, in order, each with its receive time. */
    private commit(protocol: 'B' | 'C'): void {
        this.protocol = protocol;
        this.ctx = createSessionContext({ nSesid: this.cfg.nSesid, protocol: this.protocol, sink: this.sink, nLines: this.cfg.nLines, cTimezone: this.cfg.cTimezone });
        this.ensureRehydrated();
        const queued = this.pending;
        this.pending = [];
        this.pendingBytes = 0;
        this.heldSince = null;
        this.holdNoted = false;
        for (const part of queued) this.parse(part.bytes, part.tRecv);
    }

    /** The first DETECT_WINDOW_BYTES of the held bytes: all the framing rule looks at. */
    private heldWindow(): Buffer {
        return Buffer.concat(this.pending.map(p => p.bytes), Math.min(this.pendingBytes, DETECT_WINDOW_BYTES));
    }

    /**
     * DET-4 (spec §6.1; tools/ci/golden-replay/README "Protocol detection"): the route's configured protocol
     * wins; otherwise detectProtocol over the first DETECT_WINDOW_BYTES. Still undecided once that many bytes
     * are in: CaseView, the default before detection existed, with a warning and an alert.
     */
    private decideProtocol(): 'B' | 'C' | null {
        const window = this.heldWindow();
        const verdict = detectProtocol(this.cfg.protocol ?? null, window);
        if (verdict !== 'undecided') {
            const how = this.cfg.protocol ? 'configured on the route' : `detected from the first ${window.length} bytes`;
            this.logger.log(`[${this.label}] ${verdict === 'bridge' ? 'Bridge' : 'CaseView'} feed format (${how})`);
            return protocolLetter(verdict);
        }
        if (this.pendingBytes >= DETECT_WINDOW_BYTES) {
            this.logger.warn(`[${this.label}] feed format still unclear after ${this.pendingBytes} bytes: parsing as CaseView (the default)`);
            this.alert(`Session ${this.nSesid}: the feed format was still unclear after ${this.pendingBytes} bytes; parsing it as CaseView (the default)`,
                { protocol: 'C', how: 'window', bytes: this.pendingBytes });
            return 'C';
        }
        return null;
    }

    /**
     * Review item 34: decide the protocol of the bytes still held, now, without waiting for more. Returns the
     * protocol chosen, or null when nothing is held or the bytes stay held.
     *  - 'end' (the stream is over): the box's end-of-stream rule (libs/rt-ingest session-worker end()): the
     *    framing rule over what is held, else CaseView, the default, with a PROTOCOL_FALLBACK alert.
     *  - 'hold-limit' and 'disconnect' (the hearing goes on, so a wrong guess would mis-parse the rest of it): the
     *    framing rule; else the only kind of evidence present (a complete Bridge frame and no CaseView marker, or
     *    a marker and no frame), with the alert. With no frame and no marker at all, or with both kinds, the bytes
     *    stay held: plain text has no line boundary of either protocol, and guessing CaseView for a Bridge stream
     *    would garble every later frame. The window (DETECT_WINDOW_BYTES), the next frame or marker, or the end
     *    still decide them.
     */
    decideHeld(reason: HeldDecisionReason): 'B' | 'C' | null {
        if (!this.undecided) return null;
        const window = this.heldWindow();
        const verdict = detectProtocol(this.cfg.protocol ?? null, window);
        if (verdict !== 'undecided') {
            this.logger.log(`[${this.label}] ${verdict === 'bridge' ? 'Bridge' : 'CaseView'} feed format (detected from the first ${window.length} bytes, ${reason})`);
            const decided = protocolLetter(verdict);
            this.commit(decided);
            return decided;
        }
        const { bridgeFrames, caseviewMarkers } = protocolEvidence(window);
        const bytes = this.pendingBytes;
        const heldMs = this.heldSince === null ? 0 : Math.max(0, Date.now() - this.heldSince);
        let protocol: 'B' | 'C' | null;
        if (reason === 'end') protocol = 'C';
        else if (bridgeFrames > 0 && caseviewMarkers === 0) protocol = 'B';
        else if (caseviewMarkers > 0 && bridgeFrames === 0) protocol = 'C';
        else protocol = null;
        if (!protocol) {
            if (!this.holdNoted) {
                this.holdNoted = true;
                this.logger.warn(`[${this.label}] feed format still unclear (${reason}): ${bytes} bytes held with ${bridgeFrames} Bridge frame(s) and ${caseviewMarkers} CaseView marker(s); still holding them`);
            }
            return null;
        }
        const name = protocol === 'B' ? 'Bridge' : 'CaseView';
        const message = reason === 'end'
            ? `Session ${this.nSesid} ended before the feed format was clear (${bytes} bytes); parsing them as CaseView (the default)`
            : `Session ${this.nSesid}: the feed format was still unclear after ${Math.round(heldMs / 1000)} s (${bytes} bytes, ${reason}); parsing as ${name} from ${bridgeFrames} Bridge frame(s) and ${caseviewMarkers} CaseView marker(s)`;
        this.logger.warn(`[${this.label}] ${message}`);
        this.alert(message, { protocol, how: reason, bytes, heldMs, bridgeFrames, caseviewMarkers });
        this.commit(protocol);
        return protocol;
    }

    /** The service's 400 ms tick: bytes held DETECT_HOLD_MS or longer go to decideHeld('hold-limit'). */
    expireHeld(now: number = Date.now()): 'B' | 'C' | null {
        if (this.heldSince === null || !this.undecided) return null;
        if (now - this.heldSince < DETECT_HOLD_MS) return null;
        return this.decideHeld('hold-limit');
    }

    private alert(message: string, data: Record<string, unknown>): void {
        try {
            this.onAlert?.({ kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: this.nSesid, message, data });
        } catch {
            /* an alert must never break the feed */
        }
    }

    private capture(chunk: Buffer): void {
        if (!this.cap) {
            fs.mkdirSync(PAGES_ROOT, { recursive: true });
            this.cap = fs.createWriteStream(path.join(PAGES_ROOT, '..', `eclipse_live_${this.cfg.nSesid}.bin`), { flags: 'a' });
        }
        this.cap.write(chunk);
    }

    private parse(chunk: Buffer, tRecv: number): void {
        if (!this.ctx) return;
        if (this.protocol === 'B') {
            this.framing.splitCommands(this.ctx, chunk, this.onCommand, tRecv);
        } else {
            void this.caseview.parseData(this.ctx, chunk, tRecv);
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
