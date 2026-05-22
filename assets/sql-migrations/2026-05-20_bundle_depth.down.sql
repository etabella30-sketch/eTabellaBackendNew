-- 2026-05-20 — Rollback of BundleMaster.nHierarchyDepth helper (Phase 2.2)
--
-- Drops the column. Idempotent.

BEGIN;

ALTER TABLE "BundleMaster" DROP COLUMN IF EXISTS "nHierarchyDepth";

COMMIT;
