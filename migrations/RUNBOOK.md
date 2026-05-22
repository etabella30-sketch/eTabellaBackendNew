# Migration Runbook — `etabella_tech_uuid` → `dev_etabella_com_uuid`

Generated 2026-05-08. Consolidates 14 source files from `assets/sql-migrations/` into a single transactional script. Last updated 2026-05-09 (blocks 13 — case_transcript_mode, 14 — upload_publish_cstatus).

## Files in this folder

| File | Purpose |
|---|---|
| `dev_etabella_com_uuid_2026-05-05.sql` | The migration. Single transaction. Idempotent. |
| `RUNBOOK.md` | This document. |

## What's included vs excluded

**Included (14 blocks, in apply order):**
1. `2026-04-15` ctransferstatus_column — adds `cTransferStatus` column on 4 annotation tables
2. `2026-04-17` sweep_false_positive_transfers — global data sweep, idempotent
3. `2026-04-20` et_marks_left_join_issue — final `et_marks` SP
4. `2026-04-21` export_issue_filter — applies jIssues/jHIssues filters in export
5. `2026-04-29` admin_update_bundledetail_dintrestdt_text — varchar fix
6. `2026-04-29` batchfile_update_blogid_guard — bootstraps Batchlog row
7. `2026-04-29` qfact_user_pref — new table `RUserQFactPref` + upsert SP
8. `2026-04-29` qfact_user_claim_pref — new table `RUserQFactClaimPref` + upsert SP
9. `2026-04-30` unassigned_issue_seed — new SP + backfill loop over all cases
10. `2026-04-30` unassigned_visibility_sp_patch — patches `et_realtime_issuelist_group`
11. `2026-05-05` notification_list_bundle_enrichment — patches `et_notification_list`
12. `2026-05-08` marknav_team_user_admin_visibility — patches `et_marknav_team_user` so admin/top-role callers see teammates in the picker
13. `2026-05-09` case_transcript_mode — adds `CaseMaster.cTranscriptMode` (existing rows backfill to `'PDF'`, future inserts default to `'HTML'`); patches `et_admin_insertupdate_case` and `et_admin_case_getdetail`
14. `2026-05-09` upload_publish_cstatus — patches `et_realtime_transcript_upload_status` so the upload-publish path (`cFlag='P'`) sets `RSessionMaster.cStatus='P'` (was setting `isUploaded`+`isTranscript` only); patches `realtime.et_realtime_sessiondata` so it returns `isTrans` computed from row data instead of an always-false local var; backfills already-affected rows so the deployed UI starts treating them as published

**Excluded (with rationale):**
- `2026-04-15_et_marks_distinct.sql` — superseded by block 03
- `2026-04-15_et_marks_hide_orphans.sql` — superseded by block 03
- `2026-04-15_et_marks_hide_untransferred.sql` — superseded by block 03
- `2026-04-17_et_marks_revert_fallback.sql` — superseded by block 03
- `2026-04-17_day1_orphan_cleanup.sql` — source-DB-specific data fix; contains unfilled `<DAY-1-NSESID>` placeholder; the rows it targets do not exist in `dev_etabella_com_uuid`

## Connection

Same Vultr Postgres host + credentials for both databases (per `.env.development`).

```
host:     public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com
port:     16751
user:     vultradmin
password: AVNS_VqdeFp4-sE6s4BCPhoU
ssl:      required
```

## Pre-flight (mandatory)

### 1. Backup the target

```bash
mkdir -p backups

PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' \
pg_dump --host=public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
        --port=16751 \
        --username=vultradmin \
        --dbname=dev_etabella_com_uuid \
        --no-owner --no-acl \
        --format=custom \
        --file="backups/dev_etabella_com_uuid_$(date +%Y%m%d_%H%M%S).dump"
```

This is custom-format. Restore with `pg_restore` if rollback is needed.

### 2. Confirm target DB exists and is reachable

```bash
PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' psql \
  -h public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
  -p 16751 -U vultradmin -d dev_etabella_com_uuid \
  -c "SELECT current_database(), current_user, version();"
```

If this fails, **stop**. Either the DB name is wrong or the host is unreachable. Don't continue.

### 3. (Recommended) Dry-run inspect

