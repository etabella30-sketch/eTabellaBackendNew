import { EDGE_DISK_ARM_MIN_MB, EDGE_TIMING, VERDICT_KINDS, VerdictProblem } from '../contracts';
import type { KernelSessionView } from '../ports';
import { kernelView, NOW, syncOf } from './testing/ops-fakes';
import { buildVerdictProblems, FeedIncident, FeedIncidents, gapStartMs, logFilterDefaultOf, ProblemClock, recoveryId, VerdictInput, verdictOverall, VerdictSessionFacts } from './verdict';

const facts = (over: Partial<VerdictSessionFacts> = {}): VerdictSessionFacts => ({
    nSesid: 's1',
    sessionName: 'Day 3 — Morning',
    localState: 'live',
    view: kernelView(),
    sync: syncOf(),
    splitDone: false,
    ...over,
});

const incident = (over: Partial<FeedIncident> = {}): FeedIncident => ({
    nSesid: 's1',
    feedStoppedAtMs: NOW - 252_000, // "Feed stopped 4 min 12 s ago"
    gapFromMs: Date.UTC(2026, 9, 1, 9, 25, 5), // 10:25:05 London
    lastLine: { page: 41, line: 18, atMs: Date.UTC(2026, 9, 1, 9, 25, 5) },
    mode: 'listen',
    peer: '192.168.20.31:51000',
    supportAlertedAtMs: null,
    alertRaisedAtMs: null,
    ...over,
});

function input(over: Partial<VerdictInput> = {}): VerdictInput {
    return {
        nowMs: NOW,
        sessions: [facts()],
        linkFailure: null,
        lastLinkedAtMs: NOW - 10_000,
        diskFreeMB: 212_000,
        internet: { state: 'up', sinceMs: NOW - 3_600_000 },
        pendingPages: 0,
        lagSec: 0,
        clock: { synced: true, offsetMs: 3, measured: true },
        transmitter: { mode: 'listen', linkState: 'live', stateVersion: 7, hasDialAddress: false },
        feedIncidents: [],
        lastSafe: () => null,
        since: new ProblemClock(),
        ...over,
    };
}

const kinds = (problems: readonly VerdictProblem[]): string[] => problems.map(p => p.kind);
const byKind = <K extends VerdictProblem['kind']>(problems: readonly VerdictProblem[], kind: K) => problems.find(p => p.kind === kind) as Extract<VerdictProblem, { kind: K }>;

