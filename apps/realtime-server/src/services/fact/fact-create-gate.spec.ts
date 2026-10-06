import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SESSION_ACCESS_SQL } from '../../events/realtime-socket-access';
import { FACT_CREATE_TARGET_SQL, assertCanCreateFact } from './fact-create-gate';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';
const CASE = '66666666-6666-4666-8666-666666666666';

const member = { userId: ME, isAdmin: false };
const admin = { userId: ME, isAdmin: true };

type Target = { bCase?: boolean; bMember?: boolean; bDocInCase?: boolean; bSessionInCase?: boolean };
const ALL_TRUE: Target = { bCase: true, bMember: true, bDocInCase: true, bSessionInCase: true };

/** rowQuery stand-in: the create-target row, and whether SESSION_ACCESS_SQL finds the session. */
function dbWith(target: Target | null, sessionVisible = true) {
  return {
    rowQuery: jest.fn(async (text: string) => {
      if (text === FACT_CREATE_TARGET_SQL) return { success: true, data: target ? [target] : [] };
      if (text === SESSION_ACCESS_SQL) return { success: true, data: sessionVisible ? [{ '?column?': 1 }] : [] };
      throw new Error(`unexpected query: ${text}`);
    }),
  };
}

const sqlCalls = (db: { rowQuery: jest.Mock }) => db.rowQuery.mock.calls.map((c) => c[0]);

describe('FACT_CREATE_TARGET_SQL', () => {
  it('checks the case, TeamRelation membership, the document through its section and a live session of that case', () => {
    // 7b: the shared rule (@app/permissions fact-create.ts) resolves the case into t."nCaseid" ($1, or the document's).
    expect(FACT_CREATE_TARGET_SQL).toContain('"CaseMaster" c WHERE c."nCaseid" = t."nCaseid"');
    expect(FACT_CREATE_TARGET_SQL).toContain('"TeamRelation" tr WHERE tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $2::uuid');
    expect(FACT_CREATE_TARGET_SQL).toContain('bd."nBundledetailid" = $3::uuid AND s."nCaseid" = t."nCaseid"');
    expect(FACT_CREATE_TARGET_SQL).toContain('r."nSesid" = $4::uuid AND r."nCaseid" = t."nCaseid" AND r."dDelDt" IS NULL');
    expect(FACT_CREATE_TARGET_SQL).toContain('$3::uuid IS NULL OR');
    expect(FACT_CREATE_TARGET_SQL).toContain('$4::uuid IS NULL OR');
  });

  it('counts only an active team row (cStatus A): a user switched off on the case is not a member', () => {
    // permission/usermanage (et_pm_user_statusmanage) sets TeamRelation.cStatus per user and case.
    const bMember = FACT_CREATE_TARGET_SQL.split('\n').find((line) => line.includes('AS "bMember"'));
    expect(bMember).toContain(`tr."nUserid" = $2::uuid AND tr."cStatus" = 'A')`);
  });
});

