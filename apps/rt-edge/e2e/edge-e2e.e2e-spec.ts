/**
 * Step 10 of the RT venue edge box: the whole chain on one machine, no real infrastructure.
 *
 *   transmitter stand-in ──CAT──► REAL box app (apps/rt-edge: startServer + the whole AppModule graph, node:sqlite,
 *   (tcp-server-main/tcp.js       journals on disk, LAN HTTP + socket)  ──/edge via a severable TCP proxy──►
 *    as a child, or its capture    stand-in cloud: the REAL realtime-server edge module (EdgeUplinkGateway, device
 *    replayed with its chunking)   auth, EdgeSyncService, EdgeRawStoreService, EdgeRegistryService) with only the DB,
 *                                  Redis and the feed store faked (harness/cloud.ts)
 *   readers: a room device on the box LAN socket and a remote viewer on the cloud socket (harness/viewers.ts).
 *
 * The feed is the recorded Bridge hearing of tcp-server-main (`commands.json`, 2 886 writes, 48 015 B), read in place
 * and never copied; every assertion is on counts and digests (its golden is digest-only). Nothing prints line text.
 *
 * Run (one command, ~3–5 min):
 *   node "D:/etabella tech/etabella_backend-tech-rt-edge/node_modules/jest/bin/jest.js" --config "D:/etabella tech/etabella_backend-tech-rt-edge/apps/rt-edge/e2e/jest-e2e.config.js" --maxWorkers=2
 * Skipped (reported) when the tcp-server-main folder is absent (set RT_EDGE_TCP_SERVER_DIR to point at it).
 *
 * Scenarios (spec rev 3 §5 sync, §10 failure table, §12.3 the morning test feed):
 *  1. listen mode happy path       5. cloud restart (D18 boot recompute)
 *  2. dial mode (tcp.js child)      6. end → drain → seal → cloud K
 *  3. internet cut via the proxy    7. a Bridge stream that starts mid-page is parsed as Bridge (DET-4)
 *  4. box restart: graceful (4a, 4c), a process-level hard kill (4b), a room device served mid-replay (4d)
 */
import { sealSigningPayload } from '@app/edge-sync';
import { decodeBody, RecordType, StoredRecord } from '@app/rt-ingest';

import { replayCorpus } from '../../../tools/ci/golden-replay/replay-harness';
import { verifyDeviceSignature } from '../src/uplink/device-key';
import { IDS } from './harness/cloud';
import { corpusAvailable, COMMANDS_FILE, firstTextEntryFrom } from './harness/corpus';
import { sleep, waitFor } from './harness/pacer';
import { TcpServerChild } from './harness/tcp-server-child';
import { E2E_KERNEL, heldJournalFs } from './harness/tuning';
import type { RoomDevice } from './harness/viewers';
import { World } from './harness/world';

const REPORT_PREFIX = '[rt-edge e2e]';
const report = (scenario: string, data: Record<string, unknown>): void => {
    // Counts, digests and timings only.
    // eslint-disable-next-line no-console
    console.log(`${REPORT_PREFIX} ${scenario} ${JSON.stringify({ ...data, consoleErrors: consoleNoise.error, consoleWarnings: consoleNoise.warn })}`);
};

/**
 * The parser and libraries log with console.* (timings, and on an error the offending data). Nothing they print may
 * reach the output (it could carry hearing text): only the suite's own report lines pass; the rest is counted.
 */
const consoleNoise = { log: 0, warn: 0, error: 0 };
beforeAll(() => {
    const keep = console.log.bind(console);
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        if (typeof args[0] === 'string' && args[0].startsWith(REPORT_PREFIX)) keep(...args);
        else consoleNoise.log += 1;
    });
    for (const level of ['info', 'debug'] as const) jest.spyOn(console, level).mockImplementation(() => void (consoleNoise.log += 1));
    jest.spyOn(console, 'warn').mockImplementation(() => void (consoleNoise.warn += 1));
    jest.spyOn(console, 'error').mockImplementation(() => void (consoleNoise.error += 1));
});
beforeEach(() => {
    consoleNoise.log = consoleNoise.warn = consoleNoise.error = 0;
});

/** DATA bytes of each connection in a journal (split at CONN_OPEN), and the CTX_SET protocol decisions. */
function journalFeed(records: readonly StoredRecord[]): { perConnection: Buffer[]; protocols: string[]; types: number[]; ctxBeforeFirstData: boolean } {
    const perConnection: Buffer[][] = [];
    const protocols: string[] = [];
    let sawData = false;
    let ctxBeforeFirstData = false;
    for (const r of records) {
        if (r.type === RecordType.CONN_OPEN) perConnection.push([]);
        if (r.type === RecordType.CTX_SET) {
            const body = decodeBody({ type: RecordType.CTX_SET, payload: r.payload }) as { protocol?: string };
            if (body.protocol) {
                protocols.push(body.protocol);
                if (!sawData) ctxBeforeFirstData = true;
            }
        }
        if (r.type === RecordType.DATA) {
            sawData = true;
            if (!perConnection.length) perConnection.push([]);
            perConnection[perConnection.length - 1].push(r.payload);
        }
    }
    return { perConnection: perConnection.map(parts => Buffer.concat(parts)), protocols, types: records.map(r => r.type), ctxBeforeFirstData };
}