Open the file and skim — every block has a `── NN/14 ──` header so you can navigate. Look at the `ALTER TABLE` calls (four in block 01 + one in block 13), the `DO $$ ... $$;` backfill in block 09, and the `UPDATE "RSessionMaster"` in block 14 — those are the only mutating-on-first-run blocks. Block 13 also has its own column-default flip and a `CHECK` constraint creation. Everything else is `CREATE OR REPLACE`.

## Apply

```bash
PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' psql \
  -h public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
  -p 16751 -U vultradmin -d dev_etabella_com_uuid \
  --set ON_ERROR_STOP=on \
  -f migrations/dev_etabella_com_uuid_2026-05-05.sql 2>&1 \
  | tee "migrations/apply_log_$(date +%Y%m%d_%H%M%S).log"
```

- `ON_ERROR_STOP=on` aborts on the first error (and the surrounding `BEGIN`/`COMMIT` rolls everything back).
- `tee` captures the full log so you can attach it to the deploy ticket.

## Post-flight verification

```bash
PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' psql \
  -h public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
  -p 16751 -U vultradmin -d dev_etabella_com_uuid <<'SQL'

-- 1. Schema: new column on all four annotation tables
SELECT table_name, column_name, data_type, character_maximum_length
  FROM information_schema.columns
 WHERE column_name = 'cTransferStatus'
 ORDER BY table_name;
-- expect: DocDetail, FactDetail, RHighlights, RIssueDetail

-- 2. New tables exist IN PUBLIC schema (must be public — the consumer SP
--    et_realtime_issuelist_group references them as public.* and errors if
--    they live in `sym` instead, which is what happens on a role whose
--    search_path is `sym, public` and the migration's CREATE TABLE was
--    unqualified. Blocks 07/08 now schema-qualify and include a sym→public
--    relocation block, but verify here too).
SELECT to_regclass('public."RUserQFactPref"')      AS qfact_pref_public,
       to_regclass('public."RUserQFactClaimPref"') AS qfact_claim_pref_public,
       to_regclass('sym."RUserQFactPref"')         AS qfact_pref_sym_must_be_null,
       to_regclass('sym."RUserQFactClaimPref"')    AS qfact_claim_pref_sym_must_be_null;
-- expect: first two non-null; last two NULL.

-- 2b. Block 09 colour normalization — every system Unassigned issue should
--     be FFFF00 (yellow). Pre-migration this was 'e9e90e' / 'FFA94D' / mixed.
SELECT i."cColor", count(*) AS n_unassigned_issues
  FROM "RIssueMaster" i
  JOIN "IssueCategory" c ON c."nICid" = i."nICid"
 WHERE c."cICtype" = 'U' AND c."cCategory" = 'Unassigned' AND i."cIName" = 'Unassigned'
 GROUP BY i."cColor";
-- expect: a single row, cColor = 'FFFF00'.

-- 3. Functions present
SELECT n.nspname AS schema, p.proname AS function
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE p.proname IN (
       'et_marks',
       'et_realtime_get_issue_annotation_highlight_export',
       'et_admin_update_bundledetail',
       'et_batchfile_update',
       'et_realtime_handle_qfact_secquence',
       'et_realtime_handle_qfact_claim_secquence',
       'et_realtime_ensure_unassigned_issue',
       'et_realtime_issuelist_group',
       'et_notification_list',
       'et_marknav_team_user',
       'et_admin_insertupdate_case',
       'et_admin_case_getdetail'
 )
 ORDER BY n.nspname, p.proname;
-- expect: 12 rows (et_marks + handle_qfact_* + et_marknav_team_user in 'realtime'
-- schema; rest in 'public')

-- 3b. Block 13 — column + constraint + SP shape
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_name = 'CaseMaster' AND column_name = 'cTranscriptMode';
-- expect: varchar(8), default 'HTML', NOT NULL

SELECT conname FROM pg_constraint WHERE conname = 'CaseMaster_cTranscriptMode_chk';
-- expect: one row

SELECT "cTranscriptMode", COUNT(*) FROM "CaseMaster" GROUP BY "cTranscriptMode";
-- expect: a single row with cTranscriptMode='PDF' and the count = total cases.
-- After any new case is created post-migration, you'll also see a row for 'HTML'.

SELECT (POSITION('"cTranscriptMode"' IN pg_get_functiondef(oid)) > 0) AS getdetail_returns_mode
  FROM pg_proc WHERE proname = 'et_admin_case_getdetail';
-- expect: t (true)

SELECT (POSITION('''HTML''' IN pg_get_functiondef(oid)) > 0) AS insertupdate_writes_html
  FROM pg_proc WHERE proname = 'et_admin_insertupdate_case';
-- expect: t (true)

-- 3c. Block 14 — upload-publish SP includes cStatus='P' on cFlag='P' branch
SELECT (POSITION('"cStatus" = ''P''' IN pg_get_functiondef(oid)) > 0)
       AS upload_publish_sets_cstatus
  FROM pg_proc WHERE proname = 'et_realtime_transcript_upload_status';
-- expect: t (true)

-- 3d. Block 14 — sessiondata SP (realtime schema) computes isTrans from row data
SELECT (POSITION('isTranscript" AND r."isUploaded' IN pg_get_functiondef(p.oid)) > 0)
       AS sessiondata_computes_istrans
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE p.proname = 'et_realtime_sessiondata' AND n.nspname = 'realtime';
-- expect: t (true)

-- 3e. Block 14 — backfill landed: no half-published sessions remain
SELECT COUNT(*) AS half_published_remaining
  FROM "RSessionMaster"
 WHERE "isTranscript" = true
   AND "isUploaded"   = true
   AND ("cStatus" IS NULL OR "cStatus" <> 'P')
   AND "dDelDt" IS NULL;
-- expect: 0

-- 5. Block 12 — confirm the marknav SP was rewritten with the team-relation logic
SELECT (POSITION('isAdmin AND tr.' IN pg_get_functiondef(oid)) > 0) AS has_admin_team_predicate,
       (POSITION('LEFT JOIN "TeamRelation"' IN pg_get_functiondef(oid)) > 0) AS has_team_relation_join
  FROM pg_proc
 WHERE proname = 'et_marknav_team_user';
-- expect: both columns return t (true)

-- 4. Backfill landed: every case has an Unassigned issue
SELECT COUNT(*) AS cases_total,
       COUNT(*) FILTER (
           WHERE EXISTS (
               SELECT 1
                 FROM "IssueCategory" ic
                 JOIN "RIssueMaster"  i ON i."nICid" = ic."nICid"
                WHERE ic."nCaseid"   = cm."nCaseid"
                  AND ic."cICtype"   = 'U'
                  AND ic."cCategory" = 'Unassigned'
                  AND i."cIName"     = 'Unassigned'
           )
       ) AS cases_with_unassigned
  FROM "CaseMaster" cm;
-- expect: cases_total = cases_with_unassigned

SQL
```

