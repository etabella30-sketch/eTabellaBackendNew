-- Rollback of 2026-11-03_fact_save_single_call.up.sql. Set FACT_SAVE_SINGLE_CALL off (or unset) and restart the
-- realtime server first: the old path does not use these functions.
DROP FUNCTION IF EXISTS realtime.et_fact_save_full(json, refcursor);
DROP FUNCTION IF EXISTS realtime.et_fact_save_quick(json, refcursor);
DROP FUNCTION IF EXISTS realtime.et_fact_save_published_flag(uuid, uuid);
