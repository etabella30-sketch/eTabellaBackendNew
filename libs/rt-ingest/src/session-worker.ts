/**
 * One session's write-ahead ingest worker (spec §3.2 `session-worker.ts`,
 * §2.1, §4.3, §4.4, §5.1, MR-5). Replaces IngestSessionWorker
 * (eclipse-tcp-ingest.service.ts:194-295).
 *
 * Order, always:
 *   1. WAL: the record is appended to the raw journal (seq, tRecv clamped
 *      non-decreasing, CRC32C, sha256 chain) and committed by the group
 *      fdatasync (≤10 ms window, or at 64 KB).
 *   2. Only then is it applied, in seq order, to the parser lane
 *      (record-applier.ts: the same code replay uses).
 *   3. A boundary sentinel is enqueued into the same lane every `boundaryMs`
 *      when work was fed since the last one; it calls `onBoundary` with the
 *      raw position (rawSeqThrough, rawHashThrough) the parser state reflects.
 *
 * Durability (D25): every byte the box has journaled is never lost; bytes the
 * kernel acknowledged but this worker had not yet journaled at a crash may be
 * lost unless Eclipse resends them.
 *
 * Degraded durability (MR-5): when journal appends fail (disk full, I/O
 * error) records keep their seq and chain position in memory, parsing goes
 * on, an INCIDENT{DEGRADED_DURABILITY} is journaled (it reaches the cloud
 * through the raw lane like the other undurable records) and a CRITICAL alert
 * fires; appends are retried and a closing INCIDENT records the range.
 *
 * The protocol is decided once (DET-4, protocol-decision.ts, the cloud's
 * rule): the dial setting when the connection has one, otherwise the
 * stream's framing (libs/feed-parse detectProtocol over the first 4096
 * bytes, looked at after every chunk), and CaseView (with a P2 alert) once
 * 4096 bytes are in and it is still unclear, or when the session ends first.
 * Every byte is journaled as it arrives (WAL, D25); the decision is journaled
 * as CTX_SET{protocol} right before the DATA of the chunk that decided it, and
 * the applier holds the earlier DATA until then and parses them, in order,
 * each with its own tRecv. Replay reads that record; it never re-detects.
 * No checkpoint is taken while bytes are held (a checkpoint carries no held
 * bytes). Every connection is bracketed by CONN_OPEN/CONN_CLOSE; only the
 * active connection may feed (single-active-connection rule, enforced again
 * here).
 *
 * Removed versus IngestSessionWorker: page-JSON persistence and rehydrate
 * (:251-294) and the eclipse_live_<id>.bin capture (:239-243). Recovery is
 * checkpoint + journal replay (recovery.ts).
 */
import { FEED_PARSE_VERSION, SessionContext } from '@app/feed-parse';

import { CHECKPOINT_EVERY_CHUNKS, CHECKPOINT_EVERY_MS, Checkpoint, CheckpointInfo, CheckpointStore } from './checkpoint';
import { LaneFactory } from './parser-lane';
import { decideStreamProtocol, ProtocolDecision, StreamProtocolDetector } from './protocol-decision';
import {
    AppendResult,
    CtxSetBody,
    IncidentBody,
    JOURNAL_DATA_SPLIT_BYTES,
    JOURNAL_FLAG_CONTINUED,
    JournalCorruptError,
    JournalFailureInfo,
    JournalFs,
    JournalHead,
    JournalLossInfo,
    JournalRestoredInfo,
    nodeJournalFs,
    RawJournalWriter,
    RawJournalWriterOptions,
    readJournal,
    readLostTails,
    RecordBodyMap,
    RecordType,
} from './raw-journal';
import { ApplierHooks, RecordApplier } from './record-applier';
import { ParserVersionMismatchError, recoverSession, RecoveryResult } from './recovery';
import {
    AlertSink,
    AlertTier,
    assertSafeSessionId,
    CatProtocol,
    Clock,
    IncidentKind,
    incidentLevel,
    IngestAlertKind,
    safeAlert,
    systemClock,
    TransmitterMode,
} from './types';

export interface SessionMeta {
    nSesid: string;
    nCaseid?: string | null;
    /** lines per page; edge sessions are 25 */
    nLines?: number;
    /** resolved IANA zone pinned at cloud create (DET-2) */
    tz?: string | null;
    /** parser version the session is pinned to (default: the running FEED_PARSE_VERSION) */
    parserVer?: string;
    fmt?: number | string;
    createdAt?: number;
    epoch?: number;
    owner?: 'edge' | 'cloud';
    label?: string;
}

export interface BoundaryInfo {
    nSesid: string;
    /** the parser context; read it only inside this callback (it runs in the lane) */
    ctx: SessionContext;
    /** last journal record the parser state reflects */
    rawSeqThrough: number;
    /** chain hash (hex) at rawSeqThrough */
    rawHashThrough: string;
    reason: 'tick' | 'recovered' | 'final' | 'manual';
    final: boolean;
}

