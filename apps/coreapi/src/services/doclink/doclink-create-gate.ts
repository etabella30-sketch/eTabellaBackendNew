import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { DOCLINK_TARGETS_IN_CASE_SQL, docLinkTargetIds } from '@app/permissions';
import { assertCanCreateFact, type FactCreateActor } from '../fact/fact-access';

const logger = new Logger('DocLinkCreateGate');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value);

/** Every refusal below, in the route's failure shape (as the other doclink gates and the fact gates). */
const refused = () => new ForbiddenException({ msg: -1, value: 'You are not permitted to add document links to this case' });

/**
 * $1 nCaseid, $2 the jDl target ids (uuid[]): the targets that are documents of that case, through
 * their section. realtime.et_doc_insert writes one DMLinks row per target as given, and doclink/docdetail
 * then returns each target's file name, exhibit number, tab and bundle tag to the DocLink's owner and
 * share recipients. This text is identical to DOCLINK_TARGETS_IN_CASE_SQL in
 * apps/realtime-server/src/services/doclink/doclink-create-gate.ts (a spec compares them).
 */
export { DOCLINK_TARGETS_IN_CASE_SQL, docLinkTargetIds }; // one copy, @app/permissions doclink.ts (Phase 8)

/**
 * A transcript source. bSessionInCase: $1 nSesid is a session of $2 nCaseid that is not deleted (the
 * bSessionInCase test of realtime-server's FACT_CREATE_TARGET_SQL), required of global admins too.
 * bSessionVisible: $3 the caller is a global admin (UserMaster.isAdmin, the bypass FACT_CREATE_ACCESS_SQL
 * uses; realtime-server reads it from the token session instead), or may see the session under
 * realtime-server's session rule: assigned to it (RSessionDetail) or on its case's team (TeamRelation,
 * any status). The membership clause is SESSION_ACCESS_SQL's, word for word, with the caller as $3
 * (a spec compares them).
 */
export const DOCLINK_SESSION_ACCESS_SQL = `SELECT
  EXISTS (SELECT 1 FROM "RSessionMaster" r
     WHERE r."nSesid" = $1::uuid AND r."nCaseid" = $2::uuid AND r."dDelDt" IS NULL) AS "bSessionInCase",
  (EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $3::uuid AND u."isAdmin" = true)
    OR EXISTS (SELECT 1 FROM "RSessionMaster" r
     WHERE r."nSesid" = $1::uuid AND r."dDelDt" IS NULL
   AND (EXISTS (SELECT 1 FROM "RSessionDetail" d WHERE d."nSesid" = r."nSesid" AND d."nUserid" = $3)
     OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = r."nCaseid" AND t."nUserid" = $3)))) AS "bSessionVisible"`;

/** The fields of an InsertDoc body the gate reads (nMasterid is the token user: JwtMiddleware writes it). */
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


const INVALID = Symbol('invalid-id');

/** An optional id as the SP reads it (NULLIF(x, '')): null when absent, the UUID, or INVALID. */
function optionalId(value: unknown): string | null | typeof INVALID {
    if (value === undefined || value === null || value === '') return null;
    return isUuid(value) ? value : INVALID;
}

/** One access lookup's rows; 500 when it fails or throws (the rule of the other gates). */
async function lookup(db: RowDb, text: string, params: any[], what: string): Promise<any[]> {
    let res: any;
    try {
        res = await db.rowQuery(text, params);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success || !Array.isArray(res.data)) {
        logger.error(`${what} failed: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this case' });
    }
    return res.data;
}

/**
 * Create gate for doclink/insertdoc, run before realtime.et_doc_insert or any other write. It is
 * realtime-server's assertCanCreateDocLink (doclink-create-gate.ts) rule for rule, since coreapi runs
 * the same SP, which stores the client's nCaseid, nBundledetailid (the source document) and nSesid (the
 * source session) on the new DocMaster row as given:
 *  - the caller (nMasterid, the token user) is a global admin or an active member (TeamRelation,
 *    cStatus 'A') of the case named by nCaseid, and the case exists: FACT_CREATE_ACCESS_SQL through
 *    assertCanCreateFact, the rule fact/insertfact* already uses. nCaseid is required: the SP does not
 *    derive one from the document;
 *  - the source document (nBundledetailid), when sent, is in that case (the same lookup);
 *  - the source session (nSesid), when sent, is in that case, not deleted, and visible to the caller
 *    (DOCLINK_SESSION_ACCESS_SQL). coreapi's InsertDoc has no nSesid field today, so the ValidationPipe
 *    refuses one before this gate; the rule is here for when it gets one;
 *  - every jDl target is a UUID and a document of that case, for global admins too
 *    (DOCLINK_TARGETS_IN_CASE_SQL): the pickers only offer the open case's bundles.
 *
 * 403 on any refusal (a malformed jDl or id before any lookup), 500 when a lookup fails. The controller
 * has no try/catch around insertDoc, so the status reaches the client.
 */
export async function assertCanCreateDocLink(db: RowDb, body: DocLinkCreateTarget | undefined, caller?: FactCreateActor | null): Promise<void> {
    const targets = docLinkTargetIds(body?.jDl);
    if (!targets) throw refused();
    const nMasterid = body?.nMasterid;
    const nCaseid = body?.nCaseid;
    const nBDid = optionalId(body?.nBundledetailid);
    const nSesid = optionalId(body?.nSesid);
    if (!isUuid(nMasterid) || !isUuid(nCaseid) || nBDid === INVALID || nSesid === INVALID) throw refused();

    try {
        // 7b: the shared create rule (@app/permissions). The platform-admin exemption is the stamped Caller's (JwtMiddleware)
        // when the route passes it; without one the token user is an ordinary member.
        const actor: FactCreateActor = caller && caller.userId.toLowerCase() === nMasterid.toLowerCase() ? caller : { userId: nMasterid, isPlatformAdmin: false };
        await assertCanCreateFact(db, actor, { nCaseid, nBDid });
    } catch (error) {
        if (error instanceof ForbiddenException) throw refused();
        throw error; // the lookup's 500
    }

    if (nSesid) {
        const row = (await lookup(db, DOCLINK_SESSION_ACCESS_SQL, [nSesid, nCaseid, nMasterid], 'doclink session lookup'))[0];
        if (row?.bSessionInCase !== true || row.bSessionVisible !== true) throw refused();
    }

    if (!targets.length) return;
    const rows = await lookup(db, DOCLINK_TARGETS_IN_CASE_SQL, [nCaseid, targets], 'doclink target lookup');
    const inCase = new Set(rows.map((row: any) => String(row?.nBundledetailid ?? '').toLowerCase()));
    if (targets.some((id) => !inCase.has(id))) throw refused();
}
