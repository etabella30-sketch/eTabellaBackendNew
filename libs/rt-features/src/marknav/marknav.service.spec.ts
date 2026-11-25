import { MARK_NAVIGATOR_SP, MarkNavigatorService, oneMarkCursors, withActor } from './marknav.service';
import {
  ALL_QUERY,
  CALLER,
  EXPECTED_ALL,
  EXPECTED_FAILURE,
  EXPECTED_QUICK_MARKS,
  expectActorCalls,
  failed,
  happyScript,
  ME,
  QUICK_MARKS_QUERY,
  scriptedExecutor,
} from './testing/conformance';

/*
 * MarkNavigatorService = both hosts' MarknavService.getAll / getQuickMarks (2026-10-06) with the actor from the Caller:
 * the same SP calls (realtime schema, ref 3 on `all`), the same cursors, the same failure list.
 */
function build(script = happyScript()) {
  const { sp, calls } = scriptedExecutor(script);
  return { svc: new MarkNavigatorService(sp), calls };
}

describe('rt-features marknav MarkNavigatorService', () => {
  it('all: realtime.et_navigate_get_all with ref 3, the caller as both identity keys, answering the three cursors', async () => {
    const { svc, calls } = build();
    await expect(svc.all(CALLER, ALL_QUERY)).resolves.toEqual(EXPECTED_ALL);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe(MARK_NAVIGATOR_SP.all);
    expect(calls[0].params).toEqual(expect.objectContaining({ nSesid: ALL_QUERY.nSesid, cSorttype: 'H', cSortby: 'desc', nPageNumber: 1, bIsTranscipt: false, ref: 3 }));
    expectActorCalls(calls, ME);
  });

  it('quickMarks: realtime.et_navigate_quick_mark, the caller as both identity keys, answering the first cursor', async () => {
    const { svc, calls } = build();
    await expect(svc.quickMarks(CALLER, QUICK_MARKS_QUERY)).resolves.toEqual(EXPECTED_QUICK_MARKS);
    expect(calls[0].name).toBe(MARK_NAVIGATOR_SP.quickMarks);
    expect(calls[0].params).not.toHaveProperty('ref');
    expectActorCalls(calls, ME);
  });

  it('a failed SP answers the hosts\' failure list, never throws', async () => {
    const { svc } = build({ navigate_get_all: failed(), navigate_quick_mark: failed() });
    await expect(svc.all(CALLER, ALL_QUERY)).resolves.toEqual(EXPECTED_FAILURE);
    await expect(svc.quickMarks(CALLER, QUICK_MARKS_QUERY)).resolves.toEqual(EXPECTED_FAILURE);
  });

  it('withActor overwrites both identity keys and keeps every other field as sent', () => {
    expect(withActor(CALLER, { nSesid: 's', nUserid: 'x', nMasterid: 'y', cSortby: 'asc' })).toEqual({ nSesid: 's', cSortby: 'asc', nUserid: ME, nMasterid: ME });
  });
});

/** `marknav/all?nFSid=`: one mark's rows of the same read (the Reader's read after a save, 2026-11-03). */
describe('marknav/all for one mark', () => {
  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const cursors = [
    [{ nFSid: A, cType: 'QF' }, { nFSid: B, cType: 'F' }, { nFSid: A.toUpperCase(), cType: 'QF' }],
    [{ jFSids: [A, B], nIssueid: 'i1' }, { jFSids: [B], nIssueid: 'i2' }, { jFSids: JSON.stringify([A]), nIssueid: 'i3' }],
    [{ nFSid: B, cTab: 'C1' }, { nFSid: A, cTab: 'A2' }],
  ];

  it('keeps only that mark: its rows, its Issues (trimmed to it), its links', () => {
    expect(oneMarkCursors(cursors, A)).toEqual([
      [{ nFSid: A, cType: 'QF' }, { nFSid: A.toUpperCase(), cType: 'QF' }],
      [{ jFSids: [A], nIssueid: 'i1' }, { jFSids: [A], nIssueid: 'i3' }],
      [{ nFSid: A, cTab: 'A2' }],
    ]);
  });

  it('runs the same procedure, without passing nFSid to it, and narrows the answer', async () => {
    const { sp, calls } = scriptedExecutor({ ...happyScript(), [MARK_NAVIGATOR_SP.all]: { ok: true, cursors } } as any);
    const svc = new MarkNavigatorService(sp);
    const answer = await svc.all(CALLER, { ...ALL_QUERY, nFSid: B });
    expect(calls[0].name).toBe(MARK_NAVIGATOR_SP.all);
    expect(calls[0].params).not.toHaveProperty('nFSid');
    expect(answer).toEqual([[{ nFSid: B, cType: 'F' }], [{ jFSids: [B], nIssueid: 'i1' }, { jFSids: [B], nIssueid: 'i2' }], [{ nFSid: B, cTab: 'C1' }]]);
  });

  it('without nFSid the answer is unchanged', async () => {
    const { svc } = build();
    await expect(svc.all(CALLER, ALL_QUERY)).resolves.toEqual(EXPECTED_ALL);
  });
});
