import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('DownloadAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The only object layout GET /download serves: a case document, `doc/case<id>/<file>`, where <id> is
 * the case's nCaseid (uuid) or its legacy integer ZnCaseid. Every BundleDetail.cPath has this shape
 * (dev: 75,714 uuid keys and 228,829 integer keys, no other shapes). Exactly three segments; the
 * file name may hold spaces and punctuation (real names do) but no slash, backslash or control
 * character, and may not be `.` or `..`.
 */
const DOCUMENT_KEY_RE = /^doc\/case([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[1-9][0-9]{0,8})\/([^/\\\u0000-\u001f\u007f]{1,512})$/;

export interface DocumentKey {
    /** Case named by a uuid key, else null. */
    nCaseid: string | null;
    /** Case named by a legacy integer key (CaseMaster.ZnCaseid), else null. */
    nZnCaseid: number | null;
}

/** The case a Spaces key belongs to, or null when the key is not a case document. */
export function parseDocumentKey(key: unknown): DocumentKey | null {
    if (typeof key !== 'string') return null;
    const m = DOCUMENT_KEY_RE.exec(key);
    if (!m || m[2] === '.' || m[2] === '..') return null;
    return UUID_RE.test(m[1])
        ? { nCaseid: m[1].toLowerCase(), nZnCaseid: null }
        : { nCaseid: null, nZnCaseid: Number(m[1]) };
}

/**
 * Case rule for a key ($1 caller, $2 uuid case or null, $3 legacy integer case or null): a global
 * admin, or a TeamRelation member of the case the key names. Same membership rule as coreapi
 * FACT_CREATE_ACCESS_SQL and et_share_sectionbundle.
 */
export const KEY_CASE_ACCESS_SQL = `
SELECT (
    EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
    OR EXISTS (
        SELECT 1
        FROM "CaseMaster" c
        JOIN "TeamRelation" tr ON tr."nCaseid" = c."nCaseid" AND tr."nUserid" = $1::uuid
        WHERE c."nCaseid" = $2::uuid OR c."ZnCaseid" = $3::int
    )
) AS "bAllowed"
`;

/**
 * Second chance for a key the case rule refused ($1 caller, $2 key): a document of a case the caller
 * is a member of stores exactly this key. Covers documents whose file sits under another case's
 * folder (dev: 10 documents of case 1131 point at doc/case1154/..., a case that does not exist).
 * Runs only after a refusal, since BundleDetail.cPath has no index.
 */
export const KEY_DOCUMENT_ACCESS_SQL = `
SELECT EXISTS (
    SELECT 1
    FROM "BundleDetail" bd
    JOIN "SectionMaster" s ON s."nSectionid" = bd."nSectionid"
    JOIN "TeamRelation" tr ON tr."nCaseid" = s."nCaseid" AND tr."nUserid" = $1::uuid
    WHERE bd."cPath" = $2
) AS "bAllowed"
`;

/**
 * Case rule for the selection routes ($1 caller, $2 nCaseid, $3 nSectionid or null): the case
 * exists, the section (when named) belongs to it, and the caller is a global admin or a TeamRelation
 * member of it. The selection SPs pick files by section, so the section check stops a member of
 * one case naming a section of another.
 */
export const CASE_ACCESS_SQL = `
SELECT (
    EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = $2::uuid)
    AND ($3::uuid IS NULL OR EXISTS (
        SELECT 1 FROM "SectionMaster" s WHERE s."nSectionid" = $3::uuid AND s."nCaseid" = $2::uuid
    ))
    AND (
        EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
        OR EXISTS (SELECT 1 FROM "TeamRelation" tr WHERE tr."nCaseid" = $2::uuid AND tr."nUserid" = $1::uuid)
    )
) AS "bAllowed"
`;

/**
 * Documents named in a selection's jFiles that are not in the case it names ($1 nCaseid, $2 the
 * named ids): true when there are none. hyperlink/downloadfile needs it: with no nSectionid,
 * et_download_with_linkfiles picks jFiles by id alone, from any case. A document's case is its
 * section's, or with no section its bundle's section's; a document with neither is in no case, so
 * it is refused too.
 */
export const FILES_IN_CASE_SQL = `
SELECT NOT EXISTS (
    SELECT 1
    FROM "BundleDetail" bd
    LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
    LEFT JOIN "SectionMaster" s ON s."nSectionid" = COALESCE(bd."nSectionid", bm."nSectionid")
    WHERE bd."nBundledetailid" = ANY($2::uuid[])
      AND s."nCaseid" IS DISTINCT FROM $1::uuid
) AS "bAllowed"
`;

const fileRefused = () => new ForbiddenException({ msg: -1, value: 'You are not permitted to download this file' });
const caseRefused = () => new ForbiddenException({ msg: -1, value: 'You are not permitted to download from this case' });
const lookupFailed = () => new InternalServerErrorException({ msg: -1, value: 'Could not check access to this download' });

async function allowed(db: RowDb, sql: string, params: unknown[], what: string): Promise<boolean> {
    let res: any;
    try {
        res = await db.rowQuery(sql, params);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`${what} access lookup failed: ${res?.error?.message ?? res?.error}`);
        throw lookupFailed();
    }
    return res.data?.[0]?.bAllowed === true;
}

/**
 * Read gate for GET /download?cPath: 403 unless the key is a case document (see parseDocumentKey)
 * and the caller ($nMasterid, the token user) may read that case; 500 when the lookup failed.
 * Nothing is fetched from Spaces before it passes.
 */
export async function assertCanReadObject(db: RowDb, nMasterid: string, cPath: unknown): Promise<void> {
    const key = parseDocumentKey(cPath);
    if (!key || typeof nMasterid !== 'string' || !UUID_RE.test(nMasterid)) throw fileRefused();
    if (await allowed(db, KEY_CASE_ACCESS_SQL, [nMasterid, key.nCaseid, key.nZnCaseid], 'file')) return;
    if (await allowed(db, KEY_DOCUMENT_ACCESS_SQL, [nMasterid, cPath], 'file')) return;
    throw fileRefused();
}

/**
 * Gate for the selection routes (downloadfile, hyperlink/downloadfile, approximate/size,
 * downloadPresentReport): 403 unless CASE_ACCESS_SQL allows (nMasterid, nCaseid, nSectionid); 500
 * when the lookup failed. A missing case is refused: the selection SPs would otherwise still pick
 * files by section alone.
 */
export async function assertCaseAccess(db: RowDb, nMasterid: string, nCaseid: unknown, nSectionid?: unknown): Promise<void> {
    const section = nSectionid === undefined || nSectionid === null || nSectionid === '' ? null : nSectionid;
    if (typeof nMasterid !== 'string' || !UUID_RE.test(nMasterid)
        || typeof nCaseid !== 'string' || !UUID_RE.test(nCaseid)
        || (section !== null && (typeof section !== 'string' || !UUID_RE.test(section)))) {
        throw caseRefused();
    }
    if (!(await allowed(db, CASE_ACCESS_SQL, [nMasterid, nCaseid, section], 'case'))) throw caseRefused();
}

/**
 * The document ids a selection's jFiles names, read the way the selection SPs read it: a JSON array
 * whose top-level uuid strings they match (`jFiles @> to_jsonb("nBundledetailid")`). [] when it
 * names none; null when it is not a JSON array, which the SPs cannot read either.
 */
export function selectionDocumentIds(jFiles: unknown): string[] | null {
    if (jFiles === undefined || jFiles === null || jFiles === '') return [];
    if (typeof jFiles !== 'string') return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(jFiles);
    } catch {
        return null;
    }
    if (parsed === null) return [];
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.filter((v): v is string => typeof v === 'string' && UUID_RE.test(v)).map((v) => v.toLowerCase());
    return [...new Set(ids)];
}

/**
 * Gate for hyperlink/downloadfile, after assertCaseAccess: 403 unless every document jFiles names is
 * in nCaseid (FILES_IN_CASE_SQL), or jFiles is not a JSON array; 500 when the lookup failed.
 */
export async function assertFilesInCase(db: RowDb, nCaseid: unknown, jFiles: unknown): Promise<void> {
    const ids = selectionDocumentIds(jFiles);
    if (ids === null || typeof nCaseid !== 'string' || !UUID_RE.test(nCaseid)) throw caseRefused();
    if (!ids.length) return;
    if (!(await allowed(db, FILES_IN_CASE_SQL, [nCaseid, ids], 'files'))) throw caseRefused();
}

/**
 * The nCaseid inside downloadPresentReport's `params` (base64 of a JSON object), decoded the same
 * way PresentReportService does (atob, then JSON.parse); null when it cannot be read.
 */
export function presentReportCase(params: unknown): string | null {
    if (typeof params !== 'string') return null;
    try {
        const parsed = JSON.parse(atob(params));
        return parsed && typeof parsed === 'object' && typeof parsed.nCaseid === 'string' ? parsed.nCaseid : null;
    } catch {
        return null;
    }
}
