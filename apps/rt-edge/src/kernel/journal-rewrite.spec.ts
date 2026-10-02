import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { chainNext, chainSeed, encodeRecord, JournalCorruptError, readJournal, RecordType, verifyRecordBatch } from '@app/rt-ingest';

import { planJournalRewrite, PulledRange, RecoverRefusedError, rewriteJournalFrom } from './journal-rewrite';

const SES = 'ses-rewrite-1';

function rec(seq: number, tag = 'box'): Buffer {
    return encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: 1000 + seq, payload: Buffer.from(`${tag} line ${seq}`) });
}

function recs(from: number, to: number, tag = 'box'): Buffer[] {
    const out: Buffer[] = [];
    for (let seq = from; seq <= to; seq++) out.push(rec(seq, tag));
    return out;
}

/** Chain hash after record `upTo` of a journal whose records are `all` (seq 1..). */
function hashAfter(all: readonly Buffer[], upTo: number): Buffer {
    let h = chainSeed(SES);
    for (let i = 0; i < upTo; i++) h = chainNext(h, all[i]);
    return h;
}

/** What the cloud would send for RECOVER from `fromSeq`, chain-verified against the box's hash at fromSeq-1. */
function pulled(fromSeq: number, cloudRecs: readonly Buffer[], prev: Buffer): PulledRange {
    const buf = Buffer.concat(cloudRecs);
    const check = verifyRecordBatch(buf, fromSeq, prev);
    if (check.ok === false) throw new Error(`bad fixture: ${check.reason}`);
    return { fromSeq, recs: buf, records: check.records.map(r => ({ seq: r.seq, hash: r.hash, offset: r.offset!, size: r.size })) };
}

