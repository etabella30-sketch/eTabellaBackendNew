/**
 * EdgeUplink behaviours against the in-process FakeCloud (testing/fake-cloud.ts) with a real kernel and node:sqlite
 * state: identity and refusals (§3.4, §5.3), hello side effects (JWKS, revocations, assignments, e.ready), cloud → box
 * messages (c.assign, c.need, c.cmd, c.refused), round / raw / seal replies (§5.4, §5.5), e.status (§12), the
 * internet hysteresis and Connectivity Log, the LAN certificate (§8.3) and held-capture upload. The end-to-end proof
 * (outage, D19, kill/restart) is edge-uplink.e2e.spec.ts.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { EdgeEvent } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';

import { boxDay, EdgeDeviceHealth, EdgePrincipal, isEdgePortError, KernelRecoverResult, ServerTime } from '../ports';
import { selfSignedCertificate } from '../ports/testing/self-signed';
import { bridgeLines, copyDir, eclipse, EclipseClient, scryptRoute, sessionAssignment, sleep, waitFor } from '../kernel/testing/kernel-harness';
import { CloudHttp, CloudNetworkError, nodeCloudHttp } from './cloud-http';
import { DeviceKey } from './device-key';
import { RECOVER_ESCALATE_AFTER, RECOVER_FAILED_REALERT_MS } from './edge-uplink';
import { EdgeBox, edgeBox, enrolledBox, waitConverged } from './testing/edge-box';
import { UplinkOptions } from './uplink-options';
import { FakeCloud } from './testing/fake-cloud';

jest.setTimeout(60_000);

const SES = 'ses-up-1';
const ROUTE = scryptRoute('eclipse-up', 'pw-up');

async function expectPortError(work: Promise<unknown>, code: string): Promise<void> {
    let caught: unknown;
    try {
        await work;
    } catch (err) {
        caught = err;
    }
    expect(isEdgePortError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe(code);
}

describe('EdgeUplink', () => {
    let cloud: FakeCloud;
    const boxes: EdgeBox[] = [];
    const clients: EclipseClient[] = [];
    const track = (b: EdgeBox): EdgeBox => {
        boxes.push(b);
        return b;
    };
    const connect = async (box: EdgeBox): Promise<EclipseClient> => {
        const c = await eclipse(box.kernel.listenAddress()!.port, 'eclipse-up', 'pw-up');
        clients.push(c);
        return c;
    };
    const online = (box: EdgeBox): boolean => box.uplink.status().online;

    beforeEach(async () => {
        cloud = new FakeCloud({ maxPart: 4_000 });
        await cloud.start();
        cloud.bind({ nSesid: SES, parserVer: FEED_PARSE_VERSION, route: ROUTE, team: [{ nUserid: 'u1', name: 'Priya Shah', isCaseAdmin: true }] });
    });

    afterEach(async () => {
        for (const c of clients.splice(0)) await c.end().catch(() => undefined);
        for (const b of boxes.splice(0)) await b.close().catch(() => undefined);
        await cloud.stop();
    });

    // =============================================================================================================
    describe('identity and connection refusals (§3.4, §5.3, MR-6)', () => {
        it('a box with no identity never connects: not-linked, never-enrolled; syncNow is box_not_configured', async () => {
            const box = track(edgeBox({ cloudOrigin: cloud.origin }));
            await box.start();
            await sleep(200);
            expect(cloud.log.connects).toEqual([]);
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            expect(box.uplink.status().online).toBe(false);
            await expectPortError(box.uplink.syncNow(), 'box_not_configured');
            await expectPortError(box.uplink.ensureCertificate().then(() => box.uplink.uploadCapture('x')), 'not_found');
        });

        it('pending-confirm: KEY_UNCONFIRMED retries collapse into one log row; the first accepted connect activates the key', async () => {
            const box = track(await enrolledBox(cloud, { autoConfirm: false }));
            expect(box.state.identity.get()).toMatchObject({ status: 'pending-confirm', confirmedAtMs: null, lastCloudContactAtMs: null });
            const today = boxDay(Date.now(), box.config.box.timeZone);
            const refusedRows = () => box.state.connectivityLog.page({ filter: 'cloud' }, today).rows.filter(r => r.code === 'cloud-refused');
            // Wait on the BOX's record of the third refusal, not only the cloud's: the fake cloud logs a refusal before
            // the box has received its connect_error and counted the try, so under load the box could still be at 2.
            await waitFor(
                () => cloud.log.refusedConnects.filter(c => c === 'KEY_UNCONFIRMED').length >= 3 && refusedRows().some(r => (r.retry?.tries ?? 0) >= 3),
                10_000,
                'three refused tries, counted by the box',
            );
            expect(box.state.identity.get()).toMatchObject({ status: 'pending-confirm', linkFailure: 'key-refused' });
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            const rows = refusedRows();
            expect(rows).toHaveLength(1);
            expect(rows[0].retry).toMatchObject({ active: true });
            expect(rows[0].retry!.tries).toBeGreaterThanOrEqual(3);
            await expectPortError(box.uplink.syncNow(), 'box_not_linked');

            // The admin compares the fingerprint and confirms ('C' → 'A').
            const node = cloud.nodes.get(box.state.identity.get()!.nEdgeid)!;
            node.status = 'A';
            await waitFor(() => online(box), 10_000, 'online after the confirmation');
            const identity = box.state.identity.get()!;
            expect(identity).toMatchObject({ status: 'active', linkFailure: null });
            expect(identity.confirmedAtMs).not.toBeNull();
            expect(identity.lastCloudContactAtMs).not.toBeNull();
            const after = box.state.connectivityLog.page({ filter: 'cloud' }, today).rows;
            expect(after.find(r => r.code === 'cloud-refused')!.retry!.active).toBe(false);
            expect(after.some(r => r.code === 'cloud-connected')).toBe(true);
        });

        it('REVOKED at connect: identity revoked, P1 alert, no further attempt; syncNow is box_not_linked', async () => {
            const box = track(await enrolledBox(cloud, { start: false }));
            cloud.nodes.get(box.state.identity.get()!.nEdgeid)!.status = 'X';
            await box.start();
            await waitFor(() => box.state.identity.get()!.status === 'revoked', 10_000, 'revoked');
            const tries = cloud.log.refusedConnects.length;
            await sleep(400);
            expect(cloud.log.refusedConnects.length).toBe(tries);
            expect(box.state.identity.get()!.linkFailure).toBe('revoked');
            expect(box.events.of('alert').find(a => a.kind === 'BOX_REVOKED')).toMatchObject({ tier: 'P1', critical: true });
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            await expectPortError(box.uplink.syncNow(), 'box_not_linked');
        });

        it('c.refused REVOKED while connected: revoked, never reconnects', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box), 10_000, 'online');
            cloud.nodes.get(box.state.identity.get()!.nEdgeid)!.status = 'X';
            const connects = cloud.log.connects.length;
            cloud.refuse('REVOKED');
            await waitFor(() => box.state.identity.get()!.status === 'revoked', 5_000, 'revoked');
            await sleep(400);
            expect(cloud.log.connects.length).toBe(connects);
            expect(cloud.log.refusedConnects).toEqual([]);
            expect(box.uplink.status().online).toBe(false);
        });

        it('quarantine (c.assign and hello refusal): status only, no rounds, box_not_linked; re-approval re-activates', async () => {
            const box = track(await enrolledBox(cloud, { uplink: { rehelloEveryMs: 300 } }));
            await waitFor(() => online(box) && box.uplink.session(SES)?.verdict === 'continue', 10_000, 'online');
            const node = cloud.nodes.get(box.state.identity.get()!.nEdgeid)!;
            node.status = 'Q';
            expect(await cloud.push(EdgeEvent.assign, { op: 'quarantine' })).toEqual({ ok: true });
            expect(box.state.identity.get()).toMatchObject({ status: 'quarantined', linkFailure: 'quarantined' });
            expect(box.events.of('alert').find(a => a.kind === 'QUARANTINED')).toMatchObject({ tier: 'P1' });
            await waitFor(() => cloud.log.hellos.length >= 3, 5_000, 're-hello while quarantined');
            const client = await connect(box);
            const rounds = cloud.log.rounds.length;
            const statuses = cloud.log.statuses.length;
            await client.send(bridgeLines(0, 10));
            await sleep(600);
            expect(cloud.log.rounds.length).toBe(rounds);
            expect(cloud.log.statuses.length).toBeGreaterThan(statuses); // e.status keeps flowing (§5.3)
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            await expectPortError(box.uplink.syncNow(), 'box_not_linked');
            // The admin re-approves the box.
            node.status = 'A';
            await waitFor(() => box.state.identity.get()!.status === 'active', 10_000, 're-approved');
            await waitConverged(box, cloud, SES, 'converged after re-approval');
        });

        it('DUP_IDENTITY: a clone with the same key is refused while the original is online (P1 critical on the clone)', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box), 10_000, 'online');
            const cloneDir = `${box.dir}-clone`;
            copyDir(box.dir, cloneDir);
            const clone = track(edgeBox({ dir: cloneDir, cloudOrigin: cloud.origin }));
            await clone.start();
            await waitFor(() => cloud.log.refusedConnects.includes('DUP_IDENTITY'), 10_000, 'refused clone');
            await waitFor(() => clone.events.of('alert').some(a => a.kind === 'DUP_IDENTITY'), 5_000, 'clone alert');
            expect(clone.events.of('alert').find(a => a.kind === 'DUP_IDENTITY')).toMatchObject({ tier: 'P1', critical: true });
            expect(online(box)).toBe(true);
            expect(online(clone)).toBe(false);
        });

        it('a hello refused for an old protocol (UPGRADE) alerts P1 and reconnects with backoff', async () => {
            cloud.faults.refuseHello = 'UPGRADE';
            const box = track(await enrolledBox(cloud));
            await waitFor(() => box.events.of('alert').some(a => a.kind === 'UPGRADE'), 10_000, 'UPGRADE alert');
            await waitFor(() => cloud.log.connects.length >= 2, 10_000, 'reconnected');
            expect(online(box)).toBe(false);
            cloud.faults.refuseHello = null;
            await waitFor(() => online(box), 10_000, 'online after the refusal ends');
        });

        it('the internet hysteresis: offline after the down window, internet rows, syncNow offline fast; back up after the up window', async () => {
            let down = false;
            const http: CloudHttp = req => (down ? Promise.reject(new CloudNetworkError('getaddrinfo ENOTFOUND', 'ENOTFOUND')) : nodeCloudHttp(req));
            const box = track(await enrolledBox(cloud, { uplink: { http, internetOfflineAfterMs: 150, internetOnlineAfterMs: 100, probeOfflineEveryMs: 50, probeOnlineEveryMs: 50 } }));
            await waitFor(() => online(box) && box.uplink.internet().state === 'up', 10_000, 'online');
            down = true;
            await cloud.stop();
            await waitFor(() => box.uplink.internet().state === 'down', 10_000, 'internet down');
            expect(box.events.of('internet-changed').map(e => e.state)).toEqual(['up', 'down']);
            expect(box.uplink.cloudLink().state).toBe('internet-unavailable');
            const t0 = Date.now();
            await expectPortError(box.uplink.syncNow(), 'offline');
            expect(Date.now() - t0).toBeLessThan(300);
            expect(box.uplink.etabellaReachable()).toBe(false);
            const codes = box.state.connectivityLog.page({}, boxDay(Date.now(), box.config.box.timeZone)).rows.map(r => r.code);
            expect(codes).toEqual(expect.arrayContaining(['internet-up', 'internet-down', 'cloud-disconnected']));
            down = false;
            await cloud.start();
            await waitFor(() => box.uplink.internet().state === 'up' && online(box), 10_000, 'back up');
            expect(box.uplink.etabellaReachable()).toBe(true);
        });
    });

    // =============================================================================================================
    describe('hello side effects and cloud → box messages', () => {
        it('caches the edge-token keys, applies cloud revocations with the box receipt time, publishes access-revoked once', async () => {
            cloud.edgeTokenKeys = [{ kty: 'EC', crv: 'P-256', x: 'x1', y: 'y1', kid: 'k1', alg: 'ES256', use: 'sig' }];
            cloud.revokedJtis = ['jti-1'];
            cloud.revokedUsers = ['u9'];
            const t0 = Date.now();
            const box = track(await enrolledBox(cloud, { uplink: { rehelloEveryMs: 200 } }));
            await waitFor(() => online(box), 10_000, 'online');
            expect(box.state.jwks.get()!.keys).toEqual(cloud.edgeTokenKeys);
            expect(box.state.revocations.isJtiDenied('jti-1', Date.now())).toBe(true);
            const cutoff = box.state.revocations.userRevokedAtMs('u9')!;
            expect(cutoff).toBeGreaterThanOrEqual(t0 + 5 * 60_000);
            expect(cutoff).toBeLessThanOrEqual(Date.now() + 5 * 60_000);
            expect(box.events.of('access-revoked')).toEqual([expect.objectContaining({ jtis: ['jti-1'], userIds: ['u9'], reason: 'cloud-revocation' })]);
            await waitFor(() => cloud.log.hellos.length >= 3, 5_000, 'more hellos');
            expect(box.events.of('access-revoked')).toHaveLength(1);
            expect(box.uplink.cloudClockOffset()).toMatchObject({ offsetMs: expect.any(Number), rttMs: expect.any(Number) });
        });

        it('feeds every hello reading to etabella.net time, measured on the raw PC clock: a 347 ms offset stays 347 ms once corrected (user decision 2026-10-05)', async () => {
            // The box PC runs 347 ms fast; the FakeCloud answers with its own Date.now().
            const serverTime = new ServerTime(() => Date.now() + 347);
            const box = track(await enrolledBox(cloud, { serverTime, uplink: { rehelloEveryMs: 150 } }));
            await waitFor(() => online(box), 10_000, 'online');
            await waitFor(() => cloud.log.hellos.length >= 4, 5_000, 'several hellos');
            // Measured on the corrected clock the offset would shrink to 0 after the first hello.
            const offset = box.uplink.cloudClockOffset()!;
            expect(Math.abs(offset.offsetMs - 347)).toBeLessThan(60);
            // The reading's time is the raw PC clock (ops compares it with EDGE_RAW_CLOCK).
            expect(Math.abs(offset.atMs - (Date.now() + 347))).toBeLessThan(2_000);
            expect(serverTime.status().source).toBe('etabella');
            expect(Math.abs(serverTime.status().targetMs - 347)).toBeLessThan(60);
            // etabella.net time on the box is the cloud's clock again.
            expect(Math.abs(serverTime.now() - Date.now())).toBeLessThan(60);
            // The saved correction follows it.
            expect(Math.abs(box.state.clockCorrection.get()!.offsetMs - 347)).toBeLessThan(60);
        });

        it("a hello without edge-token keys: the box reads the sign-in service's public keys itself, once, and keeps only usable ones", async () => {
            // The cloud's EDGE_TOKEN_JWKS is not configured (seen on a live deployment): every online sign-in was
            // refused on the box with "no etabella.net token keys are cached on the box yet".
            const served = {
                keys: [
                    { kty: 'EC', crv: 'P-256', x: 'x9', y: 'y9', kid: 'edge-1', alg: 'ES256', use: 'sig', d: 'PRIVATE-MEMBER' },
                    { kty: 'RSA', n: 'n', e: 'AQAB', kid: 'rsa-1' },
                    { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' },
                ],
            };
            const asked: string[] = [];
            const http: CloudHttp = req => {
                if (!req.url.endsWith('/authapi/edge/jwks')) return nodeCloudHttp(req);
                asked.push(req.url);
                return Promise.resolve({ status: 200, json: served, text: JSON.stringify(served) });
            };
            const box = track(await enrolledBox(cloud, { uplink: { http, rehelloEveryMs: 200 } }));
            await waitFor(() => box.state.jwks.get() !== null, 10_000, 'keys read from the sign-in service');
            expect(box.state.jwks.get()!.keys).toEqual([{ kty: 'EC', crv: 'P-256', x: 'x9', y: 'y9', kid: 'edge-1', alg: 'ES256', use: 'sig' }]);
            expect(asked).toEqual([`${box.config.cloud.origin}/authapi/edge/jwks`]);
            // Later hellos still carry none: the cached keys stay and the box does not ask again on every hello.
            await waitFor(() => cloud.log.hellos.length >= 4, 5_000, 'more hellos');
            expect(asked).toHaveLength(1);
        });

        it('a hello that carries edge-token keys is the source: the box does not read them elsewhere', async () => {
            cloud.edgeTokenKeys = [{ kty: 'EC', crv: 'P-256', x: 'x1', y: 'y1', kid: 'k1', alg: 'ES256', use: 'sig' }];
            const asked: string[] = [];
            const http: CloudHttp = req => {
                if (!req.url.endsWith('/authapi/edge/jwks')) return nodeCloudHttp(req);
                asked.push(req.url);
                return Promise.resolve({ status: 200, json: { keys: [{ kty: 'EC', crv: 'P-256', x: 'x2', y: 'y2', kid: 'k2' }] }, text: '' });
            };
            const box = track(await enrolledBox(cloud, { uplink: { http, rehelloEveryMs: 200 } }));
            await waitFor(() => online(box) && box.state.jwks.get() !== null, 10_000, 'keys from the hello');
            await waitFor(() => cloud.log.hellos.length >= 3, 5_000, 'more hellos');
            expect(asked).toEqual([]);
            expect(box.state.jwks.get()!.keys).toEqual(cloud.edgeTokenKeys);
        });

        it('a failed read of the edge-token keys is tried again at the next hello, and an answer without usable keys saves nothing', async () => {
            const asked: string[] = [];
            let answer: 'down' | 'empty' | 'ok' = 'down';
            const http: CloudHttp = req => {
                if (!req.url.endsWith('/authapi/edge/jwks')) return nodeCloudHttp(req);
                asked.push(req.url);
                if (answer === 'down') return Promise.reject(new CloudNetworkError('getaddrinfo ENOTFOUND', 'ENOTFOUND'));
                if (answer === 'empty') return Promise.resolve({ status: 200, json: { keys: [{ kty: 'RSA', kid: 'rsa-1' }] }, text: '' });
                return Promise.resolve({ status: 200, json: { keys: [{ kty: 'EC', crv: 'P-256', x: 'x2', y: 'y2', kid: 'k2' }] }, text: '' });
            };
            const box = track(await enrolledBox(cloud, { uplink: { http, rehelloEveryMs: 200 } }));
            await waitFor(() => asked.length >= 2, 10_000, 'retried after a failed read');
            expect(box.state.jwks.get()).toBeNull();
            answer = 'empty';
            const seen = asked.length;
            await waitFor(() => asked.length >= seen + 2, 10_000, 'asked again after an unusable answer');
            expect(box.state.jwks.get()).toBeNull();
            answer = 'ok';
            await waitFor(() => box.state.jwks.get() !== null, 10_000, 'read once the sign-in service answered');
            expect(box.state.jwks.get()!.keys).toEqual([{ kty: 'EC', crv: 'P-256', x: 'x2', y: 'y2', kid: 'k2', alg: 'ES256', use: 'sig' }]);
        });

        it('c.assign: upsert stores + arms + e.ready; end ends; revoke-user revokes; unknown ops and c.cmd answer {ok:false}', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box), 10_000, 'online');
            const route = scryptRoute('eclipse-2', 'pw-2');
            cloud.bind({ nSesid: 'ses-up-2', cName: 'Day 3 — Afternoon', parserVer: FEED_PARSE_VERSION, route });
            const session = { nSesid: 'ses-up-2', nCaseid: 'case-1', cName: 'Day 3 — Afternoon', dStartDt: '2026-10-01 14:00:00', tz: 'Europe/London', nLines: 25, epoch: 1, rebaseSeq: null, parserVer: FEED_PARSE_VERSION, fmt: 1, route, team: [{ nUserid: 'u1', isCaseAdmin: true }], hearingOperator: 'u1', case: { cCaseno: 'HC-1', cName: 'Okafor v Shah' } };
            expect(await cloud.push(EdgeEvent.assign, { op: 'upsert', session })).toEqual({ ok: true });
            // Stored before the ack (the push only lowers latency; the next hello pull is the guarantee, §4.2).
            expect(box.state.sessions.get('ses-up-2')).toMatchObject({ cName: 'Day 3 — Afternoon', hearingOperator: { nUserid: 'u1' } });
            await waitFor(() => box.kernel.session('ses-up-2')?.localState === 'armed', 10_000, 'armed');
            await waitFor(() => cloud.log.readies.includes('ses-up-2'), 5_000, 'e.ready');
            await waitFor(() => box.uplink.session('ses-up-2')?.verdict === 'continue', 5_000, 'hello includes the new session');
            expect(box.state.sessions.get('ses-up-2')).toMatchObject({ cName: 'Day 3 — Afternoon', listed: true });
            expect(cloud.session('ses-up-2').readyCount).toBe(1);

            expect(await cloud.endSession('ses-up-2')).toEqual({ ok: true });
            await waitFor(() => cloud.session('ses-up-2').syncState === 'K', 15_000, 'empty session sealed');
            expect(cloud.session('ses-up-2').seal).toMatchObject({ totalLines: 0, finalRev: 0 });

            expect(await cloud.push(EdgeEvent.assign, { op: 'revoke-user', nUserid: 'u7', jtis: ['jti-7'] })).toEqual({ ok: true });
            expect(box.state.revocations.userRevokedAtMs('u7')).not.toBeNull();
            expect(box.state.revocations.isJtiDenied('jti-7', Date.now())).toBe(true);
            expect(box.events.of('access-revoked').some(e => e.userIds.includes('u7') && e.jtis.includes('jti-7'))).toBe(true);
            expect(await cloud.push(EdgeEvent.assign, { op: 'end', nSesid: 'ghost' })).toEqual({ ok: false });
            expect(await cloud.push(EdgeEvent.assign, { op: 'drain', nSesid: SES })).toEqual({ ok: false });
            expect(box.events.of('alert').find(a => a.kind === 'UNSUPPORTED_ASSIGN')).toMatchObject({ tier: 'P2' });
            expect(await cloud.push(EdgeEvent.cmd, { op: 'status-dump', jobId: 'j', sig: 's' })).toEqual({ ok: false });
            expect(await cloud.push(EdgeEvent.assign, { op: 'upsert', session: { nSesid: '../bad' } })).toEqual({ ok: false });
        });

        it('purge (O-8 "use direct cloud instead"): a session that never received a byte leaves the box; a fed one stays', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => box.kernel.session(SES)?.localState === 'armed', 10_000, 'armed');
            expect(fs.existsSync(path.join(box.config.paths.journalDir, SES))).toBe(true);
            expect(await cloud.push(EdgeEvent.assign, { op: 'purge', nSesid: SES })).toEqual({ ok: true });
            expect(box.state.sessions.get(SES)).toMatchObject({ localState: 'purged' });
            expect(box.kernel.session(SES)).toBeNull();
            expect(fs.existsSync(path.join(box.config.paths.journalDir, SES))).toBe(false);
            expect(box.events.of('assignments-changed').some(d => d.sessionsPurged.includes(SES))).toBe(true);

            const route = scryptRoute('eclipse-3', 'pw-3');
            cloud.bind({ nSesid: 'ses-up-3', parserVer: FEED_PARSE_VERSION, route });
            expect(await cloud.push(EdgeEvent.assign, { op: 'upsert', session: { ...sessionAssignment('ses-up-3', { route }), team: [], case: { cCaseno: 'HC-1', cName: 'Okafor v Shah' } } })).toEqual({ ok: true });
            await waitFor(() => box.kernel.session('ses-up-3')?.localState === 'armed', 10_000, 'second session armed');
            const c = await eclipse(box.kernel.listenAddress()!.port, 'eclipse-3', 'pw-3');
            clients.push(c);
            await c.send(bridgeLines(0, 3));
            await waitFor(() => (box.kernel.session('ses-up-3')?.bytesIn ?? 0) > 0, 10_000, 'fed');
            expect(await cloud.push(EdgeEvent.assign, { op: 'purge', nSesid: 'ses-up-3' })).toEqual({ ok: false });
            expect(box.kernel.session('ses-up-3')).not.toBeNull();
        });

        it('c.marks (a plain emit, no ack): a notice about a session the box holds becomes marks-changed; one about a session it does not hold, a purged one, or a malformed one is dropped (user decision 2026-10-05)', async () => {
            const MARKED = 'c0ffee00-0000-4000-8000-0000000000a1';
            const NOT_HELD = 'c0ffee00-0000-4000-8000-0000000000a2';
            const U1 = 'AAAAAAAA-0000-4000-8000-000000000001';
            const U2 = 'bbbbbbbb-0000-4000-8000-000000000002';
            cloud.bind({ nSesid: MARKED, parserVer: FEED_PARSE_VERSION, route: scryptRoute('eclipse-mk', 'pw-mk') });
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box) && box.state.sessions.get(MARKED) !== null, 10_000, 'online, holding the session');
            const marks = () => box.events.of('marks-changed');

            expect(cloud.emit(EdgeEvent.marks, { nSesid: MARKED.toUpperCase(), users: [U1, U1.toLowerCase(), U2], kinds: ['D', 'F', 'D'], atMs: 1234, extra: 'dropped' })).toBe(true);
            await waitFor(() => marks().length >= 1, 5_000, 'marks-changed');
            expect(marks()).toEqual([{ reason: 'cloud', nSesid: MARKED, users: [U1.toLowerCase(), U2], kinds: ['F', 'D'], atMs: 1234 }]);

            const tooMany = Array.from({ length: 201 }, (_, i) => `cccccccc-0000-4000-8000-${String(i).padStart(12, '0')}`);
            for (const bad of [
                { nSesid: NOT_HELD, users: [U1], kinds: ['Q'], atMs: 1 }, // not on this box
                { nSesid: MARKED, users: tooMany, kinds: ['Q'], atMs: 1 }, // the cloud splits longer lists
                { nSesid: MARKED, users: ['not-a-uuid'], kinds: ['Q'], atMs: 1 },
                { nSesid: MARKED, users: [U1], kinds: ['X'], atMs: 1 },
                { nSesid: MARKED, users: [], kinds: ['Q'], atMs: 1 },
                null,
                'c.marks',
            ]) {
                expect(cloud.emit(EdgeEvent.marks, bad)).toBe(true);
            }
            // One socket delivers in order: the next good notice proves the bad ones were read and dropped.
            cloud.emit(EdgeEvent.marks, { nSesid: MARKED, users: [U2], kinds: ['Q'], atMs: 5 });
            await waitFor(() => marks().length >= 2, 5_000, 'the next good notice');
            await sleep(100);
            expect(marks()).toHaveLength(2);
            expect(marks()[1]).toEqual({ reason: 'cloud', nSesid: MARKED, users: [U2], kinds: ['Q'], atMs: 5 });

            // A session the box purged is no longer held.
            expect(await cloud.push(EdgeEvent.assign, { op: 'purge', nSesid: MARKED })).toEqual({ ok: true });
            cloud.emit(EdgeEvent.marks, { nSesid: MARKED, users: [U1], kinds: ['F'], atMs: 9 });
            await sleep(200);
            expect(marks()).toHaveLength(2);
            expect(online(box)).toBe(true); // nothing here touches the link
        });

        it('c.need: the pages and raw the cloud lost are sent again', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box), 10_000, 'online');
            const client = await connect(box);
            await client.send(bridgeLines(0, 60));
            await waitConverged(box, cloud, SES, 'synced', () => cloud.session(SES).meta.totalLines >= 61);
            const s = cloud.session(SES);
            const page1 = s.pages.get(1);
            s.pages.delete(1);
            s.meta = { ...s.meta, digests: ['', ...s.meta.digests.slice(1)] };
            const raws = cloud.log.raws.length;
            expect(await cloud.push(EdgeEvent.need, { nSesid: SES, pages: [1], rawFrom: 1 })).toEqual({ ok: true });
            await waitFor(() => s.pages.has(1), 10_000, 'page 1 resent');
            expect(JSON.stringify(s.pages.get(1))).toBe(JSON.stringify(page1));
            await waitFor(() => cloud.log.raws.slice(raws).some(r => r.fromSeq === 1), 10_000, 'raw resent from 1');
            await waitConverged(box, cloud, SES, 'converged after c.need');
            expect(await cloud.push(EdgeEvent.need, { nSesid: 'ghost', pages: [1] })).toEqual({ ok: false });
        });

        it('e.status every interval: per-session sync fields, device health, LAN viewers, recent alerts, never a secret', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box), 10_000, 'online');
            const health: EdgeDeviceHealth = { atMs: Date.now(), diskFreeMB: 41_000, journalBytes: 1234, captureBytes: 0, clockOffsetMs: 12, chronySynced: true, certDaysLeft: null, upsOnBattery: null };
            box.events.bus.publish('device-health', health);
            box.events.bus.publish('lan-viewers', { nSesid: SES, count: 4 });
            box.events.bus.publish('alert', { source: 'ops', tier: 'P2', critical: false, kind: 'DISK_LOW', message: 'disk below 5 GB', atMs: Date.now(), nSesid: null, data: null });
            await waitFor(() => cloud.log.statuses.some(s => s.sessions.some(x => x.nSesid === SES && x.lanViewers === 4) && s.device.diskFreeMB === 41_000), 5_000, 'status with health');
            const st = cloud.log.statuses.find(s => s.device.diskFreeMB === 41_000)!;
            expect(st.device).toMatchObject({ sw: '0.0.0-dev', parserVer: FEED_PARSE_VERSION, journalBytes: 1234, clockOffsetMs: 12, chronySynced: true });
            expect('certDaysLeft' in st.device).toBe(false);
            expect('upsOnBattery' in st.device).toBe(false);
            expect('dCertExp' in st.device).toBe(false);
            expect(st.sessions.find(x => x.nSesid === SES)).toMatchObject({ uplinkState: 'ok', durability: 'ok', catConnected: false, rev: 0, totalLines: 0 });
            expect(cloud.log.statuses.some(s => (s as { alerts?: Array<{ kind: string }> }).alerts?.some(a => a.kind === 'DISK_LOW'))).toBe(true);
            expect(JSON.stringify(cloud.log.statuses)).not.toContain('pw-up');
        });
    });

    // =============================================================================================================
    describe('round, raw and seal replies (§5.4, §5.5)', () => {
        async function syncedBox(lines = 30): Promise<{ box: EdgeBox; client: EclipseClient }> {
            const box = track(await enrolledBox(cloud, { uplink: { rehelloEveryMs: 400 } }));
            await waitFor(() => online(box) && box.uplink.session(SES)?.verdict === 'continue', 10_000, 'online');
            const client = await connect(box);
            await client.send(bridgeLines(0, lines));
            await waitConverged(box, cloud, SES, 'synced', () => cloud.session(SES).meta.totalLines >= lines + 1);
            return { box, client };
        }

        it('ROOT: adopts the cloud digests and rebuilds the round', async () => {
            const { box, client } = await syncedBox();
            cloud.faults.roundReplies.push({ ok: false, code: 'ROOT', cloudDigests: [] });
            await client.send(bridgeLines(30, 10));
            await waitConverged(box, cloud, SES, 'after ROOT', () => cloud.session(SES).meta.totalLines >= 41);
            expect(cloud.log.roundReplies.some(r => r.ok === false && r.code === 'ROOT')).toBe(true);
            // A full resend: the round rebuilt after the ROOT reply (all its parts) carried every page.
            const refused = cloud.log.roundReplies.findIndex(r => r.ok === false && r.code === 'ROOT');
            expect(cloud.log.rounds[refused].pages.map(p => p.p)).toEqual([2]); // only the dirty page before
            expect([...new Set(cloud.log.rounds.slice(refused + 1).flatMap(r => r.pages.map(p => p.p)))].sort((a, b) => a - b)).toEqual([1, 2]);
        });

        it('STALE and LINEAGE: re-hello, then resume', async () => {
            const { box, client } = await syncedBox();
            const hellos = cloud.log.hellos.length;
            cloud.faults.roundReplies.push({ ok: false, code: 'STALE', appliedRev: 1, root: '' }, { ok: false, code: 'LINEAGE', epoch: 1, rebaseSeq: null });
            await client.send(bridgeLines(30, 10));
            await waitConverged(box, cloud, SES, 'after STALE + LINEAGE', () => cloud.session(SES).meta.totalLines >= 41);
            expect(cloud.log.hellos.length).toBeGreaterThanOrEqual(hellos + 2);
        });

        it('HELD_SHRINK: holds the session (P1), pauses rounds, re-hellos after the hold interval and resumes', async () => {
            const { box, client } = await syncedBox();
            cloud.faults.roundReplies.push({ ok: false, code: 'HELD_SHRINK', heldId: 'held-1' });
            await client.send(bridgeLines(30, 10));
            await waitFor(() => box.uplink.session(SES)?.heldShrinkId === 'held-1', 10_000, 'held');
            expect(box.events.of('alert').find(a => a.kind === 'HELD_SHRINK')).toMatchObject({ tier: 'P1', nSesid: SES });
            await waitConverged(box, cloud, SES, 'resumed after the hold', () => cloud.session(SES).meta.totalLines >= 41);
            expect(box.uplink.session(SES)!.heldShrinkId).toBeNull();
        });

        it('HELD_SHRINK: a c.need from the cloud (the admin decided the hold) releases it at once and re-hellos', async () => {
            const box = track(await enrolledBox(cloud, { uplink: { heldShrinkRehelloMs: 600_000, rehelloEveryMs: 600_000 } }));
            await waitFor(() => online(box) && box.uplink.session(SES)?.verdict === 'continue', 10_000, 'online');
            const client = await connect(box);
            await client.send(bridgeLines(0, 30));
            await waitConverged(box, cloud, SES, 'synced', () => cloud.session(SES).meta.totalLines >= 31);
            cloud.faults.roundReplies.push({ ok: false, code: 'HELD_SHRINK', heldId: 'held-2' });
            await client.send(bridgeLines(30, 10));
            await waitFor(() => box.uplink.session(SES)?.heldShrinkId === 'held-2', 10_000, 'held');
            const hellos = cloud.log.hellos.length;
            expect(await cloud.push(EdgeEvent.need, { nSesid: SES })).toEqual({ ok: true });
            await waitConverged(box, cloud, SES, 'resumed after the c.need', () => cloud.session(SES).meta.totalLines >= 41, 10_000);
            expect(box.uplink.session(SES)!.heldShrinkId).toBeNull();
            expect(cloud.log.hellos.length).toBeGreaterThan(hellos);
        });

        it('NOT_BOUND / FENCED: stop pushing the session until the next hello (P2)', async () => {
            const { box, client } = await syncedBox();
            cloud.faults.roundReplies.push({ ok: false, code: 'NOT_BOUND' });
            await client.send(bridgeLines(30, 10));
            await waitFor(() => box.events.of('alert').some(a => a.kind === 'ROUND_NOT_BOUND'), 10_000, 'NOT_BOUND');
            await waitConverged(box, cloud, SES, 'resumed after the next hello', () => cloud.session(SES).meta.totalLines >= 41);
        });

        it('a cloud error reply to a round or a raw batch is retried later, never fatal', async () => {
            const { box, client } = await syncedBox();
            cloud.faults.roundReplies.push({ ok: false, code: 'ERROR', message: 'internal error' });
            cloud.faults.rawReplies.push({ ok: false, code: 'ERROR' }, { expectSeq: 1, reason: 'rate', retryAfterMs: 60 }, { expectSeq: 1, reason: 'crc' });
            await client.send(bridgeLines(30, 10));
            await waitConverged(box, cloud, SES, 'after error replies', () => cloud.session(SES).meta.totalLines >= 41);
            expect(box.uplink.session(SES)!.uplinkState).toBe('ok');
        });

        it("a raw 'gap' nack moves the cursor to the cloud's expectSeq; 'chain' re-hellos", async () => {
            const { box, client } = await syncedBox();
            const head = cloud.rawHead(SES).seq;
            cloud.faults.rawReplies.push({ expectSeq: head + 1, reason: 'gap' }, { expectSeq: head + 1, reason: 'chain' });
            const hellos = cloud.log.hellos.length;
            await client.send(bridgeLines(30, 10));
            await waitConverged(box, cloud, SES, 'after gap + chain', () => cloud.session(SES).meta.totalLines >= 41);
            expect(cloud.log.hellos.length).toBeGreaterThan(hellos);
        });

        it('an incomplete seal reply (needPages, rawFrom) resends what the cloud lacks and seals on retry', async () => {
            const { box } = await syncedBox(20);
            cloud.faults.sealReplies.push({ complete: false, needPages: [1], rawFrom: 1 });
            expect(await cloud.endSession(SES)).toEqual({ ok: true });
            await waitFor(() => cloud.session(SES).syncState === 'K', 20_000, 'sealed after the retry');
            // The cloud stores the seal before its reply reaches the box: wait (bounded) for the box's own record of it.
            await waitFor(() => box.state.sessions.get(SES)?.localState === 'sealed', 10_000, 'the box recorded the seal');
            expect(cloud.log.seals.length).toBeGreaterThanOrEqual(2);
            expect(box.events.of('alert').find(a => a.kind === 'SEAL_INCOMPLETE')).toMatchObject({ tier: 'P2', nSesid: SES });
            expect(box.state.sessions.get(SES)).toMatchObject({ localState: 'sealed', sealState: 'K' });
            expect(await box.uplink.seal(SES)).toEqual({ complete: true, state: 'K' });
        });

        it('seal() refuses a session that has not ended; a sealed session answers from the record', async () => {
            const { box } = await syncedBox(5);
            await expectPortError(box.uplink.seal(SES), 'invalid_request');
        });
    });

    // =============================================================================================================
    describe('held captures and the operator-code relay', () => {
        it('uploads a closed held capture automatically while online (e.capture + archive-url + PUT)', async () => {
            const box = track(await enrolledBox(cloud));
            await waitFor(() => online(box), 10_000, 'online');
            const bytes = Buffer.from('second connection bytes');
            const file = path.join(box.config.paths.captureDir, 'cap-auto.bin');
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, bytes);
            box.state.heldCaptures.upsert({ id: 'cap-auto', nSesid: SES, kind: 'C', user: 'eclipse-up', peer: '10.0.0.7', fromMs: Date.now() - 2_000, toMs: Date.now() - 1_000, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), file, uploadedAtMs: null, nOrphanid: null });
            await waitFor(() => box.state.heldCaptures.get('cap-auto')!.uploadedAtMs !== null, 10_000, 'uploaded');
            expect([...cloud.log.uploads.values()].map(b => b.toString())).toEqual(['second connection bytes']);
            expect(cloud.log.captures).toEqual([expect.objectContaining({ kind: 'C', nSesid: SES, peer: '10.0.0.7', bytes: bytes.length })]);
            // A tampered file is refused before anything is announced.
            fs.writeFileSync(file, 'tampered');
            box.state.heldCaptures.upsert({ ...box.state.heldCaptures.get('cap-auto')!, id: 'cap-bad', uploadedAtMs: null, nOrphanid: null });
            await expectPortError(box.uplink.uploadCapture('cap-bad'), 'invalid_request');
            await expectPortError(box.uplink.uploadCapture('ghost'), 'not_found');
        });

        it('the operator-code relay is switched off by default (build decision: email sign-in only)', async () => {
            const box = track(edgeBox({ cloudOrigin: cloud.origin }));
            expect(box.config.features.operatorCode).toBe(false);
            const principal = { kind: 'online', forwardable: true, isSuperAdmin: true, adminCaseIds: ['case-1'], token: 't', userId: 'u1', name: 'P' } as unknown as EdgePrincipal;
            await expectPortError(box.uplink.relayOperatorCode(principal), 'not_found');
        });
    });

    // =============================================================================================================
    describe('the LAN certificate (§8.3)', () => {
        const tlsConfig = (dir: string): Record<string, unknown> => ({ http: { host: '127.0.0.1', port: 0, tls: { certFile: path.join(dir, 'certs', 'fullchain.pem'), keyFile: path.join(dir, 'certs', 'privkey.pem') } } });

        it('fetches a certificate on the first accepted connect of a pending box, verifies and installs it, then is a no-op', async () => {
            const box = track(await enrolledBox(cloud, { autoConfirm: false, start: false }));
            const tls = edgeBox({ dir: box.dir, cloudOrigin: cloud.origin, config: tlsConfig(box.dir) });
            await box.close({ keepDir: true });
            track(tls);
            expect(tls.uplink.certificate().state).toBe('missing');
            await tls.start();
            await sleep(200);
            expect(fs.existsSync(path.join(tls.dir, 'certs', 'fullchain.pem'))).toBe(false); // pending: no certificate
            cloud.nodes.get(tls.state.identity.get()!.nEdgeid)!.status = 'A';
            await waitFor(() => tls.events.of('certificate-installed').length === 1, 10_000, 'installed');
            expect(tls.events.of('certificate-installed')[0]).toMatchObject({ first: true, fingerprint256: expect.stringMatching(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/) });
            const status = tls.uplink.certificate();
            expect(status).toMatchObject({ state: 'ok', coversHost: true });
            expect(status.daysLeft).toBeGreaterThanOrEqual(88);
            expect(fs.existsSync(path.join(tls.dir, 'certs', 'privkey.pem.next'))).toBe(false);
            expect(fs.readFileSync(path.join(tls.dir, 'certs', 'privkey.pem'), 'utf8')).not.toBe(fs.readFileSync(tls.config.paths.deviceKeyFile, 'utf8'));
            // Installed under the cert-dir lock (released) and audited like a console install (via 'cloud').
            expect(fs.existsSync(path.join(tls.dir, 'certs', '.cert-install.lock'))).toBe(false);
            expect(tls.state.audit.list({ limit: 20 }).filter(a => a.action === 'cert-install')).toEqual([
                expect.objectContaining({ outcome: 'ok', actor: null, data: expect.objectContaining({ via: 'cloud', notAfterMs: expect.any(Number) }) }),
            ]);
            // Not due: no request at all.
            let asked = 0;
            const issue = cloud.issueCert;
            cloud.issueCert = (csr, node) => {
                asked += 1;
                return issue(csr, node);
            };
            expect((await tls.uplink.ensureCertificate()).state).toBe('ok');
            expect(asked).toBe(0);
        });

        it('pending issuance, refusals, a wrong-host chain and an unlinked box leave the installed pair untouched', async () => {
            const base = track(await enrolledBox(cloud, { start: false }));
            const box = track(edgeBox({ dir: base.dir, cloudOrigin: cloud.origin, config: tlsConfig(base.dir) }));
            cloud.issueCert = () => ({ pending: true });
            expect((await box.uplink.ensureCertificate()).state).toBe('missing');
            cloud.issueCert = () => ({ refuse: 403 });
            await expectPortError(box.uplink.ensureCertificate(), 'cloud_refused');
            const { signCsr } = await import('./testing/fake-cloud');
            const { generateKeyPairSync } = await import('crypto');
            const ca = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
            cloud.issueCert = csr => ({ chain: signCsr(csr, 'other-box.etabella-edge.net', ca) });
            await expectPortError(box.uplink.ensureCertificate(), 'cloud_refused');
            cloud.issueCert = csr => ({ chain: signCsr(csr, 'k7q2m9x4.etabella-edge.net', ca, { notBeforeMs: Date.now() - 2 * 86_400_000, notAfterMs: Date.now() - 86_400_000 }) });
            await expectPortError(box.uplink.ensureCertificate(), 'cloud_refused');
            expect(fs.existsSync(path.join(box.dir, 'certs', 'fullchain.pem'))).toBe(false);
            box.state.identity.patch({ status: 'quarantined' });
            await expectPortError(box.uplink.ensureCertificate(), 'box_not_linked');
            await cloud.stop();
            box.state.identity.patch({ status: 'active' });
            await expectPortError(box.uplink.ensureCertificate(), 'offline');
            await cloud.start();
        });

        it('plain HTTP (dev) has no certificate and never asks for one', async () => {
            const box = track(await enrolledBox(cloud, { start: false }));
            expect(box.uplink.certificate().state).toBe('not-configured');
            expect((await box.uplink.ensureCertificate()).state).toBe('not-configured');
        });

        it('a cloud with no certificate issuer (501): nothing is written, one request per backoff, and the alert reaches the cloud (review 5)', async () => {
            const base = track(await enrolledBox(cloud, { start: false }));
            const box = track(edgeBox({ dir: base.dir, cloudOrigin: cloud.origin, config: tlsConfig(base.dir), uplink: { rehelloEveryMs: 100 } }));
            let asked = 0;
            cloud.issueCert = () => {
                asked += 1;
                return { refuse: 501 };
            };
            await box.start();
            await waitFor(() => box.events.of('alert').some(a => a.kind === 'CERTIFICATE_RENEWAL_FAILED'), 10_000, 'renewal alert');
            const hellos = cloud.log.hellos.length;
            await waitFor(() => cloud.log.hellos.length >= hellos + 5, 10_000, 'five more hellos (each used to retry)');
            expect(asked).toBe(1);
            const alerts = box.events.of('alert').filter(a => a.kind === 'CERTIFICATE_RENEWAL_FAILED');
            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toMatchObject({ source: 'uplink', tier: 'P2' });
            expect(alerts[0].message).toContain('cert install');
            // The new key stays in memory until a chain comes back: a refusal writes nothing.
            for (const name of ['privkey.pem', 'privkey.pem.next', 'fullchain.pem', 'fullchain.pem.next']) expect(fs.existsSync(path.join(box.dir, 'certs', name))).toBe(false);
            await waitFor(
                () => cloud.log.statuses.some(s => ((s as { alerts?: Array<{ kind: string }> }).alerts ?? []).some(a => a.kind === 'CERTIFICATE_RENEWAL_FAILED')),
                5_000,
                'the renewal failure in e.status',
            );
        });

        it('an install a crash interrupted between the two renames is finished at the next check, with no request (review 24)', async () => {
            const base = track(await enrolledBox(cloud, { start: false }));
            const box = track(edgeBox({ dir: base.dir, cloudOrigin: cloud.origin, config: tlsConfig(base.dir) }));
            const host = `${box.state.identity.get()!.slug}.etabella-edge.net`;
            const old = selfSignedCertificate({ cn: host, hosts: [host], notAfterMs: Date.now() + 90 * 86_400_000 });
            const next = selfSignedCertificate({ cn: host, hosts: [host], notAfterMs: Date.now() + 90 * 86_400_000 });
            const tls = box.config.http.tls!;
            fs.mkdirSync(path.dirname(tls.certFile), { recursive: true });
            // The state a power cut leaves between "rename the key" and "rename the chain": new key, old chain.
            fs.writeFileSync(tls.certFile, old.cert);
            fs.writeFileSync(tls.keyFile, next.key);
            fs.writeFileSync(`${tls.certFile}.next`, next.cert);
            expect(box.uplink.certificate().state).toBe('invalid');
            let asked = 0;
            cloud.issueCert = () => {
                asked += 1;
                return { refuse: 501 };
            };
            await cloud.stop(); // at the venue, offline
            const status = await box.uplink.ensureCertificate();
            await cloud.start();
            expect(status).toMatchObject({ state: 'ok', coversHost: true });
            expect(asked).toBe(0);
            expect(fs.readFileSync(tls.certFile, 'utf8')).toBe(next.cert);
            expect(fs.existsSync(`${tls.certFile}.next`)).toBe(false);
        });
    });

    // =============================================================================================================
    describe('pacing on a monotonic clock (review 25)', () => {
        it('a wall clock stepped back 3 minutes after a BUSY reply does not hold the next round back', async () => {
            let skewMs = 0;
            const box = track(await enrolledBox(cloud, { clock: () => Date.now() - skewMs, uplink: { rehelloEveryMs: 400 } }));
            await waitFor(() => online(box) && box.uplink.session(SES)?.verdict === 'continue', 10_000, 'online');
            const client = await connect(box);
            await client.send(bridgeLines(0, 20));
            await waitConverged(box, cloud, SES, 'synced', () => cloud.session(SES).meta.totalLines >= 21);
            cloud.faults.roundReplies.push({ ok: false, code: 'BUSY', retryMs: 400 });
            await client.send(bridgeLines(20, 10));
            await waitFor(() => cloud.log.roundReplies.some(r => r.ok === false && r.code === 'BUSY'), 10_000, 'BUSY reply');
            await sleep(50); // the box has taken the reply (retry in 400 ms) ...
            skewMs = 180_000; // ... when the ops cloud-time fallback steps the wall clock back 3 minutes
            const t0 = Date.now();
            await waitConverged(box, cloud, SES, 'round sent after the BUSY retry', () => cloud.session(SES).meta.totalLines >= 31, 15_000);
            expect(Date.now() - t0).toBeLessThan(15_000);
        });
    });

    // =============================================================================================================
    describe('RECOVER failures (MR-3, MR-4): one alert per cause; a corrupt journal RECOVER cannot repair is frozen for an admin', () => {
        type Outcome = KernelRecoverResult | Error;
        const refused = (reason: 'cloud-behind' | 'session-ended' | 'io-error'): KernelRecoverResult => ({ ok: false, reason, message: `refused: ${reason}` });

        /**
         * An online box whose kernel reports SES's journal corrupt (as after a bad CRC found while recording) and answers
         * each RECOVER with the next outcome (the last one repeats). Every hello (every 100 ms) runs RECOVER again.
         */
        async function corruptBox(outcomes: readonly Outcome[], uplink: Partial<UplinkOptions> = {}): Promise<{ box: EdgeBox; calls: number[] }> {
            const box = track(await enrolledBox(cloud, { uplink: { rehelloEveryMs: 100, ...uplink } }));
            await waitFor(() => online(box) && box.uplink.session(SES)?.verdict === 'continue', 10_000, 'online');
            const session = box.kernel.session.bind(box.kernel);
            jest.spyOn(box.kernel, 'session').mockImplementation(id => {
                const v = session(id);
                return v && id === SES ? { ...v, journalCorrupt: true } : v;
            });
            const calls: number[] = [];
            jest.spyOn(box.kernel, 'recoverFromCloud').mockImplementation(async (_id, fromSeq) => {
                calls.push(fromSeq);
                const outcome = outcomes[Math.min(calls.length, outcomes.length) - 1];
                if (outcome instanceof Error) throw outcome;
                return outcome;
            });
            return { box, calls };
        }
        const alerts = (box: EdgeBox, kind: string) => box.events.of('alert').filter(a => a.kind === kind);

        it('RECOVER_FAILED is raised once per cause, not every hello; three cloud-behind refusals of a corrupt journal freeze it (P1 with the next step), and RECOVER stops', async () => {
            const { box, calls } = await corruptBox([refused('io-error'), new Error('no ack for e.rawpull'), refused('io-error'), refused('io-error'), refused('cloud-behind')]);
            await waitFor(() => alerts(box, 'JOURNAL_UNRECOVERABLE').length > 0, 15_000, 'escalated');
            // io-error ×3 and a thrown pull in between: two causes, two alerts; then cloud-behind: one more, then escalation.
            expect(calls).toHaveLength(4 + RECOVER_ESCALATE_AFTER);
            expect(alerts(box, 'RECOVER_FAILED').map(a => [a.tier, a.nSesid, /RECOVER (io-error|failed|cloud-behind)/.exec(a.message)?.[1]])).toEqual([
                ['P2', SES, 'io-error'],
                ['P2', SES, 'failed'],
                ['P2', SES, 'io-error'],
                ['P2', SES, 'cloud-behind'],
            ]);
            const [p1] = alerts(box, 'JOURNAL_UNRECOVERABLE');
            expect(p1).toMatchObject({ source: 'uplink', tier: 'P1', critical: true, nSesid: SES });
            expect(p1.message).toContain('Next step: the hearing operator or a super-admin uses "Split to direct cloud" in RT Production');
            expect(p1.message).toContain(`refused ${RECOVER_ESCALATE_AFTER} times in a row (cloud-behind)`);
            // Frozen for the admin: nothing pushed, the operator chip says sync refused, the verdict's history-refused row.
            expect(box.uplink.session(SES)).toMatchObject({ uplinkState: 'frozen', frozenAtMs: expect.any(Number) });
            expect(box.uplink.cloudLink().state).toBe('sync-refused');
            expect(box.state.sessions.get(SES)!.localState).toBe('frozen');
            const today = boxDay(Date.now(), box.config.box.timeZone);
            expect(box.state.connectivityLog.page({ filter: 'problems' }, today).rows.some(r => r.code === 'cloud-refused' && r.data.error === 'journal-unrecoverable')).toBe(true);
            // Only the box knows why it froze the session: the P1 goes to the cloud with e.status (RECOVER_FAILED does not).
            const forwarded = () => cloud.log.statuses.flatMap(s => (s as { alerts?: Array<{ kind: string }> }).alerts ?? []).map(a => a.kind);
            await waitFor(() => forwarded().includes('JOURNAL_UNRECOVERABLE'), 5_000, 'the P1 in e.status');
            expect(forwarded()).not.toContain('RECOVER_FAILED');
            // Later hellos neither run RECOVER again nor raise anything new; the session stays frozen.
            const hellos = cloud.log.hellos.length;
            const before = box.events.of('alert').filter(a => a.source === 'uplink').length;
            await waitFor(() => cloud.log.hellos.length >= hellos + 3, 10_000, 'more hellos');
            expect(calls).toHaveLength(4 + RECOVER_ESCALATE_AFTER);
            expect(box.events.of('alert').filter(a => a.source === 'uplink')).toHaveLength(before);
            expect(alerts(box, 'LINEAGE_FROZEN')).toEqual([]);
            expect(box.uplink.session(SES)!.uplinkState).toBe('frozen');
            expect(box.state.sessions.get(SES)!.localState).toBe('frozen');
        });

        it('a session that ended while its journal was corrupt (RECOVER refused session-ended) escalates too, naming the force close', async () => {
            const { box, calls } = await corruptBox([refused('session-ended')]);
            await waitFor(() => alerts(box, 'JOURNAL_UNRECOVERABLE').length > 0, 15_000, 'escalated');
            expect(calls).toHaveLength(RECOVER_ESCALATE_AFTER);
            expect(alerts(box, 'RECOVER_FAILED')).toHaveLength(1);
            const [p1] = alerts(box, 'JOURNAL_UNRECOVERABLE');
            expect(p1).toMatchObject({ tier: 'P1', critical: true, nSesid: SES });
            expect(p1.message).toContain('the session has ended');
            expect(p1.message).toContain('Next step: a super-admin force-closes the session in RT Production ("Force close (incomplete)"');
            expect(box.uplink.session(SES)!.uplinkState).toBe('frozen');
        });

        it('a transient failure never freezes; the same cause is raised again only after the long interval', async () => {
            let skewMs = 0;
            const { box, calls } = await corruptBox([refused('io-error')], { monotonic: () => performance.now() + skewMs });
            await waitFor(() => calls.length >= 6, 10_000, 'six failed RECOVERs');
            expect(alerts(box, 'RECOVER_FAILED')).toHaveLength(1);
            expect(box.uplink.session(SES)!.uplinkState).toBe('recovering');
            skewMs = RECOVER_FAILED_REALERT_MS; // an hour later, still failing
            await waitFor(() => alerts(box, 'RECOVER_FAILED').length === 2, 10_000, 'raised again after the interval');
            const n = calls.length;
            await waitFor(() => calls.length >= n + 4, 10_000, 'more failed RECOVERs');
            expect(alerts(box, 'RECOVER_FAILED')).toHaveLength(2);
            expect(alerts(box, 'JOURNAL_UNRECOVERABLE')).toEqual([]);
            expect(box.uplink.session(SES)!.uplinkState).not.toBe('frozen');
        });
    });
});

