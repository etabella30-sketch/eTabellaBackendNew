import { isUuid } from '../utility/safe-path';

export interface RowQueryDb {
  rowQuery(text: string, params?: any[]): Promise<any>;
}

/**
 * Who may read a DocLink: its owner (DocMaster.nUserid) or a DMShared recipient. It is the fact read
 * rule (et_fact_permissions.bCanView: owner or FMShared row, no admin bypass) applied to DocMaster /
 * DMShared, and the same audience et_marknav_doclinks lists DocLinks to. No SP returns DocLink
 * permissions, so this is one parametrised query over every id asked for.
 */
export const DOCLINK_VIEW_SQL = `SELECT d."nDocid" FROM "DocMaster" d
 WHERE d."nDocid" = ANY($1::uuid[])
   AND (d."nUserid" = $2
     OR EXISTS (SELECT 1 FROM "DMShared" s WHERE s."nDocid" = d."nDocid" AND s."nUserid" = $2))`;

/**
 * The ids in `nDocids` that `nMasterid` (the token user; RealtimeAuthInjectMiddleware writes it over
 * the client value) may read, in the order given, without duplicates. Ids that are not UUIDs, missing
 * DocLinks and other people's unshared DocLinks are left out. Returns null when the lookup fails, so
 * the caller answers with its failure shape instead of treating a fault as "nothing visible".
 */
export async function viewableDocLinkIds(db: RowQueryDb, nMasterid: unknown, nDocids: unknown[]): Promise<string[] | null> {
  if (!isUuid(nMasterid)) return [];
  const asked = [...new Set(nDocids.filter(isUuid).map((id) => id.toLowerCase()))];
  if (!asked.length) return [];
  let res: any;
  try {
    res = await db.rowQuery(DOCLINK_VIEW_SQL, [asked, nMasterid]);
  } catch {
    return null;
  }
  if (!res?.success || !Array.isArray(res.data)) return null;
  const allowed = new Set(res.data.map((row: any) => String(row?.nDocid ?? '').toLowerCase()));
  return asked.filter((id) => allowed.has(id));
}

/**
 * The DocMaster ids a doclink/docdetail `jDocids` value names: the JSON array the frontend sends
 * (JSON.stringify of the ids) or a single JSON string. Anything else is null (et_doc_detail would
 * fail on it too).
 */
export function parseDocIds(jDocids: unknown): string[] | null {
  if (typeof jDocids !== 'string') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jDocids);
  } catch {
    return null;
  }
  if (typeof parsed === 'string') return [parsed];
  if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) return parsed as string[];
  return null;
}
