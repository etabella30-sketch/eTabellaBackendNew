-- Revert 2026-07-01_case_doclinks.up.sql
BEGIN;
DROP FUNCTION IF EXISTS public.et_case_doclinks(json, refcursor);
COMMIT;
