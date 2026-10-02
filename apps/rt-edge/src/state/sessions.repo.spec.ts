import { EdgePortError, isEdgePortError } from '../ports';
import { assignment, member, snapshot, tempState, TempState } from './testing/fixtures';

const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);

function expectCode(fn: () => unknown, code: string): void {
    let caught: unknown;
    try {
        fn();
    } catch (err) {
        caught = err;
    }
    expect(isEdgePortError(caught)).toBe(true);
    expect((caught as EdgePortError).code).toBe(code);
}

describe('state sessions, assignments and roster (node:sqlite)', () => {
    let t: TempState;

    beforeEach(() => {
        t = tempState();
    });
    afterEach(async () => {
        await t.cleanup();
    });

    describe('SessionsRepo', () => {
        it('adds a pushed session as assigned + listed, frozen, with the start resolved in its zone', () => {
            expect(t.state.sessions.upsertAssignment(assignment('ses-a'), T0)).toBe('added');
            const rec = t.state.sessions.get('ses-a')!;
            expect(rec).toMatchObject({ nSesid: 'ses-a', localState: 'assigned', listed: true, assignedAtMs: T0, updatedAtMs: T0, cloudOp: 'upsert', endRequestedAtMs: null });
            expect(Object.isFrozen(rec)).toBe(true);
            expect(Object.isFrozen(rec.route)).toBe(true);
            expect(rec.route).toEqual({ user: 'user-ses-a', salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 1024 });
            expect(t.state.sessions.get('nope')).toBeNull();
        });

        it('reports unchanged for an identical push and updated for a change, never touching local fields', () => {
            t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
            t.state.sessions.setLocal('ses-a', { localState: 'live', firstLineAtMs: T0 + 5 }, T0 + 10);
            expect(t.state.sessions.upsertAssignment(assignment('ses-a'), T0 + 20)).toBe('unchanged');
            expect(t.state.sessions.upsertAssignment(assignment('ses-a', { cName: 'Day 3 — Morning' }), T0 + 30)).toBe('updated');
            const rec = t.state.sessions.get('ses-a')!;
            expect(rec).toMatchObject({ cName: 'Day 3 — Morning', localState: 'live', firstLineAtMs: T0 + 5, assignedAtMs: T0, updatedAtMs: T0 + 30 });
        });

        it("sets endRequestedAtMs once when cloudOp becomes 'end', and keeps 'end' sticky against a later upsert", () => {
            t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
            expect(t.state.sessions.upsertAssignment(assignment('ses-a', { cloudOp: 'end' }), T0 + 1)).toBe('updated');
            expect(t.state.sessions.get('ses-a')).toMatchObject({ cloudOp: 'end', endRequestedAtMs: T0 + 1 });
            expect(t.state.sessions.upsertAssignment(assignment('ses-a', { cloudOp: 'end' }), T0 + 2)).toBe('unchanged');
            expect(t.state.sessions.upsertAssignment(assignment('ses-a'), T0 + 3)).toBe('unchanged');
            expect(t.state.sessions.get('ses-a')).toMatchObject({ cloudOp: 'end', endRequestedAtMs: T0 + 1 });
            // A session first seen already ended records the request at once.
            t.state.sessions.upsertAssignment(assignment('ses-b', { cloudOp: 'end' }), T0 + 4);
            expect(t.state.sessions.get('ses-b')).toMatchObject({ cloudOp: 'end', endRequestedAtMs: T0 + 4 });
        });

        it('requestEnd is idempotent and keeps the first time; unknown or purged sessions are session_not_found', () => {
            t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
            expect(t.state.sessions.requestEnd('ses-a', T0 + 5)).toMatchObject({ cloudOp: 'end', endRequestedAtMs: T0 + 5 });
            expect(t.state.sessions.requestEnd('ses-a', T0 + 9)).toMatchObject({ cloudOp: 'end', endRequestedAtMs: T0 + 5 });
            expectCode(() => t.state.sessions.requestEnd('ghost', T0), 'session_not_found');
            t.state.sessions.purge('ses-a', T0 + 10);
            expectCode(() => t.state.sessions.requestEnd('ses-a', T0 + 11), 'session_not_found');
        });

        it('setLocal patches only box-local fields, validates them and stamps updatedAtMs', () => {
            t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
            const rec = t.state.sessions.setLocal('ses-a', { localState: 'ending', endedAtMs: T0 + 7, sealState: 'W', sealedAtMs: T0 + 8 }, T0 + 9);
            expect(rec).toMatchObject({ localState: 'ending', endedAtMs: T0 + 7, sealState: 'W', sealedAtMs: T0 + 8, updatedAtMs: T0 + 9 });
            expectCode(() => t.state.sessions.setLocal('ses-a', { localState: 'bogus' as never }, T0), 'invalid_request');
            expectCode(() => t.state.sessions.setLocal('ses-a', { cName: 'x' } as never, T0), 'invalid_request');
            expectCode(() => t.state.sessions.setLocal('ses-a', { sealState: 'X' as never }, T0), 'invalid_request');
            expectCode(() => t.state.sessions.setLocal('ses-a', { endedAtMs: Number.NaN }, T0), 'invalid_request');
            expectCode(() => t.state.sessions.setLocal('ghost', { localState: 'live' }, T0), 'session_not_found');
        });

        it('purge deletes room codes, incidents and uploaded captures, keeps a tombstone, and is never resurrected', () => {
            t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
            t.state.roomCodes.insert({ id: 'rc1', nSesid: 'ses-a', nCaseid: 'case-1', nUserid: 'u-2', codeHash: 'h1', issuedAtMs: T0, issuedBy: { nUserid: 'u-admin', name: 'P', via: 'online', operatorName: null }, replacedId: null });
            t.state.incidents.record({ nSesid: 'ses-a', seq: 4, atMs: T0, kind: 'CAT_DISCONNECT', level: 'info' });
            const capture = { id: 'cap1', nSesid: 'ses-a', kind: 'C' as const, user: 'u', peer: '10.0.0.9', fromMs: T0, toMs: T0 + 1, bytes: 3, sha256: 'ab', file: '/x', uploadedAtMs: null, nOrphanid: null };
            t.state.heldCaptures.upsert(capture);
            t.state.heldCaptures.upsert({ ...capture, id: 'cap2', uploadedAtMs: T0 + 2, nOrphanid: 'o1' });
            const tomb = t.state.sessions.purge('ses-a', T0 + 100);
            expect(tomb).toMatchObject({ localState: 'purged', purgedAtMs: T0 + 100 });
            expect(t.state.sessions.purge('ses-a', T0 + 200)).toMatchObject({ purgedAtMs: T0 + 100 });
            expect(t.state.roomCodes.get('rc1')).toBeNull();
            expect(t.state.incidents.list('ses-a')).toEqual([]);
            expect(t.state.heldCaptures.get('cap1')).not.toBeNull(); // not uploaded yet: kept
            expect(t.state.heldCaptures.get('cap2')).toBeNull();
            expect(t.state.sessions.list().map(s => s.nSesid)).toEqual([]);
            expect(t.state.sessions.list({ includePurged: true }).map(s => s.nSesid)).toEqual(['ses-a']);
            expect(t.state.sessions.upsertAssignment(assignment('ses-a'), T0 + 300)).toBe('unchanged');
            expect(t.state.sessions.get('ses-a')!.localState).toBe('purged');
            expectCode(() => t.state.sessions.purge('ghost', T0), 'session_not_found');
        });

        it('lists by real start (null last, then id) and filters by case without tombstones', () => {
            t.state.sessions.upsertAssignment(assignment('ses-c', { dStartDt: null }), T0);
            t.state.sessions.upsertAssignment(assignment('ses-b', { dStartDt: '2026-10-01 14:00:00' }), T0);
            t.state.sessions.upsertAssignment(assignment('ses-a', { dStartDt: '2026-10-01 10:00:00', tz: 'Asia/Kolkata' }), T0); // 04:30 UTC
            t.state.sessions.upsertAssignment(assignment('ses-d', { dStartDt: '2026-10-01 09:00:00', nCaseid: 'case-2' }), T0); // 08:00 UTC
            expect(t.state.sessions.list().map(s => s.nSesid)).toEqual(['ses-a', 'ses-d', 'ses-b', 'ses-c']);
            expect(t.state.sessions.forCase('case-1').map(s => s.nSesid)).toEqual(['ses-a', 'ses-b', 'ses-c']);
            t.state.sessions.purge('ses-b', T0);
            expect(t.state.sessions.forCase('case-1').map(s => s.nSesid)).toEqual(['ses-a', 'ses-c']);
        });

        it('rejects malformed assignments', () => {
            expectCode(() => t.state.sessions.upsertAssignment(assignment('bad id/../x'), T0), 'invalid_request');
            expectCode(() => t.state.sessions.upsertAssignment({ ...assignment('ses-a'), nCaseid: '' }, T0), 'invalid_request');
        });

        it('persists across a reopen (WAL file, same schema)', async () => {
            t.state.sessions.upsertAssignment(assignment('ses-a'), T0);
            await t.state.close();
            const again = t.reopen();
            expect(again.sessions.get('ses-a')).toMatchObject({ nSesid: 'ses-a', localState: 'assigned' });
        });
    });

    describe('AssignmentsRepo.replaceAll', () => {
        it('applies a full pull atomically and reports exactly what changed', () => {
            const diff = t.state.assignments.replaceAll(snapshot(), T0);
            expect(diff).toEqual({
                atMs: T0,
                full: true,
                sessionsAdded: ['ses-a'],
                sessionsUpdated: [],
                sessionsEndRequested: [],
                sessionsUnlisted: [],
                sessionsPurged: [],
                casesAdded: ['case-1'],
                casesRemoved: [],
                rosterChanged: true,
                operatorCodeChanged: false,
            });
            expect(t.state.assignments.syncedAtMs()).toBe(T0);
            expect(t.state.assignments.cases()).toEqual([{ nCaseid: 'case-1', cCasename: 'Acme v Beta', cCaseno: 'HC-2026-001', assignedAtMs: null }]);
            expect(t.state.assignments.case('case-1')!.cCasename).toBe('Acme v Beta');
            expect(t.state.assignments.case('nope')).toBeNull();

            // The same pull again: nothing changed but freshness.
            const again = t.state.assignments.replaceAll(snapshot(), T0 + 1);
            expect(again).toMatchObject({ sessionsAdded: [], sessionsUpdated: [], casesAdded: [], casesRemoved: [], rosterChanged: false, operatorCodeChanged: false });
            expect(t.state.assignments.syncedAtMs()).toBe(T0 + 1);
        });

        it('keeps sessions absent from a pull (listed:false), reports end transitions once, and replaces cases wholesale', () => {
            t.state.assignments.replaceAll(snapshot({ sessions: [assignment('ses-a'), assignment('ses-b')] }), T0);
            const diff = t.state.assignments.replaceAll(
                snapshot({
                    sessions: [assignment('ses-a', { cloudOp: 'end' }), assignment('ses-c')],
                    cases: [{ nCaseid: 'case-2', cCasename: 'Other', cCaseno: '2', assignedAtMs: T0 }],
                }),
                T0 + 5,
            );
            expect(diff).toMatchObject({
                sessionsAdded: ['ses-c'],
                sessionsUpdated: ['ses-a'],
                sessionsEndRequested: ['ses-a'],
                sessionsUnlisted: ['ses-b'],
                casesAdded: ['case-2'],
                casesRemoved: ['case-1'],
            });
            expect(t.state.sessions.get('ses-b')).toMatchObject({ listed: false });
            expect(t.state.sessions.get('ses-a')).toMatchObject({ cloudOp: 'end', endRequestedAtMs: T0 + 5 });
            // The end is a transition: not reported by the next pull.
            const next = t.state.assignments.replaceAll(snapshot({ sessions: [assignment('ses-a', { cloudOp: 'end' }), assignment('ses-c'), assignment('ses-b')] }), T0 + 6);
            expect(next.sessionsEndRequested).toEqual([]);
            expect(next.sessionsUpdated).toEqual(['ses-b']); // listed again
        });

        it('stores a delivered operator-code hash without resetting the day\'s uses on a repeat', () => {
            const code = { day: '2026-10-01', alg: 'scrypt' as const, salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 16384, issuedAtMs: T0, mintedBy: { nUserid: 'u-admin', name: 'Priya Shah' } };
            expect(t.state.assignments.replaceAll(snapshot({ operatorCode: code }), T0).operatorCodeChanged).toBe(true);
            t.state.operatorCodes.recordUse('2026-10-01', T0 + 1);
            expect(t.state.assignments.replaceAll(snapshot({ operatorCode: code }), T0 + 2).operatorCodeChanged).toBe(false);
            expect(t.state.operatorCodes.get('2026-10-01')).toMatchObject({ uses: 1, source: 'assignments' });
            expect(t.state.assignments.replaceAll(snapshot({ operatorCode: { ...code, hash: 'bmV3' } }), T0 + 3).operatorCodeChanged).toBe(true);
            expect(t.state.operatorCodes.get('2026-10-01')).toMatchObject({ uses: 0, hash: 'bmV3' });
            // null leaves the stored hash alone
            expect(t.state.assignments.replaceAll(snapshot({ operatorCode: null }), T0 + 4).operatorCodeChanged).toBe(false);
            expect(t.state.operatorCodes.get('2026-10-01')!.hash).toBe('bmV3');
        });

        it('rolls the whole pull back when a session is malformed', () => {
            t.state.assignments.replaceAll(snapshot(), T0);
            expect(() => t.state.assignments.replaceAll(snapshot({ sessions: [assignment('ses-z'), { ...assignment('bad'), nCaseid: '' }] }), T0 + 1)).toThrow(EdgePortError);
            expect(t.state.sessions.get('ses-z')).toBeNull();
            expect(t.state.assignments.syncedAtMs()).toBe(T0);
        });

        it('markSynced proves freshness without a change', () => {
            expect(t.state.assignments.syncedAtMs()).toBeNull();
            t.state.assignments.markSynced(T0 + 42);
            expect(t.state.assignments.syncedAtMs()).toBe(T0 + 42);
        });
    });

    describe('RosterRepo', () => {
        beforeEach(() => {
            t.state.assignments.replaceAll(
                snapshot({
                    sessions: [assignment('ses-a'), assignment('ses-x', { nCaseid: 'case-2' })],
                    cases: [
                        { nCaseid: 'case-1', cCasename: 'Acme', cCaseno: '1', assignedAtMs: null },
                        { nCaseid: 'case-2', cCasename: 'Zed', cCaseno: '2', assignedAtMs: null },
                    ],
                    roster: [
                        member('u-admin', { isCaseAdmin: true, name: 'Priya Shah' }),
                        member('u-2', { name: 'Daniel Okafor' }),
                        member('u-3', { name: 'Ann Old', active: false }),
                        member('u-4', { name: 'Bea Guest', source: 'session', nSesid: 'ses-a' }),
                        member('u-2', { name: 'Daniel Okafor', source: 'session', nSesid: 'ses-a' }),
                        member('u-5', { name: 'Carl Other', nCaseid: 'case-2' }),
                    ],
                }),
                T0,
            );
        });

        it('forCase lists the team and session assignees by name, inactive included', () => {
            expect(t.state.roster.forCase('case-1').map(m => `${m.name}/${m.source}`)).toEqual([
                'Ann Old/team',
                'Bea Guest/session',
                'Daniel Okafor/session',
                'Daniel Okafor/team',
                'Priya Shah/team',
            ]);
        });

        it('forSession is active team rows of the case ∪ active assignees, one row per person', () => {
            const people = t.state.roster.forSession('ses-a');
            expect(people.map(m => `${m.nUserid}/${m.source}`)).toEqual(['u-4/session', 'u-2/team', 'u-admin/team']);
            expect(t.state.roster.forSession('ses-x').map(m => m.nUserid)).toEqual(['u-5']);
            expect(t.state.roster.forSession('ghost')).toEqual([]);
        });

        it('forUser, person, super-admins and counts', () => {
            expect(t.state.roster.forUser('u-2').map(m => m.source)).toEqual(['session', 'team']);
            expect(t.state.roster.forUser('u-3')).toEqual([]); // inactive grants nothing
            expect(t.state.roster.person('u-2')).toEqual({ nUserid: 'u-2', name: 'Daniel Okafor', email: 'u-2@example.test' });
            expect(t.state.roster.person('u-super')).toEqual({ nUserid: 'u-super', name: 'Sam Root', email: null });
            expect(t.state.roster.person('nobody')).toBeNull();
            expect(t.state.roster.superAdmins().map(p => p.nUserid)).toEqual(['u-super']);
            expect(t.state.roster.isSuperAdmin('u-super')).toBe(true);
            expect(t.state.roster.isSuperAdmin('u-admin')).toBe(false);
            expect(t.state.roster.counts()).toEqual({ people: 4, cases: 2 });
        });
    });
});
