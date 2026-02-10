import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { ComboCodeReq, ComboCodeRes, EmailRes, EmailparseReq, IssuelistReq, UserlistReq, UserlistRes, annotReq, annotRes, getcoloridMDL } from '../../interfaces/common';
import { DocinfoRes } from '../../interfaces/individual.interface';
// import { OpenFgaService } from '@app/global/open-fga/open-fga.service';

@Injectable()
export class CommonService {


    constructor(private db: DbService, 
        // private readonly openFga: OpenFgaService
    ) {

    }

    async getcCodeMaster(body: ComboCodeReq): Promise<ComboCodeRes[]> {
        let res = await this.db.executeRef('combo_codemaster', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }


    async getIssuelist(query: IssuelistReq): Promise<DocinfoRes[]> {
        let res = await this.db.executeRef('issue_list', query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return [{ msg: -1, value: 'Failed ', error: res.error }]
            }
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }


    async getMyteamusers(query: UserlistReq): Promise<UserlistRes[]> {
        let res = await this.db.executeRef('common_my_team_user', query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return [{ msg: -1, value: 'Failed ', error: res.error }]
            }
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getAnnotations(query: annotReq): Promise<any> {


        // let factIds = await this.openFga.listViewableFactIds(query.nMasterid);
        // let docIds = await this.openFga.listViewableDocIds(query.nMasterid);
        // query['jFactids'] = factIds;
        // query['jDocids'] = docIds;

        let res = await this.db.executeRef('doc_annotations', query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return [{ msg: -1, value: 'Failed ', error: res.error }]
            }
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getcolorid(body: getcoloridMDL): Promise<any> {

        const res = await this.db.executeRef('issue_colorid', body);

        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to handle issue_colorid', error: res.error };
        }
    }





}