export interface WorkerConnection {
    connId: string;
    /** ip:port of the far end (listen: Eclipse; dial: the transmitter) */
    remote: string;
    /** Eclipse username (listen mode only; never a password) */
    user?: string;
    mode: TransmitterMode;
    /** dial mode: the configured protocol */
    protocolHint?: CatProtocol;
}

export interface SessionWorkerOptions {
    meta: SessionMeta;
    /** journal root: the journal lives in <journalRoot>/<nSesid>/seg-*.ej */
    journalRoot: string;
    fs?: JournalFs;
    journal?: Pick<RawJournalWriterOptions, 'groupWindowMs' | 'groupMaxBytes' | 'segmentMaxBytes' | 'indexEvery' | 'tornTailMaxBytes' | 'writeTimeoutMs'>;
    checkpoints?: CheckpointStore | null;
    checkpointEveryMs?: number;
    checkpointEveryChunks?: number;
    /** host state captured in the checkpoint's lane task; `rev`/`root` fields are lifted into the checkpoint */
    checkpointExtra?: () => unknown;
    onCheckpoint?: (info: CheckpointInfo) => void;
    laneFactory?: LaneFactory;
    /** parser deliveries (cloud legacy dispatch); not used on the box */
    emitDelivery?: (event: string, payload: any) => void;
    /** the boundary sentinel callback (runs inside the parser lane) */
    onBoundary?: (info: BoundaryInfo) => void | Promise<void>;
    boundaryMs?: number;
    onAlert?: AlertSink;
    /** retry interval while appends fail (MR-5) */
    degradedRetryMs?: number;
    clock?: Clock;
    /** the running parser version (default FEED_PARSE_VERSION) */
    parserVer?: string;
}

export interface EndResult {
    nSesid: string;
    rawFinalSeq: number;
    rawFinalHash: string;
    endedAtEdgeMs: number;
    endedBy: string;
    /** false when the journal was degraded at the end (the tail lives in memory for the raw lane) */
    durable: boolean;
    incidents: Array<IncidentBody & { seq: number }>;
}

export interface WorkerStatus {
    nSesid: string;
    protocol: CatProtocol | null;
    activeConnId: string | null;
    ending: boolean;
    ended: boolean;
    durability: 'ok' | 'degraded';
    degradedFromSeq: number | null;
    head: { seq: number; hash: string };
    durableHead: { seq: number; hash: string };
    bytesIn: number;
    chunks: number;
    lastByteAt: number | null;
    lastLineAt: number | null;
    lines: number;
    incidents: number;
    lastCheckpointSeq: number;
    recovered: boolean;
}

const hex = (b: Buffer | null | undefined): string => (b ? b.toString('hex') : '');

/** Alert data of an UNDURABLE_TAIL_LOST (numbers and the marker's name only: never record content). */
const lossData = (l: JournalLossInfo): Record<string, unknown> => ({
    fromSeq: l.fromSeq,
    toSeq: l.toSeq,
    records: l.records,
    bytes: l.bytes,
    durableSeq: l.durableSeq,
    atMs: l.atMs,
    marker: l.marker,
});

export class SessionWorker {
    readonly nSesid: string;
    readonly meta: SessionMeta;
    readonly parserVer: string;
    /** summary of the recovery that opened this worker (null for a fresh journal) */
    recovery: Pick<RecoveryResult, 'checkpoint' | 'replayFromSeq' | 'replayToSeq' | 'replayedData' | 'tailTruncated'> | null = null;

    private journalWriter!: RawJournalWriter;
    private applierValue!: RecordApplier;
    private readonly opts: SessionWorkerOptions;
    private readonly clock: Clock;
    private readonly alert: AlertSink;
    private readonly hooks: ApplierHooks;

    private release: Promise<void> = Promise.resolve();
    /** The protocol journaled as CTX_SET{protocol} (by this worker, or found by recovery); null while undecided. */
    private decidedProtocol: CatProtocol | null = null;
    /** The undecided stream so far (DET-4): what the framing rule looks at. */
    private readonly detector = new StreamProtocolDetector();
    private activeConn: WorkerConnection | null = null;
    private readonly mismatchAlerted = new Set<string>();
    private endingFlag = false;
    private endedFlag = false;
    private closedFlag = false;
    private endPromise: Promise<EndResult> | null = null;

    private bytesIn = 0;
    private chunkCount = 0;
    private lastByteAtValue: number | null = null;
    private lastLineAtValue: number | null = null;
    private lineCount = 0;

    private fedSinceBoundary = false;
    private boundaryPending = false;
    private boundaryTimer: NodeJS.Timeout | null = null;
    private boundaryErrorAt = 0;

    private checkpointTimer: NodeJS.Timeout | null = null;
    private checkpointing: Promise<CheckpointInfo | null> | null = null;
    private checkpointDue = false;
    private lastCheckpointSeq = 0;
    private lastCheckpointAt: number;
    private chunksSinceCheckpoint = 0;

    private degradedFrom: number | null = null;
    private retryTimer: NodeJS.Timeout | null = null;
    private retrying: Promise<void> | null = null;

