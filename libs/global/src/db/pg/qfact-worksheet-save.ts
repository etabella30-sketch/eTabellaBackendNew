import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isUuidText } from '@app/api-kernel';
import type { DbService } from './db.service';
import { currentSaveTransaction } from './save-transaction';

export const QFACT_WORKSHEET_STATE_SQL = `SELECT f."nFSid"::text AS "nFSid", f."nUserid"::text AS "nUserid", f."nCaseid"::text AS "nCaseid", f."cFType",
 d."jTexts", d."nColorid"::text AS "nColorid", d."cIsNote", d."nPage", d."nLine",
 COALESCE((SELECT jsonb_agg(jsonb_build_array(i."nIssueid",i."nImpactid",i."nRelevanceid") ORDER BY i."nIssueid") FROM "FMIssue" i WHERE i."nFSid"=f."nFSid"),'[]'::jsonb) AS issues,
 COALESCE((SELECT jsonb_agg(c."nContactid" ORDER BY c."nContactid") FROM "FMContact" c WHERE c."nFSid"=f."nFSid"),'[]'::jsonb) AS contacts,
 (EXISTS (SELECT 1 FROM "TeamRelation" tr WHERE tr."nUserid"=$2::uuid AND tr."nCaseid"=f."nCaseid" AND tr."cStatus"='A')
   OR EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid"=$2::uuid AND u."isAdmin"=true)) AS "bCase",
 to_regclass('public."QFactWorksheetAudit"') IS NOT NULL AS "bAuditReady"
 FROM "FactMaster" f JOIN "FactDetail" d ON d."nFSid"=f."nFSid" WHERE f."nFSid"=$1::uuid`;
export const QFACT_WORKSHEET_ISSUES_SQL = `SELECT "nIid"::text AS id, "nUserid" IS NULL AND lower(btrim("cIName"))='unassigned' AS system
 FROM "RIssueMaster" WHERE "nCaseid"=$1::uuid ORDER BY "nIid" FOR SHARE`;
export const QFACT_WORKSHEET_AUDIT_SQL = `INSERT INTO public."QFactWorksheetAudit"("nFSid","nCaseid","nUserid",operation,"beforeIssues","afterIssues","beforeVersion","afterNoteHash")
 VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5::jsonb,$6::jsonb,$7,$8)`;

