-- Revert 2026-07-01_output_data_export_delete.up.sql
BEGIN;
DROP FUNCTION IF EXISTS public.et_output_data_export_delete(json, refcursor);
COMMIT;
