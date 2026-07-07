import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { BundleDetailReq, BundleDetailRes, BundleLinksReq, BundleLinksRes, BundleReq, BundleRes, BundleSearchReq, BundleSearchRes, BundleIndexReq, BundleUploadReq, BundlesPermissionReq, BundlesPermissionRes, BundletabReq, BundletabRes, BundletagReq, BundletagRes, FileLinkReq, SectionReq, SectionRes, TeamUsersReq, TeamUsersRes, bundleTypesReq, bundleTypesRes, checkIssuetagReq, deleteRecentReq, deleteRecentRes, displayReq, filedataReq, filedataRes, pagginationReq, pagginationRes, recentFileReq, recentFileRes, shareSectionbundleReq, getbundleSharedReq, shareUserbundleReq, displayFilesReq, getFileids, getFiletypes, insertRecentReq, insertRecentRes, } from '../../interfaces/bundle.interface';
import { BundleBuildReq, BundleBuildRes, DeleteBundlesReq, DeleteBundlesRes, downloadChangeSerialReq, downloadSFileReq, downloadSFileRes, FileRenameReq, FileRenameRes, PasteBundlesReq, PasteBundlesRes, PermissionReq, PermissionRes, SectionBuildReq, SectionBuildRes, UndoBundlesReq, UndoBundlesRes, updateBundleDetailReq, updateBundleDetailRes, updateBundleReq, updateBundleRes, updateTabReq, UserSectionBuildReq, } from '../../interfaces/bundle.management';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LogService } from '@app/global/utility/log/log.service';
import { UtilityService } from '../utility/utility.service';
import { linkexplorerReq } from '../../interfaces/individual.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { SavedSearchDeleteReq, SavedSearchListReq, SavedSearchSaveReq, SavedSearchRes } from '../../interfaces/savedsearch.interface';

@Injectable()
export class BundleCreationService {

    /**
     * Sidebar render order by `cFoldertype` code. Backend controls the layout
     * via this single source of truth — frontend trusts whatever order comes
     * back. Codes match the real values in `SectionMaster.cFoldertype`.
     * Unknown types sort to the end.
     */
    private readonly SECTION_TYPE_ORDER: Readonly<Record<string, number>> = {
        MB: 0, // Master Bundle
        CB: 1, // Private Bundle (production label for cFoldertype='CB')
        CO: 2, // Core Assigned
        TS: 3, // Transcript
        M:  4, // Generic / My Folders
        TF: 5, // Team Folders
        CF: 6, // User Files
    };

    constructor(private db: DbService,
        @InjectQueue('delete-files') private deleteFileQueue: Queue,
        @InjectQueue('copy-files') private copyFileQueue: Queue, private readonly logService: LogService,
        private utility: UtilityService,
    ) {

    }


