import { SessionService } from '../session/session.service';
import { SESSIONS_PROVENANCE_SQL } from './transcript-completeness.service';

/*
 * Characterization of POST session/synssessions (SessionService.syncSessionData), the SECOND session-end
 * path, for sessions that never had a venue box (bEverEdge=false, cApply not 'C': every hearing today).
 * Plan R-T4 / D16, batch-A critic gap: the legacy venue lane syncs its sessions here, and every session the
 * SP hands back with cRStatus 'C' is ended in a different order from sessionEnd: the feed dump is started
 * first and NOT awaited, the schedule cancel comes after it, and the notification carries no nCaseid.
 * Written (and run against the HEAD source) before the D16 gate went into this path.
 *
 * Every collaborator records into one shared list, so the specs pin the order of the steps and their
 * arguments. Provenance is stated, not implied: every session's RSessionMaster row is NON_VENUE below, and
 * rowQuery answers only the gate's one provenance read for the sessions reported closed (the D16 caller
 * specs pin where it runs); any other plain query throws. The file sits in services/transcript-completeness/
 * (the folder this task owns) rather than beside session.service.ts.
 */

/** RSessionMaster provenance of every hearing today: never a venue box, not cut mode, not a split part. */
const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };

const ENDED = '5e551011-0000-4000-8000-0000000000a1';
const ENDED_2 = '5e551011-0000-4000-8000-0000000000a2';
const SCHEDULED = '5e551011-0000-4000-8000-0000000000b1';
const CASE = 'ca5e1011-0000-4000-8000-000000000010';

type Call = [string, ...any[]];

/** A jUpdatedSessions row as et_realtime_sync_sessions builds it (no cTimezone column). */
const updated = (nSesid: string, cRStatus: string) => ({
  nId: nSesid, nSesid, nCaseid: CASE, cStatus: 'C', cMsg: '', cRStatus,
  dDate: '2026-10-01 09:00:00', dEnddt: '2026-10-02 00:00:00', cCasename: 'Smith v Jones', cCaseno: 'ARB/1',
});

const syncBody = () => ({ jSessions: '[]', jUsers: '[]', jServers: '[]', jDeleted: '[]' }) as any;

function build(rows: any[] = [updated(ENDED, 'C')], sp?: any) {
  const calls: Call[] = [];
  const reads: any[][] = [];
  const answer = sp ?? { success: true, data: [[{ msg: 1, jUpdatedSessions: rows }]] };
  const db = {
    executeRef: jest.fn(async (name: string, body: any) => {
      calls.push(['db.executeRef', name, { ...body }]);
      if (name !== 'realtime_sync_sessions') throw new Error(`unexpected SP ${name}`);
      return answer;
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      reads.push([sql, params]);
      if (sql !== SESSIONS_PROVENANCE_SQL) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: (params?.[0] ?? []).map((nSesid: string) => ({ nSesid, ...NON_VENUE })) };
    }),
  };
  const scheduler = {
    cancelJob: jest.fn((jobId: string) => {
      calls.push(['scheduler.cancelJob', jobId]);
    }),
    scheduleTask: jest.fn((jobId: string, at: string) => {
      calls.push(['scheduler.scheduleTask', jobId, at]);
      return jobId;
    }),
  };
  const feedData = {
    sessionEnd: jest.fn(async (nSesid: string): Promise<boolean> => {
      calls.push(['feedData.sessionEnd', nSesid]);
      return true;
    }),
  };
  const eclipseSession = {
    removeEclipseRoute: jest.fn(async (nSesid: string): Promise<void> => {
      calls.push(['eclipseSession.removeEclipseRoute', nSesid]);
    }),
  };
  const ios = {
    server: {
      emit: jest.fn((event: string, payload: any) => {
        calls.push(['ios.server.emit', event, { ...payload }]);
        return true;
      }),
    },
  };
  // Constructor order: db, dateTimeService, annotTransfer, ios, schedulerService, firebaseService, user,
  // config, issueService, feedData, conversionJs, eclipseSession. The unused ones are empty objects.
  const svc: SessionService = new (SessionService as any)(
    db, {}, {}, ios, scheduler, {}, {}, {}, {}, feedData, {}, eclipseSession,
  );
  return { calls, reads, db, scheduler, feedData, eclipseSession, ios, svc };
}

/** Reads other than one provenance read of exactly the closed sessions: must be none. */
const strayReads = (reads: any[][], closed: string[]) =>
  reads.filter(([sql, params], i) => i > 0 || sql !== SESSIONS_PROVENANCE_SQL || JSON.stringify(params?.[0]) !== JSON.stringify(closed));

/** Today's end steps for one session the venue reported closed. */
const endedSteps = (nSesid: string): Call[] => [
  ['feedData.sessionEnd', nSesid],
  ['scheduler.cancelJob', nSesid],
  ['scheduler.cancelJob', `END_${nSesid}`],
  ['eclipseSession.removeEclipseRoute', nSesid],
  ['ios.server.emit', 'on-notification', { msg: 1, nSesid, cStatus: 'E' }],
];

