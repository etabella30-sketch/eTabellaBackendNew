import { DomainError, isUuidText, RowQuery } from '@app/api-kernel';

export const QFACT_PRIVATE = 'QFACTs are private and cannot be shared. Save the Full FACT first, then share it.';
const SHARE_WRITES = new Set(['fact_insert', 'fact_insert_team', 'fact_update', 'factsheet_submit', 'fact_convert']);
export const QFACT_TYPE_SQL = 'SELECT "cFType", "nUserid"::text AS "nUserid" FROM "FactMaster" WHERE "nFSid"=$1::uuid FOR SHARE';

function recipients(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  let parsed: unknown;
  try { parsed = typeof value === 'string' ? JSON.parse(value) : value; } catch { throw new DomainError('forbidden', 'Invalid share recipients'); }
  if (!Array.isArray(parsed)) throw new DomainError('forbidden', 'Invalid share recipients');
  return parsed.length > 0;
}

/** Runs inside the write transaction; request type flags cannot override the stored type. */
export async function assertQfactShareWrite(db: RowQuery, fn: string, params: Readonly<Record<string, unknown>>): Promise<void> {
  fn = fn.toLowerCase();
  if (!SHARE_WRITES.has(fn)) return;
  const hasRecipients = recipients(params.jUsers) || recipients(params.jU);
  const converting = fn === 'fact_convert' || (fn === 'fact_insert' && isUuidText(params.nQFSid));
  if (!hasRecipients && !converting) return;
  const refuse = () => { throw new DomainError('forbidden', QFACT_PRIVATE); };
  if (hasRecipients && String(params.cFtype ?? params.cFType ?? '').toUpperCase() === 'QF') refuse();
  const ids: unknown[] = [params.nFSid, params.nQFSid];
  if (params.jFSids !== undefined) {
    let bulk: unknown;
    try { bulk = typeof params.jFSids === 'string' ? JSON.parse(params.jFSids) : params.jFSids; } catch { refuse(); }
    if (!Array.isArray(bulk) || !bulk.every(isUuidText)) refuse();
    ids.push(...bulk as unknown[]);
  }
  for (const id of [...new Set(ids.filter(isUuidText))].sort()) {
    const [record] = await db.rows<{ cFType: string }>(QFACT_TYPE_SQL, [id]);
    if (!record) throw new DomainError('not_found', 'Fact not found');
    if (record.cFType === 'QF' && hasRecipients) refuse();
    if (record.cFType === 'QF' && converting) {
      const [legacy] = await db.rows<{ bLegacyShared: boolean }>('SELECT EXISTS (SELECT 1 FROM "FMShared" WHERE "nFSid"=$1::uuid) AS "bLegacyShared"', [id]);
      if (legacy?.bLegacyShared) throw new DomainError('forbidden', 'This QFACT has legacy sharing permissions. Ask your case administrator to remove those permissions before converting to a Full FACT.');
    }
  }
}

/** Legacy share rows never grant QFACT rights, even before the database backstop is installed. */
export async function qfactPermissionRow<T extends Record<string, unknown>>(db: RowQuery, actor: unknown, id: unknown, permission: T): Promise<T> {
  if (!isUuidText(id)) return permission;
  const [record] = await db.rows<{ cFType: string; nUserid: string }>(QFACT_TYPE_SQL.replace(' FOR SHARE', ''), [id]);
  if (record?.cFType !== 'QF') return permission;
  const owner = typeof actor === 'string' && actor.toLowerCase() === record.nUserid?.toLowerCase();
  const result = { ...permission, cFType: 'QF', bCanReshare: false } as Record<string, unknown>;
  if (!owner) for (const key of ['bCanView', 'bCanEdit', 'bCanDelete', 'bCanComment', 'bCanCopy']) result[key] = false;
  return result as T;
}

