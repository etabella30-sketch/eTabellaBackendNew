/**
 * SPEC HELPER (imported by *.spec.ts only; nothing in the box imports it): an in-process cloud for the box uplink.
 *
 * One node:http server on 127.0.0.1 (port 0 the first time, the SAME port after a restart) serving
 * - the device REST routes `GET /realtimeapi/edge/v1/challenge`, `POST /realtimeapi/edge/v1/enroll|cert|archive-url`,
 *   `PUT /upload/<id>` (the presigned archive target) and `GET /favicon.ico` (the reachability probe);
 * - socket.io namespace `/edge` with a device-key middleware (single-use nonce, P-256 signature over
 *   `nonce‖edgeId‖bootId`, key status, MR-6 identity fencing) and the box → cloud events of spec §5.4.
 *
 * The cloud's half of the protocol is libs/edge-sync's (`helloVerdict`, `RoundAssembler`, `validateRound`,
 * `checkPendingRawPair`, `planRawAppend`, `checkSeal`, `sealSigningPayload`) over in-memory stores, plus
 * libs/rt-ingest's record codec for the raw lane (`verifyRecordBatch`, `decodeBody`). It is NOT realtime-server's
 * edge module; it only follows that module's wire contract (edge-uplink.gateway.ts header). `stop()` + `start()`
 * is a cloud restart: the stores survive (Redis/disk), the staged round parts and the connection do not.
 */
import { createHash, randomBytes, randomUUID, sign as cryptoSign, generateKeyPairSync, KeyObject } from 'crypto';
import * as http from 'http';
import type { AddressInfo } from 'net';

import { Namespace, Server, Socket as ServerSocket } from 'socket.io';

import {
    AssignedSession,
    CanonicalPage,
    checkPendingRawPair,
    checkSeal,
    CloudSessionMeta,
    EdgeEvent,
    EdgeHello,
    EdgeHelloReplySession,
    EdgeIncident,
    EdgeRaw,
    EdgeRound,
    EdgeSeal,
    EdgeStatus,
    emptyCloudMeta,
    helloVerdict,
    MAX_PART_BYTES,
    pageCount,
    planRawAppend,
    RawPosition,
    RawReply,
    RoundAssembler,
    RoundReply,
    SealReply,
    sealSigningPayload,
    SyncState,
    validateRound,
} from '@app/edge-sync';
import { chainSeed, decodeBody, RecordType, verifyRecordBatch } from '@app/rt-ingest';

import { der, derChildren, derNameCn, derOid, derSanDns, derSeq, fromPem, OID, readDer, toPem } from '../csr';
import { verifyDeviceSignature } from '../device-key';

export interface FakeRoute {
    readonly user: string;
    readonly salt: string;
    readonly hash: string;
    readonly scryptN: number;
}

export interface FakeSessionInput {
    readonly nSesid: string;
    readonly nCaseid?: string;
    readonly cName?: string;
    readonly dStartDt?: string;
    readonly tz?: string;
    readonly nLines?: number;
    readonly parserVer: string;
    readonly route: FakeRoute | null;
    readonly team?: ReadonlyArray<{ nUserid: string; name: string; isCaseAdmin: boolean }>;
}

interface RawRec {
    readonly seq: number;
    readonly type: RecordType;
    readonly hash: string;
    readonly encoded: Buffer;
    readonly payload: Buffer;
}

export interface FakeCloudSession {
    readonly input: FakeSessionInput;
    bound: boolean;
    syncState: SyncState;
    meta: CloudSessionMeta;
    readonly pages: Map<number, CanonicalPage>;
    readonly raw: RawRec[];
    pendingRawChecks: RawPosition[];
    seal: EdgeSeal | null;
    sealReply: SealReply | null;
    readyCount: number;
}

export interface FakeNode {
    readonly nEdgeid: string;
    readonly slug: string;
    pubKey: string | null;
    status: 'C' | 'A' | 'Q' | 'X';
}

export interface FakeCloudFaults {
    /** Apply the next N complete rounds but never ack them (lost ack, §5.5). */
    dropRoundAcks: number;
    /** Answer the next N rounds BUSY. */
    busyRounds: number;
    /** Answer the next round FORK (and freeze the session). */
    forkNextRound: boolean;
    /** Nack every raw batch `rate` (the raw lane lags the applied rounds, spec §5.5 D19 example). */
    rawLag: boolean;
    /** Refuse every hello with this code. */
    refuseHello: string | null;
    /** Replies used (once each, in order) for the next complete rounds instead of validating them; nothing applied. */
    roundReplies: unknown[];
    /** Replies used (once each) for the next raw batches; nothing appended. */
    rawReplies: unknown[];
    /** Replies used (once each) for the next seals; nothing recorded. */
    sealReplies: SealReply[];
    /**
     * Answer every `archive-url` request with this (realtime-server without an archive answers 503
     * `{msg:-1, cCode:'NOT_CONFIGURED'}`, edge.controller.ts); null = hand out an upload URL.
     */
    archiveUrlRefusal: { status: number; body: Record<string, unknown> } | null;
}

