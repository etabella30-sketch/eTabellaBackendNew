import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Checkpoint, CheckpointStore, JsonFileCheckpointStore, openSqliteDatabase, SqliteCheckpointStore } from './checkpoint';
import { LaneState } from './parser-lane';

const SES = 'ses-cp-1';
// real file and SQLite I/O: generous under a parallel full-suite run
jest.setTimeout(30_000);
const H = (n: number) => n.toString(16).padStart(64, '0');

function laneState(lines: number): LaneState {
    const crLine = [72, 73];
    const lineBuffer: any[] = [];
    for (let i = 0; i < lines; i++) lineBuffer.push(['00:00:01:00', [65 + (i % 26)], i, 'FL', 1, i + 1, (i + 1) * 1e6]);
    lineBuffer.push(['00:00:02:00', crLine, lines, 'FL', 1, lines + 1, null]); // CaseView-style alias of crLine
    return {
        v: 1,
        protocol: 'C',
        job: { id: null, crLine, lineBuffer, globalBuffer: [], lineCount: lines, relaceLines: [], isRefresh: false, currentTimestamp: undefined } as any,
        framing: { mdl: { cmd: '', data: [], cmdType: 0 }, previousCmd: '', cmdLength: 0, isCmdEnded: true, isData: false, isRefresh: false, commands: [{ cmdType: 'T' }] },
        pageState: { sessionDate: '', currentPageData: [], pageNumber: 1 },
        refreshCounter: 2,
        refreshType: undefined,
        caseTabs: ['TAB1'],
        clockMs: 1234,
        nextId: lines + 1,
    };
}

function cp(rawSeq: number, parserVer = '1.0.0'): Checkpoint {
    return {
        nSesid: SES,
        rawSeq,
        rawHash: H(rawSeq),
        parserVer,
        fmt: 1,
        createdAt: 1000 + rawSeq,
        lineage: { epoch: 1, rebaseSeq: 0 },
        rev: rawSeq * 2,
        root: 'r' + rawSeq,
        lane: laneState(3),
        extra: { committed: new Set([1, 2, 3]), rev: rawSeq * 2 },
    };
}

function suite(name: string, make: (dir: string) => CheckpointStore) {
    describe(name, () => {
        let dir: string;
        let store: CheckpointStore;
        beforeEach(() => {
            dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-cp-'));
            store = make(dir);
        });
        afterEach(async () => {
            await store.close();
            fs.rmSync(dir, { recursive: true, force: true });
        });

        it('round-trips a checkpoint, keeping shared references and Sets', async () => {
            await store.save(cp(10));
            const back = (await store.load(SES, 10))!;
            expect(back).toMatchObject({ nSesid: SES, rawSeq: 10, rawHash: H(10), parserVer: '1.0.0', fmt: 1, lineage: { epoch: 1, rebaseSeq: 0 }, rev: 20, root: 'r10' });
            expect(back.lane!.job.lineBuffer).toHaveLength(4);
            // crLine still IS the last line's text array, as the CaseView parser expects
            expect(back.lane!.job.lineBuffer[3][1]).toBe(back.lane!.job.crLine);
            expect(back.lane!.job.currentTimestamp).toBeUndefined();
            // v8.deserialize builds the Set in Node's realm, not jest's sandbox realm: compare by tag + content
            const committed = (back.extra as any).committed;
            expect(Object.prototype.toString.call(committed)).toBe('[object Set]');
            expect([...committed]).toEqual([1, 2, 3]);
            expect(back.lane!.caseTabs).toEqual(['TAB1']);
        });

        it('keeps the newest 3 and lists newest first', async () => {
            for (const seq of [1, 5, 9, 20, 30]) await store.save(cp(seq));
            expect((await store.list(SES)).map(i => i.rawSeq)).toEqual([30, 20, 9]);
            expect(await store.load(SES, 5)).toBeNull();
        });

        it('a checkpoint below stale higher rows (journal truncated or rewritten) drops them and is kept (review 36)', async () => {
            // Rows left by a journal that RECOVER rewrote lower, or by degraded-mode checkpoints past a durable head
            // lost at a restart: "keep the 3 highest" alone deleted every new checkpoint as soon as it was saved.
            for (const seq of [8000, 9000, 10000]) await store.save(cp(seq));
            await store.save(cp(5260));
            expect((await store.list(SES)).map(i => i.rawSeq)).toEqual([5260]);
            expect((await store.load(SES, 5260))!.rawSeq).toBe(5260);
            await store.save(cp(5300));
            await store.save(cp(5400));
            expect((await store.list(SES)).map(i => i.rawSeq)).toEqual([5400, 5300, 5260]);
            await store.save(cp(5500));
            expect((await store.list(SES)).map(i => i.rawSeq)).toEqual([5500, 5400, 5300]);
            // Another session's rows are never touched.
            await store.save({ ...cp(9999), nSesid: 'ses-other' });
            await store.save(cp(5600));
            expect((await store.list('ses-other')).map(i => i.rawSeq)).toEqual([9999]);
        });

        it('latest() honours parserVer, maxRawSeq, minRawSeq and an accept predicate', async () => {
            await store.save(cp(10));
            await store.save(cp(20, '2.0.0'));
            await store.save(cp(30));
            expect((await store.latest(SES))!.rawSeq).toBe(30);
            expect((await store.latest(SES, { parserVer: '1.0.0', maxRawSeq: 25 }))!.rawSeq).toBe(10);
            expect((await store.latest(SES, { parserVer: '2.0.0' }))!.rawSeq).toBe(20);
            expect(await store.latest(SES, { minRawSeq: 31 })).toBeNull();
            expect((await store.latest(SES, { accept: i => i.rawHash !== H(30) }))!.rawSeq).toBe(20);
            expect(await store.latest('ses-none')).toBeNull();
        });

        it('rejects invalid checkpoints and unsafe session ids', async () => {
            await expect(store.save({ ...cp(1), rawHash: 'zz' })).rejects.toThrow(/rawHash/);
            await expect(store.save({ ...cp(1), rawSeq: -1 })).rejects.toThrow(/rawSeq/);
            await expect(store.save({ ...cp(1), nSesid: '../x' })).rejects.toThrow(/unsafe session id/);
        });

        it('removeAll forgets a session', async () => {
            await store.save(cp(1));
            await store.removeAll(SES);
            expect(await store.list(SES)).toEqual([]);
        });
    });
}

