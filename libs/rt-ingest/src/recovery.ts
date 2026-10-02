/**
 * Crash recovery: checkpoint + deterministic replay (spec §6.2 "Recovery").
 *
 *  1. Find the latest REBASE_END (the start of the current lineage, or
 *     genesis). Never replay records before it.
 *  2. If the running FEED_PARSE_VERSION differs from the lineage's parserVer,
 *     do NOT replay. The rev-2 fallback is a REBASE from the last committed
 *     state; REBASE is Phase 4 (D1) and its recovery use is open (O-1), so v1
 *     refuses with ParserVersionMismatchError and the host keeps the session
 *     frozen for an admin (on the box the parser cannot change under an
 *     unsealed session: pilot boxes are re-imaged between hearings, D2).
 *  3. Otherwise load the newest checkpoint at or after the lineage start with
 *     the same parserVer whose rawHash equals the journal's chain hash at its
 *     rawSeq (a checkpoint of another lineage is never trusted), and replay
 *     the later records in replay mode (only the sink's outputs are no-ops,
 *     DET-11), with the clock taken from the journaled tRecv.
 *  4. (Cloud, MR-7) `untilSeq` stops the replay at a stored cut's
 *     rawSeqThrough so the caller can compare roots before applying.
 *  5. The caller runs a final boundary on the returned lane.
 */
import { FEED_PARSE_VERSION } from '@app/feed-parse';

import { Checkpoint, CheckpointStore } from './checkpoint';
import { LaneFactory, LaneState } from './parser-lane';
import { JournalFs, JournalHead, readJournal, RecordType, SessionHeaderBody, TailTruncation } from './raw-journal';
import { ApplierHooks, RecordApplier, toApplyRecord } from './record-applier';

export class ParserVersionMismatchError extends Error {
    readonly code = 'PARSER_VERSION_MISMATCH';
    constructor(
        readonly nSesid: string,
        readonly pinned: string,
        readonly running: string,
    ) {
        super(`rt-ingest: session ${nSesid} is pinned to parser ${pinned}; this build runs ${running}. Replay refused (REBASE is Phase 4, D1).`);
        this.name = 'ParserVersionMismatchError';
    }
}

/** Raised where a REBASE would be needed: Phase 4 (D1). */
export class RebaseNotSupportedError extends Error {
    readonly code = 'REBASE_PHASE4';
    constructor(
        readonly nSesid: string,
        readonly detail: string,
    ) {
        super(`rt-ingest: session ${nSesid}: ${detail}. REBASE is Phase 4 (D1).`);
        this.name = 'RebaseNotSupportedError';
    }
}

export interface RecoverOptions {
    nSesid: string;
    journalRoot: string;
    fs?: JournalFs;
    checkpoints?: CheckpointStore | null;
    /** the running parser version (default FEED_PARSE_VERSION) */
    parserVer?: string;
    laneFactory?: LaneFactory;
    hooks?: ApplierHooks;
    /** session meta when the journal has no SESSION_HEADER */
    meta?: { nLines?: number; tz?: string | null; nCaseid?: string | null; parserVer?: string };
    /** false = ignore checkpoints and replay from the lineage start */
    useCheckpoint?: boolean;
    /** stop after this seq (MR-7 compare point) */
    untilSeq?: number;
    /** leave the applier in replay mode (default: switched live once the lane is idle) */
    stayInReplay?: boolean;
}

export interface RecoveryResult {
    applier: RecordApplier;
    /** journal head (after any torn-tail truncation done earlier by the writer) */
    head: JournalHead;
    header: SessionHeaderBody | null;
    /** parser version the lineage is pinned to */
    parserVer: string;
    /** the checkpoint used, or null for a replay from the lineage start */
    checkpoint: Pick<Checkpoint, 'rawSeq' | 'rawHash' | 'createdAt' | 'rev' | 'root' | 'extra'> | null;
    /** first seq fed to the parser */
    replayFromSeq: number;
    /** last seq applied */
    replayToSeq: number;
    /** DATA records fed to the parser during replay */
    replayedData: number;
    tailTruncated: TailTruncation | null;
}

interface Scan {
    header: SessionHeaderBody | null;
    lastRebaseEnd: number;
    hashes: Map<number, string>;
    head: JournalHead;
    tailTruncated: TailTruncation | null;
    count: number;
}

