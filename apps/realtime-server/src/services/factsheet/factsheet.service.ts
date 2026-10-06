import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { FactTeamUsersReq, fectsheetDetailReq, saveFactSheet, unshareDTO } from '../../interfaces/fact.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { schemaType } from '@app/global/interfaces/db.interface';
// import { FactFgaService } from '../fact-fga/fact-fga.service';
// import { FactService } from '../fact/fact.service';
import { UtilityService } from '../utility/utility.service';
import { callerCanViewFact } from './fact-view-gate';

/** factsheet/detail's answer to a caller who may not view the fact: the service's normal failure shape, no fact data. */
export const FACTSHEET_NOT_VIEWABLE = Object.freeze({ msg: -1, value: 'You are not permitted to view this fact' });

@Injectable()
export class FactsheetService {

    realTimeSchema: schemaType = 'realtime';
    private readonly logger = new Logger(FactsheetService.name);
    constructor(private db: DbService,
        // private factFga: FactFgaService,
        //  private readonly factService: FactService,
        private utility: UtilityService) { }

    /**
     * Read gate for a fact and its sibling lists: the bCanView rule of et_fact_permissions, shared
     * with the fact/* read routes (see fact-view-gate.ts). Called outside the readers' try/catch so a
     * missing fact reaches the client as 404, and a failed lookup as 500.
     *
     * A caller who may not view the fact gets the reader's normal empty result (FACTSHEET_NOT_VIEWABLE
     * for detail) and no reader SP runs, instead of a 403: the legacy fact sheet (/individual/doc/...)
     * and workspace pages load these for facts the caller may not see and show their own
     * "not authorized" state, while the legacy interceptor turns any 403 there into a redirect to
     * /user/dashboard. The new frontend maps both answers to the same empty state.
     */
    private async canView(nMasterid: string, nFSid: string): Promise<boolean> {
        return callerCanViewFact(this.db, nMasterid, nFSid);
    }

    /** Use the same same-team lookup as coreapi, rather than the broader case/session roster. */
    async getTeamUsers(query: FactTeamUsersReq): Promise<any[]> {
        try {
            const res = await this.db.executeRef('common_my_team_user', {
                nCaseid: query.nCaseid,
                nMasterid: query.nMasterid,
            }, 'public');
            const rows = res?.data?.[0];
            if (!res?.success || !Array.isArray(rows) || rows.some(row => row?.msg === -1)) {
                throw new Error('Team member lookup failed');
            }
            return rows;
        } catch (error) {
            this.logger.error('common_my_team_user failed');
            throw new InternalServerErrorException('Failed to fetch team members');
        }
    }

    async getFactDetail(query: fectsheetDetailReq): Promise<any> {
        if (!(await this.canView(query.nMasterid, query.nFSid))) return { ...FACTSHEET_NOT_VIEWABLE };
        try {
            const res = await this.db.executeRef('factsheet_detail', query, this.realTimeSchema);
            if (res.success) {
                // const detail = { ...res.data[0][0], can_view: false, can_edit: false, can_delete: false, can_share: false, can_comment: false };
                // const permissionsObj = await this.fetchPermission(query.nMasterid, query.nFSid);
                // return { ...detail, ...permissionsObj };
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }


    /**
     * GET factsheet/permissions. The et_fact_permissions row carries the fact's owner (nUserid), so
     * it goes only to a caller who may view the fact. Anyone else gets factsheet/detail's refusal
     * shape: no owner and no flag set, which the legacy fact table (the only caller) reads as "may not
     * reshare". A failed lookup keeps its own { msg: -1, error } answer, and an unknown fact its empty
     * one; neither names an owner.
     */
    async fetchPermissionForCaller(nMasterid: string, nFSid: string): Promise<any> {
        const row: any = await this.fetchPermission(nMasterid, nFSid);
        if (!row || row.msg === -1 || row.bCanView === true) return row;
        return { ...FACTSHEET_NOT_VIEWABLE };
    }

    async fetchPermission(nMasterid: string, nFSid: string): Promise<{ error?: any, msg: number, bCanView?: boolean, bCanEdit?: boolean, bCanDelete?: boolean, bCanReshare?: boolean, bCanComment?: boolean }> {
        try {
            const res = await this.db.executeRef('fact_permissions', { nUserid: nMasterid, nFSid });
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, error: res.error };
            }
            // const permissions = await this.factFga.getUserFactPermissionsOnFact(nMasterid, nFSid);
            // if (permissions) {
            //     return {
            //         bCanView: permissions.can_view,
            //         bCanEdit: permissions.can_edit,
            //         bCanDelete: permissions.can_delete,
            //         bCanReshare: permissions.can_share,
            //         bCanComment: permissions.can_comment
            //     }
            // } else {
            //     this.logger.error('No permission found for this fact')
            // }
        } catch (error) {
            this.logger.error(error);
        }
        return {} as any
    }

    async getFactIssues(query: fectsheetDetailReq): Promise<any> {
        if (!(await this.canView(query.nMasterid, query.nFSid))) return [];
        try {
            const res = await this.db.executeRef('factsheet_issues', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                return this.readFailed('factsheet_issues', res.error);
            }
        } catch (error) {
            return this.readFailed('factsheet_issues', error);
        }
    }

