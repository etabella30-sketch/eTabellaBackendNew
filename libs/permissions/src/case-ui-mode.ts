import { DomainError, RowQuery, isUuidText } from '@app/api-kernel';

export const ADVANCED_VIEW_ONLY = 'Advanced records are view-only in Essential for this case. Switch to Advanced to modify them.';
export const CASE_MODE_SQL = `SELECT COALESCE((SELECT "cUIMode" FROM "UserCaseUiMode"
  WHERE "nUserid" = $1::uuid AND "nCaseid" = $2::uuid FOR SHARE), 'E') AS "cUIMode"`;

/** The catalog is shared by every cloud SP caller, including legacy and bulk entry points. */
const FACT_WRITES = new Set([
  'fact_insert', 'fact_insert_detail', 'fact_insert_links', 'fact_insert_issues', 'fact_insert_contact',
  'fact_insert_task', 'fact_insert_team', 'fact_delete', 'fact_update', 'fact_quick_update',
  'fact_convert', 'individual_update_facts_note', 'fact_highlight_add', 'fact_highlight_delete_by_uuid',
  'factsheet_submit', 'factsheet_delete', 'factsheet_unshare_withme', 'manage_comments',
  'assign_fact', 'unassign_fact', 'fact_task_delete',
]);
const ADVANCED_WRITES = new Set([
  'task_insert', 'task_insert_detail', 'task_insert_detail_v2', 'task_insert_reminder', 'task_insert_reminder_v2',
  'task_insert_assign', 'task_insert_assign_v2', 'task_delete', 'task_update_status',
  'contactbuilder', 'case_contactbuilder', 'companybuilder', 'contact_rolebuilder', 'contact_case_rolebuilder',
  'assign_contact', 'unassign_contact', 'assign_task', 'unassign_task', 'doc_insert', 'doc_delete', 'workspace_task_factlink', 'sidenav_task_update_status',
]);
export function modeRestrictedWrite(fn: string): boolean {
  return FACT_WRITES.has(fn.toLowerCase()) || ADVANCED_WRITES.has(fn.toLowerCase());
}

