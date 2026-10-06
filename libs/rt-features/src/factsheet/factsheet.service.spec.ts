import { Logger } from '@nestjs/common';
import { DomainError } from '@app/api-kernel';
import { FACTSHEET_NOT_EDITABLE, FACTSHEET_NOT_VIEWABLE, FactsheetService, withActor } from './factsheet.service';
import {
  CALLER,
  EXPECTED_HAPPY,
  EXPECTED_NOT_VIEWABLE,
  FACT,
  failed,
  FRIEND,
  happyScript,
  ME,
  NOT_VIEWABLE_ROW,
  ok,
  PERMISSION_CALL,
  readCall,
  recordingEvents,
  SAVE_BODY,
  scriptedExecutor,
  SHARE_NOTICE,
  SHARED_VIEWER_ROW,
  expectConformant,
} from './testing/conformance';

/*
 * FactsheetService = realtime-server's FactsheetService (2026-10-06) with the actor from the Caller: the same SP
 * calls, the same bodies, the same empty answers for a caller who may not view the fact, the same failure rows.
 */

const READS = ['detail', 'permissions', 'shared', 'issues', 'contacts', 'tasks', 'links', 'annotation'] as const;
const GATED_READS = READS.filter((r) => r !== 'permissions');
const SP_OF: Record<(typeof READS)[number], string> = {
  detail: 'factsheet_detail',
  permissions: 'fact_permissions',
  shared: 'factsheet_shared',
  issues: 'factsheet_issues',
  contacts: 'factsheet_contacts',
  tasks: 'factsheet_tasks',
  links: 'factsheet_links',
  annotation: 'getfact_annotation',
};

function build(script = happyScript()) {
  const { sp, calls } = scriptedExecutor(script);
  const { events, published } = recordingEvents();
  return { svc: new FactsheetService(sp, events), calls, published, script };
}
const query = () => ({ nFSid: FACT, nMasterid: 'forged-by-client', nUserid: 'forged-too' });
const code = async (p: Promise<unknown>): Promise<string> => p.then(() => 'resolved', (e: DomainError) => `${e.code}:${e.message}`);

