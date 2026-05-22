-- 2026-05-20 — BundleMaster denormalized file counts (Phase 2.3)
--
-- Adds two precomputed counters to every bundle so the Evidence sidebar
-- can render document counts as a pure column read — no aggregation, no
-- recursion at query time:
--
--   • nFileCount             — files directly inside this bundle
--                              (BundleDetail rows with this nBundleid AND
--                               cStatus = 'C').
--   • nFileCountDescendant   — files anywhere in this bundle's subtree
--                              (own + all descendants).
--
-- Maintained by three triggers (defined below):
--   • trg_bundledetail_filecount         — on BundleDetail INS/UPD/DEL
--   • trg_bundlemaster_parent_move       — on BundleMaster INS/UPD of parent;
--                                          also keeps nHierarchyDepth in sync
--                                          (the Phase 2.2 helper column).
--   • trg_bundlemaster_delete_cascade    — on BundleMaster DEL
--
-- Recursive walks use Postgres 14+ CYCLE clause to defend against the
-- known data cycles (Bundle J ↔ J1, see 2.2 verification report) — a row
-- in a cycle stops the ancestor walk instead of looping forever.
--
-- Also updates et_bundles SP to surface the three columns so the frontend
-- mapper can render the count badge with zero extra round-trips.
--
-- Rollback: 2026-05-20_bundle_file_counts.down.sql
-- Run against: dev.etabella.com.uuid first; then etabella.legal.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
ALTER TABLE "BundleMaster"
  ADD COLUMN IF NOT EXISTS "nFileCount"            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nFileCountDescendant"  INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 2. Backfill direct counts
-- ---------------------------------------------------------------------------
UPDATE "BundleMaster" bm
SET "nFileCount" = sub.cnt
FROM (
  SELECT "nBundleid", count(*) AS cnt
  FROM "BundleDetail"
  WHERE "cStatus" = 'C' AND "nBundleid" IS NOT NULL
  GROUP BY "nBundleid"
) sub
WHERE bm."nBundleid" = sub."nBundleid";

-- ---------------------------------------------------------------------------
-- 3. Backfill recursive counts
-- For each bundle B, sum nFileCount over (B + all descendants).
-- Strategy: build a (root, descendant) closure with cycle guard, then
-- sum nFileCount per root.
-- ---------------------------------------------------------------------------
WITH RECURSIVE descendants AS (
  SELECT
    b."nBundleid" AS root,
    b."nBundleid" AS descendant,
    ARRAY[b."nBundleid"] AS path,
    false AS is_cycle
  FROM "BundleMaster" b
  UNION ALL
  SELECT
    d.root,
    c."nBundleid",
    d.path || c."nBundleid",
    c."nBundleid" = ANY(d.path)
  FROM "BundleMaster" c
  JOIN descendants d ON c."nParentBundleid" = d.descendant
  WHERE NOT d.is_cycle
)
UPDATE "BundleMaster" bm
SET "nFileCountDescendant" = COALESCE(sub.total, 0)
FROM (
  SELECT d.root AS "nBundleid", SUM(child."nFileCount") AS total
  FROM descendants d
  JOIN "BundleMaster" child ON child."nBundleid" = d.descendant
  WHERE NOT d.is_cycle
  GROUP BY d.root
) sub
WHERE bm."nBundleid" = sub."nBundleid";

