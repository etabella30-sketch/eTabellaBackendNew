import { OUTSIDE_CALLER_TEAMS_SQL } from '@app/permissions';
import { ISSUE_CREATOR_NAMES_SQL, ISSUES_FAILED, ISSUES_SP, IssuesService } from './issues.service';
import type { RowQuery } from '@app/api-kernel';
import {
  CALLER,
  CASE,
  CATEGORY_BODY,
  CLAIM_ROWS,
  CLAIM_UPDATE_BODY,
  DELETE_BODY,
  EXPECTED_LIST,
  failed,
  happyScript,
  ISSUE_BODY,
  ISSUE_ROWS,
  LIST_QUERY,
  MATE,
  ME,
  OUTSIDER,
  QFACT_CLAIM_SEQUENCE_BODY,
  QFACT_SEQUENCE_BODY,
  scriptedExecutor,
  teamRule,
  WRITE_ROW,
} from './testing/conformance';

/*
 * IssuesService = realtime-server's IssueService methods behind the nine box rows (2026-10-06) with the actor from
 * the Caller: the same SPs, schemas, permission codes and answer shapes, plus the team rule on the list.
 */
function build(script = happyScript(), outsiders: readonly string[] = [OUTSIDER], ruleFails = false) {
  const { sp, calls } = scriptedExecutor(script);
  const { rows, queries } = teamRule(outsiders, ruleFails);
  return { svc: new IssuesService(sp, rows), calls, queries };
}

const noForgedIds = (params: Record<string, unknown>) => {
  expect(Object.values(params)).not.toContain('forged-by-client');
  expect(Object.values(params)).not.toContain('forged-too');
};

