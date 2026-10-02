/**
 * Write-ahead raw journal (spec §5.1, MR-4, MR-5, D25).
 *
 * Record (all integers little-endian; the epoch is NOT in the header, so a
 * switch is expressed only by an EPOCH record and nothing is ever re-tagged):
 *
 *   u32 len | u8 type | u8 flags | u64 seq | i64 tRecvMs | u32 crc32c | payload
 *
 *   - `len` is the payload length in bytes; a record is JOURNAL_HEADER_BYTES + len.
 *   - `crc32c` covers type, flags, seq, tRecvMs and the payload (not len, not
 *     the crc field itself). A corrupted len shows up as a CRC failure.
 *   - DATA payloads are the raw CAT bytes; every other payload is UTF-8 JSON.
 *
 * Chain: h0 = sha256("EJ1" ++ nSesid); h_n = sha256(h_{n-1} ++ encoded record_n).
 * The hash is derived, never stored in the record; a re-bound writer (Phase 4)
 * starts at baseSeq+1 chained to baseHash.
 *
 * Segments: <root>/<nSesid>/seg-00001.ej, rolled at 8 MB. Sidecar
 * seg-00001.idx gets one JSON line {seq, off, h} every 256 records, written
 * after that record's group fdatasync (a hint for range reads; checked when
 * present, never required).
 *
 * Durability (D25): a record is durable once its group fdatasync returns.
 * Appends are buffered and committed in groups at most every 10 ms or at
 * 64 KB; every write is followed by its fdatasync before the next write
 * starts, and no write exceeds one group (64 KB, or one record when a single
 * record is larger), so a crash can tear at most that one write at the tail
 * of the last segment. The reader truncates exactly such a torn tail
 * (TAIL_TRUNCATED, info). A bad record is torn only when it is in the last
 * segment, past every index-confirmed offset, within one group of the end of
 * the file, AND no CRC-valid record continuing the sequence follows it: a
 * valid later record proves the bad one sat in a group whose fdatasync had
 * returned (it may have been parsed, served and acked). Anything else is a
 * JournalCorruptError (JOURNAL_CORRUPT: the session's uplink halts, MR-4) and
 * nothing is truncated.
 *
 * When appends fail (disk full, I/O error) the writer enters the failed
 * state (MR-5): records keep their seq and chain position, stay in memory
 * (`undurableRecords()`, for the raw lane) and resolve with durable:false so
 * the worker keeps parsing. `retryDurability()` truncates the segment back to
 * its last durable size and rewrites them.
 *
 * A disk that HANGS instead of erroring is treated the same way: every disk
 * operation of the writer runs under a watchdog (`writeTimeoutMs`, default
 * 15 s). One that has not returned by then fails its group into the failed
 * state (the DEGRADED alert fires, parsing goes on from memory); the hung
 * operation is abandoned (its file handle is closed once it settles) and no
 * rewrite starts before it has settled, so a late write can never land after
 * a rewrite.
 *
 * `close()` never drops the undurable tail silently: it tries once more to
 * write it, and what still cannot be written is recorded (`lostOnClose`) and,
 * when the disk takes it, in a `lost-tail-*.json` marker beside the journal
 * that the next open turns into an incident (`readLostTails`).
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { crc32c } from './crc32c';
import { assertSafeSessionId, Clock, IncidentKind, IncidentLevel, systemClock } from './types';

export const JOURNAL_HEADER_BYTES = 26;
/** DATA records hold one TCP chunk, split at 64 KB. */
export const JOURNAL_DATA_SPLIT_BYTES = 64 * 1024;
/** Hard ceiling for any one payload; a larger len is treated as corruption. */
export const JOURNAL_MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;
export const JOURNAL_SEGMENT_ROLL_BYTES = 8 * 1024 * 1024;
/** Group fdatasync window (D25: "fsync ≤10 ms before parse"). */
export const JOURNAL_GROUP_WINDOW_MS = 10;
/** A group is committed early once it holds this many bytes. */
export const JOURNAL_GROUP_MAX_BYTES = 64 * 1024;
export const JOURNAL_INDEX_EVERY = 256;
/**
 * Watchdog of one journal disk operation (write, fdatasync, open, truncate, roll). A healthy disk answers in
 * milliseconds; one that has not answered after this long is treated as failed (MR-5, DEGRADED) instead of
 * stalling every append, the parser and the room view behind it.
 */
export const JOURNAL_WRITE_TIMEOUT_MS = 15_000;
/** `close()` writes what it could not make durable into `<dir>/lost-tail-<atMs>-<fromSeq>.json`. */
export const JOURNAL_LOST_TAIL_RE = /^lost-tail-\d+-\d+\.json$/;
/**
 * Largest tail the reader will treat as torn. The one unsynced write is at
 * most max(group max, one record) = 64 KB + 26 B for v1 records (DATA is split
 * at 64 KB; the JSON records are small); the bound allows a group plus one
 * maximal DATA record. A bad region larger than this, or one before the last
 * index-confirmed offset, is corruption. (Phase-4 REBASE_PAGE records must
 * stay under 64 KB or raise this bound.)
 */
export const JOURNAL_TORN_TAIL_MAX_BYTES = JOURNAL_GROUP_MAX_BYTES + JOURNAL_HEADER_BYTES + JOURNAL_DATA_SPLIT_BYTES;

/** flags bit 0: this DATA record is a non-final piece of one TCP chunk split at 64 KB. */
export const JOURNAL_FLAG_CONTINUED = 0x01;

export enum RecordType {
    DATA = 0x01,
    CONN_OPEN = 0x02,
    CONN_CLOSE = 0x03,
    CTX_SET = 0x04,
    SESSION_END = 0x05,
    EPOCH = 0x06,
    /** Phase 4 (D1): in-session failover and re-bind. Codec only in v1. */
    REBASE_BEGIN = 0x07,
    /** Phase 4 (D1). Codec only in v1. */
    REBASE_PAGE = 0x08,
    /** Phase 4 (D1). Codec only in v1. */
    REBASE_END = 0x09,
    INCIDENT = 0x0a,
    SESSION_HEADER = 0x10,
}

/** Record types written only by Phase-4 failover / re-bind (D1). */
export const PHASE4_RECORD_TYPES: ReadonlySet<RecordType> = new Set([
    RecordType.REBASE_BEGIN,
    RecordType.REBASE_PAGE,
    RecordType.REBASE_END,
]);

const KNOWN_TYPES: ReadonlySet<number> = new Set(
    Object.values(RecordType).filter((v): v is number => typeof v === 'number'),
);

export function recordTypeName(type: number): string {
    return RecordType[type] ?? `0x${type.toString(16)}`;
}

// ---------------------------------------------------------------------------
// Record bodies
// ---------------------------------------------------------------------------

