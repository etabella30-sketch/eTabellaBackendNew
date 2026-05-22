-- 2026-05-20 — BundleMaster.nHierarchyDepth helper column (Phase 2.2)
--
-- Adds a denormalized depth (root = 0, direct child = 1, …) to every
-- BundleMaster row so the frontend / backend can answer "what level am I
-- at?" without a recursive walk. No artificial cap on depth — nesting is
-- user-driven and uncapped.
--
-- Maintenance trigger (auto-update on insert / parent move) is shipped
-- in the Phase 2.3 file-counts migration alongside the related triggers
-- because it shares the parent-move logic. Until 2.3 ships, this column
-- reflects depth ONLY as of the backfill below — new inserts / re-parents
-- leave it at 0 / stale until 2.3 lands. Acceptable because nothing
-- depends on it yet; this migration just makes the column available.
--
-- Rollback: 2026-05-20_bundle_depth.down.sql
-- Run against: dev.etabella.com.uuid first; then etabella.legal.

BEGIN;

ALTER TABLE "BundleMaster"
  ADD COLUMN IF NOT EXISTS "nHierarchyDepth" SMALLINT NOT NULL DEFAULT 0;

-- Backfill via recursive CTE — every bundle gets the distance from its root.
-- No depth cap; the recursion terminates naturally when nParentBundleid
-- chains hit a null. (If the data ever contained a real cycle the recursion
-- would never terminate, but the existing `fun_childers_bundles` and bundle
-- builder logic guard against that, and a separate `et_bundle_parentids`
-- audit can detect cycles if needed.)
WITH RECURSIVE tree AS (
  SELECT "nBundleid", 0 AS depth
  FROM "BundleMaster"
  WHERE "nParentBundleid" IS NULL
  UNION ALL
  SELECT b."nBundleid", t.depth + 1
  FROM "BundleMaster" b
  JOIN tree t ON b."nParentBundleid" = t."nBundleid"
)
UPDATE "BundleMaster" bm SET "nHierarchyDepth" = t.depth
FROM tree t WHERE bm."nBundleid" = t."nBundleid";

COMMIT;
