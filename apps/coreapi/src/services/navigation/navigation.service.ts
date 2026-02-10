import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { CheckNavigationReq, CheckNavigationRes, FactCompanyRes, FactlinkListRes, FactListReq, FactListRes, FactCompParams, CompanyParams, filterReq, shareusers, AllListReq, AllLinkListReq } from '../../interfaces/navigation.interface';
import { FilterService } from '../filter/filter.service';

@Injectable()
export class NavigationService {

    constructor(private db: DbService, private navigation: FilterService) {

    }


    async checkNavigationData(query: CheckNavigationReq): Promise<CheckNavigationRes> {
        let res = await this.db.executeRef('navigate_checkdata', query);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getFactlist(query: FactListReq): Promise<any> {
        query['ref'] = 3;

        // const mdl = {
        //     ...query['ref']
        // };
        // if (query.jFilter) {
        //     this.navigation.getFilter(query.jFilter, mdl);

        // }

        let res = await this.db.executeRef('navigate_factlist', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getCompanylist(query: CompanyParams): Promise<FactCompanyRes[]> {
        let res = await this.db.executeRef('navigate_fact_companies', query);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }


    async getFactByCompany(query: FactCompParams): Promise<FactCompanyRes[]> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_facts_bycompany', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFactlinks(query: FactListReq): Promise<FactlinkListRes[]> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlinks', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getDoclinks(query: FactListReq): Promise<FactlinkListRes[]> {
        // query['ref'] = 3;
        let res = await this.db.executeRef('navigate_doclist', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    // async getWeblinks(query: FactListReq): Promise<FactlinkListRes[]> {
    //     query['ref'] = 3;
    //     let res = await this.db.executeRef('navigate_weblist', query);
    //     if (res.success) {
    //         return res.data;
    //     } else {
    //         return [{ msg: -1, value: 'Failed ', error: res.error }]
    //     }
    // }


    async getWebLinks(query: FactListReq): Promise<FactlinkListRes[]> {
        // query['ref'] = 3;
        let res = await this.db.executeRef('navigate_weblinks', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFacttasks(query: FactListReq): Promise<FactlinkListRes[]> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_task_facts', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getFiletasks(query: FactListReq): Promise<FactlinkListRes[]> {
        query['ref'] = 2;
        let res = await this.db.executeRef('navigate_task_files', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }



    async getIncommingLinks(query: filterReq): Promise<FactlinkListRes[]> {
        let res = await this.db.executeRef('filter_incomming_docs', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }


    async getOutgoingLinks(query: filterReq): Promise<FactlinkListRes[]> {
        let res = await this.db.executeRef('filter_outgoing_docs', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }


    async getdestinationDocs(query: filterReq): Promise<FactlinkListRes[]> {
        let res = await this.db.executeRef('filter_destinations_docs', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getdocinfoDocs(query: filterReq): Promise<FactlinkListRes[]> {
        let res = await this.db.executeRef('filter_docinfo', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }



    async getwebInfoDocs(query: filterReq): Promise<FactlinkListRes[]> {
        let res = await this.db.executeRef('filter_weblink', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }




    async getShareds(query: shareusers): Promise<FactlinkListRes[]> {
        // query['ref'] = 3;
        let res = await this.db.executeRef('navigate_shared_users', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    async getAll(query: AllListReq): Promise<any> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_get_all', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

    
    async getAllLinks(query: AllLinkListReq): Promise<any> {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_get_all_links', query);
        if (res.success) {
            return res.data;
        } else {
            return [{ msg: -1, value: 'Failed ', error: res.error }]
        }
    }

}
