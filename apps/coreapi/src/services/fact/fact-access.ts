import { ForbiddenException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('FactAccess');

type Db = Pick<DbService, 'executeRef'>;

/** One et_fact_permissions row for (caller, fact). */
export interface FactPermissionRow {
    nFSid?: string;
    nUserid?: string;
    bCanView?: boolean;
    bCanEdit?: boolean;
    bCanReshare?: boolean;
    bCanComment?: boolean;
}

/** The permission lookup itself failed (SP error or a throw), as opposed to "no such fact". */
export const LOOKUP_FAILED = Symbol('fact-permission-lookup-failed');

/** Most fact ids one multi-fact read checks; legacy callers send a handful. */
export const MAX_FACT_IDS = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * public.et_fact_permissions for (nMasterid, nFSid): the rule realtime-server's factsheet/* and
 * fact/* routes use (owner, or an FMShared recipient with that share's flags). `nMasterid` must be
 * the token user, which JwtMiddleware writes over the client value.
 * Returns null when there is no caller, no fact id or no such fact, and LOOKUP_FAILED when the
 * lookup failed.
 */
export async function factPermission(db: Db, nMasterid: string, nFSid: string): Promise<FactPermissionRow | null | typeof LOOKUP_FAILED> {
    if (!nMasterid || !nFSid) return null;
    let res: any;
    try {
        res = await db.executeRef('fact_permissions', { nUserid: nMasterid, nFSid });
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`fact_permissions lookup failed for ${nFSid}: ${res?.error?.message ?? res?.error}`);
        return LOOKUP_FAILED;
    }
    return res.data?.[0]?.[0] ?? null;
}

/**
 * Read access to one fact: 'view' when bCanView, 'hidden' when not (or the fact does not exist),
 * 'failed' when the lookup failed. List reads answer 'hidden' with their normal empty shape rather
 * than a 403, so neither frontend's interceptor navigates away.
 */
export async function factReadAccess(db: Db, nMasterid: string, nFSid: string): Promise<'view' | 'hidden' | 'failed'> {
    const row = await factPermission(db, nMasterid, nFSid);
    if (row === LOOKUP_FAILED) return 'failed';
    return row?.bCanView ? 'view' : 'hidden';
}

/**
 * The fact ids in `jFSids` (a JSON array string, or one JSON string, as the legacy taskpopup sends)
 * that the caller may view, in their original order. Entries that are not UUIDs are dropped, since
 * they match no fact. Returns null when the answer is unknown: a lookup failed, or more than
 * MAX_FACT_IDS distinct ids were asked for.
 */
export async function viewableFactIds(db: Db, nMasterid: string, jFSids: string): Promise<string[] | null> {
    let parsed: unknown;
    try {
        parsed = JSON.parse(jFSids);
    } catch {
        return [];
    }
    const ids = (Array.isArray(parsed) ? parsed : [parsed])
        .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id));
    const unique = [...new Set(ids.map((id) => id.toLowerCase()))];
    if (unique.length > MAX_FACT_IDS) {
        logger.warn(`multi-fact read refused: ${unique.length} ids (max ${MAX_FACT_IDS})`);
        return null;
    }
    const access = await Promise.all(unique.map((id) => factReadAccess(db, nMasterid, id)));
    if (access.includes('failed')) return null;
    const visible = new Set(unique.filter((_, i) => access[i] === 'view'));
    return ids.filter((id) => visible.has(id.toLowerCase()));
}

/**
 * Edit gate for a fact: the bCanEdit column of et_fact_permissions. Throws 403 when the caller may
 * not edit, 404 when the fact does not exist and 500 when the lookup failed, and returns the row so
 * the caller can check the other flags (e.g. bCanReshare). Call it outside the route's try/catch, or
 * rethrow HttpException there, so the status reaches the client.
 */
export async function assertCanEditFact(db: Db, nMasterid: string, nFSid: string): Promise<FactPermissionRow> {
    if (!nMasterid) throw new ForbiddenException({ msg: -1, value: 'You are not permitted to edit this fact' });
    const row = await factPermission(db, nMasterid, nFSid);
    if (row === LOOKUP_FAILED) throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this fact' });
    if (!row) throw new NotFoundException({ msg: -1, value: 'Fact not found' });
    if (!row.bCanEdit) throw new ForbiddenException({ msg: -1, value: 'You are not permitted to edit this fact' });
    return row;
}

/**
 * Read gate for a write that needs only view access (comments/add): 403 when the caller may not view
 * the fact or it does not exist, 500 when the lookup failed.
 */
export async function assertCanViewFact(db: Db, nMasterid: string, nFSid: string): Promise<void> {
    const access = await factReadAccess(db, nMasterid, nFSid);
    if (access === 'failed') throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this fact' });
    if (access !== 'view') throw new ForbiddenException({ msg: -1, value: 'You are not permitted to view this fact' });
}

type RowDb = Pick<DbService, 'rowQuery'>;

/**
 * Where a new fact may go (fact/insertfact, insertquickfact and their /v2): the caller ($1, the JWT
 * user) must be a global admin or an active member of the fact's case (a TeamRelation row with
 * cStatus 'A'; the per-case user switch, permission/usermanage, sets another value), the case must
 * exist, and the document ($3), when one is named, must be in that case. $2 is the case the client
 * names (the /v2 routes store it as given); when it is null the case is the document's own, which is
 * how public.et_fact_insert derives it. Same rule as realtime-server's FACT_CREATE_TARGET_SQL and
 * coreapi's task gates (TASK_ACCESS_SQL, TASK_CREATE_ACCESS_SQL).
 */
export const FACT_CREATE_ACCESS_SQL = `
WITH target AS (
    SELECT COALESCE($2::uuid, (
        SELECT s."nCaseid"
        FROM "BundleDetail" bd
        JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
        WHERE bd."nBundledetailid" = $3::uuid
        LIMIT 1
    )) AS "nCaseid"
)
SELECT (
    EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = t."nCaseid")
    AND ($3::uuid IS NULL OR EXISTS (
        SELECT 1
        FROM "BundleDetail" bd
        JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
        WHERE bd."nBundledetailid" = $3::uuid
          AND s."nCaseid" = t."nCaseid"
    ))
    AND (
        EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
        OR EXISTS (
            SELECT 1 FROM "TeamRelation" tr
            WHERE tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $1::uuid AND tr."cStatus" = 'A'
        )
    )
) AS "bAllowed"
FROM target t
`;

/**
 * Create gate for fact/insertfact*: 403 unless FACT_CREATE_ACCESS_SQL allows (nMasterid, nCaseid,
 * nBDid), 500 when the lookup failed. Nothing is written before it passes. Call it outside the
 * route's try/catch, or rethrow HttpException there.
 */
export async function assertCanCreateFact(db: RowDb, nMasterid: string, nCaseid: string | null | undefined, nBDid: string | null | undefined): Promise<void> {
    const refused = new ForbiddenException({ msg: -1, value: 'You are not permitted to add facts to this case' });
    if (!nMasterid || (!nCaseid && !nBDid)) throw refused;
    let res: any;
    try {
        res = await db.rowQuery(FACT_CREATE_ACCESS_SQL, [nMasterid, nCaseid || null, nBDid || null]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`fact create access lookup failed: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this case' });
    }
    if (res.data?.[0]?.bAllowed !== true) throw refused;
}
