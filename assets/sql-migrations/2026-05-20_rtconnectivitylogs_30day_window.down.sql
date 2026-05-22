-- 2026-05-20 — Rollback of RTConnectivityLogs 30-day window (Phase 3.1)
--
-- Drops the dDt index. The TRUNCATE in the .up.sql is irreversible without
-- restoring from a snapshot; if data recovery is needed, restore from the
-- pre-migration `pg_dump` taken before applying the .up.sql.

BEGIN;

DROP INDEX IF EXISTS ix_rtconnectivitylogs_ddt;

COMMIT;
