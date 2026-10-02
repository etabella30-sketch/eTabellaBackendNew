import { EDGE_DISK_ARM_MIN_MB, EDGE_DISK_READY_MIN_MB, READINESS_KEYS, ReadinessItem, ReadinessKey } from '../contracts';
import { boxDay } from '../ports';
import { clockLevel, diskLevel, evaluateReadiness, ReadinessInput, ReadinessSessionFacts } from './readiness';
import { NOW, TODAY } from './testing/ops-fakes';

const RT = 'https://etabella.net/admin/realtime';
const YESTERDAY_MS = NOW - 86_400_000;

const session = (over: Partial<ReadinessSessionFacts> = {}): ReadinessSessionFacts => ({
    nSesid: 's1',
    sessionName: 'Day 3 — Morning',
    caseName: 'Acme v Beta',
    startAtMs: NOW + 1_800_000,
    isToday: true,
    firstLineAtMs: null,
    liveNow: false,
    ...over,
});

function input(over: Partial<ReadinessInput> = {}): ReadinessInput {
    return {
        today: TODAY,
        dayOf: ms => boxDay(ms, 'Europe/London'),
        linkFailure: null,
        lastCloudContactAtMs: NOW - 10_000,
        sessions: [session()],
        assignmentsSyncedAtMs: NOW - 60_000,
        roster: { people: 14, casesWithRoster: 2, boxCases: 2 },
        transmitter: { state: 'connected-no-session', mode: 'listen' },
        internet: { state: 'up', sinceMs: NOW - 3_600_000 },
        etabellaReachable: true,
        // DR23: v1 ships the operator code switched off; the specs that need the eighth line switch it on.
        operatorCodeOn: false,
        operatorCode: { issued: true, issuedAtMs: NOW - 7_200_000, mintedByName: 'Maria Admin' },
        canIssueOperatorCode: true,
        rtProductionUrl: RT,
        diskFreeMB: 212_000,
        clock: { synced: true, offsetMs: 3 },
        ...over,
    };
}

const itemOf = <K extends ReadinessKey>(items: readonly ReadinessItem[], key: K) => items.find(i => i.key === key) as Extract<ReadinessItem, { key: K }>;

const SEVEN: ReadinessKey[] = READINESS_KEYS.filter(k => k !== 'operator-code-issued');

