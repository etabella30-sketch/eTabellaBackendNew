import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { PARTS_STATUS_SQL, PRE_MIGRATION_RECHECK_MS, READER_UNGATED_TTL_MS, SESSION_PROVENANCE_SQL, SESSION_SYNC_STATE_SQL, SESSIONS_PROVENANCE_SQL } from './transcript-completeness.service';

/*
 * D16 caller specs for SessionService (spec 4.4, 6.3 RC-4; plan R-T4): where the gate sits in sessionEnd,
 * the second end path (syncSessionData), the deferred end body (completeGatedSessionEnd) and the
 * upload-publish pipeline (updateTranscriptStatus), for non-venue and venue sessions. Every collaborator
 * records into one shared list; the DB stub answers the provenance reads (rowQuery) and the SPs by name.
 * The characterization specs pin today's steps; these pin the one read D16 adds and the venue branches.
 */

const SES = '5e551011-0000-4000-8000-0000000000f1';
const SES_2 = '5e551011-0000-4000-8000-0000000000f2';
const CASE = 'ca5e1011-0000-4000-8000-0000000000f1';
const BOX = 'ed9e0000-0000-4000-8000-0000000000f1';
const ME = '11111111-1111-4111-8111-111111111111';

const NON_VENUE = { bEverEdge: false, cApply: null, nPrevPartSesid: null };
const VENUE = { bEverEdge: true, cApply: null, nPrevPartSesid: null };
const CUT_MODE = { bEverEdge: false, cApply: 'C', nPrevPartSesid: null };

type Call = [string, ...any[]];

const endedRow = (nSesid = SES) => ({ msg: 1, value: 'Session end.', nSesid, nCaseid: CASE });

/** et_rtedge_session_end's row. */
const endRequest = (extra: Record<string, any> = {}) => ({
  msg: 1, value: 'End requested; waiting for the venue seal', bGated: true, bPending: true, bSealed: false, bChanged: true,
  nSesid: SES, cSyncState: 'S', cFeedSource: 'E', cApply: null, nEdgeid: BOX, ...extra,
});

/** r1 / r2 of et_rt_transcript_completeness for an unsplit (gated) session; bUploadPending as the SP computes it. */
const completeness = (cReason: string, cSyncState: string, extra: Record<string, any> = {}) => ({
  success: true,
  data: [
    [{
      msg: 1, value: cReason, nSesid: SES, cReason, cSyncState, cFeedSource: 'E', bEverEdge: true, jIncidents: [], cSealNote: null,
      bUploadPending: ['L', 'S'].includes(cSyncState), ...extra,
    }],
    [{ nOrder: 1, nSesid: SES, nPartNo: null, cFeedSource: 'E', cSyncState, cReason, nPendingOrphans: 0, bCurrent: true }],
  ],
});

interface Db {
  provenance?: Record<string, any> | ((sql: string, params: any[]) => any);
  /** cStatus for the O-4 part-status read (default 'C', ended). */
  status?: Record<string, string>;
  /** cSyncState of a row for isSealed's read (SESSION_SYNC_STATE_SQL), deleted rows included; absent: no row. */
  syncState?: Record<string, string | null>;
  sp?: Record<string, any>;
}

/** The reader's collaborators (session/realtimedatabysesid); every call is recorded. */
interface Reader {
  issueService?: any;
  feedData?: any;
  conversionJs?: any;
}

