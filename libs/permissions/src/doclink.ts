/**
 * DocLinks (DocMaster / DMLinks / DMShared): who may read one, who may delete one, and which link targets a new one
 * may name, once for both hosts and the venue box (Phase 8 of the shared-libraries plan, 2026-10-06). Before it,
 * coreapi doclink-access.ts and realtime-server doclink-view-gate.ts carried the same view rule in two copies, the
 * delete rule existed on coreapi only (realtime-server's docdelete ran the SP with no owner check and answered
 * `msg: 1` on failure), and the targets-in-case rule lived in two create gates.
 *
 *  - View: the owner (DocMaster.nUserid) or a DMShared recipient, no admin bypass: the fact read rule
 *    (et_fact_permissions.bCanView) applied to DocMaster / DMShared, the audience et_marknav_doclinks lists to.
 *  - Delete: the owner only (what et_doc_delete itself tests), and the link named (nDMLids, when sent) must be one
 *    of that DocLink's: public.et_doc_delete deleted any DMLinks row by id.
 *  - Targets: every jDl target is a document of the case (the pickers only offer the open case's bundles).
 *
 * `callerId` is always the verified Caller (R4). Outcomes are DomainErrors the host envelope renders as its old
 * statuses: 'forbidden' (403), 'unavailable' (500). Ids that are not uuids match no row and are refused or dropped
 * before any query. Pure helpers (parseDocIds, docLinkTargetIds) are shared with the box, which relays the rest.
 */
import { DomainError, isUuidText, RowQuery } from '@app/api-kernel';

export const DOCLINK_DELETE_REFUSED = 'You do not have a permission for delete';
export const DOCLINK_DELETE_CHECK_FAILED = 'Could not check access to this DocLink';
export const DOCLINK_VIEW_CHECK_FAILED = 'Could not check access to these DocLinks';
export const DOCLINK_TARGETS_REFUSED = 'You are not permitted to link documents outside this case';
export const DOCLINK_TARGETS_CHECK_FAILED = 'Could not check the linked documents';

/** $1 = the DocMaster ids asked for (uuid[]), $2 = the caller: the ids among them the caller may read. */
export const DOCLINK_VIEW_SQL = `SELECT d."nDocid" FROM "DocMaster" d
 WHERE d."nDocid" = ANY($1::uuid[])
   AND (d."nUserid" = $2
     OR EXISTS (SELECT 1 FROM "DMShared" s WHERE s."nDocid" = d."nDocid" AND s."nUserid" = $2))`;

/** $1 nDocid, $2 the caller, $3 nDMLids (nullable): one row with bAllowed. */
export const DOCLINK_DELETE_ACCESS_SQL = `
SELECT EXISTS (
    SELECT 1
    FROM "DocMaster" d
    WHERE d."nDocid" = $1::uuid
      AND d."nUserid" = $2::uuid
      AND ($3::uuid IS NULL OR EXISTS (
            SELECT 1 FROM "DMLinks" l
            WHERE l."nDMLids" = $3::uuid AND l."nDocid" = d."nDocid"
      ))
) AS "bAllowed"
`;

/** $1 nCaseid, $2 the target document ids (uuid[]): the ids among them that are documents of that case. */
export const DOCLINK_TARGETS_IN_CASE_SQL = `SELECT bd."nBundledetailid" FROM "BundleDetail" bd
 JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
 WHERE bd."nBundledetailid" = ANY($2::uuid[]) AND s."nCaseid" = $1::uuid`;

/**
 * The DocMaster ids a doclink/docdetail `jDocids` value names: the JSON array the frontends send (JSON.stringify of
 * the ids) or a single JSON string, which is what et_doc_detail accepts. Anything else is null (the SP fails on it
 * too).
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

/**
 * The target document ids of a jDl string ([[nBundledetailid, jLinktype, annots, texts], ...]) as et_doc_insert reads
 * them (NULLIF(i->>0, '')::uuid), lower-cased and de-duplicated. An element that is not a list, or whose first item
 * is null or '', names no target (the SP stores a NULL target). null when jDl is not a JSON list, or a first item is
 * anything but a UUID string (the SP would fail on it).
 */
