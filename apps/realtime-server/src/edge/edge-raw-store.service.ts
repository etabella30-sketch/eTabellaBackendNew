/**
 * EdgeRawStoreService (spec §3.2 `edge-raw-store.service.ts`, D5, D10; §5.1, §5.4 `e.raw` / `e.rawpull`,
 * §5.5 "Raw lane", §5.7 checks 4–6, §4.5 "Direct handshake for a live 'E' session").
 *
 * The cloud copy of each venue session's raw journal lives at `<EDGE_JOURNAL_DIR>/<nSesid>/seg-NNNNN.ej`
 * (default data/journal, D10), in the exact record format of libs/rt-ingest raw-journal.ts, so
 * `readJournal` / `readRawRange` read it back. The raw lane is the lineage authority (§2.1 step 6):
 *
 * - `append`: header sequencing by edge-sync `planRawAppend` (fromSeq == ackedSeq+1 with prevHash ==
 *   ackedHash; an overlap is trimmed only after it is verified against the cloud's own chain; a gap or chain
 *   break is nacked with the seq the cloud expects); then every record is CRC- and chain-checked by rt-ingest
 *   `verifyRecordBatch` (all-or-nothing); then appended and fdatasync'd; only then acked (an ack never covers
 *   non-durable bytes). A batch is ≤ 256 KB. Per-session appends are serialized.
 * - INCIDENT and SESSION_END records are indexed as they land, for the seal cross-check (§5.7 5–6).
 * - `pull` serves RECOVER pull-back (`e.rawpull`) from the store (≤ 256 KB per reply); past the head it answers an
 *   empty reply, and a corrupt store answers CLOUD_JOURNAL_CORRUPT (never NOT_FOUND, which only a malformed request
 *   gets now).
 * - The chain hash after every seq is held in memory (`hashAt`, synchronous) once a session is loaded; a
 *   session is loaded lazily by reading and verifying its whole journal (torn tail of the last segment
 *   truncated, anything else JOURNAL_CORRUPT: the session's raw lane refuses appends, P1 alert).
 *
 * Held direct streams (orphan kind 'H', D5 folds rev 2's edge-capture.service in here): when the cloud
 * listener verifies a direct Eclipse handshake against the DORMANT route of an 'E' session, it calls
 * `openHeldStream` and writes the post-handshake bytes into the returned handle; they go to a capture file
 * (rt-ingest CaptureStore, cloud caps 200 MB per session / 1 GB total), never to the journal or the parser.
 * Each stream is recorded with et_rtedge_orphan_insert (idempotent nOrphanid, extended as it grows and at
 * close) and raises a P1 alert. Passwords are never recorded (only post-handshake bytes are passed in).
 *
 * Archival (raw journal to DO Spaces at seal, orphan bytes, the `edge/v1/archive-url` presigned PUT) goes
 * through EdgeArchivePort; the default is "not configured" (nothing uploaded, the journal stays on disk).
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';

import { DbService } from '@app/global/db/pg/db.service';
import { EdgeIncident, EdgeRaw, EdgeRawPullReply, MAX_PART_BYTES, planRawAppend, RawReply } from '@app/edge-sync';
import {
    CaptureMeta,
    CaptureStore,
    CaptureWriter,
    chainSeed,
    decodeBody,
    JournalCorruptError,
    JournalFs,
    nodeJournalFs,
    readJournal,
    readRawRange,
    RecordType,
    segmentName,
    StoredRecord,
    verifyRecordBatch,
} from '@app/rt-ingest';

import { EdgeRegistryService } from './edge-registry.service';
import { callSp, EDGE_CONFIG, EDGE_OPTIONS, edgeClock, EdgeModuleOptions, EdgeSpRow, firstRow, normId, peerIp, spOk } from './edge.types';

/** Torn-tail bound for the cloud journal: one appended batch (≤ 256 KB) plus slack. */
export const CLOUD_TORN_TAIL_MAX_BYTES = 2 * MAX_PART_BYTES;
/** Segments roll at 8 MB, like the box's. */
export const CLOUD_SEGMENT_ROLL_BYTES = 8 * 1024 * 1024;

