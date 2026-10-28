import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { SessionController } from '../../controllers/session/session.controller';
import { LIVE_SESSION_MAX_AGE_HOURS, LIVE_SESSIONS_SQL } from './session-access-gate';
import { SessionService } from './session.service';

const ME = '11111111-1111-4111-8111-111111111111';
const SOMEONE = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '66666666-6666-4666-8666-666666666666';

/**
 * A published transcript s_<SES>.json on disk under a temp REALTIME_PATH; `visible` sessions pass the
 * socket membership SQL; `live` sessions answer bLive=true to the shared LIVE_SESSIONS_SQL (a session
 * with live status whose start is older than the window answers bLive=false, like a closed one). The
 * service is real, so a refused call can be shown to read nothing.
 */
function build(visible: string[], dir: string, live: string[] = []) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text === SESSION_ACCESS_SQL) {
        return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
      }
      if (text === LIVE_SESSIONS_SQL) {
        return { success: true, data: (params[0] as string[]).map((nSesid) => ({ nSesid, bLive: live.includes(nSesid) })) };
      }
      throw new Error(`unexpected query: ${text}`);
    }),
    executeRef: jest.fn(),
  };
  const config = { get: (key: string) => (key === 'REALTIME_PATH' ? dir + path.sep : undefined) };
  const issueService = { getAnnotationOfPages: jest.fn(async () => [[], []]) };
  const feedData = { checkSessionExists: jest.fn(() => false), readSessionData: jest.fn() };
  const svc: SessionService = new (SessionService as any)(
    db, {}, {}, {}, {}, {}, {}, config, issueService, feedData, {}, {},
  );
  const readSpy = jest.spyOn(svc, 'readJsonFromFile');
  const ctrl = new SessionController(svc, {} as any, {} as any);
  const req = (user: any) => ({ user }) as any;
  return { db, svc, ctrl, req, issueService, feedData, readSpy };
}

const query = (extra: Record<string, any> = {}) => ({ nSesid: SES, nUserid: ME, nCaseid: CASE, ...extra }) as any;
const member = { userId: ME, isAdmin: false };

describe('GET session/realtimedatabysesid (session membership)', () => {
  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-sesdata-'));
    fs.writeFileSync(path.join(dir, `s_${SES}.json`), JSON.stringify([{ page: 1, lines: ['secret testimony'] }]));
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));
  afterEach(() => jest.restoreAllMocks());

  it('answers a caller who cannot see the session with "no data", reading no file or annotation', async () => {
    const { db, ctrl, req, issueService, feedData, readSpy } = build([], dir);
    const res = await ctrl.getRealtimeSessionData(query(), req(member));
    expect(res).toEqual({ msg: -1 });
    expect(JSON.stringify(res)).not.toContain('secret');
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(readSpy).not.toHaveBeenCalled();
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
    expect(issueService.getAnnotationOfPages).not.toHaveBeenCalled();
  });

  it('checks the token user, not the nUserid the client sent', async () => {
    const { db, ctrl, req } = build([], dir);
    await ctrl.getRealtimeSessionData(query({ nUserid: SOMEONE }), req(member));
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
  });

  it('refuses a request with no token user or no session id, reading nothing', async () => {
    const { db, ctrl, req, readSpy } = build([SES], dir);
    await expect(ctrl.getRealtimeSessionData(query(), req(undefined))).resolves.toEqual({ msg: -1 });
    await expect(ctrl.getRealtimeSessionData(query({ nSesid: null }), req(member))).resolves.toEqual({ msg: -1 });
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(readSpy).not.toHaveBeenCalled();
  });

  it('returns the transcript to a member of the session as before', async () => {
    const { ctrl, req, issueService } = build([SES], dir);
    const res = await ctrl.getRealtimeSessionData(query(), req(member));
    expect(res).toEqual({ msg: 1, data: [{ page: 1, lines: ['secret testimony'] }] });
    expect(issueService.getAnnotationOfPages).toHaveBeenCalledTimes(1);
  });

  it('returns the transcript to a global admin without the membership query', async () => {
    const { db, ctrl, req } = build([], dir);
    await expect(ctrl.getRealtimeSessionData(query(), req({ userId: ME, isAdmin: true }))).resolves.toMatchObject({ msg: 1 });
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('asks the shared live rule for a member, with the session id and the 18 h window', async () => {
    const { db, ctrl, req } = build([SES], dir);
    await expect(ctrl.getRealtimeSessionData(query(), req(member))).resolves.toMatchObject({ msg: 1 });
    expect(LIVE_SESSION_MAX_AGE_HOURS).toBe(18);
    expect(db.rowQuery).toHaveBeenCalledWith(LIVE_SESSIONS_SQL, [[SES], 18]);
  });
});

