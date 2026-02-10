import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import {
  CRBuilderReq,
  CRBuilderRes,
  CaseContactBuilderReq,
  CheckMentionExistsReq,
  CompanyBuilderReq,
  CompanyBuilderRes,
  CompanyReq,
  CompanyRes,
  ContactBuilderReq,
  ContactBuilderRes,
  ContactDeleteReq,
  ContactFileReq,
  ContactFileRes,
  ContactReq,
  ContactRes,
  ContactlsReq,
  ContactlsRes,
  ContactroleReq,
  ContactroleRes,
} from '../../interfaces/contact.interface';
// import { ContactFgaService } from 'apps/coreapi/src/services/contact-fga/contact-fga.service';

@Injectable()
export class ContactService {
  constructor(
    private db: DbService,
    // private contactFgaService: ContactFgaService,
  ) { }

  async getContactlist(query: ContactlsReq): Promise<ContactlsRes[]> {
    /*  const contactPermissions =
        await this.contactFgaService.getContactPermissionsJson(query.nMasterid);
  
      // 2. Extract contact IDs that user can view
      query['jContactIds'] = contactPermissions
        .filter((p) => p.view)
        .map((p) => p.contactId);*/

    let res = await this.db.executeRef('contact_list', query);

    if (res.success) {
      try {
        // const contacts = res.data[0];
        // const contactsWithPermissions = contacts.map((c) => {
        //   const perms = contactPermissions.find(
        //     (p) => p.contactId === c.nContactid,
        //   );

        //   return {
        //     ...c,
        //     permissions: perms
        //       ? {
        //         bCanView: perms.view,
        //         bCanEdit: perms.edit,
        //         bCanDelete: perms.delete,
        //       }
        //       : {
        //         bCanView: false,
        //         bCanEdit: false,
        //         bCanDelete: false,
        //       },
        //   };
        // });
        return res.data[0]; //contactsWithPermissions;
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async getContactDetail(query: ContactReq): Promise<ContactRes> {
    let res = await this.db.executeRef('contact_detail', query);
    if (res.success) {
      try {
        return res.data[0][0];
      } catch (error) {
        return { msg: -1, value: 'Failed ', error: res.error };
      }
    } else {
      return { msg: -1, value: 'Failed ', error: res.error };
    }
  }

  async contactFiles(query: ContactFileReq): Promise<ContactFileRes[]> {
    // const contactPermissions =
    //   await this.contactFgaService.getContactPermissionsJson(query.nMasterid);

    // // 2. Extract contact IDs that user can view
    // query['jContactIds'] = contactPermissions
    //   .filter((p) => p.view)
    //   .map((p) => p.contactId);

    let res = await this.db.executeRef('contact_files', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async contactBuilder(body: ContactBuilderReq): Promise<ContactBuilderRes> {
    let res = await this.db.executeRef('contactbuilder', body);
    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Creation failed', error: res.error };
    }
  }

  async contactDelete(body: ContactDeleteReq): Promise<ContactBuilderRes> {
    let res = await this.db.executeRef('contactbuilder', body);
    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Deletion failed', error: res.error };
    }
  }

  async getCompanylist(query: CompanyReq): Promise<CompanyRes[]> {
    let res = await this.db.executeRef('company_list', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async companyBuilder(body: CompanyBuilderReq): Promise<CompanyBuilderRes> {
    let res = await this.db.executeRef('companybuilder', body);
    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Creation failed', error: res.error };
    }
  }

  async getContactrolelist(query: ContactroleReq): Promise<ContactroleRes[]> {
    let res = await this.db.executeRef('contact_rolelist', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async contactroleBuilder(body: CRBuilderReq): Promise<CRBuilderRes> {
    let res = await this.db.executeRef('contact_rolebuilder', body);
    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Creation failed', error: res.error };
    }
  }

  // from here new rt design apis for contacts
  async getContactCaserolelist(
    query: ContactroleReq,
  ): Promise<ContactroleRes[]> {
    let res = await this.db.executeRef('contact_case_rolelist', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async caseContactroleBuilder(body: CRBuilderReq): Promise<CRBuilderRes> {
    let res = await this.db.executeRef('contact_case_rolebuilder', body);
    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Creation failed', error: res.error };
    }
  }

  async caseContactBuilder(
    body: CaseContactBuilderReq,
  ): Promise<ContactBuilderRes> {
    let res = await this.db.executeRef('case_contactbuilder', body);
    if (res.success) {
      const contact = res.data[0][0];
      /* if (contact.nContactid && body.nCaseid) {
          await this.contactFgaService.createContactPermissions(
            contact.nContactid,
            body.nMasterid,
            body.nCaseid,
          );
        }*/
      return contact;
    } else {
      return { msg: -1, value: 'Creation failed', error: res.error };
    }
  }

  async getContactCompanylist(query: CompanyReq): Promise<CompanyRes[]> {
    let res = await this.db.executeRef('contact_company_list', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [{ msg: -1, value: 'Failed ', error: res.error }];
      }
    } else {
      return [{ msg: -1, value: 'Failed ', error: res.error }];
    }
  }

  async checkMentionExists(query: CheckMentionExistsReq): Promise<any> {
    let res = await this.db.executeRef('contact_mentiontag_exists', query);
    if (res.success) {
      try {
        return res.data[0][0];
      } catch (error) {
        return { msg: -1, value: 'Failed ', error: res.error };
      }
    } else {
      return { msg: -1, value: 'Failed ', error: res.error };
    }
  }
}
