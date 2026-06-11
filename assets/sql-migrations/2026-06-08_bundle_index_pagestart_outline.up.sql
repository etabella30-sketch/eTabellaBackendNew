-- 2026-06-08 — et_bundle_index: cumulative page + outline mode (scale to 1TB)
--
-- Two additions, both keep the index O(1) to render no matter how big the case:
--
-- 1. nPageStart — each doc row now carries its CUMULATIVE page in the assembled
--    bundle (running sum of each doc's page-range length, in tab order). Computed
--    server-side with a window, so a page fetched DIRECTLY by offset (page 200 =
--    offset 5970) still shows correct page numbers without loading pages 1-199.
--    This is what makes paginated/random-access navigation possible.
--
-- 2. bOutline — when true, the SP returns ONE ROW PER FOLDER (the section list)
--    instead of doc rows: the folder, its first index-row offset (→ which index
--    page it starts on), its first doc's cumulative page, and its doc count.
--    Hundreds of rows regardless of doc count, so the outline is ALWAYS complete
--    (every section) and cheap — it is NOT derived from the loaded body.
--
-- Both ride the existing /bundles/index route via executeRef (the params are read
-- from the JSON body), so coreapi needs NO rebuild.
--
-- Depends on: 2026-06-08_bundle_index_search.up.sql
-- Rollback:   2026-06-08_bundle_index_pagestart_outline.down.sql
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
  bOutline    boolean;
  isAdmin     boolean default false;
BEGIN
  nMasterid   := (parameter ->> 'nMasterid')::uuid;
  nSectionid  := nullif(parameter ->> 'nSectionid', '')::uuid;
  nCaseid     := nullif(parameter ->> 'nCaseid', '')::uuid;
  cSearch     := btrim(coalesce(parameter ->> 'cSearch', ''));
  pageNumber  := greatest(coalesce((parameter ->> 'pageNumber')::int, 1), 1);
  perPage     := least(greatest(coalesce((parameter ->> 'perPage')::int, 2000), 1), 10000);
  offsetCount := (pageNumber - 1) * perPage;
  bOutline    := coalesce((parameter ->> 'bOutline')::boolean, false);

  SELECT "isAdmin" INTO isAdmin FROM "UserMaster" WHERE "nUserid" = nMasterid;

  IF bOutline THEN
    -- ---- OUTLINE: one row per folder (the complete section list) ----
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
    ),
    gated AS (
      SELECT
        d."nBundleid",
        b."cBundlename" AS "cFolder",
        b."cBundletag"  AS "cFolderTag",
        row_number() OVER (ORDER BY d."sorted_tab", d."nBundledetailid") AS rn,
        -- cumulative pages BEFORE this row (this doc's start page = +1)
        coalesce(sum(
          greatest(1, CASE WHEN btrim(coalesce(d."cPage", '')) ~ '^[0-9]+ *- *[0-9]+$'
            THEN split_part(btrim(d."cPage"), '-', 2)::int - split_part(btrim(d."cPage"), '-', 1)::int + 1
            ELSE 1 END)
        ) OVER (ORDER BY d."sorted_tab", d."nBundledetailid" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS cum_before
      FROM "BundleDetail" d
      JOIN "BundleMaster"  b  ON b."nBundleid"   = d."nBundleid"
      JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
      LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = d."nBundleid"
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
    )
    SELECT
      "nBundleid",
      "cFolder",
      "cFolderTag",
      min(rn)::int                AS "nRowOffset",   -- 1-based first row in tab order
      (min(cum_before) + 1)::int  AS "nPageStart",   -- first doc's cumulative bundle page
      count(*)::int               AS "nDocCount"
    FROM gated
    GROUP BY "nBundleid", "cFolder", "cFolderTag"
    ORDER BY min(rn);

  ELSE
    -- ---- BODY: one page of doc rows, each with its cumulative page ----
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
    ),
    gated AS (
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
        d."sorted_tab",
        (coalesce(sum(
          greatest(1, CASE WHEN btrim(coalesce(d."cPage", '')) ~ '^[0-9]+ *- *[0-9]+$'
            THEN split_part(btrim(d."cPage"), '-', 2)::int - split_part(btrim(d."cPage"), '-', 1)::int + 1
            ELSE 1 END)
        ) OVER (ORDER BY d."sorted_tab", d."nBundledetailid" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) + 1)::int AS "nPageStart",
        count(*) OVER() AS "nResultTotal"
      FROM "BundleDetail" d
      JOIN "BundleMaster"  b  ON b."nBundleid"   = d."nBundleid"
      JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
      LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = d."nBundleid"
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
    )
    SELECT
      "nBundledetailid", "nBundleid", "cFolder", "cFolderTag",
      "cTab", "cName", "cExhibitno", "cPage", "cRefpage", "dIntrestDt",
      "nPageStart", "nResultTotal"
    FROM gated
    ORDER BY "sorted_tab", "nBundledetailid"
    LIMIT perPage OFFSET offsetCount;
  END IF;

  RETURN NEXT ref1;
END;
$function$;

COMMIT;
