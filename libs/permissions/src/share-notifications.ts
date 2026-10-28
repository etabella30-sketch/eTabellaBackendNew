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

/**
 * The fact's creator, as a notification target, with the name of the colleague who shared the fact onward (R4-001,
 * 2026-10-28): the creator seldom has an FMShared row, so FACT_NEW_SHARE_USERS_SQL never names him. Only a creator
 * still on the case (an active TeamRelation) is told, like every other share recipient. DISTINCT, as in
 * FACT_NEW_SHARE_USERS_SQL: a member of several teams on the case has one TeamRelation row per team, and the
 * creator is told once.
 */
export const FACT_RESHARE_OWNER_SQL = `SELECT DISTINCT u."nUserid",u."cToken",f."nCaseid",f."nFSid",TRIM(COALESCE(a."cFname",'')||' '||COALESCE(a."cLname",'')) AS "cSharer"
 FROM public."FactMaster" f JOIN public."UserMaster" u ON u."nUserid"=f."nUserid"
 JOIN public."TeamRelation" t ON t."nUserid"=u."nUserid" AND t."nCaseid"=f."nCaseid" AND t."cStatus"='A'
 JOIN public."UserMaster" a ON a."nUserid"=$2::uuid
 WHERE f."nFSid"=$1::uuid AND u."nUserid"<>$2::uuid`;

export const FACT_RESHARED_TITLE = 'Fact shared onward';

/** "shared onward by <name>" for the creator; the recipients' own notices are factShareNotifications. */
export function factResharedMessage(sharer: unknown, addedCount: number): string {
  const name = typeof sharer === 'string' && sharer.trim() ? sharer.trim() : 'A colleague';
  return `Your Fact was shared onward by ${name} with ${addedCount} more ${addedCount === 1 ? 'person' : 'people'}`;
}

/** The creator's notice when `actor` (not the creator) shared the fact with `addedCount` new people; [] when there is nobody to tell. */
export async function factResharedNotification(db: RowQuery, factId: string, actor: string, addedCount: number): Promise<Record<string, unknown>[]> {
  if (addedCount <= 0) return [];
  const rows = await db.rows<Record<string, unknown>>(FACT_RESHARE_OWNER_SQL, [factId, actor]);
  return rows.map(({ cSharer, ...row }) => ({ ...row, cType: 'FS', cTitle: FACT_RESHARED_TITLE, cMsg: factResharedMessage(cSharer, addedCount) }));
}
