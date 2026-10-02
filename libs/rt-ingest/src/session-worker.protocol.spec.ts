/**
 * DET-4 on the box: which parser a CAT stream reaches (spec §6.1; tools/ci/golden-replay/README "Protocol detection").
 *
 * SessionWorker.feed used to pick the parser from the first byte (`chunk[0] === 0x02 ? 'B' : 'C'`). Eclipse connects
 * mid-page, so the first byte after its login is text, and every real Bridge stream was parsed as CaseView: the live
 * defect the cloud fixed in IngestSessionWorker. The box now applies the same rule (protocol-decision.ts over
 * libs/feed-parse detectProtocol) and journals the decision as CTX_SET{protocol}; replay reads that record.
 *
 * Bytes come from the four Eclipse 12 captures in tools/eclipse-capture/authtest and the golden replay corpora, read in
 * place through the gate's own loader (tools/ci/golden-replay/corpora.js). No byte of a capture is copied into this
 * repo and no assertion prints one: only parser names, counts, digests and booleans are compared.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import { createRequire } from 'module';
import * as os from 'os';
import * as path from 'path';

import { DETECT_WINDOW_BYTES, detectProtocol } from '@app/feed-parse';

import { JsonFileCheckpointStore } from './checkpoint';
import { LaneFactory, LaneState, ParserLane } from './parser-lane';
import { decodeBody, RawJournalWriter, readJournal, RecordType } from './raw-journal';
import { RecordApplier, toApplyRecord } from './record-applier';
import { recoverSession } from './recovery';
import { SessionWorker, SessionWorkerOptions } from './session-worker';
import { CatProtocol, IngestAlert } from './types';

jest.setTimeout(120_000);

const REPO = path.resolve(__dirname, '..', '..', '..');
// The golden gate's own corpus loader (plain CommonJS): these are the very chunks the gate replays. Loaded with node's
// own require (the real `module` builtin, not jest's), so it needs no transform and ts-jest has no .js file to warn about.
const nodeModule = (process as unknown as { getBuiltinModule?: (id: string) => any }).getBuiltinModule?.('module');
const corpora = (nodeModule?.createRequire ?? createRequire)(__filename)(path.join(REPO, 'tools', 'ci', 'golden-replay', 'corpora.js'));
const AUTHTEST = path.join(REPO, 'tools', 'eclipse-capture', 'authtest');
const SES = 'ses-det4-1';
/** Earlier than every capture: the journal clamps tRecv non-decreasing, so the non-DATA records must not run ahead. */
const CLOCK_MS = 1_000;

interface Chunk {
    bytes: Buffer;
    tRecv: number;
}

/** A capture's chunks after the Eclipse login, exactly as the listener feeds them (the recorded TCP reads). */
function capture(prefix: string): Chunk[] {
    const dir = fs.readdirSync(AUTHTEST).find(d => d.startsWith(`${prefix}_`));
    if (!dir) throw new Error(`no capture ${prefix} in ${AUTHTEST}`);
    const raw: Chunk[] = corpora.readFrames(fs, path.join(AUTHTEST, dir, 'frames.ndjson'));
    return raw.length ? corpora.stripEclipseLogin(raw, dir) : [];
}

/** What the first-byte rule picked before DET-4, for the record. */
function firstByteRule(chunks: Chunk[]): CatProtocol | null {
    const first = chunks.find(c => c.bytes.length);
    return first ? (first.bytes[0] === 0x02 ? 'B' : 'C') : null;
}

/**
 * Oracle, straight from libs/feed-parse (not from protocol-decision.ts): the index of the chunk whose arrival decides
 * the stream, judging the first DETECT_WINDOW_BYTES received so far after every chunk, as the cloud does; -1 = never.
 */
function oracle(chunks: Chunk[]): { index: number; protocol: CatProtocol | null } {
    let window = Buffer.alloc(0);
    let total = 0;
    for (let i = 0; i < chunks.length; i++) {
        total += chunks[i].bytes.length;
        if (window.length < DETECT_WINDOW_BYTES) window = Buffer.concat([window, chunks[i].bytes]).subarray(0, DETECT_WINDOW_BYTES);
        const verdict = detectProtocol(null, window);
        if (verdict !== 'undecided') return { index: i, protocol: verdict === 'bridge' ? 'B' : 'C' };
        if (total >= DETECT_WINDOW_BYTES) return { index: i, protocol: 'C' };
    }
    return { index: -1, protocol: null };
}

