import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { assertCanAddQuickMark, QUICK_MARK_SESSION_SQL } from './quick-mark-gate';

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '66666666-6666-4666-8666-666666666666';

const member = { userId: ME, isAdmin: false };
const admin = { userId: ME, isAdmin: true };

/** inCase: the session/case row exists; visible: SESSION_ACCESS_SQL finds the caller. */
function dbWith(inCase: any = true, visible = true) {
  return {
    rowQuery: jest.fn(async (text: string) => {
      if (text === QUICK_MARK_SESSION_SQL) {
        if (inCase instanceof Error) throw inCase;
        if (inCase === 'fail') return { success: false, error: 'db down' };
        return { success: true, data: inCase ? [{ '?column?': 1 }] : [] };
      }
      if (text === SESSION_ACCESS_SQL) return { success: true, data: visible ? [{ '?column?': 1 }] : [] };
      return { success: true, data: [] };
    }),
  };
}

describe('assertCanAddQuickMark', () => {
  afterEach(() => jest.restoreAllMocks());

  it('allows a caller who can see a live session of the named case', async () => {
    const db = dbWith();
    await expect(assertCanAddQuickMark(db, member, { nCaseid: CASE, nSessionid: SES })).resolves.toBeUndefined();
    expect(db.rowQuery.mock.calls).toEqual([[QUICK_MARK_SESSION_SQL, [SES, CASE]], [SESSION_ACCESS_SQL, [SES, ME]]]);
  });

  it('refuses a caller who cannot see the session', async () => {
    await expect(assertCanAddQuickMark(dbWith(true, false), member, { nCaseid: CASE, nSessionid: SES }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a session that is not in the named case (or is deleted) before the visibility check', async () => {
    const db = dbWith(false);
    await expect(assertCanAddQuickMark(db, member, { nCaseid: CASE, nSessionid: SES })).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
  });

  it('lets a global admin skip the visibility query only', async () => {
    const db = dbWith(true, false);
    await expect(assertCanAddQuickMark(db, admin, { nCaseid: CASE, nSessionid: SES })).resolves.toBeUndefined();
    expect(db.rowQuery.mock.calls.map((c) => c[0])).toEqual([QUICK_MARK_SESSION_SQL]);
    await expect(assertCanAddQuickMark(dbWith(false), admin, { nCaseid: CASE, nSessionid: SES }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    ['no user', undefined, { nCaseid: CASE, nSessionid: SES }],
    ['a user without a UUID id', { userId: 'x', isAdmin: true }, { nCaseid: CASE, nSessionid: SES }],
    ['no body', member, undefined],
    ['no nCaseid', member, { nSessionid: SES }],
    ['no nSessionid', member, { nCaseid: CASE }],
    ['null ids', member, { nCaseid: null, nSessionid: null }],
    ['a non-UUID nCaseid', member, { nCaseid: '0', nSessionid: SES }],
    ['an array nSessionid', member, { nCaseid: CASE, nSessionid: [SES] }],
  ])('refuses %s without a query', async (_label, user, body) => {
    const db = dbWith();
    await expect(assertCanAddQuickMark(db, user as any, body as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it.each([
    ['returns success: false', 'fail'],
    ['throws', new Error('connection reset')],
  ])('answers 500 when the session lookup %s', async (_label, outcome) => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    await expect(assertCanAddQuickMark(dbWith(outcome), admin, { nCaseid: CASE, nSessionid: SES }))
      .rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('matches the session to the case, excludes deleted sessions, and binds both ids', () => {
    expect(QUICK_MARK_SESSION_SQL).toContain('r."nSesid" = $1::uuid');
    expect(QUICK_MARK_SESSION_SQL).toContain('r."nCaseid" = $2::uuid');
    expect(QUICK_MARK_SESSION_SQL).toContain('r."dDelDt" IS NULL');
  });
});
