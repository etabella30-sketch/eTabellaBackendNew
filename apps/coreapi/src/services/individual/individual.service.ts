import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { DocinfoReq, DocinfoRes, fetchTabDataReq, getTabReq, hyperlinkFileReq, linkexplorerReq, locationShareToUsers, toolbarDataReq, updateBundleDetailRotation, updateShareLink } from '../../interfaces/individual.interface';
import { UtilityService } from '../utility/utility.service';
// import { OpenFgaService } from '@app/global/open-fga/open-fga.service';

@Injectable()
export class IndividualService {

    constructor(private db: DbService, private utility: UtilityService
        // , private readonly openFGA: OpenFgaService
    ) {

    }


    async getTabData(query: fetchTabDataReq): Promise<any> {
        let res = await this.db.executeRef('individual_tabs', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getTab(query: getTabReq): Promise<any> {
        let res = await this.db.executeRef('individual_prenext_id', query);
        if (res.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getDocinfo(query: DocinfoReq): Promise<DocinfoRes> {
        let res = await this.db.executeRef('individual_doc_info', query);
        if (res.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getglobalannotas(query: DocinfoReq): Promise<DocinfoRes> {
        let res = await this.db.executeRef('individual_annotations_global', query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async updateRotation(body: updateBundleDetailRotation): Promise<any> {
        let res = await this.db.executeRef('individual_update_rotation', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }




    async getLinks(query: linkexplorerReq, fn: string): Promise<any> {
        let res = await this.db.executeRef(fn, query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async updateShareLink(body: updateShareLink): Promise<any> {
        let res = await this.db.executeRef('share_links', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || []
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            } catch (error) {
            }


            //   userTuples.push({
            //     user: userRef,
            //     relation: 'viewer',
            //     object: factRef,
            //   });

            //   if (user.bCanEdit) {
            //     userTuples.push({
            //       user: userRef,
            //       relation: 'editor',
            //       object: factRef,
            //     });
            //   }

            //   if (user.bCanReshare) {
            //     userTuples.push({
            //       user: userRef,
            //       relation: 'sharer',
            //       object: factRef,
            //     });
            //   }

            //   if (user.bCanComment) {
            //     userTuples.push({
            //       user: userRef,
            //       relation: 'commentor',
            //       object: factRef,
            //     });
            //   }

            //   await this.openFGA.writeTuplesSafe(userTuples);

            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async locationshareSharetousers(body: locationShareToUsers): Promise<any> {
        let res = await this.db.executeRef('location_share', body);
        if (res.success) {
            // return res.data[0];
            try {
                const notificationlist = res.data[0][0]["jNotify"] || []
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            } catch (error) {
            }

            try {
                return { msg: 1, value: '   Doc inserted successfully', nDocid: res.data[0][0].nDocid };
            } catch (error) {

            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }






    async getSharesUsers(query: linkexplorerReq): Promise<any> {
        let res = await this.db.executeRef('location_shared_users', query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getHyperLinkFiles(query: hyperlinkFileReq): Promise<any> {
        let res = await this.db.executeRef('hyperlink_getdocument', query);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getToolbarData(query: toolbarDataReq): Promise<any> {
        let res = await this.db.executeRef('toolbar_doc_info', query);
        if (res.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

}
