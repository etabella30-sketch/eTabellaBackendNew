-- 2026-06-08 — Dynamic Master Index feed: public.et_bundle_index
--
-- Powers the live HTML "Master Index" (and any section index): a section-wide,
-- tab-ordered list of every document with its tab reference, name, exhibit, page
-- range and date — assembled on the fly from the assigned tabs (no pre-generated
-- PDF). Replaces the static demo data in the Angular index-viewer.
--
-- Ordered by the pre-computed natural-sort key BundleDetail.sorted_tab (A1, A2 …
-- A10, not A1/A10/A2), accelerated by idx_bd_section_status_sort
-- (nSectionid, cStatus, sorted_tab) → an index-ordered scan, ~180 ms even on the
-- 77k-row Master Bundle section (vs ~3 s when sorting by a folder function key).
-- The frontend groups consecutive rows into folder sub-sections (a header when
-- the folder changes), so top-level sections (A/B/C/D…) read contiguously.
--
-- Permission-gated exactly like et_bundle_search (admins bypass): global sections
-- (nUserid IS NULL) minus BMPermission hides; per-user sections the caller OWNS;
-- CB Private Bundles shared with the caller (BDShare subtree). Section-scoped, so
-- the index never lists tabs the caller can't see.
--
-- Paged in large chunks (perPage default 2000, max 10000) so the UI streams it in
-- (virtualized) and export can pull every page. count(*) OVER() returns the full
-- total on each row.
--
-- executeRef key: 'bundle_index'  ->  public.et_bundle_index
-- Rollback: 2026-06-08_bundle_index.down.sql
-- Run against: 3.0.etabella.com.uuid (the active DB in .env.development).

BEGIN;

CREATE OR REPLACE FUNCTION public.et_bundle_index(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nMasterid   uuid;
  nSectionid  uuid;
  nCaseid     uuid;
  pageNumber  int;
  perPage     int;
  offsetCount int;
  isAdmin     boolean default false;
BEGIN
  nMasterid   := (parameter ->> 'nMasterid')::uuid;
  nSectionid  := nullif(parameter ->> 'nSectionid', '')::uuid;
  nCaseid     := nullif(parameter ->> 'nCaseid', '')::uuid;
  pageNumber  := greatest(coalesce((parameter ->> 'pageNumber')::int, 1), 1);
  perPage     := least(greatest(coalesce((parameter ->> 'perPage')::int, 2000), 1), 10000);
  offsetCount := (pageNumber - 1) * perPage;

  SELECT "isAdmin" INTO isAdmin FROM "UserMaster" WHERE "nUserid" = nMasterid;

  OPEN ref1 FOR
  WITH RECURSIVE
  -- Subtree of every CB bundle shared with a NON-admin caller (see et_bundle_search).
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
  WHERE d."nSectionid" = nSectionid          -- denormalized → hits idx_bd_section_status_sort
    AND d."cStatus"    = 'C'
    AND (
            isAdmin
        OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)                              -- global sections
        OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)                              -- caller's own per-user section
        OR (sm."cFoldertype" = 'CB'  AND d."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))  -- CB shared with caller
    )
  ORDER BY d."sorted_tab"
  LIMIT perPage OFFSET offsetCount;

  RETURN NEXT ref1;
END;
$function$;

COMMIT;

-- Smoke test:
--   BEGIN;
--   SELECT public.et_bundle_index('{"nMasterid":"<uid>","nSectionid":"<sid>","pageNumber":1,"perPage":50}','r1');
--   FETCH ALL IN "r1";
--   COMMIT;
