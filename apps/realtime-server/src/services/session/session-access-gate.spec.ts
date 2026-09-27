import { ForbiddenException } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { assertCallerCanSeeSessions, callerCanSeeSession, caseOfSession } from './session-access-gate';

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';
const OTHER_SES = '44444444-4444-4444-8444-444444444444';
const CASE = '66666666-6666-4666-8666-666666666666';
const OTHER_CASE = '77777777-7777-4777-8777-777777777777';

const me = { userId: ME, isAdmin: false };

/**
 * rowQuery stub: `visible` are the sessions the membership SQL answers yes for, `cases` maps a
 * session to its RSessionMaster.nCaseid.
 */
function stubDb(visible: string[], cases: Record<string, string> = {}) {
  return {
    rowQuery: jest.fn(async (text: string, params: any[]) => {
      if (text === SESSION_ACCESS_SQL) {
        return { success: true, data: visible.includes(params[0]) ? [{ '?column?': 1 }] : [] };
      }
      if (text.includes('"nCaseid" FROM "RSessionMaster"')) {
        return { success: true, data: cases[params[0]] ? [{ nCaseid: cases[params[0]] }] : [] };
      }
      throw new Error(`unexpected query: ${text}`);
    }),
  };
}

describe('callerCanSeeSession (HTTP use of the socket membership rule)', () => {
  it('runs the socket SESSION_ACCESS_SQL with the session and the token user', async () => {
    const db = stubDb([SES]);
    await expect(callerCanSeeSession(db, me, SES)).resolves.toBe(true);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
  });

  it('refuses a session the membership SQL does not return', async () => {
    await expect(callerCanSeeSession(stubDb([]), me, SES)).resolves.toBe(false);
  });

  it('lets a global admin through without a query', async () => {
    const db = stubDb([]);
    await expect(callerCanSeeSession(db, { userId: ME, isAdmin: true }, SES)).resolves.toBe(true);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('refuses a missing user, a non-UUID id and a failed lookup without trusting anything', async () => {
    const db = stubDb([SES]);
    await expect(callerCanSeeSession(db, undefined, SES)).resolves.toBe(false);
    await expect(callerCanSeeSession(db, { userId: '', isAdmin: true }, SES)).resolves.toBe(false);
    await expect(callerCanSeeSession(db, me, '../x')).resolves.toBe(false);
    await expect(callerCanSeeSession(db, me, null)).resolves.toBe(false);
    expect(db.rowQuery).not.toHaveBeenCalled();
    const failing = { rowQuery: jest.fn().mockResolvedValue({ success: false, error: 'db down' }) };
    await expect(callerCanSeeSession(failing, me, SES)).resolves.toBe(false);
    const throwing = { rowQuery: jest.fn().mockRejectedValue(new Error('connection reset')) };
    await expect(callerCanSeeSession(throwing, me, SES)).resolves.toBe(false);
  });

  it('does not carry a positive answer over to the next request', async () => {
    const db = stubDb([SES]);
    await callerCanSeeSession(db, me, SES);
    await callerCanSeeSession(db, me, SES);
    expect(db.rowQuery).toHaveBeenCalledTimes(2);
  });
});

describe('assertCallerCanSeeSessions', () => {
  it('passes when the caller can see every session given and they belong to nCaseid', async () => {
    const db = stubDb([SES, OTHER_SES], { [SES]: CASE, [OTHER_SES]: CASE });
    await expect(assertCallerCanSeeSessions(db, me, [SES, OTHER_SES], CASE)).resolves.toBeUndefined();
    await expect(assertCallerCanSeeSessions(db, me, [SES, null, undefined, ''], CASE.toUpperCase())).resolves.toBeUndefined();
  });

  it('403 when any given session is not visible to the caller', async () => {
    const db = stubDb([SES], { [SES]: CASE, [OTHER_SES]: CASE });
    await expect(assertCallerCanSeeSessions(db, me, [SES, OTHER_SES], CASE)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('403 when no session is named at all', async () => {
    await expect(assertCallerCanSeeSessions(stubDb([SES]), me, [null, undefined, ''])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("403 when a visible session is paired with another case's id", async () => {
    const db = stubDb([SES], { [SES]: CASE });
    await expect(assertCallerCanSeeSessions(db, me, [SES], OTHER_CASE)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(assertCallerCanSeeSessions(db, { userId: ME, isAdmin: true }, [SES], OTHER_CASE)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('skips the case check only when no nCaseid is sent', async () => {
    const db = stubDb([SES], { [SES]: CASE });
    await expect(assertCallerCanSeeSessions(db, me, [SES])).resolves.toBeUndefined();
    await expect(assertCallerCanSeeSessions(db, me, [SES], null)).resolves.toBeUndefined();
  });
});

describe('caseOfSession', () => {
  it('reads RSessionMaster.nCaseid with a parametrised id and returns null on a miss or a failure', async () => {
    const db = stubDb([], { [SES]: CASE });
    await expect(caseOfSession(db, SES)).resolves.toBe(CASE);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.not.stringContaining(SES), [SES]);
    await expect(caseOfSession(db, OTHER_SES)).resolves.toBeNull();
    await expect(caseOfSession({ rowQuery: jest.fn().mockResolvedValue({ success: false }) }, SES)).resolves.toBeNull();
    await expect(caseOfSession({ rowQuery: jest.fn().mockRejectedValue(new Error('x')) }, SES)).resolves.toBeNull();
  });
});
