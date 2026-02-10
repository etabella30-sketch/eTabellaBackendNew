import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { workspacefactmdl, workspaceIssueContact } from '../../interfaces/workspace.interface';
// import { ContactFgaService } from '../contact-fga/contact-fga.service';

@Injectable()
export class WorkspaceService {


  constructor(private db: DbService
    // , private contactFgaService: ContactFgaService,
  ) {

  }




  async getDataByFunction(query: workspacefactmdl, fn_name: string): Promise<any[]> {
    let res = await this.db.executeRef(fn_name, query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return []
      }
    } else {
      return []
    }
  }

  async getIssueContactByFunction(query: workspaceIssueContact, fn_name: string): Promise<any[]> {
    //    const contactPermissions =
    //   await this.contactFgaService.getContactPermissionsJson(query.nMasterid);

    // // 2. Extract contact IDs that user can view
    // query['jContactIds'] = contactPermissions
    //   .filter((p) => p.view)
    //   .map((p) => p.contactId);

    let res = await this.db.executeRef(fn_name, query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }



}
