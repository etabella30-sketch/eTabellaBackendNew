import { normalizeShareRecipients, shareListJson, shareRecipientIds } from './share-recipients';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ME = '33333333-3333-4333-8333-333333333333';

describe('normalizeShareRecipients (one share-list shape for realtime.et_fact_insert_team, 7b item 4)', () => {
  it('reads a bare id as a view-only share (what the public variant stored) and keeps an object row\'s flags', () => {
    expect(normalizeShareRecipients(JSON.stringify([A, { nUserid: B, bCanEdit: true, bCanReshare: 'true', bCanComment: false }]))).toEqual([
      { nUserid: A, bCanEdit: false, bCanReshare: false, bCanComment: false },
      { nUserid: B, bCanEdit: true, bCanReshare: true, bCanComment: false },
    ]);
  });

  it('accepts an already-parsed array, keeps bCanCopy when sent, and drops what is not a recipient', () => {
    expect(normalizeShareRecipients([{ nUserid: A, bCanCopy: true }, 'nope', { nUserid: 'x' }, 7, null])).toEqual([
      { nUserid: A, bCanEdit: false, bCanReshare: false, bCanComment: false, bCanCopy: true },
    ]);
  });

  it('answers an empty list for missing, malformed or non-array input, and dedupes a recipient named twice', () => {
    expect(normalizeShareRecipients(undefined)).toEqual([]);
    expect(normalizeShareRecipients('{not json')).toEqual([]);
    expect(normalizeShareRecipients('{"nUserid":"' + A + '"}')).toEqual([]);
    expect(normalizeShareRecipients([A, { nUserid: A.toUpperCase(), bCanEdit: true }])).toHaveLength(1);
  });

  it('shareRecipientIds leaves the caller out (a self-share is never cross-team); shareListJson is the SP parameter', () => {
    const list = normalizeShareRecipients([A, ME.toUpperCase()]);
    expect(shareRecipientIds(list, ME)).toEqual([A]);
    expect(JSON.parse(shareListJson(list))).toEqual(list);
  });
});
