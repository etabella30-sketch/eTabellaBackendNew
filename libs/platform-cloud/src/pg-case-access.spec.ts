import { Caller, DomainError, RowQuery } from '@app/api-kernel';
import { CASE_MEMBER_SQL } from '@app/permissions';
import { CASE_MEMBERSHIP_LOOKUP_FAILED, CASE_NOT_ALLOWED, inCaseScope, NOT_CASE_MEMBER, PgCaseAccess } from './pg-case-access';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const OTHER_CASE = 'ca5e0000-0000-4000-8000-0000000000c2';

const cloud = (extra: Partial<Caller> = {}): Caller => ({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership', ...extra });
const edge = (cases: readonly string[], extra: Partial<Caller> = {}): Caller =>
  ({ userId: ME, family: 'edge-online', isPlatformAdmin: false, caseScope: cases, ...extra });

describe('inCaseScope', () => {
  it('covers every case for a membership caller and only the listed ones (any id case) for a list', () => {
    expect(inCaseScope('membership', OTHER_CASE)).toBe(true);
    expect(inCaseScope([CASE], CASE)).toBe(true);
    expect(inCaseScope([CASE], CASE.toUpperCase())).toBe(true);
    expect(inCaseScope([CASE.toUpperCase()], CASE)).toBe(true);
    expect(inCaseScope([CASE], OTHER_CASE)).toBe(false);
    expect(inCaseScope([], CASE)).toBe(false);
  });
});

describe('PgCaseAccess', () => {
  let rows: jest.Mock;
  let access: PgCaseAccess;
  const member = () => rows.mockResolvedValue([{ '?column?': 1 }]);
  const stranger = () => rows.mockResolvedValue([]);

  beforeEach(() => {
    rows = jest.fn();
    access = new PgCaseAccess({ rows } as unknown as RowQuery);
  });

  it('resolves for a case member, asking the one membership query of @app/permissions with (case, caller)', async () => {
    member();
    await expect(access.assertMember(cloud(), CASE)).resolves.toBeUndefined();
    expect(rows).toHaveBeenCalledTimes(1);
    expect(rows).toHaveBeenCalledWith(CASE_MEMBER_SQL, [CASE, ME]);
  });

  it('refuses a non-member with forbidden / not_case_member', async () => {
    stranger();
    const thrown = await access.assertMember(cloud(), CASE).catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(DomainError);
    expect(thrown).toMatchObject({ code: 'forbidden', message: NOT_CASE_MEMBER, detail: { nCaseid: CASE } });
  });

  it('refuses a non-uuid case or caller id without a query (fails closed, as every live gate does)', async () => {
    await expect(access.assertMember(cloud(), 'not-a-uuid')).rejects.toMatchObject({ code: 'forbidden', message: NOT_CASE_MEMBER });
    await expect(access.assertMember(cloud({ userId: 'admin' }), CASE)).rejects.toMatchObject({ code: 'forbidden', message: NOT_CASE_MEMBER });
    expect(rows).not.toHaveBeenCalled();
  });

  it('exempts a platform admin from the membership query, as the live gates exempt global admins', async () => {
    await expect(access.assertMember(cloud({ isPlatformAdmin: true }), OTHER_CASE)).resolves.toBeUndefined();
    expect(rows).not.toHaveBeenCalled();
  });

  it('reports a failed lookup as unavailable, never as a refusal, keeping the port error in detail', async () => {
    rows.mockRejectedValue(new DomainError('upstream', 'row_query_failed', { error: 'pool closed' }));
    await expect(access.assertMember(cloud(), CASE)).rejects.toMatchObject({
      code: 'unavailable',
      message: CASE_MEMBERSHIP_LOOKUP_FAILED,
      detail: { nCaseid: CASE, error: 'pool closed' },
    });
    rows.mockRejectedValue(new Error('plain'));
    await expect(access.assertMember(cloud(), CASE)).rejects.toMatchObject({ code: 'unavailable', detail: { error: 'plain' } });
  });

  describe('an edge caller (caseScope list)', () => {
    it('is refused for a case outside the list before any query, with the edge branch cCode', async () => {
      const thrown = await access.assertMember(edge([CASE]), OTHER_CASE).catch((e: unknown) => e);
      expect(thrown).toMatchObject({ code: 'forbidden', message: CASE_NOT_ALLOWED, detail: { nCaseid: OTHER_CASE } });
      expect(rows).not.toHaveBeenCalled();
    });

    it('is checked against the list first, even with an admin flag (a list is a ceiling)', async () => {
      await expect(access.assertMember(edge([CASE], { isPlatformAdmin: true }), OTHER_CASE)).rejects.toMatchObject({ message: CASE_NOT_ALLOWED });
      expect(rows).not.toHaveBeenCalled();
    });

    it('then must still be a member of a listed case (the list is not a membership proof)', async () => {
      member();
      await expect(access.assertMember(edge([OTHER_CASE, CASE.toUpperCase()]), CASE)).resolves.toBeUndefined();
      expect(rows).toHaveBeenCalledWith(CASE_MEMBER_SQL, [CASE, ME]);
      stranger();
      await expect(access.assertMember(edge([CASE]), CASE)).rejects.toMatchObject({ code: 'forbidden', message: NOT_CASE_MEMBER });
    });
  });
});