    private constructor(opts: SessionWorkerOptions) {
        assertSafeSessionId(opts.meta.nSesid);
        this.opts = opts;
        this.meta = { ...opts.meta };
        this.nSesid = opts.meta.nSesid;
        this.parserVer = opts.parserVer ?? FEED_PARSE_VERSION;
        this.clock = opts.clock ?? systemClock;
        this.alert = safeAlert(opts.onAlert);
        this.lastCheckpointAt = this.clock();
        this.hooks = {
            emitDelivery: opts.emitDelivery,
            onLine: () => {
                this.lastLineAtValue = this.clock();
                this.lineCount += 1;
            },
            onRefreshEnd: () => {
                this.checkpointDue = true;
            },
            onWindowAborted: info => {
                if (info.replay) return;
                this.journalIncident('ABORTED_WINDOW', { fromSeq: info.seq, note: `open R..E window aborted (${info.cause}); replacement lines discarded, existing text kept` });
                this.raise('ABORTED_WINDOW', 'P2', `An open refresh window was aborted (${info.cause}); the existing text was kept`, { data: { seq: info.seq, cause: info.cause } });
            },
            onProtocolMismatch: info => {
                if (info.replay) return;
                this.raise('PROTOCOL_MISMATCH', 'P2', `Session decided protocol ${info.decided}; a CTX_SET asked for ${info.asked} (ignored)`);
            },
        };
    }

