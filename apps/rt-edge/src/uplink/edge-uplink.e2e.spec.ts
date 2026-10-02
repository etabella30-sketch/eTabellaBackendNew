/**
 * End to end, in process: a real box (node:sqlite state, the real kernel with its CAT listener, the real uplink)
 * against a FakeCloud whose `/edge` half is libs/edge-sync's (helloVerdict, RoundAssembler, validateRound,
 * planRawAppend, checkSeal). Proves spec §5.3–§5.7 and §10 #1, #3, #15, #18:
 * - hello → rounds (multi-part) → raw → e.ready → e.status → end → signed seal 'K';
 * - an outage mid-feed (the cloud stopped and restarted, plus a BUSY round, a lost ack and a CAT reconnect) with no
 *   loss, duplication or reordering: cloud root == box root, cloud pages == box pages, cloud raw store == box journal;
 * - D19: an old image restored while the raw lane lags, a hash mismatch only the box can see, and a FORK reply all
 *   freeze the session's uplink: nothing pushed, nothing replaced in the cloud, the room keeps reading;
 * - recovery after a kill (power-cut disk image): journal replay to the same root, then catch-up and seal;
 * - optional: the tcp-server-main corpus through DIAL mode reaches the cloud byte- and page-identical.
 */
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { sealSigningPayload } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import { readJournal, RecordType } from '@app/rt-ingest';

import type { EdgeActor } from '../contracts';
import { boxDay } from '../ports';
import { bridgeLines, copyDir, eclipse, EclipseClient, scryptRoute, sleep, waitFor } from '../kernel/testing/kernel-harness';
import { verifyDeviceSignature } from './device-key';
import { converged as convergedOn, EdgeBox, edgeBox, enrolledBox, lineNumbers, range, waitConverged as waitConvergedOn } from './testing/edge-box';
import { FakeCloud } from './testing/fake-cloud';

jest.setTimeout(120_000);

const SES = 'ses-e2e-1';
const USER = 'eclipse-court3';
const PASS = 'pw-court3-7Q';
const ROUTE = scryptRoute(USER, PASS);

/** Box and cloud hold the same transcript, root and raw head (default session SES). */
const converged = (box: EdgeBox, cloud: FakeCloud, nSesid = SES): boolean => convergedOn(box, cloud, nSesid);

/** `waitFor(converged)` with diagnostics on timeout. */
const waitConverged = (box: EdgeBox, cloud: FakeCloud, what: string, extra?: () => boolean, ms?: number, nSesid = SES): Promise<void> => waitConvergedOn(box, cloud, nSesid, what, extra, ms);

async function expectSameAsBox(box: EdgeBox, cloud: FakeCloud, nSesid = SES): Promise<void> {
    const boxPages = box.kernel.pages(nSesid);
    expect(JSON.stringify(cloud.pagesOf(nSesid))).toBe(JSON.stringify(boxPages));
    // The raw store is the box journal, record for record, in order (no loss, no duplicate, no reorder).
    const journal = await readJournal({ root: box.config.paths.journalDir, nSesid, repair: false });
    expect(cloud.rawRecords(nSesid).map(r => r.hash)).toEqual(journal.records.map(r => r.hash.toString('hex')));
    expect(cloud.rawRecords(nSesid).map(r => r.seq)).toEqual(range(1, journal.records.length + 1));
}

const continued = (box: EdgeBox, nSesid = SES): boolean => box.kernel.session(nSesid)?.localState !== undefined && box.uplink.session(nSesid)?.verdict === 'continue' && box.uplink.status().online;

