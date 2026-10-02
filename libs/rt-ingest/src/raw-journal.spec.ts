import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { crc32c } from './crc32c';
import {
    chainNext,
    chainSeed,
    decodeBody,
    decodeRecordAt,
    encodeBody,
    encodeRecord,
    findRecordAfter,
    JOURNAL_DATA_SPLIT_BYTES,
    JOURNAL_FLAG_CONTINUED,
    JOURNAL_GROUP_MAX_BYTES,
    JOURNAL_GROUP_WINDOW_MS,
    JOURNAL_HEADER_BYTES,
    JOURNAL_TORN_TAIL_MAX_BYTES,
    JOURNAL_WRITE_TIMEOUT_MS,
    JournalCorruptError,
    JournalFile,
    JournalFs,
    journalHashAt,
    listSegments,
    nodeJournalFs,
    PHASE4_RECORD_TYPES,
    RawJournalWriter,
    readJournal,
    readLostTails,
    readRawRange,
    RecordType,
    verifyRecordBatch,
} from './raw-journal';

const SES = 'ses-journal-1';
// real file I/O: generous under a parallel full-suite run
jest.setTimeout(30_000);

function tmpRoot(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-journal-'));
}

function segPath(root: string, name = 'seg-00001.ej'): string {
    return path.join(root, SES, name);
}

/** nodeJournalFs with an event log and injectable failures. */
function tracingFs(events: string[], opts: { failDatasync?: () => boolean; holdDatasync?: () => Promise<void> } = {}): JournalFs {
    return {
        ...nodeJournalFs,
        async openAppend(file: string): Promise<JournalFile> {
            const inner = await nodeJournalFs.openAppend(file);
            return {
                async write(data: Buffer) {
                    events.push(`write:${data.length}`);
                    await inner.write(data);
                },
                async datasync() {
                    if (opts.holdDatasync) await opts.holdDatasync();
                    if (opts.failDatasync?.()) {
                        events.push('datasync:fail');
                        throw Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' });
                    }
                    events.push('datasync');
                    await inner.datasync();
                },
                close: () => inner.close(),
            };
        },
    };
}

/** In-memory JournalFs: no disk latency, an observable datasync gate. */
function memoryFs(): JournalFs & { files: Map<string, Buffer>; syncing: number; gate: Promise<void> | null } {
    const files = new Map<string, Buffer>();
    const mem = {
        files,
        syncing: 0,
        gate: null as Promise<void> | null,
        async mkdirp() {
            /* directories are implicit */
        },
        async list(dir: string) {
            return [...files.keys()].filter(f => path.dirname(f) === dir).map(f => path.basename(f));
        },
        async readFile(file: string) {
            const b = files.get(file);
            if (!b) throw Object.assign(new Error(`ENOENT ${file}`), { code: 'ENOENT' });
            return Buffer.from(b);
        },
        async openAppend(file: string): Promise<JournalFile> {
            if (!files.has(file)) files.set(file, Buffer.alloc(0));
            return {
                write: async (data: Buffer) => {
                    files.set(file, Buffer.concat([files.get(file)!, data]));
                },
                datasync: async () => {
                    mem.syncing += 1;
                    if (mem.gate) await mem.gate;
                },
                close: async () => undefined,
            };
        },
        async truncate(file: string, size: number) {
            files.set(file, files.get(file)!.subarray(0, size));
        },
        async appendText(file: string, text: string) {
            files.set(file, Buffer.concat([files.get(file) ?? Buffer.alloc(0), Buffer.from(text)]));
        },
    };
    return mem;
}

const tick = () => new Promise(resolve => setImmediate(resolve));

