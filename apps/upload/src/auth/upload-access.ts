import {
  ExecutionContext, ForbiddenException, InternalServerErrorException, Logger, UnauthorizedException, createParamDecorator,
} from '@nestjs/common';
import type { DbService } from '@app/global/db/pg/db.service';

/**
 * Case rules for the upload app. A caller may upload to, convert, OCR, export or presign inside a case
 * only as a global admin (UserMaster.isAdmin) or an active member of it (TeamRelation, cStatus 'A'):
 * the membership rule of apps/download/src/auth/download-access.ts plus the active test of
 * realtime-server's fact-create-gate. Every id a request adds (section, bundle, document, upload job,
 * upload row) must belong to that same case, because the stored procedures behind these routes
 * (et_upload_updatefileinfo, et_get_filedata, et_upload_deletefiles, et_upload_report_detail_export)
 * act on those ids whatever case they are in.
 */

const logger = new Logger('UploadAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Request keys set by UploadCallerMiddleware (after JwtMiddleware) on every upload route. */
export const UPLOAD_CALLER = 'uploadCaller';
export const UPLOAD_CHUNK_GATE = 'uploadChunkGate';

/** The signed-in caller, from the verified token (never from the body, which multer replaces). */
export interface UploadCaller {
  userId: string;
}

/** Resolves when the caller may add a chunk to `identifier`'s upload; rejects with the refusal. */
export type ChunkWriteGate = (identifier: unknown) => Promise<void>;

/** The token user of this request, or 401 when UploadCallerMiddleware did not run. */
export const AuthCaller = createParamDecorator((_data: unknown, ctx: ExecutionContext): UploadCaller => {
  const caller = ctx.switchToHttp().getRequest()?.[UPLOAD_CALLER];
  if (!caller || !isUuid(caller.userId)) throw new UnauthorizedException('Invalid Token');
  return caller;
});

/**
 * One lookup for a case and the ids a request adds to it ($1 caller, $2 nCaseid, $3 nSectionid or
 * null, $4 nBundleid or null, $5 document ids, $6 upload job ids, $7 upload row ids):
 *  - bCase: the case exists;
 *  - bAllowed: the caller is a global admin or an active member of it;
 *  - the section, the bundle (through its section), every document (through its section, or its
 *    bundle's section when it has none), every UploadMaster row and every UploadDetail row (through
 *    its UploadMaster) is in that case. Empty lists and nulls pass.
 */
export const UPLOAD_CASE_ACCESS_SQL = `SELECT
  EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = $2::uuid) AS "bCase",
  (EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
    OR EXISTS (SELECT 1 FROM "TeamRelation" tr
                WHERE tr."nCaseid" = $2::uuid AND tr."nUserid" = $1::uuid AND tr."cStatus" = 'A')) AS "bAllowed",
  ($3::uuid IS NULL OR EXISTS (SELECT 1 FROM "SectionMaster" s
                                WHERE s."nSectionid" = $3::uuid AND s."nCaseid" = $2::uuid)) AS "bSectionInCase",
  ($4::uuid IS NULL OR EXISTS (SELECT 1 FROM "BundleMaster" b JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid"
                                WHERE b."nBundleid" = $4::uuid AND s."nCaseid" = $2::uuid)) AS "bBundleInCase",
  NOT EXISTS (SELECT 1 FROM unnest($5::uuid[]) AS d("id")
               WHERE NOT EXISTS (SELECT 1 FROM "BundleDetail" bd
                                   LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
                                   JOIN "SectionMaster" s ON s."nSectionid" = COALESCE(bd."nSectionid", bm."nSectionid")
                                  WHERE bd."nBundledetailid" = d."id" AND s."nCaseid" = $2::uuid)) AS "bDocumentsInCase",
  NOT EXISTS (SELECT 1 FROM unnest($6::uuid[]) AS m("id")
               WHERE NOT EXISTS (SELECT 1 FROM "UploadMaster" um
                                  WHERE um."nUPid" = m."id" AND um."nCaseid" = $2::uuid)) AS "bUploadsInCase",
  NOT EXISTS (SELECT 1 FROM unnest($7::uuid[]) AS x("id")
               WHERE NOT EXISTS (SELECT 1 FROM "UploadDetail" ud JOIN "UploadMaster" um ON um."nUPid" = ud."nUPid"
                                  WHERE ud."nUDid" = x."id" AND um."nCaseid" = $2::uuid)) AS "bUploadRowsInCase"`;

/**
 * ocr/ocrfile names a document only ($1 caller, $2 nBundledetailid): a global admin, or an active
 * member of the case the document is in (its section, or its bundle's section).
 */
export const UPLOAD_DOCUMENT_ACCESS_SQL = `SELECT (
  EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
  OR EXISTS (SELECT 1 FROM "BundleDetail" bd
               LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
               JOIN "SectionMaster" s ON s."nSectionid" = COALESCE(bd."nSectionid", bm."nSectionid")
               JOIN "TeamRelation" tr ON tr."nCaseid" = s."nCaseid" AND tr."nUserid" = $1::uuid AND tr."cStatus" = 'A'
              WHERE bd."nBundledetailid" = $2::uuid)
) AS "bAllowed"`;

/** The case and the ids a request adds to it; see UPLOAD_CASE_ACCESS_SQL. */
export interface UploadCaseTargets {
  nCaseid: unknown;
  nSectionid?: unknown;
  nBundleid?: unknown;
  nBundledetailids?: unknown[];
  nUPids?: unknown[];
  nUDids?: unknown[];
}

const INVALID = Symbol('invalid-id');
type OptionalId = string | null | typeof INVALID;

/**
 * An optional id the way the clients and the SPs use it: absent, '', 0, '0', 'null', 'undefined'
 * (IsItUUID's empty values) and the nil uuid (a root-level bundle) are "none"; anything else must be
 * a uuid.
 */
function optionalId(value: unknown): OptionalId {
  if (value === undefined || value === null || value === '' || value === 0 || value === '0'
    || value === 'null' || value === 'undefined') {
    return null;
  }
  if (!isUuid(value)) return INVALID;
  const id = value.toLowerCase();
  return id === NIL_UUID ? null : id;
}

function idList(values: unknown[] | undefined): string[] | typeof INVALID {
  const ids: string[] = [];
  for (const value of values ?? []) {
    const id = optionalId(value);
    if (id === INVALID) return INVALID;
    if (id !== null && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

const caseRefused = () => new ForbiddenException('You are not permitted to use this case');
const lookupFailed = () => new InternalServerErrorException('Could not check access to this case');

async function firstRow(db: RowDb, sql: string, params: unknown[], what: string): Promise<any> {
  let res: any;
  try {
    res = await db.rowQuery(sql, params);
  } catch (error) {
    res = { success: false, error };
  }
  if (!res?.success || !Array.isArray(res.data)) {
    logger.error(`${what} access lookup failed: ${res?.error?.message ?? res?.error}`);
    throw lookupFailed();
  }
  return res.data[0];
}

/**
 * 403 unless the caller (the token user) may use `targets.nCaseid` and every id in `targets` is in
 * that case; 500 when the lookup fails. nCaseid is required and must be a uuid; a malformed optional
 * id is refused without a query.
 */
export async function assertUploadCaseAccess(db: RowDb, userId: unknown, targets: UploadCaseTargets): Promise<void> {
  const nCaseid = optionalId(targets?.nCaseid);
  const nSectionid = optionalId(targets?.nSectionid);
  const nBundleid = optionalId(targets?.nBundleid);
  const documents = idList(targets?.nBundledetailids);
  const uploads = idList(targets?.nUPids);
  const uploadRows = idList(targets?.nUDids);
  if (!isUuid(userId) || nCaseid === null || nCaseid === INVALID || nSectionid === INVALID || nBundleid === INVALID
    || documents === INVALID || uploads === INVALID || uploadRows === INVALID) {
    throw caseRefused();
  }
  const row = await firstRow(db, UPLOAD_CASE_ACCESS_SQL,
    [userId, nCaseid, nSectionid, nBundleid, documents, uploads, uploadRows], 'case');
  if (row?.bCase !== true || row.bAllowed !== true || row.bSectionInCase !== true || row.bBundleInCase !== true
    || row.bDocumentsInCase !== true || row.bUploadsInCase !== true || row.bUploadRowsInCase !== true) {
    throw caseRefused();
  }
}

/** ocr/ocrfile: 403 unless the caller may use the case `nBundledetailid` is in; 500 when the lookup fails. */
export async function assertDocumentAccess(db: RowDb, userId: unknown, nBundledetailid: unknown): Promise<void> {
  const id = optionalId(nBundledetailid);
  if (!isUuid(userId) || id === null || id === INVALID) throw caseRefused();
  const row = await firstRow(db, UPLOAD_DOCUMENT_ACCESS_SQL, [userId, id], 'document');
  if (row?.bAllowed !== true) throw caseRefused();
}

/**
 * The case a Spaces key belongs to, or null. get-file-url presigns keys under `doc/case<uuid>/`: the
 * legacy doc-viewer asks for its converted e-mail, `doc/case<nCaseid>/<nBundledetailid>/<name>.html`,
 * so one or more segments may follow the case folder; none may be empty, '.' or '..', or hold a
 * backslash or a control character.
 */
export function caseOfObjectKey(key: unknown): string | null {
  if (typeof key !== 'string' || key.length > 1024) return null;
  const match = /^doc\/case([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/(.+)$/.exec(key);
  if (!match) return null;
  // eslint-disable-next-line no-control-regex
  const bad = (segment: string) => !segment || segment === '.' || segment === '..' || /[\\\u0000-\u001f\u007f]/.test(segment);
  if (match[2].split('/').some(bad)) return null;
  return match[1].toLowerCase();
}

/** get-file-url: 403 unless `key` is a case document key (caseOfObjectKey) of a case the caller may use. */
export async function assertCanReadObjectKey(db: RowDb, userId: unknown, key: unknown): Promise<void> {
  const nCaseid = caseOfObjectKey(key);
  if (!nCaseid) throw new ForbiddenException('You are not permitted to read this file');
  await assertUploadCaseAccess(db, userId, { nCaseid });
}

/**
 * The upload rows exports/delete-files names in jFiles, read the way et_upload_deletefiles reads it
 * (`jFiles @> to_jsonb("nUDid")`): the top-level strings of a JSON array (the legacy app sends the
 * array JSON-encoded), of an array sent as-is, or a single JSON string. null when jFiles is anything
 * else, which is refused.
 */
export function uploadRowIdsOf(jFiles: unknown): unknown[] | null {
  let value: unknown = jFiles;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return null;
  return value.filter((v) => typeof v === 'string');
}
