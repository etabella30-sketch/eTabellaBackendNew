import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { SessionController } from '../../controllers/session/session.controller';
import { SessionService } from './session.service';

const ME = '11111111-1111-4111-8111-111111111111';
const SOMEONE = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';

/** db stub: `visible` sessions pass the socket membership SQL; realtime_insertlog answers like the SP. */
function build(visible: string[]) {
  const db = {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text !== SESSION_ACCESS_SQL) throw new Error(`unexpected query: ${text}`);
      return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
    }),
    executeRef: jest.fn(async () => ({ success: true, data: [[{ msg: 1 }]] })),
  };
  const svc: SessionService = new (SessionService as any)(db);
  const ctrl = new SessionController(svc, {} as any, {} as any);
  const req = (user: any) => ({ user }) as any;
  return { db, svc, ctrl, req };
}

const body = (extra: Record<string, any> = {}) => ({ nSesid: SES, nUserid: ME, cStatus: 'J', cSource: 'L', ...extra }) as any;

describe('POST session/log/join (session membership)', () => {
  it('writes nothing and returns the failure shape for a session the caller cannot see', async () => {
    const { db, ctrl, req } = build([]);
    const res = await ctrl.joiningLog(body(), req({ userId: ME, isAdmin: false }));
    expect(res).toEqual({ msg: -1, value: 'Failed to fetch insert_rtusers', error: 'Not permitted for this session' });
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('refuses a request without a token user or without a session id, writing nothing', async () => {
    const { db, ctrl, req } = build([SES]);
    await expect(ctrl.joiningLog(body(), req(undefined))).resolves.toMatchObject({ msg: -1 });
    await expect(ctrl.joiningLog(body({ nSesid: null }), req({ userId: ME, isAdmin: false }))).resolves.toMatchObject({ msg: -1 });
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('logs a member of the session as the token user', async () => {
    const { db, ctrl, req } = build([SES]);
    await expect(ctrl.joiningLog(body({ nUserid: SOMEONE }), req({ userId: ME, isAdmin: false }))).resolves.toEqual([{ msg: 1 }]);
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('realtime_insertlog', { nSesid: SES, nUserid: ME, cStatus: 'J', cSource: 'L' });
  });

  it('logs the token user even when the client left nUserid out', async () => {
    const { db, ctrl, req } = build([SES]);
    const { nUserid, ...noUser } = body();
    await ctrl.joiningLog(noUser, req({ userId: ME, isAdmin: false }));
    expect(db.executeRef).toHaveBeenCalledWith('realtime_insertlog', expect.objectContaining({ nUserid: ME }));
  });

  it('lets a global admin log any session without the membership query', async () => {
    const { db, ctrl, req } = build([]);
    await expect(ctrl.joiningLog(body(), req({ userId: ME, isAdmin: true }))).resolves.toEqual([{ msg: 1 }]);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('leaves joiningLog (the socket gateway path, already membership-checked) unchanged', async () => {
    const { db, svc } = build([]);
    await expect(svc.joiningLog(body())).resolves.toEqual([{ msg: 1 }]);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });
});