    /**
     * Open (or reopen after a restart) a session's worker. A journal with
     * records is verified (torn tail of the last segment truncated, MR-4) and
     * recovered by checkpoint + replay; a new journal gets SESSION_HEADER and
     * EPOCH. Throws JournalCorruptError, ParserVersionMismatchError or
     * RebaseNotSupportedError (after raising a CRITICAL alert).
     *
     * DET-10: a session is pinned to its lineage's parserVer. A NEW session
     * whose meta pins another parser than this build runs is refused before
     * anything is written (it is never armed under the wrong parser); an
     * existing journal is judged by its own SESSION_HEADER in recovery.
     */
    static async open(opts: SessionWorkerOptions): Promise<SessionWorker> {
        const self = new SessionWorker(opts);
        const nSesid = self.nSesid;
        const pinned = opts.meta.parserVer;
        if (pinned && pinned !== self.parserVer) {
            let fresh: boolean;
            try {
                fresh = (await readJournal({ root: opts.journalRoot, nSesid, fs: opts.fs, repair: false, keepFromSeq: Infinity })).recordCount === 0;
            } catch (error) {
                self.raiseOpenError(error);
                throw error;
            }
            if (fresh) {
                const error = new ParserVersionMismatchError(nSesid, pinned, self.parserVer);
                self.raise('WORKER_ERROR', 'P1', `Session ${nSesid} is pinned to parser ${pinned} but this build runs ${self.parserVer}; it is not armed here (DET-10)`, {
                    critical: true,
                    data: { pinned, running: self.parserVer, code: error.code },
                });
                throw error;
            }
        }
        try {
            self.journalWriter = await RawJournalWriter.open({
                root: opts.journalRoot,
                nSesid,
                fs: opts.fs,
                ...(opts.journal ?? {}),
                now: self.clock,
                onFailure: info => self.onJournalFailure(info),
                onRestored: info => self.onJournalRestored(info),
            });
        } catch (error) {
            self.raiseOpenError(error);
            throw error;
        }

        const report = self.journalWriter.openReport;
        try {
            if (report.recordCount > 0) {
                const rec = await recoverSession({
                    nSesid,
                    journalRoot: opts.journalRoot,
                    fs: opts.fs,
                    checkpoints: opts.checkpoints ?? null,
                    parserVer: self.parserVer,
                    laneFactory: opts.laneFactory,
                    hooks: self.hooks,
                    meta: { nLines: opts.meta.nLines, tz: opts.meta.tz ?? null, nCaseid: opts.meta.nCaseid ?? null, parserVer: opts.meta.parserVer },
                });
                self.applierValue = rec.applier;
                self.recovery = {
                    checkpoint: rec.checkpoint,
                    replayFromSeq: rec.replayFromSeq,
                    replayToSeq: rec.replayToSeq,
                    replayedData: rec.replayedData,
                    tailTruncated: report.tailTruncated,
                };
                self.lastCheckpointSeq = rec.checkpoint?.rawSeq ?? 0;
            } else {
                self.applierValue = new RecordApplier({
                    nSesid,
                    laneFactory: opts.laneFactory,
                    hooks: self.hooks,
                    meta: { nLines: opts.meta.nLines, tz: opts.meta.tz ?? null, nCaseid: opts.meta.nCaseid ?? null },
                });
            }
        } catch (error) {
            self.raise('WORKER_ERROR', 'P1', `Session ${nSesid} could not be recovered: ${(error as Error)?.message ?? error}`, { critical: true });
            await self.journalWriter.close().catch(() => undefined);
            throw error;
        }

        const applier = self.applierValue;
        self.decidedProtocol = applier.protocol;
        // Bytes held across a restart (undecided when it stopped): the next chunk is judged over all of them, the
        // same window the stream would have had without the restart.
        if (!applier.protocol) for (const bytes of applier.heldData()) self.detector.push(bytes);
        self.lastByteAtValue = applier.lastByteAt;
        self.chunkCount = applier.dataRecords;
        self.bytesIn = applier.dataBytes;

        if (report.recordCount === 0) {
            self.submit(RecordType.SESSION_HEADER, {
                nSesid,
                nCaseid: opts.meta.nCaseid ?? null,
                nLines: opts.meta.nLines ?? 25,
                tz: opts.meta.tz ?? null,
                // the pin was checked above: this is the parser that will produce every page of the session
                parserVer: self.parserVer,
                fmt: opts.meta.fmt ?? 1,
                createdAt: opts.meta.createdAt ?? self.clock(),
            });
            self.submit(RecordType.EPOCH, { epoch: opts.meta.epoch ?? 1, owner: opts.meta.owner ?? 'edge' });
        }
        if (report.tailTruncated) {
            self.journalIncident('TAIL_TRUNCATED', {
                fromSeq: report.head.seq + 1,
                note: `${report.tailTruncated.bytes} B torn tail of ${report.tailTruncated.segment} truncated at offset ${report.tailTruncated.offset}`,
            });
        }
        if (applier.ended) {
            self.endedFlag = true;
        } else if (applier.activeConn) {
            // The process stopped while a connection was active; that socket is gone.
            self.activeConn = { connId: applier.activeConn.connId, remote: applier.activeConn.remote, user: applier.activeConn.user, mode: applier.activeConn.mode ?? 'listen' };
            self.connectionClosed(applier.activeConn.connId, 'recovered');
        }
        // Review 30: records the previous run could not write at its close (degraded journal) left a marker. Raise it
        // again and journal it as a warning incident (it is listed in the seal); the marker goes once that is durable.
        // Records of the marker's range that are on disk after all (a failed fdatasync can still leave the bytes) are
        // chain-verified by the open: only the range past the journal head that opened is lost.
        const lostTails = await readLostTails({ root: opts.journalRoot, nSesid, fs: opts.fs });
        const doneMarkers: string[] = [];
        for (const { file, info } of lostTails) {
            const lostFrom = Math.max(info.fromSeq, report.head.seq + 1);
            if (info.records > 0 && lostFrom > info.toSeq) {
                doneMarkers.push(file); // the whole tail reached the disk: nothing was lost
                continue;
            }
            const known = info.records > 0;
            const lost: JournalLossInfo = { ...info, fromSeq: known ? lostFrom : report.head.seq + 1, records: known ? info.toSeq - lostFrom + 1 : 0, durableSeq: report.head.seq };
            const what = known ? `${lost.records} journal record(s) (seq ${lost.fromSeq}..${lost.toSeq} of the previous run)` : 'journal records (the lost-tail marker is unreadable)';
            self.raise('UNDURABLE_TAIL_LOST', 'P1', `Session ${nSesid}: ${what} never reached the disk before the box stopped (${info.reason}); the journal continues after seq ${lost.durableSeq}`, {
                critical: true,
                data: lossData(lost),
            });
            const seq = self.journalIncident('DEGRADED_DURABILITY', {
                fromSeq: report.head.seq + 1,
                note: `lost at the previous stop: ${what} were never durable (MR-5); the seqs from ${lost.durableSeq + 1} on are new records`,
            });
            if (seq !== null) doneMarkers.push(file);
        }
        if (!self.endedFlag && !self.decidedProtocol) {
            // Held bytes this build's rule already decides (never the case for a journal this build wrote: it
            // journals the decision before the DATA that made it): journal the decision now.
            const decision = self.detector.decide();
            if (decision) self.decide(decision);
        }
        await self.journalWriter.flush();
        await self.settled();
        if (doneMarkers.length && self.journalWriter.state === 'ok') {
            // The incident is durable now: the marker has done its job (a marker that stays is reported again next time).
            const jfs = opts.fs ?? nodeJournalFs;
            for (const file of doneMarkers) await jfs.remove?.(file).catch(() => undefined);
        }
        if (!self.endedFlag) {
            self.startTimers();
            if (report.recordCount > 0 && applier.lane) await self.runBoundary('recovered', false);
        }
        return self;
    }

    /** The session's protocol once decided (DET-4: the dial setting, or the framing); null while bytes are held undecided. */
    get protocol(): CatProtocol | null {
        return this.decidedProtocol;
    }

    get activeConnId(): string | null {
        return this.activeConn?.connId ?? null;
    }

    get ended(): boolean {
        return this.endedFlag;
    }

    get ending(): boolean {
        return this.endingFlag;
    }

    get durability(): 'ok' | 'degraded' {
        return this.journalWriter.state === 'failed' ? 'degraded' : 'ok';
    }

    /** The journal writer (head, durable head, undurable records for the raw lane). */
    get journal(): RawJournalWriter {
        return this.journalWriter;
    }

    /** Parser-side view of the journal (protocol, connections, incidents, lane). */
    get applier(): RecordApplier {
        return this.applierValue;
    }

    get head(): JournalHead {
        return this.journalWriter.head;
    }

