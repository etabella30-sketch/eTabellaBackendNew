/**
 * Journal surgery for RECOVER by raw pull-back (spec §5.5 MR-3, MR-4; v1 rule of D19): the box continues the cloud's
 * last applied history, but its journal is behind the cloud raw store, diverges from it after a point, or is
 * corrupt after a point. The records the cloud supplies replace the box's own from the first point where they differ:
 *
 * 1. the box's records from that point (or the bytes from the corruption point) are MOVED ASIDE, never deleted, to
 *    `<journal>/<nSesid>/aside-<ms>/` (forensics; orphan 'F' uploads are Phase 4, D1);
 * 2. the segment holding that point is truncated there, later segments and stale sidecar index entries are removed;
 * 3. the pulled records (already chain-verified against the box's own hash at fromSeq-1 by the caller) are appended
 *    verbatim — after a corruption followed by the box's own intact records that continue them — and fdatasync'd;
 * 4. the whole journal is read back and must verify end to end, ending at the planned head.
 * The writer must be closed while this runs (the kernel closes the session's worker first).
 *
 * What RECOVER never does (D25: every byte the box journaled is kept; a failed, empty or short pull never truncates):
 * move aside a record the box holds unless the cloud supplied a DIFFERENT record at or before its seq. So the plan
 * (`planJournalRewrite`, also run before the session is touched) cuts at the first PROVEN difference, not at fromSeq:
 * - a verified local record whose chain hash equals the cloud's at the same seq is kept as it is; the first one whose
 *   hash differs is the fork (both continue the same hash at seq-1, so the records differ): it and everything after it
 *   are divergent and moved aside (MR-3 step 2);
 * - no fork, and the box holds records past the last pulled one: the cloud holds less than the box → refused
 *   (`RecoverRefusedError`, nothing changes);
 * - a corrupt journal (MR-4) is cut at the corruption. The box's intact records after it are read again (past the bad
 *   bytes); those the cloud also sent must be byte-identical (else that is the fork), and those after the pulled range
 *   are put back when they continue the cloud's chain — checked against the sidecar index and, when a worker held the
 *   journal, the writer's own last hash (`knownHead`). Any local record that would be left out without proof of a
 *   fork refuses the plan: the session stays JOURNAL_CORRUPT and an admin splits (D19, D7), the bytes stay.
 */
import * as fs from 'fs';
import * as path from 'path';

import { chainNext, decodeRecordAt, indexNameFor, JOURNAL_HEADER_BYTES, JOURNAL_MAX_PAYLOAD_BYTES, journalDir, JournalCorruptError, JournalHead, listSegments, readJournal } from '@app/rt-ingest';

export interface JournalScan {
    /** Last verified record (the good head before a corruption). */
    readonly head: JournalHead;
    readonly corrupt: JournalCorruptError | null;
    /** Chain hash (hex) after each wanted seq that the journal holds. */
    readonly hashes: ReadonlyMap<number, string>;
    readonly recordCount: number;
}

/** Read the journal, tolerating corruption (the verified prefix is reported). Never repairs. */
export async function scanJournal(root: string, nSesid: string, wantSeqs: Iterable<number> = []): Promise<JournalScan> {
    const want = new Set(wantSeqs);
    const hashes = new Map<number, string>();
    let count = 0;
    try {
        const res = await readJournal({
            root,
            nSesid,
            repair: false,
            keepFromSeq: Infinity,
            onRecord: rec => {
                count += 1;
                if (want.has(rec.seq)) hashes.set(rec.seq, rec.hash.toString('hex'));
            },
        });
        return { head: res.head, corrupt: null, hashes, recordCount: res.recordCount };
    } catch (err) {
        if (err instanceof JournalCorruptError) return { head: err.goodHead, corrupt: err, hashes, recordCount: count };
        throw err;
    }
}

/** One record of a RECOVER pull, located in `PulledRange.recs`. */
export interface PulledRecord {
    readonly seq: number;
    /** Chain hash after this record. */
    readonly hash: Buffer;
    readonly offset: number;
    readonly size: number;
}

/** What the cloud supplied for RECOVER: records fromSeq.. in order, chain-verified by the caller. */
export interface PulledRange {
    readonly fromSeq: number;
    readonly recs: Buffer;
    readonly records: readonly PulledRecord[];
}