/** Archive destination (DO Spaces in production; Phase-2 infra). */
export const EDGE_ARCHIVE_PORT = 'RT_EDGE_ARCHIVE_PORT';
export interface EdgeArchivePort {
    /** Archive a sealed session's journal to `rt-journals/<nCaseid>/<nSesid>.ej.zst` with a sha256 manifest. */
    archiveJournal(input: { nCaseid: string | null; nSesid: string; dir: string }): Promise<{ key: string; sha256: string } | null>;
    /** Upload a closed held capture; returns the object key. */
    uploadCapture(input: { nSesid: string; file: string; meta: CaptureMeta }): Promise<string | null>;
    /** A presigned PUT for a box upload (`edge/v1/archive-url`). */
    presignPut(input: { nEdgeid: string; nSesid: string; sha256: string; bytes: number }): Promise<{ url: string; key: string } | null>;
}

export class UnconfiguredEdgeArchive implements EdgeArchivePort {
    private readonly logger = new Logger('EdgeArchive');
    private warned = false;
    private warn(what: string) {
        if (this.warned) return;
        this.warned = true;
        this.logger.warn(`${what}: no archive (DO Spaces) is configured for the edge module; raw journals stay on the cloud disk`);
    }
    async archiveJournal(input: { nSesid: string }) {
        this.warn(`archive of ${input.nSesid}`);
        return null;
    }
    async uploadCapture(input: { nSesid: string }) {
        this.warn(`capture upload for ${input.nSesid}`);
        return null;
    }
    async presignPut() {
        this.warn('presigned upload');
        return null;
    }
}

interface RawSession {
    nSesid: string;
    /** hashes[seq] = hex chain hash after seq (hashes[0] = h0) */
    hashes: string[];
    segIndex: number;
    segSize: number;
    incidents: EdgeIncident[];
    sessionEnds: Set<number>;
    /** a CONN_OPEN or DATA record exists (the box received feed bytes; O-8) */
    feedRecords: number;
    corrupt: string | null;
    chain: Promise<unknown>;
}

/**
 * An `e.rawpull` refusal (the `{ok:false, code}` shape of the other e.* refusals; the protocol reply type itself is
 * unchanged). NOT_FOUND: a malformed request; CLOUD_JOURNAL_CORRUPT: the cloud store cannot serve the range.
 */
export interface EdgeRawPullRefusal {
    ok: false;
    code: 'NOT_FOUND' | 'CLOUD_JOURNAL_CORRUPT';
}

/** The handle the cloud listener writes a held direct stream into. */
export interface EdgeHeldStream {
    readonly nOrphanid: string;
    readonly nSesid: string;
    /** false when not recorded (over the cap or closed); the connection stays held either way */
    write(chunk: Buffer, tRecvMs?: number): boolean;
    close(reason?: string): Promise<CaptureMeta | null>;
}

@Injectable()
export class EdgeRawStoreService {
    private readonly logger = new Logger('EdgeRawStore');
    private readonly sessions = new Map<string, RawSession>();
    private readonly loading = new Map<string, Promise<RawSession>>();
    private readonly clock: () => number;
    private readonly jfs: JournalFs;
    private readonly rollBytes: number;
    private captures: CaptureStore | null = null;
    private capturesReady: Promise<void> | null = null;
    private advanceListeners: Array<(nSesid: string, head: { seq: number; hash: string }) => void> = [];

    constructor(
        private readonly db: DbService,
        private readonly config: ConfigService,
        private readonly registry: EdgeRegistryService,
        @Optional() @Inject(EDGE_ARCHIVE_PORT) private readonly archivePort?: EdgeArchivePort,
        @Optional() @Inject(EDGE_OPTIONS) opts?: EdgeModuleOptions & { journalFs?: JournalFs; rawSegmentRollBytes?: number },
    ) {
        this.clock = edgeClock(opts);
        this.jfs = opts?.journalFs ?? nodeJournalFs;
        this.rollBytes = opts?.rawSegmentRollBytes ?? CLOUD_SEGMENT_ROLL_BYTES;
    }

    get archive(): EdgeArchivePort {
        return this.archivePort ?? new UnconfiguredEdgeArchive();
    }