interface State { nFSid: string; nUserid: string; nCaseid: string; cFType: string; jTexts: unknown; nColorid: string; cIsNote: string; nPage: number; nLine: number; issues: unknown[][]; contacts: string[]; bCase: boolean; bAuditReady: boolean; }
export interface WorksheetAudit { id: string; caseId: string; actor: string; action: string; before: unknown[][]; after: unknown[][]; version: string; noteHash: string; }
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => [k,canonical(v)])) : value;
export function qfactWorksheetVersion(state: Pick<State, 'jTexts' | 'issues' | 'contacts' | 'nPage' | 'nLine'>): string {
  return createHash('sha256').update(JSON.stringify(canonical([state.jTexts, state.issues, state.contacts, state.nPage, state.nLine]))).digest('hex');
}
async function rows(db: DbService, sql: string, params: unknown[]): Promise<any[]> {
  const result = await db.rowQuery(sql, params);
  if (!result.success) throw new Error('QFact worksheet data is unavailable');
  return result.data;
}
export async function qfactWorksheetDetail(db: DbService, actor: unknown, detail: unknown): Promise<unknown> {
  const item = detail as Record<string, unknown> | null;
  if (!item || item.cFType !== 'QF' || !isUuidText(actor) || !isUuidText(item.nFSid) || String(item.nUserid).toLowerCase() !== actor.toLowerCase()) return detail;
  const [state] = await rows(db, QFACT_WORKSHEET_STATE_SQL, [item.nFSid, actor]);
  if (!state || state.cFType !== 'QF' || state.nUserid?.toLowerCase() !== actor.toLowerCase() || !state.bCase) throw new ForbiddenException('This QFact is unavailable in your case.');
  // The content and its version must come from the SAME statement's snapshot.
  return { ...item, jTexts: state.jTexts, nPage: state.nPage, nLine: state.nLine, nColorid: state.nColorid, cIsNote: state.cIsNote,
    nCaseid: state.nCaseid, bWorksheetSafeEdit: state.bAuditReady === true, worksheetVersion: qfactWorksheetVersion(state) };
}
export function changedWorksheetIssues(before: readonly unknown[][], action: string, issueId: string, replacementId: string | undefined, issues: readonly { id: string; system: boolean }[]): unknown[][] {
  const target = issues.find(i => i.id === issueId && !i.system), replacement = issues.find(i => i.id === replacementId && !i.system);
  if (!['add','remove','replace'].includes(action) || !target || (action === 'replace' && (!replacement || replacement.id === target.id))) throw new BadRequestException('Choose valid, different case Issues.');
  const ids = new Set(before.map(row => String(row[0])));
  if (action !== 'add' && !ids.has(issueId)) return before.map(row => [...row]);
  let next = before.map(row => [...row]);
  if (action === 'add' && !ids.has(issueId)) next.push([issueId,0,0]);
  if (action !== 'add') next = next.filter(row => row[0] !== issueId);
  if (action === 'replace' && !ids.has(replacementId!)) next.push([replacementId,0,0]);
  const system = issues.find(i => i.system);
  if (next.some(row => row[0] !== system?.id)) next = next.filter(row => row[0] !== system?.id);
  if (!next.length) { if (!system) throw new ConflictException('The Unassigned Issue is unavailable.'); next = [[system.id,0,0]]; }
  return [...new Map(next.map(row => [row[0],row])).values()];
}
/** Prepares the legacy SP payload exclusively from locked server data. Never trusts a proposed complete assignment list. */
export async function guardQfactWorksheetSave(db: DbService, actor: unknown, body: Record<string, unknown>): Promise<WorksheetAudit> {
  if (!currentSaveTransaction()) throw new Error('QFact worksheet writes require a save transaction');
  let envelope: any;
  try { envelope = JSON.parse(String(body.jTexts)); } catch { throw new BadRequestException('Invalid worksheet edit'); }
  const { caseId, expected, change } = envelope ?? {};
  if (!isUuidText(actor) || !isUuidText(caseId) || !isUuidText(body.nFSid) || expected?.id !== body.nFSid || typeof expected?.version !== 'string' || !change || !['note','add','remove','replace'].includes(change.action)) throw new BadRequestException('Invalid worksheet edit');
  // Serialize the master/detail first. Read associations in a NEW statement after acquiring the lock;
  // a waiting READ COMMITTED statement's original snapshot must not be used for the version check.
  await rows(db, 'SELECT f."nFSid" FROM "FactMaster" f JOIN "FactDetail" d ON d."nFSid"=f."nFSid" WHERE f."nFSid"=$1::uuid FOR UPDATE OF f,d', [body.nFSid]);
  const [state] = await rows(db, QFACT_WORKSHEET_STATE_SQL, [body.nFSid, actor]);
  if (!state || state.cFType !== 'QF' || state.nUserid?.toLowerCase() !== actor.toLowerCase() || state.nCaseid !== caseId || !state.bCase) throw new ForbiddenException('This QFact is unavailable in your case.');
  if (!state.bAuditReady) throw new ConflictException('The worksheet audit migration is required before editing.');
  const version = qfactWorksheetVersion(state);
  if (expected.version !== version) throw new ConflictException('This QFact changed in another window. Load the current saved Note or reload the Issue preview before retrying.');
  let after = state.issues as unknown[][];
  let texts = state.jTexts;
  if (change.action === 'note') {
    if (typeof change.note !== 'string' || change.note.length > 1000000) throw new BadRequestException('Enter a valid Note.');
    texts = change.note ? [change.note] : [];
  } else {
    if (!isUuidText(change.issueId) || (change.action === 'replace' && !isUuidText(change.replacementId))) throw new BadRequestException('Choose valid case Issues.');
    const issues = await rows(db, QFACT_WORKSHEET_ISSUES_SQL, [caseId]);
    after = changedWorksheetIssues(state.issues, change.action, change.issueId, change.replacementId, issues);
  }
  // Same source coordinates, contacts, note and grades unless the user changed exactly that field.
  const colorId = after.some(row => row[0] === state.nColorid) ? state.nColorid : String(after[after.length - 1]?.[0] ?? '');
  if (!isUuidText(colorId)) throw new ConflictException('The QFact has no valid Issue association. Reload it before editing.');
  Object.assign(body, { nColorid: colorId, jIssue: JSON.stringify(after), jTexts: JSON.stringify(texts ?? []),
    cIsNote: change.action === 'note' ? (change.note ? 'Y' : 'N') : state.cIsNote,
    jContacts: JSON.stringify(state.contacts), nPage: Number(state.nPage) || 0, nLine: Number(state.nLine) || 0 });
  return { id: state.nFSid, caseId, actor, action: change.action, before: state.issues, after, version,
    noteHash: createHash('sha256').update(JSON.stringify(canonical(texts))).digest('hex') };
}
export async function auditQfactWorksheetSave(db: DbService, audit: WorksheetAudit): Promise<void> {
  await rows(db, QFACT_WORKSHEET_AUDIT_SQL, [audit.id,audit.caseId,audit.actor,audit.action,JSON.stringify(audit.before),JSON.stringify(audit.after),audit.version,audit.noteHash]);
}