export interface RewriteResult {
    /** Local records moved aside for good (divergent: a fork the cloud's records prove). */
    readonly movedRecords: number;
    /** Bytes copied aside (every byte from the cut point on, put back or not). */
    readonly movedBytes: number;
    readonly asideDir: string | null;
    /** Records appended from the cloud. */
    readonly appended: number;
    /** The box's own records after a corruption, put back after the cloud's (MR-4 repair in place). */
    readonly reattached: number;
    readonly head: JournalHead;
}

/** The rewrite cannot be done as planned (a journal that changed under it, or a result that does not verify). */
export class JournalRewriteError extends Error {
    constructor(message: string) {
        super(`rt-edge kernel: ${message}`);
        this.name = 'JournalRewriteError';
    }
}

/** The pull does not justify replacing anything the box holds: RECOVER is refused and nothing changes. */
export class RecoverRefusedError extends Error {
    constructor(message: string) {
        super(`rt-edge kernel: ${message}`);
        this.name = 'RecoverRefusedError';
    }
}

export interface RewritePlan {
    /** First seq the rewrite replaces. */
    readonly cutSeq: number;
    /** Where that seq starts (or where the journal ends, to append). */
    readonly cut: { readonly segment: string; readonly offset: number };
    /** Index in `PulledRange.records` of the first cloud record appended. */
    readonly appendFrom: number;
    readonly appended: number;
    /** The box's own encoded records put back after the cloud's (in order). */
    readonly reattach: readonly Buffer[];
    readonly movedRecords: number;
    /** The journal head after the rewrite. */
    readonly head: { readonly seq: number; readonly hash: Buffer };
    readonly corrupt: JournalCorruptError | null;
}

export interface RewritePlanInput {
    readonly root: string;
    readonly nSesid: string;
    readonly pulled: PulledRange;
    /** The writer's last durable record when a worker held the journal: the proof that a repair loses nothing. */
    readonly knownHead?: { readonly seq: number; readonly hash: Buffer } | null;
    /** Planning beside a live writer: a group still being written at the end of the last segment is not corruption. */
    readonly tornTailMaxBytes?: number;
}

/** The first segment of a journal that has none yet. */
const FIRST_SEGMENT = 'seg-00001.ej';

/**
 * Decide what a RECOVER would change (see the file header), reading the journal only. Throws `RecoverRefusedError`
 * (nothing may change), `JournalRewriteError` (the journal does not reach fromSeq-1), or the `JournalCorruptError` of
 * a corruption BEFORE fromSeq-1 (RECOVER must start from that verified head instead).
 */