function build(dbOpts: Db = {}, push?: (nEdgeid: string, assign: any) => any, reader: Reader = {}) {
  const calls: Call[] = [];
  const db = {
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      calls.push(['db.rowQuery', sql, params]);
      const p = dbOpts.provenance;
      if (typeof p === 'function') return p(sql, params);
      if (sql === SESSION_PROVENANCE_SQL) return { success: true, data: [p?.[params[0]] ?? NON_VENUE] };
      if (sql === SESSIONS_PROVENANCE_SQL) return { success: true, data: params[0].map((id: string) => ({ nSesid: id, ...(p?.[id] ?? NON_VENUE) })) };
      if (sql === PARTS_STATUS_SQL) return { success: true, data: params[0].map((id: string) => ({ nSesid: id, cStatus: dbOpts.status?.[id] ?? 'C' })) };
      if (sql === SESSION_SYNC_STATE_SQL) return { success: true, data: dbOpts.syncState && params[0] in dbOpts.syncState ? [{ cSyncState: dbOpts.syncState[params[0]] }] : [] };
      throw new Error(`unexpected query ${sql}`);
    }),
    executeRef: jest.fn(async (name: string, body: any) => {
      calls.push(['db.executeRef', name, { ...body }]);
      const answer = dbOpts.sp?.[name];
      if (answer === undefined) throw new Error(`unexpected SP ${name}`);
      return typeof answer === 'function' ? answer(body) : answer;
    }),
  };
  const scheduler = {
    cancelJob: jest.fn((jobId: string) => { calls.push(['scheduler.cancelJob', jobId]); }),
    scheduleTask: jest.fn((jobId: string, at: string, task: () => any) => { calls.push(['scheduler.scheduleTask', jobId, at]); return jobId; }),
  };
  const feedData = {
    sessionEnd: jest.fn(async (nSesid: string) => { calls.push(['feedData.sessionEnd', nSesid]); return true; }),
    ...(reader.feedData ? reader.feedData(calls) : {}),
  };
  const issueService = reader.issueService ? reader.issueService(calls) : {};
  const conversionJs = reader.conversionJs ? reader.conversionJs(calls) : {};
  const eclipseSession = { removeEclipseRoute: jest.fn(async (nSesid: string) => { calls.push(['eclipseSession.removeEclipseRoute', nSesid]); }) };
  const ios = { server: { emit: jest.fn((event: string, payload: any) => { calls.push(['ios.server.emit', event, { ...payload }]); return true; }) } };
  const edgePush = push ? jest.fn(async (nEdgeid: string, assign: any) => { calls.push(['edgeAssignPush', nEdgeid, assign]); return push(nEdgeid, assign); }) : undefined;
  const annotTransfer = { startTransfer: jest.fn(async (nSesid: string, filePath: string, cProtocol: string) => { calls.push(['annotTransfer.startTransfer', nSesid, filePath, cProtocol]); return { msg: 1 }; }) };
  const config = { get: (key: string) => CONFIG[key] };
  // Constructor order: db, dateTimeService, annotTransfer, ios, schedulerService, firebaseService, user, config,
  // issueService, feedData, conversionJs, eclipseSession, edgeAssignPush (optional).
  const svc: SessionService = new (SessionService as any)(
    db, {}, annotTransfer, ios, scheduler, {}, {}, config, issueService, feedData, conversionJs, eclipseSession, edgePush,
  );
  return { calls, db, scheduler, feedData, eclipseSession, ios, edgePush, annotTransfer, svc };
}

