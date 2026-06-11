-- 2026-06-08 — et_bundle_index: optional cSearch (full-index find)
--
-- Lets the Master Index "Find in document" box search the WHOLE section
-- server-side (every one of the tens of thousands of docs), not just the loaded
-- page. Filters cTab / cFilename / cExhibitno by substring — accelerated by the
-- existing BundleDetail trigram GINs (ix_bd_tab_trgm / ix_bd_filename_trgm /
-- ix_bd_exhibit_trgm). Empty cSearch = the full index (unchanged behaviour).
--
-- Pure additive param (read from the JSON), so coreapi needs no change — the
-- frontend just adds cSearch to the query and it flows through executeRef.
--
-- Depends on: 2026-06-08_bundle_index.up.sql
-- Rollback: 2026-06-08_bundle_index_search.down.sql
-- Run against: 3.0.etabella.com.uuid

BEGIN;

CREATE OR REPLACE FUNCTION public.et_bundle_index(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nMasterid   uuid;
  nSectionid  uuid;
  nCaseid     uuid;
  cSearch     text;
  pageNumber  int;
  perPage     int;
  offsetCount int;
  isAdmin     boolean default false;
BEGIN
  nMasterid   := (parameter ->> 'nMasterid')::uuid;
  nSectionid  := nullif(parameter ->> 'nSectionid', '')::uuid;
  nCaseid     := nullif(parameter ->> 'nCaseid', '')::uuid;
  cSearch     := btrim(coalesce(parameter ->> 'cSearch', ''));
  pageNumber  := greatest(coalesce((parameter ->> 'pageNumber')::int, 1), 1);
  perPage     := least(greatest(coalesce((parameter ->> 'perPage')::int, 2000), 1), 10000);
  offsetCount := (pageNumber - 1) * perPage;

  SELECT "isAdmin" INTO isAdmin FROM "UserMaster" WHERE "nUserid" = nMasterid;

  OPEN ref1 FOR
  WITH RECURSIVE
  shared_cb AS (
    SELECT s."nBundleid", ARRAY[s."nBundleid"] AS path
    FROM "BDShare" s
    WHERE NOT isAdmin
      AND s."nUserid"         = nMasterid
      AND s."nBundledetailid" IS NULL
      AND s."nBundleid"       IS NOT NULL
    UNION ALL
    SELECT c."nBundleid", sc.path || c."nBundleid"
    FROM "BundleMaster" c
    JOIN shared_cb sc ON c."nParentBundleid" = sc."nBundleid"
    WHERE NOT (c."nBundleid" = ANY(sc.path))
  )
  SELECT
    d."nBundledetailid",
    d."nBundleid",
    b."cBundlename"  AS "cFolder",
    b."cBundletag"   AS "cFolderTag",
    d."cTab",
    d."cFilename"    AS "cName",
    d."cExhibitno",
    d."cPage",
    d."cRefpage",
    d."dIntrestDt",
    count(*) OVER()  AS "nResultTotal"
  FROM "BundleDetail" d
  JOIN "BundleMaster"  b  ON b."nBundleid"   = d."nBundleid"
  JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
  LEFT JOIN "BMPermission" p
         ON p."nUserid" = nMasterid AND p."nBundleid" = d."nBundleid"
  WHERE d."nSectionid" = nSectionid
    AND d."cStatus"    = 'C'
    AND ( cSearch = ''
       OR d."cTab"      ILIKE '%' || cSearch || '%'
       OR d."cFilename" ILIKE '%' || cSearch || '%'
       OR coalesce(d."cExhibitno", '') ILIKE '%' || cSearch || '%' )
    AND (
            isAdmin
        OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)
        OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)
        OR (sm."cFoldertype" = 'CB'  AND d."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
    )
  ORDER BY d."sorted_tab"
  LIMIT perPage OFFSET offsetCount;

  RETURN NEXT ref1;
END;
$function$;

COMMIT;