If any check fails, capture the output, **do not retry** automatically — investigate manually and either re-apply the specific block or restore from backup.

## Rollback

The migration runs inside a single `BEGIN`/`COMMIT`. If `ON_ERROR_STOP=on` triggers, nothing was committed — just re-attempt after fixing the cause.

If a successful apply needs to be reverted (a schema change misbehaves in production), restore from the dump taken in pre-flight:

```bash
# DESTRUCTIVE: this drops + recreates tables that pg_restore touches.
# Only do this on the target. Triple-check the DB name.

PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' \
pg_restore --host=public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
           --port=16751 \
           --username=vultradmin \
           --dbname=dev_etabella_com_uuid \
           --clean --if-exists \
           --no-owner --no-acl \
           backups/dev_etabella_com_uuid_<timestamp>.dump
```

For partial rollback (just one block), each source file in `assets/sql-migrations/` has its own `-- Rollback` section with the inverse `DROP FUNCTION` / `DROP TABLE` / inverse `CREATE OR REPLACE` snippet.

## Idempotency note

Re-running the consolidated script on a fully-applied target is safe:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` → no-op
- `CREATE OR REPLACE FUNCTION` → re-installs the same body
- `CREATE TABLE IF NOT EXISTS` → no-op
- The Unassigned backfill `DO` block has a `NOT EXISTS` guard → no-op
- The 60s-gap data sweep updates only rows still violating the rule → no-op once clean

## What this script does NOT do

- **No application restarts.** Backend services run their own connection pools and pick up new SP definitions on the next call. If a particular service caches schema metadata aggressively, restart it manually.
- **No frontend deploy.** Some of these SPs are paired with frontend changes already shipped on the `new_selection_mode` branch. Frontend rebuild/deploy is a separate step.
- **No Day-1 orphan cleanup** (the `<DAY-1-NSESID>` migration). That data exists only on `etabella_tech_uuid` and was a one-shot fix for a specific session there.