    journalRoot(): string {
        return path.resolve(this.config.get<string>(EDGE_CONFIG.journalDir) || path.join('data', 'journal'));
    }

    captureRoot(): string {
        return path.resolve(this.config.get<string>(EDGE_CONFIG.captureDir) || path.join('data', 'edge-captures'));
    }

    /** Subscribe to raw-lane advances (the sync service re-checks queued (seq, hash) pairs, MR-1). */
    onAdvance(listener: (nSesid: string, head: { seq: number; hash: string }) => void): void {
        this.advanceListeners.push(listener);
    }

    // -----------------------------------------------------------------------------------------------------------
    // Loading and reads
    // -----------------------------------------------------------------------------------------------------------

    /** Load (once) and verify a session's cloud journal. Never throws: a corrupt journal is flagged. */
    async ensureLoaded(nSesid: string): Promise<void> {
        await this.load(nSesid);
    }

    private load(nSesid: string): Promise<RawSession> {
        const id = normId(nSesid);
        const have = this.sessions.get(id);
        if (have) return Promise.resolve(have);
        let pending = this.loading.get(id);
        if (!pending) {
            pending = this.readFromDisk(id).finally(() => this.loading.delete(id));
            this.loading.set(id, pending);
        }
        return pending;
    }

    private async readFromDisk(nSesid: string): Promise<RawSession> {
        const st: RawSession = {
            nSesid,
            hashes: [chainSeed(nSesid).toString('hex')],
            segIndex: 1,
            segSize: 0,
            incidents: [],
            sessionEnds: new Set(),
            feedRecords: 0,
            corrupt: null,
            chain: Promise.resolve(),
        };
        try {
            const report = await readJournal({
                root: this.journalRoot(),
                nSesid,
                fs: this.jfs,
                repair: true,
                keepFromSeq: Number.POSITIVE_INFINITY,
                tornTailMaxBytes: CLOUD_TORN_TAIL_MAX_BYTES,
                onRecord: rec => this.index(st, rec),
            });
            const last = report.segments[report.segments.length - 1];
            if (last) {
                st.segIndex = Number(/seg-(\d+)\.ej$/.exec(last.name)?.[1] ?? 1);
                st.segSize = last.size;
            }
            if (report.tailTruncated) {
                this.logger.warn(`cloud journal of ${nSesid}: torn tail of ${report.tailTruncated.bytes} B truncated in ${report.tailTruncated.segment}`);
            }
        } catch (error) {
            const why = error instanceof JournalCorruptError ? error.message : `journal unreadable: ${(error as Error)?.message ?? error}`;
            st.corrupt = why;
            this.registry.alert({ kind: 'CLOUD_JOURNAL_CORRUPT', tier: 'P1', critical: true, nSesid, message: `The cloud raw journal of ${nSesid} failed verification; its raw lane is halted: ${why}` });
        }
        this.sessions.set(nSesid, st);
        return st;
    }

    private index(st: RawSession, rec: StoredRecord): void {
        st.hashes[rec.seq] = rec.hash.toString('hex');
        if (rec.type === RecordType.INCIDENT) {
            try {
                // Kept exactly as journaled: the box builds its signed list from the same records (§5.7 check 6).
                st.incidents.push(decodeBody(rec as any) as unknown as EdgeIncident);
            } catch {
                st.incidents.push({ kind: 'JOURNAL_CORRUPT', level: 'warning', note: 'undecodable INCIDENT record' } as EdgeIncident);
            }
        } else if (rec.type === RecordType.SESSION_END) {
            st.sessionEnds.add(rec.seq);
        } else if (rec.type === RecordType.DATA || rec.type === RecordType.CONN_OPEN) {
            st.feedRecords += 1;
        }
    }

    /** The durable head (seq 0 / h0 when nothing is acked). Call after ensureLoaded. */
    head(nSesid: string): { seq: number; hash: string } {
        const st = this.sessions.get(normId(nSesid));
        if (!st) return { seq: 0, hash: chainSeed(normId(nSesid) ?? String(nSesid)).toString('hex') };
        return { seq: st.hashes.length - 1, hash: st.hashes[st.hashes.length - 1] };
    }