describe('rt-features factsheet FactsheetService', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it.each(READS)('%s: conformant answer when the caller may view the fact; the lookup then the read, caller as nMasterid (G2)', async (route) => {
    const { svc, calls } = build();
    const answer = await (svc as any)[route](CALLER, query());
    expectConformant(route, answer, EXPECTED_HAPPY[route]);
    if (route === 'permissions') expect(calls).toEqual([PERMISSION_CALL]);
    else expect(calls).toEqual([PERMISSION_CALL, readCall(SP_OF[route], route === 'tasks' ? { ref: 3 } : {})]);
    // The client's own ids never reach an SP (R4).
    expect(JSON.stringify(calls)).not.toContain('forged');
  });

  it.each(READS)('%s: a caller who may not view the fact gets the empty answer and no reader SP runs', async (route) => {
    const { svc, calls } = build({ ...happyScript(), fact_permissions: ok([{ ...NOT_VIEWABLE_ROW }]) });
    const answer = await (svc as any)[route](CALLER, query());
    expectConformant(route, answer, EXPECTED_NOT_VIEWABLE[route]);
    expect(JSON.stringify(answer)).not.toContain('secret');
    expect(calls).toEqual([PERMISSION_CALL]);
  });

  it('the detail refusal is a fresh object each time (the frozen constant is never handed out)', async () => {
    const { svc } = build({ ...happyScript(), fact_permissions: ok([{ ...NOT_VIEWABLE_ROW }]) });
    const a = await svc.detail(CALLER, query());
    const b = await svc.detail(CALLER, query());
    expect(a).toEqual(FACTSHEET_NOT_VIEWABLE);
    expect(a).not.toBe(b);
    expect(Object.isFrozen(a)).toBe(false);
  });

  it.each(GATED_READS)('%s: a failed permission lookup is unavailable (the host renders 500), an unknown fact not_found; no reader SP runs', async (route) => {
    const down = build({ ...happyScript(), fact_permissions: failed('db down') });
    expect(await code((down.svc as any)[route](CALLER, query()))).toBe('unavailable:Could not check access to this fact');
    expect(down.calls).toEqual([PERMISSION_CALL]);
    const unknown = build({ ...happyScript(), fact_permissions: ok([]) });
    expect(await code((unknown.svc as any)[route](CALLER, query()))).toBe('not_found:Fact not found');
    expect(unknown.calls).toEqual([PERMISSION_CALL]);
  });

  it('permissions: the whole row for a viewer (owner id included), the refusal for others, the lookup failure row and the empty answer as they were', async () => {
    const viewer = build({ fact_permissions: ok([{ ...SHARED_VIEWER_ROW }]) });
    await expect(viewer.svc.permissions(CALLER, query())).resolves.toEqual(SHARED_VIEWER_ROW);
    const refused = build({ fact_permissions: ok([{ ...NOT_VIEWABLE_ROW }]) });
    const answer = await refused.svc.permissions(CALLER, query());
    expect(answer).toEqual(FACTSHEET_NOT_VIEWABLE);
    expect(JSON.stringify(answer)).not.toContain(NOT_VIEWABLE_ROW.nUserid);
    await expect(build({ fact_permissions: failed('db down') }).svc.permissions(CALLER, query())).resolves.toEqual({ msg: -1, error: 'db down' });
    await expect(build({ fact_permissions: ok([]) }).svc.permissions(CALLER, query())).resolves.toBeUndefined();
  });

  it.each(GATED_READS)('%s: a failed reader SP answers the failure row, never an empty list (reader review 2026-09-30)', async (route) => {
    const { svc } = build({ ...happyScript(), [SP_OF[route]]: failed('relation missing') });
    await expect((svc as any)[route](CALLER, query())).resolves.toEqual({ msg: -1, value: 'Fetch failed', error: 'relation missing' });
  });

  it('save: the fact is written with the caller as nMasterid and the share list replaced; the notice goes out as a notification event (G2)', async () => {
    const { svc, calls, published } = build();
    const answer = await svc.save(CALLER, { ...SAVE_BODY, nMasterid: 'forged' } as any);
    expectConformant('save', answer, EXPECTED_HAPPY.save);
    const params = { ...SAVE_BODY, nMasterid: ME };
    expect(calls).toEqual([
      PERMISSION_CALL,
      { fn: 'factsheet_submit', params, schema: 'realtime' },
      { fn: 'fact_insert_team', params, schema: 'realtime' },
    ]);
    expect(published).toEqual([{ kind: 'notification', toUserIds: [FRIEND], template: 'FS', data: { ...SHARE_NOTICE, nRefuserid: ME } }]);
  });

  it('save: no share replacement without bIsUserUpdated, or without reshare rights', async () => {
    const plain = build();
    await plain.svc.save(CALLER, { ...SAVE_BODY, bIsUserUpdated: false });
    expect(plain.calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit']);
    const noReshare = build({ ...happyScript(), fact_permissions: ok([{ ...SHARED_VIEWER_ROW, bCanEdit: true, bCanReshare: false }]) });
    await noReshare.svc.save(CALLER, { ...SAVE_BODY });
    expect(noReshare.calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit']);
    expect(noReshare.published).toEqual([]);
  });

  it('save: refused without bCanEdit (a lookup fault included), and the failure row when the SP fails; nothing else runs', async () => {
    const viewer = build({ ...happyScript(), fact_permissions: ok([{ ...SHARED_VIEWER_ROW }]) });
    await expect(viewer.svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual({ msg: -1, value: FACTSHEET_NOT_EDITABLE });
    expect(viewer.calls.map((c) => c.fn)).toEqual(['fact_permissions']);
    const down = build({ ...happyScript(), fact_permissions: failed('db down') });
    await expect(down.svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual({ msg: -1, value: FACTSHEET_NOT_EDITABLE });
    const unknown = build({ ...happyScript(), fact_permissions: ok([]) });
    await expect(unknown.svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual({ msg: -1, value: FACTSHEET_NOT_EDITABLE });
    const broken = build({ ...happyScript(), factsheet_submit: failed('constraint') });
    await expect(broken.svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual({ msg: -1, value: 'Failed to save', error: 'constraint' });
    expect(broken.calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit']);
  });

  it('save: a failed share replacement is logged, the save still answers "Fact updated", and nothing is published', async () => {
    const { svc, published } = build({ ...happyScript(), fact_insert_team: failed('team missing') });
    await expect(svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual(EXPECTED_HAPPY.save);
    expect(published).toEqual([]);
    expect(Logger.prototype.error).toHaveBeenCalledWith(`[factsheet] fact_insert_team failed for ${FACT}: team missing`);
  });

  it('unshare and delete: the SP row with the caller as nMasterid, no permission check; the failure row when the SP fails', async () => {
    const { svc, calls } = build();
    expectConformant('unshare', await svc.unshare(CALLER, query()), EXPECTED_HAPPY.unshare);
    expectConformant('remove', await svc.remove(CALLER, query()), EXPECTED_HAPPY.remove);
    expect(calls).toEqual([readCall('factsheet_unshare_withme'), readCall('factsheet_delete')]);
    const broken = build({ factsheet_unshare_withme: failed('x'), factsheet_delete: failed('y') });
    await expect(broken.svc.unshare(CALLER, query())).resolves.toEqual({ msg: -1, value: 'Failed to save', error: 'x' });
    await expect(broken.svc.remove(CALLER, query())).resolves.toEqual({ msg: -1, value: 'Failed to save', error: 'y' });
  });

  it('withActor keeps the request keys as they were and replaces the actor; an absent nFSid stays absent', () => {
    expect(withActor(CALLER, { nFSid: FACT, nMasterid: 'x', nUserid: 'y' })).toEqual({ nFSid: FACT, nMasterid: ME });
    expect(withActor(CALLER, {})).toEqual({ nMasterid: ME });
    expect(Object.keys(withActor(CALLER, { nMasterid: 'x' }))).toEqual(['nMasterid']);
  });
});
