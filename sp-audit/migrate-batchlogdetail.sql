-- ============================================================
-- BatchlogDetail → TimescaleDB hypertable migration
-- Target: dev.etabella.com.uuid on Vultr
-- Run after pre-migration-check.sql confirms safety.
-- ============================================================

\echo === M1. Verify change_time has no NULLs (required for PK) ===
SELECT count(*) AS null_change_time_rows
FROM "BatchlogDetail"
WHERE change_time IS NULL;

\echo
\echo === M2. PK swap in one transaction ===
BEGIN;
ALTER TABLE "BatchlogDetail" ALTER COLUMN change_time SET NOT NULL;
ALTER TABLE "BatchlogDetail" DROP CONSTRAINT "BatchlogDetail_pkey";
ALTER TABLE "BatchlogDetail" ADD PRIMARY KEY (change_time, "nBLid");
COMMIT;

\echo
\echo === M3. Verify new PK ===
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = '"BatchlogDetail"'::regclass AND contype = 'p';

\echo
\echo === M4. Convert to hypertable ===
\echo (This will migrate 3.29M rows into 7-day chunks — may take a few minutes.)
\timing on
SELECT create_hypertable('"BatchlogDetail"', 'change_time',
  chunk_time_interval => INTERVAL '7 days',
  migrate_data => true);
\timing off

\echo
\echo === M5. Verify hypertable + chunk count ===
SELECT hypertable_name, num_chunks, compression_enabled, tablespaces
FROM timescaledb_information.hypertables
WHERE hypertable_name = 'BatchlogDetail';

SELECT count(*) AS chunk_count,
       min(range_start) AS oldest_chunk,
       max(range_end) AS newest_chunk
FROM timescaledb_information.chunks
WHERE hypertable_name = 'BatchlogDetail';

\echo
\echo === M6. Index for entity-based queries ===
\echo (segmentby column needs an index for compression + fast lookup)
CREATE INDEX IF NOT EXISTS ix_batchlogdetail_nbundledetailid_time
  ON "BatchlogDetail" ("nBundledetailid", change_time DESC);

\echo
\echo === M7. Enable compression ===
ALTER TABLE "BatchlogDetail" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = '"nBundledetailid"',
  timescaledb.compress_orderby = 'change_time DESC'
);

\echo
\echo === M8. Compression policy (chunks older than 30 days) ===
SELECT add_compression_policy('"BatchlogDetail"', INTERVAL '30 days');

\echo
\echo === M9. Retention policy (drop chunks older than 2 years) ===
\echo (Current oldest row is 2024-12-26 — nothing dropped today.)
SELECT add_retention_policy('"BatchlogDetail"', INTERVAL '2 years');

\echo
\echo === M10. Total size after conversion ===
SELECT pg_size_pretty(pg_total_relation_size('"BatchlogDetail"')) AS total_size,
       pg_size_pretty(hypertable_size('"BatchlogDetail"'::regclass)) AS hypertable_size;