    get lastByteAt(): number | null {
        return this.lastByteAtValue;
    }

    get lastLineAt(): number | null {
        return this.lastLineAtValue;
    }

    /** CONN_OPEN for a connection that becomes the session's active feed. Returns its seq. */
    connectionOpened(conn: WorkerConnection): number {
        this.assertWritable();
        if (this.activeConn && this.activeConn.connId !== conn.connId) this.connectionClosed(this.activeConn.connId, 'superseded');
        this.activeConn = { ...conn };
        const body: RecordBodyMap[RecordType.CONN_OPEN] = { connId: conn.connId, remote: conn.remote, mode: conn.mode };
        // dial and serial mode have no login: CONN_OPEN carries no user (§5.1 rev-3 note)
        if (conn.mode === 'listen' && conn.user) body.user = conn.user;
        return this.submit(RecordType.CONN_OPEN, body);
    }

    /** CONN_CLOSE for the active connection (ignored for any other id). Returns its seq or null. */
    connectionClosed(connId: string, reason: string): number | null {
        if (!this.activeConn || this.activeConn.connId !== connId || this.endedFlag || this.closedFlag) return null;
        this.activeConn = null;
        return this.submit(RecordType.CONN_CLOSE, { connId, reason });
    }

    /**
     * One TCP chunk from the active connection. Journaled first (DATA records
     * of ≤64 KB), parsed once durable. Returns false (and alerts) for any
     * other connection: the lane is fed only by the active connection.
     */
    feed(connId: string, chunk: Buffer, tRecvMs?: number): boolean {
        if (this.endedFlag || this.closedFlag || !chunk?.length) return false;
        if (!this.activeConn || this.activeConn.connId !== connId) {
            this.raise('STRAY_FEED', 'info', `Dropped ${chunk.length} B from connection ${connId}, which is not the active feed`, { connId });
            return false;
        }
        const hint = this.activeConn.protocolHint;
        if (!this.decidedProtocol) {
            // DET-4: the connection's configured protocol, else the framing of everything received so far. The
            // CTX_SET goes in before this chunk's DATA; the DATA of the undecided chunks before it are already
            // journaled, and the applier parses them first, in order.
            this.detector.push(chunk);
            const decision = decideStreamProtocol(hint, this.detector);
            if (decision) this.decide(decision);
        } else if (hint && hint !== this.decidedProtocol && !this.mismatchAlerted.has(connId)) {
            this.mismatchAlerted.add(connId);
            this.raise('PROTOCOL_MISMATCH', 'P2', `Session decided ${this.decidedProtocol === 'B' ? 'Bridge' : 'CaseView'}; connection ${connId} is set to ${hint === 'B' ? 'Bridge' : 'CaseView'}. The session keeps its protocol.`, { connId });
        }
        const t = tRecvMs ?? this.clock();
        const data = Buffer.from(chunk);
        for (let off = 0; off < data.length; off += JOURNAL_DATA_SPLIT_BYTES) {
            const piece = data.subarray(off, Math.min(data.length, off + JOURNAL_DATA_SPLIT_BYTES));
            const more = off + JOURNAL_DATA_SPLIT_BYTES < data.length;
            this.submit(RecordType.DATA, piece, { tRecvMs: t, flags: more ? JOURNAL_FLAG_CONTINUED : 0 });
        }
        this.bytesIn += data.length;
        this.chunkCount += 1;
        this.lastByteAtValue = t;
        return true;
    }

    /** DET-9: an external parse input (e.g. caseTabs) enters only as a CTX_SET record. */
    setContext(body: Omit<CtxSetBody, 'protocol'>): number {
        this.assertWritable();
        return this.submit(RecordType.CTX_SET, { ...body });
    }

    /**
     * S-D11 at the end bound: journal the abort as a parse input (so replay
     * repeats it), and an ABORTED_WINDOW incident when a window was open.
     */
    abortWindow(reason: string): number {
        this.assertWritable();
        return this.submit(RecordType.CTX_SET, { abortWindow: reason });
    }

    /**
     * Is an R..E window open after everything submitted so far? Waits only for
     * the records already submitted (not for a quiet feed), so the end drain
     * can poll it while the reporter is still typing.
     */
    async windowOpen(): Promise<boolean> {
        await this.release;
        return this.applierValue.lane ? this.applierValue.lane.windowOpen() : false;
    }

    /** Journal an incident (listed in the seal). Returns its seq, or null after the end. */
    incident(kind: IncidentKind, opts: { fromSeq?: number; toSeq?: number; lines?: number; note?: string } = {}): number | null {
        return this.journalIncident(kind, opts);
    }

    /** Every record appended so far is applied and the lane is idle. */
    async settled(): Promise<void> {
        let current: Promise<void>;
        do {
            current = this.release;
            await current;
        } while (current !== this.release);
        if (this.applierValue?.lane) await this.applierValue.lane.idle();
        if (current !== this.release) await this.settled();
    }

    /** Run a boundary now (in the lane), e.g. before a seal. */
    boundary(): Promise<void> {
        return this.runBoundary('manual', false);
    }

