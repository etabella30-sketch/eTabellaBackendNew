import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { CheckpointStore, JsonFileCheckpointStore, SqliteCheckpointStore } from './checkpoint';
import { ParserLane } from './parser-lane';
import { encodeBody, RawJournalWriter, readJournal, RecordType } from './raw-journal';
import { ParserVersionMismatchError, rebaseFromPages, RebaseNotSupportedError, recoverSession } from './recovery';
import { SessionWorker } from './session-worker';
import { IngestAlert } from './types';

const SES = 'ses-recover-1';
// real file I/O and full parser runs: generous under a parallel full-suite run
jest.setTimeout(30_000);
const STX = 0x02;
const ETX = 0x03;
const cmd = (letter: string, data: number[] = []) => Buffer.from([STX, letter.charCodeAt(0), ...data, ETX]);

function bridgeLines(from: number, count: number): Buffer {
    const parts: Buffer[] = [];
    for (let i = from; i < from + count; i++) {
        parts.push(cmd('N', [(i % 25) + 1]));
        parts.push(cmd('T', [9, Math.floor(i / 60) % 60, i % 60, 0]));
        parts.push(Buffer.from(`Witness line ${i} text`, 'latin1'));
    }
    return Buffer.concat(parts);
}

/** STX G len search len replace ETX */
function globalReplace(search: string, replace: string): Buffer {
    return Buffer.from([STX, 0x47, search.length, ...Buffer.from(search, 'latin1'), replace.length, ...Buffer.from(replace, 'latin1'), ETX]);
}

/** Cut a buffer into irregular pieces so commands straddle chunk boundaries. */
function irregular(buf: Buffer, seed: number): Buffer[] {
    const out: Buffer[] = [];
    let off = 0;
    let s = seed;
    while (off < buf.length) {
        s = (s * 1103515245 + 12345) % 2147483648;
        const n = 7 + (s % 41);
        out.push(buf.subarray(off, Math.min(buf.length, off + n)));
        off += n;
    }
    return out;
}

/**
 * First difference between two values, strict about undefined vs null, array holes, key sets and
 * NaN/-0 (Object.is), but not about realms or number representation (a deserialized 5 may be a
 * heap double where the live run has a small int, which only changes v8's bytes, not the state).
 */
function firstDifference(a: any, b: any, at = '$'): string | null {
    if (typeof a !== typeof b) return `${at}: ${typeof a} vs ${typeof b}`;
    if (a === null || b === null || typeof a !== 'object') return Object.is(a, b) ? null : `${at}: ${String(a)} vs ${String(b)}`;
    if (Array.isArray(a) !== Array.isArray(b)) return `${at}: array vs object`;
    if (Array.isArray(a)) {
        if (a.length !== b.length) return `${at}.length: ${a.length} vs ${b.length}`;
        for (let i = 0; i < a.length; i++) {
            if (i in a !== i in b) return `${at}[${i}]: hole vs value`;
            const d = firstDifference(a[i], b[i], `${at}[${i}]`);
            if (d) return d;
        }
        return null;
    }
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.join('|') !== kb.join('|')) return `${at}: keys ${ka.join(',')} vs ${kb.join(',')}`;
    for (const k of ka) {
        const d = firstDifference(a[k], b[k], `${at}.${k}`);
        if (d) return d;
    }
    return null;
}

/** The deterministic part of a lane's state (customTimestamp is a log-only wall-clock read today, DET-1). */
function digest(lane: ParserLane): { json: any; state: any; crLineAliased: boolean; sha: string } {
    const { customTimestamp: _drop, ...job } = lane.ctx.job as any;
    const state = {
        job,
        refreshCounter: lane.ctx.refreshCounter,
        nextId: lane.nextId,
        framing: { ...lane.ctx.framing, commands: lane.ctx.framing.commands.slice(-1) },
    };
    const lb = lane.ctx.job.lineBuffer;
    return {
        json: JSON.parse(JSON.stringify(state)),
        state,
        crLineAliased: lb.some((line: any) => Array.isArray(line) && line[1] === lane.ctx.job.crLine),
        sha: createHash('sha256').update(JSON.stringify(state)).digest('hex'),
    };
}

function expectSameState(a: ReturnType<typeof digest>, b: ReturnType<typeof digest>): void {
    expect(firstDifference(a.state, b.state)).toBeNull();
    expect(a.crLineAliased).toBe(b.crLineAliased);
    expect(a.json).toEqual(b.json);
}


