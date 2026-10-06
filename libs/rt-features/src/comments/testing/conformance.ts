/**
 * Gate G2 of the comments feature: the same fixtures and the same expectations on every host that mounts it (coreapi,
 * realtime-server, the box's relay). A host spec answers `PERMISSION.viewer` to et_fact_permissions and `COMMENT_ROWS`
 * to et_comments_grid for CONFORMANCE_FACT, and asserts `expectConformantGrid(answer)`: the rows come back as the SP
 * listed them, in its order; a caller the permission row refuses gets `[]`. Test code only: never imported by a
 * source file.
 */
export const CONFORMANCE_FACT = '55555555-5555-4555-8555-555555555555';
export const CONFORMANCE_CALLER = '11111111-1111-4111-8111-111111111111';
export const CONFORMANCE_OWNER = '22222222-2222-4222-8222-222222222222';
export const CONFORMANCE_OTHER = '33333333-3333-4333-8333-333333333333';
export const MY_COMMENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const THEIR_COMMENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const NEW_COMMENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

/** et_fact_permissions rows for (CONFORMANCE_CALLER, CONFORMANCE_FACT). */
export const PERMISSION = Object.freeze({
  owner: Object.freeze({ nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_CALLER, bCanView: true, bCanEdit: true }),
  viewer: Object.freeze({ nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_OWNER, bCanView: true, bCanEdit: null, bCanComment: null }),
  refused: Object.freeze({ nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_OWNER, bCanView: false, bCanEdit: null }),
});

/** realtime."Comments" as et_comments_grid lists them for the fact (live rows only). */
export const COMMENT_ROWS: readonly Readonly<Record<string, unknown>>[] = Object.freeze([
  Object.freeze({ nCid: MY_COMMENT, nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_CALLER, cMsg: 'mine', cFname: 'Me' }),
  Object.freeze({ nCid: THEIR_COMMENT, nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_OTHER, cMsg: 'theirs', cFname: 'Other' }),
  Object.freeze({ nCid: NEW_COMMENT, nFSid: CONFORMANCE_FACT, nUserid: CONFORMANCE_CALLER, cMsg: 'new', cFname: 'Me' }),
]);

/** et_comments_users for the fact. */
export const COMMENTER_ROWS: readonly Readonly<Record<string, unknown>>[] = Object.freeze([Object.freeze({ nUserid: CONFORMANCE_OTHER, cFname: 'Other' })]);

/** et_manage_comments' done row for a new comment. */
export const MANAGE_DONE = Object.freeze({ msg: 1, value: 'Done', nCid: NEW_COMMENT });

/** Throws with the difference when a listing is not the conformant one. */
export function expectConformantGrid(answer: unknown): void {
  const got = JSON.stringify(answer);
  const want = JSON.stringify(COMMENT_ROWS);
  if (got !== want) throw new Error(`comments conformance: expected ${want}\n   got ${got}`);
}
