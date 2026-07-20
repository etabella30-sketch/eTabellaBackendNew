-- Revert 2026-07-01_expire_downloads.up.sql
-- Drops the expiry function. Does NOT un-expire any rows already flipped to
-- 'X' (that state is intentional and harmless); re-run the app's normal flows
-- or restore from backup if you must resurrect specific jobs.

BEGIN;

DROP FUNCTION IF EXISTS download.et_expire_downloads(json, refcursor);

COMMIT;
