import { BadRequestException, Injectable } from '@nestjs/common';
import { CaseDetailRes, caseDetailsReq, ContactDetailRes, contactListReq, fileUpdateReq, fileUpdateRes, getValueReq, insertReq, insertRes, ongoinglistReq, OngoingListRes, PresentationReq, PresentationSetUpClearScheduleReq, PresentationSetUpClearScheduleRes, PresentationSetUpDetailReq, PresentationSetUpFilesReq, recentFilesidsReq, recentFilesReq, runningPresentationReq, scheduleDeleteReq, ScheduleDeleteRes, scheduleListReq, ScheduleListRes, setValueReq, setValueRes, StatusUpdateReq, StatusUpdateRes, TeamReq, TypeRes, TypesReq } from '../../interfaces/setup/setup.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { schemaType } from '@app/global/interfaces/db.interface';

@Injectable()
export class SetupService {

    schema: schemaType = 'present';
    constructor(private db: DbService,
        private rds: RedisDbService) {
    }

    async getsetup(query: getValueReq): Promise<any> {
        try {
            let data = await this.rds.getValue(`present:${query.nMasterid}:${query.nCaseid}`)
            let res = data ? JSON.parse(data) : {};
            return res
        } catch (error) {

        }
        return {};
    }

    async setsetup(body: setValueReq): Promise<setValueRes> {

        try {
            const previousData = await this.getsetup({ nCaseid: body.nCaseid, nMasterid: body.nMasterid });

            const obj = Object.assign(previousData, body);
            await this.rds.setValue(`present:${body.nMasterid}:${body.nCaseid}`, JSON.stringify(obj), 24 * 3600);
            return { msg: 1 };
        } catch (error) {
            if (error instanceof BadRequestException) {
                console.error('Validation Error:', error.getResponse());
            } else {
                console.error('Unhandled Error:', error.message);
            }
        }
    }


    async getType(query: TypesReq): Promise<TypeRes[]> {
        let res = await this.db.executeRef('present_types', query, this.schema);
        if (res.success) {
            return res.data[0];
        } else {
            return []
        }
    }


    async getsubType(query: TypesReq): Promise<TypeRes[]> {
        let res = await this.db.executeRef('present_subtypes', query, this.schema);
        if (res.success) {
            return res.data[0];
        } else {
            return []
        }
    }



    async getTeam(query: TeamReq): Promise<TypeRes[]> {
        query.ref = 2
        let res = await this.db.executeRef('present_teamusers', query, this.schema);
        if (res.success) {
            return res.data;
        } else {
            return []
        }
    }

    async presentationList(query: PresentationReq): Promise<TypeRes[]> {
        let res = await this.db.executeRef('present_list', query, this.schema);

        if (res.success) {
            return res.data[0];
        } else {
            return [];
        }
    }

    async caseDetail(query: caseDetailsReq): Promise<CaseDetailRes> {
        let res = await this.db.executeRef('present_case_getinfo', query, this.schema);

        if (res.success) {
            let res2 = await this.db.executeRef('user_permission', {
                nMasterid: query.nMasterid,
                nCaseid: query.nCaseid, cType: 'PT'
            });
            if (res2.success) {
                try {
                    res.data[0][0] = { ...res.data[0][0], ...res2.data[0][0] }

                } catch (error) {
                    console.log('error', error);
                }
            }
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async contactList(query: contactListReq): Promise<ContactDetailRes[]> {
        let res = await this.db.executeRef('contact_list', query);
        if (res.success) {
            return res.data[0]
        } else {
            return [];
        }
    }

    async scheduleList(query: scheduleListReq): Promise<ScheduleListRes[]> {
        let res = await this.db.executeRef('present_schedule_list', query, this.schema);
        if (res.success) {
            return res.data[0]
        } else {
            return [];
        }
    }

    async scheduleDelete(body: scheduleDeleteReq): Promise<ScheduleDeleteRes> {
        let res = await this.db.executeRef('present_schedule_delete', body, this.schema);

        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: res.error }
        }
    }

    async ongoing(query: ongoinglistReq): Promise<OngoingListRes[]> {
        let res = await this.db.executeRef('present_ongoing', query, this.schema);
        if (res.success) {
            return res.data[0]
        } else {
            return [];
        }
    }


