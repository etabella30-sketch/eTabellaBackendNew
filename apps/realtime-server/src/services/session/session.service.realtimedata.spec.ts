import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { SessionController } from '../../controllers/session/session.controller';
import { SessionService } from './session.service';

const ME = '11111111-1111-4111-8111-111111111111';
const SOMEONE = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '66666666-6666-4666-8666-666666666666';

/**
 * A published transcript s_<SES>.json on disk under a temp REALTIME_PATH; `visible` sessions pass the
 * socket membership SQL. The service is real, so a refused call can be shown to read nothing.
 */
function build(visible: string[], dir: string) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text !== SESSION_ACCESS_SQL) throw new Error(`unexpected query: ${text}`);
      return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
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
});