describe('raw journal record codec (spec §5.1)', () => {
    it('encodes u32 len | u8 type | u8 flags | u64 seq | i64 tRecvMs | u32 crc32c | payload, little-endian, with no epoch', () => {
        const payload = Buffer.from('abc');
        const enc = encodeRecord({ type: RecordType.DATA, flags: JOURNAL_FLAG_CONTINUED, seq: 258, tRecvMs: 1_700_000_000_123, payload });
        expect(JOURNAL_HEADER_BYTES).toBe(26);
        expect(enc.length).toBe(26 + 3);
        expect(enc.readUInt32LE(0)).toBe(3);
        expect(enc.readUInt8(4)).toBe(0x01);
        expect(enc.readUInt8(5)).toBe(JOURNAL_FLAG_CONTINUED);
        expect(enc.readBigUInt64LE(6)).toBe(258n);
        expect(enc.readBigInt64LE(14)).toBe(1_700_000_000_123n);
        // crc32c covers type..payload, i.e. bytes 4..22 then the payload (not len, not the crc itself)
        const expected = crc32c(enc.subarray(26), crc32c(enc.subarray(4, 22)));
        expect(enc.readUInt32LE(22)).toBe(expected);
        expect(enc.subarray(26).toString()).toBe('abc');
    });

    it('round-trips every record kind, including the Phase-4 REBASE_* records', () => {
        const bodies: Array<[RecordType, any]> = [
            [RecordType.SESSION_HEADER, { nSesid: SES, nCaseid: 'c1', nLines: 25, tz: 'Asia/Kolkata', parserVer: '1.0.0', fmt: 1, createdAt: 5 }],
            [RecordType.EPOCH, { epoch: 1, owner: 'edge' }],
            [RecordType.CTX_SET, { protocol: 'B' }],
            [RecordType.CONN_OPEN, { connId: 'l-1', remote: '10.0.0.5:5000', user: 'alok', mode: 'listen' }],
            [RecordType.DATA, Buffer.from([0x02, 0x4e, 0x01, 0x03, 0x41])],
            [RecordType.CONN_CLOSE, { connId: 'l-1', reason: 'superseded' }],
            [RecordType.INCIDENT, { kind: 'TAIL_TRUNCATED', level: 'info', fromSeq: 3, note: 'x' }],
            [RecordType.REBASE_BEGIN, { reason: 'switch', rev: 4, totalLines: 50, root: 'aa', parserVer: '1.0.0', fmt: 1, baseSeq: 9, anchorIdsDigest: 'bb', crLinePolicy: 'slice' }],
            [RecordType.REBASE_PAGE, { p: 1, lines: [['00:00:01:00', [65], 0]] }],
            [RecordType.REBASE_END, { root: 'aa', idSeq: 3 }],
            [RecordType.SESSION_END, { endedBy: 'cloud', at: 99 }],
        ];
        let seq = 0;
        for (const [type, body] of bodies) {
            seq += 1;
            const enc = encodeRecord({ type, flags: 0, seq, tRecvMs: 1000 + seq, payload: encodeBody(type, body) });
            const dec = decodeRecordAt(enc, 0);
            expect(dec.ok).toBe(true);
            if (dec.ok === false) return;
            expect(dec.size).toBe(enc.length);
            expect(dec.record.type).toBe(type);
            expect(dec.record.seq).toBe(seq);
            expect(dec.record.tRecvMs).toBe(1000 + seq);
            expect(decodeBody(dec.record)).toEqual(body);
        }
        expect([...PHASE4_RECORD_TYPES].sort()).toEqual([RecordType.REBASE_BEGIN, RecordType.REBASE_PAGE, RecordType.REBASE_END].sort());
    });

    it('rejects a flipped payload byte, an unknown type, a huge len and a short buffer', () => {
        const enc = encodeRecord({ type: RecordType.DATA, flags: 0, seq: 1, tRecvMs: 1, payload: Buffer.from('hello') });
        const flipped = Buffer.from(enc);
        flipped[28] ^= 0xff;
        expect(decodeRecordAt(flipped, 0)).toEqual({ ok: false, reason: 'crc' });
        const badType = Buffer.from(enc);
        badType[4] = 0x7f;
        expect(decodeRecordAt(badType, 0)).toEqual({ ok: false, reason: 'type' });
        const hugeLen = Buffer.from(enc);
        hugeLen.writeUInt32LE(0xffffffff, 0);
        expect(decodeRecordAt(hugeLen, 0)).toEqual({ ok: false, reason: 'len' });
        expect(decodeRecordAt(enc.subarray(0, 10), 0)).toEqual({ ok: false, reason: 'short' });
        expect(decodeRecordAt(enc.subarray(0, enc.length - 1), 0)).toEqual({ ok: false, reason: 'short' });
        const badLen = Buffer.from(enc);
        badLen.writeUInt32LE(2, 0); // shorter len: CRC no longer matches
        expect(decodeRecordAt(badLen, 0).ok).toBe(false);
    });

    it('chains h0 = sha256("EJ1"||nSesid), h_n = sha256(h_{n-1}||record_n) and verifies batches all-or-nothing', () => {
        expect(chainSeed(SES).toString('hex')).toBe(createHash('sha256').update('EJ1' + SES).digest('hex'));
        const recs = [1, 2, 3].map(seq => encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: seq, payload: Buffer.from(`r${seq}`) }));
        let h = chainSeed(SES);
        for (const r of recs) h = chainNext(h, r);
        const ok = verifyRecordBatch(Buffer.concat(recs), 1, chainSeed(SES));
        expect(ok.ok).toBe(true);
        if (ok.ok === true) {
            expect(ok.toSeq).toBe(3);
            expect(ok.hash.equals(h)).toBe(true);
        }
        expect(verifyRecordBatch(Buffer.concat([recs[0], recs[2]]), 1, chainSeed(SES))).toMatchObject({ ok: false, reason: 'gap', expectSeq: 2 });
        const torn = Buffer.concat(recs).subarray(0, 60);
        expect(verifyRecordBatch(torn, 1, chainSeed(SES))).toMatchObject({ ok: false, reason: 'trailing' });
        const corrupt = Buffer.concat(recs);
        corrupt[27] ^= 1; // payload of record 1 (26-byte header + 'r1')
        expect(verifyRecordBatch(corrupt, 1, chainSeed(SES))).toMatchObject({ ok: false, reason: 'crc', expectSeq: 1 });
    });
});

