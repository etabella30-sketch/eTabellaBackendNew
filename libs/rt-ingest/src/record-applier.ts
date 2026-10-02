/**
 * Applies journal records to a session's parser state, in seq order.
 *
 * The SAME code runs live (each record once its group fdatasync returned) and
 * in replay (recovery.ts), which is what makes replay deterministic: the
 * parser only ever sees what the journal holds, in journal order, with the
 * journaled tRecv (DET-1, DET-4, DET-6, DET-9, DET-11).
 *
 *   SESSION_HEADER  session meta (nLines, tz, parserVer pin, fmt)
 *   EPOCH           lineage owner/epoch
 *   CTX_SET         protocol (creates the lane, once), caseTabs, abortWindow
 *   CONN_OPEN       DET-6 framing reset + S-D11 on an open window
 *   CONN_CLOSE      the active connection ends
 *   DATA            fed to the lane
 *   INCIDENT        listed (no parser effect)
 *   SESSION_END     the session is complete
 *   REBASE_*        Phase 4 (D1): never written in v1; recovery refuses to
 *                   replay across them (see recovery.ts)
 *
 * DET-4: the protocol is a journal record. The worker decides it live (the
 * dial setting, or the stream's framing, protocol-decision.ts) and journals
 * CTX_SET{protocol} before the DATA of the chunk that decided it; the DATA of
 * the chunks before it are journaled (WAL) while it is still undecided. Until
 * a CTX_SET{protocol} arrives the applier HOLDS every lane input in journal
 * order (DATA with its own tRecv, the CONN_OPEN reset, caseTabs, abortWindow)
 * and replays them, in that order, into the lane the CTX_SET opens. Replay
 * reads the record and never re-detects, so a journal replays to the same
 * routing on any build. Only a journal that reaches SESSION_END with held
 * bytes and no CTX_SET{protocol} (never written by SessionWorker, which
 * journals its fallback first) is decided here, from the held bytes, by the
 * same rule.
 *
 * With `parse: false` a record updates only the session meta (used for the
 * records a checkpoint already covers).
 */
import {
    ConnOpenBody,
    CtxSetBody,
    decodeBody,
    EpochBody,
    IncidentBody,
    RecordType,
    SessionEndBody,
    SessionHeaderBody,
} from './raw-journal';
import { feedParseLaneFactory, LaneFactory, LaneHooks, LaneState, ParserLane } from './parser-lane';
import { StreamProtocolDetector } from './protocol-decision';
import { CatProtocol } from './types';

/** A lane input applied while the protocol is undecided, replayed in journal order once a lane opens. */
type HeldInput =
    | { kind: 'data'; seq: number; bytes: Buffer; tRecvMs: number }
    | { kind: 'conn'; seq: number }
    | { kind: 'tabs'; tabs: string[] | null }
    | { kind: 'abort'; seq: number; cause: string };

export interface ApplyRecord {
    type: RecordType;
    flags: number;
    seq: number;
    tRecvMs: number;
    /** chain hash after this record */
    hash: Buffer;
    /** decoded body (DATA: the raw bytes) */
    body: unknown;
}

export interface WindowAbortInfo {
    seq: number;
    /** 'connection' (CONN_OPEN, DET-6) or the CTX_SET abortWindow reason (e.g. 'end-bound', S-D11) */
    cause: string;
    /** the record was applied during replay (nothing may be journaled for it) */
    replay: boolean;
}

export interface ApplierHooks extends LaneHooks {
    onWindowAborted?(info: WindowAbortInfo): void;
    /** a CTX_SET asked for a protocol other than the one already decided */
    onProtocolMismatch?(info: { seq: number; decided: CatProtocol; asked: CatProtocol; replay: boolean }): void;
}

export interface ConnState extends ConnOpenBody {
    seq: number;
    tRecvMs: number;
}

export interface ApplierOptions {
    nSesid: string;
    laneFactory?: LaneFactory;
    hooks?: ApplierHooks;
    /** start in replay mode */
    replay?: boolean;
    /** session meta used until (or instead of) a SESSION_HEADER */
    meta?: { nLines?: number; tz?: string | null; nCaseid?: string | null };
    /** lane state from a checkpoint; the lane is created from it at once */
    restore?: LaneState | null;
}

export function toApplyRecord(rec: { type: RecordType; flags: number; seq: number; tRecvMs: number; hash: Buffer; payload: Buffer }): ApplyRecord {
    return { type: rec.type, flags: rec.flags, seq: rec.seq, tRecvMs: rec.tRecvMs, hash: rec.hash, body: decodeBody(rec) };
}

