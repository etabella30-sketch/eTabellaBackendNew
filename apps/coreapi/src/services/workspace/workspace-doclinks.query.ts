/** Same owner / explicit recipient audience as the Reader's DocLink navigation.
 * Session sources need no BundleDetail. Keep DocLinks distinct from FactMaster.
 * $1 case id, $2 authenticated caller id. */
export const WORKSPACE_DOCLINKS_SQL = `
SELECT m."nDocid" AS "nFSid", 'DL' AS "cFType", m."dCreateDt", m."nBundledetailid",
  m."nSesid", m."cDFrom" AS "cFFrom", s."cName" AS "cSessionname",
  m."nUserid"=$2::uuid AS "bIsOwner", false AS "bCanCopy",
  d."jOText" AS "jOT", d."jTexts", d."nPage", d."nLine", d."nTPage", d."nTLine",
  bd."cFilename", bd."cTab", bd."cExhibitno", bd."cBundletag",
  u."cFname" || ' ' || coalesce(u."cLname", '') AS "cCreateby",
  coalesce(a.page,0) AS "nAnnotpage",
  (select count(*) from "DMShared" sh where sh."nDocid"=m."nDocid") AS "nSUsers",
  coalesce(targets.sources,'[]'::jsonb) AS "jSources"
FROM "DocMaster" m
JOIN "DocDetail" d ON d."nDocid"=m."nDocid"
LEFT JOIN "UserMaster" u ON u."nUserid"=m."nUserid"
LEFT JOIN "bundlesource" bd ON bd."nBundledetailid"=m."nBundledetailid"
LEFT JOIN "RSessionMaster" s ON s."nSesid"=m."nSesid" AND s."nCaseid"=m."nCaseid"
LEFT JOIN LATERAL (select min("page") page from "Annotations" where "nDocid"=m."nDocid") a ON true
LEFT JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object('nDMLids', l."nDMLids", 'nBundledetailid', l."nBundledetailid",
    'cFilename', t."cFilename", 'cTab', t."cTab", 'cExhibitno', t."cExhibitno") ORDER BY l."nDMLids") sources
  FROM "DMLinks" l LEFT JOIN "bundlesource" t ON t."nBundledetailid"=l."nBundledetailid"
  WHERE l."nDocid"=m."nDocid"
) targets ON true
WHERE m."nCaseid"=$1::uuid AND (m."nUserid"=$2::uuid OR EXISTS (
  SELECT 1 FROM "DMShared" sh WHERE sh."nDocid"=m."nDocid" AND sh."nUserid"=$2::uuid
)) ORDER BY m."dCreateDt", m."nDocid"`;