/** Today's sessionEnd steps after SP 'C'. */
const todaysEnd = (nSesid = SES): Call[] => [
  ['db.executeRef', 'realtime_insertupdate_session', { nSesid, nCaseid: CASE, permission: 'C' }],
  ['scheduler.cancelJob', nSesid],
  ['scheduler.cancelJob', `END_${nSesid}`],
  ['feedData.sessionEnd', nSesid],
  ['eclipseSession.removeEclipseRoute', nSesid],
  ['ios.server.emit', 'on-notification', { msg: 1, nSesid, nCaseid: CASE, cStatus: 'E' }],
];
const provenanceRead = (nSesid = SES): Call => ['db.rowQuery', SESSION_PROVENANCE_SQL, [nSesid]];

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const ROOT = 'rt-d16-callers';
const CONFIG: Record<string, string> = {
  ASSETS: `${ROOT}/assets/`,
  ANNOT_TRANSFER_DIR: `${ROOT}/annot-transfer`,
  REALTIME_PATH: `${ROOT}/realtime-transcripts/`,
};

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('sessionEnd with the D16 gate', () => {
  it('a non-venue session: one provenance read first, then exactly today\'s steps (no gate SP)', async () => {
    const { calls, svc } = build({ sp: { realtime_insertupdate_session: { success: true, data: [[endedRow()]] } } });

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual([endedRow()]);

    expect(calls).toEqual([provenanceRead(), ...todaysEnd()]);
  });

  it('before the rt_edge migration (no provenance columns) today\'s steps run', async () => {
    const { calls, svc } = build({
      provenance: () => ({ success: false, error: 'column "bEverEdge" does not exist' }),
      sp: { realtime_insertupdate_session: { success: true, data: [[endedRow()]] } },
    });
    await svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any);
    expect(calls).toEqual([provenanceRead(), ...todaysEnd()]);
  });

  it('a failed provenance read ends nothing and answers like a failed SP', async () => {
    const { calls, svc } = build({ provenance: () => ({ success: false, error: 'db down' }) });
    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual({ msg: -1, value: 'Failed to fetch', error: 'db down' });
    expect(calls).toEqual([provenanceRead()]);
  });

  it('a live venue session: the end is a request (L -> S); the box is told; no dump, no route removal, no E', async () => {
    const { calls, svc } = build(
      { provenance: { [SES]: VENUE }, sp: { rtedge_session_end: { success: true, data: [[endRequest()]] } } },
      () => undefined,
    );

    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual({
      msg: 1, value: 'End requested: waiting for the venue box to upload', pending: true, nSesid: SES, cSyncState: 'S',
    });

    expect(calls).toEqual([
      provenanceRead(),
      ['db.executeRef', 'rtedge_session_end', { nSesid: SES }],
      ['scheduler.cancelJob', SES],
      ['scheduler.cancelJob', `END_${SES}`],
      ['edgeAssignPush', BOX, { op: 'end', nSesid: SES }],
    ]);
  });

  it('without the edge module (no push provider) the request still stands: the box learns it on its next hello', async () => {
    const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: { rtedge_session_end: { success: true, data: [[endRequest()]] } } });
    await expect(svc.sessionEnd({ nSesid: SES } as any)).resolves.toMatchObject({ msg: 1, pending: true });
    expect(calls.map((c) => c[0])).toEqual(['db.rowQuery', 'db.executeRef', 'scheduler.cancelJob', 'scheduler.cancelJob']);
  });

  it('a failing push is logged and the request still stands', async () => {
    const { svc } = build(
      { provenance: { [SES]: VENUE }, sp: { rtedge_session_end: { success: true, data: [[endRequest()]] } } },
      () => { throw new Error('box offline'); },
    );
    await expect(svc.sessionEnd({ nSesid: SES } as any)).resolves.toMatchObject({ msg: 1, pending: true });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(`Venue end push failed for session ${SES}`), expect.any(Error));
  });

  it('a cut-mode cloud-direct session waits for its own seal, and nothing is pushed', async () => {
    const { calls, svc } = build(
      { provenance: { [SES]: CUT_MODE }, sp: { rtedge_session_end: { success: true, data: [[endRequest({ cFeedSource: 'D', cApply: 'C', nEdgeid: null })]] } } },
      () => undefined,
    );
    await expect(svc.sessionEnd({ nSesid: SES } as any)).resolves.toEqual({
      msg: 1, value: 'End requested: waiting for the transcript to be sealed', pending: true, nSesid: SES, cSyncState: 'S',
    });
    expect(calls.map((c) => c[0])).not.toContain('edgeAssignPush');
    expect(calls.map((c) => c[0])).not.toContain('feedData.sessionEnd');
  });

  it('a venue session that is already sealed runs today\'s end steps (the seal ran them; repeating is harmless)', async () => {
    const { calls, svc } = build({
      provenance: { [SES]: VENUE },
      sp: {
        rtedge_session_end: { success: true, data: [[endRequest({ bPending: false, bSealed: true, bChanged: false, cSyncState: 'K' })]] },
        realtime_insertupdate_session: { success: true, data: [[endedRow()]] },
      },
    });
    await expect(svc.sessionEnd({ nSesid: SES, nCaseid: CASE } as any)).resolves.toEqual([endedRow()]);
    expect(calls).toEqual([provenanceRead(), ['db.executeRef', 'rtedge_session_end', { nSesid: SES }], ...todaysEnd()]);
  });

  it('a failing end request ends nothing', async () => {
    const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: { rtedge_session_end: { success: false, error: 'lock timeout' } } });
    await expect(svc.sessionEnd({ nSesid: SES } as any)).resolves.toEqual({ msg: -1, value: 'Failed to fetch', error: 'lock timeout' });
    expect(calls.map((c) => c[0])).toEqual(['db.rowQuery', 'db.executeRef']);
  });

  it('an end request for a deleted or unknown session answers its code and ends nothing', async () => {
    const { calls, svc } = build({
      provenance: { [SES]: VENUE },
      sp: { rtedge_session_end: { success: true, data: [[{ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND' }]] } },
    });
    await expect(svc.sessionEnd({ nSesid: SES } as any)).resolves.toEqual({ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND' });
    expect(calls).toHaveLength(2);
  });

  it('the scheduled end (END_<nSesid>) of a venue session is a request too: nothing is dumped', async () => {
    const { calls, scheduler, svc } = build(
      { provenance: { [SES]: VENUE }, sp: { rtedge_session_end: { success: true, data: [[endRequest()]] } } },
      () => undefined,
    );
    const tasks: Record<string, () => Promise<void>> = {};
    scheduler.scheduleTask.mockImplementation((jobId: string, _at: string, task: () => Promise<void>) => { tasks[jobId] = task; return jobId; });
    svc.sessionSchedular({ nSesid: SES, dDate: '2026-10-01 09:00:00', dEnddt: '2026-10-01 17:00:00' });
    calls.length = 0;

    await tasks[`END_${SES}`]();
    await flush();

    expect(calls).toEqual([
      provenanceRead(),
      ['db.executeRef', 'rtedge_session_end', { nSesid: SES }],
      ['scheduler.cancelJob', SES],
      ['scheduler.cancelJob', `END_${SES}`],
      ['edgeAssignPush', BOX, { op: 'end', nSesid: SES }],
    ]);
  });
});

describe('completeGatedSessionEnd: the deferred end body, run by the seal handler', () => {
  const stateRead = (nSesid = SES): Call => ['db.rowQuery', SESSION_SYNC_STATE_SQL, [nSesid]];
  const endBody = (nSesid = SES): Call[] => [
    ['scheduler.cancelJob', nSesid],
    ['scheduler.cancelJob', `END_${nSesid}`],
    ['feedData.sessionEnd', nSesid],
    ['eclipseSession.removeEclipseRoute', nSesid],
    ['ios.server.emit', 'on-notification', { msg: 1, nSesid, nCaseid: CASE, cStatus: 'E' }],
  ];

  it('refuses, touching nothing, while the session is not sealed', async () => {
    const { calls, svc } = build({ syncState: { [SES]: 'S' } });
    await expect(svc.completeGatedSessionEnd(SES, CASE)).resolves.toEqual({
      msg: -1, value: 'The session is not sealed yet', cCode: 'NOT_SEALED', cSyncState: 'S',
    });
    expect(calls).toEqual([stateRead()]);
  });

  it('refuses when the state cannot be read', async () => {
    const { svc } = build({ provenance: () => ({ success: false, error: 'down' }) });
    await expect(svc.completeGatedSessionEnd(SES)).resolves.toEqual({ msg: -1, value: 'Failed to fetch', cCode: 'UNVERIFIED', cSyncState: null, error: 'down' });
  });

  it.each(['K', 'W', 'F'])("once '%s', runs today's end body: cancel, dump (awaited), route removal, then 'E'", async (state) => {
    const { calls, svc } = build({ syncState: { [SES]: state } });
    await expect(svc.completeGatedSessionEnd(SES, CASE)).resolves.toEqual({ msg: 1, value: 'Session end completed', nSesid: SES, dumped: true, cSyncState: state });
    expect(calls).toEqual([stateRead(), ...endBody()]);
  });

  // Regression (review item 19): the completeness SP answers NOT_FOUND for a soft-deleted row, so a deleted venue
  // session that sealed (or was force-closed) used to be refused NOT_SEALED and the seal handler raised END_BODY_FAILED.
  it.each(['K', 'F'])("a soft-deleted venue session that is '%s' runs the end body too (the completeness SP is not asked)", async (state) => {
    const { calls, svc } = build({
      syncState: { [SES]: state },
      sp: { rt_transcript_completeness: { success: true, data: [[{ msg: -1, value: 'Session not found', cCode: 'NOT_FOUND', bOk: false }], []] } },
    });
    await expect(svc.completeGatedSessionEnd(SES, CASE)).resolves.toMatchObject({ msg: 1, value: 'Session end completed', cSyncState: state });
    expect(calls).toEqual([stateRead(), ...endBody()]);
  });

  it('a session with no row at all is not sealed: nothing runs', async () => {
    const { calls, svc } = build({ syncState: {} });
    await expect(svc.completeGatedSessionEnd(SES, CASE)).resolves.toEqual({ msg: -1, value: 'The session is not sealed yet', cCode: 'NOT_SEALED', cSyncState: null });
    expect(calls).toEqual([stateRead()]);
  });
});

describe('syncSessionData (the second end path) with the D16 gate', () => {
  const row = (nSesid: string, cRStatus: string) => ({
    nId: nSesid, nSesid, nCaseid: CASE, cStatus: 'C', cMsg: '', cRStatus, dDate: '2026-10-01 09:00:00', dEnddt: '2026-10-02 00:00:00',
  });
  const syncSp = (rows: any[]) => ({ realtime_sync_sessions: { success: true, data: [[{ msg: 1, jUpdatedSessions: rows }]] } });
  const endedSteps = (nSesid: string): Call[] => [
    ['feedData.sessionEnd', nSesid],
    ['scheduler.cancelJob', nSesid],
    ['scheduler.cancelJob', `END_${nSesid}`],
    ['eclipseSession.removeEclipseRoute', nSesid],
    ['ios.server.emit', 'on-notification', { msg: 1, nSesid, cStatus: 'E' }],
  ];
  const body = { jSessions: '[]', jUsers: '[]', jServers: '[]', jDeleted: '[]' } as any;

  it('one provenance read for the closed sessions, right after the sync SP; a non-venue session ends as today', async () => {
    const { calls, svc } = build({ sp: syncSp([row(SES, 'C')]) });
    await svc.syncSessionData(body);
    expect(calls).toEqual([
      ['db.executeRef', 'realtime_sync_sessions', body],
      ['db.rowQuery', SESSIONS_PROVENANCE_SQL, [[SES]]],
      ...endedSteps(SES),
    ]);
  });

  it('never ends a venue session (no dump of its cloud copy, no route removal, no E); the others still end', async () => {
    const { calls, svc } = build({ provenance: { [SES]: VENUE }, sp: syncSp([row(SES, 'C'), row(SES_2, 'C')]) });
    await svc.syncSessionData(body);
    expect(calls).toEqual([
      ['db.executeRef', 'realtime_sync_sessions', body],
      ['db.rowQuery', SESSIONS_PROVENANCE_SQL, [[SES, SES_2]]],
      ...endedSteps(SES_2),
    ]);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(`end of session ${SES} skipped (venue or cut-mode session`));
  });

  it('a failed provenance read ends none of the closed sessions this time; reschedules still run', async () => {
    const { calls, svc } = build({
      provenance: () => ({ success: false, error: 'db down' }),
      sp: syncSp([row(SES, 'C'), row(SES_2, 'P')]),
    });
    await svc.syncSessionData(body);
    expect(calls.map((c) => c[0])).toEqual([
      'db.executeRef', 'db.rowQuery',
      'scheduler.cancelJob', 'scheduler.cancelJob', 'scheduler.scheduleTask', 'scheduler.scheduleTask',
    ]);
    expect(calls.filter((c) => c[0] === 'feedData.sessionEnd')).toEqual([]);
  });

  it('no closed session: no read', async () => {
    const { calls, svc } = build({ sp: syncSp([row(SES_2, 'P')]) });
    await svc.syncSessionData(body);
    expect(calls.map((c) => c[0])).not.toContain('db.rowQuery');
  });
});

describe('getRealtimeSessionData (GET session/realtimedatabysesid): uploadPending (spec 4.4, section 7)', () => {
  const PUBLISHED = `${CONFIG.REALTIME_PATH}s_${SES}.json`;
  const DT_DIR = path.join('data', `dt_${SES}`);
  const PAGES = [{ page: 1, data: [['10:00:01:00', [72, 105], 0, 'C', 0, 0, 'u1']] }];
  const query = { nSesid: SES, nUserid: ME, nCaseid: CASE } as any;

  /** Where the transcript is: the published file, the live store (memory) or the data/dt_ pages on disk. */
  function reader(dbOpts: Db, where: 'published' | 'memory' | 'disk' | 'nowhere') {
    const built = build(dbOpts, undefined, {
      issueService: (calls: Call[]) => ({
        getAnnotationOfPages: jest.fn(async (body: any) => { calls.push(['issueService.getAnnotationOfPages', { ...body }]); return [[], []]; }),
      }),
      feedData: (calls: Call[]) => ({
        checkSessionExists: jest.fn((nSesid: string) => { calls.push(['feedData.checkSessionExists', nSesid]); return where === 'memory'; }),
        readSessionData: jest.fn(async (nSesid: string) => { calls.push(['feedData.readSessionData', nSesid]); return { 1: PAGES[0].data }; }),
      }),
      conversionJs: (calls: Call[]) => ({
        pagesFromSessionMap: jest.fn(() => { calls.push(['conversionJs.pagesFromSessionMap']); return PAGES.map((p) => ({ ...p })); }),
        processDirectory: jest.fn((dir: string) => { calls.push(['conversionJs.processDirectory', dir]); return PAGES.map((p) => ({ ...p })); }),
      }),
    });
    const realExists = fs.existsSync;
    jest.spyOn(fs, 'existsSync').mockImplementation(((p: any) => {
      const s = String(p).replace(/\\/g, '/');
      if (s === PUBLISHED) { built.calls.push(['fs.existsSync', 'published']); return where === 'published'; }
      if (s === `data/dt_${SES}`) { built.calls.push(['fs.existsSync', 'dt']); return where === 'disk'; }
      return realExists(p);
    }) as any);
    jest.spyOn(built.svc, 'readJsonFromFile').mockImplementation((async () => { built.calls.push(['readJsonFromFile']); return PAGES.map((p) => ({ ...p })); }) as any);
    return built;
  }

  const memoryRead: Call[] = [
    ['fs.existsSync', 'published'],
    ['feedData.checkSessionExists', SES],
    ['feedData.readSessionData', SES],
    ['conversionJs.pagesFromSessionMap'],
    ['issueService.getAnnotationOfPages', { nSessionid: SES, nUserid: ME, nCaseid: CASE, cTranscript: 'N' }],
  ];
  const venueStateRead: Call[] = [provenanceRead(), ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'X', ref: 2 }]];

  it('a non-venue live session: one provenance read after today\'s reads; the answer is today\'s, without the key', async () => {
    const { calls, svc } = reader({}, 'memory');
    const res = await svc.getRealtimeSessionData(query);
    expect(res).toEqual({ msg: 1, data: PAGES });
    expect(res).not.toHaveProperty('uploadPending');
    expect(calls).toEqual([...memoryRead, provenanceRead()]);
  });

  it.each([['L', true], ['S', true]])("a venue session in '%s' (live store) says uploadPending %s", async (state, pending) => {
    const { calls, svc } = reader({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness('LIVE', state) } }, 'memory');
    await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES, uploadPending: pending });
    expect(calls).toEqual([...memoryRead, ...venueStateRead]);
  });

  it.each(['K', 'W', 'F'])("a sealed venue session ('%s', data/dt_ pages) says uploadPending false", async (state) => {
    const { calls, svc } = reader({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness('COMPLETE', state) } }, 'disk');
    await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES, uploadPending: false });
    expect(calls).toEqual([
      ['fs.existsSync', 'published'],
      ['feedData.checkSessionExists', SES],
      ['fs.existsSync', 'dt'],
      ['conversionJs.processDirectory', DT_DIR],
      ['issueService.getAnnotationOfPages', { nSessionid: SES, nUserid: ME, nCaseid: CASE, cTranscript: 'N' }],
      ...venueStateRead,
    ]);
  });

  it('a cut-mode session in \'S\' says uploadPending true too', async () => {
    const { svc } = reader({ provenance: { [SES]: CUT_MODE }, sp: { rt_transcript_completeness: completeness('AWAITING_SEAL', 'S', { cFeedSource: 'D', bEverEdge: false, cApply: 'C' }) } }, 'memory');
    await expect(svc.getRealtimeSessionData(query)).resolves.toMatchObject({ msg: 1, uploadPending: true });
  });

  it('the published transcript (s_<nSesid>.json) reads nothing more, venue session or not: it passed the publish gate', async () => {
    const { calls, db, svc } = reader({ provenance: { [SES]: VENUE } }, 'published');
    const res = await svc.getRealtimeSessionData(query);
    expect(res).toEqual({ msg: 1, data: PAGES });
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(calls.map((c) => c[0])).toEqual(['fs.existsSync', 'readJsonFromFile', 'issueService.getAnnotationOfPages']);
  });

  it('a failed provenance read leaves today\'s answer (no key) and logs it', async () => {
    const { svc } = reader({ provenance: () => ({ success: false, error: 'db down' }) }, 'memory');
    const res = await svc.getRealtimeSessionData(query);
    expect(res).toEqual({ msg: 1, data: PAGES });
    expect(console.error).toHaveBeenCalledWith(`realtimedatabysesid: upload state of session ${SES} unknown: db down`);
  });

  it('a venue session whose state cannot be read says uploadPending true (the reader warns)', async () => {
    const { svc } = reader({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: { success: false, error: 'down' } } }, 'memory');
    await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES, uploadPending: true });
  });

  it('no transcript anywhere: today\'s { msg: -1 }, no read', async () => {
    const { db, svc } = reader({ provenance: { [SES]: VENUE } }, 'nowhere');
    await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: -1 });
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  // Regression (review item 17): the provenance read ran on every fetch of an unpublished transcript.
  describe('the provenance read is remembered per session, not run on every fetch', () => {
    const T0 = Date.UTC(2026, 9, 2, 10, 0, 0);
    const provenanceReads = (calls: Call[]) => calls.filter((c) => c[0] === 'db.rowQuery' && c[1] === SESSION_PROVENANCE_SQL).length;

    it('a live non-venue session: repeated reader fetches read the provenance once a minute; every answer is today\'s', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
      const { calls, svc } = reader({}, 'memory');
      for (let i = 0; i < 3; i++) await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES });
      expect(provenanceReads(calls)).toBe(1);
      nowSpy.mockReturnValue(T0 + READER_UNGATED_TTL_MS);
      await svc.getRealtimeSessionData(query);
      expect(provenanceReads(calls)).toBe(2);
    });

    it('a venue session stays gated with the edge switched off (EDGE_ENABLED 0): uploadPending is still reported', async () => {
      CONFIG.EDGE_ENABLED = '0';
      try {
        const { calls, svc } = reader({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness('LIVE', 'S') } }, 'memory');
        await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES, uploadPending: true });
        await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES, uploadPending: true });
        expect(provenanceReads(calls)).toBe(1);
      } finally {
        delete CONFIG.EDGE_ENABLED;
      }
    });

    it('before the rt_edge migration: today\'s answer, nothing logged by the reader, one failing read a minute', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0);
      const { calls, svc } = reader({
        provenance: (sql: string) => (sql === SESSION_PROVENANCE_SQL ? { success: false, error: 'column "bEverEdge" does not exist' } : (() => { throw new Error(`unexpected query ${sql}`); })()),
      }, 'memory');
      for (let i = 0; i < 3; i++) await expect(svc.getRealtimeSessionData(query)).resolves.toEqual({ msg: 1, data: PAGES });
      expect(provenanceReads(calls)).toBe(1);
      expect(console.error).not.toHaveBeenCalled();
      nowSpy.mockReturnValue(T0 + PRE_MIGRATION_RECHECK_MS);
      await svc.getRealtimeSessionData(query);
      expect(provenanceReads(calls)).toBe(2);
    });
  });
});