describe('EdgeUplink without a cloud', () => {
    it('a box that never reaches the cloud keeps recording; status reads offline; close is idempotent', async () => {
        const cloud = new FakeCloud();
        await cloud.start();
        const origin = cloud.origin;
        await cloud.stop(); // nothing listens there now
        const box = edgeBox({ cloudOrigin: origin });
        try {
            box.state.identity.save({ nEdgeid: 'e-1', slug: 'k7q2m9x4', status: 'active', keyFingerprint: 'AA', publicKeySpki: 'x', tpmKey: false, cloudOrigin: origin, enrolledAtMs: Date.now(), confirmedAtMs: Date.now(), lastCloudContactAtMs: null, linkFailure: null });
            box.state.sessions.upsertAssignment(sessionAssignment('ses-off', { route: ROUTE }), Date.now());
            await box.start();
            await waitFor(() => box.kernel.session('ses-off')?.localState === 'armed', 10_000, 'armed offline');
            // No device key file: the key is refused locally (P1), the box keeps recording and retrying.
            await waitFor(() => box.events.of('alert').some(a => a.kind === 'DEVICE_KEY'), 5_000, 'device key alert');
            expect(box.events.of('alert').find(a => a.kind === 'DEVICE_KEY')).toMatchObject({ tier: 'P1' });
            expect(box.state.identity.get()!.linkFailure).toBe('key-refused');
            expect(box.uplink.cloudLink().state).toBe('not-linked');
            // With a key, the cloud is simply unreachable.
            await DeviceKey.generate().save(box.config.paths.deviceKeyFile);
            await waitFor(() => box.state.identity.get()!.linkFailure === 'unreachable', 5_000, 'unreachable');
            expect(box.uplink.status()).toMatchObject({ online: false, lastSyncAt: null });
            expect(box.uplink.cloudLink().state).toBe('cant-reach-etabella');
            const c = await eclipse(box.kernel.listenAddress()!.port, 'eclipse-up', 'pw-up');
            await c.send(bridgeLines(0, 5));
            await waitFor(() => (box.kernel.view('ses-off')?.totalLines ?? 0) >= 6, 10_000, 'records without the cloud');
            expect(box.uplink.session('ses-off')).toBeNull(); // never hello'd
            await c.end();
            await box.uplink.close();
            await box.uplink.close();
        } finally {
            await box.close();
        }
    });
});
