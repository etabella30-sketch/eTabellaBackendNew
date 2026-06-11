-- Rollback of 2026-06-09_bundle_index_body_count.up.sql
-- Restores the body's count(*) OVER() window — i.e. the state left by
-- 2026-06-09_bundle_index_fast_body.up.sql (no cumulative-page window, but the
-- count window present).
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
    doc_rows AS (
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
