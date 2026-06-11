-- 2026-06-08 — Folder search returns each node's SECTION label + type
--
-- The Evidence sidebar "Search folders" box renders the matched sub-forest
-- grouped by section. The frontend labelled each group by looking the row's
-- nSectionid up in the already-loaded sidebar tree (et_user_sections). But a
-- search can surface folders from sections the current user's sidebar never
-- loaded — e.g. an admin (who bypasses BMPermission) sees Private Bundle (CB)
-- folders owned by OTHER users, whose nSectionid isn't among the user's own
-- sections (their CB section resolves to the zero-uuid "you have none" row and
-- is dropped). Those groups fell back to a generic "Folders" label with the
-- wrong icon, and sorted out of the normal section sequence.
--
-- Fix: carry the section's cFolder (display label) + cFoldertype (kind code,
-- e.g. MB / CB / TS) through to every output row by joining SectionMaster in
-- the final projection. The frontend then labels, icons, and orders each group
-- straight from the row — identical to how mapSections() handles the default
-- tree — with no dependency on what the sidebar happened to load.
--
-- Pure additive column change to public.et_bundle_search (no signature change,
-- no index change). Existing callers ignore the extra columns. Backend picks up
-- the new body on the next call — no coreapi rebuild/restart required.
--
-- Depends on: 2026-06-02_bundle_name_search.up.sql (creates et_bundle_search +
--             the pg_trgm indexes it relies on).
-- executeRef key: 'bundle_search'  ->  public.et_bundle_search
-- Rollback: 2026-06-08_bundle_search_section_label.down.sql
-- Run against: 3.0.etabella.com.uuid (the active DB in .env.development).

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
  -- 1. Direct name / tag matches at ANY depth (trigram-indexed), permission +
  --    section/case scoped. Capped so a 1-char query can't return everything.
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
  -- 2. Walk UP to collect every ancestor of every match — the minimal pruned
  --    sub-forest needed to render matches in context. The visited-array guard
  --    stops a cyclic chain before it loops.
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
    sm."cFolder",          -- section display label (e.g. "Master Bundle")
    sm."cFoldertype",      -- section kind code (MB / CB / CO / TS / M / CF / TF)
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

-- Smoke test (run manually, replace the ids):
--   BEGIN;
--   SELECT public.et_bundle_search(
--     '{"nMasterid":"<user-uuid>","nCaseid":"<case-uuid>","cSearch":"report"}', 'r1');
--   FETCH ALL IN "r1";
--   COMMIT;
--   -- expect: every row now carries cFolder + cFoldertype for its section.
