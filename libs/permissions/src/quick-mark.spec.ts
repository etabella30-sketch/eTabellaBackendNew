import { DomainError, type RowQuery } from '@app/api-kernel';
import {
  assertCanAddQuickMark,
  assertCanDeleteQuickMark,
  QUICK_MARK_ADD_REFUSED,
  QUICK_MARK_DELETE_REFUSED,
  QUICK_MARK_OWNER_CHECK_FAILED,
  QUICK_MARK_OWNER_SQL,
  QUICK_MARK_SESSION_CHECK_FAILED,
  QUICK_MARK_SESSION_SQL,
} from './quick-mark';

const CASE = '11111111-1111-4111-8111-111111111111';
const ME = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const SES = '44444444-4444-4444-8444-444444444444';
const HID = '55555555-5555-4555-8555-555555555555';
const member = { userId: ME, isPlatformAdmin: false };
const admin = { userId: ME, isPlatformAdmin: true };

function fakeDb(answer: unknown[] | Error = [{ '?column?': 1 }]): RowQuery & { rows: jest.Mock } {
  const fn = jest.fn();
  if (answer instanceof Error) fn.mockRejectedValue(answer);
  else fn.mockResolvedValue(answer);
  return { rows: fn };
}

async function caught(run: () => Promise<unknown>): Promise<DomainError> {
  try {
    await run();
  } catch (err) {
    return err as DomainError;
  }
  throw new Error('expected a refusal');
}

describe('quick-mark SQL', () => {
  it('matches the session to the case, excludes deleted sessions, and binds both ids', () => {
    expect(QUICK_MARK_SESSION_SQL).toContain('r."nSesid" = $1::uuid');
    expect(QUICK_MARK_SESSION_SQL).toContain('r."nCaseid" = $2::uuid');
    expect(QUICK_MARK_SESSION_SQL).toContain('r."dDelDt" IS NULL');
  });

  it('reads the owner of one quick mark by nHid', () => {
    expect(QUICK_MARK_OWNER_SQL).toContain('FROM "RHighlights" WHERE "nHid" = $1::uuid');
    expect(QUICK_MARK_OWNER_SQL).toContain('AS "nUserid"');
  });
});

describe('assertCanAddQuickMark', () => {
  it('allows a caller who can see a live session of the named case, asking [session, case] then the host rule', async () => {
    const db = fakeDb();
    const visible = jest.fn().mockResolvedValue(true);
    await expect(assertCanAddQuickMark(db, member, { nCaseid: CASE, nSessionid: SES }, { sessionVisible: visible })).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenCalledWith(QUICK_MARK_SESSION_SQL, [SES, CASE]);
    expect(visible).toHaveBeenCalledWith(SES);
  });

  it('refuses a caller the host rule hides the session from', async () => {
    const err = await caught(() => assertCanAddQuickMark(fakeDb(), member, { nCaseid: CASE, nSessionid: SES }, { sessionVisible: async () => false }));
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe(QUICK_MARK_ADD_REFUSED);
  });

  it('refuses a session that is not in the named case (or is deleted) before asking the host rule', async () => {
    const visible = jest.fn();
    const err = await caught(() => assertCanAddQuickMark(fakeDb([]), admin, { nCaseid: CASE, nSessionid: SES }, { sessionVisible: visible }));
    expect(err.code).toBe('forbidden');
    expect(visible).not.toHaveBeenCalled();
  });

  it('refuses without a query when either id is missing or not a uuid, or there is no caller', async () => {
    for (const [caller, body] of [
      [member, { nCaseid: CASE }],
      [member, { nSessionid: SES }],
      [member, { nCaseid: 'x', nSessionid: SES }],
      [null, { nCaseid: CASE, nSessionid: SES }],
    ] as const) {
      const db = fakeDb();
      const err = await caught(() => assertCanAddQuickMark(db, caller, body, { sessionVisible: async () => true }));
      expect(err.code).toBe('forbidden');
      expect(db.rows).not.toHaveBeenCalled();
    }
  });

  it('answers unavailable when the session lookup throws', async () => {
    const err = await caught(() => assertCanAddQuickMark(fakeDb(new Error('boom')), member, { nCaseid: CASE, nSessionid: SES }, { sessionVisible: async () => true }));
    expect(err.code).toBe('unavailable');
    expect(err.message).toBe(QUICK_MARK_SESSION_CHECK_FAILED);
  });
});

describe('assertCanDeleteQuickMark', () => {
  it('lets the owner delete, in any letter case', async () => {
    const db = fakeDb([{ nUserid: ME.toUpperCase() }]);
    await expect(assertCanDeleteQuickMark(db, member, HID)).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenCalledWith(QUICK_MARK_OWNER_SQL, [HID]);
  });

  it('refuses someone else\'s mark, lets a platform admin delete any mark', async () => {
    const err = await caught(() => assertCanDeleteQuickMark(fakeDb([{ nUserid: OTHER }]), member, HID));
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe(QUICK_MARK_DELETE_REFUSED);
    await expect(assertCanDeleteQuickMark(fakeDb([{ nUserid: OTHER }]), admin, HID)).resolves.toBeUndefined();
  });

  it('passes when there is no such mark (nothing to protect) and refuses a non-uuid id without a query', async () => {
    await expect(assertCanDeleteQuickMark(fakeDb([]), member, HID)).resolves.toBeUndefined();
    const db = fakeDb();
    const err = await caught(() => assertCanDeleteQuickMark(db, member, 'x'));
    expect(err.code).toBe('forbidden');
    expect(db.rows).not.toHaveBeenCalled();
  });

  it('answers unavailable when the owner lookup throws', async () => {
    const err = await caught(() => assertCanDeleteQuickMark(fakeDb(new Error('boom')), member, HID));
    expect(err.code).toBe('unavailable');
    expect(err.message).toBe(QUICK_MARK_OWNER_CHECK_FAILED);
  });
});
