import { EDGE_DISK_ARM_MIN_MB, EDGE_TIMING, VERDICT_KINDS, VerdictProblem } from '../contracts';
import type { KernelSessionView } from '../ports';
import { kernelView, NOW, syncOf } from './testing/ops-fakes';
import {
    buildVerdictProblems,
    FeedIncident,
    FeedIncidents,
    gapStartMs,
    heldCapturesOf,
    logFilterDefaultOf,
    ProblemClock,
    recoveryId,
    VerdictInput,
    verdictOverall,
    VerdictSessionFacts,
} from './verdict';

const facts = (over: Partial<VerdictSessionFacts> = {}): VerdictSessionFacts => ({
    nSesid: 's1',
    sessionName: 'Day 3 — Morning',
    tz: 'Asia/Dubai',
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
        clock: { synced: true, offsetMs: 3, source: 'etabella', readingAgeMs: 30_000, measured: true },
        transmitter: { mode: 'listen', linkState: 'live', stateVersion: 7, hasDialAddress: false, serialPath: null, baudRate: null, listenPort: 2500 },
        cantReachSinceMs: null,
        heldCaptures: { pending: 0, lastError: null },
        feedIncidents: [],
        lastSafe: () => null,
        since: new ProblemClock(),
        ...over,
    };
}

const kinds = (problems: readonly VerdictProblem[]): string[] => problems.map(p => p.kind);
const byKind = <K extends VerdictProblem['kind']>(problems: readonly VerdictProblem[], kind: K) => problems.find(p => p.kind === kind) as Extract<VerdictProblem, { kind: K }>;

/** The box on this PC: the feed on COM13 @ 9600 (listen port 5555 unused). */
const SERIAL: VerdictInput['transmitter'] = { mode: 'serial', linkState: 'quiet', stateVersion: 21, hasDialAddress: false, serialPath: 'COM13', baudRate: 9600, listenPort: 5555 };
const quietOnCom = (lastLineAtMs: number, over: Partial<KernelSessionView> = {}): KernelSessionView =>
    kernelView({ feed: 'quiet', mode: 'serial', peer: 'COM13 @ 9600', lastLineAtMs, lastLine: { page: 12, line: 4, atMs: lastLineAtMs }, ...over });
