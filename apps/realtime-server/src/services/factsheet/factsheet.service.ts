import { Injectable, Logger } from '@nestjs/common';
import { fectsheetDetailReq, saveFactSheet, unshareDTO } from '../../interfaces/fact.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { schemaType } from '@app/global/interfaces/db.interface';
// import { FactFgaService } from '../fact-fga/fact-fga.service';
// import { FactService } from '../fact/fact.service';
import { UtilityService } from '../utility/utility.service';

@Injectable()
export class FactsheetService {

    realTimeSchema: schemaType = 'realtime';
    private readonly logger = new Logger(FactsheetService.name);
    constructor(private db: DbService,
        // private factFga: FactFgaService,
        //  private readonly factService: FactService,
        private utility: UtilityService) { }

    async getFactDetail(query: fectsheetDetailReq): Promise<any> {
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
        try {
            const res = await this.db.executeRef('factsheet_issues', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                return [];
            }
        } catch (error) {
            return []
        }
    }

    async getFactShared(query: fectsheetDetailReq): Promise<any> {
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
        try {
            const res = await this.db.executeRef('factsheet_contacts', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                return [];
            }
        } catch (error) {
            return []
        }
    }

    async getFactTasks(query: fectsheetDetailReq): Promise<any> {
        try {
            query["ref"] = 3
            const res = await this.db.executeRef('factsheet_tasks', query, this.realTimeSchema);
            if (res.success) {
                return res.data;
            } else {
                return [];
            }
        } catch (error) {
            return []
        }
    }

    async getFactLinks(query: fectsheetDetailReq): Promise<any> {
        try {
            const res = await this.db.executeRef('factsheet_links', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            } else {
                return [];
            }
        } catch (error) {
            return []
        }
    }

    async submit(body: saveFactSheet) {
        try {
            debugger;
            const permissionsObj = await this.fetchPermission(body.nMasterid, body.nFSid);

            if (!permissionsObj?.bCanEdit) return { msg: -1, value: 'You are not authorized to edit this fact' }
            const res = await this.db.executeRef('factsheet_submit', body, this.realTimeSchema);
            if (res.success) {
                if (body.bIsUserUpdated && permissionsObj?.bCanReshare)
                    this.updateSharePermissions(body)


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
            }



        } catch (error) {
        }

    }



    async getFactAnnotation(query: fectsheetDetailReq): Promise<any> {
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