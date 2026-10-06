/**
 * Where a new fact may go: the create rule of fact/insertfact, fact/insertquickfact and their /v2 on coreapi and
 * realtime-server, once (Phase 7b of the shared-libraries plan, 2026-10-06; before it the two hosts carried
 * coreapi fact-access.ts FACT_CREATE_ACCESS_SQL and realtime-server fact-create-gate.ts FACT_CREATE_TARGET_SQL,
 * the same rule in two spellings). realtime.et_fact_insert stores the client's nCaseid, nBDid and nSesid as given,
 * so each is checked against the case before any write:
 *  - the case: $1 when the request names one, else the document's own case (through its section), which is how
 *    public.et_fact_insert derived it for the v1 routes; it must exist;
 *  - the caller ($2, the verified Caller, never a request value): an active member of that case (a TeamRelation
 *    row with cStatus 'A'; coreapi permission/usermanage sets another value), or a platform admin;
 *  - the document ($3, when sent): in that case;
 *  - the session ($4, when sent, a transcript fact): in that case, not deleted, and (host option) visible to the
 *    caller under the session rule.
 * A request value `nMasterid`, when present, must be the caller (R4): a client cannot create a fact as someone else.
 *
 * Outcomes are DomainErrors the host envelope renders as its old statuses: 'forbidden' (403) on any refusal,
 * 'unavailable' (500) when the lookup failed. Ids that are present but not uuids are refused before the query (they
 * match no row), so a cast error is never read as a fault.
 */
import { DomainError, isUuidText, RowQuery } from '@app/api-kernel';

export const FACT_CREATE_REFUSED = 'You are not permitted to add facts to this case';
export const FACT_CREATE_CHECK_FAILED = 'Could not check access to this case';

/**
 * $1 nCaseid (nullable), $2 caller, $3 nBDid (nullable), $4 nSesid (nullable). One row: the resolved case and the
 * four tests. `bMember` is the active-membership test alone; the platform-admin exemption is applied in code.
 */
export const FACT_CREATE_TARGET_SQL = `WITH target AS (
  SELECT COALESCE($1::uuid, (
    SELECT s."nCaseid" FROM "BundleDetail" bd JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
     WHERE bd."nBundledetailid" = $3::uuid LIMIT 1)) AS "nCaseid")
SELECT t."nCaseid"::text AS "nCaseid",
  EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = t."nCaseid") AS "bCase",
  EXISTS (SELECT 1 FROM "TeamRelation" tr WHERE tr."nCaseid" = t."nCaseid" AND tr."nUserid" = $2::uuid AND tr."cStatus" = 'A') AS "bMember",
  ($3::uuid IS NULL OR EXISTS (
    SELECT 1 FROM "BundleDetail" bd JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
     WHERE bd."nBundledetailid" = $3::uuid AND s."nCaseid" = t."nCaseid")) AS "bDocInCase",
  ($4::uuid IS NULL OR EXISTS (
    SELECT 1 FROM "RSessionMaster" r
     WHERE r."nSesid" = $4::uuid AND r."nCaseid" = t."nCaseid" AND r."dDelDt" IS NULL)) AS "bSessionInCase"
FROM target t`;

/** A row FACT_CREATE_TARGET_SQL answers with. */
export interface FactCreateTargetRow {
  readonly nCaseid?: string | null;
  readonly bCase?: boolean;
  readonly bMember?: boolean;
  readonly bDocInCase?: boolean;
  readonly bSessionInCase?: boolean;
}

/** The fields of an insertfact / insertquickfact body the rule reads (any host DTO). */
export interface FactCreateTarget {
  readonly nMasterid?: unknown;
  readonly nCaseid?: unknown;
  readonly nBDid?: unknown;
  readonly nSesid?: unknown;
}

/** The two facts about the actor the rule needs (a subset of the kernel Caller). */
export interface FactCreateActor {
  readonly userId: string;
  readonly isPlatformAdmin: boolean;
}

export interface FactCreateOptions {
  /** The host's session-visibility rule (realtime-server callerCanSeeSession); asked only when a session is named. */
  readonly sessionVisible?: (nSesid: string) => Promise<boolean>;
}

/** The target as the rule resolved it: the case the fact will be stored under. */
export interface FactCreateResolved {
  readonly nCaseid: string;
}

const INVALID = Symbol('invalid-id');

/** An optional id as the SP reads it (NULLIF(x, '')): null when absent, the uuid, or INVALID. */
function optionalId(value: unknown): string | null | typeof INVALID {
  if (value === undefined || value === null || value === '') return null;
  return isUuidText(value) ? value : INVALID;
}

const refused = (): DomainError => new DomainError('forbidden', FACT_CREATE_REFUSED);

/**
 * Resolves and checks where the fact may go; answers the case id (lower-cased) so a v1 caller that named only the
 * document can hand realtime.et_fact_insert the case it must store. Throws DomainError 'forbidden' on any refusal
 * and 'unavailable' when the lookup failed.
 */
export async function resolveFactCreateTarget(
  db: RowQuery,
  caller: FactCreateActor | null | undefined,
  body: FactCreateTarget | null | undefined,
  opts: FactCreateOptions = {},
): Promise<FactCreateResolved> {
  if (!caller || !isUuidText(caller.userId)) throw refused();
  const nMasterid = body?.nMasterid;
  if (nMasterid !== undefined && nMasterid !== null && nMasterid !== ''
    && (typeof nMasterid !== 'string' || nMasterid.toLowerCase() !== caller.userId.toLowerCase())) {
    throw refused();
  }
  const nCaseid = optionalId(body?.nCaseid);
  const nBDid = optionalId(body?.nBDid);
  const nSesid = optionalId(body?.nSesid);
  if (nCaseid === INVALID || nBDid === INVALID || nSesid === INVALID) throw refused();
  // Without a case and without a document there is nothing to resolve the case from.
  if (nCaseid === null && nBDid === null) throw refused();

  let rows: readonly FactCreateTargetRow[];
  try {
    rows = await db.rows<FactCreateTargetRow>(FACT_CREATE_TARGET_SQL, [nCaseid, caller.userId, nBDid, nSesid]);
  } catch (error) {
    throw new DomainError('unavailable', FACT_CREATE_CHECK_FAILED, { error: (error as Error)?.message ?? String(error) });
  }
  const row = rows[0];
  if (!row || row.bCase !== true || row.bDocInCase !== true || row.bSessionInCase !== true) throw refused();
  if (caller.isPlatformAdmin !== true && row.bMember !== true) throw refused();
  if (nSesid !== null && opts.sessionVisible && !(await opts.sessionVisible(nSesid))) throw refused();
  // The case the fact is stored under: the row's resolved one, else the one the request named (a host fake may
  // answer the four tests without echoing the case).
  const resolved = isUuidText(row.nCaseid) ? row.nCaseid : nCaseid;
  if (!isUuidText(resolved)) throw refused();
  return { nCaseid: resolved.toLowerCase() };
}

/** The create gate: resolveFactCreateTarget for callers that only need the yes / no. */
export async function assertCanCreateFact(
  db: RowQuery,
  caller: FactCreateActor | null | undefined,
  body: FactCreateTarget | null | undefined,
  opts: FactCreateOptions = {},
): Promise<void> {
  await resolveFactCreateTarget(db, caller, body, opts);
}