export interface FakeCloudLog {
    readonly hellos: EdgeHello[];
    readonly helloReplies: EdgeHelloReplySession[][];
    readonly rounds: EdgeRound[];
    readonly roundReplies: RoundReply[];
    readonly raws: Array<{ nSesid: string; fromSeq: number; toSeq: number }>;
    readonly rawPulls: Array<{ nSesid: string; fromSeq: number; toSeq: number }>;
    readonly seals: EdgeSeal[];
    readonly statuses: EdgeStatus[];
    readonly readies: string[];
    readonly captures: unknown[];
    /** Every `archive-url` request (answered or refused), in order. */
    readonly archiveUrls: Array<{ nSesid: string; atMs: number }>;
    readonly uploads: Map<string, Buffer>;
    readonly refusedConnects: string[];
    readonly connects: Array<{ edgeId: string; bootId: string }>;
}

export interface FakeCloudOptions {
    /** `limits.maxPart` in the hello reply (small values force multi-part rounds). */
    readonly maxPart?: number;
    readonly edgeBps?: number;
    readonly edgeTokenKeys?: Array<Record<string, unknown>>;
    /** Identity fencing window (MR-6, 20 s). */
    readonly dupIdentityWindowMs?: number;
}

const json = (res: http.ServerResponse, status: number, body: unknown): void => {
    const text = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(text) });
    res.end(text);
};

const readBody = (req: http.IncomingMessage): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });

export class FakeCloud {
    readonly nodes = new Map<string, FakeNode>();
    readonly sessions = new Map<string, FakeCloudSession>();
    readonly enrollCodes = new Map<string, { nEdgeid: string; slug: string; autoConfirm: boolean }>();
    readonly faults: FakeCloudFaults = { dropRoundAcks: 0, busyRounds: 0, forkNextRound: false, rawLag: false, refuseHello: null, roundReplies: [], rawReplies: [], sealReplies: [], archiveUrlRefusal: null };
    readonly log: FakeCloudLog = {
        hellos: [],
        helloReplies: [],
        rounds: [],
        roundReplies: [],
        raws: [],
        rawPulls: [],
        seals: [],
        statuses: [],
        readies: [],
        captures: [],
        archiveUrls: [],
        uploads: new Map(),
        refusedConnects: [],
        connects: [],
    };
    revokedJtis: string[] = [];
    revokedUsers: string[] = [];
    edgeTokenKeys: Array<Record<string, unknown>>;
    /** A certificate issuer: `issueCert(csrPem)` returns the chain PEM; replace it to refuse or delay. */
    issueCert: (csrPem: string, node: FakeNode) => { chain: string } | { pending: true } | { refuse: number };

    private readonly opts: FakeCloudOptions;
    private readonly nonces = new Set<string>();
    private readonly ca: { key: KeyObject } = { key: generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey };
    private server: http.Server | null = null;
    private io: Server | null = null;
    private nsp: Namespace | null = null;
    private assembler = new RoundAssembler();
    private box: { socket: ServerSocket; edgeId: string; bootId: string; lastSeenMs: number; status: FakeNode['status']; helloed: Set<string> } | null = null;
    private portValue = 0;

    constructor(opts: FakeCloudOptions = {}) {
        this.opts = opts;
        this.edgeTokenKeys = opts.edgeTokenKeys ?? [];
        this.issueCert = (csrPem, node) => ({ chain: signCsr(csrPem, `${node.slug}.etabella-edge.net`, this.ca.key) });
    }

    get port(): number {
        return this.portValue;
    }

    get origin(): string {
        return `http://127.0.0.1:${this.portValue}`;
    }

    get running(): boolean {
        return !!this.server;
    }

    /** Connected box socket (null when none). */
    get boxConnected(): boolean {
        return !!this.box?.socket.connected;
    }

    // ---- lifecycle -------------------------------------------------------------------------------------------------