export interface SessionHeaderBody {
    nSesid: string;
    nCaseid: string | null;
    nLines: number;
    /** resolved IANA zone pinned at cloud create (DET-2) */
    tz: string | null;
    parserVer: string;
    fmt: number | string;
    createdAt: number;
}

export interface EpochBody {
    epoch: number;
    owner: 'edge' | 'cloud';
    fenceSeq?: number;
}

/** External parse inputs enter only as CTX_SET records (DET-4, DET-9). */
export interface CtxSetBody {
    protocol?: 'B' | 'C';
    caseTabs?: string[];
    [key: string]: unknown;
}

export interface ConnOpenBody {
    connId: string;
    remote: string;
    /** Eclipse username (listen mode). Absent in dial mode. Never a password. */
    user?: string;
    mode?: 'listen' | 'dial';
}

export interface ConnCloseBody {
    connId: string;
    reason: string;
}

/** Phase 4 (D1). */
export interface RebaseBeginBody {
    reason: string;
    rev: number;
    totalLines: number;
    root: string;
    parserVer: string;
    fmt: number | string;
    baseSeq: number;
    anchorIdsDigest: string;
    crLinePolicy: string;
}

/** Phase 4 (D1). */
export interface RebasePageBody {
    p: number;
    lines: unknown[];
}

/** Phase 4 (D1). */
export interface RebaseEndBody {
    root: string;
    idSeq: number;
}

export interface IncidentBody {
    kind: IncidentKind;
    level: IncidentLevel;
    fromSeq?: number;
    toSeq?: number;
    lines?: number;
    note?: string;
}

export interface SessionEndBody {
    endedBy: string;
    at: number;
}

export interface RecordBodyMap {
    [RecordType.DATA]: Buffer;
    [RecordType.CONN_OPEN]: ConnOpenBody;
    [RecordType.CONN_CLOSE]: ConnCloseBody;
    [RecordType.CTX_SET]: CtxSetBody;
    [RecordType.SESSION_END]: SessionEndBody;
    [RecordType.EPOCH]: EpochBody;
    [RecordType.REBASE_BEGIN]: RebaseBeginBody;
    [RecordType.REBASE_PAGE]: RebasePageBody;
    [RecordType.REBASE_END]: RebaseEndBody;
    [RecordType.INCIDENT]: IncidentBody;
    [RecordType.SESSION_HEADER]: SessionHeaderBody;
}

export function encodeBody<T extends RecordType>(type: T, body: RecordBodyMap[T]): Buffer {
    if (type === RecordType.DATA) {
        if (!Buffer.isBuffer(body)) throw new TypeError('rt-ingest: DATA body must be a Buffer');
        return body as Buffer;
    }
    return Buffer.from(JSON.stringify(body), 'utf8');
}

export function decodeBody<T extends RecordType>(record: { type: T; payload: Buffer }): RecordBodyMap[T] {
    if (record.type === RecordType.DATA) return record.payload as RecordBodyMap[T];
    return JSON.parse(record.payload.toString('utf8'));
}

// ---------------------------------------------------------------------------
// Codec
// ---------------------------------------------------------------------------

export interface JournalRecord {
    type: RecordType;
    flags: number;
    seq: number;
    tRecvMs: number;
    payload: Buffer;
}

/** A record as read back, with its position and its chain hash (h_seq). */
export interface StoredRecord extends JournalRecord {
    /** chain hash after this record */
    hash: Buffer;
    /** encoded size in bytes */
    size: number;
    segment?: string;
    offset?: number;
}

export function encodeRecord(rec: JournalRecord): Buffer {
    const payload = rec.payload ?? Buffer.alloc(0);
    if (payload.length > JOURNAL_MAX_PAYLOAD_BYTES) {
        throw new RangeError(`rt-ingest: journal payload ${payload.length} B exceeds ${JOURNAL_MAX_PAYLOAD_BYTES} B`);
    }
    if (!Number.isSafeInteger(rec.seq) || rec.seq < 0) throw new RangeError(`rt-ingest: bad seq ${rec.seq}`);
    const buf = Buffer.allocUnsafe(JOURNAL_HEADER_BYTES + payload.length);
    buf.writeUInt32LE(payload.length, 0);
    buf.writeUInt8(rec.type & 0xff, 4);
    buf.writeUInt8((rec.flags ?? 0) & 0xff, 5);
    buf.writeBigUInt64LE(BigInt(rec.seq), 6);
    buf.writeBigInt64LE(BigInt(Math.trunc(rec.tRecvMs)), 14);
    payload.copy(buf, JOURNAL_HEADER_BYTES);
    buf.writeUInt32LE(recordCrc(buf, payload.length), 22);
    return buf;
}

function recordCrc(buf: Buffer, payloadLen: number): number {
    const head = crc32c(buf.subarray(4, 22));
    return crc32c(buf.subarray(JOURNAL_HEADER_BYTES, JOURNAL_HEADER_BYTES + payloadLen), head);
}

export type DecodeFailure = 'short' | 'len' | 'type' | 'crc';

export type DecodeResult =
    | { ok: true; record: JournalRecord; size: number }
    | { ok: false; reason: DecodeFailure };

/** Decode the record starting at `offset`. Never throws. */
export function decodeRecordAt(buf: Buffer, offset = 0): DecodeResult {
    const remaining = buf.length - offset;
    if (remaining < JOURNAL_HEADER_BYTES) return { ok: false, reason: 'short' };
    const len = buf.readUInt32LE(offset);
    if (len > JOURNAL_MAX_PAYLOAD_BYTES) return { ok: false, reason: 'len' };
    if (remaining < JOURNAL_HEADER_BYTES + len) return { ok: false, reason: 'short' };
    const type = buf.readUInt8(offset + 4);
    if (!KNOWN_TYPES.has(type)) return { ok: false, reason: 'type' };
    const rec = buf.subarray(offset, offset + JOURNAL_HEADER_BYTES + len);
    if (rec.readUInt32LE(22) !== recordCrc(rec, len)) return { ok: false, reason: 'crc' };
    const seqBig = rec.readBigUInt64LE(6);
    if (seqBig > BigInt(Number.MAX_SAFE_INTEGER)) return { ok: false, reason: 'crc' };
    return {
        ok: true,
        size: JOURNAL_HEADER_BYTES + len,
        record: {
            type: type as RecordType,
            flags: rec.readUInt8(5),
            seq: Number(seqBig),
            tRecvMs: Number(rec.readBigInt64LE(14)),
            payload: Buffer.from(rec.subarray(JOURNAL_HEADER_BYTES)),
        },
    };
}