-- ---------------------------------------------------------------------------
-- 4. Trigger 1 — BundleDetail INS/UPD/DEL maintains nFileCount + ancestors
--    cFileCount changes only on cStatus = 'C' transitions OR nBundleid moves
--    while in status C. Walks ancestors with a cycle guard.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_bundle_filecount_bd_change() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  v_old_b uuid;
  v_new_b uuid;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW."cStatus" = 'C') THEN
    v_new_b := NEW."nBundleid";
  ELSIF (TG_OP = 'DELETE' AND OLD."cStatus" = 'C') THEN
    v_old_b := OLD."nBundleid";
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status flip
    IF OLD."cStatus" IS DISTINCT FROM NEW."cStatus" THEN
      IF NEW."cStatus" = 'C' AND OLD."cStatus" IS DISTINCT FROM 'C' THEN
        v_new_b := NEW."nBundleid";
      ELSIF OLD."cStatus" = 'C' AND NEW."cStatus" IS DISTINCT FROM 'C' THEN
        v_old_b := OLD."nBundleid";
      END IF;
    END IF;
    -- nBundleid move (only counts while in cStatus = 'C')
    IF NEW."cStatus" = 'C' AND OLD."cStatus" = 'C'
       AND OLD."nBundleid" IS DISTINCT FROM NEW."nBundleid" THEN
      v_old_b := OLD."nBundleid";
      v_new_b := NEW."nBundleid";
    END IF;
  END IF;

  IF v_old_b IS NULL AND v_new_b IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Old chain → −1 on direct + every ancestor's descendant count.
  IF v_old_b IS NOT NULL THEN
    UPDATE "BundleMaster" SET "nFileCount" = "nFileCount" - 1
    WHERE "nBundleid" = v_old_b;

    WITH RECURSIVE up AS (
      SELECT "nBundleid", "nParentBundleid",
             ARRAY["nBundleid"] AS path,
             false AS is_cycle
      FROM "BundleMaster" WHERE "nBundleid" = v_old_b
      UNION ALL
      SELECT b."nBundleid", b."nParentBundleid",
             up.path || b."nBundleid",
             b."nBundleid" = ANY(up.path)
      FROM "BundleMaster" b
      JOIN up ON b."nBundleid" = up."nParentBundleid"
      WHERE NOT up.is_cycle
    )
    UPDATE "BundleMaster" bm
    SET "nFileCountDescendant" = bm."nFileCountDescendant" - 1
    FROM up WHERE bm."nBundleid" = up."nBundleid" AND NOT up.is_cycle;
  END IF;

  -- New chain → +1 on direct + every ancestor.
  IF v_new_b IS NOT NULL THEN
    UPDATE "BundleMaster" SET "nFileCount" = "nFileCount" + 1
    WHERE "nBundleid" = v_new_b;

    WITH RECURSIVE up AS (
      SELECT "nBundleid", "nParentBundleid",
             ARRAY["nBundleid"] AS path,
             false AS is_cycle
      FROM "BundleMaster" WHERE "nBundleid" = v_new_b
      UNION ALL
      SELECT b."nBundleid", b."nParentBundleid",
             up.path || b."nBundleid",
             b."nBundleid" = ANY(up.path)
      FROM "BundleMaster" b
      JOIN up ON b."nBundleid" = up."nParentBundleid"
      WHERE NOT up.is_cycle
    )
    UPDATE "BundleMaster" bm
    SET "nFileCountDescendant" = bm."nFileCountDescendant" + 1
    FROM up WHERE bm."nBundleid" = up."nBundleid" AND NOT up.is_cycle;
  END IF;

  RETURN COALESCE(NEW, OLD);
END $fn$;

DROP TRIGGER IF EXISTS trg_bundledetail_filecount ON "BundleDetail";
CREATE TRIGGER trg_bundledetail_filecount
AFTER INSERT OR UPDATE OR DELETE ON "BundleDetail"
FOR EACH ROW EXECUTE FUNCTION fn_bundle_filecount_bd_change();

-- ---------------------------------------------------------------------------
-- 5. Trigger 2 — BundleMaster parent move
--    • On INSERT: set nHierarchyDepth from parent's depth + 1.
--    • On UPDATE of nParentBundleid: transfer the moving subtree's
--      descendant count from old ancestors to new; refresh depth on the
--      moved node and propagate to all its own descendants.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_bundle_parent_move() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  v_subtree_total INT;
  v_new_depth     INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."nParentBundleid" IS NULL THEN
      NEW."nHierarchyDepth" := 0;
    ELSE
      SELECT "nHierarchyDepth" + 1 INTO v_new_depth
      FROM "BundleMaster" WHERE "nBundleid" = NEW."nParentBundleid";
      NEW."nHierarchyDepth" := COALESCE(v_new_depth, 0);
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE — only react if parent really changed.
  IF OLD."nParentBundleid" IS NOT DISTINCT FROM NEW."nParentBundleid" THEN
    RETURN NEW;
  END IF;

  v_subtree_total := COALESCE(NEW."nFileCountDescendant", 0);

  -- Subtract from old ancestor chain (cycle-guarded).
  IF OLD."nParentBundleid" IS NOT NULL AND v_subtree_total > 0 THEN
    WITH RECURSIVE up AS (
      SELECT "nBundleid", "nParentBundleid",
             ARRAY["nBundleid"] AS path, false AS is_cycle
      FROM "BundleMaster" WHERE "nBundleid" = OLD."nParentBundleid"
      UNION ALL
      SELECT b."nBundleid", b."nParentBundleid",
             up.path || b."nBundleid",
             b."nBundleid" = ANY(up.path)
      FROM "BundleMaster" b
      JOIN up ON b."nBundleid" = up."nParentBundleid"
      WHERE NOT up.is_cycle
    )
    UPDATE "BundleMaster" bm
    SET "nFileCountDescendant" = bm."nFileCountDescendant" - v_subtree_total
    FROM up WHERE bm."nBundleid" = up."nBundleid" AND NOT up.is_cycle;
  END IF;

  -- Add to new ancestor chain (cycle-guarded).
  IF NEW."nParentBundleid" IS NOT NULL AND v_subtree_total > 0 THEN
    WITH RECURSIVE up AS (
      SELECT "nBundleid", "nParentBundleid",
             ARRAY["nBundleid"] AS path, false AS is_cycle
      FROM "BundleMaster" WHERE "nBundleid" = NEW."nParentBundleid"
      UNION ALL
      SELECT b."nBundleid", b."nParentBundleid",
             up.path || b."nBundleid",
             b."nBundleid" = ANY(up.path)
      FROM "BundleMaster" b
      JOIN up ON b."nBundleid" = up."nParentBundleid"
      WHERE NOT up.is_cycle
    )
    UPDATE "BundleMaster" bm
    SET "nFileCountDescendant" = bm."nFileCountDescendant" + v_subtree_total
    FROM up WHERE bm."nBundleid" = up."nBundleid" AND NOT up.is_cycle;
  END IF;

  -- Refresh depth for the moved node…
  IF NEW."nParentBundleid" IS NULL THEN
    NEW."nHierarchyDepth" := 0;
  ELSE
    SELECT "nHierarchyDepth" + 1 INTO v_new_depth
    FROM "BundleMaster" WHERE "nBundleid" = NEW."nParentBundleid";
    NEW."nHierarchyDepth" := COALESCE(v_new_depth, 0);
  END IF;

  -- …and cascade depth to its subtree.
  WITH RECURSIVE down AS (
    SELECT NEW."nBundleid"      AS "nBundleid",
           NEW."nHierarchyDepth" AS depth,
           ARRAY[NEW."nBundleid"] AS path,
           false AS is_cycle
    UNION ALL
    SELECT b."nBundleid", d.depth + 1,
           d.path || b."nBundleid",
           b."nBundleid" = ANY(d.path)
    FROM "BundleMaster" b
    JOIN down d ON b."nParentBundleid" = d."nBundleid"
    WHERE NOT d.is_cycle
  )
  UPDATE "BundleMaster" bm
  SET "nHierarchyDepth" = down.depth
  FROM down
  WHERE bm."nBundleid" = down."nBundleid"
    AND bm."nBundleid" <> NEW."nBundleid"
    AND NOT down.is_cycle;

  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_bundlemaster_parent_move ON "BundleMaster";
