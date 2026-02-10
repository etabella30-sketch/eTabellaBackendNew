import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { BundleDetailReq, BundleDetailRes, BundleLinksReq, BundleLinksRes, BundleReq, BundleRes, BundleUploadReq, BundlesPermissionReq, BundlesPermissionRes, BundletabReq, BundletabRes, BundletagReq, BundletagRes, FileLinkReq, SectionReq, SectionRes, TeamUsersReq, TeamUsersRes, bundleTypesReq, bundleTypesRes, checkIssuetagReq, deleteRecentReq, deleteRecentRes, displayReq, filedataReq, filedataRes, pagginationReq, pagginationRes, recentFileReq, recentFileRes, shareSectionbundleReq, getbundleSharedReq, shareUserbundleReq, displayFilesReq, getFileids, getFiletypes, insertRecentReq, insertRecentRes, } from '../../interfaces/bundle.interface';
import { BundleBuildReq, BundleBuildRes, DeleteBundlesReq, DeleteBundlesRes, downloadChangeSerialReq, downloadSFileReq, downloadSFileRes, FileRenameReq, FileRenameRes, PasteBundlesReq, PasteBundlesRes, PermissionReq, PermissionRes, SectionBuildReq, SectionBuildRes, UndoBundlesReq, UndoBundlesRes, updateBundleDetailReq, updateBundleDetailRes, updateBundleReq, updateBundleRes, updateTabReq, UserSectionBuildReq, } from '../../interfaces/bundle.management';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LogService } from '@app/global/utility/log/log.service';
import { UtilityService } from '../utility/utility.service';
import { linkexplorerReq } from '../../interfaces/individual.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

@Injectable()
export class BundleCreationService {

    constructor(private db: DbService,
        @InjectQueue('delete-files') private deleteFileQueue: Queue,
        @InjectQueue('copy-files') private copyFileQueue: Queue, private readonly logService: LogService,
        private utility: UtilityService,
    ) {

    }


