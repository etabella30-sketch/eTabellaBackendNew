import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { Cut, EdgeRawPullReply } from '@app/edge-sync';
import { decodeRecordAt, JournalFile, JournalFs, nodeJournalFs, readJournal, RecordType, verifyRecordBatch } from '@app/rt-ingest';

import { bridgeLines, copyDir, eclipse, Harness, harness, sessionAssignment, waitFor } from './testing/kernel-harness';

jest.setTimeout(90_000);

const SES = 'ses-recover-1';

/** Every durable record of a session, as the cloud raw store would hold it. */
async function allRecords(h: Harness, nSesid = SES): Promise<{ recs: Buffer; toSeq: number; toHash: string }> {
    await h.kernel.settled();
    await waitFor(() => h.kernel.rawHead(nSesid)!.durableSeq === h.kernel.rawHead(nSesid)!.headSeq);
    const r = (await h.kernel.readRaw(nSesid, 1, 64 << 20))!;
    return { recs: r.recs, toSeq: r.toSeq, toHash: r.toHash };
}

/** A pull-back served from a copy of the cloud raw store (≤ 256 KB per call, like `e.rawpull`). */
function pullFrom(cloud: { recs: Buffer }): (fromSeq: number, toSeq: number) => Promise<EdgeRawPullReply> {
    return async (fromSeq: number) => {
        const parts: Buffer[] = [];
        let off = 0;
        let bytes = 0;
        let last = fromSeq - 1;
        while (off < cloud.recs.length) {
            const d = decodeRecordAt(cloud.recs, off);
            if (!d.ok) break;
            if (d.record.seq >= fromSeq) {
                if (parts.length && bytes + d.size > 256 * 1024) break;
                parts.push(cloud.recs.subarray(off, off + d.size));
                bytes += d.size;
                last = d.record.seq;
            }
            off += d.size;
        }
        return { recs: Buffer.concat(parts), toSeq: last, hash: '' };
    };
}

/** The cloud raw store when its raw lane had reached seq `k` only. */
function firstRecords(cloud: { recs: Buffer }, k: number): { recs: Buffer } {
    let off = 0;
    while (off < cloud.recs.length) {
        const d = decodeRecordAt(cloud.recs, off);
        if (!d.ok || d.record.seq > k) break;
        off += d.size;
    }
    return { recs: cloud.recs.subarray(0, off) };
}

/** Every file under the session's journal directory (aside copies included), with its bytes. */
function journalBytes(h: Harness, nSesid = SES): Record<string, string> {
    const root = path.join(h.dir, 'journal', nSesid);
    const out: Record<string, string> = {};
    const walk = (d: string): void => {
        for (const name of fs.readdirSync(d)) {
            const p = path.join(d, name);
            if (fs.statSync(p).isDirectory()) walk(p);
            else out[path.relative(root, p)] = fs.readFileSync(p).toString('base64');
        }
    };
    walk(root);
    return out;
}

/** Flip a payload byte of a record in the session's second segment (one the writer no longer appends to). */
function corruptMiddleSegment(h: Harness): void {
    const segDir = path.join(h.dir, 'journal', SES);
    const segs = fs.readdirSync(segDir).filter(n => /^seg-\d+\.ej$/.test(n)).sort();
    expect(segs.length).toBeGreaterThan(2);
    const victim = path.join(segDir, segs[1]);
    const bytes = fs.readFileSync(victim);
    bytes[40] ^= 0xff;
    fs.writeFileSync(victim, bytes);
}

/** Lines `from`..`from+count-1` from a new Eclipse connection, then the connection ends (rawHead-independent). */
async function feedLines(h: Harness, from: number, count: number): Promise<void> {
    const client = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
    for (let i = 0; i < count; i++) {
        await client.send(bridgeLines(from + i, 1));
        await new Promise(r => setTimeout(r, 4));
    }
    await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= from + count + 1, 20_000, `${from + count} lines`);
    await h.kernel.settled();
    await client.end();
    await h.kernel.settled();
}

const lineTexts = (h: Harness): string[] =>
    h.kernel
        .pages(SES)
        .flat()
        .map(l => (Array.isArray(l[1]) ? String.fromCharCode(...(l[1] as number[])) : ''))
        .filter(t => /^Line \d+ text$/.test(t));

