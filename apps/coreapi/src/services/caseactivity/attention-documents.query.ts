/** Shared by summary and list: each document occurs once, under current access. */
export const ATTENTION_DOCUMENTS = `
WITH RECURSIVE denied_folders AS (
  SELECT p."nBundleid" FROM "BMPermission" p WHERE p."nUserid" = $2::uuid
  UNION
  SELECT b."nBundleid" FROM "BundleMaster" b
  JOIN denied_folders p ON b."nParentBundleid" = p."nBundleid"
), shared_folders AS (
  SELECT s."nBundleid" FROM "BDShare" s
  WHERE s."nUserid" = $2::uuid AND s."nBundledetailid" IS NULL AND s."nBundleid" IS NOT NULL
  UNION
  SELECT b."nBundleid" FROM "BundleMaster" b
  JOIN shared_folders s ON b."nParentBundleid" = s."nBundleid"
), accessible AS (
  SELECT d.*
  FROM "BundleDetail" d
  JOIN "SectionMaster" s ON s."nSectionid" = d."nSectionid"
  WHERE s."nCaseid" = $1::uuid AND d."cStatus" = 'C' AND NOT coalesce(d."cIsindex", false)
    AND NOT EXISTS (SELECT 1 FROM "BDPermission" p WHERE p."nUserid" = $2::uuid AND p."nBundledetailid" = d."nBundledetailid")
    AND NOT EXISTS (SELECT 1 FROM denied_folders p WHERE p."nBundleid" = d."nBundleid")
    AND (
      s."nUserid" IS NULL OR s."nUserid" = $2::uuid
      OR EXISTS (SELECT 1 FROM shared_folders f WHERE f."nBundleid" = d."nBundleid")
      OR EXISTS (SELECT 1 FROM "BDShare" sh WHERE sh."nUserid" = $2::uuid AND sh."nBundledetailid" = d."nBundledetailid")
      OR EXISTS (SELECT 1 FROM "BDAssignment" a WHERE a."nUserid" = $2::uuid AND a."nBundledetailid" = d."nBundledetailid")
    )
), updates AS (
  SELECT l."nBundledetailid", max(l."dCreateDt") AT TIME ZONE current_setting('TimeZone') AS updated_at
  FROM "LogBundleDetail" l
  JOIN accessible d ON d."nBundledetailid" = l."nBundledetailid"
  WHERE l."nLCatid" = 20
       AND l."dCreateDt" >= ($3::timestamptz AT TIME ZONE current_setting('TimeZone'))
       AND l."dCreateDt" < ($4::timestamptz AT TIME ZONE current_setting('TimeZone'))
       AND l."dCreateDt" <= ($5::timestamptz AT TIME ZONE current_setting('TimeZone'))
  GROUP BY l."nBundledetailid"
), activity AS (
  SELECT d.*, d."dCreateDt" AT TIME ZONE current_setting('TimeZone') AS added_at, u.updated_at
  FROM accessible d LEFT JOIN updates u ON u."nBundledetailid" = d."nBundledetailid"
)
`;

export const ATTENTION_ACCESS = `SELECT EXISTS (
  SELECT 1 FROM "CaseMaster" c WHERE c."nCaseid" = $1::uuid AND (
    EXISTS (SELECT 1 FROM "UserMaster" u WHERE u."nUserid" = $2::uuid AND u."isAdmin" = true)
    OR EXISTS (SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = c."nCaseid"
      AND t."nUserid" = $2::uuid AND t."cStatus" = 'A')
  )
) AS allowed`;

export const ATTENTION_SUMMARY = ATTENTION_DOCUMENTS + `
SELECT count(*) FILTER (WHERE added_at >= $4::timestamptz AND added_at < $6::timestamptz AND added_at <= $5::timestamptz)::int AS "documentsAddedToday",
       count(*) FILTER (WHERE updated_at IS NOT NULL)::int AS "documentsUpdatedYesterday"
FROM activity`;

export const ATTENTION_LIST = ATTENTION_DOCUMENTS + `,
matching AS (
  SELECT * FROM activity WHERE CASE WHEN $6 = 'added'
    THEN added_at >= $3::timestamptz AND added_at < $4::timestamptz AND added_at <= $5::timestamptz
    ELSE updated_at IS NOT NULL END
), page AS (
  SELECT "nBundledetailid" AS id, "nBundleid" AS "bundleId", "nSectionid" AS "sectionId",
    "cFilename" AS name, "cTab" AS tab, "cFiletype" AS "fileType",
    CASE WHEN $6 = 'added' THEN added_at ELSE updated_at END AS "occurredAt"
  FROM matching ORDER BY "occurredAt" DESC, "nBundledetailid" LIMIT 50 OFFSET $7::int
)
SELECT (SELECT count(*)::int FROM matching) AS total,
  coalesce((SELECT json_agg(page) FROM page), '[]'::json) AS rows`;
