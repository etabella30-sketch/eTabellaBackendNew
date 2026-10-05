/**
 * The box → cloud segment the Status page and the operator chip read (`cloudLink()`, `status()`, `session()`): the
 * 2026-10-04 review of the venue box Status & troubleshooting cards (critic items 6, 7, 10, 20, 21, 22), against the
 * in-process FakeCloud with a real kernel and node:sqlite state. A wall-clock offset stands in for time passing; the
 * uplink's pacing runs on its own monotonic clock and is not moved.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { FEED_PARSE_VERSION } from '@app/feed-parse';

import { EDGE_TIMING } from '../contracts';
import { bridgeLines, copyDir, eclipse, EclipseClient, scryptRoute, sleep, waitFor } from '../kernel/testing/kernel-harness';
import { cloudErrorCode, dropAckedRaw, linesCloudLacks, noteRawHead, oldestUnackedRawAt, seedRawSeen, thinPendingCuts } from './edge-uplink';
import { EdgeBox, edgeBox, enrolledBox, waitConverged } from './testing/edge-box';
import { FakeCloud } from './testing/fake-cloud';
import { UplinkOptions } from './uplink-options';

jest.setTimeout(60_000);

const SES = 'ses-link-1';
const ROUTE = scryptRoute('eclipse-link', 'pw-link');
const HOUR = 3_600_000;

describe('cloudErrorCode — the code in a refused edge HTTP answer', () => {
    it('reads cCode from detailedError (etabella.net HttpErrorFilter), then the plain body, else null', () => {
        const inner = JSON.stringify({ msg: -1, value: 'No archive', cCode: 'NOT_CONFIGURED' });
        expect(cloudErrorCode({ statusCode: 503, message: 'No archive', detailedError: inner })).toBe('NOT_CONFIGURED');
        // The inner body wins over the filter's own top-level words.
        expect(cloudErrorCode({ statusCode: 503, error: 'Service Unavailable', detailedError: inner })).toBe('NOT_CONFIGURED');
        expect(cloudErrorCode({ msg: -1, cCode: 'RATE' })).toBe('RATE');
        expect(cloudErrorCode({ error: 'not_found' })).toBe('not_found');
        expect(cloudErrorCode({ statusCode: 500, detailedError: 'An error occurred' })).toBeNull();
        expect(cloudErrorCode({ detailedError: '{not json' })).toBeNull();
        expect(cloudErrorCode({})).toBeNull();
    });
});

describe('EdgeUplink — the cloud link the Status page reads (2026-10-04 review)', () => {
    let cloud: FakeCloud;
    const boxes: EdgeBox[] = [];
    const clients: EclipseClient[] = [];
    const dirs: string[] = [];
    const track = (b: EdgeBox): EdgeBox => {
        boxes.push(b);
        return b;
    };
    const connect = async (box: EdgeBox): Promise<EclipseClient> => {
        const c = await eclipse(box.kernel.listenAddress()!.port, 'eclipse-link', 'pw-link');
        clients.push(c);
        return c;
    };
    const continued = (box: EdgeBox): boolean => box.uplink.status().online && box.uplink.session(SES)?.verdict === 'continue';
    const durable = (box: EdgeBox): boolean => {
        const head = box.kernel.rawHead(SES);
        return !!head && head.durableSeq === head.headSeq;
    };

    /** A box that received `lines` lines and whose cloud holds all of them; the wall clock is `Date.now() + clock.offset`. */
    async function syncedBox(lines = 30, extra: { uplink?: UplinkOptions } = {}): Promise<{ box: EdgeBox; client: EclipseClient; clock: { offset: number } }> {
        const clock = { offset: 0 };
        const box = track(await enrolledBox(cloud, { clock: () => Date.now() + clock.offset, uplink: extra.uplink }));
        await waitFor(() => continued(box), 15_000, 'hello continue');
        const client = await connect(box);
        await client.send(bridgeLines(0, lines));
        await waitConverged(box, cloud, SES, 'synced', () => cloud.session(SES).meta.totalLines >= lines + 1);
        return { box, client, clock };
    }

    beforeEach(async () => {
        cloud = new FakeCloud({ maxPart: 4_000 });
        await cloud.start();
        cloud.bind({ nSesid: SES, parserVer: FEED_PARSE_VERSION, route: ROUTE, team: [{ nUserid: 'u1', name: 'Priya Shah', isCaseAdmin: true }] });
    });

    afterEach(async () => {
        for (const c of clients.splice(0)) await c.end().catch(() => undefined);
        for (const b of boxes.splice(0)) await b.close().catch(() => undefined);
        await cloud.stop();
        for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    });

    // =============================================================================================================
    describe('pure rules', () => {
        const page = (n: number): unknown[][] => Array.from({ length: n }, (_, i) => [i]);

        it('lines the cloud lacks: lines past its confirmed total, one per page it holds that changed (item 6)', () => {
            // 33 lines on the box (pages of 25), the cloud confirmed 31: page 2 is dirty for 2 new lines, not its 8.
            const view = { totalLines: 33, nLines: 25, pages: [page(25), page(8)] };
            expect(linesCloudLacks(view, { digests: [], totalLines: 31 }, [2])).toBe(2);
            // An edit on page 1, which the cloud holds whole, counts as one; the new lines on page 2 as themselves.
            expect(linesCloudLacks(view, { digests: [], totalLines: 31 }, [1, 2])).toBe(3);
            // An edit of a line the cloud holds on the last page, nothing new: one.
            expect(linesCloudLacks({ ...view, totalLines: 31, pages: [page(25), page(6)] }, { digests: [], totalLines: 31 }, [2])).toBe(1);
            // Unknown cloud total (after ROOT / c.need): every line of every dirty page; no cloud view: every line.
            expect(linesCloudLacks(view, { digests: [], totalLines: null }, [1, 2])).toBe(33);
            expect(linesCloudLacks(view, null, [])).toBe(33);
            // A box behind the cloud's total (a shrink not applied yet): one per dirty page.
            expect(linesCloudLacks({ ...view, totalLines: 20, pages: [page(20)] }, { digests: [], totalLines: 31 }, [1, 2])).toBe(2);
            expect(linesCloudLacks(view, { digests: [], totalLines: 33 }, [])).toBe(0);
        });

        it('the raw lane remembers when each head was first seen and ages from the oldest record not acked (item 22)', () => {
            let seen = noteRawHead([], 10, 4, 1_000);
            seen = noteRawHead(seen, 10, 4, 2_000); // no new record: nothing noted
            seen = noteRawHead(seen, 15, 4, 3_000);
            expect(seen).toEqual([
                { seq: 10, atMs: 1_000 },
                { seq: 15, atMs: 3_000 },
            ]);
            // Records 5..10 were journaled by 1 000; once 10 is acked the oldest record waiting (11) dates from 3 000.
            expect(oldestUnackedRawAt(seen, 4, 15, 9_000)).toBe(1_000);
            expect(oldestUnackedRawAt(seen, 10, 15, 9_000)).toBe(3_000);
            expect(dropAckedRaw(seen, 10)).toEqual([{ seq: 15, atMs: 3_000 }]);
            // A head not noted yet is new; nothing waits once the cloud acked the head.
            expect(oldestUnackedRawAt(seen, 15, 17, 9_000)).toBe(9_000);
            expect(oldestUnackedRawAt(seen, 15, 15, 9_000)).toBeNull();
            // A record already acked when first seen is not noted.
            expect(noteRawHead([], 4, 4, 1_000)).toEqual([]);
        });

        it('the raw lane seeded at a resume: the head at the hello with the time of the oldest record not acked (review 2026-10-04)', () => {
            // Records 5..20 waited before the restart; the first of them was journaled at 1 000.
            const seeded = seedRawSeen([], 4, 20, 1_000);
            expect(seeded).toEqual([{ seq: 20, atMs: 1_000 }]);
            // A partial ack (through 12) keeps the age: 13..20 date from before the hello too (over-reports, never under).
            expect(oldestUnackedRawAt(seeded, 12, 20, 9_000)).toBe(1_000);
            expect(oldestUnackedRawAt(dropAckedRaw(seeded, 20), 20, 25, 9_000)).toBe(9_000);
            // Heads noted since the hello stay after it; one it covers is merged in, keeping the earlier time.
            expect(seedRawSeen([{ seq: 25, atMs: 9_000 }], 4, 20, 1_000)).toEqual([
                { seq: 20, atMs: 1_000 },
                { seq: 25, atMs: 9_000 },
            ]);
            expect(seedRawSeen([{ seq: 10, atMs: 500 }, { seq: 25, atMs: 9_000 }], 4, 20, 1_000)).toEqual([
                { seq: 20, atMs: 500 },
                { seq: 25, atMs: 9_000 },
            ]);
            // Nothing waits at the hello: nothing seeded.
            expect(seedRawSeen([], 20, 20, 1_000)).toEqual([]);
        });

        it('thinning keeps the later position and the earlier time, for cuts and raw heads alike', () => {
            expect(thinPendingCuts([{ rev: 1, atMs: 10 }, { rev: 2, atMs: 20 }, { rev: 3, atMs: 30 }])).toEqual([{ rev: 2, atMs: 10 }, { rev: 3, atMs: 30 }]);
            expect(thinPendingCuts([{ seq: 5, atMs: 10 }, { seq: 9, atMs: 20 }])).toEqual([{ seq: 9, atMs: 10 }]);
        });
    });

    // =============================================================================================================
    describe('behind or synced (items 6, 7, 20)', () => {
        it('a change in flight reads Synced, not "0 s behind"; Behind once it is cloudBehindAfterSec old; Waiting counts only the lines the cloud lacks', async () => {
            const { box, client, clock } = await syncedBox(30);
            cloud.faults.busyRounds = 1_000_000; // every round answered BUSY: the page stays in flight
            await client.send(bridgeLines(30, 2));
            await waitFor(() => box.uplink.cloudLink().pendingPages > 0, 10_000, 'a page in flight');
            const total = box.kernel.view(SES)!.totalLines;
            const cloudTotal = cloud.session(SES).meta.totalLines;
            const linesOnPage2 = box.kernel.view(SES)!.pages[1].length;
            const inFlight = box.uplink.cloudLink();
            expect(inFlight).toMatchObject({ state: 'synced', pendingPages: 1 });
            expect(inFlight.lagSec).toBeLessThan(EDGE_TIMING.cloudBehindAfterSec);
            expect(inFlight.lagLines).toBe(total - cloudTotal);
            expect(inFlight.lagLines).toBeLessThan(linesOnPage2);
            expect(box.uplink.session(SES)!.lagLines).toBe(total - cloudTotal);

            clock.offset += (EDGE_TIMING.cloudBehindAfterSec + 1) * 1_000;
            const late = box.uplink.cloudLink();
            expect(late.state).toBe('behind');
            expect(late.lagSec).toBeGreaterThanOrEqual(EDGE_TIMING.cloudBehindAfterSec);

            cloud.faults.busyRounds = 0;
            await waitConverged(box, cloud, SES, 'caught up', () => cloud.session(SES).meta.totalLines >= total);
            await waitFor(() => box.uplink.cloudLink().state === 'synced' && box.uplink.cloudLink().pendingPages === 0, 5_000, 'synced again');
            expect(box.uplink.cloudLink()).toMatchObject({ lagSec: 0, lagLines: 0 });
        });

        it('a box with no session reads Synced with a confirmation time once its hello completed (item 7)', async () => {
            const empty = new FakeCloud({ maxPart: 4_000 });
            await empty.start();
            try {
                const box = track(await enrolledBox(empty));
                await waitFor(() => box.uplink.status().online, 15_000, 'online');
                await waitFor(() => box.uplink.cloudLink().state !== 'cant-reach-etabella', 5_000, 'hello done');
                expect(box.uplink.cloudLink()).toMatchObject({ state: 'synced', lagSec: 0, pendingPages: 0 });
                expect(box.uplink.cloudLink().lastSyncedAtMs).not.toBeNull();
            } finally {
                for (const b of boxes.splice(0)) await b.close().catch(() => undefined);
                await empty.stop();
            }
        });

        it('an idle box restarted with everything on the cloud reads Synced, Last confirmed set, with nothing sent (item 7, end to end)', async () => {
            const { box, client } = await syncedBox(30);
            // The reporter disconnects (its CONN_CLOSE reaches the cloud too); the cloud then holds every record.
            await client.end();
            await waitFor(() => !box.kernel.session(SES)?.catConnected, 5_000, 'disconnected');
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'durable');
            await waitConverged(box, cloud, SES, 'raw and pages on the cloud');
            // A power-cut image: the uplink stops first, the disk is what it was.
            await box.uplink.close();
            const image = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-link-'));
            dirs.push(image);
            copyDir(box.dir, image);
            await box.close();

            const rounds = cloud.log.rounds.length;
            const raws = cloud.log.raws.length;
            const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin }));
            await restarted.start();
            await waitFor(() => continued(restarted), 15_000, 'hello after the restart');
            await waitFor(() => restarted.uplink.cloudLink().state === 'synced', 5_000, 'synced after the hello');
            expect(restarted.uplink.cloudLink().lastSyncedAtMs).not.toBeNull();
            expect(restarted.uplink.status().lastSyncAt).not.toBeNull();
            expect(restarted.uplink.session(SES)!.lastSyncedAtMs).not.toBeNull();
            // The hello alone confirmed it: no round and no raw batch since the restart.
            expect(cloud.log.rounds.length).toBe(rounds);
            expect(cloud.log.raws.length).toBe(raws);
        });

        it('a hello that skipped a session still replaying confirms nothing; the hello that carries it does (review 2026-10-04)', async () => {
            const { box, client } = await syncedBox(30);
            await client.end();
            await waitFor(() => !box.kernel.session(SES)?.catConnected, 5_000, 'disconnected');
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'durable');
            await waitConverged(box, cloud, SES, 'raw and pages on the cloud');
            await box.uplink.close();
            const image = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-link-'));
            dirs.push(image);
            copyDir(box.dir, image);
            await box.close();

            const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin }));
            // The kernel still replays the journal when the first hello goes out: the hello leaves the session out.
            const kernel = restarted.kernel as unknown as { sessions(): readonly { nSesid: string; recovering: unknown }[] };
            const realSessions = kernel.sessions.bind(kernel);
            let replaying = true;
            kernel.sessions = () => realSessions().map(v => (replaying && v.nSesid === SES ? { ...v, recovering: { startedAtMs: Date.now(), progressPct: 40 } } : v));
            await restarted.start();
            await waitFor(() => restarted.uplink.status().online, 15_000, 'the first hello');
            await sleep(100);
            expect(restarted.uplink.session(SES)).toBeNull();
            // Nothing is confirmed: the cloud has not said what it holds of the session yet.
            expect(restarted.uplink.status().lastSyncAt).toBeNull();
            expect(restarted.uplink.cloudLink().lastSyncedAtMs).toBeNull();

            replaying = false;
            await waitFor(() => continued(restarted), 15_000, 'the hello that carries the session');
            await waitFor(() => restarted.uplink.cloudLink().lastSyncedAtMs !== null, 5_000, 'confirmed');
            expect(restarted.uplink.cloudLink().state).toBe('synced');
        });

        it('a held session no hello can carry (its worker never opened) does not keep the hello from confirming (review 2026-10-04)', async () => {
            const { box, client } = await syncedBox(30);
            await client.end();
            await waitFor(() => !box.kernel.session(SES)?.catConnected, 5_000, 'disconnected');
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'durable');
            await waitConverged(box, cloud, SES, 'raw and pages on the cloud');
            await box.uplink.close();
            const image = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-link-'));
            dirs.push(image);
            copyDir(box.dir, image);
            await box.close();

            const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin }));
            // The session's journal is pinned to another parser (or its folder is not writable): the kernel holds it with
            // no worker, so it has no view and no corrupt journal, and no hello carries it until an admin splits it.
            const kernel = restarted.kernel as unknown as { view(nSesid: string): unknown };
            const realView = kernel.view.bind(kernel);
            kernel.view = (nSesid: string) => (nSesid === SES ? null : realView(nSesid));
            // The lifecycle order (kernel, then uplink), with the replay done before the first hello.
            await restarted.kernel.start();
            await waitFor(() => !!restarted.kernel.session(SES) && !restarted.kernel.session(SES)!.recovering, 15_000, 'held, replay done');
            await restarted.uplink.start();
            await waitFor(() => restarted.uplink.status().online, 15_000, 'the first hello');
            await sleep(100);
            expect(restarted.kernel.session(SES)).not.toBeNull();
            expect(restarted.uplink.session(SES)).toBeNull();
            // The hello carried every session a hello can carry: the cloud confirmed it holds everything that waits.
            expect(restarted.uplink.status().lastSyncAt).not.toBeNull();
            expect(restarted.uplink.cloudLink()).toMatchObject({ state: 'synced' });
            expect(restarted.uplink.cloudLink().lastSyncedAtMs).not.toBeNull();
        });

        it('reading cloudLink() never swallows a cloud-link-changed event (item 20)', async () => {
            const { box } = await syncedBox(5);
            await waitFor(() => box.uplink.cloudLink().state === 'synced', 5_000, 'synced');
            const before = box.events.of('cloud-link-changed').length;
            // The cloud refused the key: the state changes with no event of its own; a GET /status reads it first.
            box.state.identity.patch({ linkFailure: 'key-refused' });
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            await waitFor(() => box.events.of('cloud-link-changed').slice(before).some(e => e.state === 'not-linked'), 3_000, 'cloud-link-changed not-linked');
        });
    });

    // =============================================================================================================
    describe('lag after a restart and in the raw lane (items 21, 22)', () => {
        it('a box restarted with pages the cloud lacks reads their age from the journal, not "0 s behind"', async () => {
            const { box, client } = await syncedBox(30);
            await cloud.stop();
            await waitFor(() => !box.uplink.status().online, 10_000, 'offline');
            await client.send(bridgeLines(30, 30));
            await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 61, 15_000, 'offline lines');
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'durable');
            await box.uplink.close();
            const image = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-link-'));
            dirs.push(image);
            copyDir(box.dir, image);
            await client.end();
            await box.close();

            // Two hours later the box starts again; the cloud answers every round BUSY, so the pages stay waiting.
            cloud.faults.busyRounds = 1_000_000;
            await cloud.start();
            const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin, clock: () => Date.now() + 2 * HOUR }));
            await restarted.start();
            await waitFor(() => continued(restarted), 15_000, 'hello after the restart');
            await waitFor(() => (restarted.uplink.session(SES)?.dirtyPages ?? 0) > 0, 5_000, 'pages waiting');
            // When the first hello went out while the kernel still replayed the journal, a second hello resumes the
            // session: `continued` holds from its verdict on, before it read the journal for the age. Wait for that read
            // (an unseeded lag grows one second a second and never reaches a minute in time).
            await waitFor(() => restarted.uplink.cloudLink().lagSec >= 60, 5_000, 'the age read from the journal');
            const lag = restarted.uplink.cloudLink();
            expect(lag.state).toBe('behind');
            expect(lag.lagSec).toBeGreaterThanOrEqual(2 * 3_600 - 60);
            expect(restarted.uplink.status().lagSec).toBeGreaterThanOrEqual(2 * 3_600 - 60);
            expect(restarted.uplink.session(SES)!.lagSec).toBeGreaterThanOrEqual(2 * 3_600 - 60);
            // Once the cloud takes the round the lag is gone.
            cloud.faults.busyRounds = 0;
            await waitConverged(restarted, cloud, SES, 'caught up after the restart');
            await waitFor(() => restarted.uplink.cloudLink().lagSec === 0, 5_000, 'no lag');
        });

        it('a partial raw ack after a restart keeps the age of the backlog journaled before the hello (review 2026-10-04)', async () => {
            const { box, client } = await syncedBox(30);
            await waitFor(() => box.uplink.session(SES)?.rawAckedSeq === box.kernel.rawHead(SES)?.headSeq, 10_000, 'raw on the cloud');
            const ackedBefore = box.uplink.session(SES)!.rawAckedSeq;
            await cloud.stop();
            await waitFor(() => !box.uplink.status().online, 10_000, 'offline');
            // Three sends: three raw records the cloud lacks.
            for (let i = 0; i < 3; i++) {
                await client.send(bridgeLines(30 + 10 * i, 10));
                await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 41 + 10 * i, 15_000, `offline lines ${i + 1}`);
            }
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'durable');
            const head = box.kernel.rawHead(SES)!.headSeq;
            expect(head).toBeGreaterThan(ackedBefore + 1);
            const mid = ackedBefore + 1;
            const midHash = (await box.kernel.rawHashAt(SES, mid))!;
            await box.uplink.close();
            const image = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-link-'));
            dirs.push(image);
            copyDir(box.dir, image);
            await client.end();
            await box.close();

            // Two hours later: the pages go through, but the cloud acks one raw part and then holds the lane a minute.
            cloud.faults.rawReplies.push({ ackedSeq: mid, ackedHash: midHash }, { expectSeq: mid + 1, reason: 'rate', retryAfterMs: 60_000 });
            await cloud.start();
            const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin, clock: () => Date.now() + 2 * HOUR }));
            await restarted.start();
            await waitFor(() => continued(restarted), 15_000, 'hello after the restart');
            await waitFor(() => restarted.uplink.session(SES)?.rawAckedSeq === mid, 10_000, 'one raw part acked');
            await waitFor(() => restarted.uplink.session(SES)?.dirtyPages === 0, 10_000, 'pages on the cloud');
            const sync = restarted.uplink.session(SES)!;
            expect(sync.lagBytes).toBeGreaterThan(0);
            // Records mid+1..head were journaled two hours ago: the lag says so, not "seconds since the hello".
            expect(sync.lagSec).toBeGreaterThanOrEqual(2 * 3_600 - 60);
            expect(restarted.uplink.cloudLink().lagSec).toBeGreaterThanOrEqual(2 * 3_600 - 60);
            expect(restarted.uplink.cloudLink().state).toBe('behind');
        });

        it('restarted while offline, lines since the start count as waiting before any hello (a lower bound)', async () => {
            const { box, client } = await syncedBox(10);
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'durable');
            await box.uplink.close();
            const image = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-link-'));
            dirs.push(image);
            copyDir(box.dir, image);
            await client.end();
            await box.close();
            await cloud.stop();

            const clock = { offset: 0 };
            const restarted = track(edgeBox({ dir: image, cloudOrigin: cloud.origin, clock: () => Date.now() + clock.offset }));
            await restarted.start();
            await waitFor(() => !!restarted.kernel.session(SES) && !restarted.kernel.session(SES)!.recovering && !!restarted.kernel.view(SES), 15_000, 'reopened');
            await sleep(200);
            expect(restarted.uplink.cloudLink().lagSec).toBe(0); // nothing new yet, and nothing known about the cloud
            const again = await connect(restarted);
            await again.send(bridgeLines(10, 5));
            await waitFor(() => (restarted.kernel.view(SES)?.totalLines ?? 0) >= 16, 15_000, 'lines after the restart');
            await sleep(200);
            clock.offset += 90_000;
            expect(['cant-reach-etabella', 'internet-unavailable']).toContain(restarted.uplink.cloudLink().state);
            expect(restarted.uplink.cloudLink().lagSec).toBeGreaterThanOrEqual(90);
            expect(restarted.uplink.status().lagSec).toBeGreaterThanOrEqual(90);
        });

        it('a raw lane that never fully catches up ages from the oldest record not acked, not from the start of the burst', async () => {
            const { box, client, clock } = await syncedBox(30);
            // Batch A: the cloud holds the raw lane back ('rate'), so A waits from t0.
            cloud.faults.rawLag = true;
            await client.send(bridgeLines(30, 3));
            await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 34, 10_000, 'batch A on the box');
            await box.kernel.settled();
            await waitFor(() => durable(box), 5_000, 'A durable');
            await sleep(300);
            const endOfA = box.kernel.rawHead(SES)!.headSeq;
            const hashA = (await box.kernel.rawHashAt(SES, endOfA))!;
            expect(box.uplink.session(SES)!.lagBytes).toBeGreaterThan(0);

            // Ten seconds later batch B arrives; then the cloud acks A only and holds the lane for a minute.
            clock.offset += 10_000;
            await client.send(bridgeLines(33, 3));
            await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 37, 10_000, 'batch B on the box');
            await box.kernel.settled();
            await waitFor(() => durable(box) && box.kernel.rawHead(SES)!.headSeq > endOfA, 5_000, 'B durable');
            cloud.faults.rawReplies.push({ ackedSeq: endOfA, ackedHash: hashA }, { expectSeq: endOfA + 1, reason: 'rate', retryAfterMs: 60_000 });
            cloud.faults.rawLag = false;
            await waitFor(() => box.uplink.session(SES)?.rawAckedSeq === endOfA, 10_000, 'A acked');
            await waitFor(() => box.uplink.session(SES)?.dirtyPages === 0, 10_000, 'pages on the cloud');
            const sync = box.uplink.session(SES)!;
            expect(sync.lagBytes).toBeGreaterThan(0);
            expect(sync.lagSec).toBeLessThan(5);
        });
    });

    // =============================================================================================================
    describe('held captures etabella.net cannot take (item 10)', () => {
        function holdCapture(box: EdgeBox, id: string): void {
            const bytes = Buffer.from(`second connection bytes ${id}`);
            const file = path.join(box.config.paths.captureDir, `${id}.bin`);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, bytes);
            const sha256 = createHash('sha256').update(bytes).digest('hex');
            box.state.heldCaptures.upsert({ id, nSesid: SES, kind: 'C', user: 'eclipse-link', peer: '10.0.0.7', fromMs: Date.now() - 2_000, toMs: Date.now() - 1_000, bytes: bytes.length, sha256, file, uploadedAtMs: null, nOrphanid: null });
        }

        it('503 NOT_CONFIGURED: tried again after the long waits, the capture reported once, and the cloud link says so', async () => {
            // As etabella.net really answers: the global HttpErrorFilter puts the route's body, cCode included, in
            // detailedError (a JSON string). Found on the live box 2026-10-04: a plain-body fake hid that.
            const inner = { msg: -1, message: 'No archive is configured for venue uploads', value: 'No archive is configured for venue uploads', cCode: 'NOT_CONFIGURED' };
            cloud.faults.archiveUrlRefusal = {
                status: 503,
                body: { statusCode: 503, message: inner.message, detailedError: JSON.stringify(inner), timestamp: new Date().toISOString() },
            };
            const box = track(await enrolledBox(cloud, { uplink: { captureRetryMs: 50, captureNotConfiguredRetryMs: [600, 1_500] } }));
            await waitFor(() => box.uplink.status().online, 10_000, 'online');
            expect(box.uplink.cloudLink()).toMatchObject({ heldCapturesPending: 0, lastUploadError: null });
            holdCapture(box, 'cap-nc');
            await waitFor(() => cloud.log.archiveUrls.length >= 1, 10_000, 'first archive-url');
            await waitFor(() => box.uplink.cloudLink().lastUploadError !== null, 5_000, 'the error is on the link');
            const link = box.uplink.cloudLink();
            expect(link.heldCapturesPending).toBe(1);
            expect(link.lastUploadError).toMatchObject({ status: 503, code: 'NOT_CONFIGURED' });
            expect(link.lastUploadError!.atMs).toBeGreaterThan(0);

            // The first wait (600 ms here, 15 min on a box), then the longer one (1.5 s here, 60 min): not every 50 ms.
            await waitFor(() => cloud.log.archiveUrls.length >= 4, 10_000, 'four archive-url requests');
            const at = cloud.log.archiveUrls.map(r => r.atMs);
            expect(at[1] - at[0]).toBeGreaterThanOrEqual(550);
            expect(at[2] - at[1]).toBeGreaterThanOrEqual(1_400);
            expect(at[3] - at[2]).toBeGreaterThanOrEqual(1_400);
            // The cloud accepted the capture report the first time: it is not sent again on each retry.
            expect(cloud.log.captures).toHaveLength(1);

            // An archive is configured: the next try uploads it, under the orphan the first report created.
            cloud.faults.archiveUrlRefusal = null;
            await waitFor(() => box.state.heldCaptures.get('cap-nc')!.uploadedAtMs !== null, 10_000, 'uploaded');
            expect(cloud.log.captures).toHaveLength(1);
            expect(box.uplink.cloudLink()).toMatchObject({ heldCapturesPending: 0, lastUploadError: null });
        });

        it('a restart neither reports the capture again nor tries at once; the error stays on the link (review 2026-10-04)', async () => {
            cloud.faults.archiveUrlRefusal = { status: 503, body: { msg: -1, cCode: 'NOT_CONFIGURED' } };
            const slow: UplinkOptions = { captureRetryMs: 50, captureNotConfiguredRetryMs: [600_000, 600_000] };
            const box = track(await enrolledBox(cloud, { uplink: slow }));
            await waitFor(() => box.uplink.status().online, 10_000, 'online');
            holdCapture(box, 'cap-restart');
            await waitFor(() => box.uplink.cloudLink().lastUploadError?.code === 'NOT_CONFIGURED', 10_000, 'refused once');
            expect(cloud.log.captures).toHaveLength(1);
            // The orphan id the cloud gave is kept with the capture, which still waits.
            const reported = box.state.heldCaptures.get('cap-restart')!;
            expect(reported.nOrphanid).not.toBeNull();
            expect(reported.uploadedAtMs).toBeNull();
            const error = box.uplink.cloudLink().lastUploadError;
            await box.close({ keepDir: true });

            // PM2 restart, deploy, power cut: the same data dir (removed when the restarted box closes).
            const restarted = track(edgeBox({ dir: box.dir, cloudOrigin: cloud.origin, uplink: slow }));
            await restarted.start();
            await waitFor(() => restarted.uplink.status().online, 10_000, 'online after the restart');
            await sleep(500); // twenty ticks
            expect(cloud.log.archiveUrls).toHaveLength(1); // the 15-minute wait holds
            expect(cloud.log.captures).toHaveLength(1); // no second report (no second P1 page)
            expect(restarted.uplink.cloudLink()).toMatchObject({ heldCapturesPending: 1, lastUploadError: error });

            // The archive is set up; "Run checks again" uploads under the orphan the first report created.
            cloud.faults.archiveUrlRefusal = null;
            await restarted.uplink.syncNow();
            await waitFor(() => restarted.state.heldCaptures.get('cap-restart')!.uploadedAtMs !== null, 5_000, 'uploaded');
            expect(restarted.state.heldCaptures.get('cap-restart')!.nOrphanid).toBe(reported.nOrphanid);
            expect(cloud.log.captures).toHaveLength(1);
            expect(restarted.uplink.cloudLink()).toMatchObject({ heldCapturesPending: 0, lastUploadError: null });
        });

        it('"Run checks again" tries a waiting capture at once', async () => {
            cloud.faults.archiveUrlRefusal = { status: 503, body: { msg: -1, cCode: 'NOT_CONFIGURED' } };
            const box = track(await enrolledBox(cloud, { uplink: { captureRetryMs: 600_000, captureNotConfiguredRetryMs: [600_000, 600_000] } }));
            await waitFor(() => box.uplink.status().online, 10_000, 'online');
            holdCapture(box, 'cap-now');
            await waitFor(() => box.uplink.cloudLink().lastUploadError?.code === 'NOT_CONFIGURED', 10_000, 'refused once');
            cloud.faults.archiveUrlRefusal = null;
            await box.uplink.syncNow();
            await waitFor(() => box.state.heldCaptures.get('cap-now')!.uploadedAtMs !== null, 5_000, 'uploaded after Run checks again');
        });

        it('any other failure keeps the one-minute retry and names itself', async () => {
            cloud.faults.archiveUrlRefusal = { status: 500, body: { msg: -1, cCode: 'ERROR' } };
            const box = track(await enrolledBox(cloud, { uplink: { captureRetryMs: 100, captureNotConfiguredRetryMs: [600_000, 600_000] } }));
            await waitFor(() => box.uplink.status().online, 10_000, 'online');
            holdCapture(box, 'cap-err');
            await waitFor(() => cloud.log.archiveUrls.length >= 3, 10_000, 'three quick tries');
            expect(box.uplink.cloudLink().lastUploadError).toMatchObject({ status: 500, code: 'ERROR' });
            expect(cloud.log.captures).toHaveLength(1);
        });
    });
});