/** Today's reschedule steps for a session that is not closed. */
const rescheduledSteps = (nSesid: string): Call[] => [
  ['scheduler.cancelJob', nSesid],
  ['scheduler.cancelJob', `END_${nSesid}`],
  ['scheduler.scheduleTask', nSesid, '2026-10-01 09:00:00'],
  ['scheduler.scheduleTask', `END_${nSesid}`, '2026-10-02 00:00:00'],
];

describe('SessionService.syncSessionData: the second session-end path (characterization, R-T4 / D16)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it("ends a session the venue reports closed: dump (started first), schedule cancel, route removal, then on-notification 'E' without nCaseid", async () => {
    const { calls, reads, db, svc } = build();
    const body = syncBody();

    const res = await svc.syncSessionData(body);

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_sync_sessions', syncBody()],
      ...endedSteps(ENDED),
    ]);
    expect(strayReads(reads, [ENDED])).toEqual([]);
    // One SP, two arguments: the request object itself, unchanged.
    expect(db.executeRef.mock.calls).toEqual([['realtime_sync_sessions', body]]);
    expect(db.executeRef.mock.calls[0][1]).toBe(body);
    expect(body).toEqual(syncBody());
    expect(res).toEqual({ msg: 1, jUpdatedSessions: [updated(ENDED, 'C')] });
  });

  it('does not wait for the dump: route removal and the notification run while it is still pending', async () => {
    const { calls, feedData, svc } = build();
    feedData.sessionEnd.mockImplementationOnce((nSesid: string) => {
      calls.push(['feedData.sessionEnd', nSesid]);
      return new Promise<boolean>(() => undefined); // never settles
    });

    await expect(svc.syncSessionData(syncBody())).resolves.toEqual({ msg: 1, jUpdatedSessions: [updated(ENDED, 'C')] });

    expect(calls).toEqual([['db.executeRef', 'realtime_sync_sessions', syncBody()], ...endedSteps(ENDED)]);
  });

  it('reschedules a session that is not closed and ends the closed ones, in list order', async () => {
    const { calls, reads, svc } = build([updated(ENDED, 'C'), updated(SCHEDULED, 'P'), updated(ENDED_2, 'C')]);

    await svc.syncSessionData(syncBody());

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_sync_sessions', syncBody()],
      ...endedSteps(ENDED),
      ...rescheduledSteps(SCHEDULED),
      ...endedSteps(ENDED_2),
    ]);
    expect(strayReads(reads, [ENDED, ENDED_2])).toEqual([]);
  });

  it('a failing schedule cancel skips the second cancel only; a failing route removal or emit does not stop the rest', async () => {
    const { calls, scheduler, eclipseSession, ios, svc } = build([updated(ENDED, 'C'), updated(ENDED_2, 'C')]);
    scheduler.cancelJob.mockImplementationOnce((jobId: string) => {
      calls.push(['scheduler.cancelJob', jobId]);
      throw new Error('no such job');
    });
    eclipseSession.removeEclipseRoute.mockImplementationOnce(async (nSesid: string) => {
      calls.push(['eclipseSession.removeEclipseRoute', nSesid]);
      throw new Error('EACCES');
    });
    ios.server.emit.mockImplementationOnce((event: string, payload: any) => {
      calls.push(['ios.server.emit', event, { ...payload }]);
      throw new Error('socket server not ready');
    });

    await svc.syncSessionData(syncBody());

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_sync_sessions', syncBody()],
      ['feedData.sessionEnd', ENDED],
      ['scheduler.cancelJob', ENDED],
      ['eclipseSession.removeEclipseRoute', ENDED],
      ['ios.server.emit', 'on-notification', { msg: 1, nSesid: ENDED, cStatus: 'E' }],
      ...endedSteps(ENDED_2),
    ]);
  });

  it('with no updated sessions nothing but the SP runs', async () => {
    const { calls, reads, svc } = build([]);
    await expect(svc.syncSessionData(syncBody())).resolves.toEqual({ msg: 1, jUpdatedSessions: [] });
    expect(calls).toEqual([['db.executeRef', 'realtime_sync_sessions', syncBody()]]);
    expect(reads).toEqual([]);
  });

  it('when the SP fails nothing else runs and the failure shape comes back', async () => {
    const { calls, reads, svc } = build([], { success: false, error: 'db down' });
    await expect(svc.syncSessionData(syncBody())).resolves.toEqual({ msg: -1, value: 'Failed to fetch', error: 'db down' });
    expect(calls).toEqual([['db.executeRef', 'realtime_sync_sessions', syncBody()]]);
    expect(reads).toEqual([]);
  });
});