    /** Take a checkpoint now (in the lane). Resolves null when there is no store or nothing new. */
    checkpointNow(): Promise<CheckpointInfo | null> {
        const store = this.opts.checkpoints;
        if (!store || this.closedFlag) return Promise.resolve(null);
        if (this.checkpointing) return this.checkpointing;
        // DET-4: held (undecided) bytes live only in the applier; a checkpoint past them would lose them on recovery.
        if (this.applierValue.holding) return Promise.resolve(null);
        const seq = this.applierValue.lastSeq;
        const hash = this.applierValue.lastHash;
        if (!seq || !hash || seq === this.lastCheckpointSeq) return Promise.resolve(null);
        const lane = this.applierValue.lane;
        this.checkpointDue = false;
        this.checkpointing = (async () => {
            const snap = lane ? await lane.snapshot(this.opts.checkpointExtra) : { state: null, extra: this.opts.checkpointExtra?.() };
            const extra = snap.extra as { rev?: unknown; root?: unknown } | undefined;
            const cp: Checkpoint = {
                nSesid: this.nSesid,
                rawSeq: seq,
                rawHash: hash.toString('hex'),
                // the parser that produced this lane state (recovery and the open-time pin keep it equal to the header's)
                parserVer: this.parserVer,
                fmt: this.applierValue.header?.fmt ?? this.meta.fmt ?? 1,
                createdAt: this.clock(),
                lineage: { epoch: this.applierValue.epoch?.epoch ?? 1, rebaseSeq: this.applierValue.lastRebaseEndSeq },
                rev: typeof extra?.rev === 'number' ? extra.rev : null,
                root: typeof extra?.root === 'string' ? extra.root : null,
                lane: snap.state,
                extra: snap.extra,
            };
            await store.save(cp);
            this.lastCheckpointSeq = seq;
            this.lastCheckpointAt = this.clock();
            this.chunksSinceCheckpoint = 0;
            const info: CheckpointInfo = { nSesid: cp.nSesid, rawSeq: cp.rawSeq, rawHash: cp.rawHash, parserVer: cp.parserVer, createdAt: cp.createdAt };
            try {
                this.opts.onCheckpoint?.(info);
            } catch {
                /* ignore */
            }
            return info;
        })()
            .catch(error => {
                this.raise('CHECKPOINT_ERROR', 'P2', `Checkpoint of session ${this.nSesid} failed: ${(error as Error)?.message ?? error}`);
                return null;
            })
            .finally(() => {
                this.checkpointing = null;
            });
        return this.checkpointing;
    }

    /**
     * End the session (spec §4.4 steps 3-5; the drain before it is the
     * arbiter's): CONN_CLOSE for an active connection, drain the lane, run the
     * final boundary, append SESSION_END, make it durable, final checkpoint.
     * Idempotent.
     */
    end(opts: { endedBy: string; at?: number }): Promise<EndResult> {
        if (this.endPromise) return this.endPromise;
        if (this.endedFlag) {
            const head = this.journalWriter.head;
            const ended = this.applierValue.ended;
            this.endPromise = Promise.resolve({
                nSesid: this.nSesid,
                rawFinalSeq: head.seq,
                rawFinalHash: hex(head.hash),
                endedAtEdgeMs: ended?.at ?? 0,
                endedBy: ended?.endedBy ?? opts.endedBy,
                durable: this.journalWriter.state === 'ok',
                incidents: [...this.applierValue.incidents],
            });
            return this.endPromise;
        }
        this.endingFlag = true;
        this.endPromise = (async () => {
            if (this.activeConn) this.connectionClosed(this.activeConn.connId, 'session-end');
            // Bytes still held at the end would never reach a parser: CaseView, the default (DET-4), before the final boundary.
            if (!this.decidedProtocol && this.detector.bytes > 0) this.decide({ protocol: 'C', how: 'end', bytes: this.detector.bytes });
            await this.settled();
            this.stopBoundaryTimer();
            await this.runBoundary('final', true);
            const at = opts.at ?? this.clock();
            await this.settled();
            this.submit(RecordType.SESSION_END, { endedBy: opts.endedBy, at });
            this.endedFlag = true;
            await this.settled();
            await this.journalWriter.flush();
            await this.checkpointNow();
            this.stopTimers();
            const head = this.journalWriter.head;
            return {
                nSesid: this.nSesid,
                rawFinalSeq: head.seq,
                rawFinalHash: hex(head.hash),
                endedAtEdgeMs: at,
                endedBy: opts.endedBy,
                durable: this.journalWriter.state === 'ok',
                incidents: [...this.applierValue.incidents],
            };
        })();
        return this.endPromise;
    }