describe('RawJournalWriter + readJournal', () => {
    let root: string;
    beforeEach(() => {
        root = tmpRoot();
    });
    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('appends, makes durable, and reads back the same records and chain head', async () => {
        const w = await RawJournalWriter.open({ root, nSesid: SES });
        const a = w.append(RecordType.SESSION_HEADER, { nSesid: SES, nCaseid: null, nLines: 25, tz: null, parserVer: '1.0.0', fmt: 1, createdAt: 1 }, { tRecvMs: 10 });
        const b = w.append(RecordType.DATA, Buffer.from('hello'), { tRecvMs: 11 });
        const c = w.append(RecordType.DATA, Buffer.from('world'), { tRecvMs: 5 }); // clamped to 11
        const results = await Promise.all([a, b, c]);
        expect(results.map(r => r.durable)).toEqual([true, true, true]);
        expect(results.map(r => r.seq)).toEqual([1, 2, 3]);
        expect(results[2].tRecvMs).toBe(11);
        expect(w.durableHead.seq).toBe(3);
        await w.close();
        expect(() => w.append(RecordType.DATA, Buffer.from('x'))).toThrow(/closed/);

        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(r => r.seq)).toEqual([1, 2, 3]);
        expect(read.records.map(r => r.tRecvMs)).toEqual([10, 11, 11]);
        expect(read.head.hash.equals(results[2].hash)).toBe(true);
        expect(read.tailTruncated).toBeNull();
        expect(decodeBody(read.records[1])).toEqual(Buffer.from('hello'));
    });

    it('reopens an existing journal and continues the seq and the chain', async () => {
        const w1 = await RawJournalWriter.open({ root, nSesid: SES });
        await w1.append(RecordType.DATA, Buffer.from('one'), { tRecvMs: 1 });
        await w1.close();
        const w2 = await RawJournalWriter.open({ root, nSesid: SES });
        expect(w2.head.seq).toBe(1);
        const r = await w2.append(RecordType.DATA, Buffer.from('two'), { tRecvMs: 2 });
        expect(r.seq).toBe(2);
        await w2.close();
        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(x => decodeBody(x).toString())).toEqual(['one', 'two']);
    });

    it('splits a TCP chunk into ≤64 KB DATA records flagged CONTINUED except the last', async () => {
        const w = await RawJournalWriter.open({ root, nSesid: SES });
        const chunk = Buffer.alloc(JOURNAL_DATA_SPLIT_BYTES * 2 + 10, 0x41);
        const res = await Promise.all(w.appendData(chunk, 7));
        expect(res.map(r => r.flags)).toEqual([JOURNAL_FLAG_CONTINUED, JOURNAL_FLAG_CONTINUED, 0]);
        await w.close();
        const read = await readJournal({ root, nSesid: SES });
        expect(Buffer.concat(read.records.map(r => r.payload)).equals(chunk)).toBe(true);
    });

    it('group fdatasync: a burst of appends inside the 10 ms window shares one write + datasync', async () => {
        const events: string[] = [];
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: tracingFs(events) });
        const all = Array.from({ length: 100 }, (_, i) => w.append(RecordType.DATA, Buffer.from(`k${i}`), { tRecvMs: i }));
        const res = await Promise.all(all);
        expect(res.every(r => r.durable)).toBe(true);
        expect(events.filter(e => e === 'datasync').length).toBe(1);
        expect(events.filter(e => e.startsWith('write:')).length).toBe(1);
        expect(w.groupCommits).toBe(1);
        await w.close();
    });

    it('commits early at 64 KB, and in more groups when the burst is larger', async () => {
        const events: string[] = [];
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: tracingFs(events), groupWindowMs: 10_000 });
        const t0 = Date.now();
        // 3 × 40 KB: the 64 KB cap forces the first two commits without waiting for the (long) window;
        // the remainder is under the cap and is committed by the window (or a flush).
        const all = [0, 1, 2].map(i => w.append(RecordType.DATA, Buffer.alloc(40 * 1024, i), { tRecvMs: i }));
        const firstTwo = await Promise.all(all.slice(0, 2));
        expect(Date.now() - t0).toBeLessThan(8_000); // far below the 10 s window: the 64 KB cap committed them
        expect(firstTwo.every(r => r.durable)).toBe(true);
        expect(events.filter(e => e === 'datasync').length).toBe(2);
        await w.flush();
        expect((await all[2]).durable).toBe(true);
        expect(events.filter(e => e === 'datasync').length).toBe(3);
        await w.close();
    });

    it('releases a record only after its group fdatasync returned (WAL before anything downstream)', async () => {
        const events: string[] = [];
        let release!: () => void;
        const gate = new Promise<void>(resolve => (release = resolve));
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: tracingFs(events, { holdDatasync: () => gate }), groupWindowMs: 1 });
        let resolved = false;
        const p = w.append(RecordType.DATA, Buffer.from('x')).then(r => {
            events.push('released');
            resolved = true;
            return r;
        });
        await new Promise(resolve => setTimeout(resolve, 30));
        expect(resolved).toBe(false);
        expect(w.durableHead.seq).toBe(0);
        release();
        const r = await p;
        expect(r.durable).toBe(true);
        expect(events.indexOf('datasync')).toBeLessThan(events.indexOf('released'));
        await w.close();
    });

    it('D25 "fsync ≤10 ms before parse": the default group window is 10 ms and a lone record schedules its commit within it', async () => {
        expect(JOURNAL_GROUP_WINDOW_MS).toBe(10);
        const mem = memoryFs();
        const w = await RawJournalWriter.open({ root: path.join(root, 'mem'), nSesid: SES, fs: mem }); // default window
        const delays: number[] = [];
        const realSetTimeout = global.setTimeout;
        const spy = jest.spyOn(global, 'setTimeout').mockImplementation(((fn: (...a: any[]) => void, ms?: number, ...rest: any[]) => {
            delays.push(ms ?? 0);
            return realSetTimeout(fn, ms, ...rest);
        }) as typeof setTimeout);
        let durable = false;
        const t0 = Date.now();
        try {
            durable = (await w.append(RecordType.DATA, Buffer.from('lone'))).durable;
        } finally {
            spy.mockRestore();
        }
        expect(durable).toBe(true);
        // The one group timer, at the window. The others are the disk watchdog of the write and the fdatasync.
        expect(delays.filter(ms => ms !== JOURNAL_WRITE_TIMEOUT_MS)).toEqual([10]);
        expect(delays.filter(ms => ms === JOURNAL_WRITE_TIMEOUT_MS)).toHaveLength(2);
        expect(Date.now() - t0).toBeLessThan(1_000);
        expect(mem.syncing).toBe(1);
        await w.close();
    });

    it('a record queued behind a running commit waits only the REST of its 10 ms window, not a new one', async () => {
        let now = 1_000;
        const mem = memoryFs();
        let release!: () => void;
        mem.gate = new Promise<void>(resolve => (release = resolve));
        const w = await RawJournalWriter.open({ root: path.join(root, 'mem'), nSesid: SES, fs: mem, now: () => now });
        const delays: number[] = [];
        const realSetTimeout = global.setTimeout;
        const spy = jest.spyOn(global, 'setTimeout').mockImplementation(((fn: (...a: any[]) => void, ms?: number, ...rest: any[]) => {
            delays.push(ms ?? 0);
            return realSetTimeout(fn, ms, ...rest);
        }) as typeof setTimeout);
        try {
            const a = w.append(RecordType.DATA, Buffer.from('a'));
            while (mem.syncing === 0) await tick(); // a's commit is in its (gated) fdatasync
            const b = w.append(RecordType.DATA, Buffer.from('b')); // queued at t=1000 while a commits: no timer yet
            now += 7;
            mem.gate = null;
            release();
            await a;
            await b;
        } finally {
            spy.mockRestore();
        }
        expect(delays.filter(ms => ms !== JOURNAL_WRITE_TIMEOUT_MS)).toEqual([10, 3]); // b had already waited 7 of its 10 ms (the rest: disk watchdogs)
        expect(mem.syncing).toBe(2);
        await w.close();
    });

    it('rolls segments, writes the sidecar index, and serves raw ranges and hashes from it', async () => {
        const w = await RawJournalWriter.open({ root, nSesid: SES, segmentMaxBytes: 300, indexEvery: 4 });
        const hashes: Buffer[] = [];
        for (let i = 1; i <= 30; i++) {
            const r = await w.append(RecordType.DATA, Buffer.from(`record-${String(i).padStart(3, '0')}`), { tRecvMs: i });
            hashes[i] = r.hash;
        }
        await w.close();
        const names = listSegments(fs.readdirSync(path.join(root, SES)));
        expect(names.length).toBeGreaterThan(3);
        expect(fs.readdirSync(path.join(root, SES)).some(n => n.endsWith('.idx'))).toBe(true);

        const range = await readRawRange({ root, nSesid: SES, fromSeq: 10, toSeq: 14 });
        expect(range).not.toBeNull();
        expect(range!.fromSeq).toBe(10);
        expect(range!.toSeq).toBe(14);
        expect(range!.prevHash.equals(hashes[9])).toBe(true);
        expect(range!.hash.equals(hashes[14])).toBe(true);
        const check = verifyRecordBatch(range!.recs, 10, hashes[9]);
        expect(check.ok).toBe(true);

        const capped = await readRawRange({ root, nSesid: SES, fromSeq: 1, maxBytes: 100 });
        expect(capped!.count).toBeGreaterThanOrEqual(1);
        expect(capped!.recs.length).toBeLessThanOrEqual(100);

        expect((await journalHashAt({ root, nSesid: SES, seq: 22 }))!.equals(hashes[22])).toBe(true);
        expect((await journalHashAt({ root, nSesid: SES, seq: 0 }))!.equals(chainSeed(SES))).toBe(true);
        expect(await journalHashAt({ root, nSesid: SES, seq: 99 })).toBeNull();
        expect(await readRawRange({ root, nSesid: SES, fromSeq: 31 })).toBeNull();

        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.length).toBe(30);
        expect(read.segments.length).toBe(names.length);
    });
});