describe('assertCanCreateFact', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lets a case member add a document fact, asking with the token user and the ids as sent', async () => {
    const db = dbWith(ALL_TRUE);
    await expect(assertCanCreateFact(db, member, { nMasterid: ME, nCaseid: CASE, nBDid: DOC })).resolves.toBeUndefined();
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_TARGET_SQL, [CASE, ME, DOC, null]);
  });

  it('lets a case member add a transcript fact on a session of that case they can see', async () => {
    const db = dbWith(ALL_TRUE, true);
    await expect(assertCanCreateFact(db, member, { nMasterid: ME, nCaseid: CASE, nSesid: SES })).resolves.toBeUndefined();
    expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_TARGET_SQL, [CASE, ME, null, SES]);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
  });

  it('refuses a caller who is not on the case team (403)', async () => {
    const db = dbWith({ ...ALL_TRUE, bMember: false });
    await expect(assertCanCreateFact(db, member, { nMasterid: ME, nCaseid: CASE, nBDid: DOC })).rejects.toBeInstanceOf(ForbiddenException);
    const quick = dbWith({ ...ALL_TRUE, bMember: false });
    await expect(assertCanCreateFact(quick, member, { nMasterid: ME, nCaseid: CASE, nSesid: SES })).rejects.toBeInstanceOf(ForbiddenException);
    expect(sqlCalls(quick)).not.toContain(SESSION_ACCESS_SQL);
  });

  it('treats a null / missing bMember as not a member', async () => {
    for (const bMember of [null, undefined] as any[]) {
      const db = dbWith({ ...ALL_TRUE, bMember });
      await expect(assertCanCreateFact(db, member, { nCaseid: CASE, nBDid: DOC })).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('lets a global admin add a fact to a case they are not on the team of, without the session query', async () => {
    const db = dbWith({ ...ALL_TRUE, bMember: false });
    await expect(assertCanCreateFact(db, admin, { nMasterid: ME, nCaseid: CASE, nSesid: SES })).resolves.toBeUndefined();
    expect(sqlCalls(db)).toEqual([FACT_CREATE_TARGET_SQL]);
  });

  it('refuses a document of another case, even for a global admin', async () => {
    for (const user of [member, admin]) {
      const db = dbWith({ ...ALL_TRUE, bDocInCase: false });
      await expect(assertCanCreateFact(db, user, { nCaseid: CASE, nBDid: DOC })).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('refuses a session of another case, or a deleted one, even for a global admin', async () => {
    for (const user of [member, admin]) {
      const db = dbWith({ ...ALL_TRUE, bSessionInCase: false });
      await expect(assertCanCreateFact(db, user, { nCaseid: CASE, nSesid: SES })).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('refuses a case that does not exist, even for a global admin', async () => {
    const db = dbWith({ ...ALL_TRUE, bCase: false });
    await expect(assertCanCreateFact(db, admin, { nCaseid: CASE, nBDid: DOC })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a transcript fact on a session the session rule hides from the caller', async () => {
    const db = dbWith(ALL_TRUE, false);
    await expect(assertCanCreateFact(db, member, { nCaseid: CASE, nSesid: SES })).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
  });

  it('refuses without a query when nCaseid is missing or not a UUID (the SP would store it as the case)', async () => {
    for (const nCaseid of [undefined, null, '', 'abc', 0, `${CASE}'--`]) {
      const db = dbWith(ALL_TRUE);
      await expect(assertCanCreateFact(db, admin, { nCaseid, nBDid: DOC } as any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.rowQuery).not.toHaveBeenCalled();
    }
  });

  it('refuses without a query when nBDid or nSesid is present but not a UUID', async () => {
    for (const bad of [{ nBDid: 'x' }, { nSesid: 'x' }, { nBDid: 5 }, { nSesid: {} }]) {
      const db = dbWith(ALL_TRUE);
      await expect(assertCanCreateFact(db, member, { nCaseid: CASE, ...bad } as any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.rowQuery).not.toHaveBeenCalled();
    }
  });

  it('reads an empty nBDid / nSesid as not sent, as the SP does (NULLIF)', async () => {
    const db = dbWith(ALL_TRUE);
    await expect(assertCanCreateFact(db, member, { nCaseid: CASE, nBDid: '', nSesid: null })).resolves.toBeUndefined();
    expect(db.rowQuery).toHaveBeenCalledWith(FACT_CREATE_TARGET_SQL, [CASE, ME, null, null]);
  });

  it('refuses without a query when there is no token user, or nMasterid names someone else', async () => {
    for (const [user, body] of [
      [undefined, { nCaseid: CASE }],
      [{ userId: '', isAdmin: true }, { nCaseid: CASE }],
      [{ userId: 'not-a-uuid', isAdmin: true }, { nCaseid: CASE }],
      [member, { nMasterid: OTHER, nCaseid: CASE }],
      [admin, { nMasterid: 42, nCaseid: CASE }],
    ] as any[]) {
      const db = dbWith(ALL_TRUE);
      await expect(assertCanCreateFact(db, user, body)).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.rowQuery).not.toHaveBeenCalled();
    }
  });

  it('accepts nMasterid in another letter case (the same user)', async () => {
    const db = dbWith(ALL_TRUE);
    await expect(assertCanCreateFact(db, member, { nMasterid: ME.toUpperCase(), nCaseid: CASE })).resolves.toBeUndefined();
  });

  it('answers 500 when the lookup fails, throws or returns no row set, and 403 when it returns no row', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const failing = { rowQuery: jest.fn(async () => ({ success: false, error: 'down' })) };
    await expect(assertCanCreateFact(failing, member, { nCaseid: CASE })).rejects.toBeInstanceOf(InternalServerErrorException);
    const throwing = { rowQuery: jest.fn(async () => { throw new Error('boom'); }) };
    await expect(assertCanCreateFact(throwing, member, { nCaseid: CASE })).rejects.toBeInstanceOf(InternalServerErrorException);
    // 7b: a success answer without rows is read as "no row" (the shared PgRowQuery adapter), so it is a refusal, not a fault.
    const odd = { rowQuery: jest.fn(async () => ({ success: true, data: null })) };
    await expect(assertCanCreateFact(odd, member, { nCaseid: CASE })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(assertCanCreateFact(dbWith(null), admin, { nCaseid: CASE })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
