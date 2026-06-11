-- 2026-06-08 — Folder search: scope per-user sections to what the caller owns
--              or was shared (fixes a Private Bundle name-leak)
--
-- public.et_bundle_search gated ONLY on BMPermission (a hide-model). That's right
-- for the GLOBAL sections (Master/Core/Transcript) but wrong for the per-user
-- section types: every user has their OWN "Private Bundle" (CB), "My Folders"
-- (M), "User Files"/"Team Folders" (CF/TF) SectionMaster row, and BMPermission
-- has no rows there — so a NON-admin folder search returned folder NAMES from
-- OTHER users' private sections. Verified on 3.0: non-admin 721993c5 searching
-- "report" got 13 folders from CB section 0058ca82 (owned by a different user,
-- with ZERO BDShare rows to 721993c5). A name leak.
--
-- New gate (admins still bypass everything):
--   • global sections (nUserid IS NULL) ........ visible to all, minus BMPermission hides
--   • per-user sections the caller OWNS ........ nUserid = caller, minus hides
--   • CB Private Bundles SHARED with the caller  the subtree of every bundle in
--                                                BDShare (nUserid = caller, bundle-
--                                                level i.e. nBundledetailid IS NULL),
--                                                mirroring legacy et_share_get_bundles
-- The ancestor walk now STOPS at a directly-shared bundle: a recipient must not
-- see the folder names ABOVE the share point (they belong to the owner and were
-- never shared) — matching the sidebar, which lists a shared bundle at top level
-- under "Shared with me", not under its owner-side ancestors.
--
-- Pure body change to public.et_bundle_search (no signature/column/index change).
-- Backend picks it up on the next call — no coreapi rebuild/restart.
--
-- Depends on: 2026-06-08_bundle_search_section_label.up.sql (cFolder/cFoldertype).
-- executeRef key: 'bundle_search'  ->  public.et_bundle_search
-- Rollback: 2026-06-08_bundle_search_cb_scope.down.sql
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
  -- 0. Bundles a NON-admin caller may see inside a CB Private Bundle that isn't
  --    theirs: the subtree of every bundle shared with them (BDShare, bundle-
  --    level share = nBundledetailid IS NULL). `is_root` flags the directly-
  --    shared bundles so the ancestor walk (CTE 2) can stop there. Empty for
  --    admins (they bypass the gate) and for callers with no shares.
  shared_cb AS (
    SELECT s."nBundleid", ARRAY[s."nBundleid"] AS path, true AS is_root
    FROM "BDShare" s
    WHERE NOT isAdmin
      AND s."nUserid"         = nMasterid
      AND s."nBundledetailid" IS NULL
      AND s."nBundleid"       IS NOT NULL
    UNION ALL
    SELECT c."nBundleid", sc.path || c."nBundleid", false
    FROM "BundleMaster" c
    JOIN shared_cb sc ON c."nParentBundleid" = sc."nBundleid"
    WHERE NOT (c."nBundleid" = ANY(sc.path))
  ),
  -- 1. Direct name / tag matches at ANY depth (trigram-indexed), scoped to what
  --    the caller is entitled to see (see header). Capped so a 1-char query
  --    can't return everything.
  matches AS (
    SELECT b."nBundleid"
    FROM "BundleMaster" b
    JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
    LEFT JOIN "BMPermission" p
           ON p."nUserid" = nMasterid AND p."nBundleid" = b."nBundleid"
    WHERE cSearch <> ''
      AND (CASE WHEN nSectionid IS NOT NULL THEN b."nSectionid" = nSectionid
                ELSE sm."nCaseid" = nCaseid END)
      AND (
              isAdmin
          OR (sm."nUserid" IS NULL     AND p."nBMPid" IS NULL)                              -- global sections
          OR (sm."nUserid" = nMasterid AND p."nBMPid" IS NULL)                              -- caller's own per-user section
          OR (sm."cFoldertype" = 'CB'  AND b."nBundleid" IN (SELECT "nBundleid" FROM shared_cb))  -- CB shared with caller
      )
      AND ( b."cBundlename" ILIKE '%' || cSearch || '%'
         OR b."cBundletag"  ILIKE '%' || cSearch || '%' )
    LIMIT 500
  ),
  -- 2. Walk UP to collect each match's ancestors for display context. STOP at a
  --    directly-shared bundle (its ancestors are the owner's and weren't shared)
  --    and guard cycles.
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
      AND f."nBundleid" NOT IN (SELECT "nBundleid" FROM shared_cb WHERE is_root)
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

-- Smoke test (run manually):
--   admin sees every section; a non-admin sees only own + global + CB shared
--   to them, and never the ancestors above a shared bundle.