/** Every line sits at its own absolute position exactly once (no line lost or doubled). */
function positionsExact(pages: readonly (readonly (readonly unknown[])[])[]): boolean {
    let i = 0;
    for (const page of pages) for (const line of page) if (Number(line[2]) !== i++) return false;
    return true;
}

/**
 * Why a box transcript differs from the golden one, in digests and counts: are the journaled bytes the capture's,
 * and what does the reference parser (tools/ci/golden-replay) make of them chunked as the box received them (the
 * journal's DATA records, with their receive times) versus one chunk per tcp.js write?
 */
async function goldenDiagnosis(w: World): Promise<Record<string, unknown>> {
    const recs = (await w.journals()).box;
    const data = recs.filter(r => r.type === RecordType.DATA);
    const bytes = Buffer.concat(data.map(r => r.payload));
    const replay = async (id: string, chunks: Array<{ bytes: Buffer; tRecv: number }>) => {
        const out = await replayCorpus({ id, protocol: 'B', nSesid: w.nSesid, nLines: 25, cTimezone: w.golden.tz, chunks, keepCalls: false });
        return { lines: out.lineBuffer.length, root: out.canonical.root.slice(0, 16) };
    };
    const view = w.box!.kernel.view(w.nSesid)!;
    return {
        box: { lines: view.totalLines, root: view.root.slice(0, 16) },
        golden: { lines: w.golden.lineCount, root: w.golden.root.slice(0, 16) },
        journalBytesAreTheCapture: bytes.equals(w.corpus.stream),
        journalDataBytes: bytes.length,
        journalDataRecords: data.length,
        connections: recs.filter(r => r.type === RecordType.CONN_OPEN).length,
        referenceOverJournalChunks: await replay('diag-journal', data.map(r => ({ bytes: r.payload, tRecv: r.tRecvMs }))),
        referenceOverJournalChunksNoTime: await replay('diag-journal-t0', data.map(r => ({ bytes: r.payload, tRecv: 0 }))),
        referencePerTcpJsWrite: await replay('diag-entries', w.corpus.entries.map(e => ({ bytes: e.bytes, tRecv: 0 }))),
    };
}

/** Wait until the box journaled `bytes` DATA bytes (durably) and parsed them. */
async function waitJournaled(w: World, bytes: number, what: string, ms = 60_000): Promise<void> {
    await waitFor(
        async () => {
            const box = w.box!;
            const head = box.kernel.rawHead(w.nSesid);
            if (!head || head.durableSeq !== head.headSeq) return false;
            const { box: recs } = await w.journals().catch(() => ({ box: [] as StoredRecord[] }));
            return journalFeed(recs).perConnection.reduce((n, b) => n + b.length, 0) >= bytes;
        },
        ms,
        what,
        () => w.dump(),
    );
    await w.box!.kernel.settled();
    // The parse is done; the cut of its last bytes comes with the next boundary (50 ms). Wait until the committed
    // view has stayed the same for 500 ms (≥ 10 boundaries) so no comparison races the final cut.
    let rev = -1;
    let since = Date.now();
    await waitFor(
        () => {
            const now = w.box!.kernel.view(w.nSesid)?.rev ?? -1;
            if (now !== rev) {
                rev = now;
                since = Date.now();
            }
            return Date.now() - since >= 500;
        },
        30_000,
        `${what}: the box view settles`,
    );
}

/**
 * The end-state checks every scenario shares: box == cloud meta == cloud page store (pages byte-identical), the cloud
 * raw store is the box journal record for record, every line at its own position once, and the room's transcript
 * equals the box's. With `golden`, the transcript is also the golden one (all 418 lines, the golden root).
 */
async function expectSameEverywhere(w: World, scenario: string, opts: { golden: boolean }): Promise<Record<string, unknown>> {
    await w.waitConverged(`${scenario}: cloud == box`, 60_000);
    const box = w.box!;
    const view = box.kernel.view(w.nSesid)!;
    const meta = w.cloud.sync.peekMeta(w.nSesid)!;
    const store = w.cloudStoreRoot();
    expect(meta.root).toBe(view.root);
    expect(store.root).toBe(view.root);
    expect(meta.totalLines).toBe(view.totalLines);
    expect(store.totalLines).toBe(view.totalLines);
    const boxPages = box.kernel.pages(w.nSesid);
    expect(JSON.stringify(w.cloud.feed.pages(w.nSesid)) === JSON.stringify(boxPages)).toBe(true);
    expect(positionsExact(boxPages)).toBe(true);
    const journals = await w.journals();
    expect(journals.cloud.map(r => r.hash.toString('hex'))).toEqual(journals.box.map(r => r.hash.toString('hex')));
    expect(journals.cloud.map(r => r.seq)).toEqual(journals.box.map((_, k) => k + 1));
    // The room: refetch (as after any reconnect) and compare by digest.
    w.room?.refetch();
    await w.waitRoomMatchesBox(`${scenario}: room == box`);
    expect(w.room!.model.holes()).toBe(0);
    if (opts.golden) {
        if (view.root !== w.golden.root) throw new Error(`${scenario}: the box transcript is not the golden one: ${JSON.stringify(await goldenDiagnosis(w))}`);
        expect(view.totalLines).toBe(w.golden.lineCount);
        expect(boxPages.length).toBe(w.golden.pages);
        expect(view.root).toBe(w.golden.root);
        const fed = journalFeed(journals.box).perConnection;
        expect(Buffer.concat(fed).equals(w.corpus.stream)).toBe(true);
    }
    expect(w.cloud.db.contractViolations).toEqual([]);
    return { totalLines: view.totalLines, pages: boxPages.length, root: view.root.slice(0, 16), rawRecords: journals.box.length, rounds: w.cloud.applied.filter(a => a.nSesid === w.nSesid).length };
}