    /** Chain hash after `seq` (hex), or undefined when the store has not reached it. Synchronous. */
    hashAt(nSesid: string, seq: number): string | undefined {
        const st = this.sessions.get(normId(nSesid));
        if (!st || !Number.isSafeInteger(seq) || seq < 0) return undefined;
        return st.hashes[seq];
    }

    /** INCIDENT records of the lineage, in seq order (§5.7 check 6). */
    incidents(nSesid: string): EdgeIncident[] {
        return [...(this.sessions.get(normId(nSesid))?.incidents ?? [])];
    }

    /** The record at `seq` is SESSION_END (§5.7 check 5). */
    isSessionEndAt(nSesid: string, seq: number): boolean {
        return !!this.sessions.get(normId(nSesid))?.sessionEnds.has(seq);
    }

    /** The cloud store holds a CONN_OPEN or DATA record (the box received feed bytes). */
    hasFeedRecords(nSesid: string): boolean {
        return (this.sessions.get(normId(nSesid))?.feedRecords ?? 0) > 0;
    }

    isCorrupt(nSesid: string): string | null {
        return this.sessions.get(normId(nSesid))?.corrupt ?? null;
    }

    journalDir(nSesid: string): string {
        return path.join(this.journalRoot(), normId(nSesid));
    }

    /**
     * Drop a sealed session's in-memory index (a chain hash per record: megabytes for a hearing day). The journal
     * stays on disk; a later read loads and re-verifies it. Waits for an append still in flight.
     */
    async forget(nSesid: string): Promise<void> {
        const id = normId(nSesid);
        const st = this.sessions.get(id);
        if (!st) return;
        await st.chain.catch(() => undefined);
        if (this.sessions.get(id) === st) this.sessions.delete(id);
    }

    /** Sessions whose journal index is in memory (tests, status). */
    loadedSessions(): string[] {
        return [...this.sessions.keys()];
    }

    /** The session's journal index is in memory (a status read reports it without loading anything). */
    isLoaded(nSesid: string): boolean {
        return this.sessions.has(normId(nSesid));
    }

    // -----------------------------------------------------------------------------------------------------------
    // e.raw
    // -----------------------------------------------------------------------------------------------------------

    /**
     * Append one `e.raw` batch for a bound session at `epoch` (the session's nIngestEpoch). Returns the ack
     * `{ackedSeq, ackedHash}` or a nack `{expectSeq, reason}`.
     */
    async append(nSesid: string, epoch: number, batch: EdgeRaw): Promise<RawReply> {
        const id = normId(nSesid);
        const st = await this.load(id);
        const run = st.chain.then(() => this.appendLocked(st, epoch, batch));
        st.chain = run.then(() => undefined, () => undefined);
        return run;
    }

