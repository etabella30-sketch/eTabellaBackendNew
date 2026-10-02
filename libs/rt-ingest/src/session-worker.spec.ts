import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { JsonFileCheckpointStore } from './checkpoint';
import { LaneFactory, LaneOptions, LaneState, ParserLane } from './parser-lane';
import { decodeBody, JournalCorruptError, JournalFile, JournalFs, nodeJournalFs, readJournal, RecordType } from './raw-journal';
import { BoundaryInfo, SessionWorker, SessionWorkerOptions } from './session-worker';
import { IngestAlert } from './types';

const SES = 'ses-worker-1';
// real file I/O and parser runs: generous under a parallel full-suite run
jest.setTimeout(30_000);

const STX = 0x02;
const ETX = 0x03;
const cmd = (letter: string, data: number[] = []) => Buffer.from([STX, letter.charCodeAt(0), ...data, ETX]);

/** Bridge feed: N, T and the text of `count` lines. */
function bridgeLines(from: number, count: number): Buffer {
    const parts: Buffer[] = [];
    for (let i = from; i < from + count; i++) {
        parts.push(cmd('N', [(i % 25) + 1]));
        parts.push(cmd('T', [9, Math.floor(i / 60) % 60, i % 60, 0]));
        parts.push(Buffer.from(`Line ${i} text`, 'latin1'));
    }
    return Buffer.concat(parts);
}

function texts(lineBuffer: any[]): string[] {
    return (lineBuffer || []).filter(l => Array.isArray(l) && Array.isArray(l[1]) && l[1].length).map(l => String.fromCharCode(...l[1]));
}

async function waitFor(cond: () => boolean, ms = 10_000): Promise<void> {
    const deadline = Date.now() + ms;
    while (!cond()) {
        if (Date.now() > deadline) throw new Error('timed out waiting');
        await new Promise(resolve => setTimeout(resolve, 5));
    }
}

/** nodeJournalFs with an event log, a datasync gate and injectable failures. */
function tracingFs(events: string[], ctl: { fail?: boolean; failWrite?: boolean; gate?: Promise<void> | null } = {}): JournalFs {
    return {
        ...nodeJournalFs,
        async openAppend(file: string): Promise<JournalFile> {
            const inner = await nodeJournalFs.openAppend(file);
            return {
                async write(data) {
                    // a full disk refuses the write itself: the bytes never reach the file
                    if (ctl.failWrite) throw Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' });
                    await inner.write(data);
                },
                async datasync() {
                    if (ctl.gate) await ctl.gate;
                    if (ctl.fail) throw Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' });
                    events.push('datasync');
                    await inner.datasync();
                },
                close: () => inner.close(),
            };
        },
    };
}

/** A lane that records what reaches it (for ordering tests). */
function spyLaneFactory(events: string[]): LaneFactory {
    return (opts: LaneOptions): ParserLane => {
        const lane: any = {
            protocol: opts.protocol,
            ctx: { job: { lineBuffer: [] } },
            replay: !!opts.replay,
            nextId: 1,
            chunks: 0,
            feed(chunk: Buffer) {
                lane.chunks += 1;
                events.push(`feed:${chunk.toString('latin1')}`);
            },
            connectionOpened: async () => {
                events.push('lane:conn-open');
                return false;
            },
            abortWindow: async () => false,
            setCaseTabs: async () => undefined,
            windowOpen: async () => false,
            inLane: async (fn: any) => fn(undefined),
            idle: async () => undefined,
            snapshot: async (extra?: () => any) => ({ state: { v: 1, protocol: opts.protocol } as LaneState, extra: extra?.() }),
        };
        events.push(`lane:create:${opts.protocol}`);
        return lane as ParserLane;
    };
}