export class RecordApplier {
    readonly nSesid: string;
    header: SessionHeaderBody | null = null;
    epoch: EpochBody | null = null;
    protocol: CatProtocol | null = null;
    lane: ParserLane | null = null;
    caseTabs: string[] | null = null;
    activeConn: ConnState | null = null;
    lastConnOpen: ConnState | null = null;
    lastConnClose: { connId: string; reason: string; seq: number; tRecvMs: number } | null = null;
    /** tRecv of the last DATA record */
    lastByteAt: number | null = null;
    ended: (SessionEndBody & { seq: number }) | null = null;
    incidents: Array<IncidentBody & { seq: number }> = [];
    /** seq of the last REBASE_END seen (0 = genesis lineage) */
    lastRebaseEndSeq = 0;
    lastSeq = 0;
    lastHash: Buffer | null = null;
    dataRecords = 0;
    dataBytes = 0;
    /** DATA records fed to the lane (parse: true) */
    parsedRecords = 0;
    replay: boolean;

    private readonly laneFactory: LaneFactory;
    private readonly hooks: ApplierHooks;
    private readonly meta: { nLines?: number; tz?: string | null; nCaseid?: string | null };
    /** lane inputs applied while no protocol is decided (DET-4), in journal order */
    private held: HeldInput[] = [];
    private heldDataRecords = 0;
    private heldDataBytes = 0;
    /** caseTabs in force when the first held DATA arrived (the lane starts from them) */
    private heldTabs: string[] | null = null;

    constructor(opts: ApplierOptions) {
        this.nSesid = opts.nSesid;
        this.laneFactory = opts.laneFactory ?? feedParseLaneFactory;
        this.hooks = opts.hooks ?? {};
        this.replay = !!opts.replay;
        this.meta = { ...(opts.meta ?? {}) };
        if (opts.restore) {
            this.protocol = opts.restore.protocol;
            this.caseTabs = opts.restore.caseTabs ?? null;
            this.lane = this.makeLane(opts.restore.protocol, opts.restore);
        }
    }

    /** Leave replay mode: from now on the sink's outputs reach the host. Call once the lane is idle. */
    setLive(): void {
        this.replay = false;
        if (this.lane) this.lane.replay = false;
    }

    /** DATA is being held: no protocol is decided yet (DET-4), so nothing has reached a parser. */
    get holding(): boolean {
        return this.heldDataRecords > 0;
    }

    /** DATA records / bytes held while undecided. */
    get heldCounts(): { records: number; bytes: number } {
        return { records: this.heldDataRecords, bytes: this.heldDataBytes };
    }

    /** The held DATA payloads, in journal order (the worker rebuilds its detector from them after a restart). */
    heldData(): Buffer[] {
        return this.held.filter((h): h is Extract<HeldInput, { kind: 'data' }> => h.kind === 'data').map(h => h.bytes);
    }

    apply(rec: ApplyRecord, opts: { parse?: boolean } = {}): void {
        const parse = opts.parse !== false;
        const replay = this.replay;
        switch (rec.type) {
            case RecordType.SESSION_HEADER:
                if (!this.header) this.header = rec.body as SessionHeaderBody;
                break;
            case RecordType.EPOCH:
                this.epoch = rec.body as EpochBody;
                break;
            case RecordType.CTX_SET:
                this.applyCtxSet(rec, rec.body as CtxSetBody, parse, replay);
                break;
            case RecordType.CONN_OPEN: {
                const body = rec.body as ConnOpenBody;
                const conn: ConnState = { ...body, seq: rec.seq, tRecvMs: rec.tRecvMs };
                this.activeConn = conn;
                this.lastConnOpen = conn;
                if (parse) this.laneInput({ kind: 'conn', seq: rec.seq });
                break;
            }
            case RecordType.CONN_CLOSE: {
                const body = rec.body as { connId: string; reason: string };
                if (this.activeConn && this.activeConn.connId === body.connId) this.activeConn = null;
                this.lastConnClose = { connId: body.connId, reason: body.reason, seq: rec.seq, tRecvMs: rec.tRecvMs };
                break;
            }
            case RecordType.DATA: {
                const bytes = rec.body as Buffer;
                this.dataRecords += 1;
                this.dataBytes += bytes.length;
                this.lastByteAt = rec.tRecvMs;
                if (parse) {
                    // decided by a CTX_SET applied without parsing (a checkpoint covered it): open the lane now
                    if (!this.lane && this.protocol) this.openLane();
                    this.laneInput({ kind: 'data', seq: rec.seq, bytes, tRecvMs: rec.tRecvMs });
                }
                break;
            }
            case RecordType.INCIDENT:
                this.incidents.push({ ...(rec.body as IncidentBody), seq: rec.seq });
                break;
            case RecordType.SESSION_END:
                this.ended = { ...(rec.body as SessionEndBody), seq: rec.seq };
                this.activeConn = null;
                if (parse && !this.lane && !this.protocol && this.holding) {
                    // Ended with held bytes and no CTX_SET{protocol}: a journal SessionWorker never writes (it journals
                    // its CaseView fallback before SESSION_END). Decide from the held bytes by the same rule, so the
                    // replay is still a pure function of the journal: the framing, else CaseView.
                    const detector = new StreamProtocolDetector();
                    for (const b of this.heldData()) detector.push(b);
                    this.protocol = detector.detected() ?? 'C';
                    this.openLane();
                }
                break;
            case RecordType.REBASE_END:
                this.lastRebaseEndSeq = rec.seq;
                break;
            case RecordType.REBASE_BEGIN:
            case RecordType.REBASE_PAGE:
                break;
        }
        this.lastSeq = rec.seq;
        this.lastHash = rec.hash;
    }

