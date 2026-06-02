-- Rollback for 2026-06-02_bundle_name_search.up.sql
--
-- Drops the folder-search SP and the two trigram indexes it introduced.
-- Intentionally leaves in place:
--   • ix_bundlemaster_section / ix_bundlemaster_parent — generic supporting
--     btrees that other queries (et_bundles, the file-count triggers) benefit
--     from; remove manually only if you are sure nothing else relies on them.
--   • the pg_trgm extension — shared by other trigram-based search SPs.
--
-- Run against: 3.0.etabella.com.uuid (the active DB in .env.development).

BEGIN;

DROP FUNCTION IF EXISTS public.et_bundle_search(json, refcursor);

DROP INDEX IF EXISTS ix_bundlemaster_bundlename_trgm;
DROP INDEX IF EXISTS ix_bundlemaster_bundletag_trgm;

COMMIT;
