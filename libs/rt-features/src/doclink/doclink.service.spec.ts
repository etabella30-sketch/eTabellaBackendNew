import { DOCLINK_SP, DocLinkService } from './doclink.service';
import { wrapInsertAnswer } from './http/doclink.controller';
import {
  CALLER,
  DETAIL_QUERY,
  EXPECTED_DETAIL,
  EXPECTED_FETCH_FAILED,
  EXPECTED_NONE_VISIBLE,
  failed,
  happyScript,
  INSERT_BODY,
  ME,
  MINE,
  OTHERS,
  recordingWrites,
  scriptedExecutor,
  SHARED_ROWS,
  SHARED_WITH_ME,
  viewRule,
} from './testing/conformance';

/*
 * DocLinkService = both hosts' docDetail / getDocShared (2026-10-06) with the actor from the Caller: the view rule
 * first, the SP only for the ids the caller may read, the same empty answers, the same failure rows.
 */
function build(script = happyScript(), viewFails = false) {
  const { sp, calls } = scriptedExecutor(script);
  const { rows, queries } = viewRule(viewFails);
  const { writes, calls: writeCalls } = recordingWrites();
  return { svc: new DocLinkService(sp, rows, writes), calls, queries, writeCalls };
}

describe('rt-features doclink DocLinkService', () => {
  it('detail: only the DocLinks the caller owns or was shared reach public.et_doc_detail (ref 3), lower-cased, deduped, the caller as actor', async () => {
    const { svc, calls, queries } = build();
    await expect(svc.detail(CALLER, DETAIL_QUERY)).resolves.toEqual(EXPECTED_DETAIL);
    expect(queries).toHaveLength(1);
    expect(queries[0].params).toEqual([[OTHERS, MINE, SHARED_WITH_ME], ME]);
    expect(calls).toEqual([expect.objectContaining({ name: DOCLINK_SP.detail, schema: 'public' })]);
    expect(JSON.parse(calls[0].params.jDocids as string)).toEqual([MINE, SHARED_WITH_ME]);
    expect(calls[0].params).toEqual(expect.objectContaining({ ref: 3, nUserid: ME, nMasterid: ME }));
    expect(Object.values(calls[0].params)).not.toContain('forged-by-client');
  });

  it('detail: nothing visible answers the three empty cursors without running the SP; a bad jDocids or a failed lookup answers the failure row', async () => {
    const none = build();
    await expect(none.svc.detail(CALLER, { jDocids: JSON.stringify([OTHERS]) })).resolves.toEqual(EXPECTED_NONE_VISIBLE);
    expect(none.calls).toEqual([]);
    await expect(build().svc.detail(CALLER, { jDocids: '{not json' })).resolves.toEqual(EXPECTED_FETCH_FAILED);
    await expect(build().svc.detail(CALLER, {})).resolves.toEqual(EXPECTED_FETCH_FAILED);
    const broken = build(happyScript(), true);
    await expect(broken.svc.detail(CALLER, DETAIL_QUERY)).resolves.toEqual(EXPECTED_FETCH_FAILED);
    expect(broken.calls).toEqual([]);
  });

  it('detail: a failed SP answers the failure row with the error', async () => {
    const { svc } = build({ ...happyScript(), doc_detail: failed() });
    await expect(svc.detail(CALLER, DETAIL_QUERY)).resolves.toEqual({ ...EXPECTED_FETCH_FAILED, error: 'relation missing' });
  });

  it('shared: the share list of a readable DocLink from realtime.et_doc_get_shared; [] for one the caller may not read', async () => {
    const { svc, calls } = build();
    await expect(svc.shared(CALLER, { nDocid: MINE })).resolves.toEqual(SHARED_ROWS);
    expect(calls).toEqual([expect.objectContaining({ name: DOCLINK_SP.shared, schema: 'realtime', params: expect.objectContaining({ nDocid: MINE, nUserid: ME, nMasterid: ME }) })]);
    const hidden = build();
    await expect(hidden.svc.shared(CALLER, { nDocid: OTHERS })).resolves.toEqual([]);
    expect(hidden.calls).toEqual([]);
  });

  it('insert and remove go to the host-bound writes port with the Caller; the controller wraps the insert answer as both hosts did', async () => {
    const { svc, writeCalls } = build();
    const inserted = await svc.insert(CALLER, INSERT_BODY);
    await svc.remove(CALLER, { nDocid: MINE });
    expect(writeCalls.map((c) => [c.op, c.caller.userId])).toEqual([['insert', ME], ['remove', ME]]);
    expect(wrapInsertAnswer(inserted)).toEqual({ msg: 1, value: 'Doclink inserted successfully', nDocid: MINE });
    expect(wrapInsertAnswer({ msg: -1, value: 'Doc insert failed' })).toEqual({ msg: -1, value: 'Doclink not inserted successfully. Docid not found.', error: { msg: -1, value: 'Doc insert failed' } });
  });
});
