import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';

const logger = new Logger('SectionCreateGate');

type RowDb = Pick<DbService, 'rowQuery'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Who may have a personal section made in a case (bundles-creations/usersectionbuilder): the case
 * ($2) must exist and the caller ($1, the JWT user) must be a global admin or an active member of it
 * (a TeamRelation row with cStatus 'A'; the per-case user switch, permission/usermanage, sets another
 * value). The membership rule of FACT_CREATE_ACCESS_SQL and the task gates.
 */
export const SECTION_CREATE_ACCESS_SQL = `
SELECT (
    EXISTS (SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = $2::uuid)
    AND (
        EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $1::uuid AND u."isAdmin" = true)
        OR EXISTS (
            SELECT 1 FROM "TeamRelation" tr
            WHERE tr."nCaseid" = $2::uuid AND tr."nUserid" = $1::uuid AND tr."cStatus" = 'A'
        )
    )
) AS "bAllowed"
`;

/**
 * Create gate for bundles-creations/usersectionbuilder, run before public.et_user_sectionbuilder.
 * The SP stores the client's nCaseid as given and made sections for a case id that did not exist
 * (the pages that open a case call this route on load, with the case id from the URL).
 * 403 on any refusal, 500 when the lookup fails; nothing is written before it passes.
 */
export async function assertCanCreateUserSection(db: RowDb, nMasterid: string | undefined, nCaseid: string | undefined): Promise<void> {
    const refused = new ForbiddenException({ msg: -1, value: 'You are not permitted to add sections to this case' });
    if (!nMasterid || !UUID_RE.test(nMasterid) || !nCaseid || !UUID_RE.test(nCaseid)) throw refused;
    let res: any;
    try {
        res = await db.rowQuery(SECTION_CREATE_ACCESS_SQL, [nMasterid, nCaseid]);
    } catch (error) {
        res = { success: false, error };
    }
    if (!res?.success) {
        logger.error(`section create access lookup failed: ${res?.error?.message ?? res?.error}`);
        throw new InternalServerErrorException({ msg: -1, value: 'Could not check access to this case' });
    }
    if (res.data?.[0]?.bAllowed !== true) throw refused;
}