export async function planJournalRewrite(opts: RewritePlanInput): Promise<RewritePlan> {
    const { pulled } = opts;
    const fromSeq = pulled.fromSeq;
    const count = pulled.records.length;
    if (!count) throw new RecoverRefusedError(`the cloud holds nothing from seq ${fromSeq}; the journal is kept`);
    const pulledTo = fromSeq + count - 1;
    const cloudAt = (seq: number): PulledRecord | undefined => (seq >= fromSeq && seq <= pulledTo ? pulled.records[seq - fromSeq] : undefined);
    const cloudBytes = (rec: PulledRecord): Buffer => pulled.recs.subarray(rec.offset, rec.offset + rec.size);
    const pulledHead = { seq: pulledTo, hash: pulled.records[count - 1].hash };
    const dir = journalDir(opts.root, opts.nSesid);

    const seen: { fork: { seq: number; segment: string; offset: number } | null; forked: number } = { fork: null, forked: 0 };
    let head: JournalHead;
    let corrupt: JournalCorruptError | null = null;
    let end: { segment: string; offset: number } | null = null;
    try {
        const res = await readJournal({
            root: opts.root,
            nSesid: opts.nSesid,
            repair: false,
            keepFromSeq: Infinity,
            tornTailMaxBytes: opts.tornTailMaxBytes,
            onRecord: rec => {
                if (rec.seq < fromSeq) return;
                if (!seen.fork) {
                    const cloud = cloudAt(rec.seq);
                    if (!cloud || cloud.hash.equals(rec.hash)) return;
                    seen.fork = { seq: rec.seq, segment: rec.segment!, offset: rec.offset! };
                }
                seen.forked += 1;
            },
        });
        head = res.head;
        const last = res.segments[res.segments.length - 1];
        end = last ? { segment: last.name, offset: last.size } : null;
    } catch (err) {
        if (!(err instanceof JournalCorruptError)) throw err;
        corrupt = err;
        head = err.goodHead;
    }

    const fork = seen.fork;
    if (fork) {
        // MR-3 step 2: the box forked from the cloud at fork.seq; it and everything after it are divergent.
        const tail = corrupt ? await scanTail(dir, corrupt) : [];
        return { cutSeq: fork.seq, cut: { segment: fork.segment, offset: fork.offset }, appendFrom: fork.seq - fromSeq, appended: pulledTo - fork.seq + 1, reattach: [], movedRecords: seen.forked + tail.length, head: pulledHead, corrupt };
    }

    if (!corrupt) {
        if (head.seq > pulledTo) {
            throw new RecoverRefusedError(`the journal matches the cloud's records through seq ${pulledTo} and holds ${head.seq - pulledTo} more the cloud does not have; nothing is moved aside`);
        }
        if (head.seq === pulledTo) throw new RecoverRefusedError(`the journal already holds the cloud's records through seq ${pulledTo}: nothing to recover`);
        if (head.seq + 1 < fromSeq) throw new JournalRewriteError(`journal of ${opts.nSesid} ends at seq ${head.seq}, before seq ${fromSeq - 1}`);
        return { cutSeq: head.seq + 1, cut: end ?? { segment: FIRST_SEGMENT, offset: 0 }, appendFrom: head.seq + 1 - fromSeq, appended: pulledTo - head.seq, reattach: [], movedRecords: 0, head: pulledHead, corrupt: null };
    }

    // MR-4: the journal is corrupt after its verified head g.
    const g = corrupt.goodHead.seq;
    if (g + 1 < fromSeq) throw corrupt; // corrupt before fromSeq-1: RECOVER again from g + 1
    if (g >= pulledTo) {
        throw new RecoverRefusedError(`the cloud's records end at seq ${pulledTo}, inside the journal's verified part (seq ${g}): nothing replaces the corrupt tail, which is kept`);
    }
    const tail = await scanTail(dir, corrupt);
    // The box's intact record at a seq the cloud also sent: the same bytes, or the proof of a fork.
    const sameAsCloud = (rec: TailRecord): boolean => {
        const cloud = cloudAt(rec.seq);
        return !!cloud && cloudBytes(cloud).equals(rec.encoded);
    };
    const forkInTail = tail.some(rec => rec.seq <= pulledTo && !sameAsCloud(rec));
    const known = opts.knownHead && opts.knownHead.seq > g ? opts.knownHead : null;
    const cutAt = { segment: corrupt.segment, offset: corrupt.offset };
    const replaceAll = (): RewritePlan => ({
        cutSeq: g + 1,
        cut: cutAt,
        appendFrom: g + 1 - fromSeq,
        appended: pulledTo - g,
        reattach: [],
        movedRecords: tail.filter(rec => !sameAsCloud(rec)).length,
        head: pulledHead,
        corrupt,
    });
    if (forkInTail) return replaceAll();
    // What the writer wrote at its last durable record against the cloud's copy of the same seq: a difference proves a fork.
    if (known && known.seq <= pulledTo && !cloudAt(known.seq)!.hash.equals(known.hash)) return replaceAll();

    // Put back the box's own records after the pulled range, as long as they continue the cloud's chain.
    const written = await tailIndexHashes(dir, corrupt.segment);
    const reattach: Buffer[] = [];
    let seq = pulledTo;
    let hash = pulledHead.hash;
    let atKnown: Buffer | null = known && known.seq <= pulledTo ? cloudAt(known.seq)!.hash : null;
    let refusal: string | null = null;
    for (const rec of tail) {
        if (rec.seq <= pulledTo) continue;
        if (rec.seq !== seq + 1) break; // a gap: records the box cannot read lie between
        const next = chainNext(hash, rec.encoded);
        const indexed = written.get(rec.seq);
        if (indexed !== undefined && indexed !== next.toString('hex')) {
            refusal = `the box's record ${rec.seq} does not continue the cloud's chain (sidecar index)`;
            break;
        }
        reattach.push(rec.encoded);
        seq = rec.seq;
        hash = next;
        if (known && seq === known.seq) atKnown = next;
    }
    if (known && atKnown && !atKnown.equals(known.hash)) {
        // The writer's own chain at its last record differs from the cloud's records plus the box's tail: the cloud's
        // records after the corruption are not the ones this box wrote (a fork).
        return replaceAll();
    }
    const localMax = Math.max(tail.length ? tail[tail.length - 1].seq : g, known ? known.seq : g);
    if (localMax > seq) {
        throw new RecoverRefusedError(
            `the cloud's records end at seq ${pulledTo}; the box's records ${seq + 1}..${localMax} after the corruption ${refusal ? `cannot be put back (${refusal})` : 'cannot be put back'} and would be lost: the journal is kept`,
        );
    }
    return { cutSeq: g + 1, cut: cutAt, appendFrom: g + 1 - fromSeq, appended: pulledTo - g, reattach, movedRecords: 0, head: { seq, hash }, corrupt };
}

