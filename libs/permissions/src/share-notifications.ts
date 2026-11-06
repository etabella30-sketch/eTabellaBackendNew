import { isUuidText, RowQuery } from '@app/api-kernel';

export const DOCUMENT_NOTIFICATION_USERS_SQL = `SELECT DISTINCT u."nUserid",u."cToken",s."nCaseid",d."nBundledetailid"
 FROM public."BundleDetail" d JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid"
 JOIN public."TeamRelation" t ON t."nCaseid"=s."nCaseid" AND t."cStatus"='A'
 JOIN public."UserMaster" u ON u."nUserid"=t."nUserid"
 WHERE d."nBundledetailid"=$1::uuid AND ($2::uuid[] IS NULL OR u."nUserid"=ANY($2::uuid[]))
 AND u."nUserid"<>$3::uuid AND public.nt_file_visible(u."nUserid",d."nBundledetailid")`;

/** Lock the resource, not transient share-row IDs: delete/reinsert must not produce a new event. */
export const FACT_SHARE_LOCK_SQL = `SELECT "nFSid" FROM public."FactMaster" WHERE "nFSid"=$1::uuid FOR UPDATE`;
/** The prior share rows with their rights and sharer (R4-004): the level diff and the merge-mode "my own rows" rule read them. */
export const FACT_SHARE_RECIPIENTS_SQL = `SELECT "nUserid"::text AS "nUserid","bCanEdit","bCanReshare","bCanComment","nShareBy"::text AS "nShareBy" FROM public."FMShared" WHERE "nFSid"=$1::uuid`;

/**
 * The share templates (Notifications.cType) of a Mark, as the socket-app consumer and the coreapi inbox read them
 * (R4-004, 2026-10-28): FS = a Fact shared (also the creator's "shared onward" notice, R4-001), FS-LEVEL = the
 * recipient's rights changed, FS-REMOVED = the recipient was dropped from the share list, DS = a DocLink shared,
 * FD = the creator's Fact was deleted by somebody else (an admin, R4-002). The producer's own cTitle/cMsg are kept
 * for these (notificationCopy); every other template gets the generic copy.
 */
export const MARK_SHARE_TEMPLATES = Object.freeze(['FS', 'FS-LEVEL', 'FS-REMOVED', 'DS', 'FD'] as const);
export type MarkShareTemplate = (typeof MARK_SHARE_TEMPLATES)[number];
export const isMarkShareTemplate = (cType: unknown): cType is MarkShareTemplate =>
  typeof cType === 'string' && (MARK_SHARE_TEMPLATES as readonly string[]).includes(cType.toUpperCase());

/** The rights a share row grants, as one level; `read` is a row with no flag at all (the public variant's NULL rights). */
export type ShareLevel = 'read' | 'comment' | 'edit' | 'share';
export const SHARE_LEVEL_LABEL: Readonly<Record<ShareLevel, string>> = Object.freeze({ read: 'Read only', comment: 'Can comment', edit: 'Can edit', share: 'Can share' });

export interface ShareFlags {
  readonly nUserid: string;
  readonly bCanEdit?: unknown;
  readonly bCanReshare?: unknown;
  readonly bCanComment?: unknown;
}

/** A prior FMShared row: the level it grants and who granted it (null for a legacy row with no sharer). */
export interface PriorShare {
  readonly level: ShareLevel;
  readonly sharedBy: string | null;
}

const flag = (value: unknown): boolean => value === true || value === 'true';

/** The highest right a row grants, in the order the share editor lists them. */
export function shareLevelOf(row: Pick<ShareFlags, 'bCanEdit' | 'bCanReshare' | 'bCanComment'>): ShareLevel {
  if (flag(row.bCanReshare)) return 'share';
  if (flag(row.bCanEdit)) return 'edit';
  if (flag(row.bCanComment)) return 'comment';
  return 'read';
}

/** The prior share rows of the fact by recipient id (lower-cased), under the resource lock. */
export async function priorFactShares(db: RowQuery, factId: unknown): Promise<Map<string, PriorShare>> {
  if (!isUuidText(factId)) throw new Error('Missing share resource');
  // A second statement gets a fresh READ COMMITTED snapshot after waiting for the resource lock.
  await db.rows(FACT_SHARE_LOCK_SQL, [factId]);
  const rows = await db.rows<ShareFlags & { nShareBy?: unknown }>(FACT_SHARE_RECIPIENTS_SQL, [factId]);
  const prior = new Map<string, PriorShare>();
  for (const row of rows) {
    if (!isUuidText(row.nUserid)) continue;
    prior.set(row.nUserid.toLowerCase(), { level: shareLevelOf(row), sharedBy: isUuidText(row.nShareBy) ? row.nShareBy.toLowerCase() : null });
  }
  return prior;
}