    async start(): Promise<void> {
        if (this.server) return;
        const server = http.createServer((req, res) => void this.onHttp(req, res));
        const io = new Server(server, { path: '/socket.io', serveClient: false, maxHttpBufferSize: 1_000_000, pingInterval: 10_000, pingTimeout: 20_000 });
        const nsp = io.of('/edge');
        nsp.use((socket, next) => this.authenticate(socket, next));
        nsp.on('connection', socket => this.onConnection(socket));
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(this.portValue, '127.0.0.1', () => {
                server.off('error', reject);
                resolve();
            });
        });
        this.portValue = (server.address() as AddressInfo).port;
        this.server = server;
        this.io = io;
        this.nsp = nsp;
        // A cloud restart loses the staged parts of multi-part rounds (§5.5); the box's hello diff resends.
        this.assembler = new RoundAssembler();
    }

    /** Stop serving (an outage or a cloud restart): every connection drops; the stores are kept. */
    async stop(): Promise<void> {
        const io = this.io;
        const server = this.server;
        this.io = null;
        this.nsp = null;
        this.server = null;
        this.box = null;
        if (io) {
            io.disconnectSockets(true);
            await new Promise<void>(resolve => io.close(() => resolve()));
        }
        if (server) {
            server.closeAllConnections?.();
            await new Promise<void>(resolve => (server.listening ? server.close(() => resolve()) : resolve()));
        }
    }

    // ---- setup -----------------------------------------------------------------------------------------------------

    /** A one-time enrolment code for a new node (spec §3.4 step 1). */
    addEnrollCode(code: string, opts: { nEdgeid?: string; slug?: string; autoConfirm?: boolean } = {}): string {
        const nEdgeid = opts.nEdgeid ?? randomUUID();
        this.enrollCodes.set(code, { nEdgeid, slug: opts.slug ?? 'k7q2m9x4', autoConfirm: opts.autoConfirm ?? true });
        return nEdgeid;
    }

    /** Bind a session to the (only) box: `et_rtedge_session_bind` (cFeedSource 'E', epoch 1, 'L'). */
    bind(input: FakeSessionInput): FakeCloudSession {
        const s: FakeCloudSession = {
            input,
            bound: true,
            syncState: 'L',
            meta: emptyCloudMeta(input.nSesid, { nLines: input.nLines ?? 25 }),
            pages: new Map(),
            raw: [],
            pendingRawChecks: [],
            seal: null,
            sealReply: null,
            readyCount: 0,
        };
        this.sessions.set(input.nSesid, s);
        return s;
    }

    session(nSesid: string): FakeCloudSession {
        const s = this.sessions.get(nSesid);
        if (!s) throw new Error(`fake cloud: unknown session ${nSesid}`);
        return s;
    }

    /** RT Production Stop (§4.4): 'S' and push `c.assign{op:'end'}` (the next hello also answers 'end'). */
    async endSession(nSesid: string): Promise<unknown> {
        this.session(nSesid).syncState = 'S';
        return this.push(EdgeEvent.assign, { op: 'end', nSesid });
    }

    /** Push a cloud → box event and resolve its ack (null when the box is not connected or did not ack). */
    async push(event: string, payload: unknown, timeoutMs = 5_000): Promise<unknown> {
        const box = this.box;
        if (!box || !box.socket.connected) return null;
        try {
            return await box.socket.timeout(timeoutMs).emitWithAck(event, payload);
        } catch {
            return null;
        }
    }

    /** Disconnect the box after `c.refused {code}` (admin revoke / quarantine / re-enrol). */
    refuse(code: string): void {
        const box = this.box;
        if (!box) return;
        box.socket.emit('c.refused', { code, message: code });
        box.socket.disconnect(true);
    }

    // ---- views for assertions -------------------------------------------------------------------------------------

    /** Pages 1..N as stored (index p-1 = page p). */
    pagesOf(nSesid: string): CanonicalPage[] {
        const s = this.session(nSesid);
        const out: CanonicalPage[] = [];
        for (let p = 1; p <= pageCount(s.meta.totalLines, s.meta.nLines); p++) out.push(s.pages.get(p) ?? []);
        return out;
    }

    rawHead(nSesid: string): RawPosition {
        const s = this.session(nSesid);
        const last = s.raw[s.raw.length - 1];
        return last ? { seq: last.seq, hash: last.hash } : { seq: 0, hash: chainSeed(nSesid).toString('hex') };
    }

    rawHashAt(nSesid: string, seq: number): string | undefined {
        if (seq === 0) return chainSeed(nSesid).toString('hex');
        return this.session(nSesid).raw[seq - 1]?.hash;
    }

    rawRecords(nSesid: string): readonly RawRec[] {
        return this.session(nSesid).raw;
    }

    // ---- HTTP ------------------------------------------------------------------------------------------------------

    private async onHttp(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url ?? '/', this.origin);
            if (req.method === 'GET' && url.pathname === '/favicon.ico') {
                res.writeHead(200, { 'content-type': 'image/x-icon' });
                res.end();
                return;
            }
            if (req.method === 'GET' && url.pathname === '/realtimeapi/edge/v1/challenge') {
                const nonce = randomBytes(32).toString('hex');
                this.nonces.add(nonce);
                json(res, 200, { msg: 1, nonce, expiresInSec: 60 });
                return;
            }
            if (req.method === 'PUT' && url.pathname.startsWith('/upload/')) {
                this.log.uploads.set(url.pathname.slice('/upload/'.length), await readBody(req));
                res.writeHead(200);
                res.end();
                return;
            }
            if (req.method !== 'POST') {
                json(res, 404, { msg: -1, cCode: 'NOT_FOUND' });
                return;
            }
            const body = JSON.parse((await readBody(req)).toString('utf8') || '{}') as Record<string, unknown>;
            switch (url.pathname) {
                case '/realtimeapi/edge/v1/enroll':
                    return this.onEnroll(body, res);
                case '/realtimeapi/edge/v1/cert':
                    return this.onCert(body, res);
                case '/realtimeapi/edge/v1/archive-url':
                    return this.onArchiveUrl(body, res);
                default:
                    json(res, 404, { msg: -1, cCode: 'NOT_FOUND' });
            }
        } catch (err) {
            json(res, 500, { msg: -1, cCode: 'ERROR', message: (err as Error).message });
        }
    }

    private onEnroll(body: Record<string, unknown>, res: http.ServerResponse): void {
        const code = String(body.code ?? '');
        const entry = this.enrollCodes.get(code);
        if (!entry) return json(res, 400, { msg: -1, cCode: 'INVALID_CODE', message: 'Invalid or expired enrollment code' });
        this.enrollCodes.delete(code);
        const pubKey = String(body.cPubKey ?? '');
        const status = entry.autoConfirm ? 'A' : 'C';
        this.nodes.set(entry.nEdgeid, { nEdgeid: entry.nEdgeid, slug: entry.slug, pubKey, status });
        const cKeyFpr = createHash('sha256').update(Buffer.from(pubKey, 'base64')).digest('hex');
        json(res, 200, { msg: 1, nEdgeid: entry.nEdgeid, cSlug: entry.slug, cStatus: status, cKeyFpr });
    }

    /** Device-signed REST: nonce (consumed), node, signature, status 'A'. */
    private deviceSigned(body: Record<string, unknown>, payload: (edgeId: string, nonce: string) => string): FakeNode | number {
        const edgeId = String(body.edgeId ?? '');
        const nonce = String(body.nonce ?? '');
        if (!this.nonces.delete(nonce)) return 401;
        const node = this.nodes.get(edgeId);
        if (!node || !node.pubKey) return 401;
        if (!verifyDeviceSignature(node.pubKey, payload(edgeId, nonce), String(body.sig ?? ''))) return 401;
        if (node.status !== 'A') return 403;
        return node;
    }

    private onCert(body: Record<string, unknown>, res: http.ServerResponse): void {
        const csr = String(body.csr ?? '');
        let der: Buffer;
        try {
            der = fromPem(csr, 'CERTIFICATE REQUEST');
        } catch {
            return json(res, 400, { msg: -1, cCode: 'INVALID' });
        }
        const csrHash = createHash('sha256').update(der).digest('hex');
        const node = this.deviceSigned(body, (edgeId, nonce) => `${nonce}${edgeId}${csrHash}`);
        if (typeof node === 'number') return json(res, node, { msg: -1, cCode: 'UNAUTHORIZED' });
        const issued = this.issueCert(csr, node);
        if ('refuse' in issued) return json(res, issued.refuse, { msg: -1, cCode: 'REFUSED' });
        if ('pending' in issued) return json(res, 200, { msg: 1, pending: true });
        json(res, 200, { msg: 1, chain: issued.chain });
    }

    private onArchiveUrl(body: Record<string, unknown>, res: http.ServerResponse): void {
        const allowed = ['edgeId', 'nonce', 'sig', 'nSesid', 'sha256', 'bytes'];
        const unknownKey = Object.keys(body).find(k => !allowed.includes(k));
        // realtime-server's ValidationPipe runs with forbidNonWhitelisted.
        if (unknownKey) return json(res, 400, { msg: -1, cCode: 'INVALID', message: `property ${unknownKey} should not exist` });
        const node = this.deviceSigned(body, (edgeId, nonce) => `${nonce}${edgeId}${String(body.nSesid)}${String(body.sha256)}`);
        if (typeof node === 'number') return json(res, node, { msg: -1, cCode: 'UNAUTHORIZED' });
        this.log.archiveUrls.push({ nSesid: String(body.nSesid), atMs: Date.now() });
        const refusal = this.faults.archiveUrlRefusal;
        if (refusal) return json(res, refusal.status, refusal.body);
        const id = randomUUID();
        json(res, 200, { msg: 1, url: `${this.origin}/upload/${id}`, method: 'PUT', headers: { 'x-fake': '1' } });
    }

    // ---- socket.io /edge -------------------------------------------------------------------------------------------

    private authenticate(socket: ServerSocket, next: (err?: Error) => void): void {
        const refuse = (code: string): void => {
            this.log.refusedConnects.push(code);
            const err = new Error(code) as Error & { data?: unknown };
            err.data = { code, message: code };
            next(err);
        };
        const a = (socket.handshake.auth ?? {}) as Record<string, unknown>;
        const edgeId = String(a.edgeId ?? '');
        const nonce = String(a.nonce ?? '');
        const bootId = String(a.bootId ?? '');
        if (!this.nonces.delete(nonce)) return refuse('UNAUTHORIZED');
        const node = this.nodes.get(edgeId);
        if (!node || !node.pubKey) return refuse('NOT_ENROLLED');
        if (!verifyDeviceSignature(node.pubKey, `${nonce}${edgeId}${bootId}`, String(a.sig ?? ''))) return refuse('UNAUTHORIZED');
        if (node.status === 'X') return refuse('REVOKED');
        if (node.status === 'C') return refuse('KEY_UNCONFIRMED');
        const existing = this.box;
        if (existing && existing.socket.connected && existing.bootId !== bootId && Date.now() - existing.lastSeenMs < (this.opts.dupIdentityWindowMs ?? 20_000)) {
            return refuse('DUP_IDENTITY');
        }
        socket.data = { edgeId, bootId };
        next();
    }

    private onConnection(socket: ServerSocket): void {
        const { edgeId, bootId } = socket.data as { edgeId: string; bootId: string };
        const node = this.nodes.get(edgeId)!;
        const prev = this.box;
        const box = { socket, edgeId, bootId, lastSeenMs: Date.now(), status: node.status, helloed: new Set<string>() };
        this.box = box;
        this.log.connects.push({ edgeId, bootId });
        if (prev && prev.socket.id !== socket.id) {
            prev.socket.emit('c.refused', { code: 'SUPERSEDED', message: 'a newer connection of this box took over' });
            prev.socket.disconnect(true);
        }
        socket.onAny(() => {
            box.lastSeenMs = Date.now();
        });
        const handle = (event: string, fn: (body: any) => unknown): void => {
            socket.on(event, async (body: unknown, ack?: (reply: unknown) => void) => {
                let reply: unknown;
                try {
                    reply = await fn(body);
                } catch (err) {
                    reply = { ok: false, code: 'ERROR', message: (err as Error).message };
                }
                if (reply === DROP) return;
                if (typeof ack === 'function') ack(reply);
            });
        };
        handle(EdgeEvent.hello, body => this.onHello(box, body as EdgeHello));
        handle(EdgeEvent.round, body => this.onRound(box, body as EdgeRound));
        handle(EdgeEvent.raw, body => this.onRaw(body as EdgeRaw));
        handle(EdgeEvent.rawpull, body => this.onRawPull(body as { nSesid: string; fromSeq: number; toSeq: number }));
        handle(EdgeEvent.seal, body => this.onSeal(box, body as EdgeSeal));
        handle(EdgeEvent.ready, body => {
            const s = this.sessions.get(String((body as { nSesid?: string })?.nSesid));
            if (!s?.bound) return { ok: false };
            s.readyCount += 1;
            this.log.readies.push(s.input.nSesid);
            return { ok: true };
        });
        handle(EdgeEvent.capture, body => {
            this.log.captures.push(body);
            const b = (body ?? {}) as { nSesid?: string; user?: string; peer?: string; fromMs?: number };
            const s = this.sessions.get(String(b.nSesid));
            if (!s?.bound) return { ok: false };
            // As realtime-server (edge-sync.service capture): one orphan per (box, session, user, peer, start), so a repeat
            // report names the same row (et_rtedge_orphan_insert extends it).
            const h = createHash('sha256').update(`${edgeId}|${b.nSesid}|${b.user ?? ''}|${b.peer ?? ''}|${b.fromMs}`).digest('hex');
            return { ok: true, nOrphanid: `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}` };
        });
        handle(EdgeEvent.status, body => {
            this.log.statuses.push(body as EdgeStatus);
            return { ok: true };
        });
    }

    private onHello(box: NonNullable<FakeCloud['box']>, hello: EdgeHello): unknown {
        this.log.hellos.push(hello);
        if (this.faults.refuseHello) return { ok: false, code: this.faults.refuseHello, message: 'refused by the fake cloud' };
        const node = this.nodes.get(box.edgeId);
        if (node?.status === 'Q') return { ok: false, code: 'QUARANTINED', message: 'This box is quarantined: it may report status only' };
        const replies: EdgeHelloReplySession[] = [];
        for (const s of hello.sessions ?? []) {
            const cs = this.sessions.get(s.nSesid);
            if (!cs || !cs.bound) {
                box.helloed.delete(s.nSesid);
                replies.push(helloVerdict(s, { meta: null, bound: false, rawAcked: { seq: 0, hash: '' } }));
                continue;
            }
            this.recheckPending(cs);
            const sealed = cs.syncState === 'K' || cs.syncState === 'W' || cs.syncState === 'F';
            const reply = helloVerdict(s, { meta: cs.meta, bound: true, syncState: cs.syncState, rawAcked: this.rawHead(s.nSesid), rawHashAt: seq => this.rawHashAt(s.nSesid, seq) });
            if (reply.verdict === 'frozen' && !cs.meta.frozen && !sealed) cs.meta = { ...cs.meta, frozen: true };
            if (reply.verdict === 'continue' || reply.verdict === 'end') box.helloed.add(s.nSesid);
            else box.helloed.delete(s.nSesid);
            replies.push(reply);
        }
        this.log.helloReplies.push(replies);
        const reported = new Set((hello.sessions ?? []).map(s => s.nSesid));
        const pendingEnds = [...this.sessions.values()].filter(s => s.bound && s.syncState === 'S' && !reported.has(s.input.nSesid));
        if (pendingEnds.length) setImmediate(() => pendingEnds.forEach(s => void this.push(EdgeEvent.assign, { op: 'end', nSesid: s.input.nSesid })));
        const unsealed = [...this.sessions.values()].filter(s => s.bound && !['K', 'W', 'F'].includes(s.syncState));
        return {
            serverNowMs: Date.now(),
            proto: hello.proto,
            edgeTokenKeys: this.edgeTokenKeys,
            limits: { edgeBps: this.opts.edgeBps ?? 1_000_000, rawMinBps: 32_000, maxPart: this.opts.maxPart ?? MAX_PART_BYTES },
            sessions: replies,
            assignments: unsealed.filter(s => s.syncState === 'L').map(s => this.assigned(s)),
            revocations: { users: [...this.revokedUsers], jtis: [...this.revokedJtis], since: Date.now() },
            assignmentSnapshot: this.snapshot(box.edgeId, unsealed),
        };
    }

    private assigned(s: FakeCloudSession): AssignedSession {
        const i = s.input;
        return {
            nSesid: i.nSesid,
            nCaseid: i.nCaseid ?? 'case-1',
            cName: i.cName ?? `Session ${i.nSesid}`,
            dStartDt: i.dStartDt ?? '2026-10-01 10:00:00',
            tz: i.tz ?? 'Europe/London',
            nLines: i.nLines ?? 25,
            epoch: s.meta.epoch,
            rebaseSeq: s.meta.rebaseSeq,
            parserVer: i.parserVer,
            fmt: s.meta.fmt,
            route: i.route as AssignedSession['route'],
            team: (i.team ?? []).map(m => ({ nUserid: m.nUserid, isCaseAdmin: m.isCaseAdmin })),
            hearingOperator: null,
            case: { cCaseno: 'HC-2026-001', cName: 'Okafor v Shah' },
        };
    }

    /** realtime-server's `EdgeAssignmentSnapshotWire`. */
    private snapshot(nEdgeid: string, sessions: FakeCloudSession[]): unknown {
        const cases = new Map<string, unknown>();
        const roster: unknown[] = [];
        for (const s of sessions) {
            const nCaseid = s.input.nCaseid ?? 'case-1';
            cases.set(nCaseid, { nCaseid, cCaseno: 'HC-2026-001', cCasename: 'Okafor v Shah', isArchived: false, assignedAtMs: null });
            for (const m of s.input.team ?? []) roster.push({ nCaseid, nSesid: null, nUserid: m.nUserid, name: m.name, email: null, role: null, isCaseAdmin: m.isCaseAdmin, active: true, source: 'team' });
        }
        return {
            nEdgeid,
            serverNowMs: Date.now(),
            cases: [...cases.values()],
            sessions: sessions.map(s => ({
                ...this.assigned(s),
                protocol: null,
                syncState: s.syncState,
                hearingOperator: null,
                nPartNo: 1,
                nPrevPartSesid: null,
                next: null,
                cloudOp: s.syncState === 'L' ? 'upsert' : 'end',
                deleted: false,
            })),
            roster,
            superAdmins: [],
            operatorCode: null,
        };
    }

    private onRound(box: NonNullable<FakeCloud['box']>, part: EdgeRound): unknown {
        this.log.rounds.push(part);
        const reply = this.roundReply(box, part);
        if (reply === DROP) return DROP;
        this.log.roundReplies.push(reply as RoundReply);
        return reply;
    }

    private roundReply(box: NonNullable<FakeCloud['box']>, part: EdgeRound): RoundReply | typeof DROP {
        const s = this.sessions.get(part?.nSesid);
        if (!s || !s.bound || ['K', 'W', 'F'].includes(s.syncState)) return { ok: false, code: 'NOT_BOUND' };
        if (this.nodes.get(box.edgeId)?.status === 'Q') return { ok: false, code: 'NOT_BOUND' };
        if (!box.helloed.has(part.nSesid)) return { ok: false, code: 'LINEAGE', epoch: s.meta.epoch, rebaseSeq: s.meta.rebaseSeq };
        const staged = this.assembler.add(part, Date.now());
        if (staged.status === 'partial') return staged.reply;
        if (staged.status === 'invalid') return staged.reply;
        if (staged.status === 'stale') return { ok: false, code: 'STALE', appliedRev: s.meta.appliedRev, root: s.meta.root };
        if (this.faults.roundReplies.length) return this.faults.roundReplies.shift() as RoundReply;
        if (this.faults.busyRounds > 0) {
            this.faults.busyRounds -= 1;
            return { ok: false, code: 'BUSY', retryMs: 60 };
        }
        if (this.faults.forkNextRound) {
            this.faults.forkNextRound = false;
            s.meta = { ...s.meta, frozen: true };
            return { ok: false, code: 'FORK' };
        }
        this.recheckPending(s);
        const decision = validateRound(staged.round, s.meta, { binding: { bound: true, epoch: s.meta.epoch }, rawHashAt: seq => this.rawHashAt(s.input.nSesid, seq) });
        if (decision.action === 'refuse') {
            if (decision.freeze) s.meta = { ...s.meta, frozen: true };
            return decision.reply;
        }
        if (decision.action === 'hold') return { ok: false, code: 'HELD_SHRINK', heldId: randomUUID() };
        const plan = decision.plan;
        for (const pg of plan.pages) s.pages.set(pg.p, pg.lines);
        for (const p of [...s.pages.keys()]) if (p > plan.deletePagesAbove) s.pages.delete(p);
        s.meta = plan.meta;
        if (plan.pendingRawCheck) s.pendingRawChecks.push(plan.pendingRawCheck);
        if (this.faults.dropRoundAcks > 0) {
            this.faults.dropRoundAcks -= 1;
            return DROP;
        }
        return plan.reply;
    }

    private onRaw(batch: EdgeRaw): RawReply {
        const s = this.sessions.get(batch?.nSesid);
        const head = s ? this.rawHead(batch.nSesid) : { seq: 0, hash: '' };
        if (!s || !s.bound || ['K', 'W', 'F'].includes(s.syncState)) return { expectSeq: head.seq + 1, reason: 'epoch' };
        this.log.raws.push({ nSesid: batch.nSesid, fromSeq: batch.fromSeq, toSeq: batch.toSeq });
        if (this.faults.rawReplies.length) return this.faults.rawReplies.shift() as RawReply;
        if (this.faults.rawLag) return { expectSeq: head.seq + 1, reason: 'rate', retryAfterMs: 100 };
        const decision = planRawAppend(
            { epoch: batch.epoch, fromSeq: batch.fromSeq, toSeq: batch.toSeq, prevHash: batch.prevHash },
            { epoch: s.meta.epoch, ackedSeq: head.seq, ackedHash: head.hash, hashAt: seq => this.rawHashAt(batch.nSesid, seq) },
        );
        if (decision.action === 'nack') return decision.nack;
        const recs = Buffer.from(batch.recs as Uint8Array);
        const check = verifyRecordBatch(recs, batch.fromSeq, Buffer.from(batch.prevHash, 'hex'));
        if (check.ok === false) return { expectSeq: head.seq + 1, reason: check.reason === 'gap' ? 'gap' : 'crc' };
        if (check.toSeq !== batch.toSeq) return { expectSeq: head.seq + 1, reason: 'crc' };
        for (const rec of check.records) {
            const hash = rec.hash.toString('hex');
            if (rec.seq <= head.seq) {
                if (this.rawHashAt(batch.nSesid, rec.seq) !== hash) return { expectSeq: head.seq + 1, reason: 'chain' };
                continue;
            }
            s.raw.push({ seq: rec.seq, type: rec.type, hash, encoded: Buffer.from(recs.subarray(rec.offset!, rec.offset! + rec.size)), payload: rec.payload });
        }
        this.recheckPending(s);
        const after = this.rawHead(batch.nSesid);
        return { ackedSeq: after.seq, ackedHash: after.hash };
    }

    private onRawPull(req: { nSesid: string; fromSeq: number; toSeq: number }): unknown {
        const s = this.sessions.get(req?.nSesid);
        if (!s || !s.bound) return { ok: false, code: 'NOT_BOUND' };
        this.log.rawPulls.push({ nSesid: req.nSesid, fromSeq: req.fromSeq, toSeq: req.toSeq });
        const from = Number(req.fromSeq);
        const head = this.rawHead(req.nSesid).seq;
        if (!Number.isSafeInteger(from) || from < 1 || from > head) return { ok: false, code: 'NOT_FOUND' };
        const to = Math.min(head, Number.isSafeInteger(Number(req.toSeq)) ? Number(req.toSeq) : head);
        const parts: Buffer[] = [];
        let bytes = 0;
        let last = from - 1;
        for (let seq = from; seq <= to; seq++) {
            const rec = s.raw[seq - 1];
            if (parts.length && bytes + rec.encoded.length > MAX_PART_BYTES) break;
            parts.push(rec.encoded);
            bytes += rec.encoded.length;
            last = seq;
        }
        return { recs: Buffer.concat(parts), toSeq: last, hash: s.raw[last - 1].hash };
    }

    private onSeal(box: NonNullable<FakeCloud['box']>, seal: EdgeSeal): SealReply {
        const s = this.sessions.get(seal?.nSesid);
        this.log.seals.push(seal);
        if (!s || !s.bound) return { complete: false, needPages: [] };
        if (['K', 'W', 'F'].includes(s.syncState)) return { complete: true, state: s.syncState === 'K' ? 'K' : 'W' };
        if (this.faults.sealReplies.length) return this.faults.sealReplies.shift()!;
        const node = this.nodes.get(box.edgeId);
        const signatureValid = !!node?.pubKey && verifyDeviceSignature(node.pubKey, sealSigningPayload(seal), seal.sig);
        const finalRec = s.raw[seal.rawFinalSeq - 1];
        const rawIncidents: EdgeIncident[] = s.raw.filter(r => r.type === RecordType.INCIDENT).map(r => decodeBody({ type: RecordType.INCIDENT, payload: r.payload }) as unknown as EdgeIncident);
        const check = checkSeal(seal, {
            meta: s.meta,
            signatureValid,
            storedPage: p => s.pages.get(p),
            storedPageNumbers: [...s.pages.keys()],
            rawAcked: this.rawHead(seal.nSesid),
            finalRecordIsSessionEnd: !!finalRec && finalRec.type === RecordType.SESSION_END,
            rawIncidents,
            pendingOrphans: 0,
        });
        s.sealReply = check.reply;
        if (check.reply.complete === true) {
            s.syncState = check.reply.state;
            s.seal = seal;
        }
        return check.reply;
    }

    /** MR-1: a round applied ahead of the raw lane is verified when the raw lane reaches its seq; a mismatch freezes. */
    private recheckPending(s: FakeCloudSession): void {
        const left: RawPosition[] = [];
        for (const pair of s.pendingRawChecks) {
            const r = checkPendingRawPair(pair, seq => this.rawHashAt(s.input.nSesid, seq));
            if (r === 'fork') s.meta = { ...s.meta, frozen: true };
            else if (r === 'pending') left.push(pair);
        }
        s.pendingRawChecks = left;
    }
}