/**
 * R3-001: the live transcript is only reachable through the RT page. A member who asks this route for a
 * live session is refused with an explicit code, before the published file, the in-memory live feed or the
 * annotations are read; feed/pages/* is not touched by this gate.
 */
describe('GET session/realtimedatabysesid (live session, R3-001)', () => {
  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-sesdata-live-'));
    fs.writeFileSync(path.join(dir, `s_${SES}.json`), JSON.stringify([{ page: 1, lines: ['live testimony'] }]));
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));
  afterEach(() => jest.restoreAllMocks());

  it('answers a member { msg: -2, code: LIVE_SESSION } for a live session, reading no file, feed or annotation', async () => {
    const { db, ctrl, req, issueService, feedData, readSpy } = build([SES], dir, [SES]);
    const res = await ctrl.getRealtimeSessionData(query(), req(member));
    expect(res).toEqual({ msg: -2, code: 'LIVE_SESSION' });
    expect(JSON.stringify(res)).not.toContain('testimony');
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(db.rowQuery).toHaveBeenCalledWith(LIVE_SESSIONS_SQL, [[SES], LIVE_SESSION_MAX_AGE_HOURS]);
    expect(readSpy).not.toHaveBeenCalled();
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
    expect(feedData.readSessionData).not.toHaveBeenCalled();
    expect(issueService.getAnnotationOfPages).not.toHaveBeenCalled();
  });

  it('refuses the in-memory live feed too: the feed store is never consulted for a live session', async () => {
    const { ctrl, req, feedData, readSpy } = build([SES], dir, [SES]);
    feedData.checkSessionExists.mockReturnValue(true);
    await expect(ctrl.getRealtimeSessionData(query(), req(member))).resolves.toEqual({ msg: -2, code: 'LIVE_SESSION' });
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
    expect(feedData.readSessionData).not.toHaveBeenCalled();
    expect(readSpy).not.toHaveBeenCalled();
  });

  it('still serves a member the same session once the live rule answers bLive=false (ended, or started over 18 h ago)', async () => {
    const { ctrl, req, issueService } = build([SES], dir, []);
    await expect(ctrl.getRealtimeSessionData(query(), req(member))).resolves.toEqual({
      msg: 1,
      data: [{ page: 1, lines: ['live testimony'] }],
    });
    expect(issueService.getAnnotationOfPages).toHaveBeenCalledTimes(1);
  });

  it('still serves a global admin the live session, without asking the live rule', async () => {
    const { db, ctrl, req } = build([], dir, [SES]);
    await expect(ctrl.getRealtimeSessionData(query(), req({ userId: ME, isAdmin: true }))).resolves.toMatchObject({ msg: 1 });
    expect(db.rowQuery).not.toHaveBeenCalledWith(LIVE_SESSIONS_SQL, expect.anything());
  });

  it("still serves a venue box's edge-token request (req.edge) the live session it relays", async () => {
    const { db, ctrl, req, issueService } = build([SES], dir, [SES]);
    const edgeReq = { ...req(member), edge: { edge: 'box-1', cases: [CASE] } } as any;
    await expect(ctrl.getRealtimeSessionData(query(), edgeReq)).resolves.toMatchObject({ msg: 1 });
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(db.rowQuery).not.toHaveBeenCalledWith(LIVE_SESSIONS_SQL, expect.anything());
    expect(issueService.getAnnotationOfPages).toHaveBeenCalledTimes(1);
  });

  it('refuses a member when the live rule cannot be read (fails closed), reading nothing', async () => {
    const { db, ctrl, req, readSpy, feedData } = build([SES], dir, []);
    db.rowQuery.mockImplementation(async (text: string): Promise<any> => {
      if (text === SESSION_ACCESS_SQL) return { success: true, data: [{ '?column?': 1 }] };
      return { success: false, error: 'connection lost' };
    });
    await expect(ctrl.getRealtimeSessionData(query(), req(member))).resolves.toEqual({ msg: -2, code: 'LIVE_SESSION' });
    expect(readSpy).not.toHaveBeenCalled();
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
  });

  it('keeps the membership refusal first: a non-member gets "no data" and the live rule is never asked', async () => {
    const { db, ctrl, req } = build([], dir, [SES]);
    await expect(ctrl.getRealtimeSessionData(query(), req(member))).resolves.toEqual({ msg: -1 });
    expect(db.rowQuery).not.toHaveBeenCalledWith(LIVE_SESSIONS_SQL, expect.anything());
  });
});
