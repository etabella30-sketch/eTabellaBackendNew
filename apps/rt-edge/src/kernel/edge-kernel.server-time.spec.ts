/**
 * etabella.net time on a venue box (user decision 2026-10-05): with the box PC clock 5 min fast, the kernel — given
 * EDGE_CLOCK as the Nest graph wires it (`ServerTime.now()`, app.module.ts) — journals each chunk's receive time in
 * etabella.net time, a CaseView line's time column is that time in the session's pinned zone, and the room is live,
 * not "quiet" (it would be if line stamps and the kernel's own checks read different clocks).
 */
import { readJournal, RecordType } from '@app/rt-ingest';
import { wallClockTime } from '@app/feed-parse';

import { EDGE_TIMING } from '../contracts';
import { ServerTime } from '../ports';
import { eclipse, Harness, harness, sessionAssignment, waitFor } from './testing/kernel-harness';

jest.setTimeout(60_000);

const FAST_MS = 5 * 60_000;
/** CaseView ends lines with 0xF9 + 4 hex digits + 0xFA (the reporter's DOS time, which the parser drops). */
const marker = (n: number): Buffer => Buffer.from([0xf9, ...Buffer.from(n.toString(16).toUpperCase().padStart(4, '0'), 'latin1'), 0xfa]);
const caseViewLines = (from: number, count: number): Buffer =>
    Buffer.concat(Array.from({ length: count }, (_, i) => Buffer.concat([Buffer.from(`  Q.  Question number ${from + i}?`, 'latin1'), marker(from + i), Buffer.from('\r\n', 'latin1')])));

describe('EdgeKernel — lines carry etabella.net time with the box PC clock 5 min fast (user decision 2026-10-05)', () => {
    const SES = 'ses-server-time-1';
    let h: Harness;
    let serverTime: ServerTime;

    beforeEach(async () => {
        serverTime = new ServerTime(() => Date.now() + FAST_MS);
        // The first hello measured the PC clock 5 min fast.
        serverTime.observe({ offsetMs: FAST_MS, rttMs: 40, atMs: serverTime.raw() });
        h = harness({ clock: () => serverTime.now() });
        h.state.sessions.upsertAssignment(sessionAssignment(SES, { tz: 'Asia/Dubai', protocol: 'C' }), h.clock());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed', 15_000, 'armed');
    });
    afterEach(async () => {
        await h.close();
    });

    it('journals DATA tRecv in etabella.net time, the CaseView time column is that time in Asia/Dubai, and the room is live', async () => {
        const client = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await client.send(caseViewLines(1, 12));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 10, 15_000, '10 CaseView lines');
        await h.kernel.settled();

        const j = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
        const data = j.records.filter(r => r.type === RecordType.DATA);
        expect(data.length).toBeGreaterThan(0);
        for (const r of data) {
            // etabella.net time (the cloud's clock: Date.now() here), never the PC clock 5 min ahead.
            expect(Math.abs(r.tRecvMs - Date.now())).toBeLessThan(30_000);
            expect(serverTime.raw() - r.tRecvMs).toBeGreaterThan(FAST_MS - 30_000);
        }
        const stamps = new Set(data.map(r => wallClockTime('Asia/Dubai', new Date(r.tRecvMs))));
        const times = h.kernel
            .pages(SES)
            .flat()
            .filter(l => Array.isArray(l) && Array.isArray(l[1]) && (l[1] as number[]).length > 0)
            .map(l => String(l[0]));
        expect(times.length).toBeGreaterThanOrEqual(10);
        for (const t of times) expect(stamps.has(t)).toBe(true);
        // The PC clock's own time in Dubai is 5 min later: no line shows it.
        const pcTime = wallClockTime('Asia/Dubai', new Date(data[0].tRecvMs + FAST_MS));
        expect(times).not.toContain(pcTime);

        // Line stamps and the kernel's checks read the same clock: live, not "quiet" / "No new lines since".
        const view = h.kernel.session(SES)!;
        expect(view).toMatchObject({ protocol: 'C', feed: 'live', phase: 'live' });
        expect(Math.abs(view.lastLineAtMs! - Date.now())).toBeLessThan(30_000);
        expect(h.kernel.transmitterLink()).toMatchObject({ state: 'live', receivingSesid: SES });
        await client.end();
    });
});

