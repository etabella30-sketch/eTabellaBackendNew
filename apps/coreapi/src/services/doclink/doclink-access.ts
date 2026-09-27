import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('DocLinkAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value);

/**
 * Who may read a DocLink: its owner (DocMaster.nUserid) or a DMShared recipient, no admin bypass. It is
 * realtime-server's rule for its doclink/docdetail and doclink/docshared, and this text is identical to
 * DOCLINK_VIEW_SQL in apps/realtime-server/src/services/doclink/doclink-view-gate.ts (a spec compares
 * them). $1 = the DocMaster ids asked for, $2 = the caller (the JWT user).
 */
export const DOCLINK_VIEW_SQL = `SELECT d."nDocid" FROM "DocMaster" d
 WHERE d."nDocid" = ANY($1::uuid[])
   AND (d."nUserid" = $2
     OR EXISTS (SELECT 1 FROM "DMShared" s WHERE s."nDocid" = d."nDocid" AND s."nUserid" = $2))`;

/**
 * The DocMaster ids a doclink/docdetail `jDocids` value names: the JSON array the legacy frontend sends
 * (JSON.stringify of the ids) or a single JSON string, which is what public.et_doc_detail accepts.
 * Anything else is null (the SP fails on it too).
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
 * The ids in `nDocids` the caller may read, lower case, in the order given, without repeats. Ids that are
 * not UUIDs, missing DocLinks and other people's unshared DocLinks are left out. null when the lookup
 * failed, so the route answers with its failure shape instead of reading a fault as "nothing visible".
 */
export async function viewableDocLinkIds(db: RowDb, nMasterid: unknown, nDocids: unknown[]): Promise<string[] | null> {
    if (!isUuid(nMasterid)) return [];
    const asked = [...new Set(nDocids.filter(isUuid).map((id) => id.toLowerCase()))];
    if (!asked.length) return [];
    let res: any;
    try {
        res = await db.rowQuery(DOCLINK_VIEW_SQL, [asked, nMasterid]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success || !Array.isArray(res.data)) {
        logger.error(`doclink view lookup failed: ${res?.error?.message ?? res?.error}`);
        return null;
    }
    const allowed = new Set(res.data.map((row: any) => String(row?.nDocid ?? '').toLowerCase()));
    return asked.filter((id) => allowed.has(id));
}

/**
 * doclink/docdelete: public.et_doc_delete checks that the caller owns nDocid, then deletes the DMLinks
 * row nDMLids without checking that it belongs to nDocid, so the owner of any DocLink could remove a
 * target from anyone else's. Allowed: the caller owns nDocid ($1) and nDMLids ($3), when sent, is one of
 * its links. $2 = the caller.
 */
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

/**
 * Delete gate: 403 unless DOCLINK_DELETE_ACCESS_SQL allows it (same message as et_doc_delete's own
 * refusal), 500 when the lookup failed. Call it outside the route's try/catch, or rethrow HttpException.
 */
export async function assertCanDeleteDocLink(db: RowDb, nMasterid: unknown, nDocid: unknown, nDMLids: unknown): Promise<void> {
    const refused = new ForbiddenException({ msg: -1, value: 'You do not have a permission for delete' });
    if (!isUuid(nMasterid) || !isUuid(nDocid)) throw refused;
    if (nDMLids != null && !isUuid(nDMLids)) throw refused;
    let res: any;
    try {
        res = await db.rowQuery(DOCLINK_DELETE_ACCESS_SQL, [nDocid, nMasterid, nDMLids ?? null]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`doclink delete access lookup failed for ${nDocid}: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this DocLink' });
    }
    if (res.data?.[0]?.bAllowed !== true) throw refused;
}
