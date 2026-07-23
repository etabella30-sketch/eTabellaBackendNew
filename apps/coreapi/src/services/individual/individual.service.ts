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
        const users = this.locationShareUserIds(body?.jUsers);
        if (!body?.nMasterid || users === null) {
            return { msg: -1, value: 'Failed ', error: 'Invalid document share recipients' };
        }

        const res = await this.db.executeRef('location_share', body);
        if (!res.success) {
            return { msg: -1, value: 'Failed ', error: res.error };
        }

        // Quick View used to write only LocationShare. Team Folders reads
        // BDShare, so the notification link worked while the recipient's
        // "Shared by ..." folder stayed empty. Keep the two views on one
        // recipient list: preserve annotation-enabled shares for users who stay
        // selected, add non-annotation rows for new Quick View recipients, and
        // revoke document access for recipients explicitly unselected here.
        const sync = await this.syncLocationShareToTeamFolders(body.nBundledetailid, body.nMasterid, users);
        const targetCount = Number(sync.data?.[0]?.targetCount ?? 0);
        if (!sync.success || targetCount !== 1) {
            return {
                msg: -1,
                value: 'Failed ',
                error: sync.error || 'Document is not attached to a shareable bundle',
            };
        }

        const first = res.data?.[0]?.[0] ?? {};
        const notificationlist = Array.isArray(first.jNotify) ? first.jNotify : [];
        if (notificationlist.length) {
            this.utility.sendNotification(notificationlist, body.nMasterid);
        }

        return { msg: 1, value: 'Doc shared successfully', nDocid: first.nDocid };
    }

    private async syncLocationShareToTeamFolders(
        nBundledetailid: string,
        nMasterid: string,
        users: string[],
    ): Promise<any> {
        const sql = `
WITH target AS (
    SELECT bd."nSectionid", bd."nBundleid", bd."nBundledetailid"
    FROM "BundleDetail" bd
    WHERE bd."nBundledetailid" = $1::uuid
      AND bd."nSectionid" IS NOT NULL
      AND bd."nBundleid" IS NOT NULL
    LIMIT 1
),
selected_users AS (
    SELECT DISTINCT unnest($3::uuid[]) AS "nUserid"
),
removed_share AS (
    DELETE FROM "BDShare" bs
    USING target t
    WHERE bs."nSectionid" = t."nSectionid"
      AND bs."nBundleid" IS NOT DISTINCT FROM t."nBundleid"
      AND bs."nBundledetailid" = t."nBundledetailid"
      AND bs."nMasterid" = $2::uuid
      AND NOT EXISTS (
          SELECT 1 FROM selected_users su WHERE su."nUserid" = bs."nUserid"
      )
    RETURNING bs."nBDSid"
),
inserted_share AS (
    INSERT INTO "BDShare" (
        "nSectionid", "nBundleid", "nBundledetailid", "nUserid", "nMasterid", "bIsannotation"
    )
    SELECT
        t."nSectionid", t."nBundleid", t."nBundledetailid", su."nUserid", $2::uuid, FALSE
    FROM target t
    CROSS JOIN selected_users su
    WHERE NOT EXISTS (
        SELECT 1
        FROM "BDShare" bs
        WHERE bs."nSectionid" = t."nSectionid"
          AND bs."nBundleid" IS NOT DISTINCT FROM t."nBundleid"
          AND bs."nBundledetailid" = t."nBundledetailid"
          AND bs."nUserid" = su."nUserid"
          AND bs."nMasterid" = $2::uuid
    )
    RETURNING "nBDSid"
)
SELECT
    (SELECT count(*) FROM target)::int AS "targetCount",
    (SELECT count(*) FROM inserted_share)::int AS "insertedShares",
    (SELECT count(*) FROM removed_share)::int AS "removedShares";
`;
        return await this.db.rowQuery(sql, [nBundledetailid, nMasterid, users]);
    }

    private locationShareUserIds(raw: string): string[] | null {
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return null;
            const ids = parsed.map(value => typeof value === 'string' ? value.trim() : '');
            const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (ids.some(id => !uuid.test(id))) return null;
            return [...new Set(ids)];
        } catch (error) {
            return null;
        }
    }






    async getSharesUsers(query: linkexplorerReq): Promise<any> {
        if (!query?.nMasterid) {
            return { msg: -1, value: 'Failed ', error: 'Missing share owner' };
        }
        // Read the same access rows Team Folders uses. This also preselects
        // recipients added through Evidence > Share with team, so saving the
        // Reader dialog cannot accidentally revoke a share it failed to show.
        const res = await this.db.rowQuery(`
SELECT DISTINCT bs."nUserid"
FROM "BDShare" bs
WHERE bs."nBundledetailid" = $1::uuid
  AND bs."nMasterid" = $2::uuid
ORDER BY bs."nUserid";
`, [query.nBundledetailid, query.nMasterid]);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed ', error: res.error };
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
