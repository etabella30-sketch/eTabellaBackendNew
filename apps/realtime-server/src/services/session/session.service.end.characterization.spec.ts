import { SessionService } from './session.service';
import { SESSION_PROVENANCE_SQL } from '../transcript-completeness/transcript-completeness.service';

/*
 * Characterization of POST session/sessionend (SessionService.sessionEnd) for a session that never had a
 * venue box (bEverEdge=false, cApply not 'C': every hearing today). Plan R-T4 / D16: written before the
 * transcript-completeness gate goes in and kept green after it. Every collaborator is a stub that records
 * into one shared list, so the specs pin the ORDER of the steps and their real arguments, not only that
 * each step ran.
 *
 * Provenance is stated, not implied (D16 landing, batch-A critic): the session's RSessionMaster row is
 * NON_VENUE below, and the DB stub's rowQuery answers only the gate's provenance read for it. That read is
 * the one query D16 adds to this path (the D16 caller specs pin where it runs); any other plain query
 * throws. executeRef records into the exact sequences, so a completeness SP or any other SP fails these
 * specs.
 */

const SES = '5e551011-0000-4000-8000-000000000010';
const CASE = 'ca5e1011-0000-4000-8000-000000000010';

type Call = [string, ...any[]];

/** The row et_insertupdate_session answers with for permission 'C'. */
const endedRow = (extra: Record<string, any> = {}) => ({ msg: 1, value: 'Session ended', nSesid: SES, nCaseid: CASE, ...extra });

/** RSessionMaster provenance of every hearing today: never a venue box, not cut mode, not a split part. */
const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };

/** Reads that are not the provenance read of `nSesid`, or more than one: must be none. */
const strayReads = (reads: any[][], nSesid: string) =>
  reads.filter(([sql, params], i) => i > 0 || sql !== SESSION_PROVENANCE_SQL || params?.[0] !== nSesid);

function build(sp: any = { success: true, data: [[endedRow()]] }) {
  const calls: Call[] = [];
  const reads: any[][] = [];
  const db = {
    executeRef: jest.fn(async (name: string, body: any) => {
      calls.push(['db.executeRef', name, { ...body }]);
      return sp;
    }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      reads.push([sql, params]);
      if (sql !== SESSION_PROVENANCE_SQL) throw new Error(`unexpected query ${sql}`);
      return { success: true, data: [{ ...NON_VENUE }] };
    }),
  };
  const scheduler = {
    cancelJob: jest.fn((jobId: string) => {
      calls.push(['scheduler.cancelJob', jobId]);
    }),
    scheduleTask: jest.fn(),
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
  // config, issueService, feedData, conversionJs, eclipseSession. The unused ones are empty objects, so
  // sessionEnd touching any of them fails these specs.
  const svc: SessionService = new (SessionService as any)(
    db, {}, {}, ios, scheduler, {}, {}, {}, {}, feedData, {}, eclipseSession,
  );
  return { calls, reads, db, scheduler, feedData, eclipseSession, ios, svc };
}

