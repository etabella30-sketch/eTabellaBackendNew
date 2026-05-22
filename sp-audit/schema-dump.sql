-- ============================================================
-- Schema dump — etabella DB
-- Read-only. Lists tables, columns, PKs, FKs, indexes per schema.
-- ============================================================

\echo === S1. Tables per schema (excluding SymmetricDS) ===
SELECT
  schemaname,
  count(*) AS table_count,
  pg_size_pretty(sum(pg_total_relation_size((schemaname||'."'||tablename||'"')::regclass))) AS total_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'sym')
GROUP BY schemaname
ORDER BY sum(pg_total_relation_size((schemaname||'."'||tablename||'"')::regclass)) DESC;

\echo
\echo === S2. Tables in public schema (business core) ===
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(('public."'||tablename||'"')::regclass)) AS size,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name=t.tablename) AS cols
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(('public."'||tablename||'"')::regclass) DESC;

\echo
\echo === S3. Tables in realtime schema (RT module) ===
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(('realtime."'||tablename||'"')::regclass)) AS size,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='realtime' AND table_name=t.tablename) AS cols
FROM pg_tables t
WHERE schemaname = 'realtime'
ORDER BY pg_total_relation_size(('realtime."'||tablename||'"')::regclass) DESC;

\echo
\echo === S4. Tables in other schemas ===
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size((schemaname||'."'||tablename||'"')::regclass)) AS size
FROM pg_tables
WHERE schemaname IN ('present', 'task', 'helpcenter', 'download', 'transcript', 'elastic', 'upload')
ORDER BY schemaname, pg_total_relation_size((schemaname||'."'||tablename||'"')::regclass) DESC;

\echo
\echo === S5. All columns for key business tables ===
SELECT
  c.table_schema AS schema,
  c.table_name AS table,
  c.ordinal_position AS pos,
  c.column_name AS column,
  c.data_type AS type,
  c.is_nullable AS null_ok,
  c.column_default AS default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'CaseMaster', 'UserMaster', 'TeamRelation', 'RoleMaster',
    'BundleMaster', 'BundleDetail', 'BDAttributes', 'BDAssignment', 'BDPermission',
    'DocMaster', 'DocDetail', 'DMShared', 'DMLinks',
    'FactMaster', 'FactDetail', 'FMShared', 'FMIssue', 'FMLinks',
    'RSessionMaster', 'RSessionDetail', 'RIssueMaster', 'RIssueDetail',
    'IssueCategory', 'RHighlights', 'RHighlightMapid',
    'Annotations', 'HyperLink', 'Notifications', 'RecentFiles',
    'UserPermission', 'UserLog',
    'BatchlogDetail', 'BatchlogMaster',
    'pdf_data', 'UploadDetail'
  )
ORDER BY c.table_schema, c.table_name, c.ordinal_position;

\echo
\echo === S6. Primary keys (all schemas except sym) ===
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS pk_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE con.contype = 'p'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'sym', '_timescaledb_internal', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_cache', 'timescaledb_information', 'timescaledb_experimental')
ORDER BY n.nspname, c.relname;

\echo
\echo === S7. Foreign keys (all schemas) ===
SELECT
  n.nspname || '.' || c.relname AS from_table,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE con.contype = 'f'
ORDER BY n.nspname, c.relname;

\echo
\echo === S8. Views ===
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', '_timescaledb_internal', 'timescaledb_information', 'timescaledb_experimental')
ORDER BY table_schema, table_name;

\echo
\echo === S9. Materialized views ===
SELECT schemaname, matviewname,
       pg_size_pretty(pg_total_relation_size((schemaname||'.'||matviewname)::regclass)) AS size
FROM pg_matviews
ORDER BY schemaname, matviewname;