/** h0 = sha256("EJ1" ++ nSesid) */
export function chainSeed(nSesid: string): Buffer {
    return createHash('sha256').update('EJ1').update(String(nSesid), 'utf8').digest();
}

/** h_n = sha256(h_{n-1} ++ encoded record_n) */
export function chainNext(prev: Buffer, encoded: Buffer): Buffer {
    return createHash('sha256').update(prev).update(encoded).digest();
}

export interface ChainCheckOk {
    ok: true;
    records: StoredRecord[];
    toSeq: number;
    hash: Buffer;
}

export interface ChainCheckFail {
    ok: false;
    reason: 'crc' | 'gap' | 'trailing';
    /** seq the next record should have carried */
    expectSeq: number;
    offset: number;
}

/**
 * Decode and verify a contiguous batch of encoded records (an `e.raw`
 * `recs` buffer, or a pull-back). All-or-nothing: every record must decode,
 * seqs must run fromSeq, fromSeq+1, …, and the chain continues `prevHash`.
 */
export function verifyRecordBatch(recs: Buffer, fromSeq: number, prevHash: Buffer): ChainCheckOk | ChainCheckFail {
    const out: StoredRecord[] = [];
    let off = 0;
    let expect = fromSeq;
    let hash = prevHash;
    while (off < recs.length) {
        const d = decodeRecordAt(recs, off);
        if (d.ok === false) return { ok: false, reason: d.reason === 'short' ? 'trailing' : 'crc', expectSeq: expect, offset: off };
        if (d.record.seq !== expect) return { ok: false, reason: 'gap', expectSeq: expect, offset: off };
        hash = chainNext(hash, recs.subarray(off, off + d.size));
        out.push({ ...d.record, hash, size: d.size, offset: off });
        off += d.size;
        expect += 1;
    }
    return { ok: true, records: out, toSeq: expect - 1, hash };
}

// ---------------------------------------------------------------------------
// File system adapter (injectable for tests)
// ---------------------------------------------------------------------------

export interface JournalFile {
    write(data: Buffer): Promise<void>;
    datasync(): Promise<void>;
    close(): Promise<void>;
}

export interface JournalFs {
    mkdirp(dir: string): Promise<void>;
    /** file names in `dir`; [] when the directory does not exist */
    list(dir: string): Promise<string[]>;
    readFile(file: string): Promise<Buffer>;
    /** open for appending (created when missing) */
    openAppend(file: string): Promise<JournalFile>;
    truncate(file: string, size: number): Promise<void>;
    /** best-effort, unsynced append (sidecar index) */
    appendText(file: string, text: string): Promise<void>;
    /** best-effort directory fsync after creating a segment (no-op where unsupported) */
    syncDir?(dir: string): Promise<void>;
    /** whole-file durable write (temp file, fsync, rename, directory fsync): the lost-tail marker */
    writeFileDurably?(file: string, data: Buffer): Promise<void>;
    /** delete a file; a missing one is fine */
    remove?(file: string): Promise<void>;
}

export const nodeJournalFs: JournalFs = {
    async mkdirp(dir) {
        await fs.promises.mkdir(dir, { recursive: true });
    },
    async list(dir) {
        try {
            return await fs.promises.readdir(dir);
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
            throw error;
        }
    },
    readFile(file) {
        return fs.promises.readFile(file);
    },
    async openAppend(file) {
        const handle = await fs.promises.open(file, 'a');
        return {
            async write(data: Buffer) {
                let written = 0;
                while (written < data.length) {
                    const { bytesWritten } = await handle.write(data, written, data.length - written);
                    if (bytesWritten <= 0) throw new Error('rt-ingest: short journal write');
                    written += bytesWritten;
                }
            },
            datasync: () => handle.datasync(),
            close: () => handle.close(),
        };
    },
    truncate(file, size) {
        return fs.promises.truncate(file, size);
    },
    appendText(file, text) {
        return fs.promises.appendFile(file, text, 'utf8');
    },
    async syncDir(dir) {
        // Linux needs the directory fsynced for a new file to survive a crash;
        // Windows cannot open a directory for fsync. Best effort either way.
        let handle: fs.promises.FileHandle | null = null;
        try {
            handle = await fs.promises.open(dir, 'r');
            await handle.sync();
        } catch {
            /* unsupported here */
        } finally {
            await handle?.close().catch(() => undefined);
        }
    },
    async writeFileDurably(file, data) {
        const tmp = `${file}.tmp-${process.pid}`;
        const handle = await fs.promises.open(tmp, 'w', 0o600);
        try {
            await handle.writeFile(data);
            await handle.sync();
        } finally {
            await handle.close();
        }
        await fs.promises.rename(tmp, file);
        await nodeJournalFs.syncDir?.(path.dirname(file));
    },
    async remove(file) {
        await fs.promises.rm(file, { force: true });
    },
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function journalDir(root: string, nSesid: string): string {
    assertSafeSessionId(nSesid);
    return path.join(root, nSesid);
}

export function segmentName(index: number): string {
    return `seg-${String(index).padStart(5, '0')}.ej`;
}

export function indexNameFor(segment: string): string {
    return segment.replace(/\.ej$/, '.idx');
}

const SEGMENT_RE = /^seg-(\d{5,})\.ej$/;

export function listSegments(names: string[]): string[] {
    return names
        .filter(n => SEGMENT_RE.test(n))
        .sort((a, b) => Number(SEGMENT_RE.exec(a)![1]) - Number(SEGMENT_RE.exec(b)![1]));
}

function segmentNumber(name: string): number {
    return Number(SEGMENT_RE.exec(name)?.[1] ?? 0);
}

interface IndexEntry {
    seq: number;
    off: number;
    h: string;
}

async function readIndex(jfs: JournalFs, file: string): Promise<IndexEntry[]> {
    let text: string;
    try {
        text = (await jfs.readFile(file)).toString('utf8');
    } catch {
        return [];
    }
    const out: IndexEntry[] = [];
    for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try {
            const e = JSON.parse(line);
            if (Number.isSafeInteger(e?.seq) && Number.isSafeInteger(e?.off) && typeof e?.h === 'string' && /^[0-9a-f]{64}$/.test(e.h)) {
                out.push({ seq: e.seq, off: e.off, h: e.h });
            }
        } catch {
            /* a torn index line is only a lost hint */
        }
    }
    return out;
}

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

export class JournalCorruptError extends Error {
    readonly code = 'JOURNAL_CORRUPT';
    constructor(
        readonly nSesid: string,
        readonly segment: string,
        readonly offset: number,
        readonly expectSeq: number,
        readonly reason: string,
        /** last record that verified before the corruption */
        readonly goodHead: JournalHead,
    ) {
        super(`rt-ingest: journal of ${nSesid} is corrupt in ${segment} at offset ${offset} (expected seq ${expectSeq}): ${reason}`);
        this.name = 'JournalCorruptError';
    }
}

