-- Rollback for 2026-06-08_bundle_index.up.sql
BEGIN;
DROP FUNCTION IF EXISTS public.et_bundle_index(json, refcursor);
COMMIT;
