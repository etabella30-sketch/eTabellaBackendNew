import { CASE_MEMBER_SQL, caseMemberParams, hasCaseMemberRow, isUuidText } from './case-membership';

const CASE = '11111111-1111-4111-8111-111111111111';
const USER = '33333333-3333-4333-8333-333333333333';

describe('case-membership', () => {
  describe('CASE_MEMBER_SQL', () => {
    it('is the plain TeamRelation membership test on ($1 case, $2 user), one row at most', () => {
      expect(CASE_MEMBER_SQL).toContain('FROM "TeamRelation" t');
      expect(CASE_MEMBER_SQL).toContain('t."nCaseid" = $1');
      expect(CASE_MEMBER_SQL).toContain('t."nUserid" = $2');
      expect(CASE_MEMBER_SQL).toMatch(/LIMIT 1$/);
      expect(CASE_MEMBER_SQL).not.toMatch(/\$3/);
    });

    it('carries neither the cStatus test nor the admin exemption: those belong to the create gates', () => {
      expect(CASE_MEMBER_SQL).not.toContain('cStatus');
      expect(CASE_MEMBER_SQL).not.toContain('isAdmin');
      expect(CASE_MEMBER_SQL).not.toContain('UserMaster');
    });
  });

  it.each([
    ['a lower-case uuid', CASE, true],
    ['an upper-case uuid', CASE.toUpperCase(), true],
    ['the nil uuid', '00000000-0000-0000-0000-000000000000', true],
    ['an unhyphenated uuid', CASE.replace(/-/g, ''), false],
    ['a uuid with a trailing character', `${CASE}x`, false],
    ['the string null', 'null', false],
    ['an empty string', '', false],
    ['undefined', undefined, false],
    ['a number', 42, false],
  ])('isUuidText(%s) -> %s', (_label, value, expected) => {
    expect(isUuidText(value)).toBe(expected);
  });

  describe('caseMemberParams', () => {
    it('returns the ($1 case, $2 user) pair for two uuids', () => {
      expect(caseMemberParams(CASE, USER)).toEqual([CASE, USER]);
    });

    it.each([
      ['the case id is not a uuid', 'not-a-case', USER],
      ['the user id is not a uuid', CASE, ''],
      ['both are missing', undefined, null],
    ])('is null (refuse without a query) when %s', (_label, nCaseid, nUserid) => {
      expect(caseMemberParams(nCaseid, nUserid)).toBeNull();
    });
  });

  describe('hasCaseMemberRow', () => {
    it.each([
      ['one row', [{}], true],
      ['several rows', [{ '?column?': 1 }, { '?column?': 1 }], true],
      ['no rows', [], false],
      ['null', null, false],
      ['undefined', undefined, false],
    ])('%s -> %s', (_label, rows, expected) => {
      expect(hasCaseMemberRow(rows as readonly unknown[])).toBe(expected);
    });
  });
});
