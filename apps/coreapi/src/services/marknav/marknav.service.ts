import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { AllListReq, CompanyParams, DocListReq, FactCompParams, FactLinkListReq, FactListReq, quickMarkParams } from '../../interfaces/marknav.interface';
import { schemaType } from '@app/global/interfaces/db.interface';

@Injectable()
export class MarknavService {


    realTimeSchema: schemaType = 'realtime';

    constructor(private db: DbService) { }



    async getAll(query: AllListReq): Promise<any> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_get_all', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFactlist(query: FactListReq): Promise<any> {
        query['ref'] = 3;

        let res = await this.db.executeRef('navigate_factlist', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }


    async getCompanylist(query: CompanyParams): Promise<any> {
        let res = await this.db.executeRef('navigate_fact_companies', query, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFactByCompany(query: FactCompParams): Promise<any> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_facts_bycompany', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFactlinks(query: FactLinkListReq): Promise<any> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }
    
    
    async getQuickMarks(query: quickMarkParams): Promise<any> {
        let res = await this.db.executeRef('navigate_quick_mark', query, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    
    async getDoclinks(query: DocListReq): Promise<any> {
        // query['ref'] = 3;
        let res = await this.db.executeRef('marknav_doclinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }


}
