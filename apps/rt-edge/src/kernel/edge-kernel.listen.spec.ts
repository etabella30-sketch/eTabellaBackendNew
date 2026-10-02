import { chainSeed, readJournal, RecordType, verifyRecordBatch } from '@app/rt-ingest';
import type { Cut } from '@app/edge-sync';

import { EdgePortError } from '../ports';
import { bridgeLines, eclipse, Harness, harness, sessionAssignment, sleep, waitFor } from './testing/kernel-harness';

jest.setTimeout(60_000);

describe('EdgeKernel — listen mode (Eclipse connects to the box, D34)', () => {
    let h: Harness;
    const SES = 'ses-listen-1';

    beforeEach(async () => {
        h = harness();
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed', 15_000, 'armed');
    });
    afterEach(async () => {
        await h.close();
    });

    const port = (): number => h.kernel.listenAddress()!.port;

    it('arms stored sessions at start: route registered, journal opened with SESSION_HEADER + EPOCH, session-armed published', async () => {
        expect(h.kernel.listenAddress()).toMatchObject({ address: '127.0.0.1' });
        expect(h.events.of('session-armed').map(e => e.nSesid)).toEqual([SES]);
        expect(await h.kernel.arm(SES)).toMatchObject({ ok: true, already: true });
        const view = h.kernel.session(SES)!;
        expect(view).toMatchObject({ localState: 'armed', phase: 'not-started', feed: 'waiting', catConnected: false, totalLines: 0, rev: 0, durability: 'ok', journalCorrupt: false, recovering: null });
        expect(h.kernel.view(SES)).toMatchObject({ rev: 0, totalLines: 0 });
        expect(h.kernel.currentCut(SES)).toBeNull();
        expect(h.kernel.pages(SES)).toEqual([]);
        expect(h.kernel.transmitterLink()).toMatchObject({ state: 'waiting', mode: 'listen', receivingSesid: null });
        const j = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
        expect(j.records.map(r => r.type)).toEqual([RecordType.SESSION_HEADER, RecordType.EPOCH]);
    });

    it('journals, parses and cuts a Bridge feed: cuts reach onCut in rev order, first line is published once, the view follows', async () => {
        const cuts: Cut[] = [];
        const off = h.kernel.onCut(c => cuts.push(c));
        const versionBefore = h.state.transmitter.version();
        const client = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`);
        await client.send(bridgeLines(0, 30));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 31, 15_000, '30 lines');
        await client.send(bridgeLines(30, 10));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 41, 15_000, '40 lines');

        const revs = cuts.map(c => c.rev);
        expect(revs).toEqual([...revs].sort((a, b) => a - b));
        expect(new Set(revs).size).toBe(revs.length);
        const last = cuts[cuts.length - 1];
        expect(h.kernel.currentCut(SES)).toBe(last);
        expect(h.kernel.pages(SES)).toBe(last.allPages);
        expect(last.allPages).toHaveLength(2);
        // The parser keeps the reporter's current line after the last complete one: 40 lines → 41 entries.
        expect(h.kernel.view(SES)).toMatchObject({ rev: last.rev, totalLines: 41, root: last.root });

        const view = h.kernel.session(SES)!;
        expect(view).toMatchObject({ localState: 'live', phase: 'live', feed: 'live', catConnected: true, protocol: 'B', mode: 'listen', totalLines: 41, page: 2, lastLine: { page: 2, line: 16 } });
        expect(view.peer).toMatch(/^127\.0\.0\.1:\d+$/);
        expect(view.bytesIn).toBeGreaterThan(0);
        expect(view.firstLineAtMs).not.toBeNull();
        expect(h.events.of('session-event').filter(e => e.type === 'first-line').map(e => e.nSesid)).toEqual([SES]);
        expect(h.state.sessions.get(SES)).toMatchObject({ localState: 'live' });
        expect(h.state.sessions.get(SES)!.firstLineAtMs).toBe(view.firstLineAtMs);
        expect(h.state.transmitter.version()).toBeGreaterThan(versionBefore);
        expect(h.events.of('transmitter-changed').length).toBeGreaterThan(0);
        expect(h.kernel.transmitterLink()).toMatchObject({ state: 'live', mode: 'listen', receivingSesid: SES, protocol: 'bridge' });

        const codes = h.state.connectivityLog.page({}, today()).rows.map(r => r.code);
        expect(codes).toEqual(expect.arrayContaining(['tx-listen-connected', 'tx-first-line']));

        // The journal: CONN_OPEN carries the user, never the password; CTX_SET decides the protocol once.
        await h.kernel.settled();
        const j = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
        const open = j.records.find(r => r.type === RecordType.CONN_OPEN)!;
        expect(JSON.parse(open.payload.toString())).toMatchObject({ user: `eclipse-${SES}`, mode: 'listen' });
        expect(j.records.some(r => r.payload.includes(Buffer.from(`pw-${SES}`)))).toBe(false);
        expect(j.records.filter(r => r.type === RecordType.CTX_SET).map(r => JSON.parse(r.payload.toString()))).toEqual([{ protocol: 'B' }]);
        off();
        await client.end();
    });

    it('serves the raw lane: readRaw ranges verify against the chain; rawHashAt and journalView agree', async () => {
        const client = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`);
        await client.send(bridgeLines(0, 50));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 50);
        await h.kernel.settled();
        const head = h.kernel.rawHead(SES)!;
        expect(head.headSeq).toBeGreaterThan(3);
        await waitFor(() => h.kernel.rawHead(SES)!.durableSeq === h.kernel.rawHead(SES)!.headSeq);

        const range = (await h.kernel.readRaw(SES, 1, 300))!;
        expect(range.fromSeq).toBe(1);
        expect(range.prevHash).toBe(chainSeed(SES).toString('hex'));
        expect(range.durable).toBe(true);
        const check = verifyRecordBatch(range.recs, 1, chainSeed(SES));
        expect(check.ok).toBe(true);
        expect(range.toHash).toBe((check as { hash: Buffer }).hash.toString('hex'));
        // The next range continues the chain.
        const next = (await h.kernel.readRaw(SES, range.toSeq + 1, 1 << 20))!;
        expect(next.prevHash).toBe(range.toHash);
        expect(next.toSeq).toBe(h.kernel.rawHead(SES)!.durableSeq);
        expect(await h.kernel.readRaw(SES, next.toSeq + 1, 1000)).toBeNull();
        expect(await h.kernel.rawHashAt(SES, range.toSeq)).toBe(range.toHash);
        expect(await h.kernel.rawHashAt(SES, 0)).toBe(chainSeed(SES).toString('hex'));
        expect(await h.kernel.rawHashAt(SES, 10_000)).toBeNull();
        const jv = await h.kernel.journalView(SES, [0, range.toSeq, 99_999]);
        expect(jv.headSeq).toBe(h.kernel.rawHead(SES)!.headSeq);
        expect(jv.hashAt(range.toSeq)).toBe(range.toHash);
        expect(jv.hashAt(0)).toBe(chainSeed(SES).toString('hex'));
        expect(jv.hashAt(99_999)).toBeUndefined();
        expect(jv.hashAt(7)).toBeUndefined(); // not preloaded
        await expect(h.kernel.readRaw('ghost', 1, 10)).rejects.toMatchObject({ code: 'session_not_found' });
        await expect(h.kernel.journalView('ghost', [1])).rejects.toBeInstanceOf(EdgePortError);
        await client.end();
    });

    it('refuses and alerts an unknown Eclipse login (D3): nothing kept, tx-login-refused logged', async () => {
        const c = await eclipse(port(), 'nobody', 'whatever');
        await c.send('abc');
        await c.closed;
        await waitFor(() => h.events.of('alert').some(a => a.kind === 'UNKNOWN_LOGIN'));
        expect(h.events.of('alert').find(a => a.kind === 'UNKNOWN_LOGIN')).toMatchObject({ source: 'ingest', tier: 'P2', data: expect.objectContaining({ user: 'nobody', peer: '127.0.0.1' }) });
        expect(h.state.connectivityLog.page({ filter: 'problems' }, today()).rows.map(r => r.code)).toContain('tx-login-refused');
        expect(h.kernel.session(SES)!.catConnected).toBe(false);
    });

    it('holds a second peer (never parsed), captures it into a mirrored held capture, alerts P1, logs tx-held-peer', async () => {
        const a = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`, '127.0.0.1');
        await a.send(bridgeLines(0, 5));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 5);
        const b = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`, '127.0.0.2');
        await b.send(bridgeLines(100, 3, 'Intruder'));
        await waitFor(() => (h.kernel.session(SES)?.heldPeers.length ?? 0) === 1);
        expect(h.kernel.session(SES)!.heldPeers[0]).toMatch(/^127\.0\.0\.2:/);
        expect(h.kernel.transmitterLink().heldPeers).toBe(1);
        expect(h.events.of('alert').find(x => x.kind === 'HELD_PEER')).toMatchObject({ tier: 'P1' });
        await waitFor(() => h.state.heldCaptures.list({ nSesid: SES }).length === 1);
        await sleep(100);
        expect(h.kernel.currentCut(SES)!.totalLines).toBe(6); // the held stream never reached the parser
        await b.end();
        await waitFor(() => h.state.heldCaptures.list({ pendingUpload: true }).length === 1, 10_000, 'capture closed');
        const cap = h.state.heldCaptures.list({ nSesid: SES })[0];
        expect(cap).toMatchObject({ kind: 'C', user: `eclipse-${SES}`, peer: '127.0.0.2', uploadedAtMs: null });
        expect(cap.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(h.state.connectivityLog.page({}, today()).rows.map(r => r.code)).toContain('tx-held-peer');
        await a.end();
    });

    it('marks the feed stopped when the active connection drops, and resumed on reconnect (gap reported)', async () => {
        const a = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`);
        await a.send(bridgeLines(0, 5));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 5);
        await a.end();
        await waitFor(() => h.events.of('feed-stopped').length === 1);
        expect(h.events.of('feed-stopped')[0]).toMatchObject({ nSesid: SES, mode: 'listen', lastLine: { page: 1, line: 6 } });
        expect(h.kernel.session(SES)).toMatchObject({ feed: 'stopped', catConnected: false });
        expect(h.kernel.session(SES)!.feedStoppedAtMs).not.toBeNull();
        expect(h.kernel.transmitterLink().state).toBe('disconnected');
        expect(h.state.connectivityLog.page({ filter: 'problems' }, today()).rows.map(r => r.code)).toContain('tx-peer-closed');
        const b = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`);
        await waitFor(() => h.events.of('feed-resumed').length === 1);
        const resumed = h.events.of('feed-resumed')[0];
        expect(resumed.gapToMs).toBeGreaterThanOrEqual(resumed.gapFromMs);
        expect(h.kernel.session(SES)).toMatchObject({ catConnected: true, feedStoppedAtMs: null });
        await b.end();
    });

    it('ends on request: refuses new connections while draining, journals SESSION_END, publishes ended; room codes (off in v1) untouched', async () => {
        // The drain must still be open when the late connection and the extra lines arrive, however loaded the machine
        // is. With the specs' 150 ms CAT idle a slow run ended the drain before the extra lines landed (13 lines, not
        // 16), so this box drains with the production idle (60 s) and the drain ends the other way it can: the
        // reporter's connection closes once the lines are in. Nothing here waits on a fixed delay.
        await h.close();
        h = harness({ kernel: { drain: { idleMs: 60_000, boundMs: 120_000, pollMs: 25 } } });
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed', 15_000, 'armed');
        expect(h.config.features.roomCodes).toBe(false);
        h.state.roomCodes.insert({ id: 'rc1', nSesid: SES, nCaseid: 'case-1', nUserid: 'u2', codeHash: 'h1', issuedAtMs: Date.now(), issuedBy: { nUserid: 'u1', name: 'A', via: 'online', operatorName: null }, replacedId: null });
        const a = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`);
        await a.send(bridgeLines(0, 12));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 12);
        h.state.sessions.requestEnd(SES, Date.now());
        const ending = h.kernel.requestEnd(SES, 'cloud');
        expect(h.kernel.requestEnd(SES, 'cloud')).toBe(ending);
        await waitFor(() => h.kernel.session(SES)!.localState === 'ending');
        // A new connection while draining is refused (the active one stays and keeps feeding).
        const late = await eclipse(port(), `eclipse-${SES}`, `pw-${SES}`, '127.0.0.3');
        await late.closed;
        await waitFor(() => h.events.of('alert').some(x => x.kind === 'ENDING_REFUSED'), 15_000, 'the late connection refused');
        await a.send(bridgeLines(12, 3));
        // 15 lines + the reporter's current line, cut while the session is still draining.
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 16, 15_000, 'the lines sent while draining');
        expect(h.kernel.endResult(SES)).toBeNull();
        await a.end();
        const result = await ending;
        expect(result).toMatchObject({ nSesid: SES, endedBy: 'cloud', durable: true, totalLines: 16 });
        expect(result.finalRev).toBe(h.kernel.view(SES)!.rev);
        expect(result.root).toBe(h.kernel.view(SES)!.root);
        expect(h.kernel.endResult(SES)).toEqual(result);
        expect(h.events.of('alert').some(x => x.kind === 'ENDING_REFUSED')).toBe(true);
        expect(h.events.of('session-event').filter(e => e.type === 'ended')).toEqual([{ type: 'ended', nSesid: SES, endedAtMs: result.endedAtEdgeMs }]);
        expect(h.state.sessions.get(SES)).toMatchObject({ endedAtMs: result.endedAtEdgeMs, localState: 'ending' });
        expect(h.state.roomCodes.get('rc1')!.status).toBe('unused');
        const j = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
        expect(j.records[j.records.length - 1].type).toBe(RecordType.SESSION_END);
        expect(j.head.seq).toBe(result.rawFinalSeq);
        expect(j.head.hash.toString('hex')).toBe(result.rawFinalHash);
        // After the end the session stays open read-only; arm refuses; the login no longer matches a route.
        expect(h.kernel.session(SES)).toMatchObject({ feed: 'ended', phase: 'ended' });
        expect(await h.kernel.arm(SES)).toMatchObject({ ok: false, reason: 'ended' });
        expect(await h.kernel.requestEnd(SES, 'again')).toEqual(result);
        await a.closed;
    });

    it('drops a sealed session on session-status {cause:"uplink"} and frees its route', async () => {
        h.state.sessions.requestEnd(SES, Date.now());
        await h.kernel.requestEnd(SES, 'cloud');
        h.state.sessions.setLocal(SES, { localState: 'sealed', sealedAtMs: Date.now(), sealState: 'K' }, Date.now());
        h.events.bus.publish('session-status', { nSesid: SES, cause: 'uplink', atMs: Date.now() });
        await waitFor(() => h.kernel.session(SES) === null);
        expect(h.kernel.sessions()).toEqual([]);
        expect(h.kernel.endResult(SES)).toBeNull();
        await expect(h.kernel.requestEnd(SES, 'x')).rejects.toMatchObject({ code: 'session_not_found' });
    });

    it('arms a session pushed later (assignments-changed) and refuses unknown, ended, disk-low and parser-mismatch sessions', async () => {
        h.assign(sessionAssignment('ses-late'));
        await waitFor(() => h.kernel.session('ses-late')?.localState === 'armed');
        expect(await h.kernel.arm('ghost')).toMatchObject({ ok: false, reason: 'unknown-session' });
        h.state.sessions.upsertAssignment(sessionAssignment('ses-ended', { cloudOp: 'end' }), Date.now());
        expect(await h.kernel.arm('ses-ended')).toMatchObject({ ok: false, reason: 'ended' });
        h.state.sessions.upsertAssignment(sessionAssignment('ses-pin', { parserVer: '0.0.1+other' }), Date.now());
        expect(await h.kernel.arm('ses-pin')).toMatchObject({ ok: false, reason: 'parser-mismatch' });
    });
});

describe('EdgeKernel — arm refusals that need their own box state', () => {
    it('refuses disk-low below EDGE_DISK_ARM_MIN_MB and a CaseView session with a clock before the build', async () => {
        const h = harness({ kernel: { diskFreeMb: async () => 512, buildDateMs: Date.now() + 86_400_000 } });
        try {
            h.state.sessions.upsertAssignment(sessionAssignment('ses-disk'), Date.now());
            await h.kernel.start();
            expect(await h.kernel.arm('ses-disk')).toMatchObject({ ok: false, reason: 'disk-low' });
            expect(h.events.of('alert').some(a => a.kind === 'ARM_REFUSED')).toBe(true);
        } finally {
            await h.close();
        }
        const h2 = harness({ kernel: { buildDateMs: Date.now() + 86_400_000 } });
        try {
            h2.state.sessions.upsertAssignment(sessionAssignment('ses-cv', { protocol: 'C' }), Date.now());
            h2.state.sessions.upsertAssignment(sessionAssignment('ses-b', { protocol: 'B' }), Date.now());
            await h2.kernel.start();
            expect(await h2.kernel.arm('ses-cv')).toMatchObject({ ok: false, reason: 'clock-before-build' });
            expect(await h2.kernel.arm('ses-b')).toMatchObject({ ok: true });
        } finally {
            await h2.close();
        }
    });

    it('with room codes switched on (features.roomCodes), the end expires the session\'s unused codes', async () => {
        const h = harness({ config: { features: { roomCodes: true } } });
        try {
            h.state.sessions.upsertAssignment(sessionAssignment('ses-rc'), Date.now());
            h.state.roomCodes.insert({ id: 'rc1', nSesid: 'ses-rc', nCaseid: 'case-1', nUserid: 'u2', codeHash: 'h1', issuedAtMs: Date.now(), issuedBy: { nUserid: 'u1', name: 'A', via: 'online', operatorName: null }, replacedId: null });
            await h.kernel.start();
            await waitFor(() => h.kernel.session('ses-rc')?.localState === 'armed');
            h.state.sessions.requestEnd('ses-rc', Date.now());
            await h.kernel.requestEnd('ses-rc', 'cloud');
            expect(h.state.roomCodes.get('rc1')!.status).toBe('expired');
        } finally {
            await h.close();
        }
    });

    it('a kernel that never started answers queries, refuses arm and ends, and closes as a no-op (cli mode)', async () => {
        const h = harness();
        try {
            h.state.sessions.upsertAssignment(sessionAssignment('ses-cli'), Date.now());
            expect(h.kernel.sessions()).toEqual([]);
            expect(await h.kernel.arm('ses-cli')).toMatchObject({ ok: false, reason: 'worker-error' });
            await expect(h.kernel.requestEnd('ses-cli', 'x')).rejects.toThrow(/not running/);
            expect(h.kernel.transmitterState()).toMatchObject({ settings: null, stateVersion: 0, link: { state: 'waiting', mode: 'listen' }, listen: { boxTransmitterAddress: '127.0.0.1' } });
            await h.kernel.close();
        } finally {
            await h.close();
        }
    });
});

function today(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
