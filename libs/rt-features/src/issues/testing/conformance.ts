/**
 * Gate G2 of the issue and claim box rows: the fixtures and the answers every host that executes IssuesService must
 * give (the lib's own spec and the host's golden specs run them; the box relays, so its gate is relay parity in
 * apps/rt-edge). The SPs are scripted by name and every call recorded; the team rule's SQL by text. Test code only.
 */
import type { Caller, RowQuery, SpExecutor, SpOutcome } from '@app/api-kernel';
import { OUTSIDE_CALLER_TEAMS_SQL } from '@app/permissions';

export const ME = '11111111-1111-4111-8111-111111111111';
export const MATE = '22222222-2222-4222-8222-222222222222';
/** On the case, but on another team than ME (the team rule, D3). */
export const OUTSIDER = '33333333-3333-4333-8333-333333333333';
export const CASE = '44444444-4444-4444-8444-444444444444';
export const CLAIM = '55555555-5555-4555-8555-555555555555';
export const ISSUE = '66666666-6666-4666-8666-666666666666';
export const OUTSIDER_ISSUE = '77777777-7777-4777-8777-777777777777';

export const CALLER: Caller = Object.freeze({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });

export const ok = (...cursors: readonly unknown[][]): SpOutcome<any> => ({ ok: true, cursors });
export const failed = (error = 'relation missing'): SpOutcome<any> => ({ ok: false, error });

/** The claims cursor of et_realtime_issuelist_group (no creator column). */
export const CLAIM_ROWS = Object.freeze([{ nICid: CLAIM, cCategory: 'Liability', cColor: '#ff0', edit: true, delete: false }]);
/** The issues cursor: the caller's, a teammate's, the Unassigned seed (no creator) and, wrongly, an outsider's. */
export const ISSUE_ROWS = Object.freeze([
  { nIid: ISSUE, cIName: 'Delay', nICid: CLAIM, nUserid: ME },
  { nIid: 'i-mate', cIName: 'Costs', nICid: CLAIM, nUserid: MATE },
  { nIid: 'i-seed', cIName: 'Unassigned', nICid: CLAIM, nUserid: null },
  { nIid: OUTSIDER_ISSUE, cIName: 'Secret', nICid: CLAIM, nUserid: OUTSIDER },
]);
export const EXPECTED_LIST = Object.freeze([CLAIM_ROWS, ISSUE_ROWS.filter((r) => r.nUserid !== OUTSIDER)]);
export const LIST_QUERY = Object.freeze({ nCaseid: CASE, nSessionid: null, nIDid: null, nUserid: 'forged-by-client' });

export const ISSUE_BODY = Object.freeze({ nIid: ISSUE, cIName: 'Delay', cColor: '#ff0', nICid: CLAIM, nCaseid: CASE, nUserid: 'forged-by-client', nMasterid: 'forged-too' });
export const DELETE_BODY = Object.freeze({ nIid: ISSUE });
export const CATEGORY_BODY = Object.freeze({ nCaseid: CASE, cCategory: 'Quantum', nUserid: 'forged-by-client' });
export const QFACT_SEQUENCE_BODY = Object.freeze({ nCaseid: CASE, jIssues: [{ nIid: ISSUE, nQFactSequence: 1, bVisible: true }], nUserid: 'forged-by-client' });
export const QFACT_CLAIM_SEQUENCE_BODY = Object.freeze({ nCaseid: CASE, jClaims: [{ nICid: CLAIM, nQFactSequence: 1 }], nUserid: 'forged-by-client' });
export const CLAIM_UPDATE_BODY = Object.freeze({ nICid: CLAIM, cCategory: 'Liability (amended)', nUserid: 'forged-by-client' });

export const WRITE_ROW = Object.freeze({ msg: 1, value: 'Done' });

export interface RecordedSpCall {
  readonly name: string;
  readonly params: Record<string, unknown>;
  readonly schema: string | undefined;
}

export function scriptedExecutor(script: Record<string, SpOutcome<any>>): { sp: SpExecutor; calls: RecordedSpCall[] } {
  const calls: RecordedSpCall[] = [];
  const sp: SpExecutor = {
    async call(name, params, schema) {
      calls.push({ name, params: { ...params }, schema });
      const outcome = script[name];
      if (!outcome) throw new Error(`unscripted SP ${name}`);
      return outcome;
    },
  };
  return { sp, calls };
}

/** The team rule's SQL answered with `outsiders`; `fail` makes the lookup throw. */
export function teamRule(outsiders: readonly string[] = [OUTSIDER], fail = false): { rows: RowQuery; queries: Array<{ sql: string; params: readonly unknown[] }> } {
  const queries: Array<{ sql: string; params: readonly unknown[] }> = [];
  const rows: RowQuery = {
    async rows<R>(sql: string, params: readonly unknown[]): Promise<readonly R[]> {
      queries.push({ sql, params });
      if (fail) throw new Error('db down');
      if (sql !== OUTSIDE_CALLER_TEAMS_SQL) throw new Error(`unexpected sql: ${sql}`);
      const asked = params[2] as readonly string[];
      return outsiders.filter((id) => asked.includes(id)).map((nUserid) => ({ nUserid })) as unknown as R[];
    },
  };
  return { rows, queries };
}

export function happyScript(): Record<string, SpOutcome<any>> {
  return {
    realtime_issuelist_group: ok([...CLAIM_ROWS], [...ISSUE_ROWS]),
    realtime_handle_issue_master: ok([{ ...WRITE_ROW, nIid: ISSUE }]),
    realtime_handle_issue_delete: ok([{ ...WRITE_ROW }]),
    realtime_handle_issue_category: ok([{ ...WRITE_ROW, nICid: CLAIM }]),
    realtime_handle_qfact_secquence: ok([{ ...WRITE_ROW }]),
    realtime_handle_qfact_claim_secquence: ok([{ ...WRITE_ROW }]),
    realtime_handle_update_claim: ok([{ ...WRITE_ROW }]),
  };
}
