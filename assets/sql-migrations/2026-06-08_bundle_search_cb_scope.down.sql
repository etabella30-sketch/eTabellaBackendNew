-- Rollback for 2026-06-08_bundle_search_cb_scope.up.sql
--
-- Restores public.et_bundle_search to the 2026-06-08_bundle_search_section_label
-- body: keeps cFolder/cFoldertype, but reverts the visibility gate to the
-- BMPermission-only model. WARNING: reverting re-opens the Private Bundle name
-- leak (a non-admin search can see other users' CB folder names). Only roll back
-- if the scoped gate misbehaves.

BEGIN;

CREATE OR REPLACE FUNCTION public.et_bundle_search(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nMasterid  uuid;
  nSectionid uuid;
  nCaseid    uuid;
  cSearch    text;
  isAdmin    boolean default false;
BEGIN
  nMasterid  := (parameter ->> 'nMasterid')::uuid;
  nSectionid := nullif(parameter ->> 'nSectionid', '')::uuid;
  nCaseid    := nullif(parameter ->> 'nCaseid', '')::uuid;
  cSearch    := btrim(coalesce(parameter ->> 'cSearch', ''));

  SELECT "isAdmin" INTO isAdmin FROM "UserMaster" WHERE "nUserid" = nMasterid;

  OPEN ref1 FOR
  WITH RECURSIVE
  matches AS (
    SELECT b."nBundleid"
    FROM "BundleMaster" b
    JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
    LEFT JOIN "BMPermission" p
           ON p."nUserid" = nMasterid AND p."nBundleid" = b."nBundleid"
    WHERE cSearch <> ''
      AND (CASE WHEN nSectionid IS NOT NULL THEN b."nSectionid" = nSectionid
                ELSE sm."nCaseid" = nCaseid END)
      AND (CASE WHEN isAdmin THEN true ELSE p."nBMPid" IS NULL END)
      AND ( b."cBundlename" ILIKE '%' || cSearch || '%'
         OR b."cBundletag"  ILIKE '%' || cSearch || '%' )
    LIMIT 500
  ),
  forest AS (
    SELECT b."nBundleid", b."nParentBundleid",
           ARRAY[b."nBundleid"] AS path, false AS is_cycle
    FROM "BundleMaster" b
    WHERE b."nBundleid" IN (SELECT "nBundleid" FROM matches)
    UNION ALL
    SELECT p."nBundleid", p."nParentBundleid",
           f.path || p."nBundleid", p."nBundleid" = ANY(f.path)
    FROM "BundleMaster" p
    JOIN forest f ON f."nParentBundleid" = p."nBundleid"
    WHERE NOT f.is_cycle
  ),
  nodes AS ( SELECT DISTINCT "nBundleid" FROM forest )
  SELECT
    b."nBundleid",
    b."nParentBundleid",
    b."nSectionid",
    sm."cFolder",
    sm."cFoldertype",
    b."cBundlename",
    b."cBundletag",
    b."nHierarchyDepth",
    b."nFileCount",
    b."nFileCountDescendant",
    EXISTS (SELECT 1 FROM "BundleMaster" c
            WHERE c."nParentBundleid" = b."nBundleid") AS "bHasChildren",
    (b."nBundleid" IN (SELECT "nBundleid" FROM matches)) AS "bIsMatch"
  FROM "BundleMaster" b
  JOIN nodes n           ON n."nBundleid"  = b."nBundleid"
  JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
  ORDER BY
    b."nHierarchyDepth",
    split_hierarchical_sort_multi(b."cBundletag",  ARRAY['.', '-']),
    split_hierarchical_sort_multi(b."cBundlename", ARRAY['.', '-']);

  RETURN NEXT ref1;
END;
$function$;

COMMIT;