describe('torn tail vs mid-file corruption (MR-4)', () => {
    let root: string;
    beforeEach(() => {
        root = tmpRoot();
    });
    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    async function writeRecords(n: number, opts: { segmentMaxBytes?: number; indexEvery?: number; size?: number } = {}): Promise<Buffer[]> {
        const w = await RawJournalWriter.open({ root, nSesid: SES, segmentMaxBytes: opts.segmentMaxBytes, indexEvery: opts.indexEvery ?? 0 });
        const hashes: Buffer[] = [];
        for (let i = 1; i <= n; i++) hashes[i] = (await w.append(RecordType.DATA, Buffer.alloc(opts.size ?? 20, i % 250), { tRecvMs: i })).hash;
        await w.close();
        return hashes;
    }

    it('truncates only the torn tail of the LAST segment, reports it, and the writer continues', async () => {
        const hashes = await writeRecords(5);
        const file = segPath(root);
        const goodSize = fs.statSync(file).size;
        const partial = encodeRecord({ type: RecordType.DATA, flags: 0, seq: 6, tRecvMs: 6, payload: Buffer.from('torn-record') }).subarray(0, 15);
        fs.appendFileSync(file, partial);

        const ro = await readJournal({ root, nSesid: SES, repair: false });
        expect(ro.tailTruncated).toMatchObject({ segment: 'seg-00001.ej', offset: goodSize, bytes: 15, reason: 'short' });
        expect(fs.statSync(file).size).toBe(goodSize + 15); // repair:false leaves the file alone

        const w = await RawJournalWriter.open({ root, nSesid: SES });
        expect(w.openReport.tailTruncated).toMatchObject({ offset: goodSize, bytes: 15 });
        expect(fs.statSync(file).size).toBe(goodSize);
        expect(w.head.seq).toBe(5);
        expect(w.head.hash.equals(hashes[5])).toBe(true);
        expect((await w.append(RecordType.DATA, Buffer.from('after'))).seq).toBe(6);
        await w.close();
        expect((await readJournal({ root, nSesid: SES })).records.length).toBe(6);
    });

    it('treats a garbage tail (bad CRC) of the last segment as torn', async () => {
        await writeRecords(3);
        fs.appendFileSync(segPath(root), Buffer.alloc(40, 0xab));
        const read = await readJournal({ root, nSesid: SES });
        expect(read.tailTruncated).not.toBeNull();
        expect(read.records.length).toBe(3);
    });

    it('a bad CRC in an earlier segment is JOURNAL_CORRUPT, even at that segment\'s very end', async () => {
        await writeRecords(20, { segmentMaxBytes: 200 });
        const names = listSegments(fs.readdirSync(path.join(root, SES)));
        expect(names.length).toBeGreaterThan(2);
        const first = segPath(root, names[0]);
        const buf = fs.readFileSync(first);
        buf[buf.length - 3] ^= 0xff; // last record of the first segment
        fs.writeFileSync(first, buf);
        await expect(readJournal({ root, nSesid: SES })).rejects.toBeInstanceOf(JournalCorruptError);
        await expect(RawJournalWriter.open({ root, nSesid: SES })).rejects.toMatchObject({ code: 'JOURNAL_CORRUPT', segment: names[0] });
        // nothing was truncated
        expect(fs.readFileSync(first).length).toBe(buf.length);
    });

    it('a bad CRC in the middle of the last segment, beyond the torn-tail window, is JOURNAL_CORRUPT', async () => {
        await writeRecords(20, { size: 20_000 }); // ~400 KB in one segment
        const file = segPath(root);
        const buf = fs.readFileSync(file);
        buf[100] ^= 0xff; // inside record 1
        fs.writeFileSync(file, buf);
        let error: JournalCorruptError | null = null;
        try {
            await readJournal({ root, nSesid: SES });
        } catch (e) {
            error = e as JournalCorruptError;
        }
        expect(error).toBeInstanceOf(JournalCorruptError);
        expect(error!.offset).toBe(0);
        expect(error!.expectSeq).toBe(1);
        expect(error!.goodHead.seq).toBe(0);
    });

    it('a bad record before the index-confirmed offset of the last segment is corrupt, not torn', async () => {
        await writeRecords(8, { indexEvery: 2 });
        const file = segPath(root);
        const buf = fs.readFileSync(file);
        buf[30] ^= 0xff; // record 1, well before the last index point
        fs.writeFileSync(file, buf);
        await expect(readJournal({ root, nSesid: SES })).rejects.toBeInstanceOf(JournalCorruptError);
    });

    it('a bad record that valid records follow, in a small last segment, is corrupt (it was synced): nothing is truncated', async () => {
        const w = await RawJournalWriter.open({ root, nSesid: SES }); // default index every 256: no index point yet
        for (let i = 1; i <= 50; i++) await w.append(RecordType.DATA, Buffer.alloc(40, i), { tRecvMs: i }); // 50 group commits
        expect(w.groupCommits).toBe(50);
        await w.close();
        const file = segPath(root);
        const buf = fs.readFileSync(file);
        expect(buf.length).toBeLessThan(JOURNAL_TORN_TAIL_MAX_BYTES); // the size bound alone cannot tell
        const rec10 = 9 * (JOURNAL_HEADER_BYTES + 40);
        buf[rec10 + JOURNAL_HEADER_BYTES + 5] ^= 0xff;
        fs.writeFileSync(file, buf);
        let error: JournalCorruptError | null = null;
        try {
            await readJournal({ root, nSesid: SES, repair: false });
        } catch (e) {
            error = e as JournalCorruptError;
        }
        expect(error).toBeInstanceOf(JournalCorruptError);
        expect(error).toMatchObject({ segment: 'seg-00001.ej', offset: rec10, expectSeq: 10 });
        expect(error!.goodHead.seq).toBe(9);
        expect(error!.reason).toMatch(/followed by a valid record/);
        await expect(RawJournalWriter.open({ root, nSesid: SES })).rejects.toMatchObject({ code: 'JOURNAL_CORRUPT', offset: rec10 });
        expect(fs.readFileSync(file).equals(buf)).toBe(true);
    });

    it('a damaged record with more than one synced group after it is corrupt, however close to the end (D25)', async () => {
        const w = await RawJournalWriter.open({ root, nSesid: SES, groupWindowMs: 10_000 });
        const all: Promise<unknown>[] = [];
        for (let i = 1; i <= 200; i++) {
            all.push(w.append(RecordType.DATA, Buffer.alloc(1000, i % 250), { tRecvMs: i }));
            if (i % 10 === 0) await w.flush();
        }
        await Promise.all(all);
        expect(w.groupCommits).toBe(20);
        expect(w.durableHead.seq).toBe(200);
        await w.close();
        const file = segPath(root);
        const buf = fs.readFileSync(file);
        const rec50 = 49 * (JOURNAL_HEADER_BYTES + 1000);
        expect(buf.length - rec50).toBeGreaterThan(JOURNAL_GROUP_MAX_BYTES); // ~150 KB: well over one group
        buf[rec50 + 500] ^= 0x01;
        fs.writeFileSync(file, buf);
        await expect(readJournal({ root, nSesid: SES, repair: false })).rejects.toMatchObject({ code: 'JOURNAL_CORRUPT', offset: rec50, expectSeq: 50 });
        await expect(RawJournalWriter.open({ root, nSesid: SES })).rejects.toBeInstanceOf(JournalCorruptError);
        expect(fs.readFileSync(file).length).toBe(buf.length);
    });

    it('torn tails a crash really leaves are still truncated: zero fill, and a group cut inside its last record', async () => {
        const hashes = await writeRecords(5);
        const file = segPath(root);
        const good = fs.statSync(file).size;
        fs.appendFileSync(file, Buffer.alloc(4096)); // size extended, data never written
        const zero = await readJournal({ root, nSesid: SES });
        expect(zero.tailTruncated).toMatchObject({ offset: good, bytes: 4096, reason: 'type' });
        expect(zero.head.hash.equals(hashes[5])).toBe(true);
        expect(fs.statSync(file).size).toBe(good);

        // the in-flight group: two complete records, then the third cut short
        const group = [6, 7, 8].map(seq => encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: seq, payload: Buffer.alloc(20, seq) }));
        const cut = Buffer.concat([group[0], group[1], group[2].subarray(0, 30)]);
        fs.appendFileSync(file, cut);
        const torn = await readJournal({ root, nSesid: SES });
        expect(torn.head.seq).toBe(7); // complete records are kept; only the cut one goes
        expect(torn.tailTruncated).toMatchObject({ offset: good + group[0].length + group[1].length, bytes: 30, reason: 'short' });
    });

    it('a hole inside the last group followed by valid records is reported corrupt, never silently dropped', async () => {
        await writeRecords(5);
        const file = segPath(root);
        const group = [6, 7].map(seq => encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: seq, payload: Buffer.alloc(20, seq) }));
        const holed = Buffer.from(group[0]);
        holed.fill(0, 0, 16); // the first page of the write never reached the disk
        fs.appendFileSync(file, Buffer.concat([holed, group[1]]));
        await expect(readJournal({ root, nSesid: SES, repair: false })).rejects.toThrow(/followed by a valid record/);
    });

    it('readRawRange: a torn tail ends the range; a damaged record that valid records follow throws instead of stopping silently', async () => {
        await writeRecords(30);
        const file = segPath(root);
        fs.appendFileSync(file, encodeRecord({ type: RecordType.DATA, flags: 0, seq: 31, tRecvMs: 31, payload: Buffer.from('in-flight') }).subarray(0, 12));
        expect(await readRawRange({ root, nSesid: SES, fromSeq: 25 })).toMatchObject({ fromSeq: 25, toSeq: 30, count: 6 });
        const buf = fs.readFileSync(file);
        buf[9 * (JOURNAL_HEADER_BYTES + 20) + JOURNAL_HEADER_BYTES + 3] ^= 0xff; // record 10
        fs.writeFileSync(file, buf);
        await expect(readRawRange({ root, nSesid: SES, fromSeq: 5 })).rejects.toBeInstanceOf(JournalCorruptError);
        await expect(readRawRange({ root, nSesid: SES, fromSeq: 20 })).rejects.toMatchObject({ code: 'JOURNAL_CORRUPT', expectSeq: 10 });
    });

    it('findRecordAfter: skips garbage and zeros in linear time, and only accepts a seq that can continue the sequence', () => {
        const rec = (seq: number) => encodeRecord({ type: RecordType.DATA, flags: 0, seq, tRecvMs: seq, payload: Buffer.from(`r${seq}`) });
        expect(findRecordAfter(Buffer.alloc(200_000), 0, 1)).toBe(-1);
        const garbage = Buffer.alloc(40, 0xab);
        expect(findRecordAfter(Buffer.concat([garbage, rec(7)]), 0, 7)).toBe(40);
        expect(findRecordAfter(Buffer.concat([garbage, rec(8)]), 0, 7)).toBe(40); // one record may hide in 40 bytes
        expect(findRecordAfter(Buffer.concat([garbage, rec(9)]), 0, 7)).toBe(-1); // two cannot
        expect(findRecordAfter(Buffer.concat([garbage, rec(6)]), 0, 7)).toBe(-1); // an older seq is not a continuation
    });

    it('a CRC-valid record that breaks the seq is a chain break (corrupt)', async () => {
        await writeRecords(3);
        fs.appendFileSync(segPath(root), encodeRecord({ type: RecordType.DATA, flags: 0, seq: 9, tRecvMs: 9, payload: Buffer.from('x') }));
        await expect(readJournal({ root, nSesid: SES })).rejects.toThrow(/breaks the sequence/);
    });

    it('a sidecar index that disagrees with the chain is corrupt', async () => {
        await writeRecords(8, { indexEvery: 4 });
        const idx = path.join(root, SES, 'seg-00001.idx');
        const lines = fs.readFileSync(idx, 'utf8').trim().split('\n').map(l => JSON.parse(l));
        lines[0].h = '0'.repeat(64);
        fs.writeFileSync(idx, lines.map(l => JSON.stringify(l)).join('\n') + '\n');
        await expect(readJournal({ root, nSesid: SES })).rejects.toThrow(/sidecar index/);
    });
});

