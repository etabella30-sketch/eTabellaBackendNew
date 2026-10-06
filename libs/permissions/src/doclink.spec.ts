import { DomainError, type RowQuery } from '@app/api-kernel';
import {
  assertCanDeleteDocLink,
  assertDocLinkTargetsInCase,
  DOCLINK_DELETE_ACCESS_SQL,
  DOCLINK_DELETE_CHECK_FAILED,
  DOCLINK_DELETE_REFUSED,
  DOCLINK_TARGETS_IN_CASE_SQL,
  DOCLINK_TARGETS_REFUSED,
  DOCLINK_VIEW_CHECK_FAILED,
  DOCLINK_VIEW_SQL,
  docLinkTargetIds,
  parseDocIds,
  viewableDocLinkIds,
} from './doclink';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = '22222222-2222-4222-8222-222222222222';
const MINE = '33333333-3333-4333-8333-333333333333';
const SHARED = '44444444-4444-4444-8444-444444444444';
const OTHERS = '55555555-5555-4555-8555-555555555555';
const LINK = '66666666-6666-4666-8666-666666666666';
const DOC_A = '77777777-7777-4777-8777-777777777777';
const DOC_B = '88888888-8888-4888-8888-888888888888';

function fakeDb(answer: unknown[] | Error): RowQuery & { rows: jest.Mock } {
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

describe('doclink SQL', () => {
  it('view: the owner or a DMShared recipient, over every id asked ($1 uuid[], $2 caller), no admin bypass', () => {
    expect(DOCLINK_VIEW_SQL).toContain('d."nDocid" = ANY($1::uuid[])');
    expect(DOCLINK_VIEW_SQL).toContain('d."nUserid" = $2');
    expect(DOCLINK_VIEW_SQL).toContain('"DMShared" s WHERE s."nDocid" = d."nDocid" AND s."nUserid" = $2');
    expect(DOCLINK_VIEW_SQL).not.toMatch(/isAdmin/);
  });

  it('delete: the owner of $1, and $3 (when sent) one of its links', () => {
    expect(DOCLINK_DELETE_ACCESS_SQL).toContain('d."nDocid" = $1::uuid');
    expect(DOCLINK_DELETE_ACCESS_SQL).toContain('d."nUserid" = $2::uuid');
    expect(DOCLINK_DELETE_ACCESS_SQL).toContain('$3::uuid IS NULL OR EXISTS');
    expect(DOCLINK_DELETE_ACCESS_SQL).toContain('l."nDMLids" = $3::uuid AND l."nDocid" = d."nDocid"');
  });

  it('targets: documents of the case through their section', () => {
    expect(DOCLINK_TARGETS_IN_CASE_SQL).toContain('bd."nBundledetailid" = ANY($2::uuid[]) AND s."nCaseid" = $1::uuid');
  });
});

describe('parseDocIds / docLinkTargetIds', () => {
  it('reads the JSON array or the single JSON string the frontends send; anything else is null', () => {
    expect(parseDocIds(JSON.stringify([MINE, SHARED]))).toEqual([MINE, SHARED]);
    expect(parseDocIds(JSON.stringify(MINE))).toEqual([MINE]);
    expect(parseDocIds('{not json')).toBeNull();
    expect(parseDocIds(JSON.stringify([1, 2]))).toBeNull();
    expect(parseDocIds(undefined)).toBeNull();
  });

  it('reads jDl tuples as et_doc_insert does: first items, lower-cased, distinct, empty ones skipped, non-uuid refused', () => {
    expect(docLinkTargetIds(JSON.stringify([[DOC_A, 'P', [], []], [DOC_A.toUpperCase(), 'P', [], []], ['', 'P', [], []], [DOC_B]]))).toEqual([DOC_A, DOC_B]);
    expect(docLinkTargetIds(JSON.stringify([['folder:abc', 'P']]))).toBeNull();
    expect(docLinkTargetIds(JSON.stringify(['x']))).toEqual([]); // a non-list element names no target
    expect(docLinkTargetIds('[]')).toEqual([]);
    expect(docLinkTargetIds(undefined)).toBeNull();
    expect(docLinkTargetIds('{not json')).toBeNull();
  });
});

describe('viewableDocLinkIds', () => {
  it('answers the visible ids in the order asked, lower-cased, without repeats or non-uuids', async () => {
    const db = fakeDb([{ nDocid: MINE.toUpperCase() }, { nDocid: SHARED }]);
    await expect(viewableDocLinkIds(db, ME, [MINE, 'x', OTHERS, MINE.toUpperCase(), SHARED])).resolves.toEqual([MINE, SHARED]);
    expect(db.rows).toHaveBeenCalledWith(DOCLINK_VIEW_SQL, [[MINE, OTHERS, SHARED], ME]);
  });

  it('asks nothing for a non-uuid caller or no ids, and throws unavailable on a lookup fault', async () => {
    const db = fakeDb([]);
    await expect(viewableDocLinkIds(db, 'nope', [MINE])).resolves.toEqual([]);
    await expect(viewableDocLinkIds(db, ME, ['x'])).resolves.toEqual([]);
    expect(db.rows).not.toHaveBeenCalled();
    const err = await caught(() => viewableDocLinkIds(fakeDb(new Error('boom')), ME, [MINE]));
    expect(err.code).toBe('unavailable');
    expect(err.message).toBe(DOCLINK_VIEW_CHECK_FAILED);
  });
});

describe('assertCanDeleteDocLink', () => {
  it('lets the owner delete the DocLink, or one of its links, asking [doc, caller, link | null]', async () => {
    const db = fakeDb([{ bAllowed: true }]);
    await expect(assertCanDeleteDocLink(db, ME, MINE)).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenCalledWith(DOCLINK_DELETE_ACCESS_SQL, [MINE, ME, null]);
    await expect(assertCanDeleteDocLink(db, ME, MINE, LINK)).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenCalledWith(DOCLINK_DELETE_ACCESS_SQL, [MINE, ME, LINK]);
    await expect(assertCanDeleteDocLink(db, ME, MINE, '')).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenLastCalledWith(DOCLINK_DELETE_ACCESS_SQL, [MINE, ME, null]);
  });

  it('refuses someone else\'s DocLink, a link of another DocLink, and non-uuid ids without a query', async () => {
    const err = await caught(() => assertCanDeleteDocLink(fakeDb([{ bAllowed: false }]), ME, OTHERS));
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe(DOCLINK_DELETE_REFUSED);
    for (const [caller, doc, link] of [['x', MINE, undefined], [ME, 'x', undefined], [ME, MINE, 'x'], [null, MINE, undefined]] as const) {
      const db = fakeDb([{ bAllowed: true }]);
      const refused = await caught(() => assertCanDeleteDocLink(db, caller, doc, link));
      expect(refused.code).toBe('forbidden');
      expect(db.rows).not.toHaveBeenCalled();
    }
  });

  it('throws unavailable (never a refusal) when the lookup fails; no row is a refusal', async () => {
    const failed = await caught(() => assertCanDeleteDocLink(fakeDb(new Error('boom')), ME, MINE));
    expect(failed.code).toBe('unavailable');
    expect(failed.message).toBe(DOCLINK_DELETE_CHECK_FAILED);
    const none = await caught(() => assertCanDeleteDocLink(fakeDb([]), ME, MINE));
    expect(none.code).toBe('forbidden');
  });
});

describe('assertDocLinkTargetsInCase', () => {
  it('passes when every target is a document of the case (any letter case), without a query for no targets', async () => {
    const db = fakeDb([{ nBundledetailid: DOC_A.toUpperCase() }, { nBundledetailid: DOC_B }]);
    await expect(assertDocLinkTargetsInCase(db, CASE, [DOC_A, DOC_B])).resolves.toBeUndefined();
    expect(db.rows).toHaveBeenCalledWith(DOCLINK_TARGETS_IN_CASE_SQL, [CASE, [DOC_A, DOC_B]]);
    const idle = fakeDb([]);
    await expect(assertDocLinkTargetsInCase(idle, CASE, [])).resolves.toBeUndefined();
    expect(idle.rows).not.toHaveBeenCalled();
  });

  it('refuses a target of another case, a non-uuid case, and throws unavailable on a fault', async () => {
    const err = await caught(() => assertDocLinkTargetsInCase(fakeDb([{ nBundledetailid: DOC_A }]), CASE, [DOC_A, DOC_B]));
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe(DOCLINK_TARGETS_REFUSED);
    const badCase = await caught(() => assertDocLinkTargetsInCase(fakeDb([]), 'x', [DOC_A]));
    expect(badCase.code).toBe('forbidden');
    const failed = await caught(() => assertDocLinkTargetsInCase(fakeDb(new Error('boom')), CASE, [DOC_A]));
    expect(failed.code).toBe('unavailable');
  });
});