    async getFactShared(query: fectsheetDetailReq): Promise<any> {
        if (!(await this.canView(query.nMasterid, query.nFSid))) return [];
        try {


            try {
                // const permissions = await this.factFga.getFactUserPermissions(
                //     query.nFSid,
                // );
                // console.log('PERMISSIONS', permissions)
                // query['jPermittedUsers'] = permissions;
                const res = await this.db.executeRef(
                    'factsheet_shared',
                    query,
                    this.realTimeSchema,
                );
                if (res.success) {
                    return res.data[0];
                } else {
                    return { msg: -1, value: 'Fetch failed', error: res.error };
                }
            } catch (error) {
                return { msg: -1, value: 'Fetch failed', error: error };
            }


            // const res = await this.db.executeRef('factsheet_shared', query, this.realTimeSchema);
            // if (res.success) {
            //     const users = res.data[0];



            //     return;
            // } else {
            //     return [];
            // }
        } catch (error) {
            return []
        }
    }

    async getFactContacts(query: fectsheetDetailReq): Promise<any> {
        if (!(await this.canView(query.nMasterid, query.nFSid))) return [];
        try {
            const res = await this.db.executeRef('factsheet_contacts', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                return this.readFailed('factsheet_contacts', res.error);
            }
        } catch (error) {
            return this.readFailed('factsheet_contacts', error);
        }
    }

    async getFactTasks(query: fectsheetDetailReq): Promise<any> {
        // Empty result = the three empty cursors of et_factsheet_tasks.
        if (!(await this.canView(query.nMasterid, query.nFSid))) return [[], [], []];
        try {
            query["ref"] = 3
            const res = await this.db.executeRef('factsheet_tasks', query, this.realTimeSchema);
            if (res.success) {
                return res.data;
            } else {
                return this.readFailed('factsheet_tasks', res.error);
            }
        } catch (error) {
            return this.readFailed('factsheet_tasks', error);
        }
    }

    /**
     * A failed read answers the failure shape getFactShared always used, not `[]`: the Reader's
     * Full Fact editor opened on "none" in place of "unknown" and its save (the SP replaces the
     * whole list) deleted the fact's real contacts, tasks and links.
     */
    private readFailed(sp: string, error: unknown): { msg: -1; value: string; error: unknown } {
        const message = (error as any)?.message ?? error;
        this.logger.error(`${sp} failed: ${message}`);
        return { msg: -1, value: 'Fetch failed', error: message };
    }

    async getFactLinks(query: fectsheetDetailReq): Promise<any> {
        if (!(await this.canView(query.nMasterid, query.nFSid))) return [];
        try {
            const res = await this.db.executeRef('factsheet_links', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                return this.readFailed('factsheet_links', res.error);
            }
        } catch (error) {
            return this.readFailed('factsheet_links', error);
        }
    }

    async submit(body: saveFactSheet) {
        try {
            debugger;
            const permissionsObj = await this.fetchPermission(body.nMasterid, body.nFSid);

            if (!permissionsObj?.bCanEdit) return { msg: -1, value: 'You are not authorized to edit this fact' }
            const res = await this.db.executeRef('factsheet_submit', body, this.realTimeSchema);
            if (res.success) {
                // Awaited: the share replacement used to be fire-and-forget, so a
                // failed et_fact_insert_team left the old share list in place while
                // the client still saw "Fact updated".
                if (body.bIsUserUpdated && permissionsObj?.bCanReshare)
                    await this.updateSharePermissions(body)

                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Failed to save', error: res.error };
            }
        } catch (error) {
            return { msg: -1, value: 'Failed to save', error: error?.message };
        }
    }

    async unshare(body: unshareDTO) {
        try {
            // return this.factFga.revokeUserAccessForFact(body.nFSid, body.nMasterid);
            const res = await this.db.executeRef('factsheet_unshare_withme', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Failed to save', error: res.error };
            }
        } catch (error) {
            return { msg: -1, value: 'Failed to save', error: error?.message };
        }
    }


    async delete(body: unshareDTO) {
        try {
            const res = await this.db.executeRef('factsheet_delete', body, this.realTimeSchema);
            if (res.success) {
                // await this.factFga.deleteFactGraph(body.nFSid);
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Failed to save', error: res.error };
            }
        } catch (error) {
            return { msg: -1, value: 'Failed to save', error: error?.message };
        }
    }


    async updateSharePermissions(body: saveFactSheet) {
        // const delStatus = await this.factFga.revokeViewEditShareForFact(body.nFSid, [body.nMasterid]);
        try {
            // const users = JSON.parse(body.jUsers) || [];

            // const updateStatus = await this.factService.insertFGATuples(body.nFSid, users);

            const res = await this.db.executeRef(
                'fact_insert_team',
                body,
                this.realTimeSchema,
            );

            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]['jNotify'] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                } catch (error) { }
            } else {
                // A failed share replacement must not vanish silently — the fact
                // save already succeeded, so this is the only trace of the miss.
                console.error('[factsheet] fact_insert_team failed for', body.nFSid, res.error);
            }

        } catch (error) {
            console.error('[factsheet] updateSharePermissions crashed for', body?.nFSid, error?.message ?? error);
        }

    }



    async getFactAnnotation(query: fectsheetDetailReq): Promise<any> {
        if (!(await this.canView(query.nMasterid, query.nFSid))) return [];
        try {
            try {
                const res = await this.db.executeRef(
                    'getfact_annotation',
                    query,
                    this.realTimeSchema,
                );
                if (res.success) {
                    return res.data[0];
                } else {
                    return { msg: -1, value: 'Fetch failed', error: res.error };
                }
            } catch (error) {
                return { msg: -1, value: 'Fetch failed', error: error };
            }
        } catch (error) {
            return []
        }
    }


}