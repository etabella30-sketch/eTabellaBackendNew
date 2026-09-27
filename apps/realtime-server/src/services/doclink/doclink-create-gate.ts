import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import type { RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { assertCanCreateFact } from '../fact/fact-create-gate';
import { isUuid } from '../utility/safe-path';

const logger = new Logger('DocLinkCreateGate');

/**
 * $1 nCaseid, $2 the jDl target ids (uuid[]): the targets that are documents of that case, through
 * their section (the bDocInCase rule of FACT_CREATE_TARGET_SQL). et_doc_insert writes one DMLinks row
 * per target as given, and doclink/docdetail then returns each target's file name, exhibit number, tab
 * and bundle tag to the DocLink's owner and share recipients.
 */
export const DOCLINK_TARGETS_IN_CASE_SQL = `SELECT bd."nBundledetailid" FROM "BundleDetail" bd
 JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
 WHERE bd."nBundledetailid" = ANY($2::uuid[]) AND s."nCaseid" = $1::uuid`;

/** The fields of an InsertDoc body the gate reads. */
export interface DocLinkCreateTarget {
  nMasterid?: unknown;
  nCaseid?: unknown;
  nBundledetailid?: unknown;
  nSesid?: unknown;
  jDl?: unknown;
}

/**
 * The target document ids of a jDl string ([[nBundledetailid, jLinktype, annots, texts], ...]) as
 * et_doc_insert reads them (NULLIF(i->>0, '')::uuid), lower-cased and de-duplicated. An element that
 * is not a list, or whose first item is null or '', names no target (the SP stores a NULL target). null
 * when jDl is not a JSON list, or a first item is anything but a UUID string (the SP would fail on it).
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
    if (!isUuid(id)) return null;
    ids.add(id.toLowerCase());
  }
  return [...ids];
}

/**
 * Create gate for doclink/insertdoc, run before realtime.et_doc_insert or any other write. That SP
 * stores the client's nCaseid, nBundledetailid (the source document) and nSesid (the source session)
 * on the new DocMaster row as given, as et_fact_insert does for a fact, so the fact create rule applies
 * unchanged (assertCanCreateFact, fact-create-gate.ts): the caller (req.user) is a global admin or an
 * active member (TeamRelation, cStatus 'A') of the case named by nCaseid, the case exists, the source
 * document, when sent, is in that case, and the session, when sent, is in that case, not deleted and
 * visible to the caller (callerCanSeeSession). nCaseid is required. Only the refusal text differs.
 * The DocLink's target documents (jDl) must be documents of that case as well, for global admins too
 * (DOCLINK_TARGETS_IN_CASE_SQL): both pickers only offer the open case's bundles.
 *
 * 403 on any refusal, 500 when a lookup fails. Call it outside any try/catch that turns errors into
 * a 200, so the status reaches the client.
 */
export async function assertCanCreateDocLink(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  body: DocLinkCreateTarget | undefined,
): Promise<void> {
  const refused = () => new ForbiddenException('You are not permitted to add document links to this case');
  const targets = docLinkTargetIds(body?.jDl);
  if (!targets) throw refused();
  try {
    await assertCanCreateFact(db, user, {
      nMasterid: body?.nMasterid,
      nCaseid: body?.nCaseid,
      nBDid: body?.nBundledetailid,
      nSesid: body?.nSesid,
    });
  } catch (error) {
    if (error instanceof ForbiddenException) throw refused();
    throw error;
  }
  if (!targets.length) return;

  let res: any;
  try {
    res = await db.rowQuery(DOCLINK_TARGETS_IN_CASE_SQL, [body?.nCaseid, targets]);
  } catch (error) {
    res = { success: false, error };
  }
  if (!res?.success || !Array.isArray(res.data)) {
    logger.error(`doclink target lookup failed: ${res?.error?.message ?? res?.error}`);
    throw new InternalServerErrorException('Could not check access to this case');
  }
  const inCase = new Set(res.data.map((row: any) => String(row?.nBundledetailid ?? '').toLowerCase()));
  if (targets.some((id) => !inCase.has(id))) throw refused();
}