export async function priorFactShareRecipients(db: RowQuery, factId: unknown): Promise<Set<string>> {
  return new Set((await priorFactShares(db, factId)).keys());
}

export function addedShareRecipients(prior: ReadonlySet<string>, requested: readonly string[], actor: string): string[] {
  return [...new Set(requested.filter(isUuidText).map(id => id.toLowerCase()))]
    .filter(id => id !== actor.toLowerCase() && !prior.has(id));
}

/** One recipient whose rights the save changed. */
export interface ShareLevelChange {
  readonly nUserid: string;
  readonly from: ShareLevel;
  readonly to: ShareLevel;
}

export interface FactShareChanges {
  /** Recipients in the list who had no row before (not the actor): told "shared with you". */
  readonly added: string[];
  /** The level each added recipient was given, by id. */
  readonly levels: Map<string, ShareLevel>;
  /** Recipients whose row the save re-levelled: told "access changed". */
  readonly levelChanges: ShareLevelChange[];
  /** Prior recipients the save dropped (never in merge mode, which deletes nothing): told "no longer shared". */
  readonly removed: string[];
}

/**
 * What a share write changed for whom (R4-004): the requested list against the prior rows. In merge mode (a
 * non-creator's reshare, R4-001) et_fact_insert_team deletes nothing and re-levels only the rows the caller granted
 * himself, so nobody is "removed" and a level change counts only for the caller's own rows. The actor's own row never
 * raises a notice.
 */
export function factShareChanges(prior: ReadonlyMap<string, PriorShare>, requested: readonly ShareFlags[], actor: string, options: { merge?: boolean } = {}): FactShareChanges {
  const me = actor.toLowerCase();
  const seen = new Set<string>();
  const added: string[] = [];
  const levels = new Map<string, ShareLevel>();
  const levelChanges: ShareLevelChange[] = [];
  for (const row of requested) {
    if (!isUuidText(row.nUserid)) continue;
    const id = row.nUserid.toLowerCase();
    if (id === me || seen.has(id)) continue;
    seen.add(id);
    const to = shareLevelOf(row);
    levels.set(id, to);
    const before = prior.get(id);
    if (!before) { added.push(id); continue; }
    if (to === before.level) continue;
    if (options.merge && before.sharedBy !== me) continue;
    levelChanges.push({ nUserid: id, from: before.level, to });
  }
  const removed = options.merge ? [] : [...prior.keys()].filter(id => id !== me && !seen.has(id));
  return { added, levels, levelChanges, removed };
}

/**
 * The new recipients as notification rows: the recipient, the fact's case, the sharer's name and the Mark's place
 * (the transferred page/line once the session is published, the live one before). $3 is the actor (null allowed).
 */
export const FACT_NEW_SHARE_USERS_SQL = `SELECT DISTINCT u."nUserid",u."cToken",f."nCaseid",f."nFSid",
 TRIM(COALESCE(a."cFname",'')||' '||COALESCE(a."cLname",'')) AS "cSharer",COALESCE(d."nTPage",d."nPage") AS "nPage",COALESCE(d."nTLine",d."nLine") AS "nLine"
 FROM public."FactMaster" f JOIN public."FMShared" s ON s."nFSid"=f."nFSid"
 JOIN public."UserMaster" u ON u."nUserid"=s."nUserid"
 JOIN public."TeamRelation" t ON t."nUserid"=u."nUserid" AND t."nCaseid"=f."nCaseid" AND t."cStatus"='A'
 LEFT JOIN public."UserMaster" a ON a."nUserid"=$3::uuid
 LEFT JOIN public."FactDetail" d ON d."nFSid"=f."nFSid"
 WHERE f."nFSid"=$1::uuid AND u."nUserid"=ANY($2::uuid[])`;

/**
 * The same row for recipients whose share row changed or is gone (FS-LEVEL / FS-REMOVED): no FMShared join, since a
 * removed recipient has no row any more; only people still on the case are told. $3 is the actor.
 */
export const FACT_SHARE_CHANGE_USERS_SQL = `SELECT DISTINCT u."nUserid",u."cToken",f."nCaseid",f."nFSid",
 TRIM(COALESCE(a."cFname",'')||' '||COALESCE(a."cLname",'')) AS "cSharer",COALESCE(d."nTPage",d."nPage") AS "nPage",COALESCE(d."nTLine",d."nLine") AS "nLine"
 FROM public."FactMaster" f
 JOIN public."TeamRelation" t ON t."nCaseid"=f."nCaseid" AND t."cStatus"='A'
 JOIN public."UserMaster" u ON u."nUserid"=t."nUserid"
 LEFT JOIN public."UserMaster" a ON a."nUserid"=$3::uuid
 LEFT JOIN public."FactDetail" d ON d."nFSid"=f."nFSid"
 WHERE f."nFSid"=$1::uuid AND u."nUserid"=ANY($2::uuid[])`;