describe('RECOVER journal rewrite: never move aside what the cloud does not replace (D25, MR-3, MR-4)', () => {
    let root: string;
    let dir: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-rewrite-'));
        dir = path.join(root, SES);
        fs.mkdirSync(dir, { recursive: true });
    });

    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

    /** Segments of whole records: seg-00001.ej, seg-00002.ej, … */
    function writeSegments(...segments: Buffer[][]): void {
        segments.forEach((records, i) => fs.writeFileSync(path.join(dir, `seg-${String(i + 1).padStart(5, '0')}.ej`), Buffer.concat(records)));
    }

    /** Every file of the session directory with its bytes (aside directories included). */
    function snapshot(): Record<string, string> {
        const out: Record<string, string> = {};
        const walk = (d: string): void => {
            for (const name of fs.readdirSync(d)) {
                const p = path.join(d, name);
                if (fs.statSync(p).isDirectory()) walk(p);
                else out[path.relative(dir, p)] = fs.readFileSync(p).toString('base64');
            }
        };
        walk(dir);
        return out;
    }

    /** Flip one payload byte of record `seq` inside a segment built from `records` (its CRC then fails). */
    function corrupt(segment: string, records: readonly Buffer[], seq: number): void {
        const file = path.join(dir, segment);
        const bytes = fs.readFileSync(file);
        let off = 0;
        for (const r of records) {
            if (r.readUInt32LE(6) === seq) {
                bytes[off + 26] ^= 0xff;
                fs.writeFileSync(file, bytes);
                return;
            }
            off += r.length;
        }
        throw new Error(`no record ${seq} in ${segment}`);
    }

    const rewrite = (range: PulledRange, knownHead: { seq: number; hash: Buffer } | null = null) => rewriteJournalFrom({ root, nSesid: SES, pulled: range, knownHead, nowMs: 1_700_000_000_000 });

    it('a short pull whose records the box already holds (the cloud is behind the box) is refused and changes nothing', async () => {
        const box = recs(1, 10);
        writeSegments(box);
        const before = snapshot();
        const short = pulled(4, box.slice(3, 7), hashAfter(box, 3)); // the cloud holds 4..7, the box 1..10
        await expect(planJournalRewrite({ root, nSesid: SES, pulled: short })).rejects.toThrow(RecoverRefusedError);
        await expect(rewrite(short)).rejects.toThrow(/holds 3 more the cloud does not have/);
        const exact = pulled(4, box.slice(3, 10), hashAfter(box, 3));
        await expect(rewrite(exact)).rejects.toThrow(/nothing to recover/);
        expect(snapshot()).toEqual(before);
    });

    it('an empty pull is refused and changes nothing', async () => {
        const box = recs(1, 6);
        writeSegments(box);
        const before = snapshot();
        await expect(rewrite({ fromSeq: 4, recs: Buffer.alloc(0), records: [] })).rejects.toThrow(/holds nothing from seq 4/);
        expect(snapshot()).toEqual(before);
    });

    it('a box behind the cloud gets only the records it lacks; the records it shares are not touched', async () => {
        const cloudRecs = recs(1, 9);
        writeSegments(cloudRecs.slice(0, 5));
        const res = await rewrite(pulled(4, cloudRecs.slice(3), hashAfter(cloudRecs, 3)));
        expect(res).toMatchObject({ movedRecords: 0, appended: 4, reattached: 0, asideDir: null, head: { seq: 9 } });
        expect(res.head.hash.equals(hashAfter(cloudRecs, 9))).toBe(true);
    });

    it('a fork is cut where the records first differ: the divergent rest is moved aside, the shared prefix stays', async () => {
        const box = recs(1, 10);
        const cloudRecs = [...box.slice(0, 5), ...recs(6, 8, 'cloud')];
        writeSegments(box);
        const res = await rewrite(pulled(4, cloudRecs.slice(3), hashAfter(box, 3)));
        expect(res).toMatchObject({ movedRecords: 5, appended: 3, head: { seq: 8 } });
        expect(res.head.hash.equals(hashAfter(cloudRecs, 8))).toBe(true);
        const aside = fs.readdirSync(res.asideDir!);
        expect(aside).toEqual(['seg-00001.ej.from-' + box.slice(0, 5).reduce((n, r) => n + r.length, 0)]);
        expect(fs.readFileSync(path.join(res.asideDir!, aside[0])).equals(Buffer.concat(box.slice(5)))).toBe(true);
    });

    describe('a corrupt journal (MR-4) is repaired in place', () => {
        const box = recs(1, 20);
        const seg1 = box.slice(0, 10);
        const seg2 = box.slice(10);

        it('the cloud replaces the corrupt record and the box keeps its own later records (the cloud holds fewer)', async () => {
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 8);
            await expect(readJournal({ root, nSesid: SES, repair: false })).rejects.toThrow(JournalCorruptError);
            const range = pulled(8, box.slice(7, 12), hashAfter(box, 7)); // the cloud raw store holds 8..12 only
            const res = await rewrite(range, { seq: 20, hash: hashAfter(box, 20) });
            expect(res).toMatchObject({ movedRecords: 0, appended: 5, reattached: 8, head: { seq: 20 } });
            expect(res.head.hash.equals(hashAfter(box, 20))).toBe(true);
            const j = await readJournal({ root, nSesid: SES, repair: false });
            expect(j.records.map(r => r.payload.toString())).toEqual(box.map((_, i) => `box line ${i + 1}`));
        });

        it('without a writer head (boot) the intact tail is put back as well', async () => {
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 8);
            const res = await rewrite(pulled(8, box.slice(7, 9), hashAfter(box, 7)));
            expect(res).toMatchObject({ appended: 2, reattached: 11, head: { seq: 20 } });
        });

        it('a second unreadable record after the pulled range would lose the records behind it: refused, nothing changes', async () => {
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 8);
            corrupt('seg-00002.ej', seg2, 15);
            const before = snapshot();
            await expect(rewrite(pulled(8, box.slice(7, 12), hashAfter(box, 7)))).rejects.toThrow(/records 15\.\.20 after the corruption cannot be put back/);
            expect(snapshot()).toEqual(before);
        });

        it('a writer head the box records cannot reach (records it never wrote to disk readable) is refused', async () => {
            writeSegments(seg1, seg2.slice(0, 4)); // the disk holds 1..14, the writer says it wrote 1..20
            corrupt('seg-00001.ej', seg1, 8);
            const before = snapshot();
            await expect(rewrite(pulled(8, box.slice(7, 12), hashAfter(box, 7)), { seq: 20, hash: hashAfter(box, 20) })).rejects.toThrow(RecoverRefusedError);
            expect(snapshot()).toEqual(before);
        });

        it('the cloud holding nothing past the verified head, or nothing at all, is refused', async () => {
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 8);
            const before = snapshot();
            await expect(rewrite(pulled(5, box.slice(4, 7), hashAfter(box, 4)))).rejects.toThrow(/inside the journal's verified part/);
            await expect(rewrite({ fromSeq: 8, recs: Buffer.alloc(0), records: [] })).rejects.toThrow(RecoverRefusedError);
            expect(snapshot()).toEqual(before);
        });

        it('proof of a fork — a different record from the cloud, or a writer head the cloud does not reproduce — moves the box tail aside (MR-3)', async () => {
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 8);
            const cloudRecs = [...box.slice(0, 8), ...recs(9, 12, 'cloud')];
            const res = await rewrite(pulled(8, cloudRecs.slice(7), hashAfter(box, 7)));
            expect(res).toMatchObject({ movedRecords: 12, appended: 5, reattached: 0, head: { seq: 12 } }); // 9..20 are not the cloud's
            expect(res.head.hash.equals(hashAfter(cloudRecs, 12))).toBe(true);

            fs.rmSync(dir, { recursive: true, force: true });
            fs.mkdirSync(dir, { recursive: true });
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 8);
            const theirs = [...box.slice(0, 7), rec(8, 'cloud'), ...box.slice(8)];
            const wrote = await rewrite(pulled(8, theirs.slice(7, 9), hashAfter(box, 7)), { seq: 20, hash: hashAfter(box, 20) });
            expect(wrote).toMatchObject({ movedRecords: 11, reattached: 0, head: { seq: 9 } });
        });

        it('a corruption before fromSeq-1 is reported as such (RECOVER must start from its verified head)', async () => {
            writeSegments(seg1, seg2);
            corrupt('seg-00001.ej', seg1, 4);
            const before = snapshot();
            await expect(rewrite(pulled(8, box.slice(7, 12), hashAfter(box, 7)))).rejects.toThrow(JournalCorruptError);
            expect(snapshot()).toEqual(before);
        });
    });
});
