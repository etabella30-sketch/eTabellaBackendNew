import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('JobAccess');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Case rule for a download job ($1 caller, $2 nDPid): a global admin, or a TeamRelation member of the
 * job's case. Packages are shared between the members of a case (insert_download_process hands an
 * existing package to the next member who asks for it), so this is the case rule and not "the user
 * who made it". Same membership rule as the download app's CASE_ACCESS_SQL.
 */
export const JOB_ACCESS_SQL = `
SELECT (
    EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
    OR EXISTS (
        SELECT 1
        FROM download."ProcessMaster" p
        JOIN "TeamRelation" tr ON tr."nCaseid" = p."nCaseid" AND tr."nUserid" = $1::uuid
        WHERE p."nDPid" = $2::uuid
    )
) AS "bAllowed"
`;

/**
 * Gate for get/url: 403 unless JOB_ACCESS_SQL allows (nMasterid, nDPid); 500 when the lookup failed.
 * et_get_download_presigned_url answers for any nDPid, so without this any signed-in user could mint
 * a URL for another case's package.
 */
export async function assertJobAccess(db: RowDb, nMasterid: unknown, nDPid: unknown): Promise<void> {
    if (typeof nMasterid !== 'string' || !UUID_RE.test(nMasterid) || typeof nDPid !== 'string' || !UUID_RE.test(nDPid)) {
        throw new ForbiddenException({ msg: -1, value: 'You are not permitted to download this package' });
    }
    let res: any;
    try {
        res = await db.rowQuery(JOB_ACCESS_SQL, [nMasterid, nDPid]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`job access lookup failed: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this download' });
    }
    if (res.data?.[0]?.bAllowed !== true) {
        throw new ForbiddenException({ msg: -1, value: 'You are not permitted to download this package' });
    }
}