/** The receive times the journal keeps: clamped non-decreasing. */
function journaled(chunks: Chunk[]): Chunk[] {
    let t = CLOCK_MS;
    return chunks.filter(c => c.bytes.length).map(c => ({ bytes: c.bytes, tRecv: (t = Math.max(t, c.tRecv)) }));
}

/** Same chunks, same order, same receive times (compared without printing any byte). */
function sameStream(got: Chunk[], want: Chunk[]): boolean {
    return got.length === want.length && got.every((c, i) => c.bytes.equals(want[i].bytes) && c.tRecv === want[i].tRecv);
}

const total = (list: Chunk[]) => list.reduce((n, c) => n + c.bytes.length, 0);

interface SpyLog {
    created: CatProtocol[];
    fed: Chunk[];
    events: string[];
}

/** A lane that records what reaches it. */
function spyLanes(log: SpyLog): LaneFactory {
    return opts => {
        log.created.push(opts.protocol);
        log.events.push(`create:${opts.protocol}`);
        const lane: any = {
            protocol: opts.protocol,
            ctx: { job: { lineBuffer: [] } },
            replay: !!opts.replay,
            nextId: 1,
            chunks: 0,
            feed(bytes: Buffer, tRecv: number) {
                lane.chunks += 1;
                log.fed.push({ bytes: Buffer.from(bytes), tRecv });
                log.events.push('feed');
            },
            connectionOpened: async () => {
                log.events.push('conn');
                return false;
            },
            abortWindow: async () => false,
            setCaseTabs: async () => undefined,
            windowOpen: async () => false,
            inLane: async (fn: any) => fn(undefined),
            idle: async () => undefined,
            snapshot: async (extra?: () => any) => ({ state: { v: 1, protocol: opts.protocol } as LaneState, extra: extra?.() }),
        };
        return lane as ParserLane;
    };
}

const newLog = (): SpyLog => ({ created: [], fed: [], events: [] });

/** The deterministic part of a real lane's state, as a digest (customTimestamp is a log-only wall-clock read, DET-1). */
function laneDigest(lane: ParserLane): string {
    const { customTimestamp: _drop, ...job } = lane.ctx.job as any;
    const framing = lane.ctx.framing ? { ...lane.ctx.framing, commands: (lane.ctx.framing.commands ?? []).slice(-1) } : null;
    return createHash('sha256').update(JSON.stringify({ job, refreshCounter: lane.ctx.refreshCounter, nextId: lane.nextId, framing })).digest('hex');
}

const lineCount = (lane: ParserLane) => (lane.ctx.job.lineBuffer || []).filter((l: any) => Array.isArray(l) && Array.isArray(l[1]) && l[1].length).length;
const digestOf = (list: string[]) => createHash('sha256').update(list.join('\n')).digest('hex');