    /**
     * Stop timers, apply everything pending, make it durable and close the journal (no SESSION_END). A degraded
     * journal is never closed silently (review 30): a durability retry in flight finishes first, the writer tries
     * once more, and records that still cannot be written raise UNDURABLE_TAIL_LOST (P1, critical) and leave a
     * lost-tail marker that the next open journals as an incident.
     */
    async close(): Promise<void> {
        if (this.closedFlag) return;
        this.stopTimers();
        if (this.retrying) await this.retrying;
        await this.settled().catch(() => undefined);
        if (this.checkpointing) await this.checkpointing;
        this.closedFlag = true;
        await this.journalWriter.close();
        const lost = this.journalWriter.lostOnClose;
        if (lost) {
            this.raise(
                'UNDURABLE_TAIL_LOST',
                'P1',
                `Session ${this.nSesid}: ${lost.records} journal record(s) (seq ${lost.fromSeq}..${lost.toSeq}, ${lost.bytes} B) were held only in memory and could not be written when the session closed (${lost.reason}); the journal ends at seq ${lost.durableSeq}${lost.marker ? '' : ' and no marker could be written'}`,
                { critical: true, data: lossData(lost) },
            );
        }
    }

    status(): WorkerStatus {
        const head = this.journalWriter.head;
        const durable = this.journalWriter.durableHead;
        return {
            nSesid: this.nSesid,
            protocol: this.decidedProtocol,
            activeConnId: this.activeConn?.connId ?? null,
            ending: this.endingFlag,
            ended: this.endedFlag,
            durability: this.durability,
            degradedFromSeq: this.degradedFrom,
            head: { seq: head.seq, hash: hex(head.hash) },
            durableHead: { seq: durable.seq, hash: hex(durable.hash) },
            bytesIn: this.bytesIn,
            chunks: this.chunkCount,
            lastByteAt: this.lastByteAtValue,
            lastLineAt: this.lastLineAtValue,
            lines: this.lineCount,
            incidents: this.applierValue.incidents.length,
            lastCheckpointSeq: this.lastCheckpointSeq,
            recovered: this.recovery !== null,
        };
    }

    // -------------------------------------------------------------------

    /** Append (WAL) now; apply to the parser once durable, in seq order. */
    private submit<T extends RecordType>(type: T, body: RecordBodyMap[T], opts: { tRecvMs?: number; flags?: number } = {}): number {
        const pending: Promise<AppendResult> = this.journalWriter.append(type, body, { tRecvMs: opts.tRecvMs ?? this.clock(), flags: opts.flags });
        const seq = this.journalWriter.head.seq;
        this.release = this.release
            .then(() => pending)
            .then(res => {
                this.applierValue.apply({ type, flags: res.flags, seq: res.seq, tRecvMs: res.tRecvMs, hash: res.hash, body });
                if (type === RecordType.DATA || type === RecordType.CONN_OPEN || type === RecordType.CTX_SET) this.fedSinceBoundary = true;
                if (type === RecordType.DATA) this.chunksSinceCheckpoint += 1;
            })
            .catch(error => {
                this.raise('WORKER_ERROR', 'P1', `Session ${this.nSesid}: applying record ${seq} failed: ${(error as Error)?.message ?? error}`, { critical: true });
            });
        return seq;
    }

    /** DET-4: journal the session's protocol once. The applier opens the lane on it and parses the held DATA first. */
    private decide(decision: ProtocolDecision): void {
        this.decidedProtocol = decision.protocol;
        this.detector.reset();
        this.submit(RecordType.CTX_SET, { protocol: decision.protocol });
        if (decision.how === 'window') {
            this.raise('PROTOCOL_FALLBACK', 'P2', `Session ${this.nSesid}: the feed format was still unclear after ${decision.bytes} bytes; parsing it as CaseView (the default)`, {
                data: { protocol: decision.protocol, how: decision.how, bytes: decision.bytes },
            });
        } else if (decision.how === 'end') {
            this.raise('PROTOCOL_FALLBACK', 'P2', `Session ${this.nSesid} ended before the feed format was clear (${decision.bytes} bytes); parsing them as CaseView (the default)`, {
                data: { protocol: decision.protocol, how: decision.how, bytes: decision.bytes },
            });
        }
    }

    private journalIncident(kind: IncidentKind, opts: { fromSeq?: number; toSeq?: number; lines?: number; note?: string }): number | null {
        if (this.endedFlag || this.closedFlag) return null;
        const body: IncidentBody = { kind, level: incidentLevel(kind) };
        if (opts.fromSeq !== undefined) body.fromSeq = opts.fromSeq;
        if (opts.toSeq !== undefined) body.toSeq = opts.toSeq;
        if (opts.lines !== undefined) body.lines = opts.lines;
        if (opts.note !== undefined) body.note = opts.note;
        try {
            return this.submit(RecordType.INCIDENT, body);
        } catch {
            return null;
        }
    }

    private runBoundary(reason: BoundaryInfo['reason'], final: boolean): Promise<void> {
        const lane = this.applierValue?.lane;
        const cb = this.opts.onBoundary;
        if (!lane || !cb) return Promise.resolve();
        const seq = this.applierValue.lastSeq;
        const hash = hex(this.applierValue.lastHash);
        this.boundaryPending = true;
        return lane
            .inLane(() => cb({ nSesid: this.nSesid, ctx: lane.ctx, rawSeqThrough: seq, rawHashThrough: hash, reason, final }))
            .then(
                () => undefined,
                error => {
                    const now = this.clock();
                    if (now - this.boundaryErrorAt >= 60_000) {
                        this.boundaryErrorAt = now;
                        this.raise('BOUNDARY_ERROR', 'P2', `Boundary of session ${this.nSesid} failed: ${(error as Error)?.message ?? error}`);
                    }
                },
            )
            .finally(() => {
                this.boundaryPending = false;
            });
    }