/** Always resolve an existing record's case/type from storage; request flags cannot downgrade a Full Fact. */
export async function assertCaseModeWrite(db: RowQuery, fn: string, params: Readonly<Record<string, unknown>>): Promise<void> {
  fn = fn.toLowerCase();
  if (!modeRestrictedWrite(fn)) return;
  const actor = params.nMasterid; // supplied by authenticated middleware / verified Caller
  if (!isUuidText(actor)) throw new DomainError('unauthenticated', 'Sign in to continue.');
  if (fn === 'workspace_task_factlink') {
    let ids: unknown;
    try { ids = typeof params.jFactids === 'string' ? JSON.parse(params.jFactids) : params.jFactids; } catch { /* validated below */ }
    if (!Array.isArray(ids) || !ids.every(isUuidText)) throw new DomainError('forbidden', 'Valid fact ids are required.');
    for (const id of [...new Set(ids)].sort()) await assertCaseModeWrite(db, 'fact_insert_task', { nMasterid: actor, nFSid: id });
  }
  // Validate every target of a bulk operation before any stored procedure can write.
  if (FACT_WRITES.has(fn) && params.jFSids !== undefined) {
    let ids: unknown;
    try { ids = typeof params.jFSids === 'string' ? JSON.parse(params.jFSids) : params.jFSids; } catch { /* fail closed below */ }
    if (!Array.isArray(ids) || !ids.length || !ids.every(isUuidText)) throw new DomainError('forbidden', 'Valid fact ids are required.');
    const { jFSids: _bulk, ...rest } = params;
    for (const id of [...new Set(ids)].sort()) await assertCaseModeWrite(db, fn, { ...rest, nFSid: id });
    return;
  }
  let caseId: unknown = params.nCaseid;
  // Only a fact operation may use nFSid to choose its target. A linked fact in
  // another case must never substitute for the task/contact/doc being changed.
  const factId = FACT_WRITES.has(fn) ? (isUuidText(params.nFSid) ? params.nFSid : fn === 'fact_insert' ? params.nQFSid : undefined) : undefined;
  if (isUuidText(factId)) {
    const [fact] = await db.rows<{ nCaseid: string; cFType: string }>(
      'SELECT "nCaseid"::text AS "nCaseid", "cFType" FROM "FactMaster" WHERE "nFSid" = $1::uuid FOR SHARE', [factId]);
    if (!fact) throw new DomainError('not_found', 'Fact not found');
    caseId = fact.nCaseid;
    // Type, rather than the mode in which a QFACT was created, controls its capability.
    // Converting to a Full Fact and adding Advanced relationships still require Advanced.
    // Existing participant mentions are part of normal QFACT creation/editing.
    const advancedRelationship = ['fact_convert', 'fact_insert_task', 'fact_task_delete', 'factsheet_submit'].includes(fn)
      || (fn === 'fact_insert' && (params.cFtype !== 'QF' || isUuidText(params.nQFSid)));
    if (FACT_WRITES.has(fn) && fact.cFType === 'QF' && !advancedRelationship) return;
  } else if (fn.startsWith('task_') || ['assign_task', 'unassign_task', 'workspace_task_factlink', 'sidenav_task_update_status'].includes(fn)) {
    if (fn !== 'task_insert' || params.permission !== 'N') {
    const [task] = await db.rows<{ nCaseid: string }>(
      'SELECT "nCaseid"::text AS "nCaseid" FROM "TaskMaster" WHERE "nTaskid" = $1::uuid', [params.nTaskid]);
    caseId = task?.nCaseid;
    }
  } else if (['doc_insert', 'doc_delete'].includes(fn) && isUuidText(params.nDocid)) {
    const [doc] = await db.rows<{ nCaseid: string }>(
      'SELECT "nCaseid"::text AS "nCaseid" FROM "DocMaster" WHERE "nDocid" = $1::uuid', [params.nDocid]);
    caseId = doc?.nCaseid;
  } else if (['contactbuilder', 'case_contactbuilder', 'assign_contact', 'unassign_contact'].includes(fn) && isUuidText(params.nContactid)) {
    const [contact] = await db.rows<{ nCaseid: string }>(
      'SELECT "nCaseid"::text AS "nCaseid" FROM "ContactMaster" WHERE "nContactid" = $1::uuid', [params.nContactid]);
    caseId = contact?.nCaseid;
  } else if (fn === 'companybuilder' && isUuidText(params.nCompanyid)) {
    const [company] = await db.rows<{ nCaseid: string }>(
      'SELECT "nCaseid"::text AS "nCaseid" FROM "ContactCompany" WHERE "nCompanyid" = $1::uuid', [params.nCompanyid]);
    caseId = company?.nCaseid;
  } else if (['contact_rolebuilder', 'contact_case_rolebuilder'].includes(fn) && isUuidText(params.nCRoleid)) {
    const [role] = await db.rows<{ nCaseid: string }>(
      'SELECT "nCaseid"::text AS "nCaseid" FROM "ContactRole" WHERE "nCRoleid" = $1::uuid', [params.nCRoleid]);
    caseId = role?.nCaseid;
  } else if (fn === 'fact_insert' && params.cFtype === 'QF' && !isUuidText(params.nQFSid)) {
    return;
  }
  if (!isUuidText(caseId) && isUuidText(params.nBDid)) {
    const [doc] = await db.rows<{ nCaseid: string }>(
      'SELECT s."nCaseid"::text AS "nCaseid" FROM "BundleDetail" b JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid" WHERE b."nBundledetailid" = $1::uuid', [params.nBDid]);
    caseId = doc?.nCaseid;
  }
  if (!isUuidText(caseId)) throw new DomainError('forbidden', 'Could not determine the case for this modification.');
  const [row] = await db.rows<{ cUIMode: string }>(CASE_MODE_SQL, [actor, caseId]);
  if (row?.cUIMode !== 'A') throw new DomainError('forbidden', ADVANCED_VIEW_ONLY);
}
