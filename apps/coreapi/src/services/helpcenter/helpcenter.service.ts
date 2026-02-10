import { DbService } from '@app/global/db/pg/db.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { Injectable } from '@nestjs/common';
import { GetCommonTopicsReq, GetFaqListReq, GetKeyWordReq, GetModuleListReq, GetSubModuleListReq, InsertFeedbackReq, ModuleDetailReq, ModuleIUReq, SearchKeyReq, SubModuleDetailReq, SubModuleIUReq } from '../../interfaces/helpcenter.interface';

@Injectable()
export class HelpcenterService {
  schema: schemaType = 'helpcenter';

  constructor(private db: DbService) {}

  async getkeywords(query:GetKeyWordReq): Promise<any> {
    let res = await this.db.executeRef('help_get_keywords', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }

  async commonTopics(query:GetCommonTopicsReq): Promise<any> {
    let res = await this.db.executeRef('help_get_common_topic', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }

  async moduleList(query:GetModuleListReq): Promise<any> {
    let res = await this.db.executeRef('help_module_list', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }

  async subModuleList(query:GetSubModuleListReq): Promise<any> {
    let res = await this.db.executeRef('help_sub_module_list', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }

  async faqlist(query:GetFaqListReq): Promise<any> {
    let res = await this.db.executeRef('help_get_faq_list', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }
  
  async insertfeedback(body: InsertFeedbackReq): Promise<any> {
    let res = await this.db.executeRef('help_insert_feedback', body, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed ', error: res.error }
    }
  }

  
  async moduleIU(body: ModuleIUReq): Promise<any> {
    let res = await this.db.executeRef('help_module_iu', body, this.schema);
    if (res.success && res.data[0]?.length > 0) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Failed ', error: res.error }
    }
  }

  
  async subModuleIU(body: SubModuleIUReq): Promise<any> {
    let res = await this.db.executeRef('help_sub_module_iu', body, this.schema);
    if (res.success && res.data[0]?.length > 0) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Failed ', error: res.error }
    }
  }

  async moduleDetail(query: ModuleDetailReq): Promise<any> {
    let res = await this.db.executeRef('help_module_detail', query, this.schema);
    if (res.success && res.data[0]?.length > 0) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Failed ', error: res.error }
    }
  }
  
  async subModuleDetail(query: SubModuleDetailReq): Promise<any> {
    let res = await this.db.executeRef('help_sub_module_detail', query, this.schema);
    if (res.success && res.data[0]?.length > 0) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Failed ', error: res.error }
    }
  }


  async searchKey(body: SearchKeyReq): Promise<boolean> {
    let res = await this.db.executeRef('help_search_key', body, this.schema);
    if (res.success && res.data[0]?.length > 0) {
      return true;
    } else {
      return false;
    }
  }
}

