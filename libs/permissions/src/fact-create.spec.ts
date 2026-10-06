import { DomainError, type RowQuery } from '@app/api-kernel';
import {
  assertCanCreateFact,
  FACT_CREATE_CHECK_FAILED,
  FACT_CREATE_REFUSED,
  FACT_CREATE_TARGET_SQL,
  type FactCreateTargetRow,
  resolveFactCreateTarget,
} from './fact-create';

const CASE = '11111111-1111-4111-8111-111111111111';
const ME = '22222222-2222-4222-8222-222222222222';
const DOC = '33333333-3333-4333-8333-333333333333';
const SES = '44444444-4444-4444-8444-444444444444';
const member = { userId: ME, isPlatformAdmin: false };
const admin = { userId: ME, isPlatformAdmin: true };

const ok: FactCreateTargetRow = { nCaseid: CASE, bCase: true, bMember: true, bDocInCase: true, bSessionInCase: true };

function fakeDb(answer: FactCreateTargetRow[] | Error = [ok]): RowQuery & { rows: jest.Mock } {
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

describe('FACT_CREATE_TARGET_SQL', () => {
  it('resolves the case from $1 or the document, then tests case, active membership, document and live session of that case', () => {
    expect(FACT_CREATE_TARGET_SQL).toContain('COALESCE($1::uuid, (');
    expect(FACT_CREATE_TARGET_SQL).toContain('"CaseMaster" c WHERE c."nCaseid" = t."nCaseid"');
    expect(FACT_CREATE_TARGET_SQL).toContain('tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $2::uuid AND tr."cStatus" = \'A\'');
    expect(FACT_CREATE_TARGET_SQL).toContain('bd."nBundledetailid" = $3::uuid AND s."nCaseid" = t."nCaseid"');
    expect(FACT_CREATE_TARGET_SQL).toContain('r."nSesid" = $4::uuid AND r."nCaseid" = t."nCaseid" AND r."dDelDt" IS NULL');
    expect(FACT_CREATE_TARGET_SQL).toContain('$3::uuid IS NULL OR');
    expect(FACT_CREATE_TARGET_SQL).toContain('$4::uuid IS NULL OR');
    expect(FACT_CREATE_TARGET_SQL).toContain('t."nCaseid"::text AS "nCaseid"');
  });
});

describe('resolveFactCreateTarget / assertCanCreateFact', () => {
  it('lets an active member add a document fact, asking once with [case, caller, doc, null] and answering the case', async () => {
    const db = fakeDb();
    await expect(resolveFactCreateTarget(db, member, { nCaseid: CASE, nBDid: DOC })).resolves.toEqual({ nCaseid: CASE });
    expect(db.rows).toHaveBeenCalledTimes(1);
    expect(db.rows).toHaveBeenCalledWith(FACT_CREATE_TARGET_SQL, [CASE, ME, DOC, null]);
  });

  it('derives the case from the document when the request names none (the v1 routes), lower-cased', async () => {
    const db = fakeDb([{ ...ok, nCaseid: CASE.toUpperCase() }]);
    await expect(resolveFactCreateTarget(db, member, { nBDid: DOC })).resolves.toEqual({ nCaseid: CASE });
    expect(db.rows).toHaveBeenCalledWith(FACT_CREATE_TARGET_SQL, [null, ME, DOC, null]);
  });

  it('refuses without a query when neither a case nor a document is named', async () => {
    const db = fakeDb();
    const err = await caught(() => assertCanCreateFact(db, member, { nSesid: SES }));
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe(FACT_CREATE_REFUSED);
    expect(db.rows).not.toHaveBeenCalled();
  });

  it('asks the host session rule for a transcript fact and refuses when it hides the session', async () => {
    const visible = jest.fn().mockResolvedValue(true);
    await expect(assertCanCreateFact(fakeDb(), member, { nCaseid: CASE, nSesid: SES }, { sessionVisible: visible })).resolves.toBeUndefined();
    expect(visible).toHaveBeenCalledWith(SES);
    const hidden = jest.fn().mockResolvedValue(false);
    const err = await caught(() => assertCanCreateFact(fakeDb(), member, { nCaseid: CASE, nSesid: SES }, { sessionVisible: hidden }));
    expect(err.code).toBe('forbidden');
  });

  it('does not ask the session rule when no session is named', async () => {
    const visible = jest.fn().mockResolvedValue(false);
    await expect(assertCanCreateFact(fakeDb(), member, { nCaseid: CASE, nBDid: DOC }, { sessionVisible: visible })).resolves.toBeUndefined();
    expect(visible).not.toHaveBeenCalled();
  });

  it('refuses a caller who is not an active member, and treats a missing bMember as not a member', async () => {
    for (const row of [{ ...ok, bMember: false }, { ...ok, bMember: undefined }]) {
      const err = await caught(() => assertCanCreateFact(fakeDb([row]), member, { nCaseid: CASE }));
      expect(err.code).toBe('forbidden');
    }
  });

  it('lets a platform admin past the membership test only: case, document and session must still match', async () => {
    await expect(assertCanCreateFact(fakeDb([{ ...ok, bMember: false }]), admin, { nCaseid: CASE })).resolves.toBeUndefined();
    for (const row of [{ ...ok, bCase: false }, { ...ok, bDocInCase: false }, { ...ok, bSessionInCase: false }]) {
      const err = await caught(() => assertCanCreateFact(fakeDb([row]), admin, { nCaseid: CASE, nBDid: DOC, nSesid: SES }));
      expect(err.code).toBe('forbidden');
    }
  });

  it('refuses without a query when an id is present but not a uuid, and reads an empty id as not sent', async () => {
    for (const body of [{ nCaseid: 'x' }, { nCaseid: CASE, nBDid: 'x' }, { nCaseid: CASE, nSesid: 'x' }]) {
      const db = fakeDb();
      const err = await caught(() => assertCanCreateFact(db, member, body));
      expect(err.code).toBe('forbidden');
      expect(db.rows).not.toHaveBeenCalled();
    }
    const db = fakeDb();
    await assertCanCreateFact(db, member, { nCaseid: CASE, nBDid: '', nSesid: null });
    expect(db.rows).toHaveBeenCalledWith(FACT_CREATE_TARGET_SQL, [CASE, ME, null, null]);
  });

  it('refuses without a query when there is no caller, or nMasterid names someone else (R4); same user in another letter case passes', async () => {
    for (const [caller, body] of [
      [null, { nCaseid: CASE }],
      [{ userId: 'nope', isPlatformAdmin: false }, { nCaseid: CASE }],
      [member, { nCaseid: CASE, nMasterid: DOC }],
    ] as const) {
      const db = fakeDb();
      const err = await caught(() => assertCanCreateFact(db, caller, body));
      expect(err.code).toBe('forbidden');
      expect(db.rows).not.toHaveBeenCalled();
    }
    await expect(assertCanCreateFact(fakeDb(), member, { nCaseid: CASE, nMasterid: ME.toUpperCase() })).resolves.toBeUndefined();
  });

  it('answers unavailable (never a refusal) when the lookup throws, and forbidden when it returns no row', async () => {
    const failed = await caught(() => assertCanCreateFact(fakeDb(new Error('boom')), member, { nCaseid: CASE }));
    expect(failed.code).toBe('unavailable');
    expect(failed.message).toBe(FACT_CREATE_CHECK_FAILED);
    const none = await caught(() => assertCanCreateFact(fakeDb([]), member, { nCaseid: CASE }));
    expect(none.code).toBe('forbidden');
  });
});