export function docLinkTargetIds(jDl: unknown): string[] | null {
  let parsed: unknown;
  try {
    parsed = typeof jDl === 'string' ? JSON.parse(jDl) : undefined;
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const ids = new Set<string>();
  for (const link of parsed) {
    const id = Array.isArray(link) ? link[0] : null;
    if (id === null || id === undefined || id === '') continue;
    if (!isUuidText(id)) return null;
    ids.add(id.toLowerCase());
  }
  return [...ids];
}

function lookupFailed(message: string, error: unknown): DomainError {
  return new DomainError('unavailable', message, { error: (error as Error)?.message ?? String(error) });
}

/**
 * The ids in `nDocids` the caller may read, lower case, in the order given, without repeats. Ids that are not uuids,
 * missing DocLinks and other people's unshared DocLinks are left out; a caller that is not a uuid may read nothing.
 * A failed lookup throws 'unavailable', so a fault is never read as "nothing visible".
 */
export async function viewableDocLinkIds(db: RowQuery, callerId: unknown, nDocids: readonly unknown[]): Promise<string[]> {
  if (!isUuidText(callerId)) return [];
  const asked = [...new Set(nDocids.filter(isUuidText).map((id) => id.toLowerCase()))];
  if (!asked.length) return [];
  let rows: readonly { nDocid?: unknown }[];
  try {
    rows = await db.rows<{ nDocid?: unknown }>(DOCLINK_VIEW_SQL, [asked, callerId]);
  } catch (error) {
    throw lookupFailed(DOCLINK_VIEW_CHECK_FAILED, error);
  }
  const allowed = new Set(rows.map((row) => String(row?.nDocid ?? '').toLowerCase()));
  return asked.filter((id) => allowed.has(id));
}

/**
 * Delete gate: the caller owns nDocid and nDMLids, when sent, is one of its links. Throws 'forbidden' (the SP's own
 * refusal message) on any refusal, 'unavailable' when the lookup failed; refuses without a query on a non-uuid id.
 */
export async function assertCanDeleteDocLink(db: RowQuery, callerId: unknown, nDocid: unknown, nDMLids?: unknown): Promise<void> {
  const refused = () => new DomainError('forbidden', DOCLINK_DELETE_REFUSED);
  if (!isUuidText(callerId) || !isUuidText(nDocid)) throw refused();
  const link = nDMLids === undefined || nDMLids === null || nDMLids === '' ? null : nDMLids;
  if (link !== null && !isUuidText(link)) throw refused();
  let rows: readonly { bAllowed?: unknown }[];
  try {
    rows = await db.rows<{ bAllowed?: unknown }>(DOCLINK_DELETE_ACCESS_SQL, [nDocid, callerId, link]);
  } catch (error) {
    throw lookupFailed(DOCLINK_DELETE_CHECK_FAILED, error);
  }
  if (rows[0]?.bAllowed !== true) throw refused();
}

/**
 * Targets gate for a new DocLink: every id in `targets` (docLinkTargetIds) is a document of `nCaseid`. An empty list
 * passes without a query. Throws 'forbidden' when one is not, 'unavailable' when the lookup failed.
 */
export async function assertDocLinkTargetsInCase(db: RowQuery, nCaseid: unknown, targets: readonly string[]): Promise<void> {
  if (!targets.length) return;
  if (!isUuidText(nCaseid)) throw new DomainError('forbidden', DOCLINK_TARGETS_REFUSED);
  let rows: readonly { nBundledetailid?: unknown }[];
  try {
    rows = await db.rows<{ nBundledetailid?: unknown }>(DOCLINK_TARGETS_IN_CASE_SQL, [nCaseid, [...targets]]);
  } catch (error) {
    throw lookupFailed(DOCLINK_TARGETS_CHECK_FAILED, error);
  }
  const found = new Set(rows.map((row) => String(row?.nBundledetailid ?? '').toLowerCase()));
  for (const id of targets) if (!found.has(id.toLowerCase())) throw new DomainError('forbidden', DOCLINK_TARGETS_REFUSED);
}
