import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { AllListReq, CompanyParams, DocListReq, FactCompParams, FactLinkListReq, FactListReq, HistoryDeleteReq, HistoryExistReq, HistoryInsertReq, MarknavUserlistReq, MarknavUserlistRes, quickMarkParams } from '../../interfaces/marknav.interface';
import { schemaType } from '@app/global/interfaces/db.interface';
// import { OpenFgaService } from '../open-fga/open-fga.service';

@Injectable()
export class MarknavService {
  realTimeSchema: schemaType = 'realtime';

  constructor(
    private db: DbService,
    // private openFga: OpenFgaService,
  ) { }

  async getAll(query: AllListReq): Promise<any> {
    query['ref'] = 3;
    // let factIds = await this.openFga.listViewableFactIds(query.nUserid);
    // query['jFactids'] = factIds;
    let res = await this.db.executeRef(
      'navigate_get_all',
      query,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data;
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async getFactlist(query: FactListReq): Promise<any> {
    query['ref'] = 3;
    // if(query.cFType != 'QF'){
    // let factIds = await this.openFga.listViewableFactIds(query.nUserid);
    // query['jFactids'] = factIds;
    // }
    // console.log('Fact IDs:', factIds);
    // console.log('Query:', query);
    let res = await this.db.executeRef(
      'navigate_factlist',
      query,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data;
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async getCompanylist(query: CompanyParams): Promise<any> {
    // let factIds = await this.openFga.listViewableFactIds(query.nUserid);
    // query['jFactids'] = factIds;
    let res = await this.db.executeRef(
      'navigate_fact_companies',
      query,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data[0];
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async getFactByCompany(query: FactCompParams): Promise<any> {
    query['ref'] = 3;
    // let factIds = await this.openFga.listViewableFactIds(query.nUserid);
    // query['jFactids'] = factIds;
    let res = await this.db.executeRef(
      'navigate_facts_bycompany',
      query,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data;
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async getFactlinks(query: FactLinkListReq): Promise<any> {
    let res = await this.db.executeRef('marknav_factlinks', query, this.realTimeSchema);
    if (res.success) {
      return res.data[0];
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

  async insertHistory(body: HistoryInsertReq): Promise<any> {
    try {
      body.cPermission = 'N';
      const res = await this.db.executeRef('manage_history', body, this.realTimeSchema);
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1, value: 'Failed to insert history', error: res.error };
      }

    } catch (error) {
      return { msg: -1, value: 'Failed ', error: error }

    }
  }

  async deleteHistory(query: HistoryDeleteReq): Promise<any> {
    try {
      query.cPermission = 'D';
      const res = await this.db.executeRef('manage_history', query, this.realTimeSchema);
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1, value: 'Failed to delete history', error: res.error };
      }

    } catch (error) {
      return { msg: -1, value: 'Failed ', error: error }

    }
  }

  async getHistoryExist(query: HistoryExistReq): Promise<any> {
    try {
      const res = await this.db.executeRef('marknav_history_exist', query, this.realTimeSchema);
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1, value: 'Failed to check history exist', error: res.error };
      }

    } catch (error) {
      return { msg: -1, value: 'Failed ', error: error }

    }
  }


  async getMarknavTeamUsers(query: MarknavUserlistReq): Promise<MarknavUserlistRes[]> {
    let res = await this.db.executeRef('marknav_team_user', query, this.realTimeSchema);
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

}