    private async appendLocked(st: RawSession, epoch: number, batch: EdgeRaw): Promise<RawReply> {
        const headSeq = st.hashes.length - 1;
        const expectSeq = headSeq + 1;
        if (st.corrupt) return { expectSeq, reason: 'chain', retryAfterMs: 60_000 };
        const recs = toBuffer(batch?.recs);
        if (!recs || !recs.length || !Number.isSafeInteger(batch?.fromSeq) || !Number.isSafeInteger(batch?.toSeq) || typeof batch?.prevHash !== 'string') {
            return { expectSeq, reason: 'gap' };
        }
        if (recs.length > MAX_PART_BYTES) return { expectSeq, reason: 'rate', retryAfterMs: 1000 };
        const plan = planRawAppend(
            { epoch: batch.epoch, fromSeq: batch.fromSeq, toSeq: batch.toSeq, prevHash: batch.prevHash },
            { epoch, ackedSeq: headSeq, ackedHash: st.hashes[headSeq], hashAt: seq => st.hashes[seq] },
        );
        if (plan.action === 'nack') return plan.nack;

        const verified = verifyRecordBatch(recs, batch.fromSeq, Buffer.from(batch.prevHash, 'hex'));
        if (verified.ok === false) {
            return { expectSeq, reason: verified.reason === 'gap' ? 'gap' : 'crc' };
        }
        if (verified.toSeq !== batch.toSeq) return { expectSeq, reason: 'gap' };
        // The overlap must be exactly what the cloud already holds (§5.5 "Raw lane").
        for (const rec of verified.records) {
            if (rec.seq > headSeq) break;
            if (rec.hash.toString('hex') !== st.hashes[rec.seq]) {
                this.registry.alert({
                    kind: 'RAW_FORK',
                    tier: 'P1',
                    critical: true,
                    nSesid: st.nSesid,
                    message: `Raw records of ${st.nSesid} at seq ${rec.seq} differ from the cloud's acked chain`,
                });
                return { expectSeq, reason: 'chain' };
            }
        }
        if (plan.action === 'duplicate') return { ackedSeq: headSeq, ackedHash: st.hashes[headSeq] };

        const fresh = verified.records.filter(r => r.seq >= plan.appendFrom);
        let failed: unknown = null;
        try {
            // Each segment's records are indexed as soon as its fdatasync returns, so memory never lags the disk.
            await this.writeRecords(st, recs, fresh, durable => {
                for (const rec of durable) this.index(st, rec);
            });
        } catch (error) {
            failed = error;
        }
        const head = { seq: st.hashes.length - 1, hash: st.hashes[st.hashes.length - 1] };
        if (head.seq > headSeq) {
            for (const l of this.advanceListeners) {
                try {
                    l(st.nSesid, head);
                } catch (error) {
                    this.logger.warn(`raw advance listener failed: ${(error as Error)?.message ?? error}`);
                }
            }
        }
        if (failed) {
            this.registry.alert({
                kind: 'CLOUD_RAW_WRITE',
                tier: 'P1',
                nSesid: st.nSesid,
                message: `The cloud could not store raw records of ${st.nSesid}: ${(failed as Error)?.message ?? failed}`,
            });
            return { expectSeq: head.seq + 1, reason: 'rate', retryAfterMs: 5000 };
        }
        return { ackedSeq: head.seq, ackedHash: head.hash };
    }

    /**
     * Append verified records to the segment files, one write + fdatasync per segment; roll at 8 MB.
     * `onDurable` gets each segment's records once they are durable. A failed write is truncated back.
     */
    private async writeRecords(st: RawSession, recs: Buffer, records: StoredRecord[], onDurable: (durable: StoredRecord[]) => void): Promise<void> {
        if (!records.length) return;
        const dir = this.journalDir(st.nSesid);
        await this.jfs.mkdirp(dir);
        let k = 0;
        while (k < records.length) {
            if (st.segSize > 0 && st.segSize + records[k].size > this.rollBytes) {
                st.segIndex += 1;
                st.segSize = 0;
            }
            const parts: Buffer[] = [];
            const group: StoredRecord[] = [];
            let bytes = 0;
            while (k < records.length && (bytes === 0 || st.segSize + bytes + records[k].size <= this.rollBytes)) {
                const r = records[k];
                parts.push(recs.subarray(r.offset!, r.offset! + r.size));
                group.push(r);
                bytes += r.size;
                k += 1;
            }
            const file = path.join(dir, segmentName(st.segIndex));
            const before = st.segSize;
            const handle = await this.jfs.openAppend(file);
            try {
                await handle.write(Buffer.concat(parts));
                await handle.datasync();
            } catch (error) {
                await handle.close().catch(() => undefined);
                await this.jfs.truncate(file, before).catch(() => undefined);
                throw error;
            }
            await handle.close().catch(() => undefined);
            if (before === 0) await this.jfs.syncDir?.(dir);
            st.segSize = before + bytes;
            onDurable(group);
        }
    }

    // -----------------------------------------------------------------------------------------------------------
    // e.rawpull (RECOVER pull-back)
    // -----------------------------------------------------------------------------------------------------------