/** What a room device did since `sinceMs` (a box restart): counts only. */
function roomDiagnosis(room: RoomDevice, sinceMs: number): Record<string, unknown> {
    return {
        connects: room.connects,
        disconnectReasons: room.disconnectReasons,
        snapshots: room.snapshots,
        pageEmits: room.model.pageEmits,
        messages: room.model.messages,
        resyncs: room.model.resyncs,
        statusesSince: room.statuses.filter(s => s.atRecvMs > sinceMs).length,
        totalLines: room.model.totalLines,
        holes: room.model.holes(),
    };
}

/**
 * The room's transcript equals the box's WITHOUT a refetch by the suite and with no new line: only what the box sent
 * on its own (the snapshot of the device's own re-fetch, and the box's resync once its replay committed) counts.
 */
async function waitRoomMatchesBoxQuiet(w: World, room: RoomDevice, what: string, sinceMs: number): Promise<void> {
    const lines = room.model.messages;
    await waitFor(() => room.model.root(w.nSesid) === w.box!.kernel.view(w.nSesid)?.root, 15_000, what, () => ({ ...(w.dump() as object), room: roomDiagnosis(room, sinceMs) }));
    expect(room.model.holes()).toBe(0);
    expect(room.model.messages).toBe(lines); // no line arrived meanwhile
}

const describeIf = corpusAvailable() ? describe : describe.skip;

if (!corpusAvailable()) {
    // eslint-disable-next-line no-console
    console.warn(`[rt-edge e2e] SKIPPED: ${COMMANDS_FILE} not found (set RT_EDGE_TCP_SERVER_DIR)`);
}

