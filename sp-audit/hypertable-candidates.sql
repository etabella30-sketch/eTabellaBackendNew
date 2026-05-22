-- ============================================================
-- Hypertable candidate analysis — etabella DB
-- Read-only. Identifies tables suitable for TimescaleDB / TigerData.
-- ============================================================

\echo === H1. Insert vs update ratio for ALL non-trivial tables ===
SELECT
  s.schemaname, s.relname,
  s.n_live_tup AS rows,
  pg_size_pretty(pg_total_relation_size(s.relid)) AS total_size,
  s.n_tup_ins AS inserts,
  s.n_tup_upd AS updates,
  s.n_tup_del AS deletes,
  CASE WHEN s.n_tup_ins > 0
       THEN round((100.0 * s.n_tup_upd / s.n_tup_ins)::numeric, 1)
       ELSE NULL END AS upd_per_ins_pct,
  CASE WHEN s.n_tup_ins > 0
       THEN round((100.0 * s.n_tup_del / s.n_tup_ins)::numeric, 1)
       ELSE NULL END AS del_per_ins_pct
FROM pg_stat_user_tables s
WHERE s.n_live_tup > 10000
  AND s.schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(s.relid) DESC
LIMIT 40;

\echo
\echo === H2. Timestamp columns on candidate tables ===
SELECT
  c.table_schema, c.table_name, c.column_name, c.data_type,
  c.is_nullable, c.column_default
FROM information_schema.columns c
WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND (c.data_type LIKE 'timestamp%' OR c.data_type = 'date')
  AND c.table_name IN (
    'BatchlogDetail', 'RTConnectivityLogs', 'LogPagination', 'LogBundleDetail',
    'LogBundleMaster', 'LogSectionMaster', 'LogDashboard', 'UserLog', 'RTLogs',
    'ProcessBatchs', 'PTaskDetail', 'Annotations', 'Notifications',
    'BDAssignment', 'BDAttributes', 'BundleDetail', 'BatchlogMaster',
    'RHighlights', 'RSessionDetail', 'RecentFiles', 'FactDetail',
    'pdf_data', 'tempBDtable', 'UploadDetail', 'ExportDetail',
    'sym_data', 'sym_data_event', 'sym_outgoing_batch'
  )
ORDER BY c.table_schema, c.table_name, c.ordinal_position;

\echo
\echo === H3. Indexes on candidate tables ===
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size((schemaname||'.'||indexname)::regclass)) AS idx_size,
       indexdef
FROM pg_indexes
WHERE tablename IN (
    'BatchlogDetail', 'RTConnectivityLogs', 'LogPagination', 'LogBundleDetail',
    'LogBundleMaster', 'LogSectionMaster', 'LogDashboard', 'UserLog', 'RTLogs',
    'ProcessBatchs', 'PTaskDetail', 'Annotations', 'Notifications',
    'RHighlights', 'RecentFiles', 'pdf_data', 'BatchlogMaster',
    'sym_data', 'sym_data_event'
)
ORDER BY tablename, indexname;

\echo
\echo === H4. Constraints on top candidates (FK + PK + Unique) ===
SELECT
  conrelid::regclass::text AS table_name,
  conname,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
  END AS type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid::regclass::text IN (
  '"BatchlogDetail"', '"RTConnectivityLogs"', '"LogPagination"',
  '"LogBundleDetail"', '"LogBundleMaster"', '"LogSectionMaster"',
  '"LogDashboard"', '"UserLog"', '"RTLogs"', 'download."ProcessBatchs"',
  '"PTaskDetail"', '"Annotations"', '"Notifications"', '"pdf_data"',
  '"RHighlights"', '"RSessionDetail"', '"RecentFiles"',
  '"BatchlogMaster"', 'sym.sym_data', 'sym.sym_data_event'
)
ORDER BY conrelid::regclass::text, contype;

\echo
\echo === H5. Sample column list for the top 5 hypertable candidates ===
SELECT
  c.table_schema, c.table_name, c.column_name,
  c.data_type, c.is_nullable
FROM information_schema.columns c
WHERE c.table_name IN ('BatchlogDetail','RTConnectivityLogs','Annotations','LogPagination','LogBundleDetail','PTaskDetail','UserLog','RTLogs')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;

\echo
\echo === H6. Is TimescaleDB extension available/installed? ===
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name IN ('timescaledb', 'pg_partman', 'pg_cron');