    /**
     * Records from `fromSeq` on (≤ 256 KB), as the protocol's EdgeRawPullReply, or a refusal the box reads by its
     * code (apps/rt-edge kernel/raw-pull.ts):
     * - past the head: an EMPTY reply `{recs: <0 bytes>, toSeq, hash}` with `toSeq = fromSeq - 1` and the chain hash
     *   there (the head's, when fromSeq - 1 is beyond it). The box reads an empty reply as "the cloud holds nothing
     *   more" (the end of its pull), exactly as it read NOT_FOUND, and never drops a record for it;
     * - a store that failed verification (on load, or a read now finds the disk inconsistent with its verified
     *   index): `CLOUD_JOURNAL_CORRUPT`, so the box's RECOVER_FAILED alert names the cause instead of "nothing more";
     * - a malformed request (fromSeq not a positive integer): NOT_FOUND, as before.
     */
    async pull(nSesid: string, fromSeq: number, toSeq: number): Promise<EdgeRawPullReply | EdgeRawPullRefusal> {
        const id = normId(nSesid);
        if (!id || !Number.isSafeInteger(fromSeq) || fromSeq < 1) return { ok: false, code: 'NOT_FOUND' };
        const st = await this.load(id);
        if (st.corrupt) return { ok: false, code: 'CLOUD_JOURNAL_CORRUPT' };
        const headSeq = st.hashes.length - 1;
        if (fromSeq > headSeq) {
            const at = Math.min(fromSeq - 1, headSeq);
            return { recs: Buffer.alloc(0), toSeq: at, hash: st.hashes[at] };
        }
        let range: Awaited<ReturnType<typeof readRawRange>>;
        try {
            range = await readRawRange({
                root: this.journalRoot(),
                nSesid: id,
                fromSeq,
                toSeq: Number.isSafeInteger(toSeq) && toSeq >= fromSeq ? toSeq : undefined,
                maxBytes: MAX_PART_BYTES,
                fs: this.jfs,
                tornTailMaxBytes: CLOUD_TORN_TAIL_MAX_BYTES,
            });
        } catch (error) {
            return this.pullCorrupt(id, fromSeq, error instanceof JournalCorruptError ? error.message : `journal unreadable: ${(error as Error)?.message ?? error}`);
        }
        // The verified index holds fromSeq, so the disk must too.
        if (!range) return this.pullCorrupt(id, fromSeq, `seq ${fromSeq}..${headSeq} is indexed but not on disk`);
        return { recs: range.recs, toSeq: range.toSeq, hash: range.hash.toString('hex') };
    }

    private pullCorrupt(nSesid: string, fromSeq: number, why: string): EdgeRawPullRefusal {
        this.registry.alert({ kind: 'CLOUD_JOURNAL_CORRUPT', tier: 'P1', critical: true, nSesid, message: `A pull-back of the cloud raw journal of ${nSesid} from seq ${fromSeq} failed: ${why}` });
        return { ok: false, code: 'CLOUD_JOURNAL_CORRUPT' };
    }

    // -----------------------------------------------------------------------------------------------------------
    // Held direct streams (orphan 'H')
    // -----------------------------------------------------------------------------------------------------------

    private async captureStore(): Promise<CaptureStore> {
        if (!this.captures) {
            this.captures = new CaptureStore({
                root: this.captureRoot(),
                limits: 'cloud',
                clock: this.clock,
                onAlert: a => this.registry.alert({ kind: a.kind, tier: a.tier === 'info' ? 'info' : a.tier, nSesid: a.nSesid ?? null, message: a.message, data: a.data }),
            });
            this.capturesReady = this.captures.init();
        }
        await this.capturesReady;
        return this.captures;
    }