describeIf('rt-edge e2e: transmitter → real box app → real cloud edge module, room and remote readers', () => {
    let w: World | null = null;

    afterEach(async () => {
        await w?.close();
        w = null;
    });

    it('1. listen mode: Eclipse logs in on the CAT port, the room reads live, the cloud gets rounds, LAN root = cloud root, the viewer sees "online"', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        const viewer = await w.openViewer();
        await waitFor(() => viewer.statuses.some(s => s.venue === 'online'), 10_000, 'the cloud viewer told the venue is online', () => w!.dump());
        await waitFor(() => room.statuses.some(s => s.nSesid === w!.nSesid), 10_000, 'the room gets edge-status after join');

        // The first 150 writes at 25 ms (lines arrive in pieces), the rest at 2 ms (tcp.js paces 400 ms).
        const sender = w.sender({ slow: { until: 150, msPerEntry: 25 } }).start();
        const feedStart = Date.now();
        await waitFor(() => room.model.messages >= 10, 30_000, 'the room reading lines while the reporter types', () => w!.dump());
        const firstRoomLineAfterMs = room.messageTimes[0] - feedStart;
        await sender.finished();
        const feedEnd = Date.now();
        const roomMessagesDuringFeed = room.messageTimes.filter(t => t <= feedEnd).length;
        await waitJournaled(w, w.corpus.stream.length, 'the whole hearing journaled');

        const end = await expectSameEverywhere(w, 'listen', { golden: true });
        // Parsed as Bridge without a configured protocol (DET-4), decided once and journaled.
        const fed = journalFeed((await w.journals()).box);
        expect(w.box!.kernel.session(w.nSesid)!.protocol).toBe('B');
        expect(fed.protocols).toEqual(['B']);
        expect(w.box!.kernel.session(w.nSesid)!.parseErrors).toBe(0);
        // Live in the room: lines arrived while the feed ran, and lines typed in pieces were seen growing.
        expect(roomMessagesDuringFeed).toBeGreaterThan(50);
        expect(room.model.growth).toBeGreaterThan(0);
        const multiUpdated = [...room.model.updatesPerLine.values()].filter(n => n > 1).length;
        // The cloud took rounds in rev order, one apply per rev.
        const revs = w.cloud.applied.filter(a => a.nSesid === w!.nSesid).map(a => a.rev);
        expect(revs.length).toBeGreaterThan(3);
        expect([...revs].sort((a, b) => a - b)).toEqual(revs);
        expect(new Set(revs).size).toBe(revs.length);
        // The remote viewer followed the cloud's round broadcasts alone (no refetch): its transcript is the cloud's.
        await waitFor(() => viewer.model.root(w!.nSesid) === w!.cloudStoreRoot().root, 15_000, 'the cloud viewer converged on the broadcasts', () => w!.dump());
        expect(viewer.connects).toBe(1);
        expect(viewer.statuses.filter(s => s.venue === 'offline')).toEqual([]);
        expect(w.box!.uplink.cloudLink().state).toBe('synced');
        report('1-listen', {
            ...end,
            feedMs: feedEnd - feedStart,
            firstRoomLineAfterMs,
            roomMessages: room.model.messages,
            roomMessagesDuringFeed,
            roomPageEmits: room.model.pageEmits,
            linesSeenGrowing: room.model.growth,
            lineUpdatedMoreThanOnce: multiUpdated,
            cloudRounds: revs.length,
            viewerMessages: viewer.model.messages,
            viewerPageEmits: viewer.model.pageEmits,
            viewerVenues: [...new Set(viewer.statuses.map(s => s.venue))],
            ms: Date.now() - t0,
        });
    });

    it('2. dial mode: protocol "auto" is refused by the contract; protocol bridge + automatic session dials tcp.js (child) and the same checks hold', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        const viewer = await w.openViewer();
        const tcp = await TcpServerChild.start(200);
        w.tcp = tcp;

        const state = await w.boxApi('GET', '/edge/local/ops/transmitter', IDS.operator);
        expect(state.status).toBe(200);
        expect(state.body.settings).toBeNull();
        // "auto": dial mode without a protocol. The contract has no auto-detect in dial mode (validateTransmitterSettings).
        const auto = await w.boxApi('PUT', '/edge/local/ops/transmitter', IDS.operator, {
            stateVersion: state.body.stateVersion,
            settings: { mode: 'dial', protocol: null, host: '127.0.0.1', port: tcp.port, autoReconnect: true, receivingSesid: null },
            confirmInterrupt: false,
        });
        expect(auto.status).toBe(400);
        expect(auto.body).toMatchObject({ msg: -1, error: 'invalid_settings', fields: { protocol: 'required' } });

        // Protocol set (bridge), receiving session automatic (the one armed session), auto-reconnect: dials at once.
        const applied = await w.boxApi('PUT', '/edge/local/ops/transmitter', IDS.operator, {
            stateVersion: state.body.stateVersion,
            settings: { mode: 'dial', protocol: 'bridge', host: '127.0.0.1', port: tcp.port, autoReconnect: true, receivingSesid: null },
            confirmInterrupt: false,
        });
        expect(applied.status).toBe(200);
        expect(applied.body.settings).toMatchObject({ mode: 'dial', protocol: 'bridge', port: tcp.port });
        const feedStart = Date.now();
        await tcp.startFeed();
        await waitFor(() => room.model.messages >= 10, 30_000, 'the room reading the dialed feed', () => w!.dump());
        await waitFor(() => (w!.box!.kernel.session(w!.nSesid)?.bytesIn ?? 0) >= w!.corpus.stream.length, 120_000, 'tcp.js streamed the whole file', () => ({ ...(w!.dump() as object), tcpChunks: tcp.chunksSent }));
        const feedEnd = Date.now();
        await waitJournaled(w, w.corpus.stream.length, 'the dialed hearing journaled');
        const live = await w.boxApi('GET', '/edge/local/ops/transmitter', IDS.operator);
        expect(live.body.link).toMatchObject({ mode: 'dial', protocol: 'bridge', receivingSesid: w.nSesid });
        expect(['live', 'quiet']).toContain(live.body.link.state);

        const end = await expectSameEverywhere(w, 'dial', { golden: true });
        const recs = (await w.journals()).box;
        expect(journalFeed(recs).protocols).toEqual(['B']);
        const open = recs.find(r => r.type === RecordType.CONN_OPEN)!;
        expect(decodeBody({ type: RecordType.CONN_OPEN, payload: open.payload })).toMatchObject({ mode: 'dial' });
        expect(w.box!.kernel.session(w.nSesid)!.protocol).toBe('B');
        await waitFor(() => viewer.model.root(w!.nSesid) === w!.cloudStoreRoot().root, 15_000, 'the cloud viewer converged', () => w!.dump());
        expect(viewer.statuses.some(s => s.venue === 'online')).toBe(true);
        report('2-dial', { ...end, tcpChunks: tcp.chunksSent, tcpHoldsAnswered: tcp.holdsAnswered, feedMs: feedEnd - feedStart, roomMessages: room.model.messages, ms: Date.now() - t0 });
    });

    it('3. internet cut mid-feed (proxy): the room keeps reading, the box journals, the viewer sees "offline since"; restore → one catch-up, nothing lost or doubled', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        const viewer = await w.openViewer();
        const sender = w.sender().start();
        await sender.pauseAt(900);
        await waitJournaled(w, sender.bytesWritten, 'first third journaled');
        await w.waitConverged('synced before the cut');
        const appliedBefore = w.cloud.applied.length;
        const rawBefore = w.cloud.raw.head(w.nSesid).seq;
        const boxHeadBefore = w.box!.kernel.rawHead(w.nSesid)!.headSeq;

        const cutAt = Date.now();
        w.proxy.cut('reset');
        await waitFor(() => !w!.box!.uplink.status().online, 10_000, 'the box sees the link down');
        await waitFor(() => w!.box!.uplink.cloudLink().state === 'internet-unavailable', 10_000, 'the box says "internet unavailable"', () => w!.dump());
        await sender.resumeUntil(1_900);
        await waitJournaled(w, sender.bytesWritten, 'offline lines journaled');

        // The room keeps reading; the box journals; nothing reaches the cloud. How many `message` emits the 1 000
        // entries make is timing (a cut that rewrites the current page goes out as a page, not a message): 19–24 seen
        // on one machine under varying load, so the bar is well under that band.
        const roomMsgsWhileCut = room.messageTimes.filter(t => t > cutAt).length;
        expect(roomMsgsWhileCut).toBeGreaterThan(10);
        await w.waitRoomMatchesBox('the room follows the box while offline');
        expect(w.box!.kernel.rawHead(w.nSesid)!.headSeq).toBeGreaterThan(boxHeadBefore);
        expect(w.box!.uplink.status().pendingPages).toBeGreaterThan(0);
        expect(w.box!.uplink.session(w.nSesid)!.lagBytes).toBeGreaterThan(0);
        expect(w.cloud.applied.length).toBe(appliedBefore);
        expect(w.cloud.raw.head(w.nSesid).seq).toBe(rawBefore);
        // Room: offline chip, marking paused (LAN edge-status).
        await waitFor(() => room.statuses.some(s => s.atRecvMs > cutAt && s.venue === 'offline' && (s.room as any)?.chip === 'offline' && (s.room as any)?.marking === 'paused'), 15_000, 'the room told "offline · marking paused"', () => w!.dump());
        // Viewer: "Venue box offline since HH:MM".
        await waitFor(() => viewer.lastStatus()?.venue === 'offline', 10_000, 'the cloud viewer told the venue is offline');
        const off = viewer.lastStatus()!;
        expect(typeof off.since).toBe('number');
        expect(off.since as number).toBeGreaterThanOrEqual(cutAt - 2_000);
        expect(off.since as number).toBeLessThanOrEqual(Date.now());
        const offlineForMs = Date.now() - cutAt;

        // Restore: one catch-up round (possibly multi-part), then cloud == box.
        const appliedAtRestore = w.cloud.applied.length;
        const restoreAt = Date.now();
        w.proxy.restore();
        await w.waitConverged('caught up after the restore', 60_000);
        const catchUp = w.cloud.applied.slice(appliedAtRestore).filter(a => a.nSesid === w!.nSesid);
        expect(catchUp.length).toBe(1);
        const catchUpMs = Date.now() - restoreAt;
        await waitFor(() => viewer.statuses.some(s => s.atRecvMs > restoreAt && (s.venue === 'online' || s.venue === 'catching-up')), 10_000, 'the viewer told the venue is back');
        await w.waitRoomMatchesBox('the room == box after the catch-up');

        sender.resume();
        await sender.finished();
        await waitJournaled(w, w.corpus.stream.length, 'the whole hearing journaled');
        const end = await expectSameEverywhere(w, 'cut', { golden: true });
        await waitFor(() => w!.box!.uplink.cloudLink().state === 'synced', 10_000, 'synced again');
        report('3-internet-cut', { ...end, offlineForMs, roomMsgsWhileCut, catchUpRounds: catchUp.length, catchUpPages: catchUp[0].pages, catchUpRev: catchUp[0].rev, catchUpMs, proxyResetsWhileCut: w.proxy.refusedWhileCut, viewerSinceLagMs: (off.since as number) - cutAt, ms: Date.now() - t0 });
    });

    it('4a. box restart (graceful stop mid-feed): journal replay to the same root, the uplink resumes, final digests equal', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        const sender = w.sender().start();
        await sender.pauseAt(1_200);
        await waitJournaled(w, sender.bytesWritten, 'journaled before the stop');
        const before = { ...w.box!.kernel.view(w.nSesid)!, head: w.box!.kernel.rawHead(w.nSesid)! };

        const stopAt = Date.now();
        await w.box!.stop();
        w.box = null;
        const stoppedMs = Date.now() - stopAt;
        await sleep(300);
        const restartAt = Date.now();
        await w.startBox();
        await waitFor(() => w!.box!.kernel.view(w!.nSesid)?.root === before.root, 30_000, 'journal replay to the pre-stop root', () => w!.dump());
        const recoveredMs = Date.now() - restartAt;
        expect(w.box!.kernel.view(w.nSesid)!.totalLines).toBe(before.totalLines);
        await waitFor(() => w!.box!.kernel.session(w!.nSesid)?.localState === 'armed' || w!.box!.kernel.session(w!.nSesid)?.localState === 'live', 20_000, 'armed again');
        await waitFor(() => w!.box!.uplink.session(w!.nSesid)?.verdict === 'continue', 20_000, 'hello continue after the restart', () => w!.dump());
        await w.waitConverged('cloud == box after the restart');
        // The graceful close ended the room's transport ('transport close'), which socket.io-client retries by itself;
        // the device re-joined and re-fetched on its own, possibly while the journal was still replaying — the box then
        // told the room to refetch once the replay committed. The reporter is still paused: no new line helped.
        await waitFor(() => room.connects >= 2, 10_000, 'the room device reconnected by itself', () => roomDiagnosis(room, restartAt));
        expect(room.disconnectReasons[0]).toBe('transport close');
        await waitRoomMatchesBoxQuiet(w, room, 'the room == box after the restart, before any new line', restartAt);
        const roomAfterRestart = roomDiagnosis(room, restartAt);

        sender.resume();
        await sender.finished();
        await waitJournaled(w, w.corpus.stream.length, 'the whole hearing journaled');
        const end = await expectSameEverywhere(w, 'restart', { golden: true });
        expect(sender.connects).toBe(2);
        const closes = (await w.journals()).box.filter(r => r.type === RecordType.CONN_CLOSE).map(r => (decodeBody({ type: RecordType.CONN_CLOSE, payload: r.payload }) as { reason: string }).reason);
        expect(closes).toContain('shutdown');
        report('4a-graceful-restart', { ...end, stoppedMs, recoveredMs, rootBefore: before.root!.slice(0, 16), linesBefore: before.totalLines, roomAfterRestart, roomDisconnectReasons: room.disconnectReasons, connCloseReasons: closes, ms: Date.now() - t0 });
    });

    /**
     * Regression (found by this suite, fixed 2026-10-02): a graceful box stop (SIGTERM: a systemd restart, a re-image,
     * the power button) used to end every room socket with `socket.disconnect(true)`. The client read that as
     * 'io server disconnect', which socket.io-client never retries, so a passive reader stayed disconnected after the
     * box came back. LanGateway.close() now closes the transport ('transport close', retried), as CONTRACTS.md §10.1
     * expects ("The banner clears on the next socket connect").
     */
    it('4c. after a graceful box restart a room device (socket.io defaults) reconnects by itself', async () => {
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        await w.box!.stop();
        w.box = null;
        await w.startBox();
        try {
            await waitFor(() => room.connects >= 2, 10_000, 'the room device to reconnect by itself');
        } finally {
            report('4c-reconnect', { roomDisconnectReasons: room.disconnectReasons, roomConnects: room.connects });
        }
    });

    /**
     * Regression (found by 4a once the room device retried by itself, fixed 2026-10-02): a device that re-joined and
     * re-fetched while the restarted box was still replaying the session's journal got an EMPTY snapshot (the kernel
     * had no committed view yet) and nothing afterwards: the recovery emits no cut (port rule), so with a quiet
     * reporter the room stayed blank, and after the next line held only the changed lines. The gateway now remembers
     * such a fetch and sends the room `realtime-events {type:'feed-resync'}` once the replay committed. Here the
     * replay is HELD (journal reads gated) so the device is served during it, deterministically.
     */
    it('4d. a room device that re-fetches WHILE the journal replays ends equal to the box once the replay commits, with no new line', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        const sender = w.sender().start();
        await sender.pauseAt(1_200);
        await waitJournaled(w, sender.bytesWritten, 'journaled before the stop');
        const before = w.box!.kernel.view(w.nSesid)!;
        await w.box!.stop();
        w.box = null;
        const held = heldJournalFs();
        const restartAt = Date.now();
        await w.startBox({ kernel: { ...E2E_KERNEL, journalFs: held.fs }, waitOnline: false });
        // The box serves while its replay waits on the first segment read: the device retries, re-joins and re-fetches now.
        await waitFor(() => room.connects >= 2 && room.snapshots >= 2, 10_000, 'the room device re-fetched during the replay', () => roomDiagnosis(room, restartAt));
        // The replay reaches its first (held) segment read on its own schedule, possibly after the device's quick
        // re-fetch: wait for it (bounded) instead of asserting at once. Until then nothing is readable either way.
        await waitFor(() => held.heldReads() > 0, 10_000, 'the journal replay waiting on a held segment read', () => ({ heldReads: held.heldReads(), room: roomDiagnosis(room, restartAt) }));
        expect(w.box!.kernel.session(w.nSesid)).not.toBeNull(); // held open ...
        expect(w.box!.kernel.view(w.nSesid)).toBeNull(); // ... but not readable yet: the snapshot had nothing
        expect(room.model.totalLines).toBe(0);
        const servedDuringReplayAt = Date.now();
        held.release();
        await waitFor(() => w!.box!.kernel.view(w!.nSesid)?.root === before.root, 30_000, 'the replay committed to the pre-stop root', () => w!.dump());
        await waitRoomMatchesBoxQuiet(w, room, 'the room == box after the held replay, before any new line', restartAt);
        const resyncedAfterMs = Date.now() - servedDuringReplayAt;
        expect(room.model.resyncs).toBeGreaterThanOrEqual(1);
        expect(room.disconnectReasons[0]).toBe('transport close');
        await waitFor(() => !!w!.box!.uplink.status().online, 20_000, 'the box online', () => w!.dump());
        await waitFor(() => w!.box!.uplink.session(w!.nSesid)?.verdict === 'continue', 20_000, 'hello continue after the restart', () => w!.dump());

        sender.resume();
        await sender.finished();
        await waitJournaled(w, w.corpus.stream.length, 'the whole hearing journaled');
        const end = await expectSameEverywhere(w, 'held-replay', { golden: true });
        report('4d-refetch-during-replay', { ...end, linesBefore: before.totalLines, heldReads: held.heldReads(), resyncedAfterMs, roomAfterRestart: roomDiagnosis(room, restartAt), ms: Date.now() - t0 });
    });

    it('4b. box hard kill (process level, mid-stream): restart on the same data dir recovers from the journal, loss limited to unjournaled bytes, final digests equal', async () => {
        const t0 = Date.now();
        w = await World.create({ child: true });
        const bootedChildMs = Date.now() - t0;
        await w.bindSession();
        const room = await w.openRoom();
        const sender = w.sender();
        let killedAt = 0;
        sender.onProgress(next => {
            if (next === 1_300 && !killedAt) {
                killedAt = Date.now();
                void w!.childBox!.kill();
            }
        });
        sender.start();
        await waitFor(() => !!w!.childBox!.exited, 60_000, 'the box process killed');
        // The reporter stays quiet across the restart: what the room shows afterwards comes from the recovery alone.
        await sender.pauseAt(sender.next);
        const writtenOnFirst = () => sender.bytesPerConnection[0];
        await sleep(300);
        const restartAt = Date.now();
        await w.startBox();
        await waitFor(() => !!w!.box!.kernel.view(w!.nSesid), 30_000, 'the journal replayed after the kill', () => w!.dump());
        const recoveredMs = Date.now() - restartAt;
        // The room device's transport died with the process ('transport close'): it retried by itself, re-joined and
        // re-fetched at some moment of the boot, and ends equal to the box with no new line sent.
        await waitFor(() => room.connects >= 2, 10_000, 'the room device reconnected by itself after the kill', () => roomDiagnosis(room, restartAt));
        expect(room.disconnectReasons[0]).toBe('transport close');
        await waitRoomMatchesBoxQuiet(w, room, 'the room == box after the kill, before any new line', restartAt);
        const roomAfterKill = roomDiagnosis(room, restartAt);
        // What the journal kept of the first connection is a prefix of what the transmitter wrote on it.
        const afterKill = journalFeed((await w.journals()).box);
        const kept = afterKill.perConnection[0] ?? Buffer.alloc(0);
        expect(kept.equals(w.corpus.stream.subarray(0, kept.length))).toBe(true);
        expect(kept.length).toBeLessThanOrEqual(writtenOnFirst());
        expect(kept.length).toBeGreaterThan(0);
        await waitFor(() => w!.box!.uplink.session(w!.nSesid)?.verdict === 'continue', 20_000, 'hello continue after the kill', () => w!.dump());

        sender.resume();
        await sender.finished();
        const firstOfSecond = sender.firstEntryPerConnection[1];
        const tail = Buffer.concat(w.corpus.entries.slice(firstOfSecond).map(e => e.bytes));
        await waitJournaled(w, kept.length + tail.length, 'the rest of the hearing journaled');
        await w.waitConverged('cloud == box after the kill', 60_000);
        const lostBytes = writtenOnFirst() - kept.length;
        const end = await expectSameEverywhere(w, 'hard-kill', { golden: lostBytes === 0 && kept.length === writtenOnFirst() });
        const fed = journalFeed((await w.journals()).box);
        expect(fed.perConnection.length).toBe(2);
        expect(fed.perConnection[1].equals(tail)).toBe(true);
        report('4b-hard-kill', { ...end, bootedChildMs, killedAtEntry: 1_300, writtenOnFirstConnection: writtenOnFirst(), journaledOfFirst: kept.length, lostBytes, recoveredMs, roomAfterKill, secondConnectionFrom: firstOfSecond, ms: Date.now() - t0 });
    });

    it('5. cloud restart mid-feed with a page lost between flushes: D18 boot recompute, the box resends it and resumes; final digests equal', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        await w.openRoom();
        const viewer = await w.openViewer();
        const sender = w.sender().start();
        await sender.pauseAt(1_000);
        await waitJournaled(w, sender.bytesWritten, 'journaled before the cloud restart');
        await w.waitConverged('synced before the cloud restart');

        await w.cloud.stop();
        // A crash between the 1 s flushes: the highest page never reached Redis / data/.
        const persisted = w.cloud.feed.persisted.get(w.nSesid)!;
        const lostPage = Math.max(...persisted.keys());
        persisted.delete(lostPage);
        await waitFor(() => !w!.box!.uplink.status().online, 10_000, 'the box sees the cloud gone');
        await sender.resumeUntil(2_000);
        await waitJournaled(w, sender.bytesWritten, 'lines recorded while the cloud is down');
        expect(w.box!.uplink.status().pendingPages).toBeGreaterThan(0);

        const restartAt = Date.now();
        await w.cloud.start();
        await w.waitConverged('caught up after the cloud restart', 60_000);
        const resumedMs = Date.now() - restartAt;
        const stale = w.cloud.registry.recentAlerts().find(a => a.kind === 'BOOT_STALE_PAGES');
        expect(stale).toBeDefined();
        expect((stale!.data as any).missingPages).toContain(lostPage);
        expect(w.cloud.registry.recentAlerts().filter(a => a.tier === 'P1')).toEqual([]);
        await waitFor(() => viewer.connects >= 2 && viewer.statuses.some(s => s.atRecvMs > restartAt && s.venue !== 'offline'), 15_000, 'the viewer reconnected to the restarted cloud', () => w!.dump());

        sender.resume();
        await sender.finished();
        await waitJournaled(w, w.corpus.stream.length, 'the whole hearing journaled');
        const end = await expectSameEverywhere(w, 'cloud-restart', { golden: true });
        expect(w.cloud.starts).toBe(2);
        report('5-cloud-restart', { ...end, lostPage, resumedMs, ms: Date.now() - t0 });
    });

    it('6. end and seal: RT Production Stop (end as a request through the edge module) → the box drains, ends, seals; the cloud accepts the seal → K', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        const room = await w.openRoom();
        const viewer = await w.openViewer();
        const sender = w.sender().start();
        await sender.finished();
        await waitJournaled(w, w.corpus.stream.length, 'the whole hearing journaled');
        await expectSameEverywhere(w, 'before-end', { golden: true });
        const publicKey = w.box!.state.identity.get()!.publicKeySpki;

        const endAt = Date.now();
        await w.cloud.endSession(w.nEdgeid, w.nSesid);
        await waitFor(() => w!.cloud.db.sessions.get(w!.nSesid).cSyncState === 'K', 60_000, 'sealed K in the cloud', () => w!.dump());
        const sealedMs = Date.now() - endAt;
        await waitFor(() => w!.box!.state.sessions.get(w!.nSesid)?.localState === 'sealed', 15_000, 'sealed on the box');
        expect(w.box!.state.sessions.get(w.nSesid)).toMatchObject({ sealState: 'K', cloudOp: 'end' });
        const seals = w.cloud.db.eventsOf('seal');
        expect(seals).toHaveLength(1);
        const seal = JSON.parse(seals[0].jData.seal);
        expect(verifyDeviceSignature(publicKey, sealSigningPayload(seal), seal.sig)).toBe(true);
        expect(seal).toMatchObject({ nSesid: w.nSesid, totalLines: w.golden.lineCount, root: w.golden.root, endedBy: 'cloud' });
        const meta = w.cloud.sync.peekMeta(w.nSesid)!;
        expect(meta).toMatchObject({ root: w.golden.root, totalLines: w.golden.lineCount, sealed: { state: 'K' } });
        const journals = await w.journals();
        expect(journals.cloud.map(r => r.hash.toString('hex'))).toEqual(journals.box.map(r => r.hash.toString('hex')));
        expect(journals.box[journals.box.length - 1].type).toBe(RecordType.SESSION_END);
        expect(seal.rawFinalSeq).toBe(journals.cloud.length);
        expect(w.cloud.db.sessions.get(w.nSesid)).toMatchObject({ nFinalLines: w.golden.lineCount, cFinalDigest: w.golden.root, nRawFinalSeq: seal.rawFinalSeq });
        expect(w.cloud.feed.ended).toContain(w.nSesid);
        // The readers were told.
        await waitFor(() => room.sessionEvents.some(e => e.type === 'ended'), 10_000, 'the room told the session ended');
        expect(room.notifications.some(n => n.cStatus === 'E')).toBe(true);
        await waitFor(() => viewer.statuses.some(s => s.state === 'sealed'), 10_000, 'the viewer told the session is sealed');
        expect(w.cloud.db.contractViolations).toEqual([]);
        report('6-end-seal', { sealedMs, sealState: 'K', totalLines: seal.totalLines, root: String(seal.root).slice(0, 16), rawFinalSeq: seal.rawFinalSeq, incidents: (seal.incidents ?? []).length, ms: Date.now() - t0 });
    });

    it('7. protocol (DET-4): a real Bridge stream that starts mid-page (first byte is text, no configured protocol) is parsed as Bridge on the box', async () => {
        const t0 = Date.now();
        w = await World.create();
        await w.bindSession();
        await w.openRoom();
        const startAt = firstTextEntryFrom(w.corpus, 400);
        expect(startAt).toBeGreaterThan(0);
        const suffix = w.corpus.entries.slice(startAt).map(e => e.bytes);
        expect(suffix[0][0]).not.toBe(0x02);
        const sender = w.sender({ startAt }).start();
        await sender.finished();
        const suffixBytes = suffix.reduce((n, b) => n + b.length, 0);
        await waitJournaled(w, suffixBytes, 'the mid-page stream journaled');
        const end = await expectSameEverywhere(w, 'mid-page', { golden: false });

        const recs = (await w.journals()).box;
        const fed = journalFeed(recs);
        expect(fed.perConnection[0][0]).not.toBe(0x02); // the box really received a stream starting with text
        expect(fed.protocols).toEqual(['B']);
        expect(w.box!.kernel.session(w.nSesid)!.protocol).toBe('B');
        expect(w.box!.kernel.session(w.nSesid)!.parseErrors).toBe(0);
        // Reference: the same bytes through the feed-parse Bridge parser (tools/ci/golden-replay replay harness).
        const ref = await replayCorpus({ id: 'e2e-mid-page', protocol: 'B', nSesid: w.nSesid, nLines: 25, cTimezone: w.golden.tz, chunks: suffix.map(bytes => ({ bytes, tRecv: 0 })), keepCalls: false });
        const view = w.box!.kernel.view(w.nSesid)!;
        expect(view.root).toBe(ref.canonical.root);
        expect(view.totalLines).toBe(ref.lineBuffer.length);
        const caseview = await replayCorpus({ id: 'e2e-mid-page-cv', protocol: 'C', nSesid: w.nSesid, nLines: 25, cTimezone: w.golden.tz, chunks: suffix.map(bytes => ({ bytes, tRecv: 0 })), keepCalls: false });
        expect(view.root).not.toBe(caseview.canonical.root);
        report('7-protocol', { ...end, startEntry: startAt, firstByte: `0x${fed.perConnection[0][0].toString(16)}`, decided: fed.protocols, ctxSetBeforeFirstData: fed.ctxBeforeFirstData, referenceBridgeLines: ref.lineBuffer.length, caseviewWouldGiveLines: caseview.lineBuffer.length, ms: Date.now() - t0 });
    });
});
