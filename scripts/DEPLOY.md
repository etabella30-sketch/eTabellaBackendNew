# Backend Deployment Guide — May 2026 RT/Publish Fixes

## What's in this deploy

Bundles 5 fix areas into a single backend deploy:

| # | Fix area |
|---|---|
| A | Annotation page/line not updated after transcript publish |
| B | Admin "Published" button forgot to set `cStatus='P'` |
| C | Upload-published sessions stuck at `cStatus='C'` |
| D | New facts on published view invisible (orphan-filter regression) |
| E | Bundle column hide per-case (`CaseMaster.bHideBundleColumn`) |

Bonus fixes for resilience (no DB impact, just code):
- Realtime socket auto-rejoin on reconnect + room tracking
- Browser online/offline force-reconnect
- HTTP request 30s timeout (in interceptor — frontend only)
- Connection-status toast UI

---

## Pre-deploy checklist

- [ ] Confirm DB connection details for the target environment (host, port, user, db)
- [ ] Confirm SSH access to the backend server(s)
- [ ] Confirm PM2 is running and you have permission to restart apps
- [ ] Take a database snapshot / backup (the script is transactional and idempotent, but a snapshot is cheap insurance)
- [ ] Check disk space on the backend server (build artifacts ≈ 200 MB extra)

---

## Step-by-step deployment

### 1. Pull the latest code

```bash
cd /path/to/etabella_backend-tech
git fetch origin
git checkout <branch-or-tag>
git pull
```

### 2. Run the database migration

**One single script** runs all DDL + SP + backfill in a transaction:

```bash
psql -h <db-host> -p <db-port> -U <db-user> -d <db-name> \
     -v ON_ERROR_STOP=1 \
     -f scripts/deploy_publish_annot_fix.sql
```

What you should see at the end:

```
   schema   |          function           | status
------------+-----------------------------+--------
 public     | et_admin_case_getdetail     | OK
 realtime   | et_fact_get_detail_single   | OK
 realtime   | et_factsheet_detail         | OK
 realtime   | et_marknav_doclinks         | OK
 realtime   | et_navigate_factlist        | OK
 realtime   | et_navigate_facts_bycompany | OK
 realtime   | et_navigate_get_all         | OK
 transcript | et_transcript_publish       | OK
(8 rows)

 Step 1a: FactDetail.nTLine rows backfilled  ──────  N
 Step 1b: DocDetail.nTLine rows backfilled   ──────  N
 Step 2 : RSessionMaster cStatus flipped     ──────  N
 Step 3a: FactDetail rows seeded             ──────  N
 Step 3b: DocDetail rows seeded              ──────  N

   table    | transferred_rows | rows_with_nTLine | rows_still_missing_nTLine
 FactDetail |              ... |              ... |                         0
 DocDetail  |              ... |              ... |                         0

 cStatus | upload_published_sessions
 P       |                       ...

COMMIT
```

The key things to verify:
- **8 SPs reported `OK`** (all functions compiled cleanly)
- **`rows_still_missing_nTLine` = 0** for both tables
- **Only `cStatus='P'` rows** in the upload-published distribution
- Final line says `COMMIT` (transaction succeeded, NOT `ROLLBACK`)

If anything looks off, the entire transaction was rolled back automatically by `-v ON_ERROR_STOP=1` and the database is unchanged. Investigate the error and re-run.

The script is **idempotent** — re-running on an already-migrated DB will report 0 rows for every backfill step and nothing changes.

### 3. Sync the Python annotation-transfer script

`run3.py` is interpreted at runtime (spawned per publish), not built into any microservice. It must exist on the backend server's filesystem at the path referenced by `PY_ANNOT_TRANSFER_BY_TRANSCRIPT` env var.

```bash
# From the repo root (where you pulled the latest code)
# Adjust the destination path to match your server's REALTIME_PATH / Python assets dir
rsync -av assets/pythons/annot-transfer/ user@server:/path/to/server/assets/pythons/annot-transfer/

# OR, if the repo is checked out directly on the server:
git pull   # the new run3.py is already on disk
```

**No restart needed for Python changes** — the next publish will spawn a fresh Python process that re-reads `run3.py` from disk.

### 4. Install dependencies (if package.json changed)

For this deploy, `package.json` was **not** modified, so this step can be skipped. Run only if `npm ci` would otherwise reject:

```bash
npm install --force
```

### 5. Build the affected microservices

```bash
# Production build:
npm run build:prod

# OR development build:
npm run build:dev
```

This compiles all microservices. Build output lands in `dist/`.

### 6. Restart the affected microservices

Three microservices changed and need restart:

| Service | Why |
|---|---|
| `realtime-server` | `fact.service.ts`, `doclink.service.ts`, `session.service.ts`, `events.gateway.ts`, DTOs |
| `coreapi` | DTO additions (`marknav.interface.ts`, `navigation.interface.ts`, `case.interface.ts`) |
| `export` | `export-file.service.ts` now passes `bIsTranscipt` |

Restart with PM2:

```bash
pm2 restart realtime-server
pm2 restart coreapi
pm2 restart export

# verify they're up
pm2 status
```

The other 11 microservices (`authapi`, `indexapi`, `pagination`, `download`, `presentation`, `upload`, `hyperlink`, `socket-app`, `batchfile`, `ocrbatch`, `sfu`) are **not affected** and do not need restart.

### 7. Smoke-test on the deployed environment

