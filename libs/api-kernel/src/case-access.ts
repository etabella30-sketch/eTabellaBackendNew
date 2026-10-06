/**
 * The case-membership port. The rule itself (the SQL on the cloud, the `caseScope` list on the box) is an adapter;
 * shared code only asks "may this caller reach this case?" and gets a DomainError('forbidden') when not. Platform
 * admins are the adapter's decision too: the guard never exempts anyone itself.
 */
import type { Caller } from './caller';

export const CASE_ACCESS = 'ET_CASE_ACCESS';

export interface CaseAccess {
  /** Resolves when the caller may reach the case; throws DomainError('forbidden') otherwise. */
  assertMember(caller: Caller, nCaseid: string): Promise<void>;
}
