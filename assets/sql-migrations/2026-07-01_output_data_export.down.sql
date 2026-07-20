-- Revert 2026-07-01_output_data_export.up.sql
BEGIN;
DROP FUNCTION IF EXISTS public.et_output_data_export_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_get(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_complete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_insert(json, refcursor);
DROP TABLE IF EXISTS public."OutputDataExport";
COMMIT;