Run these four SQL queries against the target DB. Use **psql interactive**, **pgAdmin**, **DBeaver**, or any SQL client — paste them as-is. (Don't try to wrap them in `psql -c "..."` — the embedded double-quotes around `"CaseMaster"` etc. fight with shell quoting.)

**Query 1 — verify all 8 SPs are live**

```sql
SELECT n.nspname AS "schema", p.proname AS "function"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname = 'realtime' AND p.proname IN (
        'et_navigate_get_all','et_marknav_doclinks','et_factsheet_detail',
        'et_navigate_factlist','et_fact_get_detail_single','et_navigate_facts_bycompany'))
   OR (n.nspname = 'transcript' AND p.proname = 'et_transcript_publish')
   OR (n.nspname = 'public'     AND p.proname = 'et_admin_case_getdetail')
ORDER BY 1, 2;
```
Expect: **8 rows**.

**Query 2 — verify the new column exists**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name  = 'CaseMaster'
  AND column_name = 'bHideBundleColumn';
```
Expect: one row — `bHideBundleColumn | boolean | false`.

**Query 3 — verify no upload-published session is stuck at `cStatus='C'`**

```sql
SELECT "cStatus", COUNT(*) AS "upload_published_sessions"
FROM "RSessionMaster"
WHERE "isTranscript" = true
  AND "isUploaded"   = true
  AND "dDelDt"       IS NULL
GROUP BY "cStatus";
```
Expect: only `cStatus='P'` rows. If any `'C'` rows appear, the backfill in PART 4 step 2 didn't run — re-run the deploy script.

**Query 4 — verify nTLine backfill is complete**

```sql
SELECT
    'FactDetail' AS "table",
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T') AS "transferred_rows",
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T' AND "nTLine" IS NULL)
        AS "rows_still_missing_nTLine"
FROM "FactDetail"
UNION ALL
SELECT
    'DocDetail',
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T'),
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T' AND "nTLine" IS NULL)
FROM "DocDetail";
```
Expect: **`rows_still_missing_nTLine = 0`** for both tables.

**Application logs**

```bash
pm2 logs realtime-server --lines 50
pm2 logs coreapi --lines 50
pm2 logs export --lines 50
```
Expect: no startup errors. The realtime-server should print `WebSocket server initialized`. If you see TypeScript errors at startup, the build didn't pick up the new code — re-run `npm run build:prod`.

### 8. (Optional) Toggle the bundle-column hide for specific cases

`bHideBundleColumn` defaults to `false` for every case. To hide the Bundle column for a specific case:

```sql
UPDATE "CaseMaster"
   SET "bHideBundleColumn" = true
 WHERE "nCaseid" = '<case-uuid>';
```

To unhide:

```sql
UPDATE "CaseMaster"
   SET "bHideBundleColumn" = false
 WHERE "nCaseid" = '<case-uuid>';
```

No code deploy needed for these — the frontend reads the flag fresh on each case load (modulo the per-case in-memory cache in `CasedetailService.getCaseInfo`, which clears on case switch).

---

## Rollback procedure

If anything goes seriously wrong **after** the migration committed:

### Database rollback

```sql
-- 1. Drop the new column (loses the bHideBundleColumn data)
ALTER TABLE "CaseMaster" DROP COLUMN IF EXISTS "bHideBundleColumn";

-- 2. Restore the previous SP bodies from sp-audit history.
--    The 8 SPs that were re-created:
--      - realtime.et_navigate_get_all
--      - realtime.et_marknav_doclinks
--      - realtime.et_factsheet_detail
--      - realtime.et_navigate_factlist
--      - realtime.et_fact_get_detail_single
--      - realtime.et_navigate_facts_bycompany
--      - transcript.et_transcript_publish
--      - public.et_admin_case_getdetail
--
--    Each previous body is in the same path under sp-audit/sp/<schema>/ at
--    the prior git commit. Use:
--
--      git show <prior-sha>:sp-audit/sp/realtime/et_navigate_get_all.sql > /tmp/prior.sql
--      psql ... -f /tmp/prior.sql
--
-- 3. The data backfills CANNOT be auto-reversed. Reverting them would
--    re-introduce the original bugs. If you must, restore from the pre-
--    deploy snapshot taken in the pre-deploy checklist.
```

### Code rollback

```bash
git checkout <previous-tag>
npm run build:prod
pm2 restart realtime-server coreapi export
```

The previous Python `run3.py` will be on disk after the git checkout — no separate Python rollback step needed.

---

## Files inventory

| File | What it is |
|---|---|
| `scripts/deploy_publish_annot_fix.sql` | **THE** deployment script. Single transaction: schema + 8 SPs + 5 backfills. |
| `scripts/DEPLOY.md` | This guide. |
| `assets/sql-migrations/2026-05-14_case_hide_bundle_column.sql` | Original standalone migration for the bundle-column work. **Now superseded** by `deploy_publish_annot_fix.sql` — kept in the dated migrations folder for tracking. Do NOT run it separately. |
| `assets/pythons/annot-transfer/run3.py` | Python annotation-transfer script — sync to server filesystem. |
| `apps/realtime-server/src/services/fact/fact.service.ts` | `markAsTranscriptIfPublished` OR-check + nTPage/nTLine seed |
| `apps/realtime-server/src/services/doclink/doclink.service.ts` | New `markAsTranscriptIfPublished` for doc-links |
| `apps/realtime-server/src/services/session/session.service.ts` | `getFilesCount` uses `isTrans` |
| `apps/realtime-server/src/events/events.gateway.ts` | `handleConnection` auto-joins `U${nUserid}` |
| `apps/realtime-server/src/interfaces/{marknav,fact}.interface.ts` | Added `bIsTranscipt` to remaining DTOs |
| `apps/coreapi/src/interfaces/{marknav,navigation,case}.interface.ts` | Added `bIsTranscipt` + `bHideBundleColumn` |
| `apps/export/src/services/export-file/export-file.service.ts` | Passes `bIsTranscipt` to `factsheet_detail` |
