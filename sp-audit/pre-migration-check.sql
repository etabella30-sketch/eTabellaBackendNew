-- ============================================================
-- Pre-migration safety check for BatchlogDetail → hypertable
-- READ-ONLY. Run this BEFORE the CREATE EXTENSION / create_hypertable script.
-- ============================================================

\echo === C1. Does SymmetricDS replicate BatchlogDetail? ===
\echo (If anything returns here, the hypertable conversion may break replication.)
SELECT trigger_id, source_table_name, source_schema_name, channel_id, sync_on_insert, sync_on_update, sync_on_delete
FROM sym.sym_trigger
WHERE source_table_name ILIKE '%batchlog%'
   OR source_table_name = 'BatchlogDetail';

\echo
\echo === C2. Active triggers ON BatchlogDetail (any source) ===
SELECT tgname, tgenabled, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = '"BatchlogDetail"'::regclass
  AND NOT tgisinternal;

\echo
\echo === C3. Date range of existing data (retention impact preview) ===
\echo (rows older than 2 years would be DROPPED by the retention policy.)
SELECT
  min(change_time) AS oldest_row,
  max(change_time) AS newest_row,
  count(*) AS total_rows,
  count(*) FILTER (WHERE change_time < now() - INTERVAL '2 years') AS rows_older_than_2y,
  count(*) FILTER (WHERE change_time < now() - INTERVAL '1 year')  AS rows_older_than_1y,
  count(*) FILTER (WHERE change_time < now() - INTERVAL '6 months') AS rows_older_than_6m
FROM "BatchlogDetail";

\echo
\echo === C4. Foreign keys touching BatchlogDetail ===
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid = '"BatchlogDetail"'::regclass
       OR confrelid = '"BatchlogDetail"'::regclass);

\echo
\echo === C5. Indexes that include the PK column ===
\echo (Each one will need rebuilding if we change the PK.)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'BatchlogDetail';

\echo
\echo === C6. View/SP dependencies on BatchlogDetail ===
SELECT DISTINCT
  n.nspname AS dep_schema,
  c.relname AS dep_object,
  c.relkind AS kind  -- r=table, v=view, m=matview
FROM pg_depend d
JOIN pg_rewrite r ON r.oid = d.objid
JOIN pg_class c ON c.oid = r.ev_class
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE d.refobjid = '"BatchlogDetail"'::regclass
  AND d.deptype = 'n'
  AND c.relname <> 'BatchlogDetail';

\echo
\echo === C7. SPs that reference BatchlogDetail (source scan) ===
SELECT n.nspname AS schema, p.proname AS sp_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE pg_get_functiondef(p.oid) ILIKE '%BatchlogDetail%'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;