describe('rt-edge uplink — end to end against an in-process cloud /edge', () => {
    let cloud: FakeCloud;
    const boxes: EdgeBox[] = [];
    const clients: EclipseClient[] = [];
    const dirs: string[] = [];

    const tempDir = (): string => {
        const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-e2e-'));
        dirs.push(d);
        return d;
    };
    const track = (b: EdgeBox): EdgeBox => {
        boxes.push(b);
        return b;
    };
    const connect = async (box: EdgeBox): Promise<EclipseClient> => {
        const c = await eclipse(box.kernel.listenAddress()!.port, USER, PASS);
        clients.push(c);
        return c;
    };

    beforeEach(async () => {
        cloud = new FakeCloud({ maxPart: 3_000 });
        await cloud.start();
        cloud.bind({ nSesid: SES, parserVer: FEED_PARSE_VERSION, route: ROUTE, team: [{ nUserid: 'u1', name: 'Priya Shah', isCaseAdmin: true }] });
    });

    afterEach(async () => {
        for (const c of clients.splice(0)) await c.end().catch(() => undefined);
        for (const b of boxes.splice(0)) await b.close().catch(() => undefined);
        await cloud.stop();
        for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    });

    it('hello → rounds (multi-part) → raw → e.ready → e.status → end → signed seal K; the cloud holds exactly the box transcript', async () => {
        const box = track(await enrolledBox(cloud));
        await waitFor(() => box.kernel.session(SES)?.localState === 'armed', 15_000, 'armed');
        await waitFor(() => continued(box), 15_000, 'hello continue');
        expect(box.state.identity.get()).toMatchObject({ status: 'active', linkFailure: null, tpmKey: false });
        await waitFor(() => cloud.log.readies.includes(SES), 5_000, 'e.ready');
        // The hello delivered the full assignment snapshot: case and roster are on the box.
        expect(box.state.assignments.case('case-1')).toMatchObject({ cCasename: 'Okafor v Shah', cCaseno: 'HC-2026-001' });
        expect(box.state.roster.forSession(SES).map(m => m.nUserid)).toEqual(['u1']);

        const client = await connect(box);
        await client.send(bridgeLines(0, 70));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 71, 15_000, '70 lines on the box');
        await waitConverged(box, cloud, 'first round', () => cloud.session(SES).meta.totalLines >= 71);
        const firstApplied = cloud.session(SES).meta.appliedRawSeq!;
        await client.send(bridgeLines(70, 30));
        await waitConverged(box, cloud, 'second round', () => cloud.session(SES).meta.totalLines >= 101);
        await client.send(bridgeLines(100, 20));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 121, 15_000, '120 lines on the box');
        await waitConverged(box, cloud, 'cloud == box');
        await expectSameAsBox(box, cloud);
        expect(lineNumbers(cloud.pagesOf(SES))).toEqual(range(0, 120));
        // Every round after the first continued the last applied one with the box's OWN chain hash there (D19).
        const meta = cloud.session(SES).meta;
        expect(meta.appliedRawHash).toBe(await box.kernel.rawHashAt(SES, meta.appliedRawSeq!));
        const continuing = cloud.log.rounds.filter(r => r.lineage.appliedRawSeq !== null);
        expect(continuing.find(r => r.lineage.appliedRawSeq === firstApplied)?.lineage).toEqual({ appliedRawSeq: firstApplied, appliedRawHash: await box.kernel.rawHashAt(SES, firstApplied) });
        for (const r of continuing) expect(r.lineage.appliedRawHash).toBe(await box.kernel.rawHashAt(SES, r.lineage.appliedRawSeq!));
        const genesis = cloud.log.rounds.filter(r => r.lineage.appliedRawSeq === null);
        expect(genesis.length).toBeGreaterThan(0);
        expect(genesis.every(r => r.rev <= Math.min(...continuing.map(c => c.rev)))).toBe(true);

        expect(box.uplink.status()).toMatchObject({ online: true, pendingPages: 0, lagSec: 0, stale: false });
        expect(box.uplink.status().lastSyncAt).not.toBeNull();
        expect(box.uplink.cloudLink()).toMatchObject({ state: 'synced', lagLines: 0, pendingPages: 0 });
        expect(box.uplink.session(SES)).toMatchObject({ uplinkState: 'ok', verdict: 'continue', dirtyPages: 0, lagBytes: 0, rawAckedSeq: box.kernel.rawHead(SES)!.headSeq, cloudRoot: meta.root, frozenAtMs: null });
        await waitFor(() => cloud.log.statuses.some(s => s.sessions.some(x => x.nSesid === SES && x.totalLines === 121 && x.catConnected === true && x.uplinkState === 'ok')), 5_000, 'e.status');
        expect(cloud.log.statuses[cloud.log.statuses.length - 1].device).toMatchObject({ sw: '0.0.0-dev', parserVer: FEED_PARSE_VERSION });

        // RT Production Stop: the cloud's end request; the box drains, ends, uploads the rest and seals (§4.4, §5.7).
        expect(await cloud.endSession(SES)).toEqual({ ok: true });
        await waitFor(() => cloud.session(SES).syncState === 'K', 30_000, 'sealed K');
        await waitFor(() => box.state.sessions.get(SES)?.localState === 'sealed', 5_000, 'sealed on the box');
        expect(box.state.sessions.get(SES)).toMatchObject({ localState: 'sealed', sealState: 'K', cloudOp: 'end' });
        expect(box.state.sessions.get(SES)!.sealedAtMs).not.toBeNull();
        await waitFor(() => box.kernel.session(SES) === null, 5_000, 'the kernel drops the sealed session');
        const seal = cloud.session(SES).seal!;
        expect(verifyDeviceSignature(box.state.identity.get()!.publicKeySpki, sealSigningPayload(seal), seal.sig)).toBe(true);
        expect(seal).toMatchObject({ nSesid: SES, epoch: 1, totalLines: 121, finalRev: cloud.session(SES).meta.appliedRev, root: cloud.session(SES).meta.root, endedBy: 'cloud' });
        const raw = cloud.rawRecords(SES);
        expect(raw[raw.length - 1].type).toBe(RecordType.SESSION_END);
        expect(seal.rawFinalSeq).toBe(raw.length);
        expect(box.events.of('session-event').some(e => e.type === 'ended' && e.nSesid === SES)).toBe(true);
        expect(box.uplink.session(SES)).toMatchObject({ sealState: 'K' });
        const journal = await readJournal({ root: box.config.paths.journalDir, nSesid: SES, repair: false });
        expect(raw.map(r => r.hash)).toEqual(journal.records.map(r => r.hash.toString('hex')));
        expect(box.events.of('alert').filter(a => a.source === 'uplink' && a.tier === 'P1')).toEqual([]);
    });

    it('rides out a cloud outage, a BUSY round, a lost ack and a CAT reconnect with no loss, duplication or reorder (root equality)', async () => {
        const box = track(await enrolledBox(cloud, { uplink: { ackTimeoutMs: 1_500 } }));
        await waitFor(() => continued(box), 15_000, 'hello continue');
        let client = await connect(box);
        await client.send(bridgeLines(0, 40));
        await waitConverged(box, cloud, 'first 40 lines', () => cloud.session(SES).meta.totalLines >= 41, 30_000);

        // BUSY: retried after retryMs, never dropped.
        cloud.faults.busyRounds = 1;
        await client.send(bridgeLines(40, 10));
        await waitConverged(box, cloud, 'after BUSY', () => cloud.session(SES).meta.totalLines >= 51, 30_000);
        expect(cloud.log.roundReplies.some(r => r.ok === false && r.code === 'BUSY')).toBe(true);

        // A lost ack: the cloud applied the round, the box never heard; it reconnects and the hello diff resumes (§5.5).
        cloud.faults.dropRoundAcks = 1;
        const connectsBefore = cloud.log.connects.length;
        await client.send(bridgeLines(50, 10));
        await waitFor(() => cloud.log.connects.length > connectsBefore, 15_000, 'reconnect after the lost ack');
        await waitConverged(box, cloud, 'after the lost ack', () => cloud.session(SES).meta.totalLines >= 61, 30_000);

        // The outage: the cloud stops; the room keeps reading; lines and a CAT reconnect happen offline.
        await cloud.stop();
        await waitFor(() => !box.uplink.status().online, 10_000, 'offline');
        await client.send(bridgeLines(60, 20));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 81, 15_000, 'offline lines');
        await client.end();
        client = await connect(box);
        await client.send(bridgeLines(80, 40));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 121, 15_000, 'more offline lines');
        expect(box.uplink.status().pendingPages).toBeGreaterThan(0);
        expect(box.uplink.cloudLink().state).not.toBe('synced');
        expect(['cant-reach-etabella', 'internet-unavailable']).toContain(box.uplink.cloudLink().state);
        const offlineRoot = box.kernel.view(SES)!.root;
        await sleep(300);

        const roundsBeforeRestart = cloud.log.rounds.length;
        await cloud.start();
        await waitConverged(box, cloud, 'catch-up after the outage', undefined, 30_000);
        expect(cloud.session(SES).meta.root).toBe(offlineRoot);
        // One catch-up round of the pages changed offline, split into ≤ 3 000-byte parts (multi-part, §5.4).
        const catchUp = cloud.log.rounds.slice(roundsBeforeRestart);
        expect(catchUp.some(r => r.parts > 1)).toBe(true);
        expect(new Set(catchUp.map(r => r.rev)).size).toBe(1);
        await expectSameAsBox(box, cloud);
        expect(lineNumbers(cloud.pagesOf(SES))).toEqual(range(0, 120));
        // The resume passed the box's half of the D19 check; nothing froze.
        const lastHello = cloud.log.helloReplies[cloud.log.helloReplies.length - 1].find(r => r.nSesid === SES)!;
        expect(lastHello.verdict).toBe('continue');
        expect(box.uplink.session(SES)).toMatchObject({ uplinkState: 'ok', frozenAtMs: null });
        expect(cloud.session(SES).meta.frozen).toBeFalsy();
        expect(box.events.of('alert').some(a => a.kind === 'LINEAGE_FROZEN')).toBe(false);
        await waitFor(() => box.uplink.cloudLink().state === 'synced', 5_000, 'synced again');
        const codes = box.state.connectivityLog.page({ filter: 'cloud' }, boxDay(Date.now(), box.config.box.timeZone)).rows.map(r => r.code);
        expect(codes).toEqual(expect.arrayContaining(['cloud-connected', 'cloud-disconnected']));
    });

    it('recovers after a kill: a power-cut disk image replays to the same root, catches the cloud up and seals', async () => {
        const box = track(await enrolledBox(cloud));
        await waitFor(() => continued(box), 15_000, 'hello continue');
        const client = await connect(box);
        await client.send(bridgeLines(0, 30));
        await waitConverged(box, cloud, 'synced', () => cloud.session(SES).meta.totalLines >= 31, 30_000);

        // Offline, more lines arrive; then the box loses power: nothing more reaches the cloud, the disk is what it was.
        await cloud.stop();
        await client.send(bridgeLines(30, 30));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 61, 15_000, 'unsynced lines');
        await box.kernel.settled();
        await waitFor(() => box.kernel.rawHead(SES)!.durableSeq === box.kernel.rawHead(SES)!.headSeq, 5_000, 'durable');
        const before = box.kernel.view(SES)!;
        await box.uplink.close();
        const image = tempDir();
        copyDir(box.dir, image);
        await client.end();
        await box.close();

        await cloud.start();
        const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin }));
        await restarted.start();
        await waitFor(() => restarted.kernel.view(SES)?.root === before.root, 20_000, 'journal replay to the pre-crash root');
        expect(restarted.kernel.view(SES)!.totalLines).toBe(before.totalLines);
        await waitFor(() => continued(restarted), 15_000, 'hello after the restart');
        await waitConverged(restarted, cloud, 'cloud caught up from the recovered box', undefined, 30_000);
        expect(lineNumbers(cloud.pagesOf(SES))).toEqual(range(0, 60));

        // The reporter reconnects to the restarted box and goes on.
        const again = await connect(restarted);
        await again.send(bridgeLines(60, 20));
        await waitConverged(restarted, cloud, 'after the reconnect', () => cloud.session(SES).meta.totalLines >= 81, 30_000);
        await expectSameAsBox(restarted, cloud);
        expect(lineNumbers(cloud.pagesOf(SES))).toEqual(range(0, 80));

        expect(await cloud.endSession(SES)).toEqual({ ok: true });
        await waitFor(() => ['K', 'W'].includes(cloud.session(SES).syncState), 30_000, 'sealed');
        // The cloud stores the seal before its reply reaches the box: wait (bounded) for the box's own record of it.
        await waitFor(() => restarted.state.sessions.get(SES)?.localState === 'sealed', 10_000, 'the box recorded the seal');
        expect(restarted.state.sessions.get(SES)).toMatchObject({ localState: 'sealed', sealState: cloud.session(SES).syncState });
        expect(cloud.session(SES).seal!.totalLines).toBe(cloud.session(SES).meta.totalLines);
    });

    it('RECOVER (MR-3): a box image behind the cloud raw store but still continuing the applied history pulls the missing records back', async () => {
        let box = track(await enrolledBox(cloud));
        await waitFor(() => continued(box), 15_000, 'hello continue');
        let client = await connect(box);
        await client.send(bridgeLines(0, 30));
        await waitConverged(box, cloud, 'synced', () => cloud.session(SES).meta.totalLines >= 31);
        await client.end();
        await box.close({ keepDir: true });
        const image = tempDir();
        copyDir(box.dir, image); // the disk as it is now: every applied round, every acked record

        // The box goes on; the cloud's rounds are BUSY, so only the raw lane advances past the image.
        box = track(edgeBox({ dir: box.dir, cloudOrigin: cloud.origin }));
        await box.start();
        await waitFor(() => continued(box), 15_000, 'hello continue (same box)');
        cloud.faults.busyRounds = 1_000_000;
        client = await connect(box);
        await client.send(bridgeLines(30, 30));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 61, 15_000, 'more lines');
        await waitFor(() => cloud.rawHead(SES).seq === box.kernel.rawHead(SES)!.headSeq, 15_000, 'raw acked ahead of the rounds');
        const fullRoot = box.kernel.view(SES)!.root;
        expect(cloud.session(SES).meta.totalLines).toBe(31);
        await client.end();
        await box.close();

        // The image comes back: its journal stops before the cloud's raw head but holds the last applied record.
        cloud.faults.busyRounds = 0;
        const restored = track(edgeBox({ dir: image, cloudOrigin: cloud.origin }));
        expect(restored.dir).toBe(image);
        await restored.start();
        await waitFor(() => cloud.log.rawPulls.length > 0, 15_000, 'raw pull-back');
        await waitConverged(restored, cloud, 'converged after RECOVER', () => cloud.session(SES).meta.totalLines >= 61);
        expect(restored.kernel.view(SES)!.root).toBe(fullRoot);
        expect(lineNumbers(cloud.pagesOf(SES))).toEqual(range(0, 60));
        await expectSameAsBox(restored, cloud);
        expect(restored.uplink.session(SES)).toMatchObject({ uplinkState: 'ok', frozenAtMs: null });
        expect(cloud.session(SES).meta.frozen).toBeFalsy();
    });

    describe('D19: a box that does not continue the last applied history is frozen', () => {
        it('an old image restored while the raw lane lags: hello frozen, no page replaced, nothing pushed, the room keeps reading', async () => {
            let box = track(await enrolledBox(cloud));
            await waitFor(() => continued(box), 15_000, 'hello continue');
            let client = await connect(box);
            await client.send(bridgeLines(0, 30));
            await waitConverged(box, cloud, 'synced', () => cloud.session(SES).meta.totalLines >= 31, 30_000);
            await client.end();

            // The image is taken here (clean stop); the same box then goes on recording and syncing.
            await box.close({ keepDir: true });
            const oldImage = tempDir();
            copyDir(box.dir, oldImage);
            box = track(edgeBox({ dir: box.dir, cloudOrigin: cloud.origin }));
            await box.start();
            await waitFor(() => continued(box), 15_000, 'hello continue (same box)');
            cloud.faults.rawLag = true; // the raw lane stops acking: rounds run ahead of it (spec §5.5 D19 example)
            client = await connect(box);
            await client.send(bridgeLines(30, 50));
            await waitFor(() => cloud.session(SES).meta.totalLines >= 81 && cloud.session(SES).meta.root === box.kernel.view(SES)?.root, 30_000, 'rounds ahead of raw');
            const appliedRawSeq = cloud.session(SES).meta.appliedRawSeq!;
            expect(cloud.rawHead(SES).seq).toBeLessThan(appliedRawSeq);
            await client.end();
            await box.close({ keepDir: true });
            const cloudPages = JSON.stringify(cloud.pagesOf(SES));
            const cloudRoot = cloud.session(SES).meta.root;

            // The old image comes back (a restored box): its journal ends before the last applied round.
            const old = track(edgeBox({ dir: oldImage, cloudOrigin: cloud.origin }));
            const roundsBefore = cloud.log.rounds.length;
            const rawsBefore = cloud.log.raws.length;
            await old.start();
            await waitFor(() => old.uplink.session(SES)?.uplinkState === 'frozen', 15_000, 'frozen');
            expect(old.kernel.rawHead(SES)!.headSeq).toBeLessThan(appliedRawSeq);
            expect(old.uplink.session(SES)).toMatchObject({ verdict: 'frozen', uplinkState: 'frozen' });
            expect(old.uplink.session(SES)!.frozenAtMs).not.toBeNull();
            expect(old.state.sessions.get(SES)!.localState).toBe('frozen');
            expect(old.events.of('alert').find(a => a.kind === 'LINEAGE_FROZEN')).toMatchObject({ source: 'uplink', tier: 'P1', critical: true, nSesid: SES });
            expect(cloud.session(SES).meta.frozen).toBe(true);
            expect(old.uplink.cloudLink().state).toBe('sync-refused');

            // A frozen uplink is still live in the room (D19): the old box records; the cloud gets nothing.
            const room = await connect(old);
            await room.send(bridgeLines(30, 10));
            await waitFor(() => (old.kernel.view(SES)?.totalLines ?? 0) >= 41, 15_000, 'old box records');
            await sleep(600);
            expect(cloud.log.rounds.slice(roundsBefore).filter(r => r.nSesid === SES)).toEqual([]);
            expect(cloud.log.raws.slice(rawsBefore).filter(r => r.nSesid === SES)).toEqual([]);
            expect(JSON.stringify(cloud.pagesOf(SES))).toBe(cloudPages);
            expect(cloud.session(SES).meta.root).toBe(cloudRoot);
        });

        it("a hash mismatch only the box can see (no lastRound after a restart): the box's own check freezes it", async () => {
            let box = track(await enrolledBox(cloud));
            await waitFor(() => continued(box), 15_000, 'hello continue');
            const client = await connect(box);
            await client.send(bridgeLines(0, 30));
            await waitConverged(box, cloud, 'synced', () => cloud.session(SES).meta.totalLines >= 31, 30_000);
            await client.end(); // CONN_CLOSE: the journal head moves past the last applied round
            await waitConverged(box, cloud, 'head past applied', () => box.kernel.rawHead(SES)!.headSeq > cloud.session(SES).meta.appliedRawSeq!, 15_000);
            await box.close({ keepDir: true });
            // The cloud's last-applied hash no longer matches the box's history (e.g. another box's lineage).
            cloud.session(SES).meta = { ...cloud.session(SES).meta, appliedRawHash: 'ab'.repeat(32) };

            const roundsBefore = cloud.log.rounds.length;
            box = track(edgeBox({ dir: box.dir, cloudOrigin: cloud.origin }));
            await box.start();
            await waitFor(() => box.uplink.session(SES)?.uplinkState === 'frozen', 15_000, 'frozen by the box');
            const reply = cloud.log.helloReplies[cloud.log.helloReplies.length - 1].find(r => r.nSesid === SES)!;
            expect(reply.verdict).toBe('continue'); // the cloud could not tell
            expect(box.uplink.session(SES)!.frozenReason).toMatch(/chain hash at appliedRawSeq differs/);
            expect(cloud.session(SES).meta.frozen).toBeFalsy();
            const room = await connect(box);
            await room.send(bridgeLines(30, 5));
            await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 36, 15_000, 'still recording');
            await sleep(500);
            expect(cloud.log.rounds.slice(roundsBefore)).toEqual([]);
        });

        it('a FORK reply freezes the session: no further round, P1 alert, local state frozen', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => continued(box), 15_000, 'hello continue');
            const client = await connect(box);
            await client.send(bridgeLines(0, 10));
            await waitConverged(box, cloud, 'synced', () => cloud.session(SES).meta.totalLines >= 11, 30_000);
            cloud.faults.forkNextRound = true;
            await client.send(bridgeLines(10, 10));
            await waitFor(() => box.uplink.session(SES)?.uplinkState === 'frozen', 15_000, 'frozen');
            expect(box.uplink.session(SES)!.frozenReason).toMatch(/FORK/);
            expect(box.state.sessions.get(SES)!.localState).toBe('frozen');
            const rounds = cloud.log.rounds.length;
            await client.send(bridgeLines(20, 10));
            await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 31, 15_000, 'still recording');
            await sleep(500);
            expect(cloud.log.rounds.length).toBe(rounds);
            expect(box.events.of('alert').some(a => a.kind === 'LINEAGE_FROZEN' && a.tier === 'P1')).toBe(true);
        });
    });
});

