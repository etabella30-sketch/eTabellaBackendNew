import { ForbiddenException, HttpException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { isDomainError } from '@app/api-kernel';
import {
  FACT_CREATE_TARGET_SQL,
  type FactCreateActor,
  type FactCreateResolved,
  type FactCreateTarget,
  type FactPermissionRow as SharedFactPermissionRow,
  readFactPermission,
  resolveFactCreateTarget,
} from '@app/permissions';
import { PgRowQuery, PgSpExecutor } from '@app/platform-cloud';

/**
 * The fact rules of coreapi's fact/* routes, as the HTTP exceptions and bodies they always answered. The rules
 * themselves live once in @app/permissions (fact-visibility.ts: who may view or edit a fact, the bCanView / bCanEdit
 * columns of public.et_fact_permissions; fact-create.ts: where a new fact may go), shared with realtime-server and
 * the venue box since Phases 7a / 7b of the shared-libraries plan; this file adapts them over the app's DbService and
 * keeps coreapi's `{ msg: -1, value }` error bodies and its "hidden, not 403" list reads.
 */
const logger = new Logger('FactAccess');

type Db = Pick<DbService, 'executeRef'>;
type RowDb = Pick<DbService, 'rowQuery'>;

/** One et_fact_permissions row for (caller, fact). */
export type FactPermissionRow = SharedFactPermissionRow;

/** The permission lookup itself failed (SP error or a throw), as opposed to "no such fact". */
export const LOOKUP_FAILED = Symbol('fact-permission-lookup-failed');

/** Most fact ids one multi-fact read checks; legacy callers send a handful. */
export const MAX_FACT_IDS = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * public.et_fact_permissions for (nMasterid, nFSid). `nMasterid` must be the token user, which JwtMiddleware writes
 * over the client value. Returns null when there is no caller, no fact id or no such fact, and LOOKUP_FAILED when
 * the lookup failed.
 */
export async function factPermission(db: Db, nMasterid: string, nFSid: string): Promise<FactPermissionRow | null | typeof LOOKUP_FAILED> {
    if (!nMasterid || !nFSid) return null;
    try {
        return await readFactPermission(new PgSpExecutor(db), nMasterid, nFSid);
    } catch (error) {
        if (isDomainError(error) && error.code === 'not_found') return null;
        logger.error(`fact_permissions lookup failed for ${nFSid}: ${(error as Error)?.message ?? error}`);
        return LOOKUP_FAILED;
    }
}

/**
 * Read access to one fact: 'view' when bCanView, 'hidden' when not (or the fact does not exist), 'failed' when the
 * lookup failed. List reads answer 'hidden' with their normal empty shape rather than a 403, so neither frontend's
 * interceptor navigates away.
 */
export async function factReadAccess(db: Db, nMasterid: string, nFSid: string): Promise<'view' | 'hidden' | 'failed'> {
    const row = await factPermission(db, nMasterid, nFSid);
    if (row === LOOKUP_FAILED) return 'failed';
    return row?.bCanView ? 'view' : 'hidden';
}

/**
 * The fact ids in `jFSids` (a JSON array string, or one JSON string, as the legacy taskpopup sends) that the caller
 * may view, in their original order. Entries that are not UUIDs are dropped, since they match no fact. Returns null
 * when the answer is unknown: a lookup failed, or more than MAX_FACT_IDS distinct ids were asked for.
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
 * Edit gate for a fact: the bCanEdit column of et_fact_permissions. Throws 403 when the caller may not edit, 404
 * when the fact does not exist and 500 when the lookup failed, and returns the row so the caller can check the other
 * flags (e.g. bCanReshare). Call it outside the route's try/catch, or rethrow HttpException there.
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
 * Read gate for a write that needs only view access (comments/add): 403 when the caller may not view the fact or it
 * does not exist, 500 when the lookup failed.
 */
export async function assertCanViewFact(db: Db, nMasterid: string, nFSid: string): Promise<void> {
    const access = await factReadAccess(db, nMasterid, nFSid);
    if (access === 'failed') throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this fact' });
    if (access !== 'view') throw new ForbiddenException({ msg: -1, value: 'You are not permitted to view this fact' });
}

/**
 * Where a new fact may go (fact/insertfact, insertquickfact and their /v2): the shared create rule
 * (@app/permissions FACT_CREATE_TARGET_SQL). The case is the one the request names, else the document's own, which
 * is how public.et_fact_insert derived it for the v1 routes; the caller must be an active member of it (TeamRelation
 * cStatus 'A') or a platform admin; the document, when named, must be in it. Kept under the old name for the specs
 * and callers that read it.
 */
export const FACT_CREATE_ACCESS_SQL = FACT_CREATE_TARGET_SQL;

export type { FactCreateActor, FactCreateResolved, FactCreateTarget };

/**
 * Create gate for fact/insertfact*: 403 unless the shared rule allows (caller, body), 500 when the lookup failed.
 * Answers the resolved case, so a v1 route can hand realtime.et_fact_insert the case it must store. Nothing is
 * written before it passes. Call it outside the route's try/catch, or rethrow HttpException there.
 */
export async function assertCanCreateFact(db: RowDb, caller: FactCreateActor | null | undefined, body: FactCreateTarget): Promise<FactCreateResolved> {
    try {
        return await resolveFactCreateTarget(new PgRowQuery(db), caller, body);
    } catch (error) {
        if (error instanceof HttpException) throw error;
        if (isDomainError(error) && error.code === 'forbidden') {
            throw new ForbiddenException({ msg: -1, value: 'You are not permitted to add facts to this case' });
        }
        logger.error(`fact create access lookup failed: ${(error as Error)?.message ?? error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this case' });
    }
}