/** Truncate a session's journal to its first `keep` records (a box that lost a tail the cloud holds). */
async function truncateJournal(root: string, nSesid: string, keep: number): Promise<void> {
    let cut: { segment: string; offset: number } | null = null;
    await readJournal({
        root,
        nSesid,
        repair: false,
        keepFromSeq: Infinity,
        onRecord: rec => {
            if (rec.seq === keep + 1) cut = { segment: rec.segment!, offset: rec.offset! };
        },
    });
    if (!cut) return;
    const c = cut as { segment: string; offset: number };
    const dir = path.join(root, nSesid);
    fs.truncateSync(path.join(dir, c.segment), c.offset);
    for (const name of fs.readdirSync(dir)) {
        if (/^seg-\d+\.ej$/.test(name) && name > c.segment) fs.rmSync(path.join(dir, name));
        if (/\.idx$/.test(name)) fs.rmSync(path.join(dir, name));
    }
}

async function feed(h: Harness, lines: number, from = 0, text = 'Line'): Promise<void> {
    const headBefore = h.kernel.rawHead(SES)?.headSeq ?? 0;
    const client = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
    // One line per write with a pause: many DATA records (TCP may still merge some).
    for (let i = 0; i < lines; i++) {
        await client.send(bridgeLines(from + i, 1, text));
        await new Promise(r => setTimeout(r, 4));
    }
    await waitFor(() => (h.kernel.rawHead(SES)?.headSeq ?? 0) > headBefore + 1, 20_000, 'records journaled');
    await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= from + lines + 1, 20_000, `${from + lines} lines`);
    await h.kernel.settled();
    await client.end();
    await h.kernel.settled();
}