describe('SessionWorker', () => {
    let root: string;
    let alerts: IngestAlert[];
    const workers: SessionWorker[] = [];
    const open = async (extra: Partial<SessionWorkerOptions> = {}) => {
        const w = await SessionWorker.open({
            meta: { nSesid: SES, nCaseid: 'case-1', nLines: 25, tz: 'Asia/Kolkata', parserVer: '1.0.0', fmt: 1, createdAt: 42 },
            journalRoot: root,
            parserVer: '1.0.0',
            onAlert: a => alerts.push(a),
            boundaryMs: 5,
            ...extra,
        });
        workers.push(w);
        return w;
    };
    const records = async () => (await readJournal({ root, nSesid: SES })).records.map(r => ({ seq: r.seq, type: r.type, body: decodeBody(r) as any }));

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-worker-'));
        alerts = [];
    });
    afterEach(async () => {
        for (const w of workers.splice(0)) await w.close().catch(() => undefined);
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('starts a new journal with SESSION_HEADER then EPOCH{1, edge}', async () => {
        const w = await open();
        await w.close();
        const recs = await records();
        expect(recs.map(r => r.type)).toEqual([RecordType.SESSION_HEADER, RecordType.EPOCH]);
        expect(recs[0].body).toEqual({ nSesid: SES, nCaseid: 'case-1', nLines: 25, tz: 'Asia/Kolkata', parserVer: '1.0.0', fmt: 1, createdAt: 42 });
        expect(recs[1].body).toEqual({ epoch: 1, owner: 'edge' });
    });

    it('order: the WAL group fdatasync returns BEFORE the parser sees the chunk', async () => {
        const events: string[] = [];
        let release!: () => void;
        const ctl: { gate: Promise<void> | null } = { gate: null };
        const w = await open({ fs: tracingFs(events, ctl), laneFactory: spyLaneFactory(events) });
        ctl.gate = new Promise(resolve => (release = resolve));
        // dial mode: the configured protocol decides at once (DET-4), so each chunk is parsed as soon as it is durable
        w.connectionOpened({ connId: 'c1', remote: '10.0.0.5:5000', mode: 'dial', protocolHint: 'B' });
        expect(w.feed('c1', Buffer.from('\x02HELLO'))).toBe(true);
        await new Promise(resolve => setTimeout(resolve, 40));
        expect(events.filter(e => e.startsWith('feed:'))).toEqual([]); // held back: not durable yet
        release();
        ctl.gate = null;
        await w.settled();
        const firstFeed = events.indexOf('feed:\x02HELLO');
        expect(firstFeed).toBeGreaterThan(-1);
        expect(events.lastIndexOf('datasync', firstFeed)).toBeGreaterThan(-1);
        // every chunk, in order, only after a datasync that covered it
        for (let i = 0; i < 5; i++) w.feed('c1', Buffer.from(`chunk-${i}`));
        await w.settled();
        const feeds = events.filter(e => e.startsWith('feed:chunk-'));
        expect(feeds).toEqual(['feed:chunk-0', 'feed:chunk-1', 'feed:chunk-2', 'feed:chunk-3', 'feed:chunk-4']);
        expect(events.indexOf('datasync', firstFeed + 1)).toBeLessThan(events.indexOf('feed:chunk-0'));
        expect(w.journal.durableHead.seq).toBe(w.head.seq);
    });

    it('decides the protocol once from the framing (DET-4) and journals CTX_SET before the DATA that decided it', async () => {
        const events: string[] = [];
        const w = await open({ laneFactory: spyLaneFactory(events) });
        w.connectionOpened({ connId: 'c1', remote: '10.0.0.5:5000', user: 'alok', mode: 'listen' });
        w.feed('c1', Buffer.from(' text')); // mid-page text first, as Eclipse sends it: the old first-byte rule said CaseView
        w.feed('c1', cmd('N', [1])); // one complete Bridge frame: not enough yet
        expect(w.protocol).toBeNull();
        w.feed('c1', cmd('T', [9, 0, 2, 3])); // the second frame decides Bridge (STX/ETX bytes inside T data are data)
        expect(w.protocol).toBe('B');
        w.feed('c1', Buffer.from('plain text later')); // would look like nothing on its own
        await w.close();
        const recs = await records();
        const types = recs.map(r => r.type);
        expect(types).toEqual([
            RecordType.SESSION_HEADER,
            RecordType.EPOCH,
            RecordType.CONN_OPEN,
            RecordType.DATA,
            RecordType.DATA,
            RecordType.CTX_SET,
            RecordType.DATA,
            RecordType.DATA,
        ]);
        expect(recs[5].body).toEqual({ protocol: 'B' });
        expect(w.protocol).toBe('B');
        // one lane, then every chunk in stream order: the two held ones first
        expect(events.filter(e => e.startsWith('lane:') || e.startsWith('feed:'))).toEqual([
            'lane:create:B',
            'feed: text',
            `feed:${cmd('N', [1]).toString('latin1')}`,
            `feed:${cmd('T', [9, 0, 2, 3]).toString('latin1')}`,
            'feed:plain text later',
        ]);
        expect(alerts.filter(a => a.kind === 'PROTOCOL_FALLBACK')).toHaveLength(0);
    });

    it('dial mode: the configured protocol decides; CONN_OPEN carries no user; a later mismatch is alerted, not applied', async () => {
        const events: string[] = [];
        const w = await open({ laneFactory: spyLaneFactory(events) });
        w.connectionOpened({ connId: 'd1', remote: '192.168.50.10:1337', mode: 'dial', protocolHint: 'C', user: 'ignored' });
        w.feed('d1', Buffer.from([0x02, 0x41])); // STX first, but the setting says CaseView
        w.connectionClosed('d1', 'settings-changed');
        w.connectionOpened({ connId: 'd2', remote: '192.168.50.10:1337', mode: 'dial', protocolHint: 'B' });
        w.feed('d2', Buffer.from('x'));
        await w.close();
        const recs = await records();
        const open1 = recs.find(r => r.type === RecordType.CONN_OPEN)!;
        expect(open1.body).toEqual({ connId: 'd1', remote: '192.168.50.10:1337', mode: 'dial' });
        expect(recs.filter(r => r.type === RecordType.CTX_SET).map(r => r.body)).toEqual([{ protocol: 'C' }]);
        expect(alerts.filter(a => a.kind === 'PROTOCOL_MISMATCH')).toHaveLength(1);
        expect(w.protocol).toBe('C');
    });

    it('brackets connections with CONN_OPEN / CONN_CLOSE and supersedes a still-open one', async () => {
        const w = await open({ laneFactory: spyLaneFactory([]) });
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.connectionOpened({ connId: 'b', remote: '10.0.0.5:2', user: 'u', mode: 'listen' });
        expect(w.connectionClosed('a', 'peer-closed')).toBeNull(); // not the active one
        expect(w.connectionClosed('b', 'peer-closed')).not.toBeNull();
        await w.close();
        const conn = (await records()).filter(r => r.type === RecordType.CONN_OPEN || r.type === RecordType.CONN_CLOSE).map(r => [r.type, r.body.connId, r.body.reason ?? r.body.user]);
        expect(conn).toEqual([
            [RecordType.CONN_OPEN, 'a', 'u'],
            [RecordType.CONN_CLOSE, 'a', 'superseded'],
            [RecordType.CONN_OPEN, 'b', 'u'],
            [RecordType.CONN_CLOSE, 'b', 'peer-closed'],
        ]);
    });

    it('is fed only by the active connection: a stray chunk is dropped and alerted, never journaled', async () => {
        const w = await open({ laneFactory: spyLaneFactory([]) });
        expect(w.feed('nobody', Buffer.from('x'))).toBe(false);
        w.connectionOpened({ connId: 'a', remote: 'r', user: 'u', mode: 'listen' });
        expect(w.feed('b', Buffer.from('y'))).toBe(false);
        await w.close();
        expect((await records()).some(r => r.type === RecordType.DATA)).toBe(false);
        expect(alerts.filter(a => a.kind === 'STRAY_FEED')).toHaveLength(2);
    });

    it('runs the boundary sentinel in the lane after the chunks fed before it, with their raw position', async () => {
        const boundaries: Array<{ seq: number; hash: string; texts: string[]; reason: string }> = [];
        const w = await open({
            onBoundary: (b: BoundaryInfo) => {
                boundaries.push({ seq: b.rawSeqThrough, hash: b.rawHashThrough, texts: texts(b.ctx.job.lineBuffer), reason: b.reason });
            },
        });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 5));
        w.feed('c', bridgeLines(5, 5));
        await w.settled();
        const lastDataSeq = w.head.seq;
        await waitFor(() => boundaries.some(b => b.seq === lastDataSeq));
        const b = boundaries.find(x => x.seq === lastDataSeq)!;
        expect(b.texts).toEqual(Array.from({ length: 10 }, (_, i) => `Line ${i} text`));
        expect(b.hash).toBe(w.head.hash.toString('hex'));
        expect(b.reason).toBe('tick');
        expect(w.status().lines).toBeGreaterThan(0);
        expect(w.lastLineAt).not.toBeNull();
    });

    it('parses CaseView too (protocol C from its line markers, DET-4)', async () => {
        const seen: string[][] = [];
        const w = await open({ onBoundary: b => void seen.push(texts(b.ctx.job.lineBuffer)) });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        // CaseView ends each line with 0xF9 + 4 hex digits + 0xFA
        const br = (n: number) => Buffer.from([0xf9, ...Buffer.from(n.toString(16).toUpperCase().padStart(4, '0'), 'latin1'), 0xfa]);
        w.feed('c', Buffer.concat([Buffer.from('  THE COURT:  Good morning.', 'latin1'), br(1), Buffer.from('  MR SMITH:  Morning.', 'latin1'), br(2)]));
        await w.settled();
        await waitFor(() => seen.length > 0 && seen[seen.length - 1].length >= 2);
        expect(w.protocol).toBe('C');
        expect(seen[seen.length - 1].join('|')).toContain('Good morning.');
    });

    it('degraded durability (MR-5): keeps parsing, journals INCIDENT + CRITICAL alert, and closes the range on recovery', async () => {
        const events: string[] = [];
        const ctl: { fail: boolean } = { fail: false };
        const seen: string[] = [];
        const w = await open({ fs: tracingFs(events, ctl), degradedRetryMs: 20, onBoundary: b => void seen.splice(0, seen.length, ...texts(b.ctx.job.lineBuffer)) });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 2));
        await w.settled();
        ctl.fail = true;
        w.feed('c', bridgeLines(2, 2));
        await w.settled();
        expect(w.durability).toBe('degraded');
        await waitFor(() => seen.includes('Line 3 text')); // parsing went on from memory
        const crit = alerts.find(a => a.kind === 'DEGRADED_DURABILITY')!;
        expect(crit).toMatchObject({ tier: 'P1', critical: true, nSesid: SES });
        expect(w.journal.undurableRecords().some(r => r.type === RecordType.INCIDENT)).toBe(true);
        ctl.fail = false;
        await waitFor(() => w.durability === 'ok');
        await waitFor(() => alerts.some(a => a.kind === 'DURABILITY_RESTORED'));
        await w.settled();
        await w.close();
        const incidents = (await records()).filter(r => r.type === RecordType.INCIDENT).map(r => r.body);
        expect(incidents[0]).toMatchObject({ kind: 'DEGRADED_DURABILITY', level: 'warning' });
        expect(incidents[0].toSeq).toBeUndefined();
        expect(incidents[1]).toMatchObject({ kind: 'DEGRADED_DURABILITY', level: 'warning', fromSeq: incidents[0].fromSeq });
        expect(incidents[1].toSeq).toBeGreaterThanOrEqual(incidents[1].fromSeq);
        // every DATA record made it to disk after the retry
        expect((await records()).filter(r => r.type === RecordType.DATA)).toHaveLength(2);
    });

    it('a disk that hangs raises DEGRADED_DURABILITY within the watchdog; parsing (the room view) goes on; it recovers once the disk answers (review 38)', async () => {
        const events: string[] = [];
        let release!: () => void;
        const ctl: { gate: Promise<void> | null } = { gate: null };
        const seen: string[] = [];
        const w = await open({
            fs: tracingFs(events, ctl),
            journal: { writeTimeoutMs: 60 },
            degradedRetryMs: 20,
            onBoundary: b => void seen.splice(0, seen.length, ...texts(b.ctx.job.lineBuffer)),
        });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 2));
        await w.settled();
        ctl.gate = new Promise<void>(resolve => (release = resolve)); // every fdatasync now hangs, nothing errors
        w.feed('c', bridgeLines(2, 2));
        await w.settled(); // released by the watchdog, not by the disk
        expect(w.durability).toBe('degraded');
        await waitFor(() => seen.includes('Line 3 text'));
        expect(alerts.find(a => a.kind === 'DEGRADED_DURABILITY')).toMatchObject({ tier: 'P1', critical: true, nSesid: SES });
        expect(alerts.find(a => a.kind === 'DEGRADED_DURABILITY')!.message).toContain('write timeout');
        ctl.gate = null;
        release();
        await waitFor(() => w.durability === 'ok');
        await w.settled();
        await w.close();
        expect((await records()).filter(r => r.type === RecordType.DATA)).toHaveLength(2);
        expect(alerts.some(a => a.kind === 'UNDURABLE_TAIL_LOST')).toBe(false);
    });

    it('close() while degraded writes the tail once the disk takes it again; nothing is lost or alerted (review 30)', async () => {
        const events: string[] = [];
        const ctl: { fail: boolean } = { fail: false };
        const w = await open({ fs: tracingFs(events, ctl), degradedRetryMs: 600_000 });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 2));
        await w.settled();
        ctl.fail = true;
        w.feed('c', bridgeLines(2, 2));
        await w.settled();
        expect(w.durability).toBe('degraded');
        ctl.fail = false; // the disk is back, but the 5-minute retry has not run: the stop must still write the tail
        await w.close();
        expect(alerts.some(a => a.kind === 'UNDURABLE_TAIL_LOST')).toBe(false);
        expect((await records()).filter(r => r.type === RecordType.DATA)).toHaveLength(2);
    });

    it('close() that cannot write the tail raises UNDURABLE_TAIL_LOST; the next open raises it again, journals it and clears the marker (review 30)', async () => {
        const events: string[] = [];
        const ctl: { failWrite: boolean } = { failWrite: false };
        const w = await open({ fs: tracingFs(events, ctl), degradedRetryMs: 600_000 });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 2));
        await w.settled();
        const durableSeq = w.journal.durableHead.seq;
        ctl.failWrite = true;
        w.feed('c', bridgeLines(2, 2));
        await w.settled();
        await w.close();
        workers.splice(0);
        const atClose = alerts.find(a => a.kind === 'UNDURABLE_TAIL_LOST')!;
        expect(atClose).toMatchObject({ tier: 'P1', critical: true, nSesid: SES, data: { fromSeq: durableSeq + 1, durableSeq } });
        expect((atClose.data as any).records).toBeGreaterThanOrEqual(2);
        expect(atClose.data!.marker).toEqual(expect.stringContaining('lost-tail-'));
        expect(fs.existsSync(atClose.data!.marker as string)).toBe(true);

        alerts = [];
        const w2 = await open(); // the disk is healthy after the restart
        const atOpen = alerts.find(a => a.kind === 'UNDURABLE_TAIL_LOST')!;
        expect(atOpen).toMatchObject({ tier: 'P1', critical: true, data: { fromSeq: durableSeq + 1, durableSeq } });
        await w2.close();
        workers.splice(0);
        const incident = (await records()).find(r => r.type === RecordType.INCIDENT && /lost at the previous stop/.test(r.body.note ?? ''))!;
        expect(incident.body).toMatchObject({ kind: 'DEGRADED_DURABILITY', level: 'warning', fromSeq: durableSeq + 1 });
        expect(fs.existsSync(atClose.data!.marker as string)).toBe(false);
        alerts = [];
        await open();
        expect(alerts.some(a => a.kind === 'UNDURABLE_TAIL_LOST')).toBe(false);
    });

    it('end(): CONN_CLOSE, final boundary, SESSION_END as the last record; then refuses input; a reopen is ended', async () => {
        const finals: BoundaryInfo['reason'][] = [];
        const w = await open({ onBoundary: b => void finals.push(b.reason) });
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 3));
        const res = await w.end({ endedBy: 'cloud', at: 777 });
        expect(finals[finals.length - 1]).toBe('final');
        expect(res).toMatchObject({ nSesid: SES, endedAtEdgeMs: 777, endedBy: 'cloud', durable: true });
        const recs = await records();
        expect(recs[recs.length - 1]).toMatchObject({ type: RecordType.SESSION_END, body: { endedBy: 'cloud', at: 777 }, seq: res.rawFinalSeq });
        expect(recs[recs.length - 2]).toMatchObject({ type: RecordType.CONN_CLOSE, body: { connId: 'c', reason: 'session-end' } });
        expect(res.rawFinalHash).toBe(w.head.hash.toString('hex'));
        expect(w.ended).toBe(true);
        expect(w.feed('c', Buffer.from('late'))).toBe(false);
        expect(() => w.connectionOpened({ connId: 'z', remote: 'r', mode: 'listen' })).toThrow(/ended/);
        expect(await w.end({ endedBy: 'again' })).toBe(res);
        await w.close();
        const again = await open();
        expect(again.ended).toBe(true);
        expect((await again.end({ endedBy: 'x' })).rawFinalSeq).toBe(res.rawFinalSeq);
    });

    it('journals TAIL_TRUNCATED after a torn tail, and CONN_CLOSE{recovered} for a connection a crash left open', async () => {
        const w = await open();
        w.connectionOpened({ connId: 'c', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('c', bridgeLines(0, 2));
        await w.settled();
        await w.journal.close(); // "crash": no CONN_CLOSE, no SESSION_END
        workers.splice(0);
        fs.appendFileSync(path.join(root, SES, 'seg-00001.ej'), Buffer.from([1, 2, 3, 4, 5]));
        const w2 = await open();
        expect(w2.recovery).not.toBeNull();
        expect(w2.recovery!.tailTruncated).toMatchObject({ bytes: 5 });
        await w2.close();
        const tail = (await records()).slice(-2);
        expect(tail[0]).toMatchObject({ type: RecordType.INCIDENT, body: { kind: 'TAIL_TRUNCATED', level: 'info' } });
        expect(tail[1]).toMatchObject({ type: RecordType.CONN_CLOSE, body: { connId: 'c', reason: 'recovered' } });
        expect(w2.activeConnId).toBeNull();
    });

    it('an open R..E window is aborted when a new connection opens (DET-6 / S-D11): INCIDENT + alert, text kept', async () => {
        const w = await open();
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('a', bridgeLines(0, 3));
        w.feed('a', cmd('R', [9, 0, 1, 0, 9, 0, 2, 0])); // refresh window 09:00:01:00 .. 09:00:02:00
        w.feed('a', Buffer.from('replacement words', 'latin1'));
        expect(await w.windowOpen()).toBe(true);
        w.connectionClosed('a', 'peer-closed');
        w.connectionOpened({ connId: 'b', remote: '10.0.0.5:2', user: 'u', mode: 'listen' });
        await w.settled();
        await waitFor(() => alerts.some(a => a.kind === 'ABORTED_WINDOW'));
        expect(await w.windowOpen()).toBe(false);
        await w.settled();
        expect(texts(w.applier.lane!.ctx.job.lineBuffer)).toEqual(['Line 0 text', 'Line 1 text', 'Line 2 text']);
        await w.close();
        const inc = (await records()).filter(r => r.type === RecordType.INCIDENT).map(r => r.body);
        expect(inc).toEqual([expect.objectContaining({ kind: 'ABORTED_WINDOW', level: 'warning' })]);
    });

    it('windowOpen() answers while the reporter keeps typing (it does not wait for a quiet feed)', async () => {
        const w = await open();
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('a', bridgeLines(0, 1));
        let typing = true;
        let i = 1;
        const typist = (async () => {
            while (typing) {
                w.feed('a', bridgeLines(i++, 1));
                await new Promise(resolve => setTimeout(resolve, 2));
            }
        })();
        const t0 = Date.now();
        expect(await w.windowOpen()).toBe(false);
        expect(Date.now() - t0).toBeLessThan(3_000);
        typing = false;
        await typist;
    });

    it('abortWindow(reason) journals the abort as a CTX_SET parse input', async () => {
        const w = await open();
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('a', bridgeLines(0, 1));
        w.feed('a', cmd('R', [9, 0, 0, 0, 9, 0, 1, 0]));
        expect(await w.windowOpen()).toBe(true);
        w.abortWindow('end-bound');
        expect(await w.windowOpen()).toBe(false);
        await w.close();
        expect((await records()).some(r => r.type === RecordType.CTX_SET && r.body.abortWindow === 'end-bound')).toBe(true);
    });

    it('refuses to open a corrupt journal and raises a CRITICAL JOURNAL_CORRUPT alert', async () => {
        const w = await open({ journal: { segmentMaxBytes: 120 } });
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        for (let i = 0; i < 6; i++) w.feed('a', Buffer.from(`chunk-${i}-${'x'.repeat(40)}`));
        await w.close();
        workers.splice(0);
        const first = path.join(root, SES, 'seg-00001.ej');
        const buf = fs.readFileSync(first);
        buf[buf.length - 2] ^= 0xff;
        fs.writeFileSync(first, buf);
        await expect(open()).rejects.toBeInstanceOf(JournalCorruptError);
        expect(alerts.find(a => a.kind === 'JOURNAL_CORRUPT')).toMatchObject({ tier: 'P1', critical: true });
    });

    it('a damaged record inside a small, synced journal is corrupt, never a torn tail: no record is truncated or lost', async () => {
        const w = await open();
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        for (let i = 0; i < 100; i++) {
            w.feed('a', Buffer.from(`chunk-${i};`));
            if (i % 10 === 9) await w.settled(); // ten separate group commits
        }
        await w.close();
        workers.splice(0);
        const file = path.join(root, SES, 'seg-00001.ej');
        const buf = fs.readFileSync(file);
        expect(buf.length).toBeLessThan(16 * 1024); // well inside one group: the size bound alone cannot tell
        buf[300] ^= 0xff;
        fs.writeFileSync(file, buf);
        await expect(open()).rejects.toBeInstanceOf(JournalCorruptError);
        expect(alerts.find(a => a.kind === 'JOURNAL_CORRUPT')).toMatchObject({ tier: 'P1', critical: true });
        expect(fs.readFileSync(file).equals(buf)).toBe(true); // nothing truncated
    });

    it('DET-10: a NEW session pinned to another parser is refused before anything is written; checkpoints name the parser that made them', async () => {
        await expect(open({ meta: { nSesid: SES, parserVer: 'OTHER-1.0.0' } })).rejects.toMatchObject({
            code: 'PARSER_VERSION_MISMATCH',
            pinned: 'OTHER-1.0.0',
            running: '1.0.0',
        });
        expect(alerts.find(a => a.kind === 'WORKER_ERROR')).toMatchObject({ tier: 'P1', critical: true });
        expect(fs.existsSync(path.join(root, SES))).toBe(false); // never armed

        const store = new JsonFileCheckpointStore({ root });
        const w = await open({ checkpoints: store, checkpointEveryMs: 3_600_000 });
        w.connectionOpened({ connId: 'a', remote: '10.0.0.5:1', user: 'u', mode: 'listen' });
        w.feed('a', bridgeLines(0, 2));
        await w.settled();
        expect((await w.checkpointNow())!.parserVer).toBe('1.0.0');
        await w.close();
        expect((await records())[0]).toMatchObject({ type: RecordType.SESSION_HEADER, body: { parserVer: '1.0.0' } });
        expect((await store.latest(SES))!.parserVer).toBe('1.0.0');
    });

    it('a session with no pinned parser is stamped with the running one', async () => {
        const w = await open({ meta: { nSesid: SES }, parserVer: '3.1.4' });
        await w.close();
        expect((await records())[0].body.parserVer).toBe('3.1.4');
    });
});