const FACT_LIST_READS = new Set([
  'marks', 'marknav_factlinks', 'navigate_factlist', 'navigate_get_all', 'navigate_get_all_links', 'navigate_factlinks', 'navigate_facts_bycompany',
  'navigate_task_facts', 'workspace_fact_list', 'workspace_fact_files', 'workspace_participant_factlinks',
  'realtime_navigate_get_qfact_list', 'realtime_navigate_get_all_fact_list',
  'individual_annotations_global', 'getfact_annotation', 'doc_annotations', 'annotations',
  'realtime_get_export_annotations', 'realtime_export_annotations_summary',
  'realtime_get_annotation_by_session', 'realtime_get_annotation_by_session_v2',
  'realtime_get_issue_annotation_list', 'realtime_get_issue_annotation_highlight', 'realtime_get_issue_annotation_highlight_export',
]);
export const QFACT_LIST_OWNERS_SQL = 'SELECT "nFSid"::text AS "nFSid", "cFType", "nUserid"::text AS "nUserid" FROM "FactMaster" WHERE "nFSid"=ANY($1::uuid[])';
/** Filter all mark cursors, including Issue aggregates and links, against authoritative stored ownership. */
export async function privateQfactListRows(db: RowQuery, fn: string, actor: unknown, cursors: unknown[][]): Promise<unknown[][]> {
  if (!FACT_LIST_READS.has(fn.toLowerCase())) return cursors;
  if (fn.toLowerCase() === 'marknav_factlinks') {
    const docIds = [...new Set(cursors.flat().filter((row: any) => row && !isUuidText(row.nFSid) && isUuidText(row.nBundledetailid)).map((row: any) => row.nBundledetailid.toLowerCase()))];
    if (docIds.length) {
      if (!isUuidText(actor)) return cursors.map(() => []);
      const documents = await db.rows<{ nBundledetailid: string }>(
        `SELECT DISTINCT l."nBundledetailid"::text AS "nBundledetailid" FROM "FMLinks" l JOIN "FactMaster" f ON f."nFSid"=l."nFSid" WHERE l."nBundledetailid"=ANY($1::uuid[]) AND (f."nUserid"=$2::uuid OR (f."cFType" IS DISTINCT FROM 'QF' AND EXISTS (SELECT 1 FROM "FMShared" s WHERE s."nFSid"=f."nFSid" AND s."nUserid"=$2::uuid)))`, [docIds, actor]);
      const allowed = new Set(documents.map(row => row.nBundledetailid.toLowerCase()));
      cursors = cursors.map(cursor => cursor.filter((row: any) => !row || isUuidText(row.nFSid) || !isUuidText(row.nBundledetailid) || allowed.has(row.nBundledetailid.toLowerCase())));
    }
  }
  const ids = new Set<string>();
  const markId = (row: Record<string, unknown>): string | null => {
    if (isUuidText(row.nFSid)) return row.nFSid.toLowerCase();
    const type = row.cFType ?? row.cSource ?? row.cType ?? row.linktype;
    return ['QF', 'F'].includes(String(type).toUpperCase()) && isUuidText(row.id) ? row.id.toLowerCase() : null;
  };
  const idList = (value: unknown): unknown[] | null => {
    try { const list = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(list) ? list : null; } catch { return null; }
  };
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (!value || typeof value !== 'object') return;
    const row = value as Record<string, unknown>, id = markId(row); if (id) ids.add(id);
    for (const [key, child] of Object.entries(row)) {
      if (key === 'jFSids' || (key === 'id' && String(row.type ?? row.cType).toUpperCase() === 'F' && idList(child))) (idList(child) ?? []).filter(isUuidText).forEach(id => ids.add(id.toLowerCase()));
      else collect(child);
    }
  };
  collect(cursors); if (!ids.size) return cursors;
  if (!isUuidText(actor)) return cursors.map(() => []);
  const records = await db.rows<{ nFSid: string; cFType: string; nUserid: string }>(QFACT_LIST_OWNERS_SQL, [[...ids].sort()]);
  const blocked = new Set(records.filter(row => row.cFType === 'QF' && row.nUserid?.toLowerCase() !== actor.toLowerCase()).map(row => row.nFSid.toLowerCase()));
  const found = new Set(records.map(row => row.nFSid.toLowerCase()));
  const filter = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(filter).filter(item => item !== undefined);
    if (!value || typeof value !== 'object') return value;
    if (Object.prototype.toString.call(value) !== '[object Object]') return value;
    const row = value as Record<string, unknown>, id = markId(row);
    if (id && (blocked.has(id) || (!found.has(id) && String(row.cFType ?? row.cSource ?? row.cType ?? row.linktype).toUpperCase() === 'QF'))) return undefined;
    const result = { ...row };
    for (const [key, child] of Object.entries(row)) {
      if (key === 'jFSids' || (key === 'id' && String(row.type ?? row.cType).toUpperCase() === 'F' && idList(child))) {
        const list = idList(child); if (!list) continue;
        const remaining = list.filter(id => !isUuidText(id) || !blocked.has(id.toLowerCase()));
        if (list.length && !remaining.length) return undefined;
        result[key] = typeof child === 'string' ? JSON.stringify(remaining) : remaining;
      } else result[key] = filter(child);
    }
    return result;
  };
  return filter(cursors) as unknown[][];
}