describe('degraded durability (MR-5)', () => {
    let root: string;
    beforeEach(() => {
        root = tmpRoot();
    });
    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('keeps seq and chain in memory when fdatasync fails, then rewrites them on retry', async () => {
        const events: string[] = [];
        let failing = false;
        const failures: any[] = [];
        const restored: any[] = [];
        const w = await RawJournalWriter.open({
            root,
            nSesid: SES,
            fs: tracingFs(events, { failDatasync: () => failing }),
            onFailure: info => failures.push(info),
            onRestored: info => restored.push(info),
        });
        const ok = await w.append(RecordType.DATA, Buffer.from('durable'), { tRecvMs: 1 });
        expect(ok.durable).toBe(true);

        failing = true;
        const r2 = await w.append(RecordType.DATA, Buffer.from('lost-1'), { tRecvMs: 2 });
        const r3 = await w.append(RecordType.DATA, Buffer.from('lost-2'), { tRecvMs: 3 });
        expect(w.state).toBe('failed');
        expect([r2.durable, r3.durable]).toEqual([false, false]);
        expect([r2.seq, r3.seq]).toEqual([2, 3]);
        expect(failures).toHaveLength(1);
        expect(failures[0].fromSeq).toBe(2);
        expect(w.undurableRecords().map(r => r.seq)).toEqual([2, 3]);
        expect(w.durableHead.seq).toBe(1);

        expect(await w.retryDurability()).toBe(false); // still failing
        failing = false;
        expect(await w.retryDurability()).toBe(true);
        expect(w.state).toBe('ok');
        expect(restored).toEqual([{ fromSeq: 2, toSeq: 3 }]);
        expect(w.undurableRecords()).toHaveLength(0);
        const r4 = await w.append(RecordType.DATA, Buffer.from('after'), { tRecvMs: 4 });
        expect(r4.durable).toBe(true);
        await w.close();

        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(r => decodeBody(r).toString())).toEqual(['durable', 'lost-1', 'lost-2', 'after']);
        expect(read.head.hash.equals(r4.hash)).toBe(true);
    });

    it('rewrites a long undurable tail one group per write + fdatasync, so a crash mid-retry can tear at most one group', async () => {
        const events: string[] = [];
        let failing = true;
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: tracingFs(events, { failDatasync: () => failing }) });
        const piece = (i: number) => Buffer.alloc(40 * 1024, i);
        for (let i = 0; i < 5; i++) await w.append(RecordType.DATA, piece(i), { tRecvMs: i });
        expect(w.state).toBe('failed');
        expect(w.undurableRecords()).toHaveLength(5);
        failing = false;
        events.length = 0;
        expect(await w.retryDurability()).toBe(true);
        const writes = events.filter(e => e.startsWith('write:')).map(e => Number(e.slice(6)));
        expect(writes).toHaveLength(5); // 40 KB records: no two fit in one 64 KB group
        expect(writes.every(n => n <= JOURNAL_GROUP_MAX_BYTES + JOURNAL_HEADER_BYTES)).toBe(true);
        expect(events.filter(e => e === 'datasync')).toHaveLength(5);
        // each write is followed by its own datasync before the next write
        expect(events.join(',')).toMatch(/^(write:\d+,datasync,?)+$/);
        await w.close();
        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(r => r.payload[0])).toEqual([0, 1, 2, 3, 4]);
    });

    it('a disk that HANGS: the watchdog fails the group (MR-5), appends go on undurable, and the late write never lands after the rewrite (review 38)', async () => {
        let hang = false;
        let release!: () => void;
        const held = new Promise<void>(resolve => (release = resolve));
        const failures: any[] = [];
        const restored: any[] = [];
        const hangingFs: JournalFs = {
            ...nodeJournalFs,
            async openAppend(file: string): Promise<JournalFile> {
                const inner = await nodeJournalFs.openAppend(file);
                return {
                    write: data => inner.write(data),
                    async datasync() {
                        if (hang) await held; // never errors: it just does not return
                        await inner.datasync();
                    },
                    close: () => inner.close(),
                };
            },
        };
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: hangingFs, writeTimeoutMs: 60, onFailure: i => failures.push(i), onRestored: i => restored.push(i) });
        expect((await w.append(RecordType.DATA, Buffer.from('one'), { tRecvMs: 1 })).durable).toBe(true);

        hang = true;
        const t0 = Date.now();
        const r2 = await w.append(RecordType.DATA, Buffer.from('two'), { tRecvMs: 2 });
        expect(Date.now() - t0).toBeLessThan(5_000); // the watchdog, not the disk, released it
        expect(r2.durable).toBe(false);
        expect(w.state).toBe('failed');
        expect(failures).toHaveLength(1);
        expect(failures[0]).toMatchObject({ fromSeq: 2 });
        expect(failures[0].error).toMatchObject({ code: 'JOURNAL_WRITE_TIMEOUT' });
        expect(String(failures[0].error.message)).toContain('write timeout');
        // Appends keep their seq and chain and resolve at once (the parser and the room view go on, MR-5).
        const r3 = await w.append(RecordType.DATA, Buffer.from('three'), { tRecvMs: 3 });
        expect([r3.seq, r3.durable]).toEqual([3, false]);
        expect(w.undurableRecords().map(r => r.seq)).toEqual([2, 3]);
        // Nothing is rewritten while the abandoned write may still land.
        expect(w.diskHung).toBe(true);
        expect(await w.retryDurability()).toBe(false);

        hang = false;
        release(); // the hung fdatasync returns late: its bytes are at the end of the segment
        for (let i = 0; i < 200 && w.diskHung; i++) await new Promise(resolve => setTimeout(resolve, 5));
        expect(w.diskHung).toBe(false);
        expect(await w.retryDurability()).toBe(true);
        expect(restored).toEqual([{ fromSeq: 2, toSeq: 3 }]);
        const r4 = await w.append(RecordType.DATA, Buffer.from('four'), { tRecvMs: 4 });
        expect(r4.durable).toBe(true);
        await w.close();
        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(r => decodeBody(r).toString())).toEqual(['one', 'two', 'three', 'four']);
        expect(read.head.hash.equals(r4.hash)).toBe(true);
    });

    it('close() of a degraded journal writes the undurable tail when the disk takes it again (review 30)', async () => {
        const events: string[] = [];
        let failing = false;
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: tracingFs(events, { failDatasync: () => failing }) });
        await w.append(RecordType.DATA, Buffer.from('a'), { tRecvMs: 1 });
        failing = true;
        for (const s of ['b', 'c', 'd']) await w.append(RecordType.DATA, Buffer.from(s), { tRecvMs: 2 });
        expect(w.state).toBe('failed');
        failing = false; // space freed, but no retry ran before the stop
        await w.close();
        expect(w.lostOnClose).toBeNull();
        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(r => decodeBody(r).toString())).toEqual(['a', 'b', 'c', 'd']);
        expect(await readLostTails({ root, nSesid: SES })).toEqual([]);
    });

    it('close() that still cannot write never drops the tail silently: lostOnClose and a lost-tail marker (review 30)', async () => {
        let failingNow = false;
        // A full disk refuses the write itself: the bytes never reach the file.
        const fullFs: JournalFs = {
            ...nodeJournalFs,
            async openAppend(file: string): Promise<JournalFile> {
                const inner = await nodeJournalFs.openAppend(file);
                return {
                    async write(data: Buffer) {
                        if (failingNow) throw Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' });
                        await inner.write(data);
                    },
                    datasync: () => inner.datasync(),
                    close: () => inner.close(),
                };
            },
        };
        const w = await RawJournalWriter.open({ root, nSesid: SES, fs: fullFs, now: () => 5_000 });
        await w.append(RecordType.DATA, Buffer.from('kept'), { tRecvMs: 1 });
        failingNow = true;
        await w.append(RecordType.DATA, Buffer.from('lost-1'), { tRecvMs: 2 });
        await w.append(RecordType.DATA, Buffer.from('lost-2'), { tRecvMs: 3 });
        await w.close();
        const lost = w.lostOnClose!;
        expect(lost).toMatchObject({ nSesid: SES, fromSeq: 2, toSeq: 3, records: 2, durableSeq: 1, atMs: 5_000 });
        expect(lost.reason).toContain('ENOSPC');
        expect(lost.marker).toBe(path.join(root, SES, 'lost-tail-5000-2.json'));
        const markers = await readLostTails({ root, nSesid: SES });
        expect(markers).toHaveLength(1);
        expect(markers[0].info).toMatchObject({ fromSeq: 2, toSeq: 3, records: 2, durableSeq: 1 });
        // The marker holds numbers only, never record content.
        expect(fs.readFileSync(lost.marker!, 'utf8')).not.toContain('lost-1');
        // The journal itself ends at the durable head, unchanged.
        const read = await readJournal({ root, nSesid: SES });
        expect(read.records.map(r => decodeBody(r).toString())).toEqual(['kept']);
    });
});
