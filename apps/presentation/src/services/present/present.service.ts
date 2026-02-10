import { Injectable } from '@nestjs/common';
import { colorChangeHighlightReq, deleteHighlightReq, getPresentDetailReq, getRunningScreenShareReq, getShareLinkListByPresenterReq, getShareLinkListReq, joinRequestReq, managePresentStatusReq, managePresentUserReq, manageUserReq, onlineUserReq, persentHighlightsReq, persentManageDocReq, presentDocPositionReq, presentEvents, presentsEvent, presentStatus, presentToolReq, presetnTabsReq, remarksInsertReq, SaveHighlightReq, shareLinkReq, unsaveHighlightsReq } from '../../interfaces/setup/present.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { DbService } from '@app/global/db/pg/db.service';
import { UtilityService } from '../../utility/utility.service';
import { schemaType } from '@app/global/interfaces/db.interface';

@Injectable()
export class PresentService {

  presentation: string = 'presentation';
  presentationTools: string = 'presentation-tools';
  presentHighlights: string = 'present-highlights';
  schema: schemaType = 'present';
  constructor(private db: DbService,
    private rds: RedisDbService, private readonly utility: UtilityService) {
  }


  async getPresentDetail(query: presetnTabsReq): Promise<any> {
    let res = await this.db.executeRef('present_individual_detail', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }



  async getPresentToolDetail(query: presentToolReq): Promise<any> {
    let res = await this.db.executeRef('present_toolbar_detail', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }



  async getPresentUsers(query: presentToolReq): Promise<any> {
    query.ref = 2
    let res = await this.db.executeRef('present_toolbar_users', query, this.schema);
    if (res.success) {

      try {
        const users = await this.rds.getAllUserIds(query.nPresentid);
        res.data[1].map(a => a.isLive = users.includes(a.nUserid));
      } catch (error) {
        console.error(error);
      }

      return res.data;
    } else {
      return [];
    }
  }


  async managePresentUser(query: managePresentUserReq, domain: string): Promise<any> {
    let res = await this.db.executeRef('present_insertupdate_users', query, this.schema);
    if (res.success) {

      try {
        const cPresentStatus = await this.presentStatus(query.nPresentid);
        // if (cPresentStatus == 'L') {
        if (!['I', 'B'].includes(cPresentStatus)) {
          try {
            this.utility.emit({
              event: 'USER-MANAGE',
              data: {
                nPresentid: query.nPresentid,
                cStatus: query.cStatus,
                nUserid: query.nUserid,
                cPermission: query.cPermission
              }
            } as presentEvents, this.presentationTools)



            this.utility.emit({
              event: 'USER-COUNT-UPDATED',
              data: {
                nPresentid: query.nPresentid,
                nTotal: res.data[0][0]["nTotal"]
              }
            } as presentEvents, this.presentation)
          } catch (error) {

          }

          try {
            if (query.cStatus == 'A' && query.cPermission == 'N') {


              const presentmsg = await this.db.executeRef('present_user_list', { nPresentid: query.nPresentid, nMasterid: query.nMasterid, nUserid: query.nUserid }, this.schema);


              if (presentmsg.success) {
                for (let x of presentmsg.data[0]) {
                  this.utility.emit({
                    ...x,
                    cType: 'PRESENT-USER-ADDED',
                    action: `https://${domain}/individual/doc/${encodeURIComponent(`[[],${x.nCaseid},${x.nPresentid}]`)}`,
                    cTitle: 'You’ve Been Added to a Presentation',
                    cMsg: `You have been added to the presentation${x.cName ? ` '${x.cName}'` : ''} for the case '${x.cCasename}' (Case No: ${x.cCaseno}) by ${x.cCreator}.`
                  }, 'notification')
                }
              }

            }
          } catch (error) {

          }
        }
      } catch (error) {
        console.error(error);
      }

      return res.data[0];
    } else {
      return [];
    }
  }


  async managePresentStatus(query: managePresentStatusReq, domain: string): Promise<any> {
    debugger;
    let res = await this.db.executeRef('present_manage_status', query, this.schema);
    if (res.success) {
      if (res.data[0][0]["msg"] == 1) {
        try {


          this.utility.emit({
            event: query.cStatus == 'P' ? 'PAUSED' : query.cStatus == 'E' ? 'END' : 'LIVE',
            data: {
              nPresentid: query.nPresentid,
              cStatus: query.cStatus
            }
          } as presentEvents, this.presentation)
          this.rds.setValue(`PRESENT:${query.nPresentid}:STATUS`, query.cStatus, 24 * 3600);
        } catch (error) {
          console.error(error);
        }

        try {
          if (res.data[0][0]["isStarted"]) {
            this.updatePresentList({ nPresentid: query.nPresentid, nMasterid: query.nMasterid, event: 'LIVE' }, domain);
          }
        } catch (error) {
          console.error(error);
        }


      }
      return res.data[0];
    } else {
      return [];
    }
  }

  async updatePresentList({ nPresentid, nMasterid, event }, domain?: string): Promise<any> {
    try {
      const res = await this.db.executeRef('present_user_list', { nPresentid, nMasterid }, this.schema);

      if (res.success) {
        for (let x of res.data[0]) {
          try {
            this.utility.emit({
              event,
              data: {
                nPresentid,
                nUserid: x.nUserid,
              }
            } as presentEvents, this.presentationTools)
          } catch (error) {
          }


          try {
            if (event == 'LIVE') {
              this.utility.emit({
                ...x,
                cType: 'PRESENT-START',
                action: `https://${domain}/individual/doc/${encodeURIComponent(`[[],${x.nCaseid},${x.nPresentid}]`)}`,
                cTitle: 'PRESENTATION STARTED',
                cMsg: `A new presentation${x.cName ? ` '${x.cName}'` : ''} has started for the case '${x.cCasename}' (Case No: ${x.cCaseno}), initiated by ${x.cCreator}.`
              }, 'notification')

            }
          } catch (error) {
            console.log(error);
          }

        }
      }
    } catch (error) {

    }

  }


  async endPresentation(query: managePresentStatusReq): Promise<any> {
    let res = await this.db.executeRef('present_manage_status', query, this.schema);
    if (res.success) {
      try {
        this.utility.emit({
          event: 'END',
          data: {
            nPresentid: query.nPresentid,
            cStatus: 'E'
          }
        } as presentEvents, this.presentation)
        this.rds.setValue(`PRESENT:${query.nPresentid}:STATUS`, query.cStatus, 24 * 3600);
      } catch (error) {
        console.error(error);
      }
      try {
        this.updatePresentList({ nPresentid: query.nPresentid, nMasterid: query.nMasterid, event: 'END' });
      } catch (error) {
        console.error(error);
      }

      return res.data[0];
    } else {
      return [];
    }
  }

  async getTabs(query: presetnTabsReq): Promise<any> {
    debugger;
    let res = await this.db.executeRef('present_individual_tabs', query, this.schema);
    if (res.success) {
      let files = [...res.data[0]];
      try {
        const presentDetail = await this.db.executeRef('present_individual_detail', { nPresentid: query.nPresentid, nMasterid: query.nMasterid }, this.schema);
        const isHost = presentDetail.data[0][0]["isHost"];

        const redisData = JSON.parse(await this.rds.getValue(`PRESENT:${query.nPresentid}:TAB`));
        if (redisData) {
          if (!isHost) {
            files = files.filter(a => a.nBundledetailid == redisData.nBundledetailid);

            if (!files?.length) {
              files = [res.data[0][0]];
            }

          } else {
            files.map(a => a.isActivate = (a.nBundledetailid == redisData.nBundledetailid));
          }

        }
      } catch (error) {
        console.error(error);

      }


      return files;
    } else {
      return [];
    }
  }

  async getPresentHighlights(query: persentHighlightsReq): Promise<any> {
    let res = await this.db.executeRef('present_highlights', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }

  async saveHighlight(query: SaveHighlightReq): Promise<any> {
    let res = await this.db.executeRef('present_highlights_insert', query, this.schema);
    if (res.success) {

      try {

        const cPresentStatus = await this.presentStatus(query.nPresentid);
        if (cPresentStatus == 'L') {

          this.utility.emit({
            event: 'PRESENT-HIGHLIGHT-ADDED',
            data: {
              nPresentid: query.nPresentid,
              uuid: query.uuid,
              type: query.type,
              width: query.width,
              rects: JSON.parse(query.rects || '[]'),
              lines: JSON.parse(query.lines || '[]'),
              page: query.page,
              nAId: res.data[0][0]["nAId"],
              linktype: 'P'
            }
          } as presentEvents, this.presentHighlights)

        }
      } catch (error) {
        console.error(error);
      }

      return res.data[0][0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }


  async deleteHighlight(query: deleteHighlightReq): Promise<any> {
    let res = await this.db.executeRef('present_highlights_delete', query, this.schema);
    if (res.success) {

      try {



        const cPresentStatus = await this.presentStatus(query.nPresentid);
        if (cPresentStatus == 'L') {

          this.utility.emit({
            event: 'PRESENT-HIGHLIGHT-DELETED',
            data: {
              nPresentid: query.nPresentid,
              uuid: query.uuid,
              page: query.page,
              nAId: res.data[0][0]["nAId"]
            }
          } as presentEvents, this.presentHighlights)

        }

      } catch (error) {
        console.error(error);
      }

      return res.data[0][0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }



  async manageUserRequest(query: manageUserReq): Promise<any> {
    let res = await this.db.executeRef('present_toolbar_user_accept_reject', query, this.schema);
    if (res.success) {


      try {


        const cPresentStatus = await this.presentStatus(query.nPresentid);
        if (!['I', 'B'].includes(cPresentStatus)) {

          this.utility.emit({
            event: 'REQ-MANAGE',
            data: {
              nPresentid: query.nPresentid,
              cStatus: query.cStatus,
              nUserid: query.nUserid,
              isHaveHighlight: res.data[0][0]["isHaveHighlight"]
            }
          } as presentEvents, this.presentationTools)


        }

      } catch (error) {
      }


      return res.data[0][0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }




  async requestToJoin(query: joinRequestReq): Promise<any> {
    let res = await this.db.executeRef('present_toolbar_user_ask_for_join', query, this.schema);
    if (res.success) {
      try {



        const cPresentStatus = await this.presentStatus(query.nPresentid);
        if (cPresentStatus == 'L') {

          this.utility.emit({
            event: 'ASK-REQ',
            data: {
              nPresentid: query.nPresentid,
              nAskby: query.nMasterid,
              nUserid: res.data[0][0].nUserid
            }
          } as presentEvents, this.presentationTools)

        }

      } catch (error) {
      }
      return res.data[0];
    } else {
      return [];
    }
  }





  async userJoined(query: joinRequestReq): Promise<any> {
    try {
      let res = await this.db.executeRef('present_toolbar_user_joined', query, this.schema);
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1 };
      }
    } catch (error) {
      return { msg: -1, error };
    }
  }




  async getPresentDocPosition(query: presentDocPositionReq): Promise<any> {
    try {

      const res = JSON.parse(await this.rds.getValue(`PRESENT:${query.nPresentid}:POSITION:${query.nBundledetailid}`));
      if (res.nBundledetailid)
        return res;
    } catch (error) {
    }
    return {}
  }





  async manageDocs(query: persentManageDocReq): Promise<any> {
    let res = await this.db.executeRef('present_manage_documents', query, this.schema);
    if (res.success) {

      return res.data[0][0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }



  async updateHighlightColor(query: colorChangeHighlightReq): Promise<any> {
    let res = await this.db.executeRef('present_highlights_update_color', query, this.schema);
    if (res.success) {

      try {

        const cPresentStatus = await this.presentStatus(query.nPresentid);
        if (cPresentStatus == 'L') {

          this.utility.emit({
            event: 'PRESENT-HIGHLIGHT-COLOR-CHANGE',
            data: {
              nPresentid: query.nPresentid,
              uuid: query.uuid,
              cColor: query.cColor,
              nAId: res.data[0][0]["nAId"]
            }
          } as presentEvents, this.presentHighlights)

        }

      } catch (error) {
        console.error(error);
      }
      return res.data[0][0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }



  async presentStatus(nPresentid: string): Promise<presentStatus> {
    try {
      const status: presentStatus = await this.rds.getValue(`PRESENT:${nPresentid}:STATUS`);
      if (!status) {
        const res = await this.db.executeRef('present_status', { nPresentid }, this.schema);
        if (res.success) {
          const status = res.data[0][0]["cStatus"];
          this.rds.setValue(`PRESENT:${nPresentid}:STATUS`, status, 24 * 3600);
          return status;
        }
      }
      return status;
    } catch (error) {
      console.error(error);
    }
    return null;
  }


  async getOnlineUsers(query: onlineUserReq): Promise<any> {
    try {
      const users = await this.rds.getAllUserIds(query.nPresentid) || [];

      return { msg: 1, users: users.filter(a => a != query.nMasterid) };
    } catch (error) {
      console.error(error);
    }

    return { msg: -1 };
  }







  async shareLinks(query: shareLinkReq): Promise<any> {
    let res = await this.db.executeRef('present_link_share', query, this.schema);
    if (res.success) {

      try {



        const cPresentStatus = await this.presentStatus(query.nPresentid);
        if (cPresentStatus == 'L') {

          this.utility.emit({
            event: 'PRESENT-LINK-SHARED',
            data: {
              nPresentid: query.nPresentid,
              cPermission: query.cPermission,
              nBundledetailid: query.nBundledetailid,
              nAId: query.nAId,
              annot: res.data[0][0] || {}
            }
          } as presentEvents, this.presentHighlights)

        }

      } catch (error) {
        console.error(error);
      }

      return { msg: 1 };
    } else {
      return { msg: -1, error: res?.error };
    }
  }

  async getSharedLinksList(query: getShareLinkListReq): Promise<any> {
    let res = await this.db.executeRef('present_highlights_shared', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }


  async getShareByPresenterLinks(query: getShareLinkListByPresenterReq): Promise<any> {
    query["ref"] = 2;
    let res = await this.db.executeRef('present_shared_link', query, this.schema);
    if (res.success) {
      return res.data;
    } else {
      return [];
    }
  }




  async getRemarkList(query: any): Promise<any> {
    let res = await this.db.executeRef('present_remark_list', query, this.schema);
    if (res.success) {
      return res.data[0];
    } else {
      return [];
    }
  }



  async insertRemark(query: remarksInsertReq): Promise<any> {
    let res = await this.db.executeRef('present_remark_insert', query, this.schema);
    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, error: res?.error };
    }
  }


  async getRunningScreeShare(query: getRunningScreenShareReq): Promise<any> {
    try {
      const value = JSON.parse(await this.rds.getValue(`PRESENT:${query.nPresentid}:SCREEN:SHARE`));
      if (value?.nPresentid) {
        return { msg: 1 }
      }
      return { msg: -1 }
    } catch (error) {
      return { msg: -1, error }
    }
  }


  async getPresentDetailOnRefresh(query: getPresentDetailReq): Promise<any> {
    debugger;
    try {

      const rows = await this.db.rowQuery(`select * from ${this.schema}."PresentationMaster" where "nPresentid" = '${query.nPresentid}' and "nCreateid" = '${query.nMasterid}'`, []);
      try {
        if (rows?.data?.length) {
          await this.rds.deleteValue(`PRESENT:${query.nPresentid}:COMPARE`);
          await this.rds.deleteValue(`PRESENT:${query.nPresentid}:COMPARE:DATA`);
        }
      } catch (error) {
      }
      const file = await this.rds.getValue(`PRESENT:${query.nPresentid}:TAB`);
      const compareState = await this.rds.getValue(`PRESENT:${query.nPresentid}:COMPARE`);
      const compareData = await this.rds.getValue(`PRESENT:${query.nPresentid}:COMPARE:DATA`);
      const status = await this.rds.getValue(`PRESENT:${query.nPresentid}:STATUS`);

      return {
        msg: 1,
        file: file ? JSON.parse(file) : null,
        compareState: compareState ? JSON.parse(compareState) : null,
        compareData: compareData ? JSON.parse(compareData) : null,
        status: status ? status : null
      }
    } catch (error) {
      console.log(error)
      return { msg: -1, error }
    }
  }


  async unsaveHighlights(query: unsaveHighlightsReq): Promise<any> {
    try {
      let res = await this.db.executeRef('present_unsave_highlights', query, this.schema);
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1 };
      }
    } catch (error) {

      return { msg: -1 };
    }
  }


  async getTurnConfig(): Promise<any> {
    try {
      console.log('Getting config')
      let res = await this.db.rowQuery('select 1 as msg,"jOther" as "config"	From "Codemaster" c where "nCategoryid" = 21');
      console.log('result', res)
      if (res.success) {
        return res.data[0];
      } else {
        return { msg: -1 };
      }
    } catch (error) {

      return { msg: -1 };
    }
  }


}