    /**
     * A direct Eclipse stream for an 'E' session, accepted against its dormant route: held, journaled to a
     * capture, never parsed (spec §4.5). The caller passes only post-handshake bytes.
     */
    async openHeldStream(info: { nSesid: string; user: string | null; peer: string; connId: string; nEdgeid?: string | null }): Promise<EdgeHeldStream> {
        const nSesid = normId(info.nSesid);
        if (!nSesid) throw new Error('rt-edge: a held stream needs a session id');
        const store = await this.captureStore();
        const writer: CaptureWriter = store.open({ kind: 'H', nSesid, connId: info.connId, user: info.user, peer: info.peer, mode: 'listen' });
        const nOrphanid = randomUUID();
        const fromMs = writer.meta.fromMs;
        let reportedBytes = 0;
        let closed: Promise<CaptureMeta | null> | null = null;
        this.registry.alert({
            kind: 'HELD_DIRECT_STREAM',
            tier: 'P1',
            nEdgeid: info.nEdgeid ?? null,
            nSesid,
            message: `A direct Eclipse stream for venue session ${nSesid} from ${info.peer} is held (not parsed)`,
            data: { user: info.user, peer: info.peer, nOrphanid },
        });
        const peer = peerIp(info.peer);
        // Review #13: the stream's records run one after another on this chain (open, growth, close), so a close
        // that comes within one DB round trip of the open never races the open's first insert for the same
        // nOrphanid (the loser used to get RETRY and its bytes / hash / dTo were lost); close() awaits the chain.
        let chain: Promise<unknown> = Promise.resolve();
        const record = (meta: Partial<CaptureMeta>, extra: Record<string, unknown> = {}) => {
            const params = {
                nOrphanid,
                nSesid,
                cKind: 'H',
                ...(info.user ? { cUser: String(info.user).slice(0, 64) } : {}),
                ...(peer ? { cPeer: peer } : {}),
                dFrom: new Date(fromMs).toISOString(),
                ...(meta.toMs ? { dTo: new Date(meta.toMs).toISOString() } : {}),
                nBytes: meta.bytes ?? 0,
                ...(meta.sha256 ? { cSha256: meta.sha256 } : {}),
                ...extra,
            };
            const run = chain.then(() => this.recordOrphan(params));
            chain = run.then(() => undefined, () => undefined);
            return run;
        };
        void record({ bytes: 0 });
        const self = this;
        return {
            nOrphanid,
            nSesid,
            write(chunk: Buffer, tRecvMs?: number): boolean {
                const ok = writer.write(chunk, tRecvMs);
                if (writer.meta.bytes - reportedBytes >= 10 * 1024 * 1024) {
                    reportedBytes = writer.meta.bytes;
                    void record({ bytes: writer.meta.bytes });
                }
                return ok;
            },
            close(reason = 'closed'): Promise<CaptureMeta | null> {
                if (closed) return closed;
                closed = (async () => {
                    const meta = await writer.close(reason);
                    let key: string | null = null;
                    try {
                        key = await self.archive.uploadCapture({ nSesid, file: store.filePath(meta), meta });
                    } catch (error) {
                        self.logger.warn(`held capture upload failed: ${(error as Error)?.message ?? error}`);
                    }
                    await record(meta, key ? { cObjectKey: key } : {});
                    return meta;
                })().catch(error => {
                    self.logger.error(`held capture of ${nSesid} not closed cleanly: ${(error as Error)?.message ?? error}`);
                    return null;
                });
                return closed;
            },
        };
    }

    /**
     * et_rtedge_orphan_insert (idempotent by nOrphanid). Never throws: a failed record is logged and alerted.
     * `RETRY` (two first inserts of one nOrphanid met; the other one committed) is retried once: the second call
     * finds the row and extends it, so nothing the caller reported is dropped (review #13).
     */
    async recordOrphan(params: Record<string, unknown>): Promise<{ nOrphanid: string | null; ok: boolean; row?: any }> {
        try {
            let row: EdgeSpRow;
            for (let attempt = 1; ; attempt++) {
                row = firstRow(await callSp(this.db, 'rtedge_orphan_insert', params));
                if (spOk(row) || attempt >= 2 || String(row.cCode ?? '').toUpperCase() !== 'RETRY') break;
            }
            if (!spOk(row)) {
                this.registry.alert({ kind: 'ORPHAN_RECORD_REFUSED', tier: 'P2', nSesid: normId(params.nSesid), message: `Held stream not recorded: ${row.value ?? row.cCode}` });
                return { nOrphanid: null, ok: false, row };
            }
            return { nOrphanid: normId(row.nOrphanid), ok: true, row };
        } catch (error) {
            this.logger.error(`orphan insert failed: ${(error as Error)?.message ?? error}`);
            return { nOrphanid: null, ok: false };
        }
    }
}

function toBuffer(value: unknown): Buffer | null {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    if (value instanceof ArrayBuffer) return Buffer.from(value);
    return null;
}
