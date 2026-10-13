import { isUuidText, RowQuery } from '@app/api-kernel';

export const DOCUMENT_NOTIFICATION_USERS_SQL = `SELECT DISTINCT u."nUserid",u."cToken",s."nCaseid",d."nBundledetailid"
 FROM public."BundleDetail" d JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid"
 JOIN public."TeamRelation" t ON t."nCaseid"=s."nCaseid" AND t."cStatus"='A'
 JOIN public."UserMaster" u ON u."nUserid"=t."nUserid"
 WHERE d."nBundledetailid"=$1::uuid AND ($2::uuid[] IS NULL OR u."nUserid"=ANY($2::uuid[]))
 AND u."nUserid"<>$3::uuid AND public.nt_file_visible(u."nUserid",d."nBundledetailid")`;

/** Lock the resource, not transient share-row IDs: delete/reinsert must not produce a new event. */
export const FACT_SHARE_LOCK_SQL = `SELECT "nFSid" FROM public."FactMaster" WHERE "nFSid"=$1::uuid FOR UPDATE`;
export const FACT_SHARE_RECIPIENTS_SQL = `SELECT "nUserid"::text AS "nUserid" FROM public."FMShared" WHERE "nFSid"=$1::uuid`;

export const FACT_NEW_SHARE_USERS_SQL = `SELECT DISTINCT u."nUserid",u."cToken",f."nCaseid",f."nFSid"
 FROM public."FactMaster" f JOIN public."FMShared" s ON s."nFSid"=f."nFSid"
 JOIN public."UserMaster" u ON u."nUserid"=s."nUserid"
 JOIN public."TeamRelation" t ON t."nUserid"=u."nUserid" AND t."nCaseid"=f."nCaseid" AND t."cStatus"='A'
 WHERE f."nFSid"=$1::uuid AND u."nUserid"=ANY($2::uuid[])`;

export async function priorFactShareRecipients(db: RowQuery, factId: unknown): Promise<Set<string>> {
  if (!isUuidText(factId)) throw new Error('Missing share resource');
  // A second statement gets a fresh READ COMMITTED snapshot after waiting for the resource lock.
  await db.rows(FACT_SHARE_LOCK_SQL, [factId]);
  const rows = await db.rows<{ nUserid: string }>(FACT_SHARE_RECIPIENTS_SQL, [factId]);
  return new Set(rows.filter(row => isUuidText(row.nUserid)).map(row => row.nUserid.toLowerCase()));
}

export function addedShareRecipients(prior: ReadonlySet<string>, requested: readonly string[], actor: string): string[] {
  return [...new Set(requested.filter(isUuidText).map(id => id.toLowerCase()))]
    .filter(id => id !== actor.toLowerCase() && !prior.has(id));
}

export async function factShareNotifications(db: RowQuery, factId: string, recipients: readonly string[]): Promise<Record<string, unknown>[]> {
  if (!recipients.length) return [];
  const rows = await db.rows<Record<string, unknown>>(FACT_NEW_SHARE_USERS_SQL, [factId, recipients]);
  return rows.map(row => ({ ...row, cType: 'FS', cTitle: 'Annotation shared', cMsg: 'An annotation was shared with you.' }));
}