describe('verdict ranking (DR12; CONTRACTS.md §8.4)', () => {
    it('is ok with nothing to report', () => {
        const problems = buildVerdictProblems(input());
        expect(problems).toEqual([]);
        expect(verdictOverall(problems)).toBe('ok');
        expect(logFilterDefaultOf(problems)).toBe('all');
    });

    it('ranks every kind worst first, in DR12 order, and keeps every problem listed', () => {
        const degraded = kernelView({ nSesid: 'sA', durability: 'degraded', degradedSinceMs: NOW - 30_000 });
        const recovering = kernelView({ nSesid: 'sB', recovering: { startedAtMs: NOW - 20_000, progressPct: 40 } });
        const problems = buildVerdictProblems(
            input({
                sessions: [
                    facts({ nSesid: 'sA', view: degraded }),
                    facts({ nSesid: 'sB', view: recovering }),
                    facts({ nSesid: 'sC', sync: syncOf({ nSesid: 'sC', uplinkState: 'frozen', frozenAtMs: NOW - 50_000 }) }),
                    facts({ nSesid: 's1' }),
                ],
                linkFailure: 'unreachable',
                diskFreeMB: 200,
                internet: { state: 'down', sinceMs: NOW - 70_000 },
                clock: { synced: false, offsetMs: 9_000, measured: true },
                feedIncidents: [incident()],
            }),
        );
        expect(kinds(problems)).toEqual([...VERDICT_KINDS]);
        expect(problems.map(p => p.rank)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(problems.map(p => p.severity)).toEqual(['critical', 'bad', 'bad', 'warn', 'bad', 'bad', 'bad', 'warn']);
        expect(verdictOverall(problems)).toBe('critical');
        expect(logFilterDefaultOf(problems)).toBe('problems');
        // Recording failure on a nearly full disk reads disk-full.
        expect(byKind(problems, 'recording-failed').detail.reason).toBe('disk-full');
    });

    it('lists every critical item and orders a kind by how long it has stood', () => {
        const problems = buildVerdictProblems(
            input({
                sessions: [
                    facts({ nSesid: 'late', view: kernelView({ nSesid: 'late', durability: 'degraded', degradedSinceMs: NOW - 10_000 }) }),
                    facts({ nSesid: 'early', view: kernelView({ nSesid: 'early', durability: 'degraded', degradedSinceMs: NOW - 90_000 }) }),
                    facts({ nSesid: 'corrupt', view: kernelView({ nSesid: 'corrupt', journalCorrupt: true }) }),
                ],
            }),
        );
        expect(problems.map(p => [p.kind, p.nSesid])).toEqual([
            ['recording-failed', 'early'],
            ['recording-failed', 'late'],
            ['recording-failed', 'corrupt'],
        ]);
        expect(problems.every(p => p.severity === 'critical')).toBe(true);
    });

    it('recording failed: reasons, last safe line, hints and the diagnostics action', () => {
        const lastSafe = { page: 41, line: 12, atMs: NOW - 31_000 };
        const io = buildVerdictProblems(
            input({ sessions: [facts({ view: kernelView({ durability: 'degraded', degradedSinceMs: NOW - 30_000 }) })], lastSafe: id => (id === 's1' ? lastSafe : null) }),
        );
        expect(io[0]).toMatchObject({
            id: 'recording-failed:s1',
            kind: 'recording-failed',
            sinceMs: NOW - 30_000,
            nSesid: 's1',
            sessionName: 'Day 3 — Morning',
            detail: { reason: 'io-error', lastSafe },
            hints: ['replace-disk', 'contact-support'],
            actions: [{ kind: 'download-diagnostics', primary: true, stateVersion: null, nSesid: null }],
        });
        const full = buildVerdictProblems(input({ diskFreeMB: 100, sessions: [facts({ view: kernelView({ durability: 'degraded', degradedSinceMs: NOW - 1 }) })] }));
        expect(full[0]).toMatchObject({ detail: { reason: 'disk-full' }, hints: ['free-disk-space', 'contact-support'] });
        const unknownDisk = buildVerdictProblems(input({ diskFreeMB: null, sessions: [facts({ view: kernelView({ durability: 'degraded', degradedSinceMs: NOW - 1 }) })] }));
        expect(byKind(unknownDisk, 'recording-failed').detail.reason).toBe('io-error');
        const corrupt = buildVerdictProblems(input({ sessions: [facts({ view: kernelView({ journalCorrupt: true }) })], lastSafe: () => lastSafe }));
        expect(corrupt[0]).toMatchObject({ detail: { reason: 'journal-corrupt', lastSafe: null }, hints: ['contact-support'] });
    });

    it('box not linked: failure, last link, and diagnostics for a revoked or quarantined box', () => {
        const p = byKind(buildVerdictProblems(input({ linkFailure: 'certificate', lastLinkedAtMs: NOW - 99 })), 'box-not-linked');
        expect(p).toMatchObject({ id: 'box-not-linked', nSesid: null, detail: { failure: 'certificate', lastLinkedAtMs: NOW - 99 }, hints: ['contact-support'] });
        expect(p.actions.map(a => a.kind)).toEqual(['run-checks-again']);
        expect(byKind(buildVerdictProblems(input({ linkFailure: 'unreachable' })), 'box-not-linked').hints).toEqual(['check-internet']);
        expect(byKind(buildVerdictProblems(input({ linkFailure: 'revoked' })), 'box-not-linked').actions.map(a => a.kind)).toEqual(['run-checks-again', 'download-diagnostics']);
    });

    it('disk low: below 10 GB (a new session will not arm), never when unmeasured', () => {
        expect(kinds(buildVerdictProblems(input({ diskFreeMB: EDGE_DISK_ARM_MIN_MB })))).toEqual([]);
        const p = byKind(buildVerdictProblems(input({ diskFreeMB: EDGE_DISK_ARM_MIN_MB - 1 })), 'disk-low');
        expect(p.detail).toEqual({ freeMB: EDGE_DISK_ARM_MIN_MB - 1, minFreeMB: EDGE_DISK_ARM_MIN_MB });
        expect(kinds(buildVerdictProblems(input({ diskFreeMB: null })))).toEqual([]);
    });

    it('recovering after restart: per session, from its start, nothing to press', () => {
        const p = byKind(buildVerdictProblems(input({ sessions: [facts({ view: kernelView({ recovering: { startedAtMs: NOW - 5_000, progressPct: null } }) })] })), 'recovering');
        expect(p).toMatchObject({ sinceMs: NOW - 5_000, detail: { startedAtMs: NOW - 5_000, progressPct: null }, hints: ['wait-for-recovery'], actions: [] });
    });

    it('history refused (D19): frozen uplink by state, verdict or local state; split info; split done flag', () => {
        for (const f of [
            facts({ sync: syncOf({ uplinkState: 'frozen', frozenAtMs: NOW - 8_000 }) }),
            facts({ sync: syncOf({ verdict: 'frozen', frozenAtMs: NOW - 8_000 }) }),
            facts({ localState: 'frozen', sync: syncOf({ frozenAtMs: NOW - 8_000 }) }),
        ]) {
            const p = byKind(buildVerdictProblems(input({ sessions: [f] })), 'history-refused');
            expect(p).toMatchObject({ id: 'history-refused:s1', sinceMs: NOW - 8_000, detail: { refusedAtMs: NOW - 8_000, splitDone: false } });
            expect(p.actions).toEqual([{ kind: 'split-to-cloud-info', primary: true, stateVersion: null, nSesid: null }]);
        }
        const split = byKind(buildVerdictProblems(input({ sessions: [facts({ localState: 'frozen', sync: null, splitDone: true })] })), 'history-refused');
        expect(split.detail).toEqual({ refusedAtMs: NOW, splitDone: true });
    });

    it('feed stopped (listen): the incident, resend-from minute, show-to-reporter, and the split note only from 5 min', () => {
        const early = byKind(buildVerdictProblems(input({ feedIncidents: [incident()] })), 'feed-stopped');
        expect(early).toMatchObject({
            id: `feed-stopped:s1:${NOW - 252_000}`,
            sinceMs: NOW - 252_000,
            nSesid: 's1',
            sessionName: 'Day 3 — Morning',
            detail: {
                feedStoppedAtMs: NOW - 252_000,
                gapFromMs: Date.UTC(2026, 9, 1, 9, 25, 5),
                gapToMs: null,
                lastLine: { page: 41, line: 18 },
                resendFromMs: Date.UTC(2026, 9, 1, 9, 25, 0),
                supportAlertedAtMs: null,
                splitOfferedFromMs: NOW - 252_000 + EDGE_TIMING.splitOfferAfterMs,
                mode: 'listen',
                peer: '192.168.20.31:51000',
            },
            hints: ['check-eclipse-output', 'check-cable', 'check-reporter-login'],
        });
        expect(early.actions).toEqual([
            { kind: 'show-to-reporter', primary: true, stateVersion: null, nSesid: 's1' },
            { kind: 'open-transmitter', primary: false, stateVersion: null, nSesid: null },
        ]);
        const late = byKind(buildVerdictProblems(input({ feedIncidents: [incident({ feedStoppedAtMs: NOW - EDGE_TIMING.splitOfferAfterMs, supportAlertedAtMs: NOW - 200_000 })] })), 'feed-stopped');
        expect(late.actions.map(a => a.kind)).toEqual(['show-to-reporter', 'open-transmitter', 'split-to-cloud-info']);
        expect(late.detail.supportAlertedAtMs).toBe(NOW - 200_000);
    });

    it('feed stopped (dial): Reconnect with the state version only while the link is down and an address is applied', () => {
        const dial = (linkState: VerdictInput['transmitter']['linkState'], hasDialAddress = true) =>
            byKind(buildVerdictProblems(input({ transmitter: { mode: 'dial', linkState, stateVersion: 12, hasDialAddress }, feedIncidents: [incident({ mode: 'dial' })] })), 'feed-stopped');
        const down = dial('disconnected');
        expect(down.actions).toEqual([
            { kind: 'reconnect', primary: true, stateVersion: 12, nSesid: null },
            { kind: 'open-transmitter', primary: false, stateVersion: null, nSesid: null },
        ]);
        expect(down.hints).toEqual(['check-eclipse-output', 'check-cable', 'check-transmitter-address']);
        expect(dial('connecting').actions[0].kind).toBe('reconnect');
        expect(dial('live').actions.map(a => [a.kind, a.primary])).toEqual([['open-transmitter', true]]);
        expect(dial('disconnected', false).actions.map(a => a.kind)).toEqual(['open-transmitter']);
    });

    it('feed stopped for a session the box does not hold is not listed', () => {
        expect(buildVerdictProblems(input({ feedIncidents: [incident({ nSesid: 'gone' })] }))).toEqual([]);
    });

    it('internet unavailable: only while down, with the backlog', () => {
        const p = byKind(buildVerdictProblems(input({ internet: { state: 'down', sinceMs: NOW - 70_000 }, pendingPages: 3, lagSec: 71 })), 'internet-unavailable');
        expect(p).toMatchObject({ sinceMs: NOW - 70_000, detail: { sinceMs: NOW - 70_000, pendingPages: 3, lagSec: 71 }, hints: ['check-internet'] });
        expect(kinds(buildVerdictProblems(input({ internet: { state: 'unknown', sinceMs: null } })))).toEqual([]);
        expect(byKind(buildVerdictProblems(input({ internet: { state: 'down', sinceMs: null } })), 'internet-unavailable').sinceMs).toBe(NOW);
    });

    it('clock: unsynced, or off by 5 s or more; never claimed before a reading', () => {
        expect(kinds(buildVerdictProblems(input({ clock: { synced: true, offsetMs: 4_999, measured: true } })))).toEqual([]);
        expect(byKind(buildVerdictProblems(input({ clock: { synced: true, offsetMs: -5_000, measured: true } })), 'clock').detail).toEqual({ synced: true, offsetMs: -5_000 });
        expect(byKind(buildVerdictProblems(input({ clock: { synced: false, offsetMs: 10, measured: true } })), 'clock').detail).toEqual({ synced: false, offsetMs: 10 });
        expect(kinds(buildVerdictProblems(input({ clock: { synced: null, offsetMs: null, measured: false } })))).toEqual([]);
    });

    it('overall: problem for bad or warn only; the log opens on Problems only while red', () => {
        const warnOnly = buildVerdictProblems(input({ clock: { synced: false, offsetMs: 1, measured: true } }));
        expect(verdictOverall(warnOnly)).toBe('problem');
        expect(logFilterDefaultOf(warnOnly)).toBe('all');
        const bad = buildVerdictProblems(input({ internet: { state: 'down', sinceMs: NOW } }));
        expect(verdictOverall(bad)).toBe('problem');
        expect(logFilterDefaultOf(bad)).toBe('problems');
    });

    it('keeps ids and sinceMs stable while a problem lasts, and restarts them once it went away', () => {
        const since = new ProblemClock();
        const first = buildVerdictProblems(input({ nowMs: NOW, since, linkFailure: 'unreachable', diskFreeMB: 100 }));
        const later = buildVerdictProblems(input({ nowMs: NOW + 60_000, since, linkFailure: 'key-refused', diskFreeMB: 100 }));
        expect(later.map(p => [p.id, p.sinceMs])).toEqual(first.map(p => [p.id, p.sinceMs]));
        buildVerdictProblems(input({ nowMs: NOW + 120_000, since }));
        expect(since.size).toBe(0);
        const again = buildVerdictProblems(input({ nowMs: NOW + 180_000, since, diskFreeMB: 100 }));
        expect(again[0].sinceMs).toBe(NOW + 180_000);
    });
});

describe('feed incidents and reconnects (DR12)', () => {
    const stopped = { nSesid: 's1', feedStoppedAtMs: NOW - 60_000, lastLine: { page: 41, line: 18, atMs: NOW - 75_000 }, mode: 'listen' as const, peer: '192.168.20.31:51000' };

    it('opens one incident per drop, keeps the first stop time, fills a missing last line or peer', () => {
        const feeds = new FeedIncidents();
        feeds.stopped({ ...stopped, lastLine: null, peer: null });
        expect(feeds.incident('s1')).toMatchObject({ feedStoppedAtMs: NOW - 60_000, gapFromMs: NOW - 60_000, lastLine: null, peer: null });
        feeds.stopped({ ...stopped, feedStoppedAtMs: NOW - 30_000 });
        expect(feeds.incident('s1')).toMatchObject({ feedStoppedAtMs: NOW - 60_000, gapFromMs: NOW - 75_000, lastLine: stopped.lastLine, peer: stopped.peer });
        // An earlier report replaces it (a later event can only add detail to the same drop).
        feeds.stopped({ ...stopped, feedStoppedAtMs: NOW - 90_000, lastLine: null });
        expect(feeds.incident('s1')?.feedStoppedAtMs).toBe(NOW - 90_000);
    });

    it('gap starts at the last line, or the stop when no line time is known (or it is after the stop)', () => {
        expect(gapStartMs(NOW, { page: 1, line: 1, atMs: NOW - 5 })).toBe(NOW - 5);
        expect(gapStartMs(NOW, { page: 1, line: 1, atMs: null })).toBe(NOW);
        expect(gapStartMs(NOW, { page: 1, line: 1, atMs: NOW + 5 })).toBe(NOW);
        expect(gapStartMs(NOW, null)).toBe(NOW);
    });

    it('a reconnect closes the incident and leaves a green recovery until dismissed', () => {
        const feeds = new FeedIncidents();
        feeds.stopped(stopped);
        const recovery = feeds.resumed({ nSesid: 's1', reconnectedAtMs: NOW, gapFromMs: NOW - 75_000, gapToMs: NOW }, 'Day 3 — Morning');
        expect(recovery).toEqual({
            id: recoveryId('s1', NOW - 75_000),
            kind: 'reconnected',
            nSesid: 's1',
            sessionName: 'Day 3 — Morning',
            reconnectedAtMs: NOW,
            gapFromMs: NOW - 75_000,
            gapToMs: NOW,
            resendFromMs: Math.floor((NOW - 75_000) / 60_000) * 60_000,
        });
        expect(feeds.incidents()).toEqual([]);
        expect(feeds.recoveries()).toEqual([recovery]);
        expect(feeds.dismiss('nope')).toBe(false);
        expect(feeds.dismiss(recovery.id)).toBe(true);
        expect(feeds.recoveries()).toEqual([]);
    });

    it('keeps at most the configured number of recoveries, oldest dropped first', () => {
        const feeds = new FeedIncidents(3);
        for (let i = 0; i < 5; i++) feeds.resumed({ nSesid: `s${i}`, reconnectedAtMs: NOW + i, gapFromMs: NOW - 100 + i, gapToMs: NOW + i }, `S${i}`);
        expect(feeds.recoveries().map(r => r.nSesid)).toEqual(['s2', 's3', 's4']);
    });

    it('reconciles with the kernel: opens unseen drops, drops ended or closed sessions, recovers a missed resume after the grace', () => {
        const feeds = new FeedIncidents();
        const stoppedView = kernelView({ feed: 'stopped', feedStoppedAtMs: NOW - 40_000, catConnected: false, mode: null });
        feeds.reconcile([stoppedView], NOW, () => 'Day 3 — Morning', 'dial', 5_000);
        expect(feeds.incident('s1')).toMatchObject({ feedStoppedAtMs: NOW - 40_000, gapFromMs: NOW - 40_000, mode: 'dial' });

        // Still stopped: unchanged. Feed flowing again but within the grace: unchanged.
        feeds.reconcile([stoppedView], NOW + 1_000, () => 'x', 'dial', 5_000);
        expect(feeds.incidents()).toHaveLength(1);
        const flowing: KernelSessionView = kernelView({ feed: 'live', feedStoppedAtMs: null });
        feeds.reconcile([flowing], NOW - 39_000, () => 'x', 'dial', 5_000);
        expect(feeds.incidents()).toHaveLength(1);
        // After the grace, with no feed-resumed seen: a recovery with the gap up to now.
        feeds.reconcile([flowing], NOW, () => 'Day 3 — Morning', 'dial', 5_000);
        expect(feeds.incidents()).toEqual([]);
        expect(feeds.recoveries()).toEqual([expect.objectContaining({ nSesid: 's1', reconnectedAtMs: NOW, gapFromMs: NOW - 40_000, gapToMs: NOW })]);

        for (const view of [kernelView({ feed: 'ended', endedAtMs: NOW }), kernelView({ feed: 'waiting' })]) {
            const f = new FeedIncidents();
            f.stopped(stopped);
            f.reconcile([view], NOW, () => 'x', 'listen', 0);
            expect(f.incidents()).toEqual([]);
            expect(f.recoveries()).toEqual([]);
        }
        const closed = new FeedIncidents();
        closed.stopped(stopped);
        closed.reconcile([], NOW, () => 'x', 'listen', 0);
        expect(closed.incidents()).toEqual([]);
    });

    it('"Support alerted": the first P1/P2 alert for the session at or after the stop, with the uplink online', () => {
        const feeds = new FeedIncidents();
        feeds.stopped(stopped);
        feeds.noteAlert({ nSesid: 's1', tier: 'info', atMs: NOW }, true);
        feeds.noteAlert({ nSesid: 's2', tier: 'P2', atMs: NOW }, true);
        feeds.noteAlert({ nSesid: null, tier: 'P1', atMs: NOW }, true);
        feeds.noteAlert({ nSesid: 's1', tier: 'P2', atMs: NOW - 120_000 }, true);
        feeds.noteAlert({ nSesid: 's1', tier: 'P1', atMs: NOW }, false);
        expect(feeds.incident('s1')?.supportAlertedAtMs).toBeNull();
        feeds.noteAlert({ nSesid: 's1', tier: 'P2', atMs: NOW - 10_000 }, true);
        feeds.noteAlert({ nSesid: 's1', tier: 'P1', atMs: NOW }, true);
        expect(feeds.incident('s1')?.supportAlertedAtMs).toBe(NOW - 10_000);
        feeds.markAlertRaised('s1', NOW - 10_000);
        feeds.markAlertRaised('s1', NOW);
        expect(feeds.incident('s1')?.alertRaisedAtMs).toBe(NOW - 10_000);
        feeds.markAlertRaised('nope', NOW);
        expect(feeds.incident('nope')).toBeNull();
    });
});
