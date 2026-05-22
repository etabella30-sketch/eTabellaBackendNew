-- ============================================================
-- etabella DB diagnostics — read-only
-- Run against: dev.etabella.com.uuid (or prod if you want)
-- Usage (PowerShell):
--   $env:PGPASSWORD="AVNS_VqdeFp4-sE6s4BCPhoU"
--   & "C:/Program Files/PostgreSQL/17/bin/psql.exe" `
--     "host=public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com port=16751 user=vultradmin dbname=dev.etabella.com.uuid sslmode=require" `
--     -f sp-audit/diagnostics.sql > sp-audit/diagnostics-output.txt
-- ============================================================

\echo === Q1. Connection check ===
SELECT current_database(), current_user, version();

\echo
\echo === Q2. pg_stat_statements available? ===
SELECT name, setting FROM pg_settings WHERE name = 'shared_preload_libraries';
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';

\echo
\echo === Q3. Top 20 SPs / queries by total exec time (skip if pg_stat_statements absent) ===
SELECT
  substr(query, 1, 160) AS query,
  calls,
  round(total_exec_time::numeric, 0) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round((100 * total_exec_time / NULLIF(sum(total_exec_time) OVER (), 0))::numeric, 1) AS pct,
  rows
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
  AND query NOT ILIKE '%pg_catalog%'
ORDER BY total_exec_time DESC
LIMIT 20;

\echo
\echo === Q4. Top 20 SPs by call count ===
SELECT
  substr(query, 1, 160) AS query,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(total_exec_time::numeric, 0) AS total_ms
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

\echo
\echo === Q5. Tables with heavy seq scans (missing indexes) ===
SELECT
  schemaname, relname,
  seq_scan, seq_tup_read,
  idx_scan, idx_tup_fetch,
  n_live_tup,
  CASE WHEN seq_scan + idx_scan > 0
       THEN round(100.0 * seq_scan / (seq_scan + idx_scan), 1)
       ELSE NULL END AS pct_seq
FROM pg_stat_user_tables
WHERE n_live_tup > 1000
ORDER BY seq_tup_read DESC
LIMIT 30;

\echo
\echo === Q6. Table sizes (top 30) ===
SELECT
  schemaname, relname,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
  n_live_tup
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 30;

\echo
\echo === Q7. Unused indexes (dead weight on writes) ===
SELECT s.schemaname, s.relname, s.indexrelname,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size,
       s.idx_scan
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC
LIMIT 30;

\echo
\echo === Q8. Table bloat (autovacuum keeping up?) ===
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC NULLS LAST
LIMIT 30;

\echo
\echo === Q9. Current connection state ===
SELECT application_name, state, wait_event_type, wait_event, count(*)
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY 1, 2, 3, 4
ORDER BY count(*) DESC;

\echo
\echo === Q10. Long-running queries right now ===
SELECT pid, application_name, state,
       now() - query_start AS runtime,
       wait_event_type, wait_event,
       substr(query, 1, 160) AS query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - interval '5 seconds'
ORDER BY query_start;

\echo
\echo === Q11. Stored procedure inventory by schema ===
SELECT n.nspname AS schema, count(*) AS sp_count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
GROUP BY n.nspname
ORDER BY count(*) DESC;

\echo
\echo === Q12. SPs with VOLATILE (default) that are actually read-only ===
\echo (Sample of et_* SPs — full audit already in sp-audit/findings.csv)
SELECT n.nspname AS schema, p.proname AS sp, p.provolatile
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'realtime', 'present', 'transcript')
  AND p.proname LIKE 'et\_%'
  AND p.provolatile = 'v'
LIMIT 30;

\echo
\echo === Q13. Current server tuning (compare to recommended) ===
SELECT name, setting, unit
FROM pg_settings
WHERE name IN (
  'shared_buffers', 'effective_cache_size', 'work_mem', 'maintenance_work_mem',
  'max_connections', 'random_page_cost', 'effective_io_concurrency',
  'autovacuum_vacuum_scale_factor', 'autovacuum_analyze_scale_factor',
  'statement_timeout', 'idle_in_transaction_session_timeout',
  'default_statistics_target', 'log_min_duration_statement', 'jit'
)
ORDER BY name;

\echo
\echo === Q14. Foreign key coverage (how many FK constraints exist?) ===
SELECT
  conrelid::regclass::text AS table_name,
  count(*) AS fk_count
FROM pg_constraint
WHERE contype = 'f'
GROUP BY conrelid::regclass::text
ORDER BY fk_count DESC
LIMIT 30;