describe('EdgeKernel — crash recovery (journal replay under the same parserVer, MR-4)', () => {
    const toClean: string[] = [];
    afterAll(() => {
        for (const d of toClean) fs.rmSync(d, { recursive: true, force: true });
    });

    it('after a power cut (disk snapshot + torn tail) replays to the same root, emits no synthetic cut, keeps revs growing, and records again', async () => {
        const h = harness();
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        const client = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        for (let i = 0; i < 60; i += 15) await client.send(bridgeLines(i, 15));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 61);
        await h.kernel.settled();
        await waitFor(() => h.kernel.rawHead(SES)!.durableSeq === h.kernel.rawHead(SES)!.headSeq);
        const before = h.kernel.view(SES)!;
        const beforePages = JSON.stringify(h.kernel.pages(SES));

        // Power cut: whatever is on disk now, plus a torn half-written group at the tail of the last segment.
        const crash = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-crash-'));
        toClean.push(crash);
        copyDir(h.dir, crash);
        const segDir = path.join(crash, 'journal', SES);
        const last = fs.readdirSync(segDir).filter(n => /^seg-\d+\.ej$/.test(n)).sort().pop()!;
        fs.appendFileSync(path.join(segDir, last), Buffer.from([0x40, 0, 0, 0, 1, 0, 7, 7, 7]));
        await client.end();
        await h.close();

        const h2 = harness({ dir: crash, keepDir: true });
        const emitted: Cut[] = [];
        h2.kernel.onCut(c => emitted.push(c));
        try {
            await h2.kernel.start();
            await waitFor(() => h2.kernel.view(SES) !== null && h2.kernel.session(SES)!.recovering === null, 20_000, 'recovered');
            const after = h2.kernel.view(SES)!;
            expect(after.root).toBe(before.root);
            expect(after.totalLines).toBe(before.totalLines);
            expect(JSON.stringify(h2.kernel.pages(SES))).toBe(beforePages);
            expect(after.rev).toBeGreaterThan(before.rev); // the persisted floor keeps LAN revs monotonic
            expect(emitted).toEqual([]); // recovery emits no synthetic cut
            const view = h2.kernel.session(SES)!;
            expect(view).toMatchObject({ localState: 'live', feed: 'stopped', catConnected: false, journalCorrupt: false });
            expect(view.feedStoppedAtMs).not.toBeNull();
            expect(view.firstLineAtMs).not.toBeNull();
            await waitFor(() => h2.state.incidents.list(SES).some(i => i.kind === 'TAIL_TRUNCATED'));
            // The view is readable as soon as the replay committed; the arm completes right after.
            await waitFor(() => h2.events.of('session-armed').length > 0, 10_000, 'armed after the replay');
            expect(h2.events.of('session-armed').map(e => e.nSesid)).toEqual([SES]);

            // Recording continues where it stopped; the next cut is newer than anything published before.
            const again = await eclipse(h2.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
            await again.send(bridgeLines(60, 5));
            await waitFor(() => (h2.kernel.currentCut(SES)?.totalLines ?? 0) >= 66);
            expect(emitted.length).toBeGreaterThan(0);
            expect(emitted[0].rev).toBeGreaterThan(before.rev);
            expect(h2.events.of('feed-resumed')).toHaveLength(1);
            await again.end();
        } finally {
            await h2.close();
        }
    });

    it('an Eclipse that reconnects while the journal replays is held (no unknown-login refusal) and fed once the worker is open', async () => {
        const h = harness({ keepDir: true });
        toClean.push(h.dir);
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        await feed(h, 10);
        await h.close();

        let release!: () => void;
        const gate = new Promise<void>(resolve => (release = resolve));
        let gated = true;
        const slowFs: JournalFs = { ...nodeJournalFs, readFile: async (file: string) => (gated ? gate.then(() => nodeJournalFs.readFile(file)) : nodeJournalFs.readFile(file)) };
        const h2 = harness({ dir: h.dir, keepDir: true, kernel: { journalFs: slowFs } });
        try {
            await h2.kernel.start(); // prompt: the replay waits on the gate in the background
            await waitFor(() => !!h2.kernel.session(SES)?.recovering, 5_000, 'replaying');
            expect(h2.kernel.view(SES)).toBeNull();
            // v1 promises no percentage (CONTRACTS.md §8.4): the replay reports no progress.
            expect(h2.kernel.session(SES)!.recovering).toEqual({ startedAtMs: expect.any(Number), progressPct: null });
            const c = await eclipse(h2.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
            await c.send(bridgeLines(10, 5));
            await new Promise(r => setTimeout(r, 300));
            expect(h2.events.of('alert').filter(a => a.kind === 'UNKNOWN_LOGIN')).toEqual([]);
            expect(c.socket.destroyed).toBe(false);
            gated = false;
            release();
            await waitFor(() => (h2.kernel.currentCut(SES)?.totalLines ?? 0) >= 16, 20_000, 'held bytes fed after the replay');
            const texts = h2.kernel.pages(SES).flat().map(l => (Array.isArray(l[1]) ? String.fromCharCode(...(l[1] as number[])) : ''));
            expect(texts.filter(t => /^Line \d+ text$/.test(t))).toEqual(Array.from({ length: 15 }, (_, i) => `Line ${i} text`));
            await c.end();
        } finally {
            release();
            await h2.close();
        }
    });

    it('resumes an end that was requested before a restart, then reopens the ended-unsealed session read-only with its endResult rebuilt', async () => {
        const h = harness({ keepDir: true });
        toClean.push(h.dir);
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        await feed(h, 20);
        h.state.sessions.requestEnd(SES, Date.now()); // the uplink stored c.assign{op:'end'}; the box restarts before ending
        await h.close();

        const h2 = harness({ dir: h.dir, keepDir: true });
        let ended;
        try {
            await h2.kernel.start();
            await waitFor(() => h2.kernel.endResult(SES) !== null, 20_000, 'resumed end');
            ended = h2.kernel.endResult(SES)!;
            expect(ended).toMatchObject({ nSesid: SES, endedBy: 'cloud', totalLines: 21 });
            expect(h2.events.of('session-event').filter(e => e.type === 'ended')).toHaveLength(1);
            expect(h2.state.sessions.get(SES)!.endedAtMs).toBe(ended.endedAtEdgeMs);
        } finally {
            await h2.close();
        }

        const h3 = harness({ dir: h.dir, keepDir: true });
        try {
            await h3.kernel.start();
            await waitFor(() => h3.kernel.endResult(SES) !== null, 20_000, 'rebuilt endResult');
            expect(h3.kernel.endResult(SES)).toMatchObject({ rawFinalSeq: ended.rawFinalSeq, rawFinalHash: ended.rawFinalHash, root: ended.root, totalLines: ended.totalLines });
            expect(h3.kernel.view(SES)).toMatchObject({ root: ended.root, totalLines: 21 });
            expect(h3.kernel.session(SES)).toMatchObject({ feed: 'ended', phase: 'ended' });
            expect(await h3.kernel.arm(SES)).toMatchObject({ ok: false, reason: 'ended' });
            expect(h3.events.of('session-event')).toEqual([]); // not a new end
        } finally {
            await h3.close();
        }
    });
});

describe('EdgeKernel — RECOVER by raw pull-back (MR-3 under D19)', () => {
    it('a box behind the cloud raw store pulls the missing records, replays them and converges to the same root', async () => {
        const h = harness({ keepDir: true });
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        await feed(h, 40);
        const cloud = await allRecords(h);
        const target = h.kernel.view(SES)!;
        await h.close();
        const keep = Math.floor(cloud.toSeq / 2);
        await truncateJournal(path.join(h.dir, 'journal'), SES, keep);

        const h2 = harness({ dir: h.dir });
        const emitted: Cut[] = [];
        h2.kernel.onCut(c => emitted.push(c));
        try {
            await h2.kernel.start();
            await waitFor(() => h2.kernel.view(SES) !== null);
            // Reopening may append a CONN_CLOSE for a connection that was active at the cut point.
            const headAfterBoot = h2.kernel.rawHead(SES)!.headSeq;
            expect(headAfterBoot).toBeGreaterThanOrEqual(keep);
            expect(headAfterBoot).toBeLessThanOrEqual(keep + 1);
            expect(h2.kernel.view(SES)!.root).not.toBe(target.root);
            const res = await h2.kernel.recoverFromCloud(SES, keep + 1, pullFrom(cloud));
            expect(res).toEqual({ ok: true, fromSeq: keep + 1, toSeq: cloud.toSeq, records: cloud.toSeq - keep, movedAside: headAfterBoot - keep });
            expect(h2.kernel.view(SES)!.root).toBe(target.root);
            expect(h2.kernel.view(SES)!.totalLines).toBe(target.totalLines);
            expect(emitted.length).toBeGreaterThan(0); // the LAN view changes when the replay commits
            expect(h2.kernel.rawHead(SES)!.headSeq).toBeGreaterThanOrEqual(cloud.toSeq);
            expect(await h2.kernel.rawHashAt(SES, cloud.toSeq)).toBe(cloud.toHash);
            // The box keeps recording after RECOVER.
            const c = await eclipse(h2.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
            await c.send(bridgeLines(40, 3));
            await waitFor(() => (h2.kernel.currentCut(SES)?.totalLines ?? 0) >= 44);
            await c.end();
        } finally {
            await h2.close();
        }
    });

    it('moves divergent local records aside, refuses a chain that does not continue the box, and reports cloud-behind', async () => {
        const h = harness({ keepDir: true });
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        await feed(h, 20);
        const cloud = await allRecords(h);
        const target = h.kernel.view(SES)!;
        await h.close();
        const keep = 6;
        await truncateJournal(path.join(h.dir, 'journal'), SES, keep);

        const h2 = harness({ dir: h.dir });
        try {
            await h2.kernel.start();
            await waitFor(() => h2.kernel.session(SES)?.localState !== 'recovering' && h2.kernel.view(SES) !== null);
            await waitFor(() => h2.events.of('session-armed').length > 0, 10_000, 'armed after the replay');
            // The box records something else after the divergence point (e.g. after a restore).
            await feed(h2, 5, 0, 'Other');
            const divergentHead = h2.kernel.rawHead(SES)!.headSeq;
            expect(divergentHead).toBeGreaterThan(keep);

            // A pull from another lineage does not continue the box's chain at keep: refused, nothing changed.
            const bogus = await h2.kernel.recoverFromCloud(SES, keep + 1, async () => ({ recs: cloud.recs.subarray(0, 200), toSeq: 3, hash: '' }));
            expect(bogus).toMatchObject({ ok: false, reason: 'chain-mismatch' });
            expect(h2.kernel.rawHead(SES)!.headSeq).toBe(divergentHead);

            const res = await h2.kernel.recoverFromCloud(SES, keep + 1, pullFrom(cloud));
            expect(res).toMatchObject({ ok: true, fromSeq: keep + 1, toSeq: cloud.toSeq });
            expect((res as { movedAside: number }).movedAside).toBeGreaterThan(0);
            expect(fs.readdirSync(path.join(h.dir, 'journal', SES)).some(n => n.startsWith('aside-'))).toBe(true);
            expect(h2.kernel.view(SES)!.root).toBe(target.root);

            // The cloud has nothing beyond the box: cloud-behind.
            const head = h2.kernel.rawHead(SES)!.headSeq;
            expect(await h2.kernel.recoverFromCloud(SES, head + 1, async () => ({ recs: Buffer.alloc(0), toSeq: head, hash: '' }))).toMatchObject({ ok: false, reason: 'cloud-behind' });
        } finally {
            await h2.close();
            fs.rmSync(h.dir, { recursive: true, force: true });
        }
    });

    it('repairs a corrupt middle segment (JOURNAL_CORRUPT at boot): the end waits, RECOVER from the good head repairs, the end completes', async () => {
        const h = harness({ keepDir: true, kernel: { journal: { segmentMaxBytes: 512 } } });
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        await feed(h, 30);
        const cloud = await allRecords(h);
        const target = h.kernel.view(SES)!;
        await h.close();
        const segDir = path.join(h.dir, 'journal', SES);
        const segs = fs.readdirSync(segDir).filter(n => /^seg-\d+\.ej$/.test(n)).sort();
        expect(segs.length).toBeGreaterThan(2);
        const victim = path.join(segDir, segs[1]);
        const bytes = fs.readFileSync(victim);
        bytes[40] ^= 0xff; // a payload byte of a record outside the last segment: CRC fails
        fs.writeFileSync(victim, bytes);

        const h2 = harness({ dir: h.dir, kernel: { journal: { segmentMaxBytes: 512 } } });
        try {
            await h2.kernel.start();
            await waitFor(() => h2.kernel.session(SES)?.journalCorrupt === true, 20_000, 'corrupt');
            expect(h2.kernel.view(SES)).toBeNull();
            expect(h2.events.of('alert').some(a => a.kind === 'JOURNAL_CORRUPT' && a.critical)).toBe(true);
            expect(h2.state.incidents.list(SES).map(i => i.kind)).toContain('JOURNAL_CORRUPT');
            expect(await h2.kernel.arm(SES)).toMatchObject({ ok: false, reason: 'journal-corrupt' });
            const good = h2.kernel.rawHead(SES)!;
            expect(good.headSeq).toBeLessThan(cloud.toSeq);
            const jv = await h2.kernel.journalView(SES, [good.headSeq, good.headSeq + 5]);
            expect(jv.headSeq).toBe(good.headSeq);
            expect(jv.hashAt(good.headSeq)).toBe(good.headHash);
            expect(jv.hashAt(good.headSeq + 5)).toBeUndefined();

            h2.state.sessions.requestEnd(SES, Date.now());
            let endDone = false;
            const ending = h2.kernel.requestEnd(SES, 'cloud').then(r => {
                endDone = true;
                return r;
            });
            await new Promise(r => setTimeout(r, 300));
            expect(endDone).toBe(false); // MR-4: the end waits for the repair

            const res = await h2.kernel.recoverFromCloud(SES, good.headSeq + 1, pullFrom(cloud));
            expect(res).toMatchObject({ ok: true, fromSeq: good.headSeq + 1, toSeq: cloud.toSeq });
            const result = await ending;
            expect(result.root).toBe(target.root);
            expect(result.totalLines).toBe(target.totalLines);
            const j = await readJournal({ root: path.join(h.dir, 'journal'), nSesid: SES, repair: false });
            const kinds = j.records.filter(r => r.type === RecordType.INCIDENT).map(r => JSON.parse(r.payload.toString()).kind);
            expect(kinds).toEqual(expect.arrayContaining(['JOURNAL_CORRUPT', 'TAIL_TRUNCATED']));
            expect(j.records[j.records.length - 1].type).toBe(RecordType.SESSION_END);
        } finally {
            await h2.close();
            fs.rmSync(h.dir, { recursive: true, force: true });
        }
    });
});

describe('EdgeKernel — RECOVER never loses what the box journaled (D25)', () => {
    it('a failed, empty or short pull changes nothing: the journal is kept byte for byte and the worker records on', async () => {
        const h = harness();
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        try {
            await h.kernel.start();
            await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
            await feed(h, 20);
            const cloud = await allRecords(h);
            const head = h.kernel.rawHead(SES)!;
            const before = journalBytes(h);
            const fromSeq = 5; // the box holds records from here on
            expect(head.headSeq).toBeGreaterThan(12);
            const reply = (value: unknown) => async (): Promise<EdgeRawPullReply> => value as EdgeRawPullReply;
            const recordsThen = (value: unknown) => {
                let n = 0;
                return async (from: number, to: number): Promise<EdgeRawPullReply> => (n++ === 0 ? pullFrom(cloud)(from, to) : (value as EdgeRawPullReply));
            };
            const pulls: Array<[string, (from: number, to: number) => Promise<EdgeRawPullReply>, string]> = [
                ['NOT_FOUND (past the cloud head, or a store the cloud flagged corrupt)', reply({ ok: false, code: 'NOT_FOUND' }), 'cloud-behind'],
                ['an empty reply', reply({ recs: Buffer.alloc(0), toSeq: fromSeq - 1, hash: '' }), 'cloud-behind'],
                ['ERROR', reply({ ok: false, code: 'ERROR' }), 'io-error'],
                ['NOT_BOUND', reply({ ok: false, code: 'NOT_BOUND' }), 'io-error'],
                ['no ack', async () => Promise.reject(new Error('no ack for e.rawpull')), 'io-error'],
                ['records, then ERROR', recordsThen({ ok: false, code: 'ERROR' }), 'io-error'],
                ['a short pull: the cloud raw lane had reached seq 12 only', pullFrom(firstRecords(cloud, 12)), 'cloud-behind'],
            ];
            for (const [what, pull, reason] of pulls) {
                expect([what, await h.kernel.recoverFromCloud(SES, fromSeq, pull)]).toEqual([what, { ok: false, reason, message: expect.any(String) }]);
                expect([what, journalBytes(h)]).toEqual([what, before]);
                expect([what, h.kernel.rawHead(SES)]).toEqual([what, head]);
                expect([what, h.kernel.view(SES) !== null, h.kernel.session(SES)!.journalCorrupt]).toEqual([what, true, false]);
            }
            // The worker was never closed: the box keeps recording where it was.
            await feedLines(h, 20, 3);
            expect(lineTexts(h)).toEqual(Array.from({ length: 23 }, (_, i) => `Line ${i} text`));
        } finally {
            await h.close();
        }
    });

    it('the plan on the CLOSED journal refuses after the live plan accepted (the journal grew in between): nothing is rewritten or moved aside, the worker reopens and records on', async () => {
        // The box: 10 lines, closed cleanly (no connection open at the cut, so a reopen appends nothing).
        const h = harness({ keepDir: true });
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
        await feed(h, 10);
        const boxHead = h.kernel.rawHead(SES)!.headSeq;
        await h.close();
        // What the cloud raw store holds: the same journal recorded on by a copy of the box (5 more lines).
        const twinDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-twin-'));
        copyDir(h.dir, twinDir);
        const twin = harness({ dir: twinDir, keepDir: true });
        await twin.kernel.start();
        await waitFor(() => twin.kernel.view(SES) !== null && twin.events.of('session-armed').length > 0, 20_000, 'twin armed');
        await feed(twin, 5, 10);
        const all = await allRecords(twin);
        await twin.close();
        fs.rmSync(twinDir, { recursive: true, force: true });
        expect(all.toSeq).toBeGreaterThan(boxHead + 2);
        // The box's records after its head, as the twin wrote them (byte-identical: same chain, no fork).
        const later: Buffer[] = [];
        for (let off = 0; off < all.recs.length; ) {
            const d = decodeRecordAt(all.recs, off);
            if (!d.ok) break;
            if (d.record.seq > boxHead) later.push(all.recs.subarray(off, off + d.size));
            off += d.size;
        }

        const h2 = harness({ dir: h.dir, keepDir: true });
        try {
            await h2.kernel.start();
            await waitFor(() => h2.kernel.view(SES) !== null && h2.events.of('session-armed').length > 0, 20_000, 'armed after the replay');
            expect(h2.kernel.rawHead(SES)!.headSeq).toBe(boxHead);
            const segDir = path.join(h.dir, 'journal', SES);
            const lastSegment = path.join(segDir, fs.readdirSync(segDir).filter(n => /^seg-\d+\.ej$/.test(n)).sort().pop()!);
            // Between the live plan (it accepts: the cloud holds the box's records and more) and the plan on the closed
            // journal, the journal grows past what the cloud holds: here the closing writer is followed by records the
            // cloud lacks the last of (as records still being written when the live plan ran would be).
            const held = (h2.kernel as unknown as { held: Map<string, { worker: { close(): Promise<void> } | null }> }).held.get(SES)!;
            const worker = held.worker!;
            const close = worker.close.bind(worker);
            let closedOnce = false;
            worker.close = async () => {
                await close();
                if (closedOnce) return;
                closedOnce = true;
                fs.appendFileSync(lastSegment, Buffer.concat(later));
            };
            const cloudCopy = firstRecords(all, all.toSeq - 1); // the cloud lacks the box's last record
            const res = await h2.kernel.recoverFromCloud(SES, boxHead + 1, pullFrom(cloudCopy));
            expect(closedOnce).toBe(true); // the live plan accepted: the worker was closed for the rewrite
            expect(res).toEqual({ ok: false, reason: 'cloud-behind', message: expect.stringContaining('the cloud does not have') });
            // Nothing was rewritten or moved aside: the journal is what the closed writer left, end to end.
            expect(fs.readdirSync(segDir).some(n => n.startsWith('aside-'))).toBe(false);
            const j = await readJournal({ root: path.join(h.dir, 'journal'), nSesid: SES, repair: false });
            expect([j.head.seq, j.head.hash.toString('hex')]).toEqual([all.toSeq, all.toHash]);
            // The worker reopened (the session never stays closed after a refused RECOVER) and replayed that journal.
            await waitFor(() => h2.kernel.view(SES) !== null && h2.kernel.session(SES)!.recovering === null, 20_000, 'reopened');
            expect(held.worker).not.toBe(worker);
            expect(h2.kernel.session(SES)!.journalCorrupt).toBe(false);
            await waitFor(() => (h2.kernel.currentCut(SES)?.totalLines ?? 0) >= 16, 20_000, 'the replayed lines');
            expect(lineTexts(h2)).toEqual(Array.from({ length: 15 }, (_, i) => `Line ${i} text`));
            // New connections are accepted again (the arbiter was unblocked) and the box records on.
            await feedLines(h2, 15, 3);
            expect(lineTexts(h2)).toEqual(Array.from({ length: 18 }, (_, i) => `Line ${i} text`));
        } finally {
            await h2.close();
            fs.rmSync(h.dir, { recursive: true, force: true });
        }
    });

    it('a corrupt record found while the worker records (MR-4): the hello sees the verified prefix, and RECOVER from the good head repairs it in place, keeping the lines recorded since', async () => {
        const h = harness({ kernel: { journal: { segmentMaxBytes: 512 } } });
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        try {
            await h.kernel.start();
            await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
            await feed(h, 30);
            const cloud = await allRecords(h); // what the cloud raw store holds
            corruptMiddleSegment(h);

            // The raw lane (or a hello) reads across the bad record: JOURNAL_CORRUPT, the worker still live.
            await expect(h.kernel.readRaw(SES, 1, 64 << 20)).rejects.toThrow(/corrupt/);
            const good = h.kernel.rawHead(SES)!;
            expect(h.kernel.session(SES)).toMatchObject({ journalCorrupt: true, raw: good });
            expect(good.headSeq).toBeLessThan(cloud.toSeq); // the verified prefix, not the live head
            expect(h.state.incidents.list(SES).map(i => i.kind)).toContain('JOURNAL_CORRUPT');
            const jv = await h.kernel.journalView(SES, [0, good.headSeq, cloud.toSeq]);
            expect([jv.headSeq, jv.hashAt(good.headSeq), jv.hashAt(cloud.toSeq)]).toEqual([good.headSeq, good.headHash, undefined]);
            expect(await h.kernel.rawHashAt(SES, cloud.toSeq)).toBeNull();
            expect(await h.kernel.readRaw(SES, good.headSeq + 1, 1 << 20)).toBeNull(); // nothing past the verified head is served

            // The room keeps reading and the box keeps recording: 5 lines the cloud never got.
            expect(h.kernel.view(SES)).not.toBeNull();
            await feedLines(h, 30, 5);

            // A cloud that holds nothing past the good head: refused, the corrupt journal and its later lines are kept.
            const before = journalBytes(h);
            expect(await h.kernel.recoverFromCloud(SES, good.headSeq + 1, async () => ({ ok: false, code: 'NOT_FOUND' }) as unknown as EdgeRawPullReply)).toMatchObject({ ok: false, reason: 'cloud-behind' });
            expect(journalBytes(h)).toEqual(before);
            expect(h.kernel.session(SES)!.journalCorrupt).toBe(true);
            expect(h.kernel.view(SES)).not.toBeNull();

            // The cloud's records (short of the box's own head) replace the corrupt one; the 5 later lines stay.
            const res = await h.kernel.recoverFromCloud(SES, good.headSeq + 1, pullFrom(cloud));
            expect(res).toMatchObject({ ok: true, fromSeq: good.headSeq + 1, records: cloud.toSeq - good.headSeq, movedAside: 0 });
            expect(h.kernel.session(SES)!.journalCorrupt).toBe(false);
            await waitFor(() => h.kernel.view(SES) !== null && h.kernel.session(SES)!.recovering === null, 20_000, 'reopened');
            expect(h.kernel.view(SES)!.totalLines).toBe(36);
            expect(lineTexts(h)).toEqual(Array.from({ length: 35 }, (_, i) => `Line ${i} text`));
            const j = await readJournal({ root: path.join(h.dir, 'journal'), nSesid: SES, repair: false });
            expect(j.head.seq).toBe((res as { toSeq: number }).toSeq);
            expect(h.kernel.rawHead(SES)!.headSeq).toBeGreaterThanOrEqual(j.head.seq);
            expect(await h.kernel.rawHashAt(SES, cloud.toSeq)).toBe(cloud.toHash);
        } finally {
            await h.close();
        }
    });
});

describe('EdgeKernel — degraded durability (MR-5)', () => {
    it('keeps parsing from RAM when journal writes fail, serves undurable records to the raw lane, and heals', async () => {
        const ctl = { fail: false };
        const journalFs: JournalFs = {
            ...nodeJournalFs,
            async openAppend(file: string): Promise<JournalFile> {
                const inner = await nodeJournalFs.openAppend(file);
                return {
                    write: data => inner.write(data),
                    datasync: async () => {
                        if (ctl.fail) throw Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' });
                        await inner.datasync();
                    },
                    close: () => inner.close(),
                };
            },
        };
        const h = harness({ kernel: { journalFs, degradedRetryMs: 100 } });
        try {
            h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
            await h.kernel.start();
            await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
            const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
            await c.send(bridgeLines(0, 5));
            await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 6);
            await waitFor(() => h.kernel.rawHead(SES)!.durableSeq === h.kernel.rawHead(SES)!.headSeq);
            const durableBefore = h.kernel.rawHead(SES)!.durableSeq;
            ctl.fail = true;
            await c.send(bridgeLines(5, 5));
            await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 11, 15_000, 'parsing from RAM');
            await waitFor(() => h.kernel.session(SES)!.durability === 'degraded');
            const view = h.kernel.session(SES)!;
            expect(view.degradedSinceMs).not.toBeNull();
            expect(view.raw.headSeq).toBeGreaterThan(view.raw.durableSeq);
            expect(h.events.of('alert').some(a => a.kind === 'DEGRADED_DURABILITY' && a.critical)).toBe(true);
            expect(h.state.connectivityLog.page({ filter: 'problems' }, today()).rows.map(r => r.code)).toContain('disk-write-failed');

            expect(await h.kernel.readRaw(SES, durableBefore + 1, 1 << 20)).toBeNull(); // nothing durable beyond
            const und = (await h.kernel.readRaw(SES, durableBefore + 1, 1 << 20, { includeUndurable: true }))!;
            expect(und.durable).toBe(false);
            expect(und.toSeq).toBe(h.kernel.rawHead(SES)!.headSeq);
            expect(verifyRecordBatch(und.recs, durableBefore + 1, Buffer.from(und.prevHash, 'hex')).ok).toBe(true);

            ctl.fail = false;
            await waitFor(() => h.kernel.session(SES)!.durability === 'ok', 15_000, 'healed');
            await waitFor(() => h.state.connectivityLog.page({}, today()).rows.some(r => r.code === 'disk-write-restored'));
            await waitFor(() => h.kernel.rawHead(SES)!.durableSeq === h.kernel.rawHead(SES)!.headSeq);
            const kinds = (await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false })).records
                .filter(r => r.type === RecordType.INCIDENT)
                .map(r => JSON.parse(r.payload.toString()).kind);
            expect(kinds.filter(k => k === 'DEGRADED_DURABILITY').length).toBeGreaterThanOrEqual(1);
            await c.end();
        } finally {
            await h.close();
        }
    });
});

function today(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