describe('"Ready for today" (DR15; CONTRACTS.md §8.3)', () => {
    it('DR23 default (operator code off): the seven checks in READINESS_KEYS order, no operator-code line', () => {
        const r = evaluateReadiness(input());
        expect(r.items.map(i => i.key)).toEqual(SEVEN);
        expect(r.items).toHaveLength(7);
        expect(r.items.every(i => i.ok && i.level === 'ok' && i.action === null)).toBe(true);
        expect(r.needAttention).toBe(0);
        expect(r.total).toBe(7);
        // Nothing offers or requires the code: even unissued, with a viewer who could mint it, it is not a line.
        const unissued = evaluateReadiness(input({ operatorCode: { issued: false, issuedAtMs: null, mintedByName: null }, canIssueOperatorCode: true }));
        expect(unissued.items.map(i => i.key)).toEqual(SEVEN);
        expect(unissued.needAttention).toBe(0);
        expect(JSON.stringify(unissued)).not.toMatch(/operator-code|issue-operator-code/);
    });

    it('with the operator code switched on: the eight checks in READINESS_KEYS order, all ticked when ready', () => {
        const r = evaluateReadiness(input({ operatorCodeOn: true }));
        expect(r.items.map(i => i.key)).toEqual([...READINESS_KEYS]);
        expect(r.items.every(i => i.ok && i.level === 'ok' && i.action === null)).toBe(true);
        expect(r.needAttention).toBe(0);
        expect(r.total).toBe(8);
    });

    it('box linked: a link failure or no cloud contact today is bad; revoked/quarantined offer diagnostics', () => {
        const unreachable = itemOf(evaluateReadiness(input({ linkFailure: 'unreachable' })).items, 'box-linked');
        expect(unreachable).toMatchObject({ ok: false, level: 'bad', detail: { linked: false, failure: 'unreachable' }, action: { kind: 'run-checks-again', primary: false, href: null } });
        expect(itemOf(evaluateReadiness(input({ linkFailure: 'revoked' })).items, 'box-linked').action?.kind).toBe('download-diagnostics');
        expect(itemOf(evaluateReadiness(input({ linkFailure: 'quarantined' })).items, 'box-linked').action?.kind).toBe('download-diagnostics');
        const stale = itemOf(evaluateReadiness(input({ lastCloudContactAtMs: YESTERDAY_MS })).items, 'box-linked');
        expect(stale).toMatchObject({ ok: false, level: 'bad', detail: { linked: true, lastCloudContactAtMs: YESTERDAY_MS, failure: null } });
        expect(itemOf(evaluateReadiness(input({ lastCloudContactAtMs: null })).items, 'box-linked').ok).toBe(false);
    });

    it("today's sessions: counts today's or live ones, sorted by start; none → warn with the RT Production link", () => {
        const r = evaluateReadiness(
            input({
                sessions: [
                    session({ nSesid: 's3', sessionName: 'Day 3 — Afternoon', startAtMs: NOW + 9_000_000 }),
                    session({ nSesid: 's1', startAtMs: NOW + 1_800_000 }),
                    session({ nSesid: 's0', sessionName: 'Day 2', isToday: false }),
                    session({ nSesid: 's9', sessionName: 'Carried over', isToday: false, liveNow: true, firstLineAtMs: YESTERDAY_MS, startAtMs: null }),
                ],
            }),
        );
        const item = itemOf(r.items, 'sessions-today');
        expect(item.ok).toBe(true);
        expect(item.detail.count).toBe(3);
        expect(item.detail.sessions.map(s => s.nSesid)).toEqual(['s1', 's3', 's9']);
        expect(item.detail.assignmentsSyncedAtMs).toBe(NOW - 60_000);
        const none = itemOf(evaluateReadiness(input({ sessions: [session({ isToday: false })] })).items, 'sessions-today');
        expect(none).toMatchObject({ ok: false, level: 'warn', detail: { count: 0, sessions: [] }, action: { kind: 'open-rt-production', href: RT } });
    });

    it('team lists: every box case needs a roster, synced today; else warn + run checks again', () => {
        expect(itemOf(evaluateReadiness(input()).items, 'team-lists')).toMatchObject({ ok: true, detail: { people: 14, cases: 2, syncedAtMs: NOW - 60_000 } });
        const missing = itemOf(evaluateReadiness(input({ roster: { people: 6, casesWithRoster: 1, boxCases: 2 } })).items, 'team-lists');
        expect(missing).toMatchObject({ ok: false, level: 'warn', action: { kind: 'run-checks-again' } });
        expect(itemOf(evaluateReadiness(input({ assignmentsSyncedAtMs: YESTERDAY_MS })).items, 'team-lists').ok).toBe(false);
        expect(itemOf(evaluateReadiness(input({ assignmentsSyncedAtMs: null })).items, 'team-lists').ok).toBe(false);
        expect(itemOf(evaluateReadiness(input({ roster: { people: 0, casesWithRoster: 0, boxCases: 0 } })).items, 'team-lists').ok).toBe(false);
    });

    it('transmitter connected: ok for connected-no-session, live, quiet; else bad + "Set up transmitter" (secondary)', () => {
        for (const state of ['connected-no-session', 'live', 'quiet'] as const) {
            expect(itemOf(evaluateReadiness(input({ transmitter: { state, mode: 'dial' } })).items, 'transmitter-connected').ok).toBe(true);
        }
        for (const state of ['not-set-up', 'waiting', 'connecting', 'disconnected'] as const) {
            const item = itemOf(evaluateReadiness(input({ transmitter: { state, mode: 'dial' } })).items, 'transmitter-connected');
            expect(item).toMatchObject({ ok: false, level: 'bad', detail: { state, mode: 'dial' }, action: { kind: 'open-transmitter', primary: false } });
        }
    });

    it('eTabella reachable: keeps the internet state apart from reachability (DR16), since when it stopped answering', () => {
        const cant = itemOf(evaluateReadiness(input({ etabellaReachable: false, unreachableSinceMs: NOW - 90_000 })).items, 'etabella-reachable');
        expect(cant).toMatchObject({ ok: false, level: 'bad', detail: { internet: 'up', reachable: false, sinceMs: NOW - 90_000 }, action: { kind: 'open-network-checks' } });
        // Unknown start: null, never the time the internet came up.
        expect(itemOf(evaluateReadiness(input({ etabellaReachable: false })).items, 'etabella-reachable').detail.sinceMs).toBeNull();
        const down = itemOf(evaluateReadiness(input({ etabellaReachable: false, unreachableSinceMs: NOW - 5_000, internet: { state: 'down', sinceMs: NOW - 60_000 } })).items, 'etabella-reachable');
        expect(down.detail).toEqual({ internet: 'down', reachable: false, sinceMs: NOW - 60_000 });
        expect(itemOf(evaluateReadiness(input({ unreachableSinceMs: NOW - 5_000 })).items, 'etabella-reachable').detail).toEqual({ internet: 'up', reachable: true, sinceMs: null });
    });

    it('operator code (switched on): not issued → warn; the primary action only for someone who can mint it here', () => {
        const notIssued = { issued: false, issuedAtMs: null, mintedByName: null };
        const mint = itemOf(evaluateReadiness(input({ operatorCodeOn: true, operatorCode: notIssued, canIssueOperatorCode: true })).items, 'operator-code-issued');
        expect(mint).toMatchObject({ ok: false, level: 'warn', action: { kind: 'issue-operator-code', primary: true, href: null } });
        const elsewhere = itemOf(evaluateReadiness(input({ operatorCodeOn: true, operatorCode: notIssued, canIssueOperatorCode: false })).items, 'operator-code-issued');
        expect(elsewhere.action).toEqual({ kind: 'open-rt-production', primary: false, href: RT });
        expect(itemOf(evaluateReadiness(input({ operatorCodeOn: true })).items, 'operator-code-issued').detail).toEqual({ issued: true, issuedAtMs: NOW - 7_200_000, mintedByName: 'Maria Admin' });
    });

    it('disk free: ok from 20 GB, warn from 10 GB, bad below or unmeasured', () => {
        expect(diskLevel(EDGE_DISK_READY_MIN_MB)).toBe('ok');
        expect(diskLevel(EDGE_DISK_READY_MIN_MB - 1)).toBe('warn');
        expect(diskLevel(EDGE_DISK_ARM_MIN_MB)).toBe('warn');
        expect(diskLevel(EDGE_DISK_ARM_MIN_MB - 1)).toBe('bad');
        expect(diskLevel(null)).toBe('bad');
        const warn = itemOf(evaluateReadiness(input({ diskFreeMB: 15_000 })).items, 'disk-free');
        expect(warn).toMatchObject({ ok: false, level: 'warn', detail: { freeMB: 15_000, minFreeMB: EDGE_DISK_READY_MIN_MB }, action: { kind: 'download-diagnostics' } });
        expect(itemOf(evaluateReadiness(input({ diskFreeMB: null })).items, 'disk-free')).toMatchObject({ level: 'bad', detail: { freeMB: 0 } });
    });

    it('clock: ok synced under 1 s, warn under 5 s, else bad', () => {
        expect(clockLevel({ synced: true, offsetMs: 999 })).toBe('ok');
        expect(clockLevel({ synced: true, offsetMs: -999 })).toBe('ok');
        expect(clockLevel({ synced: true, offsetMs: 1_000 })).toBe('warn');
        expect(clockLevel({ synced: false, offsetMs: 10 })).toBe('warn');
        expect(clockLevel({ synced: true, offsetMs: 4_999 })).toBe('warn');
        expect(clockLevel({ synced: true, offsetMs: 5_000 })).toBe('bad');
        expect(clockLevel({ synced: null, offsetMs: null })).toBe('bad');
        const item = itemOf(evaluateReadiness(input({ clock: { synced: false, offsetMs: 2_400 } })).items, 'clock-in-sync');
        expect(item).toMatchObject({ ok: false, level: 'warn', detail: { synced: false, offsetMs: 2_400 }, action: { kind: 'run-checks-again' } });
    });

    it('"N of 7 need attention" counts the lines not ticked; "2 of 8" only with the operator code on', () => {
        const notIssued = { issued: false, issuedAtMs: null, mintedByName: null };
        const off = evaluateReadiness(input({ etabellaReachable: false, diskFreeMB: 15_000, operatorCode: notIssued }));
        expect([off.needAttention, off.total]).toEqual([2, 7]);
        const on = evaluateReadiness(input({ operatorCodeOn: true, etabellaReachable: false, operatorCode: notIssued }));
        expect([on.needAttention, on.total]).toEqual([2, 8]);
    });

    it('landing until the day\'s first session goes live; firstLiveAtMs is the earliest first line', () => {
        expect(evaluateReadiness(input())).toMatchObject({ landing: true, firstLiveAtMs: null });
        const live = evaluateReadiness(
            input({
                sessions: [
                    session({ nSesid: 'a', firstLineAtMs: NOW - 600_000, liveNow: true }),
                    session({ nSesid: 'b', firstLineAtMs: NOW - 900_000, liveNow: false }),
                    session({ nSesid: 'c', firstLineAtMs: YESTERDAY_MS, liveNow: false }),
                ],
            }),
        );
        expect(live).toMatchObject({ landing: false, firstLiveAtMs: NOW - 900_000 });
        // A session that went live today and has ended still ends the landing view.
        expect(evaluateReadiness(input({ sessions: [session({ firstLineAtMs: NOW - 900_000 })] })).landing).toBe(false);
        // Yesterday's ended session does not.
        expect(evaluateReadiness(input({ sessions: [session({ firstLineAtMs: YESTERDAY_MS })] })).landing).toBe(true);
    });
});