export const MARK_SHARED_TITLE = 'Mark shared with you';
export const MARK_LEVEL_TITLE = 'Mark access changed';
export const MARK_REMOVED_TITLE = 'Mark no longer shared';

/** "p12:4" for a row that carries a page, else nothing. */
export function markPlace(row: { nPage?: unknown; nLine?: unknown }): string {
  const page = Number(row.nPage), line = Number(row.nLine);
  if (!Number.isInteger(page) || page <= 0) return '';
  return Number.isInteger(line) && line > 0 ? `p${page}:${line}` : `p${page}`;
}

const sharerName = (row: { cSharer?: unknown }): string => (typeof row.cSharer === 'string' && row.cSharer.trim() ? row.cSharer.trim() : 'A colleague');
const withPlace = (row: { nPage?: unknown; nLine?: unknown }): string => { const place = markPlace(row); return place ? ` (${place})` : ''; };

type NoticeRow = { cSharer?: unknown; nPage?: unknown; nLine?: unknown };

/** The producer copy of a share notice: names and page numbers only, never a label the inbox could not verify. */
export function factSharedMessage(row: NoticeRow, level: ShareLevel): string {
  return `${sharerName(row)} shared a Fact with you${withPlace(row)} · ${SHARE_LEVEL_LABEL[level]}`;
}
export function factLevelMessage(row: NoticeRow, change: Pick<ShareLevelChange, 'to'>): string {
  return `${sharerName(row)} changed your access to a Fact${withPlace(row)} to ${SHARE_LEVEL_LABEL[change.to]}`;
}
export function factRemovedMessage(row: NoticeRow): string {
  return `${sharerName(row)} stopped sharing a Fact${withPlace(row)} with you`;
}

/** The notice row without the lookup-only columns; `jTarget` names the annotation (the inbox resolves page, line and level live). */
function shareNoticeRow(row: Record<string, unknown>): Record<string, unknown> {
  const { cSharer: _sharer, nPage: _page, nLine: _line, ...rest } = row;
  return rest;
}

export async function factShareNotifications(db: RowQuery, factId: string, recipients: readonly string[], levels: ReadonlyMap<string, ShareLevel> = new Map(), actor: string | null = null): Promise<Record<string, unknown>[]> {
  if (!recipients.length) return [];
  const rows = await db.rows<Record<string, unknown>>(FACT_NEW_SHARE_USERS_SQL, [factId, recipients, actor]);
  return rows.map(row => {
    const level = levels.get(String(row.nUserid).toLowerCase()) ?? 'read';
    return { ...shareNoticeRow(row), cType: 'FS', cTitle: MARK_SHARED_TITLE, cMsg: factSharedMessage(row, level),
      jTarget: { type: 'annotation', annotationId: factId, sourceType: 'F', caseId: row.nCaseid } };
  });
}

/**
 * The FS-LEVEL and FS-REMOVED notices of a share write (R4-004). A removed recipient may no longer open the Mark, so
 * his notice targets the case (an annotation target would be refused for him at delivery) and carries no nFSid; the
 * level notice keeps the annotation target. [] when nothing changed.
 */
export async function factShareChangeNotifications(db: RowQuery, factId: string, actor: string, changes: Pick<FactShareChanges, 'levelChanges' | 'removed'>): Promise<Record<string, unknown>[]> {
  const ids = [...changes.levelChanges.map(c => c.nUserid), ...changes.removed];
  if (!ids.length) return [];
  const rows = await db.rows<Record<string, unknown>>(FACT_SHARE_CHANGE_USERS_SQL, [factId, ids, actor]);
  const byUser = new Map(rows.filter(row => isUuidText(row.nUserid)).map(row => [String(row.nUserid).toLowerCase(), row] as const));
  const notices: Record<string, unknown>[] = [];
  for (const change of changes.levelChanges) {
    const row = byUser.get(change.nUserid);
    if (!row) continue;
    notices.push({ ...shareNoticeRow(row), cType: 'FS-LEVEL', cTitle: MARK_LEVEL_TITLE, cMsg: factLevelMessage(row, change),
      jTarget: { type: 'annotation', annotationId: factId, sourceType: 'F', caseId: row.nCaseid } });
  }
  for (const id of changes.removed) {
    const row = byUser.get(id);
    if (!row) continue;
    const { nFSid: _fact, ...rest } = shareNoticeRow(row);
    notices.push({ ...rest, cType: 'FS-REMOVED', cTitle: MARK_REMOVED_TITLE, cMsg: factRemovedMessage(row), jTarget: { type: 'case', caseId: row.nCaseid } });
  }
  return notices;
}

