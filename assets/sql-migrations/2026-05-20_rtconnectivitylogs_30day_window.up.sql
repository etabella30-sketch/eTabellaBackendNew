-- 2026-05-20 — RTConnectivityLogs 30-day rolling window (Phase 3.1, revised)
--
-- Original Phase 3 plan called for a TimescaleDB hypertable with
-- compression + auto-retention. The Vultr-managed Postgres exposes
-- TimescaleDB under the Apache license, which gives us the hypertable
-- mechanism but NOT compression or `add_retention_policy` (both TSL-only).
--
-- Pivot: plain Postgres + a backend cron handles retention instead.
--
-- This migration:
--   1. TRUNCATE the dormant 1.09 M rows (table has had zero inserts since
--      July 2025 — user-confirmed disposable). Frees ~125 MB instantly.
--   2. Add a btree index on dDt so the daily DELETE-by-date stays cheap
--      as new rows accumulate.
--
-- The ongoing nightly cleanup lives in NestJS:
--   apps/coreapi/src/services/maintenance/connectivity-logs-cleanup.service.ts
-- It calls `DELETE FROM "RTConnectivityLogs" WHERE "dDt" < now() - 30d`
-- every night at 03:00.
--
-- Rollback: 2026-05-20_rtconnectivitylogs_30day_window.down.sql (drops the
-- index; the TRUNCATE is irreversible without a restore).

BEGIN;

-- 1. Wipe the dormant historical data.
TRUNCATE TABLE "RTConnectivityLogs";

-- 2. Index dDt for cheap retention DELETEs.
CREATE INDEX IF NOT EXISTS ix_rtconnectivitylogs_ddt
  ON "RTConnectivityLogs" ("dDt");

COMMIT;