    async getSections(body: SectionReq): Promise<SectionRes> {
        let res = await this.db.executeRef('admin_sections', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

  
    async getBundle(body: BundleReq): Promise<BundleRes> {
        let res;
        if (body.jElasticBundles) {
            res = await this.db.executeRef('bundles', body,'elastic');
        } else {
            res = await this.db.executeRef('bundles', body);
        }
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getBundledetail(body: BundleDetailReq): Promise<BundleDetailRes> {
        let res = await this.db.executeRef('bundledetail', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getBundleLinks(body: BundleLinksReq): Promise<BundleLinksRes> {
        let res = await this.db.executeRef('bundle_links', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getSearchedBundles(body: bundleTypesReq): Promise<any> {
        let res = await this.db.executeRef('admin_searched_bundles', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getBundledetailSearched(body: BundleDetailReq): Promise<BundleDetailRes> {
        let res = await this.db.executeRef('bundledetail_search', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getTeamsUsers(body: TeamUsersReq): Promise<TeamUsersRes> {
        let res = await this.db.executeRef('teams_users', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getBunlesPermissions(body: BundlesPermissionReq): Promise<BundlesPermissionRes> {
        let res = await this.db.executeRef('bundles_permissions', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getBundleTypes(body: bundleTypesReq): Promise<bundleTypesRes> {
        let res = await this.db.executeRef('admin_bundles_filetypes', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getPaggination(body: pagginationReq): Promise<pagginationRes> {
        let res = await this.db.executeRef('admin_bundles_pagination_data', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async sectionBuilder(body: SectionBuildReq): Promise<SectionBuildRes> {
        let res = await this.db.executeRef('sectionbuilder', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }



    async bundleBuilder(body: BundleBuildReq): Promise<BundleBuildRes> {
        let res = await this.db.executeRef('bundlebuilder', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async fileRename(body: FileRenameReq): Promise<FileRenameRes> {
        let res = await this.db.executeRef('rename_bundledetail', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async setPermission(body: PermissionReq): Promise<PermissionRes> {
        let res = await this.db.executeRef('update_bundles_permisssoins', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async deleteBundles(body: DeleteBundlesReq): Promise<DeleteBundlesRes> {
        debugger;
        let res = await this.db.executeRef('delete_bundles', body);
        if (res.success) {
            const files = res.data[0][0]["jDelfiles"] || [];
            this.sendNotification(body.nMasterid, body.nCaseid, true, 0)
            if (files.length) {
                await this.deleteFileQueue.add({ jFiles: files }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
            }

            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async copyBundles(body: PasteBundlesReq): Promise<PasteBundlesRes> {
        let res = await this.db.executeRef('copy_bundles', body)
        if (res.success) {
            console.log('Background task completed successfully');
            try {
                const files = res.data[0][0]["jCopyFiles"] || [];
                if (files.length) {
                    this.copyFileQueue.add({ jFiles: files }, { removeOnComplete: true, removeOnFail: false, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }).then(e => {
                        console.log('copy added successfully');
                    }).catch((e) => {
                        console.error('error copy file', e);
                    }); //
                } else {
                    console.log('No files to copy');
                }
            } catch (error) {
                console.error('error copy file 2 ', error);
            }

            return { msg: 1, value: 'File paste is processing', data: res.data[0][0] };
        } else {
            console.error('Background task failed', res.error);
            return { msg: -1, value: 'File paste is failed' };
        };
    }

    async cutBundles(body: PasteBundlesReq): Promise<PasteBundlesRes> {
        let res = await this.db.executeRef('cut_bundles', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to paste', error: res.error }
        }
    }


    async undoBundles(body: UndoBundlesReq): Promise<UndoBundlesRes> {
        let res = await this.db.executeRef('undo_bundles', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to paste', error: res.error }
        }
    }

    async updateBundleDetail(body: updateBundleDetailReq): Promise<updateBundleDetailRes> {
        let res = await this.db.executeRef('admin_update_bundledetail', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async updateBundleTag(body: updateBundleReq): Promise<updateBundleRes> {
        let res = await this.db.executeRef('admin_update_bundle_tag', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async updateFileTab(body: updateTabReq): Promise<updateBundleRes> {
        let res = await this.db.executeRef('admin_update_bundle_tab', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async getFiledata(body: filedataReq): Promise<filedataRes> {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getRecentFile(body: recentFileReq): Promise<recentFileRes> {
        let res = await this.db.executeRef('recent_files', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async clearRecent(body: deleteRecentReq): Promise<deleteRecentRes> {
        let res = await this.db.executeRef('clearrecent', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getBundletag(body: BundletagReq): Promise<BundletagRes> {
        let res = await this.db.executeRef('navigate_bundletags', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getBundletab(body: BundletabReq): Promise<BundletabRes> {
        let res = await this.db.executeRef('navigate_bundletabs', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getUserSections(body: SectionReq): Promise<SectionRes> {
        body["ref"] = 2;
        let res = await this.db.executeRef('user_sections', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getUploadSections(body: SectionReq): Promise<SectionRes> {
        body["ref"] = 2;
        let res = await this.db.executeRef('upload_sections', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async userSectionBuilder(body: UserSectionBuildReq): Promise<SectionBuildRes> {
        let res = await this.db.executeRef('user_sectionbuilder', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async checkissuetag(body: checkIssuetagReq): Promise<any> {
        let res = await this.db.executeRef('bundle_is_issuetag', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getdisplaycontact(body: displayReq): Promise<any> {
        let res = await this.db.executeRef('displaycontact', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getdisplaytags(body: displayReq): Promise<any> {
        let res = await this.db.executeRef('displaytag', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getdisplayissue(body: displayReq): Promise<any> {
        let res = await this.db.executeRef('displayissue', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getdisplayfiles(body: displayFilesReq): Promise<any> {
        let res = await this.db.executeRef('displayfiles', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getfilelinks(body: FileLinkReq): Promise<any> {
        body["ref"] = 2;
        let res = await this.db.executeRef('get_bundle_links', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getBundleparentIds(body: BundleUploadReq): Promise<any> {
        let res = await this.db.executeRef('bundle_parentids', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async sendNotification(nMasterid: any, nCaseid: any, status: boolean, nBundledetailid?: number) {
        if (!nCaseid) return;
        this.logService.info(`Notification send for ${nCaseid}`, `coreapi/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `File/folder deleted ${status ? 'successful' : 'failed'} `;
                    a.cMsg = `File/folder deleted ${status ? 'successful' : 'failed'} | Case no. ${a.cCaseno}`;
                    a.nRefuserid = nMasterid;
                    this.utility.emit(a, `notification`);
                })
            }
        } catch (error) {
            console.log(error);
        }
    }


    async getUploadUser(nCaseid: number): Promise<any[]> {
        try {
            let res = await this.db.executeRef('notifications_caseusers', { nCaseid: nCaseid })
            if (res.success) {
                return res.data[0];
            } else {
                return [];
            };
        } catch (error) {
        }
    }

    async getSharesUsers(body: linkexplorerReq): Promise<any[]> {
        let res = await this.db.executeRef('location_shared_user_from', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }]
        }
    }



    async share_sectionbundle(body: shareSectionbundleReq): Promise<any> {
        let res = await this.db.executeRef('share_sectionbundle', body);
        if (res.success) {
            try {
                let users = res.data[0]
                if (users?.length) {
                    users.forEach(a => {
                        let data = {
                            nUserid: res.data[0][0]['nUserid'], nCaseid: res.data[0][0]['nCaseid'], cTitle: res.data[0][0]['cTitle'], cToken: res.data[0][0]['cToken'], cMsg: res.data[0][0]['cMsg'],
                            nRefuserid: body.nMasterid, cType: 'CS'
                        };
                        this.utility.emit(data, `notification`);
                    })
                }
            } catch (error) {

            }
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getBundleSharesUsers(body: getbundleSharedReq): Promise<any[]> {
        let res = await this.db.executeRef('share_get_bundleusers', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }]
        }
    }


    async getSharesUsers_by_bundle(body: shareUserbundleReq): Promise<any[]> {
        let res = await this.db.executeRef('share_users_by_bid', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }]
        }
    }


    async getBundleShares(body: getbundleSharedReq): Promise<any[]> {
        let res = await this.db.executeRef('share_get_bundles', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }]
        }
    }

    async get_fileids(body: getFileids): Promise<any[]> {
        let res = await this.db.executeRef('get_fileids', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }]
        }
    }

    async get_filetypes(body: getFiletypes): Promise<any[]> {
        let res = await this.db.executeRef('get_filetypes', body);
        if (res.success) {
            return res.data[0];
        } else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }]
        }
    }



    async downloadS_files(body: downloadSFileReq): Promise<downloadSFileRes[]> {
        let res = await this.db.executeRef('download_selected_files', body);
        if (res.success) {
            return res.data[0];
        } else {
            return []
        }
    }

    async downloadChangeSerial(body: downloadChangeSerialReq): Promise<any> {
        let res = await this.db.executeRef('download_update_serial', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1 }
        }
    }


    async insertRecent(body: insertRecentReq): Promise<insertRecentRes> {
        let res = await this.db.executeRef('insert_recent_file', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }
}