/**
 * Every notice of a share write, in one call for the three hosts (rt-features factsheet.service, realtime-server and
 * coreapi fact.service): the new recipients (FS), then the level changes and removals (FS-LEVEL / FS-REMOVED). A
 * failed change lookup costs only the change notices; the new recipients are still told.
 */
export async function factShareWriteNotifications(db: RowQuery, factId: string, actor: string, changes: FactShareChanges, onChangeLookupFailed?: () => void): Promise<Record<string, unknown>[]> {
  const notices = await factShareNotifications(db, factId, changes.added, changes.levels, actor);
  if (!changes.levelChanges.length && !changes.removed.length) return notices;
  try {
    return notices.concat(await factShareChangeNotifications(db, factId, actor, changes));
  } catch {
    onChangeLookupFailed?.();
    return notices;
  }
}

/**
 * The jNotify rows of realtime.et_doc_insert the DocLink hosts may send (R3-003): a private DocLink (jUsers []) has
 * none, and the creator never hears about his own link even if the SP listed him (a self-share row, or an SP on the
 * live database older than the mirror). Anything that is not a row with a uuid recipient is dropped.
 */
export function docLinkShareNotices(jNotify: unknown, creatorId: unknown): Record<string, unknown>[] {
  if (!Array.isArray(jNotify)) return [];
  const creator = isUuidText(creatorId) ? creatorId.toLowerCase() : null;
  return jNotify.filter((row): row is Record<string, unknown> => {
    const recipient = row && typeof row === 'object' ? (row as Record<string, unknown>).nUserid : undefined;
    return isUuidText(recipient) && recipient.toLowerCase() !== creator;
  });
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

/**
 * The fact's creator, as a notification target, with the name of the colleague about to delete the fact and the
 * Mark's place (R4-002, 2026-10-28: realtime.et_factsheet_delete keeps its admin branch, so a platform or case admin
 * may delete a colleague's Fact, and the creator is told). Read BEFORE the SP runs: it deletes FactMaster and
 * FactDetail. Nobody when the actor is the creator; only a creator still on the case is told, once (DISTINCT, as in
 * FACT_RESHARE_OWNER_SQL).
 */
export const FACT_DELETE_OWNER_SQL = `SELECT DISTINCT u."nUserid",u."cToken",f."nCaseid",f."nFSid",
 TRIM(COALESCE(a."cFname",'')||' '||COALESCE(a."cLname",'')) AS "cSharer",COALESCE(d."nTPage",d."nPage") AS "nPage",COALESCE(d."nTLine",d."nLine") AS "nLine"
 FROM public."FactMaster" f JOIN public."UserMaster" u ON u."nUserid"=f."nUserid"
 JOIN public."TeamRelation" t ON t."nUserid"=u."nUserid" AND t."nCaseid"=f."nCaseid" AND t."cStatus"='A'
 JOIN public."UserMaster" a ON a."nUserid"=$2::uuid
 LEFT JOIN public."FactDetail" d ON d."nFSid"=f."nFSid"
 WHERE f."nFSid"=$1::uuid AND u."nUserid"<>$2::uuid`;

export const FACT_DELETED_TITLE = 'Fact deleted';

/** "Your Fact on p12 l4 was deleted by <name>" for the creator; the place is left out when the row carries none. */
export function factDeletedMessage(row: NoticeRow): string {
  const page = Number(row.nPage), line = Number(row.nLine);
  const place = Number.isInteger(page) && page > 0 ? (Number.isInteger(line) && line > 0 ? ` on p${page} l${line}` : ` on p${page}`) : '';
  return `Your Fact${place} was deleted by ${sharerName(row)}`;
}

/**
 * The creator's FD notice for a delete by `actor` (not the creator), to publish once the SP answered msg 1. The
 * fact is gone by then, so the notice targets the case and carries no nFSid (as FS-REMOVED does). [] for anything
 * but a uuid fact id (no query), when the actor is the creator, or when the creator left the case.
 */
export async function factDeletedNotification(db: RowQuery, factId: unknown, actor: string): Promise<Record<string, unknown>[]> {
  if (!isUuidText(factId)) return [];
  const rows = await db.rows<Record<string, unknown>>(FACT_DELETE_OWNER_SQL, [factId, actor]);
  return rows.map(row => {
    const { nFSid: _fact, ...rest } = shareNoticeRow(row);
    return { ...rest, cType: 'FD', cTitle: FACT_DELETED_TITLE, cMsg: factDeletedMessage(row), jTarget: { type: 'case', caseId: row.nCaseid } };
  });
}
