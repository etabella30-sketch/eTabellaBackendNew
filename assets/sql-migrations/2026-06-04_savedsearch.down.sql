-- Down: remove the saved-search feature (table + SPs).
BEGIN;
DROP FUNCTION IF EXISTS public.et_savedsearch_delete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_savedsearch_save(json, refcursor);
DROP FUNCTION IF EXISTS public.et_savedsearch_list(json, refcursor);
DROP TABLE IF EXISTS public."SavedSearch";
COMMIT;
