import { Logger } from '@nestjs/common';
import { DomainError } from '@app/api-kernel';
import { FACT_CASE_SQL, OUTSIDE_CALLER_TEAMS_SQL } from '@app/permissions';
import { FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL, FACT_NEW_SHARE_USERS_SQL, FACT_RESHARE_OWNER_SQL, FACT_SHARE_CHANGE_USERS_SQL } from '@app/permissions/share-notifications';
import { FACTSHEET_NOT_EDITABLE, FACTSHEET_NOT_VIEWABLE, FactsheetService, isFactCreator, mergeShareRecipients, withActor } from './factsheet.service';
import { normalizeShareRecipients } from './share-recipients';
import {
  CALLER,
  CASE,
  CROSS_TEAM_SAVE_BODY,
  EXPECTED_CROSS_TEAM_REFUSAL,
  EXPECTED_HAPPY,
  EXPECTED_NOT_VIEWABLE,
  FACT,
  failed,
  FRIEND,
  happyScript,
  ME,
  NOT_VIEWABLE_ROW,
  ok,
  OUTSIDER,
  OWNER,
  PERMISSION_CALL,
  readCall,
  recordingEvents,
  SAVE_BODY,
  scriptedExecutor,
  scriptedRows,
  SHARE_NOTICE,
  SHARED_ROWS,
  SHARED_ROWS_WITH_OUTSIDER,
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

function build(script = happyScript(), rowScript: Record<string, readonly unknown[] | Error> = {}, outsiders: readonly string[] = []) {
  const { sp, calls } = scriptedExecutor(script);
  const { rows, queries } = scriptedRows(rowScript, outsiders);
  const { events, published } = recordingEvents();
  return { svc: new FactsheetService(sp, rows, events), calls, queries, published, script };
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

  it('does not repeat share notices for an unchanged audience, even when the SP returns every existing recipient', async () => {
    const w = build(happyScript(), { [FACT_SHARE_RECIPIENTS_SQL]: [{ nUserid: FRIEND }] });
    await w.svc.save(CALLER, { ...SAVE_BODY });
    expect(w.calls.map(call => call.fn)).toContain('fact_insert_team');
    expect(w.published).toEqual([]);
    expect(w.queries.map(query => query.sql)).not.toContain(FACT_NEW_SHARE_USERS_SQL);
  });

  it('does not invent a new grant when the prior audience cannot be read', async () => {
    const w = build(happyScript(), { [FACT_SHARE_RECIPIENTS_SQL]: new Error('unavailable') });
    await w.svc.save(CALLER, { ...SAVE_BODY });
    expect(w.published).toEqual([]);
  });

  describe('R4-004 (sharing QA 2026-10-28): a re-levelled recipient hears "access changed", a dropped one "no longer shared"', () => {
    const CHANGE_ROW = (nUserid: string) => ({ nUserid, cToken: null, nCaseid: CASE, nFSid: FACT, cSharer: 'Me Myself', nPage: 12, nLine: 4 });
    const ANNOTATION = { type: 'annotation', annotationId: FACT, sourceType: 'F', caseId: CASE };

    it('the creator upgrades FRIEND from read to edit: one FS-LEVEL notice with the sharer and the place, no FS notice', async () => {
      const w = build(happyScript(), {
        [FACT_SHARE_RECIPIENTS_SQL]: [{ nUserid: FRIEND, bCanEdit: false, nShareBy: ME }],
        [FACT_SHARE_CHANGE_USERS_SQL]: [CHANGE_ROW(FRIEND)],
      });
      await w.svc.save(CALLER, { ...SAVE_BODY, jUsers: JSON.stringify([{ nUserid: FRIEND, bCanEdit: true }]) });
      expect(w.queries.map(q => q.sql)).toEqual([FACT_CASE_SQL, OUTSIDE_CALLER_TEAMS_SQL, FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL, FACT_SHARE_CHANGE_USERS_SQL]);
      expect(w.queries[4].params).toEqual([FACT, [FRIEND], ME]);
      expect(w.published).toEqual([{ kind: 'notification', toUserIds: [FRIEND], template: 'FS-LEVEL', data: {
        nUserid: FRIEND, cToken: null, nCaseid: CASE, nFSid: FACT, cType: 'FS-LEVEL', cTitle: 'Mark access changed',
        cMsg: 'Me Myself changed your access to a Fact (p12:4) to Can edit', jTarget: ANNOTATION, nRefuserid: ME,
      } }]);
    });

    it('the creator drops OWNER from the list and adds FRIEND: an FS notice for FRIEND and an FS-REMOVED notice (case target, no nFSid) for OWNER', async () => {
      const w = build(happyScript(), {
        [FACT_SHARE_RECIPIENTS_SQL]: [{ nUserid: OWNER, bCanEdit: true, nShareBy: ME }],
        [FACT_SHARE_CHANGE_USERS_SQL]: [CHANGE_ROW(OWNER)],
      });
      await w.svc.save(CALLER, { ...SAVE_BODY });
      expect(w.queries.map(q => q.sql)).toEqual([FACT_CASE_SQL, OUTSIDE_CALLER_TEAMS_SQL, FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL, FACT_NEW_SHARE_USERS_SQL, FACT_SHARE_CHANGE_USERS_SQL]);
      expect(w.queries[4].params).toEqual([FACT, [FRIEND], ME]);
      expect(w.published).toEqual([
        { kind: 'notification', toUserIds: [FRIEND], template: 'FS', data: { ...SHARE_NOTICE, nRefuserid: ME } },
        { kind: 'notification', toUserIds: [OWNER], template: 'FS-REMOVED', data: {
          nUserid: OWNER, cToken: null, nCaseid: CASE, cType: 'FS-REMOVED', cTitle: 'Mark no longer shared',
          cMsg: 'Me Myself stopped sharing a Fact (p12:4) with you', jTarget: { type: 'case', caseId: CASE }, nRefuserid: ME,
        } },
      ]);
    });

    it('a failed change lookup costs only the change notices: the new recipient is still told, and the miss is logged', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const w = build(happyScript(), {
        [FACT_SHARE_RECIPIENTS_SQL]: [{ nUserid: OWNER, nShareBy: ME }],
        [FACT_SHARE_CHANGE_USERS_SQL]: new Error('db down'),
      });
      await w.svc.save(CALLER, { ...SAVE_BODY });
      expect(w.published.map((e: any) => [e.toUserIds, e.template])).toEqual([[[FRIEND], 'FS']]);
      expect(Logger.prototype.warn).toHaveBeenCalledWith('[factsheet] Changed share audience unavailable; access-change notices suppressed');
    });

    it('a Can-share recipient\'s merge never removes anyone and re-levels only his own rows: no FS-REMOVED, and no FS-LEVEL for an owner-chosen row', async () => {
      const resharer = build({ ...happyScript(), fact_permissions: ok([{ ...SHARED_VIEWER_ROW, bCanEdit: true, bCanReshare: true, bCanComment: false }]) }, {
        [FACT_SHARE_RECIPIENTS_SQL]: [{ nUserid: FRIEND, bCanEdit: false, nShareBy: OWNER }, { nUserid: ME, bCanEdit: true, nShareBy: OWNER }, { nUserid: OUTSIDER, nShareBy: OWNER }],
      });
      await resharer.svc.save(CALLER, { ...SAVE_BODY, jUsers: JSON.stringify([{ nUserid: OWNER }, { nUserid: FRIEND, bCanEdit: true }]) });
      expect(resharer.calls.find(c => c.fn === 'fact_insert_team').params.bMerge).toBe(true);
      expect(resharer.queries.map(q => q.sql)).not.toContain(FACT_SHARE_CHANGE_USERS_SQL);
      expect(resharer.published).toEqual([]);
    });
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

  describe('the team rule (D3, 2026-10-06): nothing crosses teams on a case', () => {
    it('shared: a row from another team is dropped, the caller and same-team rows stay; the lookups name the fact\'s case', async () => {
      const { svc, queries } = build({ ...happyScript(), factsheet_shared: ok([...SHARED_ROWS_WITH_OUTSIDER]) }, {}, [OUTSIDER]);
      await expect(svc.shared(CALLER, query())).resolves.toEqual(SHARED_ROWS);
      expect(queries).toEqual([
        { sql: FACT_CASE_SQL, params: [FACT] },
        { sql: OUTSIDE_CALLER_TEAMS_SQL, params: [CASE, ME, [ME, FRIEND, OUTSIDER]] },
      ]);
    });

    it('shared: when the SP already answers only the team, nothing changes (G2 happy path still holds)', async () => {
      const { svc } = build();
      expectConformant('shared', await svc.shared(CALLER, query()), EXPECTED_HAPPY.shared);
    });

    it('shared: a failed team lookup is the failure row, never a list that might cross teams', async () => {
      const broken = build(happyScript(), { [OUTSIDE_CALLER_TEAMS_SQL]: new Error('db down') });
      await expect(broken.svc.shared(CALLER, query())).resolves.toEqual({ msg: -1, value: 'Fetch failed', error: 'team_scope_lookup_failed' });
      const noCase = build(happyScript(), { [FACT_CASE_SQL]: [] });
      // No case row for an existing fact: fail closed, only the caller's own row is listed.
      await expect(noCase.svc.shared(CALLER, query())).resolves.toEqual([SHARED_ROWS[0]]);
    });

    it('save: a share list naming someone outside the caller\'s teams is refused before anything is written', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const { svc, calls, queries, published } = build(happyScript(), {}, [OUTSIDER]);
      const answer = await svc.save(CALLER, { ...CROSS_TEAM_SAVE_BODY });
      expectConformant('save (cross-team)', answer, EXPECTED_CROSS_TEAM_REFUSAL);
      expect(calls).toEqual([PERMISSION_CALL]);
      expect(queries).toEqual([
        { sql: FACT_CASE_SQL, params: [FACT] },
        { sql: OUTSIDE_CALLER_TEAMS_SQL, params: [CASE, ME, [FRIEND, OUTSIDER]] },
      ]);
      expect(published).toEqual([]);
      expect(Logger.prototype.warn).toHaveBeenCalledWith(`[factsheet] share of ${FACT} refused: 1 recipient(s) outside the caller's teams`);
    });

    it('save: same-team recipients pass (one lookup, then the write and the share replacement as before)', async () => {
      const { svc, calls, queries } = build();
      expectConformant('save', await svc.save(CALLER, { ...SAVE_BODY }), EXPECTED_HAPPY.save);
      expect(calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit', 'fact_insert_team']);
      expect(queries.map((q) => q.sql)).toEqual([FACT_CASE_SQL, OUTSIDE_CALLER_TEAMS_SQL, FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL, FACT_NEW_SHARE_USERS_SQL]);
    });

    it('save: no team lookup when the share list is not being replaced, or names only the caller', async () => {
      const kept = build();
      await kept.svc.save(CALLER, { ...SAVE_BODY, bIsUserUpdated: false });
      expect(kept.queries).toEqual([]);
      const self = build();
      await self.svc.save(CALLER, { ...SAVE_BODY, jUsers: JSON.stringify([{ nUserid: ME.toUpperCase(), bCanEdit: true }]) });
      expect(self.queries.map(q => q.sql)).toEqual([FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL]);
      expect(self.calls.map((c) => c.fn)).toEqual(['fact_permissions', 'factsheet_submit', 'fact_insert_team']);
    });

    it('save: a failed team lookup, or a fact with no case row, is the failure row and nothing is written', async () => {
      const broken = build(happyScript(), { [OUTSIDE_CALLER_TEAMS_SQL]: new Error('db down') });
      await expect(broken.svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual({ msg: -1, value: 'Failed to save', error: 'team_scope_lookup_failed' });
      expect(broken.calls.map((c) => c.fn)).toEqual(['fact_permissions']);
      const noCase = build(happyScript(), { [FACT_CASE_SQL]: [] });
      await expect(noCase.svc.save(CALLER, { ...SAVE_BODY })).resolves.toEqual({ msg: -1, value: 'Failed to save', error: 'team_scope_lookup_failed' });
    });

    it('shareRecipientsOf: the ids named by jUsers other than the caller; malformed JSON names nobody', () => {
      expect(FactsheetService.shareRecipientsOf({ jUsers: CROSS_TEAM_SAVE_BODY.jUsers }, ME)).toEqual([FRIEND, OUTSIDER]);
      expect(FactsheetService.shareRecipientsOf({ jUsers: '{not json' }, ME)).toEqual([]);
      expect(FactsheetService.shareRecipientsOf({ jUsers: '{"nUserid":"x"}' }, ME)).toEqual([]);
      expect(FactsheetService.shareRecipientsOf({ jUsers: undefined }, ME)).toEqual([]);
    });
  });

  describe('R4-001 (sharing matrix 2026-10-28): a Can-share recipient merge-adds, only the creator replaces the share list', () => {
    /** et_fact_permissions for ME on OWNER's fact, shared with edit + reshare but no comment right. */
    const RESHARER_ROW = Object.freeze({ ...SHARED_VIEWER_ROW, bCanEdit: true, bCanReshare: true, bCanComment: false });
    /** What the editor sends: the pinned owner row, the resharer's own row and the new recipient with every right. */
    const RESHARE_BODY = Object.freeze({
      ...SAVE_BODY,
      jUsers: JSON.stringify([
        { nUserid: OWNER, bCanEdit: true, bCanReshare: true, bCanComment: true },
        { nUserid: ME, bCanEdit: true, bCanReshare: true, bCanComment: true },
        { nUserid: FRIEND, bCanEdit: true, bCanReshare: false, bCanComment: true },
      ]),
    });
    /** The list the SP receives: no owner row, every flag clamped to the caller's own rights. */
    const MERGED_USERS = JSON.stringify([
      { nUserid: ME, bCanEdit: true, bCanReshare: true, bCanComment: false },
      { nUserid: FRIEND, bCanEdit: true, bCanReshare: false, bCanComment: false },
    ]);
    const OWNER_NOTICE = {
      kind: 'notification',
      toUserIds: [OWNER],
      template: 'FS',
      data: { nUserid: OWNER, cToken: null, nCaseid: CASE, nFSid: FACT, cType: 'FS', cTitle: 'Fact shared onward', cMsg: 'Your Fact was shared onward by Me Myself with 1 more person', nRefuserid: ME },
    };
    const resharer = (rowScript: Record<string, readonly unknown[] | Error> = {}) => build({ ...happyScript(), fact_permissions: ok([{ ...RESHARER_ROW }]) }, rowScript);

    it('a Can-share recipient: fact_insert_team runs with bMerge true, the owner dropped from jUsers and the flags clamped; the fact write itself is untouched', async () => {
      const { svc, calls, queries, published } = resharer();
      expectConformant('save', await svc.save(CALLER, { ...RESHARE_BODY }), EXPECTED_HAPPY.save);
      const params = { ...RESHARE_BODY, nMasterid: ME };
      expect(calls).toEqual([
        PERMISSION_CALL,
        { fn: 'factsheet_submit', params, schema: 'realtime' },
        { fn: 'fact_insert_team', params: { ...params, bMerge: true, jUsers: MERGED_USERS }, schema: 'realtime' },
      ]);
      // The team rule checks the list the SP gets (the owner is not a recipient); the creator is then told.
      expect(queries.map((q) => q.sql)).toEqual([FACT_CASE_SQL, OUTSIDE_CALLER_TEAMS_SQL, FACT_SHARE_LOCK_SQL, FACT_SHARE_RECIPIENTS_SQL, FACT_NEW_SHARE_USERS_SQL, FACT_RESHARE_OWNER_SQL]);
      expect(queries[1].params).toEqual([CASE, ME, [FRIEND]]);
      expect(queries[5].params).toEqual([FACT, ME]);
      // FRIEND was granted edit (clamped to the resharer's own rights), so his notice says so (R4-004).
      expect(published).toEqual([
        { kind: 'notification', toUserIds: [FRIEND], template: 'FS', data: { ...SHARE_NOTICE, cMsg: 'A colleague shared a Fact with you · Can edit', nRefuserid: ME } },
        OWNER_NOTICE,
      ]);
    });

    it('the creator keeps the full replacement: no bMerge, the list as sent, no notice to himself', async () => {
      const { svc, calls, queries, published } = build();
      await svc.save(CALLER, { ...SAVE_BODY });
      const share = calls.find((c) => c.fn === 'fact_insert_team');
      expect(share.params).toEqual({ ...SAVE_BODY, nMasterid: ME });
      expect('bMerge' in share.params).toBe(false);
      expect(queries.map((q) => q.sql)).not.toContain(FACT_RESHARE_OWNER_SQL);
      expect(published.map((e: any) => e.toUserIds)).toEqual([[FRIEND]]);
    });

    it('a client-sent bMerge never reaches the SP: a recipient still merges, the creator still replaces', async () => {
      const recipient = resharer();
      await recipient.svc.save(CALLER, { ...RESHARE_BODY, bMerge: false } as any);
      expect(recipient.calls.find((c) => c.fn === 'fact_insert_team').params.bMerge).toBe(true);
      expect(recipient.calls.find((c) => c.fn === 'factsheet_submit').params).not.toHaveProperty('bMerge');
      const creator = build();
      await creator.svc.save(CALLER, { ...SAVE_BODY, bMerge: true } as any);
      expect(creator.calls.find((c) => c.fn === 'fact_insert_team').params).not.toHaveProperty('bMerge');
    });

    it('no notice to the creator when nobody new was added (the SP still merges, so nothing is removed)', async () => {
      const { svc, calls, queries, published } = resharer({ [FACT_SHARE_RECIPIENTS_SQL]: [{ nUserid: FRIEND }, { nUserid: ME }] });
      await svc.save(CALLER, { ...RESHARE_BODY });
      expect(calls.find((c) => c.fn === 'fact_insert_team').params.bMerge).toBe(true);
      expect(queries.map((q) => q.sql)).not.toContain(FACT_RESHARE_OWNER_SQL);
      expect(published).toEqual([]);
    });

    it('a failed creator lookup costs only the creator\'s notice; the new recipient is still told', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const { svc, published } = resharer({ [FACT_RESHARE_OWNER_SQL]: new Error('db down') });
      await svc.save(CALLER, { ...RESHARE_BODY });
      expect(published.map((e: any) => e.toUserIds)).toEqual([[FRIEND]]);
      expect(Logger.prototype.warn).toHaveBeenCalledWith('[factsheet] Fact owner unavailable; reshare notice to the creator suppressed');
    });

    it('a cross-team recipient is still refused before anything is written, the pinned owner row aside', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const { svc, calls } = build({ ...happyScript(), fact_permissions: ok([{ ...RESHARER_ROW }]) }, {}, [OUTSIDER]);
      const body = { ...RESHARE_BODY, jUsers: JSON.stringify([{ nUserid: OWNER }, { nUserid: OUTSIDER }]) };
      expectConformant('save (cross-team reshare)', await svc.save(CALLER, body), EXPECTED_CROSS_TEAM_REFUSAL);
      expect(calls).toEqual([PERMISSION_CALL]);
    });

    it('isFactCreator: the permission row\'s owner id, case-insensitively; no owner id is not the creator (merge, fail-safe)', () => {
      expect(isFactCreator({ nUserid: ME.toUpperCase() }, CALLER)).toBe(true);
      expect(isFactCreator({ nUserid: OWNER }, CALLER)).toBe(false);
      expect(isFactCreator({}, CALLER)).toBe(false);
    });

    it('mergeShareRecipients: the owner is dropped and every flag is clamped to the caller\'s own rights; bCanCopy passes through', () => {
      const list = normalizeShareRecipients([{ nUserid: OWNER, bCanEdit: true }, { nUserid: FRIEND, bCanEdit: true, bCanReshare: true, bCanComment: true, bCanCopy: true }]);
      expect(mergeShareRecipients(list, { bCanEdit: true, bCanReshare: false, bCanComment: true }, OWNER.toUpperCase())).toEqual([
        { nUserid: FRIEND, bCanEdit: true, bCanReshare: false, bCanComment: true, bCanCopy: true },
      ]);
      expect(mergeShareRecipients(list, {}, undefined)).toEqual([
        { nUserid: OWNER, bCanEdit: false, bCanReshare: false, bCanComment: false },
        { nUserid: FRIEND, bCanEdit: false, bCanReshare: false, bCanComment: false, bCanCopy: true },
      ]);
    });
  });

  it('withActor keeps the request keys as they were and replaces the actor; an absent nFSid stays absent; a client bMerge is dropped', () => {
    expect(withActor(CALLER, { nFSid: FACT, nMasterid: 'x', nUserid: 'y' })).toEqual({ nFSid: FACT, nMasterid: ME });
    expect(withActor(CALLER, {})).toEqual({ nMasterid: ME });
    expect(Object.keys(withActor(CALLER, { nMasterid: 'x' }))).toEqual(['nMasterid']);
    expect(withActor(CALLER, { nFSid: FACT, bMerge: true } as any)).toEqual({ nFSid: FACT, nMasterid: ME });
  });
});
