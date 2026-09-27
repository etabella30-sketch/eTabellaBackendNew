/**
 * The RT Simulation source case's Master section ($1 = source case id).
 * Mirrors et_user_sections cursor 0 (global, non-transcript sections by id) plus
 * the RT page's pick: a Master Bundle (MB / MASTER / folder named "master"),
 * else the first section.
 */
export const RT_DEMO_MASTER_SECTION_SQL = `
SELECT s."nSectionid"
  FROM "SectionMaster" s
 WHERE s."nCaseid" = $1::uuid
   AND COALESCE(s."nUserid", '00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
   AND s."cFoldertype" <> 'TS'
 ORDER BY (upper(COALESCE(s."cFoldertype", '')) IN ('MB', 'MASTER')
           OR lower(COALESCE(s."cFolder", '')) LIKE '%master%') DESC,
          s."nSectionid"
 LIMIT 1`;

/**
 * The chosen document's file ($1 = nBundledetailid, $2 = the Master section).
 * Re-checked against that section and live status so the answer never leaves
 * it. Read-only: unlike et_get_filedata it writes no RecentFiles row.
 */
export const RT_DEMO_FILE_SQL = `
SELECT d."cTab", d."cFilename", d."cFiletype", d."cPath", d."cPage"
  FROM "BundleDetail" d
 WHERE d."nBundledetailid" = $1::uuid
   AND d."nSectionid" = $2::uuid
   AND d."cStatus" = 'C'
 LIMIT 1`;
