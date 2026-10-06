import { MARK_NAVIGATOR_SP, MarkNavigatorService, withActor } from './marknav.service';
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