    private applyCtxSet(rec: ApplyRecord, body: CtxSetBody, parse: boolean, replay: boolean): void {
        if (body.protocol === 'B' || body.protocol === 'C') {
            if (!this.protocol) {
                this.protocol = body.protocol;
            } else if (this.protocol !== body.protocol) {
                this.hooks.onProtocolMismatch?.({ seq: rec.seq, decided: this.protocol, asked: body.protocol, replay });
            }
            // opens the lane and replays everything held while undecided, in journal order
            if (parse && !this.lane && this.protocol) this.openLane();
        }
        if (Object.prototype.hasOwnProperty.call(body, 'caseTabs')) {
            this.caseTabs = Array.isArray(body.caseTabs) ? body.caseTabs.map(String) : null;
            if (parse) this.laneInput({ kind: 'tabs', tabs: this.caseTabs });
        }
        if (body.abortWindow && parse) {
            this.laneInput({ kind: 'abort', seq: rec.seq, cause: String(body.abortWindow === true ? 'requested' : body.abortWindow) });
        }
    }

    /**
     * One lane input: applied to the lane when there is one; otherwise held (DET-4) once DATA is held. Before the
     * first held DATA a reset, a caseTabs change or an abort has nothing to act on: a lane opened later starts with
     * fresh framing, no window, and the caseTabs in force.
     */
    private laneInput(input: HeldInput): void {
        if (this.lane) {
            this.toLane(this.lane, input);
            return;
        }
        if (input.kind === 'data') {
            if (!this.heldDataRecords) this.heldTabs = this.caseTabs;
            this.heldDataRecords += 1;
            this.heldDataBytes += input.bytes.length;
            this.held.push(input);
        } else if (this.heldDataRecords) {
            this.held.push(input);
        }
    }

    private toLane(lane: ParserLane, input: HeldInput): void {
        const replay = this.replay;
        switch (input.kind) {
            case 'data':
                lane.feed(input.bytes, input.tRecvMs);
                this.parsedRecords += 1;
                break;
            case 'conn':
                void lane.connectionOpened().then(aborted => {
                    if (aborted) this.hooks.onWindowAborted?.({ seq: input.seq, cause: 'connection', replay });
                }, () => undefined);
                break;
            case 'tabs':
                void lane.setCaseTabs(input.tabs).catch(() => undefined);
                break;
            case 'abort':
                void lane.abortWindow().then(aborted => {
                    if (aborted) this.hooks.onWindowAborted?.({ seq: input.seq, cause: input.cause, replay });
                }, () => undefined);
                break;
        }
    }

    /** Open the lane for the decided protocol and replay the held inputs into it, in journal order. */
    private openLane(): void {
        const held = this.held;
        const tabs = this.heldDataRecords ? this.heldTabs : this.caseTabs;
        this.held = [];
        this.heldDataRecords = 0;
        this.heldDataBytes = 0;
        this.heldTabs = null;
        const lane = this.makeLane(this.protocol!, null, tabs);
        this.lane = lane;
        for (const input of held) this.toLane(lane, input);
    }

    private makeLane(protocol: CatProtocol, restore: LaneState | null, tabs: string[] | null = this.caseTabs): ParserLane {
        const h = this.header;
        const lane = this.laneFactory({
            nSesid: this.nSesid,
            protocol,
            nLines: h?.nLines ?? this.meta.nLines ?? 25,
            tz: h ? h.tz : this.meta.tz ?? null,
            nCaseid: h ? h.nCaseid : this.meta.nCaseid ?? null,
            hooks: this.hooks,
            replay: this.replay,
            restore,
        });
        if (restore?.caseTabs) this.caseTabs = restore.caseTabs;
        else if (tabs) void lane.setCaseTabs(tabs).catch(() => undefined);
        return lane;
    }
}
