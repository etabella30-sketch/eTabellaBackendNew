/**
 * The seam between the verdict and the cloud link for "held captures not uploaded" (critic item 10, user decision
 * 2026-10-04): OpsService reads `CloudLinkStatus.heldCapturesPending` and `.lastUploadError` exactly as the REAL
 * EdgeUplink sends them. OpsService over the real uplink, kernel and node:sqlite state of an enrolled box, against the
 * in-process FakeCloud refusing the archive URL with etabella.net's 503 NOT_CONFIGURED; auth, host and timers stay
 * fakes. The verdict reads the link defensively (an older uplink sends neither field), so a renamed field would only
 * read "nothing waits": the typed literals below make such a rename fail to compile instead.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { Logger } from '@nestjs/common';
import { FEED_PARSE_VERSION } from '@app/feed-parse';

import type { CloudLinkStatus, CloudUploadError, VerdictDetailMap, VerdictProblem } from '../contracts';
import { scryptRoute, waitFor } from '../kernel/testing/kernel-harness';
import { EdgeBox, edgeBox, enrolledBox } from '../uplink/testing/edge-box';
import { FakeCloud } from '../uplink/testing/fake-cloud';
import { DEFAULT_OPS_TUNING } from './ops.constants';
import { OpsService } from './ops.service';
import { FakeAuth, FakeBoot, FakeOpsHost, ManualTimers } from './testing/ops-fakes';
import { heldCapturesOf } from './verdict';

jest.setTimeout(60_000);

const SES = 'ses-held-seam';
const ROUTE = scryptRoute('eclipse-held', 'pw-held');

beforeAll(() => Logger.overrideLogger(false));
afterAll(() => Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']));

describe('verdict ↔ cloud link: held captures not uploaded (item 10)', () => {
    it('the cloud link fields and the problem detail are one shape (a rename on either side fails to compile)', () => {
        const lastUploadError: CloudUploadError = { atMs: 1_000, status: 503, code: 'NOT_CONFIGURED' };
        // Excess-property checks: this literal stops compiling if the uplink side renames either field.
        const link: CloudLinkStatus = { state: 'synced', sinceMs: null, lagSec: 0, lagLines: 0, pendingPages: 0, lastSyncedAtMs: null, heldCapturesPending: 1, lastUploadError };
        // The uplink's error is the problem's `lastError`, and back.
        const detail: VerdictDetailMap['captures-not-uploaded'] = { pending: link.heldCapturesPending ?? 0, lastError: lastUploadError };
        const back: CloudUploadError = detail.lastError;
        expect(heldCapturesOf(link)).toEqual({ pending: 1, lastError: back });
    });

    describe('over the real uplink', () => {
        let cloud: FakeCloud;
        let box: EdgeBox | null = null;
        let ops: OpsService | null = null;

        beforeEach(async () => {
            cloud = new FakeCloud({ maxPart: 4_000 });
            await cloud.start();
            cloud.bind({ nSesid: SES, parserVer: FEED_PARSE_VERSION, route: ROUTE, team: [{ nUserid: 'u1', name: 'Priya Shah', isCaseAdmin: true }] });
        });

        afterEach(async () => {
            await ops?.close().catch(() => undefined);
            await box?.close().catch(() => undefined);
            ops = null;
            box = null;
            await cloud.stop();
        });

        /** A closed second-connection capture the box keeps until it is uploaded (orphan 'C', spec §3.2). */
        function holdCapture(b: EdgeBox, id: string): void {
            const bytes = Buffer.from(`second connection bytes ${id}`);
            const file = path.join(b.config.paths.captureDir, `${id}.bin`);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, bytes);
            const sha256 = createHash('sha256').update(bytes).digest('hex');
            b.state.heldCaptures.upsert({ id, nSesid: SES, kind: 'C', user: 'eclipse-held', peer: '10.0.0.7', fromMs: Date.now() - 2_000, toMs: Date.now() - 1_000, bytes: bytes.length, sha256, file, uploadedAtMs: null, nOrphanid: null });
        }

        const held = (o: OpsService): VerdictProblem | undefined => o.verdict().problems.find(p => p.kind === 'captures-not-uploaded');

        it('no archive on etabella.net (503 NOT_CONFIGURED): nothing listed; a failed upload is listed with the link’s own error; gone once uploaded', async () => {
            cloud.faults.archiveUrlRefusal = { status: 503, body: { msg: -1, message: 'No archive is configured for venue uploads', cCode: 'NOT_CONFIGURED' } };
            const b = (box = await enrolledBox(cloud, { uplink: { captureRetryMs: 600_000, captureNotConfiguredRetryMs: [600_000, 600_000] } }));
            await waitFor(() => b.uplink.status().online, 10_000, 'online');
            const o = (ops = new OpsService(b.config, () => Date.now(), b.events.bus, new FakeBoot(), b.state, b.kernel, b.uplink, new FakeAuth().asPort(), new FakeOpsHost(), new ManualTimers(), DEFAULT_OPS_TUNING));
            expect(held(o)).toBeUndefined();

            holdCapture(b, 'cap-seam');
            await waitFor(() => b.uplink.cloudLink().lastUploadError?.code === 'NOT_CONFIGURED', 10_000, 'refused once');
            // The capture stays on the box and the link says why, but the Status page shows no problem (user 2026-10-05).
            expect(b.uplink.cloudLink()).toMatchObject({ heldCapturesPending: 1 });
            expect(held(o)).toBeUndefined();

            // Any other failure is a problem to show.
            cloud.faults.archiveUrlRefusal = { status: 500, body: { msg: -1, message: 'internal error', cCode: 'ERROR' } };
            await b.uplink.syncNow();
            await waitFor(() => b.uplink.cloudLink().lastUploadError?.code === 'ERROR', 10_000, 'refused with another error');
            const link = b.uplink.cloudLink();
            const p = held(o);
            expect(p).toMatchObject({ severity: 'warn', nSesid: null, detail: { pending: 1, lastError: { status: 500, code: 'ERROR' } }, hints: ['contact-support'] });
            expect((p!.detail as VerdictDetailMap['captures-not-uploaded']).lastError).toEqual(link.lastUploadError);

            // An archive is set up on etabella.net; "Run checks again" uploads it at once and the problem is gone.
            cloud.faults.archiveUrlRefusal = null;
            await b.uplink.syncNow();
            await waitFor(() => b.state.heldCaptures.get('cap-seam')!.uploadedAtMs !== null, 5_000, 'uploaded');
            expect(b.uplink.cloudLink()).toMatchObject({ heldCapturesPending: 0, lastUploadError: null });
            expect(held(o)).toBeUndefined();
        });

        it("etabella.net goes away: \"Can't reach eTabella\" with the uplink's since, never \"Box not linked\" (review 2026-10-04)", async () => {
            const b = (box = await enrolledBox(cloud));
            await waitFor(() => b.uplink.status().online, 10_000, 'online');
            // Ops' wall clock runs ahead so the 15 s hysteresis has passed without waiting for it.
            const ahead = { ms: 0 };
            const o = (ops = new OpsService(b.config, () => Date.now() + ahead.ms, b.events.bus, new FakeBoot(), b.state, b.kernel, b.uplink, new FakeAuth().asPort(), new FakeOpsHost(), new ManualTimers(), DEFAULT_OPS_TUNING));
            expect(o.verdict().problems).toEqual([]);

            await cloud.stop();
            // The first failed reconnect records `unreachable` on the identity (what used to read "Box not linked").
            await waitFor(() => b.state.identity.get()?.linkFailure === 'unreachable', 15_000, 'link failure unreachable');
            const link = b.uplink.cloudLink();
            expect(link.state).toBe('cant-reach-etabella');
            ahead.ms = 20_000;
            const v = o.verdict();
            expect(v.problems.map(p => p.kind)).toEqual(['cant-reach-etabella']);
            expect(v.problems[0].sinceMs).toBe(link.sinceMs);
        });

        it("an uplink that never ticks (its start threw) still lists \"Can't reach eTabella\" 15 s after ops first saw it (review 2026-10-04)", async () => {
            // A box that linked before.
            const linked = await enrolledBox(cloud);
            await waitFor(() => linked.uplink.status().online, 10_000, 'online');
            await linked.close({ keepDir: true });
            // It boots again and the uplink's start throws before its timers are armed: it never connects, never ticks
            // and never publishes a cloud state. Ops and the uplink share one wall clock, which the spec moves.
            const ahead = { ms: 0 };
            const clock = () => Date.now() + ahead.ms;
            const b = (box = edgeBox({ dir: linked.dir, cloudOrigin: cloud.origin, clock }));
            await b.kernel.start();
            const boot = new FakeBoot();
            boot.failed.add('uplink');
            const o = (ops = new OpsService(b.config, clock, b.events.bus, boot, b.state, b.kernel, b.uplink, new FakeAuth().asPort(), new FakeOpsHost(), new ManualTimers(), DEFAULT_OPS_TUNING));
            // A state nobody published has no start of its own.
            expect(b.uplink.cloudLink()).toMatchObject({ state: 'cant-reach-etabella', sinceMs: null });
            const seenAt = clock();
            expect(o.verdict().problems).toEqual([]);
            ahead.ms = 20_000;
            const v = o.verdict();
            expect(v.problems.map(p => p.kind)).toEqual(['cant-reach-etabella']);
            expect(v.problems[0].sinceMs).toBeGreaterThanOrEqual(seenAt);
            expect(v.problems[0].sinceMs).toBeLessThan(seenAt + 1_000);
        });
    });
});