const UPLOAD_FAILED = { atMs: NOW - 40_000, status: 500, code: 'ERROR' };
const UPLOAD_NO_ARCHIVE = { atMs: NOW - 40_000, status: 503, code: 'NOT_CONFIGURED' };

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
                    facts({ nSesid: 'sD', view: quietOnCom(NOW - 700_000, { nSesid: 'sD' }) }),
                    facts({ nSesid: 's1' }),
                ],
                linkFailure: 'unreachable',
                diskFreeMB: 200,
                internet: { state: 'down', sinceMs: NOW - 70_000 },
                clock: { synced: false, offsetMs: 9_000, source: 'box', readingAgeMs: null, measured: true },
                cantReachSinceMs: NOW - 70_000,
                heldCaptures: { pending: 1, lastError: UPLOAD_FAILED },
                feedIncidents: [incident()],
            }),
        );
        // "Can't reach eTabella" is the one kind missing: it never stands beside box-not-linked or internet-unavailable.
        expect(kinds(problems)).toEqual(VERDICT_KINDS.filter(k => k !== 'cant-reach-etabella'));
        expect(problems.map(p => p.rank)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 9, 10]);
        expect(problems.map(p => p.severity)).toEqual(['critical', 'bad', 'bad', 'warn', 'bad', 'bad', 'warn', 'bad', 'warn', 'warn']);
        expect(verdictOverall(problems)).toBe('critical');
        expect(logFilterDefaultOf(problems)).toBe('problems');
        // Recording failure on a nearly full disk reads disk-full.
        expect(byKind(problems, 'recording-failed').detail.reason).toBe('disk-full');
        // With the box linked and the internet up, it takes its place between the internet and the clock.
        const cloudSide = buildVerdictProblems(input({ cantReachSinceMs: NOW - 70_000, clock: { synced: false, offsetMs: 9_000, source: 'box', readingAgeMs: null, measured: true }, heldCaptures: { pending: 1, lastError: UPLOAD_FAILED } }));
        expect(kinds(cloudSide)).toEqual(['cant-reach-etabella', 'clock', 'captures-not-uploaded']);
        expect(cloudSide.map(p => p.rank)).toEqual([8, 9, 10]);
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
                serialPath: null,
                // The port the reporter types (the FE words "check-reporter-login" with it, never a fixed 2500).
                listenPort: 2500,
            },
            hints: ['check-eclipse-output', 'check-cable', 'check-reporter-login'],
        });
        expect(Object.keys(early.detail).sort()).toEqual(
            ['feedStoppedAtMs', 'gapFromMs', 'gapToMs', 'lastLine', 'resendFromMs', 'supportAlertedAtMs', 'splitOfferedFromMs', 'mode', 'peer', 'serialPath', 'listenPort'].sort(),
        );
        expect(byKind(buildVerdictProblems(input({ transmitter: { ...input().transmitter, listenPort: 5555 }, feedIncidents: [incident()] })), 'feed-stopped').detail.listenPort).toBe(5555);
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
            byKind(
                buildVerdictProblems(input({ transmitter: { mode: 'dial', linkState, stateVersion: 12, hasDialAddress, serialPath: null, baudRate: null, listenPort: 2500 }, feedIncidents: [incident({ mode: 'dial' })] })),
                'feed-stopped',
            );
        const down = dial('disconnected');
        expect(down.actions).toEqual([
            { kind: 'reconnect', primary: true, stateVersion: 12, nSesid: null },
            { kind: 'open-transmitter', primary: false, stateVersion: null, nSesid: null },
        ]);
        expect(down.hints).toEqual(['check-eclipse-output', 'check-cable', 'check-transmitter-address']);
        expect(down.detail).toMatchObject({ serialPath: null, listenPort: null });
        expect(dial('connecting').actions[0].kind).toBe('reconnect');
        expect(dial('live').actions.map(a => [a.kind, a.primary])).toEqual([['open-transmitter', true]]);
        expect(dial('disconnected', false).actions.map(a => a.kind)).toEqual(['open-transmitter']);
    });

    it('feed stopped (COM port, user decision 2026-10-04): Reconnect while the port is closed, COM hints, the port in the detail', () => {
        const serial = (linkState: VerdictInput['transmitter']['linkState'], serialPath: string | null = 'COM13') =>
            byKind(buildVerdictProblems(input({ transmitter: { ...SERIAL, linkState, serialPath }, feedIncidents: [incident({ mode: 'serial', peer: 'COM13 @ 9600' })] })), 'feed-stopped');
        const down = serial('disconnected');
        expect(down.actions).toEqual([
            { kind: 'reconnect', primary: true, stateVersion: 21, nSesid: null },
            { kind: 'open-transmitter', primary: false, stateVersion: null, nSesid: null },
        ]);
        expect(down.hints).toEqual(['check-eclipse-output', 'check-com-cable']);
        expect(down.detail).toMatchObject({ mode: 'serial', peer: 'COM13 @ 9600', serialPath: 'COM13', listenPort: null });
        expect(serial('connecting').actions[0].kind).toBe('reconnect');
        // The box refuses a reconnect while the port is open (link_up), so it is not offered then.
        expect(serial('live').actions.map(a => [a.kind, a.primary])).toEqual([['open-transmitter', true]]);
        expect(serial('disconnected', null).actions.map(a => a.kind)).toEqual(['open-transmitter']);
        // Never the socket login card ("Show to reporter" is for Eclipse set to "Connect to server").
        expect(down.actions.some(a => a.kind === 'show-to-reporter')).toBe(false);
        expect(down.hints).not.toContain('check-reporter-login');
    });

    it('COM port quiet past 10 min (user decision 2026-10-04): a warning per session that pages no one, never feed-stopped', () => {
        // Up to EDGE_TIMING.quietNeutralMs the Transmitter pill is still neutral: nothing.
        expect(buildVerdictProblems(input({ transmitter: SERIAL, sessions: [facts({ view: quietOnCom(NOW - EDGE_TIMING.quietNeutralMs) })] }))).toEqual([]);
        const at = NOW - EDGE_TIMING.quietNeutralMs - 1;
        const problems = buildVerdictProblems(input({ transmitter: SERIAL, sessions: [facts({ view: quietOnCom(at) })] }));
        expect(problems).toEqual([
            {
                id: `feed-quiet:s1:${at}`,
                kind: 'feed-quiet',
                rank: VERDICT_KINDS.indexOf('feed-quiet'),
                severity: 'warn',
                sinceMs: at,
                nSesid: 's1',
                sessionName: 'Day 3 — Morning',
                sessionTz: 'Asia/Dubai',
                detail: { lastLineAtMs: at, lastLine: { page: 12, line: 4, atMs: at }, serialPath: 'COM13', baudRate: 9600 },
                hints: ['check-eclipse-output', 'check-com-cable'],
                actions: [{ kind: 'open-transmitter', primary: true, stateVersion: null, nSesid: null }],
            },
        ]);
        // A warning: the verdict is not red and the Connectivity Log keeps "All".
        expect(logFilterDefaultOf(problems)).toBe('all');
        // The session's own mode decides when it reports one; else the applied mode.
        expect(kinds(buildVerdictProblems(input({ transmitter: SERIAL, sessions: [facts({ view: quietOnCom(at, { mode: null }) })] })))).toEqual(['feed-quiet']);
        // Not in listen or dial mode (there a silent Eclipse drops the connection: feed-stopped), not while live.
        expect(buildVerdictProblems(input({ sessions: [facts({ view: quietOnCom(at, { mode: 'listen' }) })] }))).toEqual([]);
        expect(buildVerdictProblems(input({ transmitter: SERIAL, sessions: [facts({ view: quietOnCom(at, { feed: 'live' }) })] }))).toEqual([]);
        // An open drop of the same session is the one problem shown.
        expect(kinds(buildVerdictProblems(input({ transmitter: SERIAL, sessions: [facts({ view: quietOnCom(at) })], feedIncidents: [incident({ mode: 'serial' })] })))).toEqual(['feed-stopped']);
        // Reconnect only while the COM port is closed (the box refuses it with link_up otherwise).
        const closed = byKind(buildVerdictProblems(input({ transmitter: { ...SERIAL, linkState: 'disconnected' }, sessions: [facts({ view: quietOnCom(at) })] })), 'feed-quiet');
        expect(closed.actions.map(a => [a.kind, a.primary, a.stateVersion])).toEqual([
            ['reconnect', true, 21],
            ['open-transmitter', false, null],
        ]);
        // The id (and so the announcement) is stable while the silence lasts; a new line starts a new one.
        expect(byKind(buildVerdictProblems(input({ nowMs: NOW + 60_000, transmitter: SERIAL, sessions: [facts({ view: quietOnCom(at) })] })), 'feed-quiet').id).toBe(`feed-quiet:s1:${at}`);
    });

    it("can't reach eTabella (user decision 2026-10-04): after 15 s with the internet up, never beside box-not-linked or internet-unavailable", () => {
        expect(buildVerdictProblems(input({ cantReachSinceMs: NOW - EDGE_TIMING.internetOfflineAfterMs + 1 }))).toEqual([]);
        const p = byKind(buildVerdictProblems(input({ cantReachSinceMs: NOW - 90_000, pendingPages: 2, lagSec: 95 })), 'cant-reach-etabella');
        expect(p).toEqual({
            id: 'cant-reach-etabella',
            kind: 'cant-reach-etabella',
            rank: VERDICT_KINDS.indexOf('cant-reach-etabella'),
            severity: 'bad',
            sinceMs: NOW - 90_000,
            nSesid: null,
            sessionName: null,
            sessionTz: null,
            detail: { sinceMs: NOW - 90_000, pendingPages: 2, lagSec: 95 },
            hints: ['contact-support'],
            actions: [{ kind: 'run-checks-again', primary: true, stateVersion: null, nSesid: null }],
        });
        // Red: the log opens on Problems.
        expect(logFilterDefaultOf([p])).toBe('problems');
        expect(kinds(buildVerdictProblems(input({ cantReachSinceMs: NOW - 90_000, internet: { state: 'down', sinceMs: NOW - 90_000 } })))).toEqual(['internet-unavailable']);
        // The internet still unknown (boot) does not hide it.
        expect(kinds(buildVerdictProblems(input({ cantReachSinceMs: NOW - 90_000, internet: { state: 'unknown', sinceMs: null } })))).toEqual(['cant-reach-etabella']);
    });

    it("can't reach eTabella and the link failure `unreachable` of a box that linked before are one fact (review 2026-10-04)", () => {
        // The uplink records `unreachable` on the first failed reconnect, a second after the drop: the verdict still
        // reads "Can't reach eTabella" with its own start, pending pages and lag, not "Box not linked".
        const lost = buildVerdictProblems(input({ linkFailure: 'unreachable', lastLinkedAtMs: NOW - 95_000, cantReachSinceMs: NOW - 90_000, pendingPages: 3, lagSec: 92 }));
        expect(lost.map(p => [p.kind, p.sinceMs, p.detail])).toEqual([['cant-reach-etabella', NOW - 90_000, { sinceMs: NOW - 90_000, pendingPages: 3, lagSec: 92 }]]);
        // Inside the 15 s hysteresis neither is listed (a socket reconnect takes seconds).
        expect(buildVerdictProblems(input({ linkFailure: 'unreachable', cantReachSinceMs: NOW - 2_000 }))).toEqual([]);
        // Never linked: the box is not linked, whatever etabella.net answers.
        expect(kinds(buildVerdictProblems(input({ linkFailure: 'unreachable', lastLinkedAtMs: null, cantReachSinceMs: NOW - 90_000 })))).toEqual(['box-not-linked']);
        // No "can't reach" known (nothing says etabella.net is down): the link failure stands as before.
        expect(kinds(buildVerdictProblems(input({ linkFailure: 'unreachable', cantReachSinceMs: null })))).toEqual(['box-not-linked']);
        // The internet down: box-not-linked beside internet-unavailable, as before.
        expect(kinds(buildVerdictProblems(input({ linkFailure: 'unreachable', cantReachSinceMs: NOW - 90_000, internet: { state: 'down', sinceMs: NOW - 90_000 } })))).toEqual([
            'box-not-linked',
            'internet-unavailable',
        ]);
        // The other failures are the box's own: box-not-linked alone.
        for (const failure of ['never-enrolled', 'revoked', 'quarantined', 'key-refused'] as const) {
            expect(kinds(buildVerdictProblems(input({ linkFailure: failure, cantReachSinceMs: NOW - 90_000 })))).toEqual(['box-not-linked']);
        }
        // A certificate problem does not hide that etabella.net is out of reach: both are listed.
        expect(kinds(buildVerdictProblems(input({ linkFailure: 'certificate', cantReachSinceMs: NOW - 90_000 })))).toEqual(['box-not-linked', 'cant-reach-etabella']);
    });

    it('held captures not uploaded (user decision 2026-10-04): while captures wait and the last upload failed', () => {
        expect(buildVerdictProblems(input({ heldCaptures: { pending: 1, lastError: null } }))).toEqual([]);
        expect(buildVerdictProblems(input({ heldCaptures: { pending: 0, lastError: UPLOAD_FAILED } }))).toEqual([]);
        // etabella.net has no archive for venue uploads: the capture just stays on the box (user decision 2026-10-05).
        expect(buildVerdictProblems(input({ heldCaptures: { pending: 1, lastError: UPLOAD_NO_ARCHIVE } }))).toEqual([]);
        const since = new ProblemClock();
        const p = byKind(buildVerdictProblems(input({ since, heldCaptures: { pending: 1, lastError: UPLOAD_FAILED } })), 'captures-not-uploaded');
        expect(p).toEqual({
            id: 'captures-not-uploaded',
            kind: 'captures-not-uploaded',
            rank: VERDICT_KINDS.indexOf('captures-not-uploaded'),
            severity: 'warn',
            sinceMs: NOW,
            nSesid: null,
            sessionName: null,
            sessionTz: null,
            detail: { pending: 1, lastError: UPLOAD_FAILED },
            hints: ['contact-support'],
            actions: [{ kind: 'download-diagnostics', primary: true, stateVersion: null, nSesid: null }],
        });
        // Stable while it lasts, though every retry moves the error time.
        const later = byKind(buildVerdictProblems(input({ since, nowMs: NOW + 60_000, heldCaptures: { pending: 1, lastError: { ...UPLOAD_FAILED, atMs: NOW + 20_000 } } })), 'captures-not-uploaded');
        expect(later).toMatchObject({ sinceMs: NOW, detail: { lastError: { atMs: NOW + 20_000 } } });
    });

    it('reads the held-capture fields of the cloud link defensively (an uplink without them reads none)', () => {
        expect(heldCapturesOf(null)).toEqual({ pending: 0, lastError: null });
        expect(heldCapturesOf({ state: 'synced' })).toEqual({ pending: 0, lastError: null });
        expect(heldCapturesOf({ heldCapturesPending: 2, lastUploadError: UPLOAD_FAILED })).toEqual({ pending: 2, lastError: UPLOAD_FAILED });
        expect(heldCapturesOf({ heldCapturesPending: 1, lastUploadError: { atMs: NOW, status: null, code: null } })).toEqual({ pending: 1, lastError: { atMs: NOW, status: null, code: null } });
        expect(heldCapturesOf({ heldCapturesPending: 'x', lastUploadError: { atMs: 'y' } })).toEqual({ pending: 0, lastError: null });
        expect(heldCapturesOf({ heldCapturesPending: -3, lastUploadError: null })).toEqual({ pending: 0, lastError: null });
    });

    it('feed stopped for a session the box does not hold is not listed', () => {
        expect(buildVerdictProblems(input({ feedIncidents: [incident({ nSesid: 'gone' })] }))).toEqual([]);
    });

    it("a problem about a session names the session's zone, a box-wide one none (user decision 2026-10-05)", () => {
        const degraded = kernelView({ nSesid: 's2', durability: 'degraded', degradedSinceMs: NOW - 1_000 });
        const problems = buildVerdictProblems(
            input({
                sessions: [facts(), facts({ nSesid: 's2', sessionName: 'Day 4', tz: null, view: degraded })],
                feedIncidents: [incident()],
                diskFreeMB: 200,
            }),
        );
        expect(problems.map(p => [p.kind, p.nSesid, p.sessionTz])).toEqual([
            ['recording-failed', 's2', null],
            ['disk-low', null, null],
            ['feed-stopped', 's1', 'Asia/Dubai'],
        ]);
    });

    it('internet unavailable: only while down, with the backlog', () => {
        const p = byKind(buildVerdictProblems(input({ internet: { state: 'down', sinceMs: NOW - 70_000 }, pendingPages: 3, lagSec: 71 })), 'internet-unavailable');
        expect(p).toMatchObject({ sinceMs: NOW - 70_000, detail: { sinceMs: NOW - 70_000, pendingPages: 3, lagSec: 71 }, hints: ['check-internet'] });
        expect(kinds(buildVerdictProblems(input({ internet: { state: 'unknown', sinceMs: null } })))).toEqual([]);
        expect(byKind(buildVerdictProblems(input({ internet: { state: 'down', sinceMs: null } })), 'internet-unavailable').sinceMs).toBe(NOW);
    });

    it('clock (user decision 2026-10-05): only while new lines use the box clock (no etabella.net time, chrony not synced), or the PC is 60 s or more off; never claimed before a check', () => {
        const clock = (over: Partial<VerdictInput['clock']>): VerdictInput['clock'] => ({ synced: false, offsetMs: 347, source: 'etabella', readingAgeMs: 30_000, measured: true, ...over });
        // Windows "Leap 3 / Local CMOS Clock" with a fresh 347 ms reading: the box follows etabella.net, no problem.
        expect(kinds(buildVerdictProblems(input({ clock: clock({}) })))).toEqual([]);
        expect(kinds(buildVerdictProblems(input({ clock: clock({ offsetMs: 59_999 }) })))).toEqual([]);
        expect(kinds(buildVerdictProblems(input({ clock: clock({ source: 'saved', offsetMs: null, readingAgeMs: 2 * 86_400_000 }) })))).toEqual([]);
        expect(kinds(buildVerdictProblems(input({ clock: clock({ source: 'chrony', synced: true, offsetMs: 2 }) })))).toEqual([]);
        expect(byKind(buildVerdictProblems(input({ clock: clock({ offsetMs: -60_000 }) })), 'clock').detail).toEqual({ synced: false, offsetMs: -60_000, source: 'etabella' });
        // No etabella.net time yet and nothing saved: lines use the box's own clock.
        expect(byKind(buildVerdictProblems(input({ clock: clock({ source: 'box', offsetMs: null, synced: null, readingAgeMs: null }) })), 'clock').detail).toEqual({ synced: false, offsetMs: null, source: 'box' });
        expect(byKind(buildVerdictProblems(input({ clock: clock({ source: 'box', offsetMs: 10, synced: true, readingAgeMs: null }) })), 'clock')).toMatchObject({ severity: 'warn', sessionTz: null });
        expect(kinds(buildVerdictProblems(input({ clock: clock({ source: 'box', synced: null, offsetMs: null, readingAgeMs: null, measured: false }) })))).toEqual([]);
    });

    it('overall: problem for bad or warn only; the log opens on Problems only while red', () => {
        const warnOnly = buildVerdictProblems(input({ clock: { synced: false, offsetMs: 1, source: 'box', readingAgeMs: null, measured: true } }));
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