describe('rt-features issues IssuesService', () => {
  it('enriches both authorised cursors with Creator names in one deduplicated lookup, preserving IDs, hierarchy, order and rights', async () => {
    const claims = [{ nICid: 'first', nUserid: MATE, edit: true, delete: false }, { nICid: 'second', nUserid: ME }];
    const issues = [{ nIid: 'child', nICid: 'first', nUserid: MATE, edit: false },
      { nIid: 'outside', nICid: 'second', nUserid: OUTSIDER }, { nIid: 'seed', nUserid: null }];
    const extra = [{ metadata: 'retained' }];
    const { sp } = scriptedExecutor({ ...happyScript(), realtime_issuelist_group: { ok: true, cursors: [claims, issues, extra] } });
    const queries: Array<{ sql: string; params: readonly unknown[] }> = [];
    const rows: RowQuery = { async rows<R>(sql, params) {
      queries.push({ sql, params });
      if (sql === OUTSIDE_CALLER_TEAMS_SQL) return [{ nUserid: OUTSIDER }] as unknown as R[];
      expect(sql).toBe(ISSUE_CREATOR_NAMES_SQL);
      return [{ nUserid: MATE, cCreateby: 'Sarah' }, { nUserid: ME, cCreateby: 'Ken' },
        { nUserid: OUTSIDER, cCreateby: 'Must not be used' }] as unknown as R[];
    } };
    const result = await new IssuesService(sp, rows).list(CALLER, LIST_QUERY);
    expect(result).toEqual([[{ ...claims[0], cCreateby: 'Sarah' }, { ...claims[1], cCreateby: 'Ken' }],
      [{ ...issues[0], cCreateby: 'Sarah' }, issues[2]], extra]);
    expect(queries[1]).toEqual({ sql: ISSUE_CREATOR_NAMES_SQL, params: [[MATE, ME]] });
    expect(claims[0]).not.toHaveProperty('cCreateby');
    expect(issues[0]).not.toHaveProperty('cCreateby');
  });

  it('enriches an empty claim even without issues and preserves historical, system and blank identities as unavailable', async () => {
    const claims = [{ nICid: 'empty', nUserid: MATE.toUpperCase() }, { nICid: 'deleted', nUserid: ME },
      { nICid: 'old' }, { nICid: 'seed', nUserid: null }, { nICid: 'malformed', nUserid: 'not-a-user-id' }];
    const { sp } = scriptedExecutor({ ...happyScript(), realtime_issuelist_group: { ok: true, cursors: [claims, []] } });
    const queries: unknown[] = [];
    const rows: RowQuery = { async rows<R>(sql, params) {
      queries.push([sql, params]);
      return [{ nUserid: MATE, cCreateby: '  Sarah  ' }, { nUserid: ME, cCreateby: '  ' }] as unknown as R[];
    } };
    await expect(new IssuesService(sp, rows).list(CALLER, LIST_QUERY)).resolves.toEqual([
      [{ ...claims[0], cCreateby: 'Sarah' }, ...claims.slice(1)], []]);
    expect(queries).toEqual([[ISSUE_CREATOR_NAMES_SQL, [[MATE, ME]]]]);
  });

  it('keeps existing SP creator names and never asks for ownerless names or infers names from edit permissions', async () => {
    const claims = [{ nICid: 'named', nUserid: MATE, cCreateby: 'Sarah', edit: true },
      { nICid: 'older', edit: true }, { nICid: 'seed', nUserid: null }];
    const { sp } = scriptedExecutor({ ...happyScript(), realtime_issuelist_group: { ok: true, cursors: [claims, []] } });
    const rows: RowQuery = { rows: jest.fn() };
    await expect(new IssuesService(sp, rows).list(CALLER, LIST_QUERY)).resolves.toEqual([claims, []]);
    expect(rows.rows).not.toHaveBeenCalled();
  });

  it('keeps authorised records and rights when an optional Creator name lookup fails, without returning other teams’ rows', async () => {
    const claims = [{ nICid: 'claim', nUserid: ME, edit: true, delete: false }];
    const issues = [{ nIid: 'mate', nUserid: MATE, edit: false, delete: false }, { nIid: 'outside', nUserid: OUTSIDER }];
    const { sp } = scriptedExecutor({ ...happyScript(), realtime_issuelist_group: { ok: true, cursors: [claims, issues] } });
    const rows: RowQuery = { async rows<R>(sql) {
      if (sql === OUTSIDE_CALLER_TEAMS_SQL) return [{ nUserid: OUTSIDER }] as unknown as R[];
      expect(sql).toBe(ISSUE_CREATOR_NAMES_SQL);
      throw new Error('database detail');
    } };
    await expect(new IssuesService(sp, rows).list(CALLER, LIST_QUERY)).resolves.toEqual([claims, [issues[0]]]);
  });

  it('list: et_realtime_issuelist_group (public, ref 2) with the caller as the actor; an issue of another team never leaves, the seed issue stays', async () => {
    const { svc, calls, queries } = build();
    await expect(svc.list(CALLER, LIST_QUERY)).resolves.toEqual(EXPECTED_LIST);
    expect(calls).toEqual([expect.objectContaining({ name: ISSUES_SP.list, schema: undefined, params: expect.objectContaining({ nCaseid: CASE, nUserid: ME, nMasterid: ME, ref: 2 }) })]);
    noForgedIds(calls[0].params);
    expect(queries).toEqual([{ sql: OUTSIDE_CALLER_TEAMS_SQL, params: [CASE, ME, [ME, MATE, OUTSIDER]] }]);
  });

  it('list: nobody outside answers the cursors as the SP gave them; a failed team lookup is the failure row, never an unfiltered list', async () => {
    const inside = build(happyScript(), []);
    await expect(inside.svc.list(CALLER, LIST_QUERY)).resolves.toEqual([CLAIM_ROWS, ISSUE_ROWS]);
    const broken = build(happyScript(), [OUTSIDER], true);
    await expect(broken.svc.list(CALLER, LIST_QUERY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.list, error: 'team_scope_lookup_failed' });
  });

  it('list: a failed SP is the failure row; no creators means no team query', async () => {
    const { svc } = build({ ...happyScript(), realtime_issuelist_group: failed() });
    await expect(svc.list(CALLER, LIST_QUERY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.list, error: 'relation missing' });
    const seedOnly = build({ ...happyScript(), realtime_issuelist_group: { ok: true, cursors: [[...CLAIM_ROWS], [{ nIid: 'i-seed', nUserid: null }]] } });
    await expect(seedOnly.svc.list(CALLER, LIST_QUERY)).resolves.toEqual([CLAIM_ROWS, [{ nIid: 'i-seed', nUserid: null }]]);
    expect(seedOnly.queries).toEqual([]);
  });

  it('insert / update: et_realtime_handle_issue_master (public) with cPermission I / U and the caller as nUserid, answering the first cursor', async () => {
    const { svc, calls } = build();
    await expect(svc.insert(CALLER, ISSUE_BODY)).resolves.toEqual([{ ...WRITE_ROW, nIid: ISSUE_BODY.nIid }]);
    await svc.update(CALLER, ISSUE_BODY);
    expect(calls.map((c) => [c.name, c.schema, c.params.cPermission, c.params.nUserid])).toEqual([
      [ISSUES_SP.issue, undefined, 'I', ME],
      [ISSUES_SP.issue, undefined, 'U', ME],
    ]);
    for (const c of calls) noForgedIds(c.params);
  });

  it('remove / removeMany: realtime.et_realtime_handle_issue_delete with cPermission SD / MD and the caller as nMasterid', async () => {
    const { svc, calls } = build();
    await svc.remove(CALLER, DELETE_BODY);
    await svc.removeMany(CALLER, { jIids: [ISSUE_BODY.nIid as string] });
    expect(calls.map((c) => [c.name, c.schema, c.params.cPermission, c.params.nMasterid])).toEqual([
      [ISSUES_SP.remove, 'realtime', 'SD', ME],
      [ISSUES_SP.remove, 'realtime', 'MD', ME],
    ]);
  });

  it('insertCategory: et_realtime_handle_issue_category (public) with cICtype I and the caller under both keys', async () => {
    const { svc, calls } = build();
    await expect(svc.insertCategory(CALLER, CATEGORY_BODY)).resolves.toEqual([{ ...WRITE_ROW, nICid: CLAIM_UPDATE_BODY.nICid }]);
    expect(calls[0]).toEqual(expect.objectContaining({ name: ISSUES_SP.category, schema: undefined, params: expect.objectContaining({ cICtype: 'I', nUserid: ME, nMasterid: ME, cCategory: 'Quantum' }) }));
    noForgedIds(calls[0].params);
  });

  it('the QFact sequences and the claim update run on the realtime schema with the caller as nUserid; the claim update answers one row', async () => {
    const { svc, calls } = build();
    await expect(svc.qfactSequence(CALLER, QFACT_SEQUENCE_BODY)).resolves.toEqual([{ ...WRITE_ROW }]);
    await expect(svc.qfactClaimSequence(CALLER, QFACT_CLAIM_SEQUENCE_BODY)).resolves.toEqual([{ ...WRITE_ROW }]);
    await expect(svc.updateClaim(CALLER, CLAIM_UPDATE_BODY)).resolves.toEqual({ ...WRITE_ROW });
    expect(calls.map((c) => [c.name, c.schema, c.params.nUserid])).toEqual([
      [ISSUES_SP.qfactSequence, 'realtime', ME],
      [ISSUES_SP.qfactClaimSequence, 'realtime', ME],
      [ISSUES_SP.updateClaim, 'realtime', ME],
    ]);
    for (const c of calls) noForgedIds(c.params);
  });

  it('a failed write answers the host\'s failure row for that route', async () => {
    const script = Object.fromEntries(Object.keys(happyScript()).map((k) => [k, failed('boom')]));
    const { svc } = build(script);
    await expect(svc.insert(CALLER, ISSUE_BODY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.issue, error: 'boom' });
    await expect(svc.removeMany(CALLER, { jIids: [] })).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.removeMany, error: 'boom' });
    await expect(svc.insertCategory(CALLER, CATEGORY_BODY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.category, error: 'boom' });
    await expect(svc.qfactSequence(CALLER, QFACT_SEQUENCE_BODY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.qfactSequence, error: 'boom' });
    await expect(svc.qfactClaimSequence(CALLER, QFACT_CLAIM_SEQUENCE_BODY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.qfactClaimSequence, error: 'boom' });
    await expect(svc.updateClaim(CALLER, CLAIM_UPDATE_BODY)).resolves.toEqual({ msg: -1, value: ISSUES_FAILED.updateClaim, error: 'boom' });
  });
});