export interface JournalHead {
    /** last seq (0 = empty journal) */
    seq: number;
    /** chain hash after `seq` (h0 for an empty journal) */
    hash: Buffer;
    /** tRecvMs of the last record (0 when empty) */
    tRecvMs: number;
}

export interface SegmentInfo {
    name: string;
    /** bytes of valid records (after any tail truncation) */
    size: number;
    firstSeq: number | null;
    lastSeq: number | null;
}

export interface TailTruncation {
    segment: string;
    offset: number;
    bytes: number;
    reason: DecodeFailure;
}

export interface JournalReadResult {
    dir: string;
    segments: SegmentInfo[];
    head: JournalHead;
    /** kept records (all, or those with seq ≥ keepFromSeq) */
    records: StoredRecord[];
    recordCount: number;
    tailTruncated: TailTruncation | null;
}

/**
 * Offset of the first CRC-valid record after a bad one at `badOffset` that
 * could continue the sequence (seq ≥ `expectSeq`, and no larger than the
 * number of minimal records that fit in between allows), or -1. Cheap
 * filters (len, type, seq range) run before the CRC, so a garbage or zeroed
 * tail is scanned in linear time.
 */
export function findRecordAfter(buf: Buffer, badOffset: number, expectSeq: number): number {
    for (let p = badOffset + 1; p + JOURNAL_HEADER_BYTES <= buf.length; p++) {
        const len = buf.readUInt32LE(p);
        if (len > JOURNAL_MAX_PAYLOAD_BYTES || p + JOURNAL_HEADER_BYTES + len > buf.length) continue;
        if (!KNOWN_TYPES.has(buf[p + 4])) continue;
        const seq = buf.readUInt32LE(p + 10) * 0x1_0000_0000 + buf.readUInt32LE(p + 6);
        if (seq < expectSeq || seq > expectSeq + Math.floor((p - badOffset) / JOURNAL_HEADER_BYTES)) continue;
        if (decodeRecordAt(buf, p).ok) return p;
    }
    return -1;
}

/**
 * MR-4: may the bad record at `off` be truncated as a torn tail? Returns null
 * when it may, else why it is corruption. Torn means: the last segment, at or
 * past the last index-confirmed offset, at most `tornMax` bytes from the end,
 * and nothing valid after it (a valid record that continues the sequence
 * means the bad one was inside a group whose fdatasync had returned).
 */
function corruptionReason(
    buf: Buffer,
    off: number,
    expectSeq: number,
    failure: DecodeFailure,
    where: { isLast: boolean; confirmedOffset: number; tornMax: number },
): string | null {
    const bad = `bad record (${failure})`;
    if (!where.isLast) return `${bad} outside the last segment`;
    if (off < where.confirmedOffset) return `${bad} before the index-confirmed offset ${where.confirmedOffset}`;
    if (buf.length - off > where.tornMax) return `${bad} with ${buf.length - off} B after it, more than one unsynced group`;
    const next = findRecordAfter(buf, off, expectSeq);
    if (next >= 0) return `${bad} followed by a valid record at offset ${next}: it was inside a synced group`;
    return null;
}

export interface ReadJournalOptions {
    root: string;
    nSesid: string;
    fs?: JournalFs;
    /** truncate a torn tail on disk (default true) */
    repair?: boolean;
    /** keep decoded records from this seq on (default 1 = keep all; Infinity = keep none) */
    keepFromSeq?: number;
    /** first seq of this lineage (default 1); Phase-4 re-bound writers start at baseSeq+1 */
    startSeq?: number;
    /** chain hash the first record continues (default h0) */
    startHash?: Buffer;
    tornTailMaxBytes?: number;
    onRecord?: (rec: StoredRecord) => void;
}

/**
 * Read and verify a whole journal: CRC of every record, contiguous seqs, the
 * sha256 chain and any sidecar index entries. Only the torn tail of the LAST
 * segment is truncated (MR-4, see `corruptionReason`); anything else throws
 * JournalCorruptError and leaves the files untouched.
 */
export async function readJournal(opts: ReadJournalOptions): Promise<JournalReadResult> {
    const jfs = opts.fs ?? nodeJournalFs;
    const dir = journalDir(opts.root, opts.nSesid);
    const names = listSegments(await jfs.list(dir));
    const keepFrom = opts.keepFromSeq ?? 1;
    const tornMax = opts.tornTailMaxBytes ?? JOURNAL_TORN_TAIL_MAX_BYTES;
    let expect = opts.startSeq ?? 1;
    let hash = opts.startHash ?? chainSeed(opts.nSesid);
    let tRecvMs = 0;
    const records: StoredRecord[] = [];
    const segments: SegmentInfo[] = [];
    let tailTruncated: TailTruncation | null = null;
    let count = 0;

    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const isLast = i === names.length - 1;
        const file = path.join(dir, name);
        const buf = await jfs.readFile(file);
        const index = new Map((await readIndex(jfs, path.join(dir, indexNameFor(name)))).map(e => [e.seq, e]));
        const confirmedOffset = [...index.values()].reduce((m, e) => Math.max(m, e.off), 0);
        const info: SegmentInfo = { name, size: 0, firstSeq: null, lastSeq: null };
        let off = 0;
        while (off < buf.length) {
            const d = decodeRecordAt(buf, off);
            const head = (): JournalHead => ({ seq: expect - 1, hash, tRecvMs });
            if (d.ok === false) {
                const corrupt = corruptionReason(buf, off, expect, d.reason, { isLast, confirmedOffset, tornMax });
                if (corrupt !== null) throw new JournalCorruptError(opts.nSesid, name, off, expect, corrupt, head());
                tailTruncated = { segment: name, offset: off, bytes: buf.length - off, reason: d.reason };
                if (opts.repair !== false) await jfs.truncate(file, off);
                break;
            }
            if (d.record.seq !== expect) {
                throw new JournalCorruptError(opts.nSesid, name, off, expect, `seq ${d.record.seq} breaks the sequence`, head());
            }
            const encoded = buf.subarray(off, off + d.size);
            hash = chainNext(hash, encoded);
            const hint = index.get(d.record.seq);
            if (hint && (hint.h !== hash.toString('hex') || hint.off !== off + d.size)) {
                throw new JournalCorruptError(opts.nSesid, name, off, expect, 'chain hash differs from the sidecar index', head());
            }
            tRecvMs = d.record.tRecvMs;
            const stored: StoredRecord = { ...d.record, hash, size: d.size, segment: name, offset: off };
            if (d.record.seq >= keepFrom) records.push(stored);
            opts.onRecord?.(stored);
            if (info.firstSeq === null) info.firstSeq = d.record.seq;
            info.lastSeq = d.record.seq;
            count += 1;
            expect += 1;
            off += d.size;
        }
        info.size = tailTruncated && tailTruncated.segment === name ? tailTruncated.offset : buf.length;
        segments.push(info);
    }
    return {
        dir,
        segments,
        head: { seq: expect - 1, hash, tRecvMs },
        records,
        recordCount: count,
        tailTruncated,
    };
}

