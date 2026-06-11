-- 2026-06-09 — et_bundle_index BODY: drop the per-row cumulative-page window
--
-- PERFORMANCE FIX. The BODY branch computed a cumulative "nPageStart" via a
-- running window:
--     sum(... regex/split_part of cPage ...) OVER (ORDER BY sorted_tab ...
--                                  ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
-- A running sum forces Postgres to materialise and walk the ENTIRE gated set (in
-- sorted order) on EVERY page request — and the per-row regex on cPage makes
-- each of those rows expensive. On a 77k-doc / 2,569-page section that means a
-- multi-second hang when the scrollbar jumps to a far page ("Loading page 2569…").
--
-- The viewer no longer uses that cumulative page: the PAGES column now shows each
-- document's OWN length numbered from 1 (1–28, 1–10, …), derived client-side from
-- cPage. So "nPageStart" is dead weight in the body and is removed here. The
-- cumulative bundle page still lives in the OUTLINE branch (one-shot per section),
-- which is unchanged, so the cover's "Pages" stat is unaffected.
--
-- "count(*) OVER() AS nResultTotal" is kept (the viewer needs the total on the
-- first page); it is a plain full count, far cheaper than the regex running-sum.
-- For sub-100ms far-page seeks on very large sections, also add a covering index
-- so the ORDER BY/OFFSET is index-served (verify "sorted_tab" is a stored column):
--     CREATE INDEX IF NOT EXISTS "ix_BundleDetail_section_tab"
--       ON "BundleDetail" ("nSectionid", "sorted_tab", "nBundledetailid")
--       WHERE "cStatus" = 'C';
--
-- Only the BODY branch changes; the OUTLINE (bOutline) branch is byte-identical
-- to 2026-06-08_bundle_index_tree.up.sql.
--
-- Depends on: 2026-06-08_bundle_index_tree.up.sql
-- Rollback:   2026-06-09_bundle_index_fast_body.down.sql
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
    -- ---- OUTLINE TREE: every gated folder + where its content starts ----
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
    doc_rows AS (   -- gated docs, body order (sorted_tab) → row index + cumulative page
      SELECT
        d."nBundleid",
        row_number() OVER (ORDER BY d."sorted_tab", d."nBundledetailid") AS rn,
        coalesce(sum(
          greatest(1, CASE WHEN btrim(coalesce(d."cPage", '')) ~ '^[0-9]+ *- *[0-9]+$'
            THEN split_part(btrim(d."cPage"), '-', 2)::int - split_part(btrim(d."cPage"), '-', 1)::int + 1
            ELSE 1 END)
        ) OVER (ORDER BY d."sorted_tab", d."nBundledetailid" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS cb
      FROM "BundleDetail" d
      JOIN "BundleMaster"  b2  ON b2."nBundleid"   = d."nBundleid"
      JOIN "SectionMaster" sm2 ON sm2."nSectionid" = b2."nSectionid"
      LEFT JOIN "BMPermission" p2 ON p2."nUserid" = nMasterid AND p2."nBundleid" = d."nBundleid"
      WHERE d."nSectionid" = nSectionid
        AND d."cStatus"    = 'C'
        AND (
                isAdmin
            OR (sm2."nUserid" IS NULL     AND p2."nBMPid" IS NULL)
            OR (sm2."nUserid" = nMasterid AND p2."nBMPid" IS NULL)
            OR (sm2."cFoldertype" = 'CB'  AND d."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
        )
    ),
    doc_pos AS (
      SELECT "nBundleid", min(rn) AS first_rn, (min(cb) + 1) AS first_page, count(*) AS direct_docs
      FROM doc_rows GROUP BY "nBundleid"
    )
    SELECT
      b."nBundleid",
      b."nParentBundleid",
      b."cBundlename" AS "cFolder",
      b."cBundletag"  AS "cFolderTag",
      dp.first_rn::int                  AS "nRowOffset",
      coalesce(dp.first_page, 0)::int   AS "nPageStart",
      coalesce(dp.direct_docs, 0)::int  AS "nDocCount"
    FROM "BundleMaster" b
    JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
    LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = b."nBundleid"
    LEFT JOIN doc_pos dp ON dp."nBundleid" = b."nBundleid"
    WHERE b."nSectionid" = nSectionid
      AND (
              isAdmin
          OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)
          OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)
          OR (sm."cFoldertype" = 'CB'  AND b."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
      )
    ORDER BY b."sorted_bundletag";

  ELSE
    -- ---- BODY: one page of doc rows (no cumulative-page window) ----
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
      "nResultTotal"
    FROM gated
    ORDER BY "sorted_tab", "nBundledetailid"
    LIMIT perPage OFFSET offsetCount;
  END IF;

  RETURN NEXT ref1;
END;
$function$;

COMMIT;
