# Runbook — `prod_etabella_com_uuid_2026-09-15.sql` (dev → LIVE `etabella.com.uuid`)

Plan and rationale: `PROD-MIGRATION-PLAN-2026-09-15.md`. This file is the "just do it" checklist.
No credentials in this file. psql reads the password from `%APPDATA%\postgresql\pgpass.conf`:

```
db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com:25060:etabella.com.uuid:doadmin:<password>
```

## Files

| File | Purpose |
|---|---|
| `prod_etabella_com_uuid_2026-09-15.sql` | THE migration. Pre-flight → one transaction → indexes → verify. Idempotent, re-run safe. |
| `preflight_readonly_prod_2026-09-15.sql` | SELECT-only state check (same classification as the script's pre-flight). Run any time. |
| `rollback_prod_etabella_com_uuid_2026-09-15.sql` | Restores every replaced function to its pre-migration body, drops new functions/triggers/indexes. Keeps new tables/columns. |
| `apply_log_prod_<ts>.log` | Produced by the run below. Attach to the deploy note. |

## What it changes (142 tracked objects)

- 89 functions `CREATE OR REPLACE` (31 new, 58 changed) + drops the old `et_dashboard(json, 4×refcursor)` overload
- 3 new tables: `OutputDataExport`, `SavedSearch`, `WorkspaceView` (+ primary keys)
- 21 new columns on 10 tables (`BundleMaster`, `CaseMaster`, `ContactMaster`, `ExportMaster`, `FactDetail`, `IssueCategory`, `RIssueMaster`, `SectionMaster`, `TaskDetail`, `download.ProcessMaster`) — all nullable or defaulted
- 15 indexes, built `CONCURRENTLY` after the commit (7 trigram search indexes on `BundleDetail`/`BundleMaster`)
- 3 triggers (bundle file-count maintenance)
- `Codemaster`: 10 new codes (Source Type ×5, Dispute ×2, Review Status ×3) with fresh ids; 14 relabels (Impact "Heavily → Strongly", Source Type renames, retire Unsure/Neutral/Stipulated/Alleged/Tentative)
- Backfills: `BundleMaster` depth + file counts (recomputed), `SectionMaster.nSectionOrder` (NULL rows), `Annotations.nBDid` (NULL rows)
- NOT touched: any SymmetricDS object, `RTConnectivityLogs`, any user data.

## Expected pre-flight on live (before running)

| Status | Meaning | Expected for |
|---|---|---|
| `PENDING` | live == 2026-05-19 body, will be replaced | most functions, all columns/tables/indexes/triggers/codes |
| `PENDING (new)` | does not exist yet | 31 functions, 3 tables … |
| `PENDING (known live version)` | live == the roman-only `et_bundles` applied by hand on 1 Sep | `public.et_bundles` only |
| `DONE` | live already equals dev | the 13 marks-private SPs (deployed 7 Jul), `et_index_getfiles`, `roman_to_int` |
| `DRIFT` | live matches neither old nor new body → **stop and tell Claude** | none expected |

Any `DRIFT` aborts the script before the transaction opens. Only override with `-v allow_drift=1` after the drifted SP has been looked at (it would be overwritten with dev's body).

## Steps

1. **Pre-flight only (read-only, 2 s):**
   ```bash
   export PGSSLMODE=require
   psql -h db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com -p 25060 -U doadmin -d etabella.com.uuid \
        -v ON_ERROR_STOP=1 -f migrations/preflight_readonly_prod_2026-09-15.sql
   ```
   Confirm the status table matches the table above (no `DRIFT`, no `MISSING-ON-LIVE?`).

2. **Backup live** (custom format, restorable with `pg_restore`):
   ```bash
   pg_dump -h db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com -p 25060 -U doadmin -d etabella.com.uuid \
           --no-owner --no-acl -Fc -f "backups/etabella.com.uuid_before_2026-09-15_$(date +%Y%m%d_%H%M%S).dump"
   ```

3. **Apply:**
   ```bash
   psql -h db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com -p 25060 -U doadmin -d etabella.com.uuid \
        -v ON_ERROR_STOP=1 -f migrations/prod_etabella_com_uuid_2026-09-15.sql 2>&1 \
        | tee "migrations/apply_log_prod_$(date +%Y%m%d_%H%M%S).log"
   ```
   Options (append `-v name=1`): `preflight_only` (stop after the check), `allow_drift`, `skip_relabel`, `skip_backfill`, `skip_indexes`.
   Last lines must read `pass | fail | total` with `fail = 0` and `NOTICE: ==================== ALL CHECKS PASSED`.
   The index section can take a few minutes on `BundleDetail`; it holds no table locks.

4. **If it stops:**
   - Before `BEGIN;` (guard / DRIFT / preflight_only): nothing changed.
   - Inside the transaction: psql exits on the first error, the connection closes, everything rolls back. Send the log to Claude.
   - After `COMMIT;` (an index or verify failure): the schema changes are in. Re-running the script is safe (idempotent) once the cause is fixed; or run the rollback file.

5. **Deploy the paired services**, in this order: coreapi → realtimeapi / realtime-server → downloadapi → export service → Angular frontend. The DB side is backward compatible, so old services keep working until each is redeployed.

6. **Smoke test:** Evidence list + search · Master Index regenerate (roman order kept) · Full Fact → Review Status dropdown shows Open / In Review / Finalized · claim/issue form fields · Workspace participants / tasks / saved views · Outputs download + export · Admin case detail + hearing schedule · Dashboard.

## Rollback

```bash
psql -h db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com -p 25060 -U doadmin -d etabella.com.uuid \
     -v ON_ERROR_STOP=1 -f migrations/rollback_prod_etabella_com_uuid_2026-09-15.sql
```
Restores all 58 changed functions to their pre-migration bodies (`et_bundles` to the 1 Sep roman-only version), restores the old `et_dashboard` overload, drops the 31 new functions, 3 triggers, 15 indexes, reverses the 14 relabels. New tables/columns and inserted codes stay (harmless, data-preserving). Full restore = `pg_restore --clean` from the step-2 dump.

## Proven so far

- 2026-09-15: the full script ran on dev `etabella_tech_uuid` inside a rolled-back transaction (guard and COMMIT swapped): exit 0, 142/142 PASS, `ALL CHECKS PASSED`. Same for the rollback file. Dev itself was untouched.
- Not yet run against a copy of live data. Optional extra safety: restore the step-2 dump into local PostgreSQL 17 as `etabella_rehearsal`, change nothing but the guard's DB name, run, confirm PASS, then run for real.
