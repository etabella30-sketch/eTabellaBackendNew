import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { AllListReq, CompanyParams, DocListReq, FactCompParams, FactLinkListReq, FactListReq, quickMarkParams } from '../../interfaces/marknav.interface';
import { schemaType } from '@app/global/interfaces/db.interface';

/**
 * The actor of every Mark Navigator read is the token user: JwtMiddleware writes it into nMasterid, but the realtime
 * et_navigate_* / et_marknav_* SPs read nUserid, which the client used to pick (an IDOR: one user could read another
 * user's marks). Phase 8 of the shared-libraries plan: both identity keys are the token user, whatever the client sent.
 */
function asTokenUser<T extends { nUserid?: string; nMasterid?: string }>(query: T): T {
    return { ...query, nUserid: query.nMasterid, nMasterid: query.nMasterid };
}

@Injectable()
export class MarknavService {

    realTimeSchema: schemaType = 'realtime';

    constructor(private db: DbService) { }

    async getFactlist(query: FactListReq): Promise<any> {
        query = asTokenUser(query);
        query['ref'] = 3;

        let res = await this.db.executeRef('navigate_factlist', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getCompanylist(query: CompanyParams): Promise<any> {
        query = asTokenUser(query);
        let res = await this.db.executeRef('navigate_fact_companies', query, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFactByCompany(query: FactCompParams): Promise<any> {
        query = asTokenUser(query);
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_facts_bycompany', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFactlinks(query: FactLinkListReq): Promise<any> {
        query = asTokenUser(query);
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }
    
    

    
    async getDoclinks(query: DocListReq): Promise<any> {
        query = asTokenUser(query);
        // query['ref'] = 3;
        let res = await this.db.executeRef('marknav_doclinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

}