/** The hearing: three phases of feed, with a connection change between phases 2 and 3. */
function plan(): { phase1: Buffer[]; phase2: Buffer[]; phase3: Buffer[] } {
    return {
        phase1: irregular(Buffer.concat([cmd('P', [1, 0]), bridgeLines(0, 30)]), 1),
        phase2: irregular(Buffer.concat([bridgeLines(30, 20), globalReplace('text', 'TEXT'), cmd('D'), cmd('D'), Buffer.from('xy')]), 2),
        phase3: irregular(Buffer.concat([bridgeLines(50, 25), cmd('P', [2, 0]), bridgeLines(75, 5)]), 3),
    };
}

describe('recovery: checkpoint + deterministic replay (spec §6.2)', () => {
    let base: string;
    let alerts: IngestAlert[];
    const opened: SessionWorker[] = [];
    const openWorker = async (root: string, store: CheckpointStore | null, extra: Record<string, unknown> = {}) => {
        const w = await SessionWorker.open({
            meta: { nSesid: SES, nCaseid: 'c', nLines: 25, tz: 'UTC', parserVer: '1.0.0' },
            journalRoot: root,
            parserVer: '1.0.0',
            checkpoints: store,
            onAlert: a => alerts.push(a),
            boundaryMs: 0,
            ...extra,
        });
        opened.push(w);
        return w;
    };
    const feedAll = async (w: SessionWorker, connId: string, pieces: Buffer[]) => {
        for (const p of pieces) w.feed(connId, p);
        await w.settled();
    };

    beforeEach(() => {
        base = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-recovery-'));
        alerts = [];
    });
    afterEach(async () => {
        for (const w of opened.splice(0)) await w.close().catch(() => undefined);
        fs.rmSync(base, { recursive: true, force: true });
    });

    async function uninterrupted(root: string) {
        const p = plan();
        const w = await openWorker(root, null);
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        await feedAll(w, 'a', p.phase1);
        await feedAll(w, 'a', p.phase2);
        w.connectionClosed('a', 'peer-closed');
        w.connectionOpened({ connId: 'b', remote: '10.0.0.5:2', user: 'u', mode: 'listen' });
        await feedAll(w, 'b', p.phase3);
        await w.settled();
        return { worker: w, digest: digest(w.applier.lane!) };
    }

    async function interrupted(root: string, store: CheckpointStore) {
        const p = plan();
        const w = await openWorker(root, store);
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        await feedAll(w, 'a', p.phase1);
        const cp = await w.checkpointNow();
        expect(cp).not.toBeNull();
        await feedAll(w, 'a', p.phase2);
        // crash: the journal is durable, nothing else is closed
        await w.journal.close();
        opened.splice(opened.indexOf(w), 1);

        const w2 = await openWorker(root, store);
        expect(w2.recovery!.checkpoint!.rawSeq).toBe(cp!.rawSeq);
        expect(w2.recovery!.replayedData).toBe(p.phase2.length);
        w2.connectionOpened({ connId: 'b', remote: '10.0.0.5:2', user: 'u', mode: 'listen' });
        await feedAll(w2, 'b', p.phase3);
        await w2.settled();
        return { worker: w2, digest: digest(w2.applier.lane!) };
    }

    it('a crash + checkpoint + replay ends in exactly the uninterrupted state (Bridge, JSON store)', async () => {
        const a = await uninterrupted(path.join(base, 'a'));
        const b = await interrupted(path.join(base, 'b'), new JsonFileCheckpointStore({ root: path.join(base, 'b') }));
        expectSameState(a.digest, b.digest);
        const lines = a.worker.applier.lane!.ctx.job.lineBuffer.filter((l: any) => Array.isArray(l) && l[1]?.length).length;
        expect(lines).toBeGreaterThanOrEqual(80);
    });

    it('the same holds with the SQLite store (box)', async () => {
        const a = await uninterrupted(path.join(base, 'a'));
        const store = new SqliteCheckpointStore({ file: path.join(base, 'edge.sqlite') });
        const b = await interrupted(path.join(base, 'b'), store);
        expectSameState(a.digest, b.digest);
        await store.close();
    });

    it('replay from genesis (no checkpoint) and replay from a checkpoint agree, and two replays agree', async () => {
        const root = path.join(base, 'g');
        const store = new JsonFileCheckpointStore({ root });
        const live = await interrupted(root, store);
        await live.worker.close();
        opened.splice(0);

        const fromGenesis = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', useCheckpoint: false });
        const fromCheckpoint = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', checkpoints: store });
        const again = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', checkpoints: store });
        expect(fromGenesis.checkpoint).toBeNull();
        expect(fromCheckpoint.checkpoint).not.toBeNull();
        expectSameState(live.digest, digest(fromGenesis.applier.lane!));
        expectSameState(live.digest, digest(fromCheckpoint.applier.lane!));
        expect(digest(again.applier.lane!).sha).toBe(digest(fromCheckpoint.applier.lane!).sha);
        expect(fromGenesis.applier.replay).toBe(false); // switched live after the lane went idle
    });

    it('replay emits nothing to the host (only the sink outputs are no-ops) but allocates the same line ids', async () => {
        const root = path.join(base, 'e');
        const live = await uninterrupted(root);
        await live.worker.close();
        opened.splice(0);
        const deliveries: string[] = [];
        let lines = 0;
        const rec = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', hooks: { emitDelivery: e => deliveries.push(e), onLine: () => (lines += 1) } });
        expect(deliveries).toEqual([]);
        expect(lines).toBe(0);
        expect(rec.applier.lane!.nextId).toBe(live.worker.applier.lane!.nextId);
    });

    it('untilSeq stops the replay at a stored cut (MR-7 compare point)', async () => {
        const root = path.join(base, 'u');
        const live = await uninterrupted(root);
        await live.worker.close();
        opened.splice(0);
        const all = (await readJournal({ root, nSesid: SES })).records;
        const midData = all.filter(r => r.type === RecordType.DATA)[10].seq;
        const rec = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', untilSeq: midData });
        expect(rec.replayToSeq).toBe(midData);
        expect(rec.applier.dataRecords).toBe(11);
        // the comparator is not vacuous: a partial replay is a different state
        expect(firstDifference(live.digest.state, digest(rec.applier.lane!).state)).not.toBeNull();
    });

    it('refuses to replay under a different parser version (REBASE is Phase 4)', async () => {
        const root = path.join(base, 'v');
        const live = await uninterrupted(root);
        await live.worker.close();
        opened.splice(0);
        await expect(recoverSession({ nSesid: SES, journalRoot: root, parserVer: '2.0.0' })).rejects.toBeInstanceOf(ParserVersionMismatchError);
        await expect(openWorker(root, null, { parserVer: '2.0.0' })).rejects.toMatchObject({ code: 'PARSER_VERSION_MISMATCH', pinned: '1.0.0', running: '2.0.0' });
        expect(alerts.find(a => a.kind === 'WORKER_ERROR')).toMatchObject({ tier: 'P1', critical: true });
    });

    it('ignores a checkpoint of another parser version or another lineage (hash mismatch), and replays from genesis', async () => {
        const root = path.join(base, 'h');
        const store = new JsonFileCheckpointStore({ root });
        const live = await uninterrupted(root);
        await live.worker.close();
        opened.splice(0);
        const good = (await readJournal({ root, nSesid: SES })).records[20];
        await store.save({ nSesid: SES, rawSeq: good.seq, rawHash: 'f'.repeat(64), parserVer: '1.0.0', createdAt: 1, lane: null });
        await store.save({ nSesid: SES, rawSeq: good.seq + 1, rawHash: good.hash.toString('hex'), parserVer: '0.9.0', createdAt: 1, lane: null });
        const rec = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', checkpoints: store });
        expect(rec.checkpoint).toBeNull();
        expectSameState(live.digest, digest(rec.applier.lane!));
    });

    it('never replays across a REBASE_END without a checkpoint after it (Phase 4)', async () => {
        const root = path.join(base, 'r');
        const w = await RawJournalWriter.open({ root, nSesid: SES });
        w.append(RecordType.SESSION_HEADER, { nSesid: SES, nCaseid: null, nLines: 25, tz: null, parserVer: '1.0.0', fmt: 1, createdAt: 1 });
        w.append(RecordType.REBASE_BEGIN, { reason: 'switch', rev: 1, totalLines: 0, root: 'x', parserVer: '1.0.0', fmt: 1, baseSeq: 1, anchorIdsDigest: 'y', crLinePolicy: 'slice' });
        const end = await w.append(RecordType.REBASE_END, { root: 'x', idSeq: 1 });
        await w.close();
        await expect(recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0' })).rejects.toBeInstanceOf(RebaseNotSupportedError);
        const store = new JsonFileCheckpointStore({ root });
        await store.save({ nSesid: SES, rawSeq: end.seq, rawHash: end.hash.toString('hex'), parserVer: '1.0.0', createdAt: 1, lane: null });
        const rec = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', checkpoints: store });
        expect(rec.checkpoint!.rawSeq).toBe(end.seq);
        expect(rec.applier.lastRebaseEndSeq).toBe(end.seq);
        expect(() => rebaseFromPages({ nSesid: SES, reason: 'failover', pages: [], anchorIds: [], rev: 1, root: 'x' })).toThrow(/Phase 4/);
        expect(encodeBody(RecordType.REBASE_END, { root: 'x', idSeq: 1 }).length).toBeGreaterThan(0);
    });

    it('takes checkpoints on its own every N chunks and keeps 3', async () => {
        const root = path.join(base, 't');
        const store = new JsonFileCheckpointStore({ root });
        const w = await openWorker(root, store, { checkpointEveryChunks: 10, checkpointEveryMs: 40 });
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        const pieces = irregular(bridgeLines(0, 40), 9);
        for (const piece of pieces) {
            w.feed('a', piece);
            await new Promise(resolve => setTimeout(resolve, 2));
        }
        await w.settled();
        const deadline = Date.now() + 3_000;
        while ((await store.list(SES)).length < 3 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
        const list = await store.list(SES);
        expect(list).toHaveLength(3);
        expect(list[0].rawSeq).toBeGreaterThan(list[2].rawSeq);
    });
});

describe('recovery: CaseView determinism with a pinned wall clock', () => {
    // CaseView stamps lines from the wall clock today; DET-1 (feed-parse) moves that onto the journaled tRecv the
    // lane already passes along. With the clock pinned, replay must reproduce the live state exactly.
    let base: string;
    beforeEach(() => {
        base = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-recovery-cv-'));
        jest.useFakeTimers({
            now: new Date('2026-10-01T04:30:00Z'),
            doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'queueMicrotask', 'hrtime', 'performance'],
        });
    });
    afterEach(() => {
        jest.useRealTimers();
        fs.rmSync(base, { recursive: true, force: true });
    });

    it('checkpoint + replay == uninterrupted, across a backspace and a new connection', async () => {
        const text = Buffer.from('  Q.  Where were you?\r\n  A.  At home.\r\n  Q.  Alone?\x08\x08\x08\x08\x08\x08Alone?\r\n  A.  Yes.\r\n', 'ascii');
        // Two CaseView line markers (0xF9 + 4 hex digits + 0xFA) first: the framing decides CaseView at once (DET-4).
        const markers = Buffer.from([0xf9, 0x30, 0x30, 0x30, 0x31, 0xfa, 0xf9, 0x30, 0x30, 0x30, 0x32, 0xfa]);
        const pieces = [markers, ...irregular(Buffer.concat([text, text, text]), 4)];
        const half = Math.floor(pieces.length / 2);
        const open = (root: string, store: CheckpointStore | null) =>
            SessionWorker.open({ meta: { nSesid: SES, tz: 'Asia/Kolkata', parserVer: '1.0.0' }, journalRoot: root, parserVer: '1.0.0', checkpoints: store, boundaryMs: 0 });

        const a = await open(path.join(base, 'a'), null);
        a.connectionOpened({ connId: 'x', remote: 'r:1', user: 'u', mode: 'listen' });
        for (const p of pieces.slice(0, half)) a.feed('x', p);
        a.connectionClosed('x', 'peer-closed');
        a.connectionOpened({ connId: 'y', remote: 'r:2', user: 'u', mode: 'listen' });
        for (const p of pieces.slice(half)) a.feed('y', p);
        await a.settled();

        const rootB = path.join(base, 'b');
        const store = new JsonFileCheckpointStore({ root: rootB });
        const b = await open(rootB, store);
        b.connectionOpened({ connId: 'x', remote: 'r:1', user: 'u', mode: 'listen' });
        for (const p of pieces.slice(0, 5)) b.feed('x', p);
        await b.settled();
        await b.checkpointNow();
        for (const p of pieces.slice(5, half)) b.feed('x', p);
        await b.settled();
        await b.journal.close();
        const b2 = await open(rootB, store);
        b2.connectionOpened({ connId: 'y', remote: 'r:2', user: 'u', mode: 'listen' });
        for (const p of pieces.slice(half)) b2.feed('y', p);
        await b2.settled();

        expect(b2.protocol).toBe('C');
        expect(b2.recovery!.checkpoint).not.toBeNull();
        const lines = a.applier.lane!.ctx.job.lineBuffer.filter((l: any) => Array.isArray(l) && l[1]?.length);
        expect(lines.length).toBeGreaterThanOrEqual(10);
        expectSameState(digest(a.applier.lane!), digest(b2.applier.lane!));
        await a.close();
        await b2.close();
    });
});