    async insert(body: insertReq): Promise<insertRes> {
        try {
            let nBundledetailid = null;
            if (!body.nPresentid) {
                body.nPresentid = await this.insertPresentation(body);
            }

            if (!body.nPresentid) {
                return { msg: -1, value: 'Presentation id not found' };
            }

            if (body.nPCid) {
                await this.db.executeRef(
                    'present_update_witness',
                    {
                        nMasterid: body.nMasterid,
                        nContactid: body.nContactid,
                        nPCid: body.nPCid,
                    },
                    this.schema,
                );
            }

            if (body?.jFiles?.length) {



                let bdata = await this.db.executeRef('present_insert_files', { jFiles: body.jFiles, nPresentid: body.nPresentid, nMasterid: body.nMasterid }, this.schema);
                nBundledetailid = bdata.data[0][0].nBundledetailid;

                if (body.cStatus == 'I') {
                    try {
                        await this.rds.deleteValue(`present:${body.nMasterid}:${body.nCaseid}`);
                    } catch (error) {

                    }
                }

            }
            console.log('respnce', { msg: 1, nPresentid: body.nPresentid, nBundledetailid })
            return { msg: 1, nPresentid: body.nPresentid, nBundledetailid };
        } catch (error) {
            return { msg: -1, value: error.message };
        }
    }


    async insertPresentation(body: insertReq): Promise<string> {
        try {
            const res = await this.db.executeRef('present_insert', {
                nMasterid: body.nMasterid,
                cName: body.cName,
                nCaseid: body.nCaseid,
                nContactid: body.nContactid || null,
                nTypeid: body.nTypeid,
                nSTypeid: body.nSTypeid || 0,
                jUsers: body.jUsers || [],
                cStatus: body.cStatus || 'I'
            }, this.schema);
            if (res.success) {
                if (res.data[0][0]["msg"] == 1) {
                    return res.data[0][0]["nPresentid"];
                }
            }
        } catch (error) {
            return Promise.reject({
                msg: -1,
                value: error.message
            });
        }
        return Promise.reject({
            msg: -1,
            value: 'Failed to insert'
        });

    }



    async getPresents(query: PresentationSetUpFilesReq): Promise<any[]> {
        let res = await this.db.executeRef('present_setup_files', query, this.schema);
        if (res.success) {
            return res.data[0]
        } else {
            return [];
        }
    }


    async getPresentsSetUpDetail(query: PresentationSetUpDetailReq): Promise<any[]> {
        let res = await this.db.executeRef('present_get_setup_details', query, this.schema);
        if (res.success) {
            return res.data[0]
        } else {
            return [];
        }
    }
    async clearSchedule(body: PresentationSetUpClearScheduleReq): Promise<PresentationSetUpClearScheduleRes> {
        let res = await this.db.executeRef('present_clear_schedule', body, this.schema);

        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: res.error }
        }
    }

    async homeDetail(query: runningPresentationReq): Promise<any> {
        let res = await this.db.executeRef('present_home_detail', query, this.schema);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: res.error }
        }
    }

    async recentFiles(query: recentFilesReq): Promise<any> {
        let res = await this.db.executeRef('present_recent_files', query, this.schema);
        if (res.success) {
            return res.data[0];
        } else {
            return []
        }
    }

    async files_serial_update(body: fileUpdateReq): Promise<fileUpdateRes> {
        try {
            let res = await this.db.executeRef('present_setup_files_serial_update', body, this.schema);
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: res.error };
            }
        } catch (error) {
            return { msg: -1, value: error.message };
        }
    }

    async update_status(body: StatusUpdateReq): Promise<StatusUpdateRes> {
        try {
            let res = await this.db.executeRef('present_update_status', body, this.schema);
            if (res.success) {
                return res.data[0][0];
            } else {
                return { msg: -1, value: res.error };
            }
        } catch (error) {
            return { msg: -1, value: error.message };
        }
    }

    async recentFilesIds(query: recentFilesidsReq): Promise<any> {
        let res = await this.db.executeRef('present_recent_files_ids', query, this.schema);
        if (res.success) {
            return res.data[0][0];
        } else {
            return []
        }
    }
}