// ---- optional: the recorded hearing through dial mode, all the way to the cloud ------------------------------------

const TCP_SERVER_DIR = process.env.RT_EDGE_TCP_SERVER_DIR || 'D:/etabella tech/tcp-server-main';
const COMMANDS = path.join(TCP_SERVER_DIR, 'commands.json');
const ACTOR: EdgeActor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online', operatorName: null };

/** tcp.js jsonToHex: entries without cmdType are the ASCII hex of data1 (2 digits per UTF-16 unit), the others hexCmd. */
function corpusChunks(file: string): Buffer[] {
    const hex = (s: string): string => s.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const entries = JSON.parse(fs.readFileSync(file).toString('utf-8')) as Array<{ cmdType?: string; data1?: string; hexCmd?: string }>;
    return entries.map(a => Buffer.from(!a.cmdType ? hex(String(a.data1 ?? '')) : String(a.hexCmd ?? ''), 'hex'));
}

(fs.existsSync(COMMANDS) ? describe : describe.skip)(`rt-edge uplink — tcp-server-main corpus through dial mode to the cloud (optional; ${fs.existsSync(COMMANDS) ? 'present' : `SKIPPED: ${COMMANDS} not found`})`, () => {
    it('every transmitted byte reaches the cloud raw store in order and the cloud pages equal the box pages', async () => {
        const chunks = corpusChunks(COMMANDS);
        const expected = Buffer.concat(chunks);
        const server = net.createServer(sock => {
            sock.on('error', () => undefined);
            void (async () => {
                for (let i = 0; i < chunks.length; i++) {
                    if (!sock.write(chunks[i])) await new Promise(resolve => sock.once('drain', resolve));
                    if (i % 64 === 63) await new Promise(resolve => setImmediate(resolve));
                }
            })();
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
        const port = (server.address() as net.AddressInfo).port;
        const cloud = new FakeCloud();
        await cloud.start();
        cloud.bind({ nSesid: 'ses-corpus-e2e', parserVer: FEED_PARSE_VERSION, route: null });
        const box = await enrolledBox(cloud);
        try {
            await waitFor(() => box.kernel.session('ses-corpus-e2e')?.localState === 'armed', 15_000, 'armed');
            await box.kernel.applyTransmitter({ stateVersion: box.state.transmitter.version(), settings: { mode: 'dial', protocol: 'bridge', host: '127.0.0.1', port, autoReconnect: false, receivingSesid: 'ses-corpus-e2e' }, confirmInterrupt: false }, ACTOR);
            await box.kernel.connectTransmitter(box.state.transmitter.version(), ACTOR);
            await waitFor(() => (box.kernel.session('ses-corpus-e2e')?.bytesIn ?? 0) >= expected.length, 120_000, 'whole corpus received');
            await box.kernel.settled();
            await waitFor(() => converged(box, cloud, 'ses-corpus-e2e'), 60_000, 'cloud == box');
            await expectSameAsBox(box, cloud, 'ses-corpus-e2e');
            const data = Buffer.concat(cloud.rawRecords('ses-corpus-e2e').filter(r => r.type === RecordType.DATA).map(r => r.payload));
            expect(data.equals(expected)).toBe(true);
            expect(cloud.session('ses-corpus-e2e').meta.totalLines).toBeGreaterThan(50);
            expect(await cloud.endSession('ses-corpus-e2e')).toEqual({ ok: true });
            await waitFor(() => ['K', 'W'].includes(cloud.session('ses-corpus-e2e').syncState), 60_000, 'sealed');
        } finally {
            await box.close();
            await cloud.stop();
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });
});