suite('JsonFileCheckpointStore (cloud, atomic JSON under data/journal/<nSesid>/)', dir => new JsonFileCheckpointStore({ root: dir }));
suite('SqliteCheckpointStore (box, node:sqlite)', dir => new SqliteCheckpointStore({ file: path.join(dir, 'edge.sqlite') }));

describe('JsonFileCheckpointStore specifics', () => {
    let dir: string;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-cpj-'));
    });
    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes beside the journal segments and leaves no temp files', async () => {
        const store = new JsonFileCheckpointStore({ root: dir });
        await store.save(cp(7));
        const names = fs.readdirSync(path.join(dir, SES));
        expect(names).toEqual(['checkpoint-000000000007.json']);
    });

    it('skips a corrupt or tampered checkpoint and falls back to an older one', async () => {
        const store = new JsonFileCheckpointStore({ root: dir });
        await store.save(cp(1));
        await store.save(cp(2));
        const file = path.join(dir, SES, 'checkpoint-000000000002.json');
        const body = JSON.parse(fs.readFileSync(file, 'utf8'));
        body.state = Buffer.from('tampered').toString('base64');
        fs.writeFileSync(file, JSON.stringify(body));
        expect(await store.load(SES, 2)).toBeNull();
        expect((await store.latest(SES))!.rawSeq).toBe(1);
        fs.writeFileSync(path.join(dir, SES, 'checkpoint-000000000003.json'), '{"v":1,"nSes');
        expect((await store.list(SES)).map(i => i.rawSeq)).toEqual([2, 1]);
    });

    it('removes stray temp files left by a crash mid-save', async () => {
        const store = new JsonFileCheckpointStore({ root: dir });
        fs.mkdirSync(path.join(dir, SES), { recursive: true });
        fs.writeFileSync(path.join(dir, SES, 'checkpoint-000000000009.json.tmp-1-1'), 'partial');
        await store.save(cp(10));
        expect(fs.readdirSync(path.join(dir, SES))).toEqual(['checkpoint-000000000010.json']);
    });
});

describe('SqliteCheckpointStore specifics', () => {
    let dir: string;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-cps-'));
    });
    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('owns its connection in WAL mode with synchronous=FULL', async () => {
        const file = path.join(dir, 'edge.sqlite');
        const store = new SqliteCheckpointStore({ file });
        await store.save(cp(1));
        await store.close();
        const db = openSqliteDatabase(file);
        expect(String(Object.values(db.prepare('PRAGMA journal_mode').get())[0])).toBe('wal');
        db.close();
    });

    it('on a shared connection raises synchronous to FULL only around the write, then restores it', async () => {
        const db = openSqliteDatabase(path.join(dir, 'shared.sqlite'));
        db.exec('PRAGMA synchronous=NORMAL');
        const levels: number[] = [];
        const origExec = db.exec.bind(db);
        db.exec = (sql: string) => {
            const m = /PRAGMA synchronous=(\w+)/.exec(sql);
            if (m) levels.push(m[1] === 'FULL' ? 2 : Number(m[1]));
            origExec(sql);
        };
        const store = new SqliteCheckpointStore({ db });
        await store.save(cp(4));
        expect(levels).toEqual([2, 1]);
        expect(Number(Object.values(db.prepare('PRAGMA synchronous').get())[0])).toBe(1);
        await store.close(); // does not close a borrowed connection
        expect((await new SqliteCheckpointStore({ db }).list(SES)).map(i => i.rawSeq)).toEqual([4]);
        db.close();
    });

    it('a row whose state fails its sha256 is not loaded', async () => {
        const file = path.join(dir, 'edge.sqlite');
        const store = new SqliteCheckpointStore({ file });
        await store.save(cp(1));
        await store.save(cp(2));
        const db = openSqliteDatabase(file);
        db.prepare("UPDATE rt_ingest_checkpoints SET stateSha256 = 'bad' WHERE rawSeq = 2").run();
        db.close();
        expect(await store.load(SES, 2)).toBeNull();
        expect((await store.latest(SES))!.rawSeq).toBe(1);
        await store.close();
        await expect(store.list(SES)).rejects.toThrow(/closed/);
    });
});
