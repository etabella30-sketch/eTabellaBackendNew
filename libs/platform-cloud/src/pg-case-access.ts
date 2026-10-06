/**
 * CASE_ACCESS of the live hosts: "may this caller reach this case?", answered the way the cloud answers it today.
 *  - A caller whose caseScope is a list (an edge token: realtime-server's D22 branch) is checked against that list
 *    first, as the box and the edge-token authenticator do: a case outside the token is refused before any query,
 *    with the cCode that branch answers today. The list is a ceiling, not a membership proof, so the rule below
 *    still runs for the cases it covers.
 *  - A platform admin (the Redis session's `a` flag) is exempt from the membership rule, as every live gate that
 *    checks membership exempts global admins today (realtime-server session gates, coreapi fact-access).
 *  - Everyone else must hold a TeamRelation row on the case: CASE_MEMBER_SQL of @app/permissions, the rule the
 *    dev-only SP et_is_case_member encodes. coreapi reaches that SP only inside other SPs (et_export_delete_file and
 *    friends), no coreapi TypeScript spells it out, so the lib's text is the one copy and it runs through ROW_QUERY.
 *    A non-uuid id refuses without a query; a failed query is DomainError('unavailable'), never a refusal, so a
 *    database fault cannot read as "not a member".
 */
import { Caller, CaseAccess, DomainError, RowQuery } from '@app/api-kernel';
import { CASE_MEMBER_SQL, caseMemberParams, hasCaseMemberRow } from '@app/permissions';

/** Refusal of a case outside an edge caller's list: the cCode realtime-server's edge-token branch answers today. */
export const CASE_NOT_ALLOWED = 'case_not_allowed';

/** Refusal of a caller with no TeamRelation row on the case. */
export const NOT_CASE_MEMBER = 'not_case_member';

/** The membership query itself failed: DomainError('unavailable'), a fault and never a refusal. */
export const CASE_MEMBERSHIP_LOOKUP_FAILED = 'case_membership_lookup_failed';

/** True when `caseScope` covers `nCaseid`: always for 'membership', else by case-insensitive id (ids are uuids). */
export function inCaseScope(caseScope: Caller['caseScope'], nCaseid: string): boolean {
  if (caseScope === 'membership') return true;
  const wanted = String(nCaseid).toLowerCase();
  return caseScope.some((id) => typeof id === 'string' && id.toLowerCase() === wanted);
}

export class PgCaseAccess implements CaseAccess {
  constructor(private readonly db: RowQuery) {}

  async assertMember(caller: Caller, nCaseid: string): Promise<void> {
    if (!inCaseScope(caller.caseScope, nCaseid)) throw new DomainError('forbidden', CASE_NOT_ALLOWED, { nCaseid });
    // An edge caller's list IS the proof (plan §3.3 "edge callers use the caseScope list"): the realtime-server
    // edge-token middleware already bound it to the token's cases and the box's assignments, and the box itself
    // never asks a database. Phase 5 G0: no membership query the live route did not make before the move.
    if (caller.family === 'edge-online' || caller.family === 'edge-box') return;
    if (caller.isPlatformAdmin) return;
    const params = caseMemberParams(nCaseid, caller.userId);
    if (!params) throw new DomainError('forbidden', NOT_CASE_MEMBER, { nCaseid });
    let rows: readonly unknown[];
    try {
      rows = await this.db.rows(CASE_MEMBER_SQL, params);
    } catch (error) {
      const detail = error instanceof DomainError ? error.detail : { error: String((error as Error)?.message ?? error) };
      throw new DomainError('unavailable', CASE_MEMBERSHIP_LOOKUP_FAILED, { nCaseid, ...detail });
    }
    if (!hasCaseMemberRow(rows)) throw new DomainError('forbidden', NOT_CASE_MEMBER, { nCaseid });
  }
}
