-- Revert 2026-07-01_processmaster_jinclude.up.sql
-- Drops the jInclude column. The insert SP keeps referencing "jInclude" only if
-- re-applied; to fully revert restore the prior et_insert_download_process from
-- sp-audit. Dropping the column alone would break the current insert SP, so this
-- is intentionally left as a column-drop guard — re-apply the up migration to fix.
BEGIN;
ALTER TABLE download."ProcessMaster" DROP COLUMN IF EXISTS "jInclude";
COMMIT;