describe('updateTranscriptStatus (the upload-publish pipeline) with the D16 gate', () => {
  const TXT = `${ROOT}/assets/doc/case${CASE}/s_${SES}.TXT`;
  const statusBody = (extra: Record<string, any> = {}) => ({ nSesid: SES, nCaseid: CASE, cFlag: 'P', cProtocol: 'B', nUserid: ME, ...extra }) as any;
  const STATUS_ROW = { msg: 1, value: 'Transcript status updated', nSesid: SES };
  const TRANSFER_DIR = path.resolve(CONFIG.ANNOT_TRANSFER_DIR);
  const REALTIME_DIR = path.resolve(CONFIG.REALTIME_PATH);

  /** Every one of our paths exists; the checks are recorded into the service's call list. */
  const withFs = <T extends { calls: Call[] }>(built: T): T => {
    const realExists = fs.existsSync;
    jest.spyOn(fs, 'existsSync').mockImplementation(((p: any) => {
      if (!String(p).replace(/\\/g, '/').includes(ROOT)) return realExists(p);
      built.calls.push(['fs.existsSync', p]);
      return true;
    }) as any);
    return built;
  };

  it('a non-venue session: the provenance read comes right after the .TXT check, before any folder or transfer step', async () => {
    const { calls, svc } = withFs(build({ sp: { realtime_transcript_upload_status: { success: true, data: [[STATUS_ROW]] } } }));
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toEqual(STATUS_ROW);
    expect(calls).toEqual([
      ['fs.existsSync', TXT],
      provenanceRead(),
      ['fs.existsSync', TRANSFER_DIR],
      ['fs.existsSync', REALTIME_DIR],
      ['annotTransfer.startTransfer', SES, TXT, 'B'],
      ['db.executeRef', 'realtime_transcript_upload_status', statusBody()],
    ]);
  });

  it("a venue session still 'S' is refused before the transfer and before the status SP", async () => {
    const { calls, svc } = withFs(build({ provenance: { [SES]: VENUE }, sp: { rt_transcript_completeness: completeness('AWAITING_SEAL', 'S') } }));
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toMatchObject({
      msg: -1, cCode: 'AWAITING_SEAL', bGated: true,
      value: 'Waiting for the venue box to upload. Publishing is blocked until the transcript is complete.',
    });
    expect(calls).toEqual([
      ['fs.existsSync', TXT],
      provenanceRead(),
      ['db.executeRef', 'rt_transcript_completeness', { nSesid: SES, cPurpose: 'P', ref: 2 }],
    ]);
  });

  it("a complete ('K') venue session publishes and reports its completeness", async () => {
    const { calls, svc } = withFs(build({
      provenance: { [SES]: VENUE },
      sp: { rt_transcript_completeness: completeness('COMPLETE', 'K'), realtime_transcript_upload_status: { success: true, data: [[STATUS_ROW]] } },
    }));
    const res = await svc.updateTranscriptStatus(statusBody());
    expect(res).toMatchObject({ ...STATUS_ROW, completeness: { bGated: true, cSyncState: 'K', bIncomplete: false } });
    expect(calls.map((c) => c[0])).toContain('annotTransfer.startTransfer');
  });

  it("'W' needs the acknowledgement flag: without it refused, with it recorded for the token user and published", async () => {
    const sp = {
      rt_transcript_completeness: completeness('NEEDS_ACK', 'W'),
      rtedge_warn_ack: { success: true, data: [[{ msg: 1 }]] },
      realtime_transcript_upload_status: { success: true, data: [[STATUS_ROW]] },
    };
    const refused = withFs(build({ provenance: { [SES]: VENUE }, sp }));
    await expect(refused.svc.updateTranscriptStatus(statusBody())).resolves.toMatchObject({ msg: -1, cCode: 'NEEDS_ACK' });
    expect(refused.annotTransfer.startTransfer).not.toHaveBeenCalled();

    const acked = withFs(build({ provenance: { [SES]: VENUE }, sp }));
    await expect(acked.svc.updateTranscriptStatus(statusBody({ bAckWarnings: true }))).resolves.toMatchObject({ msg: 1, completeness: { acknowledged: [SES] } });
    expect(acked.calls).toContainEqual(['db.executeRef', 'rtedge_warn_ack', { nSesid: SES, nMasterid: ME }]);
  });

  it("'F' publishes with the INCOMPLETE watermark flag", async () => {
    const { svc } = withFs(build({
      provenance: { [SES]: VENUE },
      sp: {
        rt_transcript_completeness: completeness('FORCED', 'F', { cSealNote: 'venue data missing 10:00:00-10:20:00' }),
        realtime_transcript_upload_status: { success: true, data: [[STATUS_ROW]] },
      },
    }));
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toMatchObject({
      msg: 1, completeness: { bIncomplete: true, cWatermark: 'INCOMPLETE — venue data missing 10:00:00-10:20:00' },
    });
  });

  it('a sealed Part 1 whose cloud-direct legacy Part 2 is still recording is refused before the transfer (O-4)', async () => {
    const PART2 = '5e551011-0000-4000-8000-0000000000f9';
    const chain = {
      success: true,
      data: [
        [{ msg: 1, value: 'COMPLETE', nSesid: SES, cReason: 'COMPLETE', cSyncState: 'K', cFeedSource: 'E', bEverEdge: true, jIncidents: [], nPartNo: 1, nNextPartSesid: PART2 }],
        [
          { nOrder: 1, nSesid: SES, nPartNo: 1, cFeedSource: 'E', cSyncState: 'K', cReason: 'COMPLETE', nPendingOrphans: 0, bCurrent: true },
          { nOrder: 2, nSesid: PART2, nPartNo: 2, cFeedSource: 'D', cSyncState: null, cReason: 'NOT_GATED', nPendingOrphans: 0, bCurrent: false },
        ],
      ],
    };
    const { calls, annotTransfer, svc } = withFs(build({ provenance: { [SES]: VENUE }, status: { [PART2]: 'R' }, sp: { rt_transcript_completeness: chain } }));
    await expect(svc.updateTranscriptStatus(statusBody())).resolves.toMatchObject({
      msg: -1, cCode: 'LIVE', nBlockingPartNo: 2, value: 'Part 2: The session is still live. End it before publishing.',
    });
    expect(calls.slice(-1)).toEqual([['db.rowQuery', PARTS_STATUS_SQL, [[PART2]]]]);
    expect(annotTransfer.startTransfer).not.toHaveBeenCalled();
  });

  it('any other cFlag is not a publish: no read', async () => {
    const { calls, svc } = withFs(build({ sp: { realtime_transcript_upload_status: { success: true, data: [[STATUS_ROW]] } } }));
    await svc.updateTranscriptStatus(statusBody({ cFlag: 'C' }));
    expect(calls.map((c) => c[0])).toEqual(['db.executeRef']);
  });
});
