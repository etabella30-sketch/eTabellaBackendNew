import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { assertFilesInCase } from 'apps/download/src/auth/download-access';

const logger = new Logger('ExportAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The only layout GET /download serves: a finished annotated-PDF export under ./assets,
 * `export/ed<nEDid>/<file>` (one exported document) or `export/ex<nExportid>/<file>` (the merged
 * file), where the id is a uuid or a legacy integer id (dev: ed<uuid> 1,562, ed<int> 344,
 * ex<int> 19 recorded paths, and no other shapes). Exactly three segments; the file name may not
 * hold a slash, backslash or control character, and may not be `.` or `..`. Only a cheap first
 * filter: the key must also be a path an export recorded (EXPORT_KEY_ACCESS_SQL).
 */
const EXPORT_KEY_RE = /^export\/e[dx](?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[1-9][0-9]{0,9})\/([^/\\\u0000-\u001f\u007f]{1,255})$/;

/** True when `key` has the shape of an export file (see EXPORT_KEY_RE). */
export function isExportKey(key: unknown): key is string {
    if (typeof key !== 'string') return false;
    const m = EXPORT_KEY_RE.exec(key);
    return !!m && m[1] !== '.' && m[1] !== '..';
}

/**
 * Read rule for an export file ($1 caller, $2 key): the key is a path an export recorded as its
 * output (ExportMaster.cExppath, or ExportDetail.cPath for a per-document export), and the caller
 * is a global admin or a TeamRelation member of that export's case. Same membership rule as the
 * download app's KEY_CASE_ACCESS_SQL. Both tables are small and the path columns have no index,
 * so this is two sequential scans (dev: 772 + 4,958 rows).
 */
export const EXPORT_KEY_ACCESS_SQL = `
SELECT EXISTS (
    SELECT 1
    FROM (
        SELECT em."nCaseid" FROM "ExportMaster" em WHERE em."cExppath" = $2
        UNION ALL
        SELECT em."nCaseid"
        FROM "ExportDetail" ed
        JOIN "ExportMaster" em ON em."nExportid" = ed."nExportid"
        WHERE ed."cPath" = $2
    ) x
    WHERE EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
       OR EXISTS (SELECT 1 FROM "TeamRelation" tr WHERE tr."nCaseid" = x."nCaseid" AND tr."nUserid" = $1::uuid)
) AS "bAllowed"
`;

/**
 * Re-run rule for an existing annotated-PDF export ($1 caller, $2 nExportid): the caller created it
 * and may still read its case (global admin or TeamRelation member). et_export_get_data_1 picks the
 * export by id alone and renders it with the caller's own marks into the same file, so anyone else
 * would overwrite the owner's file.
 */
export const EXPORT_RERUN_ACCESS_SQL = `
SELECT EXISTS (
    SELECT 1
    FROM "ExportMaster" em
    WHERE em."nExportid" = $2::uuid
      AND em."nUserid" = $1::uuid
      AND (
        EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
        OR EXISTS (SELECT 1 FROM "TeamRelation" tr WHERE tr."nCaseid" = em."nCaseid" AND tr."nUserid" = $1::uuid)
      )
) AS "bAllowed"
`;

/**
 * Re-run rule for a case-data export ($1 caller, $2 OutputDataExport.nExportid): the caller created
 * it and may still read its case (global admin or TeamRelation member). et_output_data_export_get
 * checks the creator only, and data/regenerate reads the case's data afresh, so a creator taken off
 * the case would otherwise keep getting its new data.
 */
export const DATA_EXPORT_RERUN_ACCESS_SQL = `
SELECT EXISTS (
    SELECT 1
    FROM "OutputDataExport" o
    WHERE o."nExportid" = $2::uuid
      AND o."nCreateId" = $1::uuid
      AND (
        EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
        OR EXISTS (SELECT 1 FROM "TeamRelation" tr WHERE tr."nCaseid" = o."nCaseid" AND tr."nUserid" = $1::uuid)
      )
) AS "bAllowed"
`;

const fileRefused = () => new ForbiddenException({ msg: -1, value: 'You are not permitted to download this file' });
const filesRefused = () => new ForbiddenException({ msg: -1, value: 'You are not permitted to export these documents' });
const exportRefused = () => new ForbiddenException({ msg: -1, value: 'You are not permitted to run this export' });
const lookupFailed = () => new InternalServerErrorException({ msg: -1, value: 'Could not check access to this export' });

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
 * Read gate for GET /download?cPath: 403 unless the key is an export file (isExportKey) that an
 * export of a case the caller ($nMasterid, the token user) may read recorded; 500 when the lookup
 * failed. Nothing is opened before it passes.
 */
export async function assertCanReadExport(db: RowDb, nMasterid: unknown, cPath: unknown): Promise<void> {
    if (!isExportKey(cPath) || typeof nMasterid !== 'string' || !UUID_RE.test(nMasterid)) throw fileRefused();
    if (!(await allowed(db, EXPORT_KEY_ACCESS_SQL, [nMasterid, cPath], 'export file'))) throw fileRefused();
}

/**
 * Gate for export-file/exportwithannot's jFiles, after assertCaseAccess: 403 unless every entry is a
 * canonical uuid string (any case) of a document in nCaseid; 500 when the lookup failed.
 * et_export_insert_data_1 reads each entry with ::uuid, which also takes braces, missing hyphens
 * and other spellings; the download app's assertFilesInCase skips any entry that is not a canonical
 * id (its SPs match with @>, so such an entry names nothing there), which here would let a document
 * of another case into the export unchecked. So any other spelling is refused before that check.
 */
export async function assertExportFilesInCase(db: RowDb, nCaseid: unknown, jFiles: unknown): Promise<void> {
    const ids = jFiles === undefined || jFiles === null ? [] : jFiles;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) throw filesRefused();
    await assertFilesInCase(db, nCaseid, JSON.stringify(ids));
}

/**
 * Gate for export-file/retryexport and export-file/startexportfile: 403 unless
 * EXPORT_RERUN_ACCESS_SQL allows (nMasterid, nExportid); 500 when the lookup failed.
 */
export async function assertCanRerunExport(db: RowDb, nMasterid: unknown, nExportid: unknown): Promise<void> {
    if (typeof nMasterid !== 'string' || !UUID_RE.test(nMasterid) || typeof nExportid !== 'string' || !UUID_RE.test(nExportid)) {
        throw exportRefused();
    }
    if (!(await allowed(db, EXPORT_RERUN_ACCESS_SQL, [nMasterid, nExportid], 'export'))) throw exportRefused();
}

/**
 * Gate for data/regenerate: 403 unless DATA_EXPORT_RERUN_ACCESS_SQL allows (nMasterid, nExportid);
 * 500 when the lookup failed.
 */
export async function assertCanRerunDataExport(db: RowDb, nMasterid: unknown, nExportid: unknown): Promise<void> {
    if (typeof nMasterid !== 'string' || !UUID_RE.test(nMasterid) || typeof nExportid !== 'string' || !UUID_RE.test(nExportid)) {
        throw exportRefused();
    }
    if (!(await allowed(db, DATA_EXPORT_RERUN_ACCESS_SQL, [nMasterid, nExportid], 'data export'))) throw exportRefused();
}
