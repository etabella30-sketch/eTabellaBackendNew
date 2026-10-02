/**
 * EdgeRawStoreService on a temp directory: the cloud copy of the raw journal (append, chain check, fsync
 * before ack, reload, torn tail, corruption, segment roll, write failure, pull-back) and held direct streams
 * (orphan 'H'). The DB is the in-memory fake; nothing leaves the machine.
 */
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { JournalFs, nodeJournalFs, readCaptureBuffer, readJournal, RecordType, verifyRecordBatch } from '@app/rt-ingest';

import { EdgeRawStoreService, UnconfiguredEdgeArchive } from './edge-raw-store.service';
import { EdgeRegistryService } from './edge-registry.service';
import { BoxSim, deviceKey, FakeConfig, FakeEdgeDb, FakeRedis, IDS, rmTemp, tempDir } from './edge-test-kit.spec';

describe('EdgeRawStoreService', () => {
    let dir: string;
    let config: FakeConfig;
    let db: FakeEdgeDb;
    let registry: EdgeRegistryService;
    const key = deviceKey();
    const make = (extra: Record<string, unknown> = {}) => new EdgeRawStoreService(db as any, config as any, registry, undefined, { clock: () => 1_800_000_000_000, ...extra } as any);

    beforeAll(() => Logger.overrideLogger(false));
    beforeEach(() => {
        dir = tempDir('raw');
        config = new FakeConfig({ EDGE_JOURNAL_DIR: path.join(dir, 'journal'), EDGE_CAPTURE_DIR: path.join(dir, 'captures') });
        db = new FakeEdgeDb();
        db.addSession({ nSesid: IDS.ses });
        registry = new EdgeRegistryService(db as any, new FakeRedis() as any, config as any, { server: null }, undefined, undefined, async () => undefined, {});
    });
    afterEach(() => rmTemp(dir));

    const box = () => {
        const b = new BoxSim(IDS.ses, key).arm().connOpen();
        b.addLines(3);
        b.incident('CAT_DISCONNECT', 'info');
        b.end();
        return b;
    };

    it('starts empty at h0, appends a verified batch, fsyncs, acks, and indexes incidents, SESSION_END and feed records', async () => {
        const store = make();
        const b = box();
        await store.ensureLoaded(IDS.ses);
        expect(store.head(IDS.ses)).toEqual({ seq: 0, hash: b.hashes[0] });
        expect(store.hasFeedRecords(IDS.ses)).toBe(false);
        expect(await store.append(IDS.ses, 1, b.rawBatch(1))).toEqual({ ackedSeq: 6, ackedHash: b.hashes[6] });
        expect(store.hashAt(IDS.ses, 4)).toBe(b.hashes[4]);
        expect(store.hashAt(IDS.ses, 7)).toBeUndefined();
        expect(store.hashAt(IDS.ses, -1)).toBeUndefined();
        expect(store.incidents(IDS.ses)).toEqual([{ kind: 'CAT_DISCONNECT', level: 'info', note: 'test CAT_DISCONNECT' }]);
        expect(store.isSessionEndAt(IDS.ses, 6)).toBe(true);
        expect(store.isSessionEndAt(IDS.ses, 5)).toBe(false);
        expect(store.hasFeedRecords(IDS.ses)).toBe(true);
        const report = await readJournal({ root: path.join(dir, 'journal'), nSesid: IDS.ses, repair: false });
        expect(report.head.seq).toBe(6);
        expect(report.head.hash.toString('hex')).toBe(b.hashes[6]);
    });

    it('reloads the same head, hashes and indexes in a new process', async () => {
        const b = box();
        await make().append(IDS.ses, 1, b.rawBatch(1));
        const again = make();
        await again.ensureLoaded(IDS.ses);
        expect(again.head(IDS.ses)).toEqual({ seq: 6, hash: b.hashes[6] });
        expect(again.incidents(IDS.ses)).toHaveLength(1);
        expect(again.isSessionEndAt(IDS.ses, 6)).toBe(true);
        expect(again.isCorrupt(IDS.ses)).toBeNull();
        expect(await again.append(IDS.ses, 1, b.rawBatch(5))).toEqual({ ackedSeq: 6, ackedHash: b.hashes[6] });
    });

    it('truncates a torn tail of the last segment on load (never acked) and continues from the durable head', async () => {
        const b = box();
        await make().append(IDS.ses, 1, b.rawBatch(1, 4));
        const seg = path.join(dir, 'journal', IDS.ses, 'seg-00001.ej');
        fs.appendFileSync(seg, b.rawBatch(5, 6).recs.subarray(0, 20));
        const store = make();
        await store.ensureLoaded(IDS.ses);
        expect(store.head(IDS.ses).seq).toBe(4);
        expect(await store.append(IDS.ses, 1, b.rawBatch(5))).toEqual({ ackedSeq: 6, ackedHash: b.hashes[6] });
        expect((await readJournal({ root: path.join(dir, 'journal'), nSesid: IDS.ses, repair: false })).head.seq).toBe(6);
    });

    it('halts the raw lane of a journal corrupt outside the torn tail (P1), refusing appends and pulls', async () => {
        const b = box();
        await make({ rawSegmentRollBytes: 200 }).append(IDS.ses, 1, b.rawBatch(1));
        const names = fs.readdirSync(path.join(dir, 'journal', IDS.ses)).filter(n => n.endsWith('.ej')).sort();
        expect(names.length).toBeGreaterThan(1);
        const first = path.join(dir, 'journal', IDS.ses, names[0]);
        const bytes = fs.readFileSync(first);
        bytes[bytes.length - 1] ^= 0xff;
        fs.writeFileSync(first, bytes);
        const store = make();
        await store.ensureLoaded(IDS.ses);
        expect(store.isCorrupt(IDS.ses)).toMatch(/corrupt|bad record/);
        expect(registry.recentAlerts().find(a => a.kind === 'CLOUD_JOURNAL_CORRUPT')).toMatchObject({ tier: 'P1', critical: true });
        expect(await store.append(IDS.ses, 1, b.rawBatch(1))).toMatchObject({ reason: 'chain' });
        // C6: a code of its own (the box's RECOVER_FAILED names it), never the NOT_FOUND of "nothing more".
        expect(await store.pull(IDS.ses, 1, 2)).toEqual({ ok: false, code: 'CLOUD_JOURNAL_CORRUPT' });
    });

    it('rolls segments at the configured size, and readers see one continuous chain', async () => {
        const b = new BoxSim(IDS.ses, key).arm().connOpen();
        for (let k = 0; k < 10; k++) b.addLines(2);
        const store = make({ rawSegmentRollBytes: 300 });
        expect(await store.append(IDS.ses, 1, b.rawBatch(1, 6))).toMatchObject({ ackedSeq: 6 });
        expect(await store.append(IDS.ses, 1, b.rawBatch(7))).toMatchObject({ ackedSeq: b.headSeq });
        const segs = fs.readdirSync(path.join(dir, 'journal', IDS.ses)).filter(n => n.endsWith('.ej'));
        expect(segs.length).toBeGreaterThan(2);
        const report = await readJournal({ root: path.join(dir, 'journal'), nSesid: IDS.ses, repair: false });
        expect(report.head.hash.toString('hex')).toBe(b.headHash);
        const reloaded = make({ rawSegmentRollBytes: 300 });
        expect(await reloaded.append(IDS.ses, 1, b.rawBatch(b.headSeq))).toMatchObject({ ackedSeq: b.headSeq });
    });

    it('nacks rate (P1) when the disk write fails, truncates the partial write, and a retry continues the chain', async () => {
        let failNext = true;
        const flaky: JournalFs = {
            ...nodeJournalFs,
            async openAppend(file) {
                const h = await nodeJournalFs.openAppend(file);
                return {
                    async write(data: Buffer) {
                        if (failNext) {
                            failNext = false;
                            await h.write(data.subarray(0, 10));
                            throw new Error('ENOSPC');
                        }
                        await h.write(data);
                    },
                    datasync: () => h.datasync(),
                    close: () => h.close(),
                };
            },
        };
        const b = box();
        const store = make({ journalFs: flaky });
        expect(await store.append(IDS.ses, 1, b.rawBatch(1))).toEqual({ expectSeq: 1, reason: 'rate', retryAfterMs: 5000 });
        expect(registry.recentAlerts().find(a => a.kind === 'CLOUD_RAW_WRITE')?.tier).toBe('P1');
        expect(store.head(IDS.ses).seq).toBe(0);
        expect(await store.append(IDS.ses, 1, b.rawBatch(1))).toEqual({ ackedSeq: 6, ackedHash: b.hashes[6] });
        expect((await readJournal({ root: path.join(dir, 'journal'), nSesid: IDS.ses, repair: false })).head.seq).toBe(6);
    });

    it('nacks malformed batches: empty, not a buffer, oversize, toSeq that does not match the records', async () => {
        const store = make();
        const b = box();
        expect(await store.append(IDS.ses, 1, { ...b.rawBatch(1), recs: Buffer.alloc(0) })).toEqual({ expectSeq: 1, reason: 'gap' });
        expect(await store.append(IDS.ses, 1, { ...b.rawBatch(1), recs: 'x' as any })).toEqual({ expectSeq: 1, reason: 'gap' });
        expect(await store.append(IDS.ses, 1, { ...b.rawBatch(1), recs: Buffer.alloc(300 * 1024) })).toEqual({ expectSeq: 1, reason: 'rate', retryAfterMs: 1000 });
        expect(await store.append(IDS.ses, 1, { ...b.rawBatch(1, 2), toSeq: 3 })).toEqual({ expectSeq: 1, reason: 'gap' });
        expect(await store.append(IDS.ses, 1, { ...b.rawBatch(1, 2), recs: Buffer.concat([b.rawBatch(1, 2).recs, Buffer.from([1, 2, 3])]) })).toEqual({ expectSeq: 1, reason: 'crc' });
    });

    it('accepts a Uint8Array batch (socket.io may deliver one) and serializes concurrent appends', async () => {
        const store = make();
        const b = box();
        const one = b.rawBatch(1, 3);
        const two = b.rawBatch(4, 6);
        const [r1, r2] = await Promise.all([store.append(IDS.ses, 1, { ...one, recs: new Uint8Array(one.recs) }), store.append(IDS.ses, 1, two)]);
        expect(r1).toEqual({ ackedSeq: 3, ackedHash: b.hashes[3] });
        expect(r2).toEqual({ ackedSeq: 6, ackedHash: b.hashes[6] });
    });

    it('notifies advance listeners after a durable append only', async () => {
        const store = make();
        const seen: number[] = [];
        store.onAdvance((_s, h) => seen.push(h.seq));
        const b = box();
        await store.append(IDS.ses, 1, b.rawBatch(1, 2));
        await store.append(IDS.ses, 1, b.rawBatch(1, 2));
        await store.append(IDS.ses, 1, b.rawBatch(5, 6));
        expect(seen).toEqual([2]);
    });

    it('serves pull-back ranges that verify against the chain, bounded by the head', async () => {
        const store = make();
        const b = box();
        await store.append(IDS.ses, 1, b.rawBatch(1));
        const pulled: any = await store.pull(IDS.ses, 3, 5);
        expect(pulled.toSeq).toBe(5);
        expect(verifyRecordBatch(Buffer.from(pulled.recs), 3, Buffer.from(b.hashes[2], 'hex')).ok).toBe(true);
        expect(((await store.pull(IDS.ses, 5, 99)) as any).toSeq).toBe(6);
        expect(await store.pull(IDS.ses, 0, 2)).toEqual({ ok: false, code: 'NOT_FOUND' });
    });

    it('C6: answers past its head with an empty, well-formed reply (toSeq = fromSeq - 1 and the chain hash there)', async () => {
        const store = make();
        const b = box();
        await store.append(IDS.ses, 1, b.rawBatch(1));
        const end: any = await store.pull(IDS.ses, 7, 9);
        expect(end).toEqual({ recs: Buffer.alloc(0), toSeq: 6, hash: b.hashes[6] });
        expect(end.recs).toBeInstanceOf(Uint8Array);
        // Further past the head: the head's own position (the cloud has no hash for fromSeq - 1).
        expect(await store.pull(IDS.ses, 20, 30)).toEqual({ recs: Buffer.alloc(0), toSeq: 6, hash: b.hashes[6] });
        // An empty store: h0.
        await expect(make().pull(IDS.ses2, 1, 5)).resolves.toEqual({ recs: Buffer.alloc(0), toSeq: 0, hash: new BoxSim(IDS.ses2, key).hashes[0] });
        expect(registry.recentAlerts().find(a => a.kind === 'CLOUD_JOURNAL_CORRUPT')).toBeUndefined();
    });

    it('C6: a disk that no longer holds what the verified index says answers CLOUD_JOURNAL_CORRUPT (P1), not NOT_FOUND', async () => {
        const store = make({ rawSegmentRollBytes: 200 });
        const b = box();
        await store.append(IDS.ses, 1, b.rawBatch(1));
        const segDir = path.join(dir, 'journal', IDS.ses);
        const names = fs.readdirSync(segDir).filter(n => n.endsWith('.ej')).sort();
        // A record in the middle damaged after the load: the read fails verification.
        const first = path.join(segDir, names[0]);
        const bytes = fs.readFileSync(first);
        bytes[bytes.length - 1] ^= 0xff;
        fs.writeFileSync(first, bytes);
        expect(await store.pull(IDS.ses, 1, 6)).toEqual({ ok: false, code: 'CLOUD_JOURNAL_CORRUPT' });
        expect(registry.recentAlerts().find(a => a.kind === 'CLOUD_JOURNAL_CORRUPT')).toMatchObject({ tier: 'P1', nSesid: IDS.ses });
        // Segments gone under the index: indexed, not on disk.
        for (const n of names) fs.rmSync(path.join(segDir, n));
        expect(await store.pull(IDS.ses, 2, 6)).toEqual({ ok: false, code: 'CLOUD_JOURNAL_CORRUPT' });
    });

    it('says whether a session index is in memory, without loading it', async () => {
        const store = make();
        expect(store.isLoaded(IDS.ses)).toBe(false);
        expect(store.loadedSessions()).toEqual([]);
        await store.ensureLoaded(IDS.ses.toUpperCase());
        expect(store.isLoaded(IDS.ses)).toBe(true);
        await store.forget(IDS.ses);
        expect(store.isLoaded(IDS.ses)).toBe(false);
    });

    describe('held direct streams (orphan H)', () => {
        it('records the stream as a pending orphan, alerts P1, captures only the bytes it is given, and updates the orphan at close', async () => {
            const store = make();
            const held = await store.openHeldStream({ nSesid: IDS.ses, user: 'courtroom-1', peer: '203.0.113.9', connId: 'h-1' });
            expect(registry.recentAlerts().find(a => a.kind === 'HELD_DIRECT_STREAM')).toMatchObject({ tier: 'P1', nSesid: IDS.ses });
            expect(held.write(Buffer.from('\x02T10:00:00\x03hello'))).toBe(true);
            const meta = await held.close('eclipse closed');
            expect(await held.close()).toBe(meta);
            expect(meta).toMatchObject({ kind: 'H', bytes: 16, user: 'courtroom-1', peer: '203.0.113.9' });
            const inserts = db.callsOf('rtedge_orphan_insert');
            expect(inserts).toHaveLength(2);
            expect(inserts[0]).toMatchObject({ nOrphanid: held.nOrphanid, nSesid: IDS.ses, cKind: 'H', cUser: 'courtroom-1', cPeer: '203.0.113.9', nBytes: 0 });
            expect(inserts[1]).toMatchObject({ nOrphanid: held.nOrphanid, nBytes: 16, cSha256: meta.sha256 });
            expect(inserts[1].dTo).toBeDefined();
            const file = path.join(dir, 'captures', IDS.ses, meta.file);
            const records = readCaptureBuffer(fs.readFileSync(file), IDS.ses);
            expect(records.map(r => r.type)).toEqual([RecordType.CONN_OPEN, RecordType.DATA, RecordType.CONN_CLOSE]);
            expect(fs.readFileSync(file).includes(Buffer.from('password'))).toBe(false);
            expect(held.write(Buffer.from('late'))).toBe(false);
        });

        it("runs a stream's records in order: a close within one DB round trip of the open waits for the open's insert (review #13)", async () => {
            const store = make();
            const order: string[] = [];
            const real = db.executeRef.bind(db);
            let first = true;
            jest.spyOn(db, 'executeRef').mockImplementation(async (name: string, params: any) => {
                if (name !== 'rtedge_orphan_insert') return real(name, params);
                order.push(`start:${params.nBytes}`);
                // The open's insert is slow (one DB round trip); the close arrives meanwhile.
                if (first) {
                    first = false;
                    await new Promise(res => setTimeout(res, 300));
                }
                const res = await real(name, params);
                order.push(`end:${params.nBytes}`);
                return res;
            });
            const held = await store.openHeldStream({ nSesid: IDS.ses, user: 'courtroom-1', peer: '203.0.113.9', connId: 'h-2' });
            held.write(Buffer.from('abc'));
            const meta = await held.close('wrong host');
            expect(order).toEqual(['start:0', 'end:0', 'start:3', 'end:3']);
            expect(db.orphans.get(held.nOrphanid)).toMatchObject({ nBytes: 3, cSha256: meta.sha256 });
            expect(db.callsOf('rtedge_orphan_insert')[1]).toMatchObject({ nOrphanid: held.nOrphanid, nBytes: 3, cSha256: meta.sha256 });
        });

        it('retries a RETRY answer once (another first report of the id committed meanwhile), so nothing reported is dropped (review #13)', async () => {
            const store = make();
            const nOrphanid = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
            db.answerOnce.push({ name: 'rtedge_orphan_insert', row: { msg: -2, value: 'The orphan was recorded concurrently; retry', cCode: 'RETRY' } });
            await expect(store.recordOrphan({ nOrphanid, nSesid: IDS.ses, cKind: 'H', nBytes: 70 })).resolves.toMatchObject({ ok: true, nOrphanid });
            expect(db.callsOf('rtedge_orphan_insert')).toHaveLength(2);
            expect(db.orphans.get(nOrphanid)).toMatchObject({ nBytes: 70 });
            expect(registry.recentAlerts().find(a => a.kind === 'ORPHAN_RECORD_REFUSED')).toBeUndefined();
            // Only once: a second RETRY is a refusal like any other (P2).
            const retry = { msg: -2, value: 'retry', cCode: 'RETRY' };
            db.answerOnce.push({ name: 'rtedge_orphan_insert', row: retry }, { name: 'rtedge_orphan_insert', row: retry });
            await expect(store.recordOrphan({ nOrphanid, nSesid: IDS.ses, cKind: 'H', nBytes: 80 })).resolves.toMatchObject({ ok: false });
            expect(db.callsOf('rtedge_orphan_insert')).toHaveLength(4);
            expect(registry.recentAlerts().find(a => a.kind === 'ORPHAN_RECORD_REFUSED')?.tier).toBe('P2');
        });

        it('keeps ingest alive when the orphan cannot be recorded (P2 alert / logged transport failure)', async () => {
            const store = make();
            db.fail.set('rtedge_orphan_insert', 'connection reset');
            await expect(store.recordOrphan({ nSesid: IDS.ses, cKind: 'H' })).resolves.toEqual({ nOrphanid: null, ok: false });
            db.fail.delete('rtedge_orphan_insert');
            await expect(store.recordOrphan({ nSesid: IDS.ses, cKind: 'U' })).resolves.toMatchObject({ ok: false });
            expect(registry.recentAlerts().find(a => a.kind === 'ORPHAN_RECORD_REFUSED')?.tier).toBe('P2');
            await expect(store.openHeldStream({ nSesid: 'not-a-session', user: null, peer: 'x', connId: 'c' })).rejects.toThrow('session id');
        });
    });

    it('has a "not configured" archive by default', async () => {
        const archive = make().archive;
        expect(archive).toBeInstanceOf(UnconfiguredEdgeArchive);
        await expect(archive.archiveJournal({ nCaseid: null, nSesid: IDS.ses, dir })).resolves.toBeNull();
        await expect(archive.presignPut({ nEdgeid: IDS.box, nSesid: IDS.ses, sha256: 'a'.repeat(64), bytes: 1 })).resolves.toBeNull();
    });
});