export interface RawRange {
    fromSeq: number;
    toSeq: number;
    /** chain hash the first record continues */
    prevHash: Buffer;
    /** hash after toSeq */
    hash: Buffer;
    /** concatenated encoded records (an `e.raw` / pull-back body) */
    recs: Buffer;
    count: number;
}

interface ScanStart {
    segIdx: number;
    offset: number;
    seq: number;
    hash: Buffer;
}

async function bestStart(jfs: JournalFs, dir: string, names: string[], beforeSeq: number, nSesid: string, startSeq: number, startHash?: Buffer): Promise<ScanStart> {
    let best: ScanStart = { segIdx: 0, offset: 0, seq: startSeq - 1, hash: startHash ?? chainSeed(nSesid) };
    for (let i = 0; i < names.length; i++) {
        for (const e of await readIndex(jfs, path.join(dir, indexNameFor(names[i])))) {
            if (e.seq < beforeSeq && e.seq > best.seq) best = { segIdx: i, offset: e.off, seq: e.seq, hash: Buffer.from(e.h, 'hex') };
        }
    }
    return best;
}

/**
 * Read durable records [fromSeq, toSeq] (bounded by maxBytes, at least one
 * record) for the raw lane or a pull-back, starting from the nearest sidecar
 * index point. Returns null when fromSeq is beyond the journal head. A torn
 * (or still being written) tail of the last segment ends the range; a bad
 * record anywhere else, including one in the last segment that valid records
 * follow, throws JournalCorruptError (the same MR-4 rule as readJournal).
 */
export async function readRawRange(opts: {
    root: string;
    nSesid: string;
    fromSeq: number;
    toSeq?: number;
    maxBytes?: number;
    fs?: JournalFs;
    startSeq?: number;
    startHash?: Buffer;
    tornTailMaxBytes?: number;
}): Promise<RawRange | null> {
    const jfs = opts.fs ?? nodeJournalFs;
    const dir = journalDir(opts.root, opts.nSesid);
    const names = listSegments(await jfs.list(dir));
    const maxBytes = opts.maxBytes ?? 256 * 1024;
    const toSeq = opts.toSeq ?? Number.MAX_SAFE_INTEGER;
    if (opts.fromSeq < (opts.startSeq ?? 1) || toSeq < opts.fromSeq) return null;
    const start = await bestStart(jfs, dir, names, opts.fromSeq, opts.nSesid, opts.startSeq ?? 1, opts.startHash);
    let expect = start.seq + 1;
    let hash = start.hash;
    let prevHash: Buffer | null = expect === opts.fromSeq ? hash : null;
    const parts: Buffer[] = [];
    let bytes = 0;
    let last = -1;
    for (let i = start.segIdx; i < names.length; i++) {
        const buf = await jfs.readFile(path.join(dir, names[i]));
        let off = i === start.segIdx ? start.offset : 0;
        while (off < buf.length) {
            const d = decodeRecordAt(buf, off);
            if (d.ok === false) {
                // The writer appends concurrently: a partial group at the very end is normal and simply not served yet.
                const corrupt = corruptionReason(buf, off, expect, d.reason, {
                    isLast: i === names.length - 1,
                    confirmedOffset: 0,
                    tornMax: opts.tornTailMaxBytes ?? JOURNAL_TORN_TAIL_MAX_BYTES,
                });
                if (corrupt === null) break;
                throw new JournalCorruptError(opts.nSesid, names[i], off, expect, corrupt, { seq: expect - 1, hash, tRecvMs: 0 });
            }
            if (d.record.seq !== expect) {
                throw new JournalCorruptError(opts.nSesid, names[i], off, expect, `seq ${d.record.seq} breaks the sequence`, { seq: expect - 1, hash, tRecvMs: 0 });
            }
            const encoded = buf.subarray(off, off + d.size);
            if (expect >= opts.fromSeq) {
                if (parts.length && bytes + d.size > maxBytes) return finish();
                if (prevHash === null) prevHash = hash;
                parts.push(Buffer.from(encoded));
                bytes += d.size;
                last = expect;
            }
            hash = chainNext(hash, encoded);
            off += d.size;
            if (expect >= toSeq) return finish();
            expect += 1;
        }
    }
    return parts.length ? finish() : null;

    function finish(): RawRange {
        const recs = Buffer.concat(parts);
        const check = verifyRecordBatch(recs, opts.fromSeq, prevHash!);
        if (check.ok === false) throw new Error(`rt-ingest: raw range of ${opts.nSesid} failed its own check (${check.reason})`);
        return { fromSeq: opts.fromSeq, toSeq: last, prevHash: prevHash!, hash: check.hash, recs, count: parts.length };
    }
}