CREATE TRIGGER trg_bundlemaster_parent_move
BEFORE INSERT OR UPDATE OF "nParentBundleid" ON "BundleMaster"
FOR EACH ROW EXECUTE FUNCTION fn_bundle_parent_move();

-- ---------------------------------------------------------------------------
-- 6. Trigger 3 — BundleMaster delete cascades file-count subtraction
--    Subtract the deleted node's descendant count from every ancestor.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_bundle_delete_cascade() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  IF OLD."nParentBundleid" IS NOT NULL AND OLD."nFileCountDescendant" > 0 THEN
    WITH RECURSIVE up AS (
      SELECT "nBundleid", "nParentBundleid",
             ARRAY["nBundleid"] AS path, false AS is_cycle
      FROM "BundleMaster" WHERE "nBundleid" = OLD."nParentBundleid"
      UNION ALL
      SELECT b."nBundleid", b."nParentBundleid",
             up.path || b."nBundleid",
             b."nBundleid" = ANY(up.path)
      FROM "BundleMaster" b
      JOIN up ON b."nBundleid" = up."nParentBundleid"
      WHERE NOT up.is_cycle
    )
    UPDATE "BundleMaster" bm
    SET "nFileCountDescendant" = bm."nFileCountDescendant" - OLD."nFileCountDescendant"
    FROM up WHERE bm."nBundleid" = up."nBundleid" AND NOT up.is_cycle;
  END IF;
  RETURN OLD;
END $fn$;

DROP TRIGGER IF EXISTS trg_bundlemaster_delete_cascade ON "BundleMaster";
CREATE TRIGGER trg_bundlemaster_delete_cascade
BEFORE DELETE ON "BundleMaster"
FOR EACH ROW EXECUTE FUNCTION fn_bundle_delete_cascade();

-- ---------------------------------------------------------------------------
-- 7. SP update — surface the new columns in et_bundles
--    Same signature, same sort order. Adds nFileCount + nFileCountDescendant
--    + nHierarchyDepth + bHasChildren (cheap EXISTS check) to the result.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 2000;nSectionid uuid;nBundleid uuid;
isAdmin boolean default false;
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := coalesce((parameter ->>'nBundleid')::uuid, null);
nSectionid := (parameter ->>'nSectionid')::uuid;

  select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

OPEN ref1 FOR
with bundle as (
  select ROW_NUMBER() OVER(
    ORDER BY split_hierarchical_sort_multi(b."cBundletag",  ARRAY['.', '-']),
             split_hierarchical_sort_multi(b."cBundlename", ARRAY['.', '-'])
  ) serial,
  b."nBundleid",
  coalesce(b."nParentBundleid", null) "nParentBundleid",
  b."cBundlename",
  b."cBundletag",
  b."nFileCount",
  b."nFileCountDescendant",
  b."nHierarchyDepth",
  EXISTS (
    SELECT 1 FROM "BundleMaster" c WHERE c."nParentBundleid" = b."nBundleid"
  ) AS "bHasChildren"
  from "BundleMaster" b
  left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
  where case when isAdmin then true else p."nBMPid" is null end
    and b."nSectionid" = nSectionid
    and case when nBundleid is not null then b."nParentBundleid" = nBundleid
             else b."nParentBundleid" is null end
)
select * from bundle
order by serial
LIMIT perPage
OFFSET offsetCount
;
RETURN NEXT ref1;

END;
$function$;

COMMIT;