/** Every call in today's order for SES / CASE. */
const todaysSequence = (spBody: Record<string, any>): Call[] => [
  ['db.executeRef', 'realtime_insertupdate_session', spBody],
  ['scheduler.cancelJob', SES],
  ['scheduler.cancelJob', `END_${SES}`],
  ['feedData.sessionEnd', SES],
  ['eclipseSession.removeEclipseRoute', SES],
  ['ios.server.emit', 'on-notification', { msg: 1, nSesid: SES, nCaseid: CASE, cStatus: 'E' }],
];

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('SessionService.sessionEnd on a non-venue session (characterization, R-T4 / D16)', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it("runs SP 'C', schedule cancel, feed dump, route removal, then on-notification 'E', in that order", async () => {
    const { calls, reads, db, svc } = build();
    const body = { nSesid: SES, nCaseid: CASE } as any;

    const res = await svc.sessionEnd(body);

    expect(calls).toEqual(todaysSequence({ nSesid: SES, nCaseid: CASE, permission: 'C' }));
    // One SP, two arguments (no schema): nothing else is consulted before or after it, apart from at most
    // the one provenance read of this session.
    expect(db.executeRef.mock.calls).toEqual([['realtime_insertupdate_session', body]]);
    expect(strayReads(reads, SES)).toEqual([]);
    // The request object itself is what the SP receives, with permission set on it.
    expect(db.executeRef.mock.calls[0][1]).toBe(body);
    expect(body).toEqual({ nSesid: SES, nCaseid: CASE, permission: 'C' });
    expect(res).toEqual([endedRow()]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("overwrites any permission the caller sent with 'C'", async () => {
    const { calls, svc } = build();
    await svc.sessionEnd({ nSesid: SES, nCaseid: CASE, permission: 'D' } as any);
    expect(calls[0]).toEqual(['db.executeRef', 'realtime_insertupdate_session', { nSesid: SES, nCaseid: CASE, permission: 'C' }]);
    expect(calls).toHaveLength(6);
  });

  it('takes the cancelled job ids and the notification ids from the SP row, the dump and route ids from the request', async () => {
    // The SP echoes the session it ended; distinct values here only show which source each step reads.
    const ROW_SES = '5e551011-0000-4000-8000-0000000000aa';
    const { calls, svc } = build({ success: true, data: [[endedRow({ nSesid: ROW_SES })]] });

    await svc.sessionEnd({ nSesid: SES } as any);

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_insertupdate_session', { nSesid: SES, permission: 'C' }],
      ['scheduler.cancelJob', ROW_SES],
      ['scheduler.cancelJob', `END_${ROW_SES}`],
      ['feedData.sessionEnd', SES],
      ['eclipseSession.removeEclipseRoute', SES],
      // nCaseid comes from the row even when the request carried none.
      ['ios.server.emit', 'on-notification', { msg: 1, nSesid: ROW_SES, nCaseid: CASE, cStatus: 'E' }],
    ]);
  });

  it('waits for the feed dump before removing the route and notifying', async () => {
    const { calls, feedData, svc } = build();
    let finishDump: (ok: boolean) => void;
    feedData.sessionEnd.mockImplementationOnce((nSesid: string) => {
      calls.push(['feedData.sessionEnd', nSesid]);
      return new Promise<boolean>((resolve) => (finishDump = resolve));
    });

    const pending = svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any);
    await flush();
    expect(calls.map((c) => c[0])).toEqual(['db.executeRef', 'scheduler.cancelJob', 'scheduler.cancelJob', 'feedData.sessionEnd']);

    finishDump(true);
    await expect(pending).resolves.toEqual([endedRow()]);
    expect(calls).toEqual(todaysSequence({ nSesid: SES, nCaseid: CASE, permission: 'C' }));
  });

  it('a dump that persisted nothing is logged, and the route removal and notification still run', async () => {
    const { calls, feedData, svc } = build();
    feedData.sessionEnd.mockImplementationOnce(async (nSesid: string) => {
      calls.push(['feedData.sessionEnd', nSesid]);
      return false;
    });

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual([endedRow()]);

    expect(calls).toEqual(todaysSequence({ nSesid: SES, nCaseid: CASE, permission: 'C' }));
    expect(consoleError).toHaveBeenCalledWith(`Feed dump FAILED for session ${SES} — feed not persisted to disk`);
  });

  it('a dump that throws is logged, and the route removal and notification still run', async () => {
    const { calls, feedData, svc } = build();
    const boom = new Error('redis down');
    feedData.sessionEnd.mockImplementationOnce(async (nSesid: string) => {
      calls.push(['feedData.sessionEnd', nSesid]);
      throw boom;
    });

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual([endedRow()]);

    expect(calls).toEqual(todaysSequence({ nSesid: SES, nCaseid: CASE, permission: 'C' }));
    expect(consoleError).toHaveBeenCalledWith(`Feed dump error for session ${SES}:`, boom);
  });

  it('a failing schedule cancel skips the second cancel only; the dump, route removal and notification still run', async () => {
    const { calls, scheduler, svc } = build();
    scheduler.cancelJob.mockImplementationOnce((jobId: string) => {
      calls.push(['scheduler.cancelJob', jobId]);
      throw new Error('no such job');
    });

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual([endedRow()]);

    expect(calls).toEqual([
      ['db.executeRef', 'realtime_insertupdate_session', { nSesid: SES, nCaseid: CASE, permission: 'C' }],
      ['scheduler.cancelJob', SES],
      ['feedData.sessionEnd', SES],
      ['eclipseSession.removeEclipseRoute', SES],
      ['ios.server.emit', 'on-notification', { msg: 1, nSesid: SES, nCaseid: CASE, cStatus: 'E' }],
    ]);
  });

  it('a failing route removal does not stop the notification, and a failing emit does not stop the answer', async () => {
    const { calls, eclipseSession, ios, svc } = build();
    eclipseSession.removeEclipseRoute.mockImplementationOnce(async (nSesid: string) => {
      calls.push(['eclipseSession.removeEclipseRoute', nSesid]);
      throw new Error('EACCES');
    });
    ios.server.emit.mockImplementationOnce((event: string, payload: any) => {
      calls.push(['ios.server.emit', event, { ...payload }]);
      throw new Error('socket server not ready');
    });

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual([endedRow()]);
    expect(calls).toEqual(todaysSequence({ nSesid: SES, nCaseid: CASE, permission: 'C' }));
  });

  it('when the SP fails nothing else runs and the failure shape comes back', async () => {
    const { calls, reads, svc } = build({ success: false, error: 'db down' });

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual({ msg: -1, value: 'Failed to fetch', error: 'db down' });

    expect(calls).toEqual([['db.executeRef', 'realtime_insertupdate_session', { nSesid: SES, nCaseid: CASE, permission: 'C' }]]);
    expect(strayReads(reads, SES)).toEqual([]);
  });

  it("the scheduled end (job END_<nSesid>) runs the same sequence, with permission 'C' and no nCaseid in the request", async () => {
    const { calls, reads, scheduler, svc } = build();
    const tasks: Record<string, () => Promise<void>> = {};
    scheduler.scheduleTask.mockImplementation((jobId: string, _at: string, task: () => Promise<void>) => {
      tasks[jobId] = task;
      return jobId;
    });
    svc.sessionSchedular({ nSesid: SES, dDate: '2026-10-01 09:00:00', dEnddt: '2026-10-01 17:00:00' });
    expect(Object.keys(tasks)).toEqual([SES, `END_${SES}`]);
    calls.length = 0;

    await tasks[`END_${SES}`]();
    // The job does not await sessionEnd: let its promise chain finish.
    await flush();

    expect(calls).toEqual(todaysSequence({ nSesid: SES, permission: 'C' }));
    expect(strayReads(reads, SES)).toEqual([]);
  });
});