/** Plan (above), then rewrite the journal of a session whose writer is closed. */
export async function rewriteJournalFrom(opts: RewritePlanInput & { readonly nowMs: number }): Promise<RewriteResult> {
    const plan = await planJournalRewrite({ root: opts.root, nSesid: opts.nSesid, pulled: opts.pulled, knownHead: opts.knownHead ?? null });
    const dir = journalDir(opts.root, opts.nSesid);
    const names = listSegments(await fs.promises.readdir(dir).catch(() => [] as string[]));
    const at = plan.cut;

    // 1. Copy aside everything from the cut point on.
    const cutIndex = names.indexOf(at.segment);
    const later = cutIndex >= 0 ? names.slice(cutIndex + 1) : [];
    let movedBytes = 0;
    let asideDir: string | null = null;
    const tailFile = path.join(dir, at.segment);
    const tail = cutIndex >= 0 ? (await fs.promises.readFile(tailFile)).subarray(at.offset) : Buffer.alloc(0);
    if (tail.length || later.length) {
        asideDir = path.join(dir, `aside-${Math.floor(opts.nowMs)}`);
        await fs.promises.mkdir(asideDir, { recursive: true });
        if (tail.length) {
            await fs.promises.writeFile(path.join(asideDir, `${at.segment}.from-${at.offset}`), tail);
            movedBytes += tail.length;
        }
        for (const name of later) {
            const bytes = await fs.promises.readFile(path.join(dir, name));
            await fs.promises.writeFile(path.join(asideDir, name), bytes);
            movedBytes += bytes.length;
        }
    }

    // 2. Truncate the cut segment, drop later segments and stale index hints.
    if (cutIndex >= 0) await fs.promises.truncate(tailFile, at.offset);
    for (const name of later) {
        await fs.promises.rm(path.join(dir, name), { force: true });
        await fs.promises.rm(path.join(dir, indexNameFor(name)), { force: true });
    }
    const idx = path.join(dir, indexNameFor(at.segment));
    const idxText = await fs.promises.readFile(idx, 'utf8').catch(() => null);
    if (idxText !== null) {
        const keep = idxText
            .split('\n')
            .filter(line => {
                if (!line.trim()) return false;
                try {
                    const e = JSON.parse(line);
                    return Number.isSafeInteger(e?.seq) && e.seq < plan.cutSeq && Number(e.off) <= at.offset;
                } catch {
                    return false;
                }
            })
            .map(line => `${line}\n`)
            .join('');
        await fs.promises.writeFile(idx, keep, 'utf8');
    }

    // 3. Append the cloud's records verbatim (then the box's own records put back) and make them durable.
    const first = opts.pulled.records[plan.appendFrom];
    const fromCloud = first ? opts.pulled.recs.subarray(first.offset) : Buffer.alloc(0);
    const append = plan.reattach.length ? Buffer.concat([fromCloud, ...plan.reattach]) : fromCloud;
    if (append.length) {
        await fs.promises.mkdir(dir, { recursive: true });
        const handle = await fs.promises.open(path.join(dir, at.segment), 'a');
        try {
            await handle.write(append);
            await handle.datasync();
        } finally {
            await handle.close();
        }
    }

    // 4. The result must verify end to end and end where the plan said.
    const check = await readJournal({ root: opts.root, nSesid: opts.nSesid, repair: false, keepFromSeq: Infinity });
    if (check.head.seq !== plan.head.seq || !check.head.hash.equals(plan.head.hash)) {
        throw new JournalRewriteError(`rewritten journal of ${opts.nSesid} ends at seq ${check.head.seq}, expected ${plan.head.seq} (the moved bytes are in ${asideDir ?? 'no aside directory'})`);
    }
    return { movedRecords: plan.movedRecords, movedBytes, asideDir, appended: plan.appended, reattached: plan.reattach.length, head: check.head };
}