const DROP = Symbol('drop-ack');

/** Issue a leaf for the CSR's public key (CN + SAN = `host`), valid now − 1 h … now + 90 days, signed by `caKey`. */
export function signCsr(csrPem: string, host: string, caKey: KeyObject, validity: { notBeforeMs?: number; notAfterMs?: number } = {}): string {
    const csr = readDer(fromPem(csrPem, 'CERTIFICATE REQUEST'));
    const info = derChildren(csr)[0];
    const spki = derChildren(info)[2].raw;
    const now = Date.now();
    const time = (ms: number): Buffer => {
        const iso = new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
        return der(0x17, Buffer.from(`${iso.slice(2)}Z`));
    };
    const sigAlg = derSeq(derOid(OID.ecdsaWithSha256));
    const serial = randomBytes(8);
    serial[0] = (serial[0] & 0x7f) | 0x01;
    const tbs = derSeq(
        der(0xa0, der(0x02, Buffer.from([2]))),
        der(0x02, serial),
        sigAlg,
        derNameCn('Fake Edge CA'),
        derSeq(time(validity.notBeforeMs ?? now - 3_600_000), time(validity.notAfterMs ?? now + 90 * 86_400_000)),
        derNameCn(host),
        spki,
        der(0xa3, derSeq(derSeq(derOid(OID.subjectAltName), der(0x04, derSanDns([host]))))),
    );
    const signature = cryptoSign('sha256', tbs, caKey);
    return toPem('CERTIFICATE', derSeq(tbs, sigAlg, der(0x03, Buffer.concat([Buffer.from([0]), signature]))));
}
