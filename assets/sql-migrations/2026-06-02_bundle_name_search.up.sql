-- 2026-06-02 — Fast folder (bundle) name search across all depths (Phase 2.4)
--
-- Powers the Evidence sidebar "Search folders" box. Lets the user find a folder
-- by name OR tab at ANY nesting level in a single round-trip. The sidebar tree
-- is lazy-loaded one level at a time (public.et_bundles per expand), so deep /
-- nth-level folders cannot be found client-side — this SP searches the whole
-- section (or case) server-side and returns the minimal pruned sub-forest
-- (every match + all of its ancestors) so the frontend can render the matches
-- in place (filtered tree) and navigate straight to any node.
--
-- Adds:
--   • pg_trgm GIN indexes on BundleMaster.cBundlename + cBundletag so the
--     substring search (ILIKE '%term%') is index-accelerated regardless of
--     tree size — "rocket" even on cases with thousands of folders.
--   • supporting btree indexes on nSectionid / nParentBundleid for the section
--     scope + ancestor walk (IF NOT EXISTS — no-op if already present).
--   • public.et_bundle_search(parameter json, ref1 refcursor) — returns one row
--     per node in the matched sub-forest: nBundleid, nParentBundleid,
--     nSectionid, cBundlename, cBundletag + the same metadata columns as
--     et_bundles (nHierarchyDepth, nFileCount, nFileCountDescendant,
--     bHasChildren) plus bIsMatch (true = a real name/tag hit, false = an
--     ancestor on the path). Permission-filtered (BMPermission), section/case
--     scoped, cycle-guarded (BundleMaster is known to contain at least one
--     cycle — see the 2.2 verification report).
--
-- Depends on: 2026-05-20_bundle_depth.up.sql + 2026-05-20_bundle_file_counts.up.sql
--             (the nHierarchyDepth / nFileCount* columns) and the existing
--             split_hierarchical_sort_multi() sort helper.
--
-- executeRef key: 'bundle_search'  ->  public.et_bundle_search
-- Rollback: 2026-06-02_bundle_name_search.down.sql
-- Run against: 3.0.etabella.com.uuid (the active DB in .env.development).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Indexes
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN — turns the unanchored substring search into an index scan.
CREATE INDEX IF NOT EXISTS ix_bundlemaster_bundlename_trgm
  ON "BundleMaster" USING gin ("cBundlename" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_bundlemaster_bundletag_trgm
  ON "BundleMaster" USING gin ("cBundletag" gin_trgm_ops);

-- Supporting btrees for the section scope + parent walk (no-op if present).
CREATE INDEX IF NOT EXISTS ix_bundlemaster_section
  ON "BundleMaster" ("nSectionid");

CREATE INDEX IF NOT EXISTS ix_bundlemaster_parent
  ON "BundleMaster" ("nParentBundleid");

-- ---------------------------------------------------------------------------
-- 2. SP — public.et_bundle_search
--    Returns the matched sub-forest (matches + ancestors). Mirrors et_bundles'
--    column shape so the frontend mapper is reused, + bIsMatch.
-- ---------------------------------------------------------------------------
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
    b."cBundlename",
    b."cBundletag",
    b."nHierarchyDepth",
    b."nFileCount",
    b."nFileCountDescendant",
    EXISTS (SELECT 1 FROM "BundleMaster" c
            WHERE c."nParentBundleid" = b."nBundleid") AS "bHasChildren",
    (b."nBundleid" IN (SELECT "nBundleid" FROM matches)) AS "bIsMatch"
  FROM "BundleMaster" b
  JOIN nodes n ON n."nBundleid" = b."nBundleid"
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
--     '{"nMasterid":"<user-uuid>","nCaseid":"<case-uuid>","cSearch":"draw"}', 'r1');
--   FETCH ALL IN "r1";
--   COMMIT;
