import { CASE_ADMIN_ROLE_ID, CASE_ADMIN_SQL, caseAdminParams, isCaseAdminRole } from './case-admin';

const CASE = '11111111-1111-4111-8111-111111111111';
const USER = '33333333-3333-4333-8333-333333333333';

describe('case-admin', () => {
  it('pins the Case Admin RoleMaster id (changing it is a data migration, not a code edit)', () => {
    expect(CASE_ADMIN_ROLE_ID).toBe('8632ee5c-e854-411c-b83d-c21656ad39ac');
  });

  it('caseAdminParams fixes the role id as $3 so a call site cannot ask about another role', () => {
    expect(caseAdminParams(CASE, USER)).toEqual([CASE, USER, CASE_ADMIN_ROLE_ID]);
  });

  it('CASE_ADMIN_SQL tests case, user and role on TeamRelation with double-quoted identifiers', () => {
    expect(CASE_ADMIN_SQL).toContain('FROM "TeamRelation"');
    expect(CASE_ADMIN_SQL).toContain('"nCaseid" = $1');
    expect(CASE_ADMIN_SQL).toContain('"nUserid" = $2');
    expect(CASE_ADMIN_SQL).toContain('"nRoleid" = $3');
    expect(CASE_ADMIN_SQL).not.toMatch(/\$4/);
  });

  it.each([
    ['the id itself', CASE_ADMIN_ROLE_ID, true],
    ['the id in upper case (uuids compare case-insensitively)', CASE_ADMIN_ROLE_ID.toUpperCase(), true],
    ['another role', '00000000-0000-4000-8000-000000000000', false],
    ['null', null, false],
    ['undefined', undefined, false],
    ['a number', 1, false],
  ])('isCaseAdminRole is %s -> %s', (_label, value, expected) => {
    expect(isCaseAdminRole(value)).toBe(expected);
  });
});