    private startTimers(): void {
        const boundaryMs = this.opts.boundaryMs ?? 50;
        if (this.opts.onBoundary && boundaryMs > 0 && !this.boundaryTimer) {
            this.boundaryTimer = setInterval(() => {
                if (!this.fedSinceBoundary || this.boundaryPending || this.closedFlag) return;
                this.fedSinceBoundary = false;
                void this.runBoundary('tick', false);
            }, boundaryMs);
            this.boundaryTimer.unref?.();
        }
        if (this.opts.checkpoints && !this.checkpointTimer) {
            const everyMs = this.opts.checkpointEveryMs ?? CHECKPOINT_EVERY_MS;
            const everyChunks = this.opts.checkpointEveryChunks ?? CHECKPOINT_EVERY_CHUNKS;
            this.checkpointTimer = setInterval(() => {
                if (this.closedFlag || this.checkpointing) return;
                const due = this.checkpointDue || this.chunksSinceCheckpoint >= everyChunks || this.clock() - this.lastCheckpointAt >= everyMs;
                if (due && this.applierValue.lastSeq > this.lastCheckpointSeq) void this.checkpointNow();
            }, Math.max(10, Math.min(1_000, Math.floor(everyMs / 4) || 1_000)));
            this.checkpointTimer.unref?.();
        }
    }

    private stopBoundaryTimer(): void {
        if (this.boundaryTimer) clearInterval(this.boundaryTimer);
        this.boundaryTimer = null;
    }

    private stopTimers(): void {
        this.stopBoundaryTimer();
        if (this.checkpointTimer) clearInterval(this.checkpointTimer);
        if (this.retryTimer) clearInterval(this.retryTimer);
        this.checkpointTimer = null;
        this.retryTimer = null;
    }

    private onJournalFailure(info: JournalFailureInfo): void {
        this.degradedFrom = info.fromSeq;
        const reason = (info.error as Error)?.message ?? String(info.error);
        this.journalIncident('DEGRADED_DURABILITY', { fromSeq: info.fromSeq, note: `journal appends failing: ${reason}` });
        this.raise('DEGRADED_DURABILITY', 'P1', `Journal of session ${this.nSesid} cannot be written (${reason}); parsing continues from memory (MR-5)`, {
            critical: true,
            data: { fromSeq: info.fromSeq },
        });
        if (!this.retryTimer && !this.closedFlag) {
            this.retryTimer = setInterval(() => void this.retryDurability(), this.opts.degradedRetryMs ?? 5_000);
            this.retryTimer.unref?.();
        }
    }

    private retryDurability(): Promise<void> {
        if (this.retrying || this.journalWriter.state !== 'failed') return this.retrying ?? Promise.resolve();
        this.retrying = this.journalWriter
            .retryDurability()
            .then(() => undefined, () => undefined)
            .finally(() => {
                this.retrying = null;
            });
        return this.retrying;
    }

    private onJournalRestored(info: JournalRestoredInfo): void {
        if (this.retryTimer) clearInterval(this.retryTimer);
        this.retryTimer = null;
        const fromSeq = this.degradedFrom ?? info.fromSeq;
        this.degradedFrom = null;
        this.journalIncident('DEGRADED_DURABILITY', { fromSeq, toSeq: info.toSeq, note: 'journal durable again; records rewritten' });
        this.raise('DURABILITY_RESTORED', 'P2', `Journal of session ${this.nSesid} is durable again (seq ${fromSeq}..${info.toSeq} rewritten)`, { data: { fromSeq, toSeq: info.toSeq } });
    }

    private raiseOpenError(error: unknown): void {
        if (error instanceof JournalCorruptError) {
            this.raise('JOURNAL_CORRUPT', 'P1', `Journal of session ${this.nSesid} is corrupt (${error.reason} in ${error.segment} at ${error.offset}); its uplink must halt (MR-4)`, {
                critical: true,
                data: { segment: error.segment, offset: error.offset, expectSeq: error.expectSeq },
            });
        } else {
            this.raise('WORKER_ERROR', 'P1', `Journal of session ${this.nSesid} could not be opened: ${(error as Error)?.message ?? error}`, { critical: true });
        }
    }

    private assertWritable(): void {
        if (this.endedFlag) throw new Error(`rt-ingest: session ${this.nSesid} has ended`);
        if (this.closedFlag) throw new Error(`rt-ingest: session ${this.nSesid} worker is closed`);
    }

    private raise(kind: IngestAlertKind, tier: AlertTier, message: string, extra: { critical?: boolean; connId?: string; data?: Record<string, unknown> } = {}): void {
        this.alert({ kind, tier, nSesid: this.nSesid, message, at: this.clock(), ...extra });
    }
}
