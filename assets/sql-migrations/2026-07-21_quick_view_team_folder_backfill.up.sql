-- Backfill legacy Reader "Quick View Invitation" grants into the BDShare
-- read model used by Evidence > Team Folders. Future writes are kept in sync by
-- IndividualService.locationshareSharetousers.
BEGIN;

WITH missing_quick_view_shares AS (
    SELECT DISTINCT
        bd."nSectionid",
        bd."nBundleid",
        ls."nBundledetailid",
        ls."nUserid",
        ls."nShareby" AS "nMasterid"
    FROM "LocationShare" ls
    JOIN "BundleDetail" bd
      ON bd."nBundledetailid" = ls."nBundledetailid"
    WHERE bd."nSectionid" IS NOT NULL
      AND bd."nBundleid" IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM "BDShare" bs
          WHERE bs."nSectionid" = bd."nSectionid"
            AND bs."nBundleid" IS NOT DISTINCT FROM bd."nBundleid"
            AND bs."nBundledetailid" = ls."nBundledetailid"
            AND bs."nUserid" = ls."nUserid"
            AND bs."nMasterid" = ls."nShareby"
      )
)
INSERT INTO "BDShare" (
    "nSectionid",
    "nBundleid",
    "nBundledetailid",
    "nUserid",
    "nMasterid",
    "bIsannotation"
)
SELECT
    "nSectionid",
    "nBundleid",
    "nBundledetailid",
    "nUserid",
    "nMasterid",
    FALSE
FROM missing_quick_view_shares;

COMMIT;