    async getSections(body: SectionReq): Promise<SectionRes> {
        let res = await this.db.executeRef('admin_sections', body);
        if (res.success) {
            const rows: any[] = res.data[0] ?? [];
            const orderOf = (t: any) => {
                const code = String(t ?? '').toUpperCase();
                return code in this.SECTION_TYPE_ORDER ? this.SECTION_TYPE_ORDER[code] : 999;
            };
            rows.sort((a, b) => orderOf(a?.cFoldertype) - orderOf(b?.cFoldertype));
            return rows as any;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getBundle(body: BundleReq): Promise<BundleRes> {
        const res = body.jElasticBundles
            ? await this.db.executeRef('bundles', body, 'elastic')
            : await this.db.executeRef('bundles', body);
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

    /** List the current user's saved searches for a case (newest first). */
    async listSavedSearches(body: SavedSearchListReq): Promise<SavedSearchRes[]> {
        const res = await this.db.executeRef('savedsearch_list', body);
        return res.success ? (res.data[0] ?? []) : [];
    }

    /** Create or update (upsert) a saved search; returns the saved row. */
    async saveSearch(body: SavedSearchSaveReq): Promise<SavedSearchRes> {
        const res = await this.db.executeRef('savedsearch_save', body);
        if (res.success) return res.data[0]?.[0] ?? { msg: 1 };
        return { msg: -1, value: 'Failed to save', error: res.error };
    }

    /** Soft-delete a saved search the user owns. */
    async deleteSavedSearch(body: SavedSearchDeleteReq): Promise<SavedSearchRes> {
        const res = await this.db.executeRef('savedsearch_delete', body);
        if (res.success) return res.data[0]?.[0] ?? { msg: 1 };
        return { msg: -1, value: 'Failed to delete', error: res.error };
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


    /**
     * Fast folder (bundle) name/tag search across all depths — powers the
     * Evidence sidebar "Search folders" box. Returns the matched sub-forest
     * (each match + its ancestors) from `public.et_bundle_search`.
     */
    async getFolderSearch(body: BundleSearchReq): Promise<BundleSearchRes[]> {
        let res = await this.db.executeRef('bundle_search', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error } as any
        }
    }

    /**
     * Dynamic section index — every document in a section with its assigned tab
     * reference, tab-ordered + permission-gated, from `public.et_bundle_index`.
     * Paginated (perPage) for large sections. Powers the live HTML Master Index.
     */
    async getBundleIndex(body: BundleIndexReq): Promise<any[]> {
        let res = await this.db.executeRef('bundle_index', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error } as any
        }
    }


    async getBundledetailSearched(body: BundleDetailReq): Promise<BundleDetailRes> {
        let res = await this.db.executeRef('bundledetail_search', this.withSearchBundleScope(body));
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    /**
     * `et_bundledetail_search` only applies bundle scoping when `jFilter` carries
     * `cLocation = 'T'` plus `nBundleid`. The REST API has long exposed a
     * top-level `nBundleid`, so mirror that into `jFilter` for search requests.
     * Without this, field-scoped searches can return a section-wide total while
     * the UI is scoped to the current folder, producing "7 results / 0 rows".
     */
    private withSearchBundleScope(body: BundleDetailReq): BundleDetailReq {
        if (!body?.nBundleid) return body;

        let filter: Record<string, unknown> = {};
        if (body.jFilter) {
            try {
                const parsed = typeof body.jFilter === 'string' ? JSON.parse(body.jFilter) : body.jFilter;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) filter = parsed as Record<string, unknown>;
            } catch {
                filter = {};
            }
        }

        if (filter['cLocation'] || filter['nBundleid']) return body;

        return {
            ...body,
            jFilter: JSON.stringify({
                ...filter,
                cLocation: 'T',
                nBundleid: body.nBundleid,
            }),
        };
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
        // IDOR gate — see scratchpad et_can_access_filedata.sql. Flag-gated for a
        // safe rollout: deploy the et_can_access_filedata SP first, then set
        // DOC_ACCESS_GUARD_ENABLED=true. Until then this is a no-op (existing
        // behaviour). nMasterid is injected from the JWT by JwtMiddleware.
        if (process.env.DOC_ACCESS_GUARD_ENABLED === 'true') {
            const gate = await this.db.executeRef('can_access_filedata', {
                nMasterid: (body as any).nMasterid,
                nBundledetailid: body.nBundledetailid,
            });
            const row = gate?.data?.[0];
            const allowed = !!gate?.success && (row?.allowed === true || row?.[0]?.allowed === true);
            if (!allowed) {
                return { msg: -1, value: 'You do not have access to this document.' };
            }
        }
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
        const requests = this.expandShareSectionBundleRequests(body);
        let firstResponse: any = null;

        for (let index = 0; index < requests.length; index++) {
            const req = requests[index];
            const res = await this.executeShareSectionBundle(req);
            if (!this.isShareSectionBundleSuccess(res)) return res;

            const reconcile = await this.reconcileShareSectionBundleRecipients(req);
            if (!reconcile.success) {
                return { msg: -1, value: 'Failed to fetch', error: reconcile.error };
            }

            firstResponse ??= res;
        }

        return firstResponse ?? { msg: 1, value: 'Shared successfully' };
    }

    private async executeShareSectionBundle(body: shareSectionbundleReq): Promise<any> {
        if (this.shouldUseDirectFileShare(body)) {
            return await this.executeDirectFileShare(body);
        }

        let res = await this.db.executeRef('share_sectionbundle', body);
        if (res.success) {
            this.emitShareNotifications(res.data[0], body);
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    private shouldUseDirectFileShare(body: shareSectionbundleReq): boolean {
        return !!body?.bIsannotation && !!this.nullableUuid(body?.nBundledetailid);
    }

    private async executeDirectFileShare(body: shareSectionbundleReq): Promise<any> {
        const nSectionid = this.nullableUuid(body?.nSectionid);
        const nBundleid = this.nullableUuid(body?.nBundleid);
        const nBundledetailid = this.nullableUuid(body?.nBundledetailid);
        const nMasterid = this.nullableUuid(body?.nMasterid);
        if (!nSectionid || !nBundledetailid || !nMasterid) {
            return { msg: -1, value: 'Failed to fetch', error: 'Missing file share target' };
        }

        const users = this.shareUserIds(body);
        const sql = `
WITH target_users AS (
    SELECT DISTINCT unnest($5::uuid[]) AS "nUserid"
),
inserted_share AS (
    INSERT INTO "BDShare" ("nSectionid", "nBundleid", "nBundledetailid", "nUserid", "nMasterid", "bIsannotation")
    SELECT $1::uuid, $2::uuid, $3::uuid, tu."nUserid", $4::uuid, $6::boolean
    FROM target_users tu
    WHERE NOT EXISTS (
        SELECT 1
        FROM "BDShare" bs
        WHERE bs."nSectionid" = $1::uuid
          AND bs."nBundleid" IS NOT DISTINCT FROM $2::uuid
          AND bs."nBundledetailid" = $3::uuid
          AND bs."nUserid" = tu."nUserid"
          AND bs."nMasterid" = $4::uuid
    )
    RETURNING "nUserid"
),
updated_share AS (
    UPDATE "BDShare" bs
       SET "bIsannotation" = $6::boolean,
           "dUpdateDt" = now()
    FROM target_users tu
    WHERE bs."nSectionid" = $1::uuid
      AND bs."nBundleid" IS NOT DISTINCT FROM $2::uuid
      AND bs."nBundledetailid" = $3::uuid
      AND bs."nUserid" = tu."nUserid"
      AND bs."nMasterid" = $4::uuid
      AND bs."bIsannotation" IS DISTINCT FROM $6::boolean
    RETURNING bs."nUserid"
),
inserted_fact_shares AS (
    INSERT INTO "FMShared" ("nFSid", "nUserid")
    SELECT fm."nFSid", tu."nUserid"
    FROM "FactMaster" fm
    CROSS JOIN target_users tu
    WHERE $6::boolean
      AND fm."nBundledetailid" = $3::uuid
      AND fm."nUserid" = $4::uuid
    ON CONFLICT ("nFSid", "nUserid") DO NOTHING
    RETURNING "nUserid"
),
inserted_doc_shares AS (
    INSERT INTO "DMShared" ("nDocid", "nUserid")
    SELECT dm."nDocid", tu."nUserid"
    FROM "DocMaster" dm
    CROSS JOIN target_users tu
    WHERE $6::boolean
      AND dm."nBundledetailid" = $3::uuid
      AND dm."nUserid" = $4::uuid
      AND NOT EXISTS (
          SELECT 1
          FROM "DMShared" dms
          WHERE dms."nDocid" = dm."nDocid"
            AND dms."nUserid" = tu."nUserid"
      )
    RETURNING "nUserid"
),
owner_name AS (
    SELECT "cFname" || ' ' || COALESCE("cLname", '') AS username
    FROM "UserMaster"
    WHERE "nUserid" = $4::uuid
)
SELECT DISTINCT
    1 AS msg,
    'Shared successfully' AS value,
    $7::boolean AS "bIsalert",
    u."nUserid",
    c."nCaseid",
    'Shared ' || sh."cFolder" AS "cTitle",
    u."cToken",
    COALESCE(o.username, 'A teammate') || ' Shared ' || COALESCE(bd."cFilename", 'a document') || ' With you | Case no. ' || c."cCaseno" AS "cMsg"
FROM target_users tu
JOIN "SectionMaster" sh ON sh."nSectionid" = $1::uuid
JOIN "CaseMaster" c ON c."nCaseid" = sh."nCaseid"
JOIN "UserMaster" u ON u."nUserid" = tu."nUserid"
LEFT JOIN "BundleDetail" bd ON bd."nSectionid" = sh."nSectionid" AND bd."nBundledetailid" = $3::uuid
LEFT JOIN owner_name o ON TRUE
WHERE $7::boolean;
`;

        const res = await this.db.rowQuery(sql, [
            nSectionid,
            nBundleid,
            nBundledetailid,
            nMasterid,
            users,
            !!body?.bIsannotation,
            !!body?.bIsalert,
        ]);

        if (!res.success) return { msg: -1, value: 'Failed to fetch', error: res.error };
        this.emitShareNotifications(res.data, body);
        return res.data?.[0] ?? { msg: 1, value: 'Shared successfully', bIsalert: !!body?.bIsalert };
    }

    private emitShareNotifications(users: any[] | undefined, body: shareSectionbundleReq): void {
        try {
            if (users?.length) {
                users.forEach(a => {
                    let data = {
                        nUserid: a['nUserid'], nCaseid: a['nCaseid'], cTitle: a['cTitle'], cToken: a['cToken'], cMsg: a['cMsg'],
                        nRefuserid: body.nMasterid, cType: 'CS'
                    };
                    this.utility.emit(data, `notification`);
                })
            }
        } catch (error) {

        }
    }

    private expandShareSectionBundleRequests(body: shareSectionbundleReq): shareSectionbundleReq[] {
        const items = this.shareSectionBundleItems(body);
        return items.map((item, index) => ({
            ...body,
            nBundleid: item.nBundleid,
            nBundledetailid: item.nBundledetailid,
            jShareids: [],
            // Bulk expansion would otherwise send one notification per selected row.
            bIsalert: index === 0 ? body.bIsalert : false,
        }));
    }

    private shareSectionBundleItems(body: shareSectionbundleReq): { nBundleid: string | null; nBundledetailid: string | null }[] {
        const shareids = Array.isArray(body?.jShareids) ? body.jShareids : [];
        if (shareids.length) {
            return shareids
                .map(item => {
                    if (Array.isArray(item)) {
                        return {
                            nBundleid: this.nullableUuid(item[0]),
                            nBundledetailid: this.nullableUuid(item[1]),
                        };
                    }
                    return {
                        nBundleid: this.nullableUuid(item?.nBundleid),
                        nBundledetailid: this.nullableUuid(item?.nBundledetailid),
                    };
                })
                .filter(item => item.nBundleid || item.nBundledetailid);
        }

        return [{
            nBundleid: this.nullableUuid(body?.nBundleid),
            nBundledetailid: this.nullableUuid(body?.nBundledetailid),
        }];
    }

    private nullableUuid(value: unknown): string | null {
        const text = String(value ?? '').trim();
        if (!text || text === '0' || text === '00000000-0000-0000-0000-000000000000') return null;
        return text;
    }

    private shareUserIds(body: shareSectionbundleReq): string[] {
        if (Array.isArray(body?.jUsers)) return body.jUsers.map(id => String(id)).filter(Boolean);
        if (typeof body?.jUsers === 'string') {
            try {
                const parsed = JSON.parse(body.jUsers);
                return Array.isArray(parsed) ? parsed.map(id => String(id)).filter(Boolean) : [];
            } catch {
                return [];
            }
        }
        return [];
    }

    private isShareSectionBundleSuccess(res: any): boolean {
        return res?.msg === 1 || res?.msg === undefined;
    }

    private async reconcileShareSectionBundleRecipients(body: shareSectionbundleReq): Promise<{ success: boolean; error?: unknown }> {
        const nSectionid = this.nullableUuid(body?.nSectionid);
        const nMasterid = this.nullableUuid(body?.nMasterid);
        if (!nSectionid || !nMasterid) return { success: true };

        const nBundleid = this.nullableUuid(body?.nBundleid);
        const nBundledetailid = this.nullableUuid(body?.nBundledetailid);
        const selectedUsers = this.shareUserIds(body);

        const sql = `
WITH RECURSIVE target_bundles AS (
    SELECT $3::uuid AS "nBundleid"
    WHERE $3::uuid IS NOT NULL

    UNION ALL

    SELECT bm."nBundleid"
    FROM "BundleMaster" bm
    JOIN target_bundles tb ON bm."nParentBundleid" = tb."nBundleid"
    WHERE bm."nSectionid" = $1::uuid
),
target_details AS (
    SELECT $4::uuid AS "nBundledetailid"
    WHERE $4::uuid IS NOT NULL

    UNION

    SELECT ba."nBundledetailid"
    FROM "BDAssignment" ba
    WHERE $4::uuid IS NULL
      AND ba."nSectionid" = $1::uuid
      AND ba."nBundledetailid" IS NOT NULL
      AND (
          $3::uuid IS NULL
          OR ba."nBundleid" IN (SELECT "nBundleid" FROM target_bundles)
      )
),
removed_users AS (
    SELECT DISTINCT bs."nUserid"
    FROM "BDShare" bs
    WHERE bs."nSectionid" = $1::uuid
      AND bs."nMasterid" = $2::uuid
      AND NOT (bs."nUserid" = ANY($5::uuid[]))
      AND (
          ($3::uuid IS NULL AND $4::uuid IS NULL)
          OR ($4::uuid IS NOT NULL AND bs."nBundledetailid" = $4::uuid AND bs."nBundleid" IS NOT DISTINCT FROM $3::uuid)
          OR ($4::uuid IS NULL AND $3::uuid IS NOT NULL AND bs."nBundleid" IN (SELECT "nBundleid" FROM target_bundles))
      )
),
deleted_bd AS (
    DELETE FROM "BDShare" bs
    USING removed_users ru
    WHERE bs."nSectionid" = $1::uuid
      AND bs."nMasterid" = $2::uuid
      AND bs."nUserid" = ru."nUserid"
      AND (
          ($3::uuid IS NULL AND $4::uuid IS NULL)
          OR ($4::uuid IS NOT NULL AND bs."nBundledetailid" = $4::uuid AND bs."nBundleid" IS NOT DISTINCT FROM $3::uuid)
          OR ($4::uuid IS NULL AND $3::uuid IS NOT NULL AND bs."nBundleid" IN (SELECT "nBundleid" FROM target_bundles))
      )
    RETURNING bs."nUserid"
),
deleted_fm AS (
    DELETE FROM "FMShared" fms
    USING "FactMaster" fm, removed_users ru
    WHERE fms."nFSid" = fm."nFSid"
      AND fms."nUserid" = ru."nUserid"
      AND fm."nUserid" = $2::uuid
      AND fm."nBundledetailid" IN (SELECT "nBundledetailid" FROM target_details)
    RETURNING 1
),
deleted_dm AS (
    DELETE FROM "DMShared" dms
    USING "DocMaster" dm, removed_users ru
    WHERE dms."nDocid" = dm."nDocid"
      AND dms."nUserid" = ru."nUserid"
      AND dm."nUserid" = $2::uuid
      AND dm."nBundledetailid" IN (SELECT "nBundledetailid" FROM target_details)
    RETURNING 1
)
SELECT
    (SELECT count(*) FROM deleted_bd)::int AS "removedShares",
    (SELECT count(*) FROM deleted_fm)::int AS "removedFactShares",
    (SELECT count(*) FROM deleted_dm)::int AS "removedDocShares";
`;

        return await this.db.rowQuery(sql, [nSectionid, nMasterid, nBundleid, nBundledetailid, selectedUsers]);
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

    async getOutgoingBundleShares(body: getbundleSharedReq): Promise<any[]> {
        if (!body?.nSectionid || !body?.nMasterid) return [];

        const sql = `
WITH RECURSIVE input AS (
    SELECT $1::uuid AS "nSectionid", $2::uuid AS "nMasterid"
),
case_scope AS (
    SELECT sm."nCaseid"
    FROM "SectionMaster" sm
    JOIN input i ON i."nSectionid" = sm."nSectionid"
),
share_rows AS (
    SELECT bs."nSectionid", bs."nBundleid", bs."nBundledetailid"
    FROM "BDShare" bs
    JOIN "SectionMaster" sm ON sm."nSectionid" = bs."nSectionid"
    JOIN case_scope cs ON cs."nCaseid" = sm."nCaseid"
    JOIN input i ON i."nMasterid" = bs."nMasterid"
    WHERE bs."nBundleid" IS NOT NULL
),
seed_bundles AS (
    SELECT DISTINCT "nSectionid", "nBundleid"
    FROM share_rows
),
bundle_tree AS (
    SELECT bm."nSectionid", bm."nBundleid", bm."nParentBundleid", bm."cBundlename", bm."cBundletag"
    FROM "BundleMaster" bm
    JOIN seed_bundles s ON s."nSectionid" = bm."nSectionid" AND s."nBundleid" = bm."nBundleid"

    UNION

    SELECT parent."nSectionid", parent."nBundleid", parent."nParentBundleid", parent."cBundlename", parent."cBundletag"
    FROM "BundleMaster" parent
    JOIN bundle_tree child ON child."nSectionid" = parent."nSectionid" AND child."nParentBundleid" = parent."nBundleid"
),
share_meta AS (
    SELECT
        sr."nSectionid",
        sr."nBundleid",
        bool_or(sr."nBundledetailid" IS NULL) AS "bWholeFolderShared",
        COALESCE(
            jsonb_agg(DISTINCT sr."nBundledetailid") FILTER (WHERE sr."nBundledetailid" IS NOT NULL),
            '[]'::jsonb
        ) AS "jSharedBundledetailids"
    FROM share_rows sr
    GROUP BY sr."nSectionid", sr."nBundleid"
)
SELECT
    row_number() OVER (
        ORDER BY
            bt."nSectionid",
            substring(bt."cBundletag", '\\D+'),
            substring(bt."cBundletag", '\\d+')::numeric,
            bt."cBundletag",
            substring(bt."cBundlename", '\\D+'),
            substring(bt."cBundlename", '\\d+')::numeric,
            bt."cBundlename"
    ) AS serial,
    bt."nBundleid",
    CASE WHEN bt."nParentBundleid" IS NULL THEN NULL ELSE bt."nParentBundleid" END AS "nParentBundleid",
    bt."cBundlename",
    bt."cBundletag",
    bt."nSectionid",
    i."nMasterid" AS "nSharedOwnerid",
    'me' AS "cSharedby",
    TRUE AS "bOutgoingShare",
    COALESCE(sm."bWholeFolderShared", FALSE) AS "bWholeFolderShared",
    COALESCE(sm."jSharedBundledetailids", '[]'::jsonb) AS "jSharedBundledetailids"
FROM bundle_tree bt
CROSS JOIN input i
LEFT JOIN share_meta sm ON sm."nSectionid" = bt."nSectionid" AND sm."nBundleid" = bt."nBundleid"
ORDER BY serial;
`;

        const res = await this.db.rowQuery(sql, [body.nSectionid, body.nMasterid]);
        if (res.success) {
            return res.data;
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
