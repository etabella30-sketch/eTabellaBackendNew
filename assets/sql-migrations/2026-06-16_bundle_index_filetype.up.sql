-- 2026-06-16 — et_bundle_index: add d."cFiletype" on the doc rows
-- (BODY + ranked-search branches) so the Master Index can offer a File-type filter.
-- Additive / backward-compatible.

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
  nFindDocid  uuid;
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
  nFindDocid  := nullif(parameter ->> 'nFindDocid', '')::uuid;
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

  ELSIF nFindDocid IS NOT NULL THEN
    -- ---- DOC OFFSET: a single doc's 0-based position in the body order ----
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
    tgt AS (
      SELECT d."sorted_tab", d."nBundledetailid"
      FROM "BundleDetail" d WHERE d."nBundledetailid" = nFindDocid
    )
    SELECT count(*)::int AS "nRowOffset"
    FROM "BundleDetail" d
    JOIN "BundleMaster"  b  ON b."nBundleid"   = d."nBundleid"
    JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
    LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = d."nBundleid"
    WHERE d."nSectionid" = nSectionid
      AND d."cStatus"    = 'C'
      AND ( d."sorted_tab", d."nBundledetailid" ) < (SELECT t."sorted_tab", t."nBundledetailid" FROM tgt t)
      AND (
              isAdmin
          OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)
          OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)
          OR (sm."cFoldertype" = 'CB'  AND d."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
      );

  ELSIF cSearch <> '' THEN
    -- ---- RANKED SEARCH (find-in-document): tab > exhibit > name > date ----
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
      d."cFiletype",
      count(*) OVER()::int AS "nResultTotal"
    FROM "BundleDetail" d
    JOIN "BundleMaster"  b  ON b."nBundleid"   = d."nBundleid"
    JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
    LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = d."nBundleid"
    WHERE d."nSectionid" = nSectionid
      AND d."cStatus"    = 'C'
      AND ( d."cTab"                          ILIKE '%' || cSearch || '%'
         OR coalesce(d."cExhibitno", '')      ILIKE '%' || cSearch || '%'
         OR d."cFilename"                     ILIKE '%' || cSearch || '%'
         OR coalesce(d."dIntrestDt"::text, '') ILIKE '%' || cSearch || '%' )
      AND (
              isAdmin
          OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)
          OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)
          OR (sm."cFoldertype" = 'CB'  AND d."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
      )
    ORDER BY
      ( CASE
          WHEN lower(d."cTab") = lower(cSearch)                              THEN 6
          WHEN lower(d."cTab") LIKE lower(cSearch) || '%'                    THEN 5
          WHEN d."cTab" ILIKE '%' || cSearch || '%'                          THEN 4
          WHEN coalesce(d."cExhibitno", '') ILIKE '%' || cSearch || '%'      THEN 3
          WHEN d."cFilename" ILIKE '%' || cSearch || '%'                     THEN 2
          WHEN coalesce(d."dIntrestDt"::text, '') ILIKE '%' || cSearch || '%' THEN 1
          ELSE 0 END ) DESC,
      d."sorted_tab", d."nBundledetailid"
    LIMIT perPage OFFSET offsetCount;

  ELSE
    -- ---- BODY (browse): one page of doc rows; total counted on page 1 only ----
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
      d."cFiletype",
      ( CASE WHEN offsetCount = 0 THEN (
          SELECT count(*)
          FROM "BundleDetail" d2
          JOIN "BundleMaster"  b2  ON b2."nBundleid"   = d2."nBundleid"
          JOIN "SectionMaster" sm2 ON sm2."nSectionid" = b2."nSectionid"
          LEFT JOIN "BMPermission" p2 ON p2."nUserid" = nMasterid AND p2."nBundleid" = d2."nBundleid"
          WHERE d2."nSectionid" = nSectionid
            AND d2."cStatus"    = 'C'
            AND (
                    isAdmin
                OR (sm2."nUserid" IS NULL     AND p2."nBMPid" IS NULL)
                OR (sm2."nUserid" = nMasterid AND p2."nBMPid" IS NULL)
                OR (sm2."cFoldertype" = 'CB'  AND d2."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
            )
        ) ELSE NULL END )::int AS "nResultTotal"
    FROM "BundleDetail" d
    JOIN "BundleMaster"  b  ON b."nBundleid"   = d."nBundleid"
    JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
    LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = d."nBundleid"
    WHERE d."nSectionid" = nSectionid
      AND d."cStatus"    = 'C'
      AND (
              isAdmin
          OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)
          OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)
          OR (sm."cFoldertype" = 'CB'  AND d."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))
      )
    ORDER BY d."sorted_tab", d."nBundledetailid"
    LIMIT perPage OFFSET offsetCount;
  END IF;

  RETURN NEXT ref1;
END;
$function$
;

COMMIT;
