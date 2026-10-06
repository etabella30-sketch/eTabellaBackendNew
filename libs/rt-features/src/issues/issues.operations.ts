/**
 * The operations port of the issue and claim routes the venue box relays (plan §3.3, Phase 9): the claims + issues
 * list of the QFact picker and the eight writes (issue insert / update / delete / multi-delete, claim insert, the two
 * QFact sequence saves, claim update). realtime-server binds IssuesService (the SPs over SP_EXECUTOR); the box binds
 * a relay adapter over CLOUD_RELAY. Every answer is the legacy wire body: the SP's row(s) or cursors, or the
 * `{ msg: -1, value, error }` failure row the host answered with 2xx. The host's other issue/* routes (categories
 * update / delete, issue details, highlights, exports, ...) stay in its own controller.
 */
import type { Caller } from '@app/api-kernel';

import type {
  ClaimUpdateFields,
  IssueCategoryFields,
  IssueDeleteFields,
  IssueFields,
  IssueListFields,
  QFactClaimSequenceFields,
  QFactSequenceFields,
} from './dto/issues.dto';

export const ISSUES_OPS = 'RT_ISSUES_OPS';

export interface IssuesOperations {
  /** `issue/issuelist_V2`: the two cursors of et_realtime_issuelist_group (claims, issues), the caller's team only. */
  list(caller: Caller, query: IssueListFields): Promise<unknown>;
  /** `issue/insertIssue` (cPermission 'I'). */
  insert(caller: Caller, body: IssueFields): Promise<unknown>;
  /** `issue/updateIssue` (cPermission 'U'). */
  update(caller: Caller, body: IssueFields): Promise<unknown>;
  /** `issue/deleteIssue` (cPermission 'SD'). */
  remove(caller: Caller, body: IssueDeleteFields): Promise<unknown>;
  /** `issue/delete/multi/issue` (cPermission 'MD'). */
  removeMany(caller: Caller, body: IssueDeleteFields): Promise<unknown>;
  /** `issue/insertCategory` (cICtype 'I'): a new claim. */
  insertCategory(caller: Caller, body: IssueCategoryFields): Promise<unknown>;
  /** `issue/qfact/sequence`: the caller's QFact issue order and visibility. */
  qfactSequence(caller: Caller, body: QFactSequenceFields): Promise<unknown>;
  /** `issue/qfact/claim/sequence`: the caller's QFact claim order. */
  qfactClaimSequence(caller: Caller, body: QFactClaimSequenceFields): Promise<unknown>;
  /** `issue/updateClaimDetail`. */
  updateClaim(caller: Caller, body: ClaimUpdateFields): Promise<unknown>;
}