interface TailRecord {
    readonly seq: number;
    readonly encoded: Buffer;
}

/**
 * The intact records after a corruption point, in journal order with strictly increasing seqs: the corrupt segment
 * from the bad offset, then every later segment. Bad bytes are skipped by searching for the next record that decodes
 * (CRC) with a plausible seq; a still-being-written group at the very end simply ends the scan.
 */
async function scanTail(dir: string, corrupt: JournalCorruptError): Promise<TailRecord[]> {
    const names = listSegments(await fs.promises.readdir(dir).catch(() => [] as string[]));
    const start = names.indexOf(corrupt.segment);
    const out: TailRecord[] = [];
    if (start < 0) return out;
    let last = corrupt.goodHead.seq;
    for (let i = start; i < names.length; i++) {
        const buf = await fs.promises.readFile(path.join(dir, names[i])).catch(() => null);
        if (!buf) continue;
        let off = i === start ? corrupt.offset : 0;
        while (off < buf.length) {
            const d = decodeRecordAt(buf, off);
            if (d.ok && d.record.seq > last) {
                out.push({ seq: d.record.seq, encoded: Buffer.from(buf.subarray(off, off + d.size)) });
                last = d.record.seq;
                off += d.size;
                continue;
            }
            // A stale record (seq not after the last one) is skipped whole; unreadable bytes are searched past.
            const next = d.ok ? off + d.size : resync(buf, off, last);
            if (next < 0) break;
            off = next;
        }
    }
    return out;
}

/** The next offset after `badOffset` where a record with a seq after `lastSeq` decodes; -1 when none. */
function resync(buf: Buffer, badOffset: number, lastSeq: number): number {
    for (let p = badOffset + 1; p + JOURNAL_HEADER_BYTES <= buf.length; p++) {
        const len = buf.readUInt32LE(p);
        if (len > JOURNAL_MAX_PAYLOAD_BYTES || p + JOURNAL_HEADER_BYTES + len > buf.length) continue;
        const seq = buf.readUInt32LE(p + 6) + buf.readUInt32LE(p + 10) * 0x1_0000_0000;
        // At most one record per header's worth of skipped bytes fits between the bad offset and here.
        if (seq <= lastSeq || seq > lastSeq + 1 + Math.floor((p - badOffset) / JOURNAL_HEADER_BYTES)) continue;
        if (decodeRecordAt(buf, p).ok) return p;
    }
    return -1;
}

/** The writer's chain hash (hex) at the sidecar index points of the corrupt segment and every later one. */
async function tailIndexHashes(dir: string, fromSegment: string): Promise<Map<number, string>> {
    const names = listSegments(await fs.promises.readdir(dir).catch(() => [] as string[]));
    const start = names.indexOf(fromSegment);
    const out = new Map<number, string>();
    for (const name of start < 0 ? [] : names.slice(start)) {
        const text = await fs.promises.readFile(path.join(dir, indexNameFor(name)), 'utf8').catch(() => '');
        for (const line of text.split('\n')) {
            if (!line.trim()) continue;
            try {
                const e = JSON.parse(line);
                if (Number.isSafeInteger(e?.seq) && typeof e?.h === 'string') out.set(e.seq, e.h);
            } catch {
                /* an unsynced, half-written hint line is no evidence either way */
            }
        }
    }
    return out;
}