describe('SessionWorker protocol detection (DET-4)', () => {
    let base: string;
    let alerts: IngestAlert[];
    let n = 0;
    const opened: SessionWorker[] = [];

    const rootOf = () => path.join(base, `j${++n}`);
    const open = async (root: string, extra: Partial<SessionWorkerOptions> = {}) => {
        const w = await SessionWorker.open({
            meta: { nSesid: SES, nCaseid: 'case-1', nLines: 25, tz: 'UTC', parserVer: '1.0.0', createdAt: CLOCK_MS },
            journalRoot: root,
            parserVer: '1.0.0',
            boundaryMs: 0,
            clock: () => CLOCK_MS,
            onAlert: a => alerts.push(a),
            ...extra,
        });
        opened.push(w);
        return w;
    };
    const feedAll = (w: SessionWorker, connId: string, chunks: Chunk[]) => {
        for (const c of chunks) expect(w.feed(connId, c.bytes, c.tRecv)).toBe(true);
    };
    const journal = async (root: string) => (await readJournal({ root, nSesid: SES })).records;
    const listen = (w: SessionWorker, connId = 'l1') => w.connectionOpened({ connId, remote: '10.0.0.5:5000', user: 'eclipse', mode: 'listen' });
    /** A crash: the journal is durable, nothing else is closed (the old worker's lane is dropped). */
    const crash = async (w: SessionWorker) => {
        await w.settled();
        await w.journal.close();
        opened.splice(opened.indexOf(w), 1);
    };

    beforeEach(() => {
        base = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-det4-'));
        alerts = [];
    });
    afterEach(async () => {
        for (const w of opened.splice(0)) await w.close().catch(() => undefined);
        fs.rmSync(base, { recursive: true, force: true });
    });

    describe('the Eclipse 12 Bridge captures (tools/eclipse-capture/authtest, read in place)', () => {
        it('finds the captures: tcp_001 and tcp_002 hold a stream, tcp_003 and tcp_004 none after the login', () => {
            expect(capture('tcp_001').length).toBeGreaterThan(1000);
            expect(capture('tcp_002').length).toBeGreaterThan(1000);
            expect(capture('tcp_003')).toEqual([]);
            expect(capture('tcp_004')).toEqual([]);
        });

        it.each(['tcp_001', 'tcp_002'])(
            '%s, fed in its recorded TCP reads: held until the framing decides Bridge, then every byte reaches the Bridge parser once, in order, with its own tRecv',
            async id => {
                const chunks = capture(id);
                // The defect: the first byte after the login is not STX, so the old rule chose CaseView.
                expect(firstByteRule(chunks)).toBe('C');
                const want = oracle(chunks);
                expect(want.protocol).toBe('B');
                expect(want.index).toBeGreaterThan(0); // the first read alone decides nothing: something is held

                const root = rootOf();
                const log = newLog();
                const w = await open(root, { laneFactory: spyLanes(log) });
                listen(w);
                for (let i = 0; i < chunks.length; i++) {
                    w.feed('l1', chunks[i].bytes, chunks[i].tRecv);
                    // decided at exactly the chunk the oracle names, never before
                    if (i === want.index - 1) expect(w.protocol).toBeNull();
                    if (i === want.index) expect(w.protocol).toBe('B');
                }
                await w.settled();

                expect(w.protocol).toBe('B');
                expect(log.created).toEqual(['B']);
                expect(total(log.fed)).toBe(total(chunks));
                expect(sameStream(log.fed, journaled(chunks))).toBe(true);
                expect(alerts.filter(a => a.kind === 'PROTOCOL_FALLBACK' || a.kind === 'PROTOCOL_MISMATCH')).toHaveLength(0);

                // The journal: every byte as it arrived; one CTX_SET{B}, right before the DATA of the chunk that decided it.
                const recs = await journal(root);
                const data = recs.filter(r => r.type === RecordType.DATA);
                expect(Buffer.concat(data.map(r => r.payload)).equals(Buffer.concat(chunks.map(c => c.bytes)))).toBe(true);
                const ctx = recs.filter(r => r.type === RecordType.CTX_SET);
                expect(ctx.map(r => decodeBody(r))).toEqual([{ protocol: 'B' }]);
                const at = recs.indexOf(ctx[0]);
                expect(recs.slice(0, at).filter(r => r.type === RecordType.DATA)).toHaveLength(want.index);
                expect(recs[at + 1].type).toBe(RecordType.DATA);
            },
        );

        it('tcp_001 through the real parser: Bridge lines, and the same journal replays to the same decision, state and byte-identical deliveries', async () => {
            const chunks = capture('tcp_001');
            const root = rootOf();
            const live: string[] = [];
            const w = await open(root, { emitDelivery: (event, payload) => live.push(JSON.stringify([event, payload])) });
            listen(w);
            feedAll(w, 'l1', chunks);
            await w.settled();
            const lane = w.applier.lane!;
            expect(lane.protocol).toBe('B');
            expect(lineCount(lane)).toBeGreaterThan(20);
            expect(live.length).toBeGreaterThan(0);
            const liveDigest = laneDigest(lane);
            await w.close();
            opened.splice(0);

            // Recovery (replay mode, from genesis), twice: same protocol and state.
            for (let i = 0; i < 2; i++) {
                const rec = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', useCheckpoint: false });
                expect(rec.applier.protocol).toBe('B');
                expect(laneDigest(rec.applier.lane!)).toBe(liveDigest);
            }

            // The same journal through a live-mode applier: the deliveries are byte-identical to the live run's.
            const again: string[] = [];
            const applier = new RecordApplier({ nSesid: SES, hooks: { emitDelivery: (event, payload) => again.push(JSON.stringify([event, payload])) } });
            for (const r of await journal(root)) applier.apply(toApplyRecord(r));
            await applier.lane!.idle();
            expect(applier.protocol).toBe('B');
            expect(laneDigest(applier.lane!)).toBe(liveDigest);
            expect(again.length).toBe(live.length);
            expect(again.every((d, i) => d === live[i])).toBe(true);
            expect(digestOf(again)).toBe(digestOf(live));
        });
    });

    describe('the golden replay corpora (tools/ci/golden-replay/corpora)', () => {
        const ids: string[] = corpora.listCorpora(fs, REPO);

        it('finds the committed corpora, Bridge and CaseView', () => {
            const metas = ids.map(id => corpora.loadCorpus(fs, REPO, id).meta);
            expect(metas.some((m: any) => m.protocol === 'B')).toBe(true);
            expect(metas.some((m: any) => m.protocol === 'C' && !m.legacyMisroute)).toBe(true);
        });

        it.each(ids)('%s: routed to the parser it is replayed through (the legacy-misroute corpus: to Bridge, its real protocol)', async id => {
            const corpus = corpora.loadCorpus(fs, REPO, id);
            const chunks: Chunk[] = corpus.chunks;
            const root = rootOf();
            const log = newLog();
            const w = await open(root, { laneFactory: spyLanes(log) });
            listen(w);
            feedAll(w, 'l1', chunks.filter(c => c.bytes.length));
            await w.settled();
            if (!total(chunks)) {
                expect(w.protocol).toBeNull();
                expect(log.created).toEqual([]);
                return;
            }
            // caseview-lane-tcp-001 pins what production did to Bridge capture 001 (parsed as CaseView); DET-4 ends that.
            const want: CatProtocol = corpus.meta.legacyMisroute ? 'B' : corpus.meta.protocol;
            expect(w.protocol).toBe(want);
            expect(log.created).toEqual([want]);
            // every chunk reaches the parser once, in order, with its own receive time (DET-1), held bytes included
            expect(sameStream(log.fed, journaled(chunks))).toBe(true);
        });
    });

    describe('a configured protocol wins', () => {
        it('dial mode: the setting decides before the first DATA, whatever the bytes show (Bridge capture as CaseView)', async () => {
            const chunks = capture('tcp_001').slice(0, 400);
            const root = rootOf();
            const log = newLog();
            const w = await open(root, { laneFactory: spyLanes(log) });
            w.connectionOpened({ connId: 'd1', remote: '192.168.50.10:1337', mode: 'dial', protocolHint: 'C' });
            feedAll(w, 'd1', chunks);
            expect(w.protocol).toBe('C');
            await w.settled();
            expect(log.created).toEqual(['C']);
            expect(sameStream(log.fed, journaled(chunks))).toBe(true);
            const recs = await journal(root);
            const ctx = recs.findIndex(r => r.type === RecordType.CTX_SET);
            expect(decodeBody(recs[ctx])).toEqual({ protocol: 'C' });
            expect(recs.findIndex(r => r.type === RecordType.DATA)).toBe(ctx + 1);
            // a later connection set to the other protocol is alerted, never applied
            w.connectionOpened({ connId: 'd2', remote: '192.168.50.10:1337', mode: 'dial', protocolHint: 'B' });
            w.feed('d2', Buffer.from('x'));
            await w.settled();
            expect(w.protocol).toBe('C');
            expect(alerts.filter(a => a.kind === 'PROTOCOL_MISMATCH')).toHaveLength(1);
            expect((await journal(root)).filter(r => r.type === RecordType.CTX_SET)).toHaveLength(1);
        });

        it('bytes held undecided from a listen connection are parsed with the protocol a dial connection then sets, after its reset, in order', async () => {
            const root = rootOf();
            const log = newLog();
            const w = await open(root, { laneFactory: spyLanes(log) });
            listen(w, 'l1');
            w.feed('l1', Buffer.from(' mid-page text'), 2_000);
            await w.settled();
            expect(w.protocol).toBeNull();
            expect(w.applier.holding).toBe(true);
            w.connectionOpened({ connId: 'd1', remote: '192.168.50.10:1337', mode: 'dial', protocolHint: 'C' });
            w.feed('d1', Buffer.from('next'), 2_001);
            await w.settled();
            expect(w.protocol).toBe('C');
            expect(w.applier.holding).toBe(false);
            // the CONN_OPEN reset between the two streams is replayed at its place
            expect(log.events).toEqual(['create:C', 'feed', 'conn', 'feed']);
            expect(log.fed.map(c => [c.bytes.toString('latin1'), c.tRecv])).toEqual([
                [' mid-page text', 2_000],
                ['next', 2_001],
            ]);
        });
    });

    describe('an undecided stream', () => {
        const frame = Buffer.from([0x02, 0x4e, 0x01, 0x03]);
        const marker = Buffer.from([0xf9, 0x30, 0x30, 0x30, 0x31, 0xfa]);
        // Bridge frames and CaseView markers without a 4:1 majority: undecided, as in the cloud's spec
        const mixed: Chunk[] = [frame, marker, frame, marker].map((bytes, i) => ({ bytes, tRecv: 5_000 + i }));
        const filler: Chunk = { bytes: Buffer.alloc(DETECT_WINDOW_BYTES, 0x20), tRecv: 5_004 };

        it('is held, nothing lost or reordered, no checkpoint past it; at 4096 bytes it falls back to CaseView with a P2 alert', async () => {
            const root = rootOf();
            const log = newLog();
            const store = new JsonFileCheckpointStore({ root });
            const w = await open(root, { laneFactory: spyLanes(log), checkpoints: store, checkpointEveryMs: 3_600_000 });
            listen(w);
            feedAll(w, 'l1', mixed);
            await w.settled();
            expect(w.protocol).toBeNull();
            expect(w.status().protocol).toBeNull();
            expect(log.created).toEqual([]); // no parser has seen a byte
            expect(w.applier.holding).toBe(true);
            expect(w.applier.heldCounts).toEqual({ records: 4, bytes: total(mixed) });
            expect(await w.windowOpen()).toBe(false);
            expect(await w.checkpointNow()).toBeNull(); // held bytes live only in the applier
            expect((await journal(root)).filter(r => r.type === RecordType.DATA)).toHaveLength(4); // but journaled (WAL)

            w.feed('l1', filler.bytes, filler.tRecv);
            await w.settled();
            expect(w.protocol).toBe('C');
            expect(log.created).toEqual(['C']);
            expect(sameStream(log.fed, [...mixed, filler])).toBe(true);
            expect(alerts.find(a => a.kind === 'PROTOCOL_FALLBACK')).toMatchObject({ tier: 'P2', nSesid: SES, data: { protocol: 'C', how: 'window', bytes: total(mixed) + DETECT_WINDOW_BYTES } });
            const recs = await journal(root);
            expect(recs.filter(r => r.type !== RecordType.SESSION_HEADER && r.type !== RecordType.EPOCH).map(r => r.type)).toEqual([
                RecordType.CONN_OPEN,
                RecordType.DATA,
                RecordType.DATA,
                RecordType.DATA,
                RecordType.DATA,
                RecordType.CTX_SET,
                RecordType.DATA,
            ]);
            expect(await w.checkpointNow()).not.toBeNull(); // decided: checkpoints resume
        });

        it('the oracle agrees: undecided until the filler, then CaseView', () => {
            expect(oracle(mixed)).toEqual({ index: -1, protocol: null });
            expect(oracle([...mixed, filler])).toEqual({ index: 4, protocol: 'C' });
        });

        it('a session that ends undecided falls back to CaseView before the final boundary, so the held text is parsed', async () => {
            const root = rootOf();
            const finals: number[] = [];
            const w = await open(root, { onBoundary: b => void (b.final && finals.push(lineCount({ ctx: b.ctx } as ParserLane))) });
            listen(w);
            const text = Buffer.from('  THE COURT:  Good morning.\r\n  MR SMITH:  Morning.\r\n', 'latin1'); // no CaseView markers
            w.feed('l1', text, 2_000);
            await w.settled();
            expect(w.protocol).toBeNull();
            const res = await w.end({ endedBy: 'cloud', at: 9_000 });
            expect(w.protocol).toBe('C');
            expect(finals).toHaveLength(1);
            expect(finals[0]).toBeGreaterThanOrEqual(2);
            expect(alerts.find(a => a.kind === 'PROTOCOL_FALLBACK')).toMatchObject({ tier: 'P2', data: { how: 'end', bytes: text.length } });
            const recs = await journal(root);
            expect(recs.slice(-3).map(r => r.type)).toEqual([RecordType.CONN_CLOSE, RecordType.CTX_SET, RecordType.SESSION_END]);
            expect(decodeBody(recs[recs.length - 2])).toEqual({ protocol: 'C' });
            expect(res.rawFinalSeq).toBe(recs[recs.length - 1].seq);
        });
    });

    describe('replay and recovery reach the live decision', () => {
        it('a crash while bytes are held: recovery holds them again, the next chunk decides at the same place, and the result equals the run without the crash', async () => {
            const chunks = capture('tcp_002');
            const at = oracle(chunks).index;
            expect(at).toBeGreaterThan(1);

            // Without a crash: the same stream, with the same reconnect before the deciding chunk (a restart always
            // brings a new connection, and with it the DET-6 framing reset, which the applier keeps in its place).
            const rootA = rootOf();
            const liveA: string[] = [];
            const a = await open(rootA, { emitDelivery: (e, p) => liveA.push(JSON.stringify([e, p])) });
            listen(a, 'l1');
            feedAll(a, 'l1', chunks.slice(0, at));
            a.connectionClosed('l1', 'peer-closed');
            listen(a, 'l2');
            feedAll(a, 'l2', chunks.slice(at));
            await a.settled();
            const want = laneDigest(a.applier.lane!);

            const rootB = rootOf();
            const liveB: string[] = [];
            const b = await open(rootB, { emitDelivery: (e, p) => liveB.push(JSON.stringify([e, p])) });
            listen(b);
            feedAll(b, 'l1', chunks.slice(0, at)); // everything before the deciding chunk: held
            await crash(b);
            expect(liveB).toEqual([]);

            const b2 = await open(rootB, { emitDelivery: (e, p) => liveB.push(JSON.stringify([e, p])) });
            expect(b2.recovery).not.toBeNull();
            expect(b2.protocol).toBeNull();
            expect(b2.applier.holding).toBe(true);
            expect(b2.applier.heldCounts.records).toBe(at);
            listen(b2, 'l2');
            b2.feed('l2', chunks[at].bytes, chunks[at].tRecv);
            expect(b2.protocol).toBe('B'); // the same chunk decides, over the same window
            feedAll(b2, 'l2', chunks.slice(at + 1));
            await b2.settled();

            // The decision sits after the same DATA in both journals; the parser ends in the same state.
            const dataBefore = async (root: string) => {
                const recs = await journal(root);
                return recs.slice(0, recs.findIndex(r => r.type === RecordType.CTX_SET)).filter(r => r.type === RecordType.DATA).length;
            };
            expect(await dataBefore(rootB)).toBe(at);
            expect(await dataBefore(rootA)).toBe(at);
            expect(laneDigest(b2.applier.lane!)).toBe(want);
            // every delivery happens once the protocol is decided: none before the crash, all of them after it
            expect(liveB.length).toBe(liveA.length);
            expect(liveB.every((d, i) => d === liveA[i])).toBe(true);
            expect(lineCount(b2.applier.lane!)).toBeGreaterThan(20);

            // And B's journal replays (genesis, replay mode) to that same state.
            await b2.close();
            opened.splice(opened.indexOf(b2), 1);
            const rec = await recoverSession({ nSesid: SES, journalRoot: rootB, parserVer: '1.0.0', useCheckpoint: false });
            expect(rec.applier.protocol).toBe('B');
            expect(laneDigest(rec.applier.lane!)).toBe(want);
        });

        it('checkpoint + replay after the decision equals the uninterrupted state; a checkpoint is never taken while bytes are held', async () => {
            const chunks = capture('tcp_001');
            const at = oracle(chunks).index;
            const rootA = rootOf();
            const a = await open(rootA);
            listen(a);
            feedAll(a, 'l1', chunks);
            await a.settled();
            const want = laneDigest(a.applier.lane!);

            const rootB = rootOf();
            const store = new JsonFileCheckpointStore({ root: rootB });
            const b = await open(rootB, { checkpoints: store, checkpointEveryMs: 3_600_000, checkpointEveryChunks: 1_000_000 });
            listen(b);
            feedAll(b, 'l1', chunks.slice(0, at));
            await b.settled();
            expect(await b.checkpointNow()).toBeNull();
            const half = Math.floor(chunks.length / 2);
            feedAll(b, 'l1', chunks.slice(at, half));
            await b.settled();
            const cp = await b.checkpointNow();
            expect(cp).not.toBeNull();
            feedAll(b, 'l1', chunks.slice(half));
            await crash(b);

            const b2 = await open(rootB, { checkpoints: store });
            expect(b2.recovery!.checkpoint!.rawSeq).toBe(cp!.rawSeq);
            expect(b2.protocol).toBe('B');
            await b2.settled();
            expect(laneDigest(b2.applier.lane!)).toBe(want);
        });

        it('replay reads the journaled decision and never re-detects: a first-byte-era CTX_SET{C} before Bridge bytes replays as CaseView', async () => {
            const chunks = capture('tcp_001').slice(0, 300);
            const root = rootOf();
            const jw = await RawJournalWriter.open({ root, nSesid: SES, now: () => CLOCK_MS });
            jw.append(RecordType.SESSION_HEADER, { nSesid: SES, nCaseid: null, nLines: 25, tz: 'UTC', parserVer: '1.0.0', fmt: 1, createdAt: 1 });
            jw.append(RecordType.CONN_OPEN, { connId: 'old', remote: 'r:1', user: 'u', mode: 'listen' });
            jw.append(RecordType.CTX_SET, { protocol: 'C' });
            for (const c of chunks) jw.append(RecordType.DATA, c.bytes, { tRecvMs: c.tRecv });
            await jw.close();
            const log = newLog();
            const rec = await recoverSession({ nSesid: SES, journalRoot: root, parserVer: '1.0.0', laneFactory: spyLanes(log) });
            expect(rec.applier.protocol).toBe('C');
            expect(log.created).toEqual(['C']);
            expect(sameStream(log.fed, journaled(chunks))).toBe(true);
        });

        it('a journal with no CTX_SET{protocol} holds its bytes; if it ended, the same rule decides from them, the same every time', async () => {
            const chunks = capture('tcp_002').slice(0, 300);
            const write = async (root: string, ended: boolean) => {
                const jw = await RawJournalWriter.open({ root, nSesid: SES, now: () => CLOCK_MS });
                jw.append(RecordType.SESSION_HEADER, { nSesid: SES, nCaseid: null, nLines: 25, tz: 'UTC', parserVer: '1.0.0', fmt: 1, createdAt: 1 });
                jw.append(RecordType.CONN_OPEN, { connId: 'x', remote: 'r:1', user: 'u', mode: 'listen' });
                for (const c of chunks) jw.append(RecordType.DATA, c.bytes, { tRecvMs: c.tRecv });
                if (ended) jw.append(RecordType.SESSION_END, { endedBy: 'cloud', at: 9 });
                await jw.close();
            };
            const open1 = rootOf();
            await write(open1, false);
            const pending = await recoverSession({ nSesid: SES, journalRoot: open1, parserVer: '1.0.0' });
            expect(pending.applier.protocol).toBeNull();
            expect(pending.applier.lane).toBeNull();
            expect(pending.applier.heldCounts).toEqual({ records: chunks.length, bytes: total(chunks) });

            const ended = rootOf();
            await write(ended, true);
            const digests: string[] = [];
            for (let i = 0; i < 2; i++) {
                const rec = await recoverSession({ nSesid: SES, journalRoot: ended, parserVer: '1.0.0' });
                expect(rec.applier.protocol).toBe('B');
                expect(lineCount(rec.applier.lane!)).toBeGreaterThan(0);
                digests.push(laneDigest(rec.applier.lane!));
            }
            expect(digests[0]).toBe(digests[1]);
        });
    });

    const TCP_SERVER = path.join(corpora.extendedSourceDir(process.env, REPO), 'commands.json');
    (fs.existsSync(TCP_SERVER) ? describe : describe.skip)('the tcp-server-main corpus in listen mode (read in place; skipped when absent)', () => {
        it('is detected as Bridge with no configured protocol', async () => {
            const chunks: Chunk[] = corpora.tcpServerJsonChunks(fs.readFileSync(TCP_SERVER).toString('utf-8'), 'commands.json').filter((c: Chunk) => c.bytes.length).slice(0, 600);
            const want = oracle(chunks);
            expect(want.protocol).toBe('B');
            const root = rootOf();
            const log = newLog();
            const w = await open(root, { laneFactory: spyLanes(log) });
            listen(w);
            feedAll(w, 'l1', chunks);
            await w.settled();
            expect(w.protocol).toBe('B');
            expect(log.created).toEqual(['B']);
            expect(sameStream(log.fed, journaled(chunks))).toBe(true);
        });
    });
});
