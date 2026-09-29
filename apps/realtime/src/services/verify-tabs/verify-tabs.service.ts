import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, Logger } from '@nestjs/common';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { UnicIdentityService } from '../../utility/unic-identity/unic-identity.service';
import { schemaType } from '@app/global/interfaces/db.interface';

@Injectable()
export class VerifyTabsService {
  caseTabs: string[] = [];
  isTabsfetched: boolean = false;
  // Session the cached caseTabs belong to. The service is a process-wide
  // singleton, so without this a session switch kept validating {tab} tokens
  // against the previous case's tabs.
  private tabsSesid: string = null;
  // Bumped per fetch so a slow response for an old session can't overwrite
  // the tabs of the session that replaced it.
  private fetchSeq: number = 0;
  private readonly schema: schemaType = 'realtime';
  private logger = new Logger('verif-tabs')
  constructor(private readonly db: DbService, private readonly sqlLite: SqllitedbService, private unicIdentity: UnicIdentityService) {

  }

  /*
    async verify(charcodes: any[]): Promise<any[]> {
      try {
        const data = String.fromCharCode(...charcodes);
        const matches = [...data.matchAll(/\{(.*?)\}/g)].map(match => match[1]);
        return matches.filter(a => this.caseTabs.includes(a)).map(a => `{${a}}`);
      } catch (error) {
      }
      return [];
    }*/

  async verify(charcodes: any[]): Promise<string[]> {
    try {
      // Convert character codes to a string efficiently
      const data = String.fromCharCode(...charcodes);

      // Initialize an array to collect matches
      const matches: string[] = [];

      // Use a regular expression to find matches one by one
      const regex = /\{(.*?)\}/g;
      let match;

      // Process each match incrementally to save memory
      while ((match = regex.exec(data)) !== null) {


        const value = match[1];
        console.log('Tab in line', value)

        // Check if the value exists in `this.caseTabs` and add to results if true
        const key = value.split(/[\s-]/)[0]; // Split by space or hyphen and take the first part
        // Extract the first part before space or hyphen
        if (this.caseTabs.includes(key)) {
          matches.push(`{${value}}`);
        } else {
          console.log(`Tab {${key}} Found But not exists in caseTabs total ${this.caseTabs.length}`)
        }
      }

      return matches; // Return the filtered and formatted matches
    } catch (error) {
      console.error("Error in verify method:", error);
      return [];
    }
  }

  clearTabs() {
    console.log('Clearing tabls')
    this.isTabsfetched = false;
    this.caseTabs = [];
    this.tabsSesid = null;
    this.fetchSeq++;
  }



  async getSession() {
    const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
    const res = await this.db.executeRef('sessions', { cSessionUnicId }, this.schema);
    if (res.success) {
      return res.data[0] || [];
    } else {
      this.logger.error(`Session List failed :${res.error} `);
      return [];
    }

  }

  async getAllCaseTabs(nSesid: string): Promise<string[]> {
    debugger;
    console.log('Getting tabs', nSesid)
    try {
      if (this.isTabsfetched && this.tabsSesid === nSesid) {
        console.log('Tab already fetched', this.caseTabs?.length);
        return this.caseTabs;
      };

      if (!nSesid) {
        console.log('No session Id Found');
        return []
      };

      // Tabs cached for another session belong to another case — drop them
      // so lines arriving while this fetch runs aren't linked against them.
      if (this.tabsSesid !== nSesid) {
        this.caseTabs = [];
        this.isTabsfetched = false;
        this.tabsSesid = null;
      }
      const seq = ++this.fetchSeq;

      const data = await this.getSession(); //this.sqlLite.get('sessions', 'id = ?', [nSesid]);

      if (!data?.length) {
        console.log('No sessions')
        // return []
      };
      let cCaseno
      try {
        if (data?.length) {
          cCaseno = data[0]["cCaseno"] || '';

          if (!cCaseno) {
            console.log('Case No is null')
            // return [];
          }
        }
      } catch (error) {

      }
      // if (!this.caseTabs.length) {
      try {
        const res = await this.db.executeRef('realtime_case_all_tabs', { cCaseno: cCaseno || null, nSesid })
        if (seq !== this.fetchSeq) {
          console.log('Tabs fetch superseded', nSesid);
          return this.caseTabs;
        }
        if (res?.data?.length) {
          this.caseTabs = res?.data[0].map((a) => a.cTab) || []
          this.isTabsfetched = true;
          this.tabsSesid = nSesid;
        }
      } catch (error) {
        console.log(error);
        if (seq === this.fetchSeq) {
          this.caseTabs = [];
          this.isTabsfetched = false;
          this.tabsSesid = null;
        }
      }
      // }
    } catch (error) {
      console.log(error);
    }
    console.log('TABS LENGTH', this.caseTabs?.length)
    return this.caseTabs;
  }

}