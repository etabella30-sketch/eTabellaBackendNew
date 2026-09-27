import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import type { RowQueryDb } from '../../events/realtime-socket-access';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
import { callerCanSeeSession } from '../session/session-access-gate';
import { isUuid } from '../utility/safe-path';

const logger = new Logger('FactCreateGate');

/**
 * Where fact/insertfact and fact/insertquickfact may put a new fact. realtime.et_fact_insert stores
 * the client's nCaseid, nBDid and nSesid as given, so each is checked against the case:
 *  - $1 nCaseid: the case must exist;
 *  - $2 the token user: bMember is an active TeamRelation row in that case (cStatus 'A'; the per-case
 *    user switch, permission/usermanage, sets it to another value). That is the TeamRelation rule of
 *    coreapi's FACT_CREATE_ACCESS_SQL plus the active test of coreapi's task gates and et_dashboard_v2;
 *  - $3 nBDid (null when not sent): the document must be in that case, through its section;
 *  - $4 nSesid (null when not sent): the session must be in that case and not deleted.
 * The admin bypass and the session-visibility rule are applied by assertCanCreateFact.
 */
export const FACT_CREATE_TARGET_SQL = `SELECT
  EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = $1::uuid) AS "bCase",
  EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = $1::uuid AND t."nUserid" = $2::uuid AND t."cStatus" = 'A') AS "bMember",
  ($3::uuid IS NULL OR EXISTS (
    SELECT 1 FROM "BundleDetail" bd JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
     WHERE bd."nBundledetailid" = $3::uuid AND s."nCaseid" = $1::uuid)) AS "bDocInCase",
  ($4::uuid IS NULL OR EXISTS (
    SELECT 1 FROM "RSessionMaster" r
     WHERE r."nSesid" = $4::uuid AND r."nCaseid" = $1::uuid AND r."dDelDt" IS NULL)) AS "bSessionInCase"`;

/** The fields of an InsertFact / InsertQuickFact body the gate reads. */
export interface FactCreateTarget {
  nMasterid?: unknown;
  nCaseid?: unknown;
  nBDid?: unknown;
  nSesid?: unknown;
}

const INVALID = Symbol('invalid-id');

/** An optional id as the SP reads it (NULLIF(x, '')): null when absent, the UUID, or INVALID. */
function optionalId(value: unknown): string | null | typeof INVALID {
  if (value === undefined || value === null || value === '') return null;
  return isUuid(value) ? value : INVALID;
}

/**
 * Create gate for fact/insertfact and fact/insertquickfact, run before realtime.et_fact_insert or any
 * other write. The caller (req.user, the token user; body.nMasterid is overwritten with the same id by
 * RealtimeAuthInjectMiddleware) must be a global admin or an active member (TeamRelation, cStatus 'A')
 * of the case named by nCaseid, the case must exist, the document (nBDid), when sent, must be in that
 * case, and the session (nSesid, a transcript fact), when sent, must be in that case, not deleted, and
 * visible to the caller under the session rule (callerCanSeeSession). nCaseid is required: the SP
 * stores it as the fact's case and does not derive one from the document.
 *
 * 403 on any refusal, 500 when the lookup fails. Call it outside the route's try/catch, or rethrow
 * HttpException there, so the status reaches the client.
 */
export async function assertCanCreateFact(
  db: RowQueryDb,
  user: RealtimeUser | undefined,
  body: FactCreateTarget | undefined,
): Promise<void> {
  const refused = () => new ForbiddenException('You are not permitted to add facts to this case');
  if (!user?.userId || !isUuid(user.userId)) throw refused();
  const nMasterid = body?.nMasterid;
  if (nMasterid !== undefined && nMasterid !== null && nMasterid !== ''
    && (typeof nMasterid !== 'string' || nMasterid.toLowerCase() !== user.userId.toLowerCase())) {
    throw refused();
  }
  const nCaseid = body?.nCaseid;
  const nBDid = optionalId(body?.nBDid);
  const nSesid = optionalId(body?.nSesid);
  if (!isUuid(nCaseid) || nBDid === INVALID || nSesid === INVALID) throw refused();

  let res: any;
  try {
    res = await db.rowQuery(FACT_CREATE_TARGET_SQL, [nCaseid, user.userId, nBDid, nSesid]);
  } catch (error) {
    res = { success: false, error };
  }
  if (!res?.success || !Array.isArray(res.data)) {
    logger.error(`fact create access lookup failed: ${res?.error?.message ?? res?.error}`);
    throw new InternalServerErrorException('Could not check access to this case');
  }
  const row = res.data[0];
  if (row?.bCase !== true || row.bDocInCase !== true || row.bSessionInCase !== true) throw refused();
  if (user.isAdmin !== true && row.bMember !== true) throw refused();
  if (nSesid && !(await callerCanSeeSession(db, user, nSesid))) throw refused();
}