async function scanJournal(opts: RecoverOptions, wantHashes: Set<number>): Promise<Scan> {
    let header: SessionHeaderBody | null = null;
    let lastRebaseEnd = 0;
    const hashes = new Map<number, string>();
    const res = await readJournal({
        root: opts.journalRoot,
        nSesid: opts.nSesid,
        fs: opts.fs,
        repair: false,
        keepFromSeq: Infinity,
        onRecord: rec => {
            if (rec.type === RecordType.SESSION_HEADER && !header) header = toApplyRecord(rec).body as SessionHeaderBody;
            if (rec.type === RecordType.REBASE_END) lastRebaseEnd = rec.seq;
            if (wantHashes.has(rec.seq)) hashes.set(rec.seq, rec.hash.toString('hex'));
        },
    });
    return { header, lastRebaseEnd, hashes, head: res.head, tailTruncated: res.tailTruncated, count: res.recordCount };
}

/**
 * Rebuild a session's parser state from its journal (and checkpoints).
 * Throws JournalCorruptError (MR-4), ParserVersionMismatchError or
 * RebaseNotSupportedError; never returns a state it did not replay exactly.
 */
export async function recoverSession(opts: RecoverOptions): Promise<RecoveryResult> {
    const running = opts.parserVer ?? FEED_PARSE_VERSION;
    const useCheckpoint = opts.useCheckpoint !== false && !!opts.checkpoints;
    const candidates = useCheckpoint ? await opts.checkpoints!.list(opts.nSesid) : [];
    const scan = await scanJournal(opts, new Set(candidates.map(c => c.rawSeq)));

    const pinned = scan.header?.parserVer ?? opts.meta?.parserVer ?? running;
    if (scan.count > 0 && pinned !== running) throw new ParserVersionMismatchError(opts.nSesid, pinned, running);

    // Step 1: the lineage starts after the latest REBASE_END; nothing before it is replayed.
    const lineageStart = scan.lastRebaseEnd;
    const until = opts.untilSeq ?? scan.head.seq;
    let checkpoint: Checkpoint | null = null;
    if (useCheckpoint) {
        checkpoint = await opts.checkpoints!.latest(opts.nSesid, {
            parserVer: running,
            maxRawSeq: Math.min(scan.head.seq, until),
            minRawSeq: lineageStart,
            accept: info => scan.hashes.get(info.rawSeq) === info.rawHash,
        });
    }
    if (lineageStart > 0 && !checkpoint) {
        throw new RebaseNotSupportedError(opts.nSesid, `the lineage starts at REBASE_END seq ${lineageStart} and no checkpoint covers it`);
    }

    const header = scan.header;
    const applier = new RecordApplier({
        nSesid: opts.nSesid,
        laneFactory: opts.laneFactory,
        hooks: opts.hooks,
        replay: true,
        meta: {
            nLines: header?.nLines ?? opts.meta?.nLines,
            tz: header ? header.tz : opts.meta?.tz ?? null,
            nCaseid: header ? header.nCaseid : opts.meta?.nCaseid ?? null,
        },
        restore: (checkpoint?.lane as LaneState | null) ?? null,
    });

    const startAfter = checkpoint ? checkpoint.rawSeq : 0;
    let replayedData = 0;
    let lastApplied = 0;
    await readJournal({
        root: opts.journalRoot,
        nSesid: opts.nSesid,
        fs: opts.fs,
        repair: false,
        keepFromSeq: Infinity,
        onRecord: rec => {
            if (rec.seq > until) return;
            const parse = rec.seq > startAfter;
            if (parse && rec.type === RecordType.DATA) replayedData += 1;
            applier.apply(toApplyRecord(rec), { parse });
            lastApplied = rec.seq;
        },
    });

    if (applier.lane) await applier.lane.idle();
    if (!opts.stayInReplay) applier.setLive();

    return {
        applier,
        head: scan.head,
        header,
        parserVer: pinned,
        checkpoint: checkpoint
            ? { rawSeq: checkpoint.rawSeq, rawHash: checkpoint.rawHash, createdAt: checkpoint.createdAt, rev: checkpoint.rev ?? null, root: checkpoint.root ?? null, extra: checkpoint.extra }
            : null,
        replayFromSeq: startAfter + 1,
        replayToSeq: lastApplied,
        replayedData,
        tailTruncated: scan.tailTruncated,
    };
}

/**
 * DET-12 `rebaseContext` (start a parser from pages): failover, re-bind and
 * parser-version REBASE are Phase 4 (D1); the recovery-time use is open
 * (O-1). Interface only in v1.
 */
export interface RebaseRequest {
    nSesid: string;
    reason: string;
    pages: unknown[][];
    anchorIds: number[];
    rev: number;
    root: string;
}

export function rebaseFromPages(req: RebaseRequest): never {
    throw new RebaseNotSupportedError(req?.nSesid ?? '?', `rebase '${req?.reason ?? 'unknown'}' requested`);
}