/** Chain hash after `seq` (h0 for seq 0), or null when the journal has not reached it. */
export async function journalHashAt(opts: { root: string; nSesid: string; seq: number; fs?: JournalFs }): Promise<Buffer | null> {
    if (opts.seq === 0) return chainSeed(opts.nSesid);
    const range = await readRawRange({ ...opts, fromSeq: opts.seq, toSeq: opts.seq });
    return range ? range.hash : null;
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

export interface AppendResult {
    seq: number;
    hash: Buffer;
    tRecvMs: number;
    type: RecordType;
    flags: number;
    /** true once the record's group fdatasync returned; false in the failed (degraded) state */
    durable: boolean;
    /** the encoded record (for the raw lane while undurable) */
    encoded: Buffer;
}

export interface JournalFailureInfo {
    error: unknown;
    /** first seq that is not durable */
    fromSeq: number;
}

export interface JournalRestoredInfo {
    fromSeq: number;
    toSeq: number;
}

/** A journal disk operation the watchdog gave up on (the disk hangs instead of erroring). */
export class JournalWriteTimeoutError extends Error {
    readonly code = 'JOURNAL_WRITE_TIMEOUT';
    constructor(readonly timeoutMs: number) {
        super(`journal disk did not answer within ${timeoutMs} ms (write timeout)`);
        this.name = 'JournalWriteTimeoutError';
    }
}

/**
 * Records `close()` could not make durable (the journal was degraded and the last attempt failed too). After the
 * restart the journal ends at `durableSeq` and these seqs are reused by new records: the loss is never silent.
 */
export interface JournalLossInfo {
    nSesid: string;
    /** first lost seq (= durableSeq + 1) */
    fromSeq: number;
    /** last lost seq of this run */
    toSeq: number;
    records: number;
    bytes: number;
    /** the journal's durable head: where it ends after the restart */
    durableSeq: number;
    atMs: number;
    /** why it could not be written (the last I/O error) */
    reason: string;
    /** the lost-tail marker written beside the journal; null when the disk refused that too */
    marker: string | null;
}

export interface RawJournalWriterOptions {
    root: string;
    nSesid: string;
    fs?: JournalFs;
    groupWindowMs?: number;
    groupMaxBytes?: number;
    segmentMaxBytes?: number;
    indexEvery?: number;
    tornTailMaxBytes?: number;
    /** watchdog of one disk operation (JOURNAL_WRITE_TIMEOUT_MS); 0 or Infinity switches it off */
    writeTimeoutMs?: number;
    now?: Clock;
    onFailure?: (info: JournalFailureInfo) => void;
    onRestored?: (info: JournalRestoredInfo) => void;
}

/** Lost-tail markers (`JournalLossInfo`) left by an earlier `close()`, oldest first. Never throws. */
export async function readLostTails(opts: { root: string; nSesid: string; fs?: JournalFs }): Promise<Array<{ file: string; info: JournalLossInfo }>> {
    const jfs = opts.fs ?? nodeJournalFs;
    const dir = journalDir(opts.root, opts.nSesid);
    const out: Array<{ file: string; info: JournalLossInfo }> = [];
    let names: string[];
    try {
        names = await jfs.list(dir);
    } catch {
        return out;
    }
    for (const name of names.filter(n => JOURNAL_LOST_TAIL_RE.test(n)).sort()) {
        const file = path.join(dir, name);
        try {
            const info = JSON.parse((await jfs.readFile(file)).toString('utf8')) as JournalLossInfo;
            if (Number.isSafeInteger(info?.fromSeq) && Number.isSafeInteger(info?.toSeq) && Number.isSafeInteger(info?.records)) out.push({ file, info: { ...info, marker: file } });
        } catch {
            /* an unreadable marker is reported by its name alone */
            out.push({ file, info: { nSesid: opts.nSesid, fromSeq: 0, toSeq: 0, records: 0, bytes: 0, durableSeq: 0, atMs: 0, reason: 'unreadable marker', marker: file } });
        }
    }
    return out;
}

interface PendingRecord {
    result: AppendResult;
    resolve: (r: AppendResult) => void;
    queuedAt: number;
}

export type JournalWriterState = 'ok' | 'failed' | 'closed';

export class RawJournalWriter {
    /** read/repair report from opening an existing journal */
    readonly openReport: JournalReadResult;
    readonly dir: string;

    private readonly jfs: JournalFs;
    private readonly groupWindowMs: number;
    private readonly groupMaxBytes: number;
    private readonly segmentMaxBytes: number;
    private readonly indexEvery: number;
    private readonly writeTimeoutMs: number;
    private readonly nSesid: string;
    private readonly now: Clock;
    private readonly onFailure?: (info: JournalFailureInfo) => void;
    private readonly onRestored?: (info: JournalRestoredInfo) => void;
    /** disk operations the watchdog abandoned that have not settled yet: nothing is rewritten while one may land */
    private readonly hung = new Set<Promise<void>>();
    private lost: JournalLossInfo | null = null;

    private segIndex: number;
    private segName: string;
    private file: JournalFile | null = null;
    /** bytes of the current segment known durable */
    private durableSize: number;

    private nextSeq: number;
    private prevHash: Buffer;
    private lastTRecv: number;
    private durable: JournalHead;

    private pending: PendingRecord[] = [];
    private pendingBytes = 0;
    private timer: NodeJS.Timeout | null = null;
    private flushing: Promise<void> | null = null;
    private undurable: AppendResult[] = [];
    private failure: JournalFailureInfo | null = null;
    private stateValue: JournalWriterState = 'ok';
    private groupsCommitted = 0;

    private constructor(opts: RawJournalWriterOptions, report: JournalReadResult, jfs: JournalFs) {
        this.jfs = jfs;
        this.openReport = report;
        this.dir = report.dir;
        this.groupWindowMs = opts.groupWindowMs ?? JOURNAL_GROUP_WINDOW_MS;
        this.groupMaxBytes = opts.groupMaxBytes ?? JOURNAL_GROUP_MAX_BYTES;
        this.segmentMaxBytes = opts.segmentMaxBytes ?? JOURNAL_SEGMENT_ROLL_BYTES;
        this.indexEvery = opts.indexEvery ?? JOURNAL_INDEX_EVERY;
        this.writeTimeoutMs = opts.writeTimeoutMs ?? JOURNAL_WRITE_TIMEOUT_MS;
        this.nSesid = opts.nSesid;
        this.now = opts.now ?? systemClock;
        this.onFailure = opts.onFailure;
        this.onRestored = opts.onRestored;
        const lastSeg = report.segments[report.segments.length - 1];
        this.segIndex = lastSeg ? segmentNumber(lastSeg.name) : 1;
        this.segName = segmentName(this.segIndex);
        this.durableSize = lastSeg ? lastSeg.size : 0;
        this.nextSeq = report.head.seq + 1;
        this.prevHash = report.head.hash;
        this.lastTRecv = report.head.tRecvMs;
        this.durable = { ...report.head };
    }

    /**
     * Open (creating when missing) the journal of one session. An existing
     * journal is fully verified first; a torn tail of its last segment is
     * truncated and reported in `openReport.tailTruncated`; corruption
     * anywhere else throws JournalCorruptError and nothing is appended.
     */
    static async open(opts: RawJournalWriterOptions): Promise<RawJournalWriter> {
        const jfs = opts.fs ?? nodeJournalFs;
        // A writer configured with larger groups can tear a larger tail.
        const tornTailMaxBytes = opts.tornTailMaxBytes ?? Math.max(JOURNAL_TORN_TAIL_MAX_BYTES, (opts.groupMaxBytes ?? 0) + JOURNAL_HEADER_BYTES + JOURNAL_DATA_SPLIT_BYTES);
        const report = await readJournal({ root: opts.root, nSesid: opts.nSesid, fs: jfs, repair: true, keepFromSeq: Infinity, tornTailMaxBytes });
        await jfs.mkdirp(report.dir);
        const writer = new RawJournalWriter(opts, report, jfs);
        writer.file = await jfs.openAppend(path.join(report.dir, writer.segName));
        if (!report.segments.length) await jfs.syncDir?.(report.dir);
        return writer;
    }

    get state(): JournalWriterState {
        return this.stateValue;
    }

    /** last appended record (durable or not) */
    get head(): JournalHead {
        return { seq: this.nextSeq - 1, hash: this.prevHash, tRecvMs: this.lastTRecv };
    }

    /** last record whose group fdatasync returned */
    get durableHead(): JournalHead {
        return { ...this.durable };
    }

    /** number of group commits (write + fdatasync) so far */
    get groupCommits(): number {
        return this.groupsCommitted;
    }

    get failureInfo(): JournalFailureInfo | null {
        return this.failure;
    }

    /** records appended while degraded, in seq order (raw lane priority 1, MR-5) */
    undurableRecords(): readonly AppendResult[] {
        return this.undurable;
    }

    /** What `close()` could not make durable (null when nothing was lost). */
    get lostOnClose(): JournalLossInfo | null {
        return this.lost;
    }

    /** A disk operation the watchdog abandoned has not returned yet (the disk still hangs). */
    get diskHung(): boolean {
        return this.hung.size > 0;
    }

    /**
     * Append one record. Its seq, tRecv (clamped non-decreasing) and chain
     * position are fixed synchronously, so call order is journal order. The
     * promise resolves once the record's group is durable (durable:true), or
     * at once with durable:false while the writer is failed. It never rejects
     * for I/O; it throws synchronously after close() or for an oversize body.
     */
    append<T extends RecordType>(type: T, body: RecordBodyMap[T], opts: { tRecvMs?: number; flags?: number } = {}): Promise<AppendResult> {
        if (this.stateValue === 'closed') throw new Error('rt-ingest: journal is closed');
        const payload = encodeBody(type, body);
        const tRecvMs = Math.max(Math.trunc(opts.tRecvMs ?? this.now()), this.lastTRecv);
        const seq = this.nextSeq;
        const encoded = encodeRecord({ type, flags: opts.flags ?? 0, seq, tRecvMs, payload });
        const hash = chainNext(this.prevHash, encoded);
        this.nextSeq += 1;
        this.prevHash = hash;
        this.lastTRecv = tRecvMs;
        const result: AppendResult = { seq, hash, tRecvMs, type, flags: opts.flags ?? 0, durable: false, encoded };
        if (this.stateValue === 'failed') {
            this.undurable.push(result);
            return Promise.resolve(result);
        }
        return new Promise<AppendResult>(resolve => {
            this.pending.push({ result, resolve, queuedAt: this.now() });
            this.pendingBytes += encoded.length;
            this.schedule();
        });
    }

    /** Append one TCP chunk as DATA records of at most 64 KB each. */
    appendData(chunk: Buffer, tRecvMs?: number): Promise<AppendResult>[] {
        const out: Promise<AppendResult>[] = [];
        for (let off = 0; off < chunk.length; off += JOURNAL_DATA_SPLIT_BYTES) {
            const piece = chunk.subarray(off, Math.min(chunk.length, off + JOURNAL_DATA_SPLIT_BYTES));
            const more = off + JOURNAL_DATA_SPLIT_BYTES < chunk.length;
            out.push(this.append(RecordType.DATA, Buffer.from(piece), { tRecvMs, flags: more ? JOURNAL_FLAG_CONTINUED : 0 }));
        }
        return out;
    }

    /** Commit everything pending now and wait for it. */
    async flush(): Promise<void> {
        while (this.flushing || this.pending.length) {
            if (!this.flushing) this.startFlush();
            await this.flushing;
        }
    }

    /**
     * Failed state only: truncate the current segment back to its last
     * durable size and rewrite every undurable record. Returns true when the
     * journal is durable again (onRestored fires with the healed range).
     */
    async retryDurability(): Promise<boolean> {
        if (this.stateValue !== 'failed') return this.stateValue === 'ok';
        // A write the watchdog abandoned may still land (O_APPEND, at the end of the file): nothing is truncated or
        // rewritten until it has settled, or the late bytes would follow the rewrite and break the chain.
        if (this.hung.size) return false;
        const fromSeq = this.failure?.fromSeq ?? this.undurable[0]?.seq ?? this.nextSeq;
        try {
            const old = this.file;
            this.file = null;
            if (old) await this.timed(old.close(), null).catch(error => {
                if (error instanceof JournalWriteTimeoutError) throw error;
            });
            const segFile = path.join(this.dir, this.segName);
            await this.timed(this.jfs.truncate(segFile, this.durableSize), null).catch(error => {
                if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
            });
            this.file = await this.timedOpen(segFile);
            // Appends made while this retry awaits also land in `undurable`; loop until drained.
            while (this.undurable.length) {
                await this.writeDurably(this.undurable.slice());
                const durableSeq = this.durable.seq;
                this.undurable = this.undurable.filter(r => r.seq > durableSeq);
            }
        } catch (error) {
            const durableSeq = this.durable.seq;
            this.undurable = this.undurable.filter(r => r.seq > durableSeq);
            this.failure = { error, fromSeq };
            return false;
        }
        this.stateValue = 'ok';
        this.failure = null;
        this.onRestored?.({ fromSeq, toSeq: this.durable.seq });
        return true;
    }

    /**
     * Commit what is pending and close. A degraded journal gets one last rewrite attempt; records that still cannot
     * be written are never dropped silently: they are reported in `lostOnClose` and, when the disk takes it, in a
     * lost-tail marker beside the journal (`readLostTails`) that the next open turns into an incident.
     */
    async close(): Promise<void> {
        if (this.stateValue === 'closed') return;
        await this.flush();
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        if (this.stateValue === 'failed' && this.undurable.length) {
            await this.retryDurability().catch(() => false);
            if (this.stateValue === 'failed' && this.undurable.length) this.lost = await this.recordLoss();
        }
        this.stateValue = 'closed';
        const file = this.file;
        this.file = null;
        if (file) await this.timed(file.close(), null).catch(() => undefined);
    }

    /** The undurable tail at close: its range, and a durable marker file when the disk still takes one. */
    private async recordLoss(): Promise<JournalLossInfo> {
        const recs = this.undurable;
        const error = this.failure?.error;
        const info: JournalLossInfo = {
            nSesid: this.nSesid,
            fromSeq: recs[0].seq,
            toSeq: recs[recs.length - 1].seq,
            records: recs.length,
            bytes: recs.reduce((n, r) => n + r.encoded.length, 0),
            durableSeq: this.durable.seq,
            atMs: this.now(),
            reason: (error as Error)?.message ?? String(error ?? 'journal not writable'),
            marker: null,
        };
        // A disk that still hangs would hang this write too: the caller's alert is all there is then.
        if (this.jfs.writeFileDurably && !this.hung.size) {
            const file = path.join(this.dir, `lost-tail-${info.atMs}-${info.fromSeq}.json`);
            try {
                await this.timed(this.jfs.writeFileDurably(file, Buffer.from(JSON.stringify({ ...info, marker: undefined }), 'utf8')), null);
                info.marker = file;
            } catch {
                /* reported through lostOnClose only */
            }
        }
        return info;
    }

    /**
     * `op` under the watchdog (review 38): rejects with JournalWriteTimeoutError when it has not settled after
     * `writeTimeoutMs`. The operation itself cannot be cancelled: it is remembered in `hung` until it settles, and
     * `abandon` (the file handle it uses) is dropped from the writer and closed once it does.
     */
    private timed<T>(op: Promise<T>, abandon: JournalFile | null, onLate?: (value: T) => Promise<void>): Promise<T> {
        const ms = this.writeTimeoutMs;
        if (!(ms > 0) || !Number.isFinite(ms)) return op;
        return new Promise<T>((resolve, reject) => {
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                if (abandon && this.file === abandon) this.file = null;
                const settled: Promise<void> = op
                    .then(
                        value => onLate?.(value),
                        () => undefined,
                    )
                    .then(() => abandon?.close())
                    .catch(() => undefined)
                    .finally(() => {
                        this.hung.delete(settled);
                    });
                this.hung.add(settled);
                reject(new JournalWriteTimeoutError(ms));
            }, ms);
            timer.unref?.();
            op.then(
                value => {
                    if (timedOut) return;
                    clearTimeout(timer);
                    resolve(value);
                },
                error => {
                    if (timedOut) return;
                    clearTimeout(timer);
                    reject(error);
                },
            );
        });
    }

    /** openAppend under the watchdog; a handle that arrives after the timeout is closed, never used. */
    private timedOpen(file: string): Promise<JournalFile> {
        return this.timed(this.jfs.openAppend(file), null, late => late.close().catch(() => undefined));
    }

    private schedule(): void {
        if (this.flushing || this.stateValue !== 'ok') return;
        if (this.pendingBytes >= this.groupMaxBytes) {
            this.startFlush();
            return;
        }
        if (!this.timer && this.pending.length) {
            const waited = this.now() - this.pending[0].queuedAt;
            this.timer = setTimeout(() => {
                this.timer = null;
                this.startFlush();
            }, Math.max(0, this.groupWindowMs - waited));
        }
    }

    private startFlush(): void {
        if (this.flushing || !this.pending.length) return;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.flushing = this.flushGroup().finally(() => {
            this.flushing = null;
            if (this.pending.length) this.schedule();
        });
    }

    /** Take at most one group (≤ groupMaxBytes, at least one record), write it, fdatasync, release. */
    private async flushGroup(): Promise<void> {
        let take = 0;
        let bytes = 0;
        while (take < this.pending.length && (take === 0 || bytes + this.pending[take].result.encoded.length <= this.groupMaxBytes)) {
            bytes += this.pending[take].result.encoded.length;
            take += 1;
        }
        const batch = this.pending.splice(0, take);
        this.pendingBytes -= bytes;
        if (this.stateValue !== 'ok') {
            this.failBatch(batch, this.failure?.error ?? new Error('journal not writable'));
            return;
        }
        try {
            await this.writeDurably(batch.map(p => p.result));
        } catch (error) {
            this.failBatch(batch, error);
            return;
        }
        for (const p of batch) {
            p.result.durable = true;
            p.resolve(p.result);
        }
    }

    private failBatch(batch: PendingRecord[], error: unknown): void {
        const wasOk = this.stateValue === 'ok';
        this.stateValue = 'failed';
        // Everything not yet durable, in seq order: this batch then whatever queued behind it.
        // A run that was synced before a later run of the same batch failed stays durable.
        const rest = this.pending.splice(0);
        this.pendingBytes = 0;
        const all = [...batch, ...rest];
        const firstLost = all.find(p => p.result.seq > this.durable.seq);
        if (!this.failure) this.failure = { error, fromSeq: firstLost?.result.seq ?? this.nextSeq };
        for (const p of all) {
            if (p.result.seq <= this.durable.seq) {
                p.result.durable = true;
            } else {
                this.undurable.push(p.result);
            }
            p.resolve(p.result);
        }
        if (wasOk) this.onFailure?.(this.failure);
    }

    /** Write records into segments (rolling at segmentMaxBytes), fdatasync each run, then index. */
    private async writeDurably(records: AppendResult[]): Promise<void> {
        let i = 0;
        while (i < records.length) {
            if (this.durableSize > 0 && this.durableSize + records[i].encoded.length > this.segmentMaxBytes) {
                await this.roll();
            }
            // One write = at most one group (or one larger record), so a crash can tear at most one group (MR-4);
            // this also bounds the rewrite of a long undurable tail by retryDurability().
            const run: AppendResult[] = [];
            let runBytes = 0;
            while (
                i < records.length &&
                (run.length === 0 ||
                    (this.durableSize + runBytes + records[i].encoded.length <= this.segmentMaxBytes && runBytes + records[i].encoded.length <= this.groupMaxBytes))
            ) {
                run.push(records[i]);
                runBytes += records[i].encoded.length;
                i += 1;
            }
            if (!this.file) this.file = await this.timedOpen(path.join(this.dir, this.segName));
            // Every disk call runs under the watchdog (review 38): a hung disk fails this group into MR-5 instead of
            // stalling every append behind it. Nothing below runs for a call that timed out (it threw).
            const file = this.file;
            await this.timed(file.write(run.length === 1 ? run[0].encoded : Buffer.concat(run.map(r => r.encoded), runBytes)), file);
            await this.timed(file.datasync(), file);
            this.groupsCommitted += 1;
            const indexLines: string[] = [];
            let off = this.durableSize;
            for (const r of run) {
                off += r.encoded.length;
                if (this.indexEvery > 0 && r.seq % this.indexEvery === 0) {
                    indexLines.push(JSON.stringify({ seq: r.seq, off, h: r.hash.toString('hex') }));
                }
            }
            this.durableSize = off;
            const last = run[run.length - 1];
            this.durable = { seq: last.seq, hash: last.hash, tRecvMs: last.tRecvMs };
            if (indexLines.length) {
                await this.timed(this.jfs.appendText(path.join(this.dir, indexNameFor(this.segName)), indexLines.join('\n') + '\n'), null).catch(error => {
                    if (error instanceof JournalWriteTimeoutError) throw error;
                });
            }
        }
    }

    private async roll(): Promise<void> {
        const old = this.file;
        this.file = null;
        if (old) await this.timed(old.close(), null).catch(error => {
            if (error instanceof JournalWriteTimeoutError) throw error;
        });
        this.segIndex += 1;
        this.segName = segmentName(this.segIndex);
        this.durableSize = 0;
        this.file = await this.timedOpen(path.join(this.dir, this.segName));
        if (this.jfs.syncDir) await this.timed(this.jfs.syncDir(this.dir), null);
    }
}
