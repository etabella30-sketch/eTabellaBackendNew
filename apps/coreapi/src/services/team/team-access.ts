import { DbService } from '@app/global/db/pg/db.service';

/** Same UUID, compared case-insensitively; false when either is missing. */
export function sameId(a?: string, b?: string): boolean {
    return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * nUserid's et_case_user_info row when they have a TeamRelation in nCaseid, else null.
 * The SP left-joins TeamRelation, so a user outside the case comes back with no team/role.
 * Also carries the fields the callers check: isAdmin, cFname, cLname, cEmail.
 */
export async function caseMemberRow(db: DbService, nCaseid: string, nUserid: string): Promise<any | null> {
    const row = await caseUserRow(db, nCaseid, nUserid);
    return row?.nTeamid || row?.nRoleid ? row : null;
}

/**
 * nUserid's et_case_user_info row whether or not they are in nCaseid (a user outside the
 * case comes back with nTeamid / nRoleid null); null when the user does not exist or the
 * lookup fails. Prefers the row that carries the case's TeamRelation.
 */
export async function caseUserRow(db: DbService, nCaseid: string, nUserid: string): Promise<any | null> {
    if (!nCaseid || !nUserid) return null;
    const res = await db.executeRef('case_user_info', { nCaseid, nUserid });
    if (!res?.success) return null;
    const rows: any[] = (res.data?.[0] ?? []).filter((r: any) => r?.nUserid);
    return rows.find((r) => r.nTeamid || r.nRoleid) ?? rows[0] ?? null;
}