describe('EdgeKernel — the first etabella.net reading steps the clock back 5 min (review 2026-10-05)', () => {
    const SES = 'ses-server-time-2';
    let h: Harness;
    let serverTime: ServerTime;
    /** Time the spec moves forward by hand (the PC and the monotonic clock together, so it is no PC clock jump). */
    let later = 0;

    beforeEach(async () => {
        later = 0;
        // No etabella.net time yet: the box records on its own clock, 5 min fast.
        serverTime = new ServerTime(
            () => Date.now() + FAST_MS + later,
            () => performance.now() + later,
        );
        h = harness({ clock: () => serverTime.now(), kernel: { auditEveryMs: 1_000 } });
        h.state.sessions.upsertAssignment(sessionAssignment(SES, { tz: 'Asia/Dubai', protocol: 'C' }), h.clock());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed', 15_000, 'armed');
    });
    afterEach(async () => {
        await h.close();
    });

    it('times ahead of the clock come back to it, and a feed that stops reads quiet after EDGE_TIMING.liveLineWindowMs, not 5 min', async () => {
        const client = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await client.send(caseViewLines(1, 12));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 10, 15_000, '10 CaseView lines');
        await h.kernel.settled();
        await waitFor(() => h.kernel.session(SES)?.lastLineAtMs != null, 5_000, 'a last line');
        // Recorded on the box clock, 5 min ahead of etabella.net.
        expect(h.kernel.session(SES)!.lastLineAtMs! - Date.now()).toBeGreaterThan(FAST_MS - 30_000);

        // The first hello: etabella.net time applies at once, 5 min back. The feed stops (the connection stays up).
        serverTime.observe({ offsetMs: FAST_MS, rttMs: 40, atMs: serverTime.raw() });
        const stepAt = serverTime.now();
        h.events.clear();
        await waitFor(() => (h.kernel.session(SES)?.lastLineAtMs ?? Number.POSITIVE_INFINITY) <= serverTime.now(), 5_000, 'the last line back on the clock');
        const v = h.kernel.session(SES)!;
        expect(v.lastLineAtMs!).toBeGreaterThanOrEqual(stepAt);
        expect(v.firstLineAtMs!).toBeLessThanOrEqual(serverTime.now());
        expect(v.feed).toBe('live');
        // The new "last line" time is published (LAN room, chip, Transmitter tile).
        await waitFor(() => h.events.of('session-status').some(e => e.nSesid === SES && e.cause === 'line'), 5_000, "a 'line' status");
        // It stays back on the clock (the worker's old stamp, still 5 min ahead, does not bring it back).
        await new Promise(resolve => setTimeout(resolve, 300));
        expect(h.kernel.session(SES)!.lastLineAtMs!).toBeLessThanOrEqual(serverTime.now());

        // 2 min and a bit of etabella.net time later: quiet — not live for 5 min.
        later += EDGE_TIMING.liveLineWindowMs + 5_000;
        await waitFor(() => h.kernel.session(SES)?.feed === 'quiet', 5_000, 'quiet');
        expect(h.kernel.transmitterLink()).toMatchObject({ state: 'quiet', receivingSesid: SES });
        // The digest audit runs again (its last run was 5 min in the future too).
        await waitFor(() => (h.kernel.session(SES)?.lastAudit?.atMs ?? 0) >= stepAt + EDGE_TIMING.liveLineWindowMs, 5_000, 'an audit after the step');
        await client.end();
    });
});
