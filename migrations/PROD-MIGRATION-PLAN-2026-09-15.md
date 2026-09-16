# Prod SP/schema migration plan — `etabella_tech_uuid` (dev, Vultr) → `etabella.com.uuid` (LIVE, DigitalOcean)

Status: **APPROVED direction 2026-09-15 → script generated (`prod_etabella_com_uuid_2026-09-15.sql`, see `RUNBOOK-PROD-2026-09-15.md`). Nothing has been run on the live database; Claude only runs SELECTs there.**
Resolved since draft: D1 — the prod-only changes (roman ordering, marks-private) were ported INTO dev first
(`assets/sql-migrations/2026-09-15_port_prod_*.sql`), so dev is now the superset and `et_bundles` is a clean
replace (merged body). D2/D3/D4 ship by default (each skippable with a psql `-v` flag). D5 optional.
Author: Claude (session 2026-09-15). Owner/executor: Alok.

## 0. Ground rules

- **Data on live is untouched.** Only schema objects (functions, tables, columns, indexes, triggers) and a small set of
  idempotent lookup/backfill rows change. No table is truncated or dropped.
- **Claude never connects to live.** Every step that touches `etabella.com.uuid` is a command Alok runs. Claude only
  reads dev (Vultr) and local files.
- **Single script, single transaction** for everything transactional; `ON_ERROR_STOP` → any error rolls the whole thing
  back. Indexes are built `CONCURRENTLY` after the commit (they cannot run inside a transaction).
- **Idempotent.** Re-running on a fully migrated DB is a no-op and just prints the verification report again.
- **Built-in pre-flight + post-flight.** The script refuses to run if the DB name is wrong, refuses (by default) if it
  detects live objects that were changed on prod after the baseline *and* differ from dev ("drift"), and ends with a
  PASS/FAIL table per object.

## 1. What was found (evidence)

Source of truth = the **live dev catalog** (`etabella_tech_uuid`, PG 16.15), not the migration files. Reasons:

- Backend `.gitignore` has `*.sql`; several dev-applied changes have **no file on disk at all** (fact fields / Review
  Status `nReviewid`, claim+issue fields `cPriority/cDispute/cDescription`, `cColor/cParty/cDescription` on
  `IssueCategory`, `cTenure`, workspace views). Others live in the Angular repo (`docs/sql-migrations/`).
- Baseline for "what prod has" = the newest prod snapshot on disk:
  `docker/postgres/backup/etabella.com.uuid.backup` — archive header says **dumped 2026-05-19 from `etabella.com.uuid`, PG 16.14**.
- Method: `pg_dump --schema-only` of dev vs `pg_restore --schema-only` of the snapshot, object-by-object diff
  (normalised bodies). Raw numbers: 33 new / 355 changed / 1 removed functions, 4 new tables, 18 tables with new columns,
  17 new indexes, 6 new triggers.

### 1.1 Exclusions (must NOT be migrated)

- **SymmetricDS internals**: every `fsym_on_*` trigger function (309 of the 355 "changed"), every `sym.*` table/column/
  index/trigger/pkey, `sym_node_channel_ctl_`. They embed per-installation replication config; copying dev's into prod
  would break prod replication. Excluded by name pattern.
- `RTConnectivityLogs` **TRUNCATE** from `2026-05-20_rtconnectivitylogs_30day_window` — destructive, not needed for
  correctness. Excluded (the index from that migration is kept).
- `transcript.Transcripts_cThemeid_fkey` shows as "changed" but both definitions are byte-identical after normalisation
  → parser artefact, nothing to do.

### 1.2 Application delta to ship (after exclusions)

| Kind | Count | Notes |
|---|---|---|
| Functions new | 27 | e.g. `et_bundle_index`, `et_bundle_search`, `et_case_bundle_sizes`, `et_case_doclinks`, `et_is_case_member`, `et_output_data_export_*` (5), `et_savedsearch_*` (3), `et_workspace_*` (9), `et_annotation_index_rows`, `et_admindashboard_count`, `et_share_get_bundles`, `download.et_expire_downloads`, `et_dashboard(json,5×refcursor)` |
| Functions changed | 46 | `download.*` (10), `public.et_admin_*`, `et_bundledetail`, `et_bundledetail_search`, `et_bundles` ⚠, `et_export_*`, `et_fact_*`, `et_navigate_*`, `et_realtime_*`, `et_task_*_v2`, `et_workspace_fact_list`, `realtime.et_fact_insert_team`, `realtime.et_factsheet_*`, … |
| Functions in `sym` schema that are OURS | 3 | `sym.fn_bundle_delete_cascade`, `sym.fn_bundle_filecount_bd_change`, `sym.fn_bundle_parent_move` (bundle file-count triggers) |
| Function signature replaced | 1 | old `et_dashboard(json, 4×refcursor)` → new 5-cursor version. Old overload is DROPPED (coreapi calls by name; two overloads = ambiguous) |
| New tables | 3 | `OutputDataExport`, `SavedSearch`, `WorkspaceView` (+ pkeys) |
| New columns | 21 on 10 tables | `download.ProcessMaster(jInclude,cZipname)`, `BundleMaster(nHierarchyDepth,nFileCount,nFileCountDescendant)`, `CaseMaster(dHearingDt,cHearingTimezone,nHearingDays)`, `ContactMaster(cTenure)`, `ExportMaster(bTeamMarks)`, `FactDetail(nReviewid)`, `IssueCategory(cColor,cParty,cDescription)`, `RIssueMaster(cPriority,cDispute,cDescription)`, `SectionMaster(nSectionOrder)`, `TaskDetail(cTypetext,cEstimate,bPrivate)` — all nullable or `DEFAULT … NOT NULL`, so `ADD COLUMN IF NOT EXISTS` is safe on populated tables |
| New indexes | 15 | 7 `pg_trgm` GIN indexes on `BundleDetail`/`BundleMaster` (search), plus btree on parent/section/order, new tables, `RTConnectivityLogs(dDt)` |
| New triggers | 3 | `trg_bundledetail_filecount`, `trg_bundlemaster_delete_cascade`, `trg_bundlemaster_parent_move` |
| Extension | 1 | `pg_trgm` (`CREATE EXTENSION IF NOT EXISTS`) |
| Views / sequences / types | 0 | identical |

Full object list with per-object "before" and "after" hashes will be embedded in the script header.

### 1.3 Lookup data (`Codemaster`) — needs care

- **New codes (10 rows)**: Source Type cat 23 → Contemporaneous Record, Financial/Commercial Record, Pleading/Submission,
  Decision/Order, Other; Dispute cat 24 → Undisputed, Partially Disputed; Review Status cat 27 → Open, In Review, Finalized.
- **ID collision**: on dev these were inserted as `nCodeid` 60–69. On prod 60–69 are **timezone rows** (UTC, GMT, BST,
  W. Europe, Central Europe, Romance, …). The script therefore inserts the new rows with `nextval` (after `setval` to
  `max(nCodeid)`), matched by `(nCategoryid, cCodename) NOT EXISTS`. Safe because nothing depends on the numeric id:
  the frontend loads by category (`GET /common/getcode?nCategoryid=`) and resolves by label (`idOf(list, label)`),
  and every SP joins `Codemaster` by `nCategoryid`. No SP or FE hard-codes 60–69 (grepped).
- **Relabel/re-serial of existing rows (14 rows, ids stable)**: Impact cat 5 "Heavily for us"→"Strongly For Us",
  "For us"→"For Us", "Against us"→"Against Us", "Heavily against us"→"Strongly Against Us" (+ serial swap 4↔5), "Unsure"
  retired (serial NULL); Relevance cat 4 "Neutral" retired; Source Type cat 23 "Expert Report"→"Expert Evidence",
  "Witness Statement"→"Witness Evidence", "Contract"→"Contract/Agreement" (+ serials 1..7); Dispute cat 24
  "Stipulated/Alleged/Tentative" retired, "Disputed" serial 3. Each UPDATE is guarded `WHERE cCodename = <old>` so a
  label someone already edited on prod is not clobbered. `nUserid` is never touched.
  **→ Decision D2 below: ship these relabels or not.**
- Side finding (dev only, no prod action): dev **lost** its timezone codes 60–69 when the fact-field seed reused those
  ids. Fix later by re-inserting them on dev from prod (separate task).

### 1.4 Prod is AHEAD of dev in places — blind overwrite would regress prod

1. **Roman-numeral bundle ordering fix (2026-09-01)** — `roman_to_int()`, `et_index_getfiles`, `et_bundles` were
   applied by hand on prod. Dev has none of it (no `roman_to_int` on dev) and the SQL was never saved.
   - `et_index_getfiles`, `roman_to_int`: dev == May-19 baseline → script emits nothing → prod keeps its fix. ✔
   - **`et_bundles`: changed on BOTH sides** (dev: file counts / hide-bundle-column; prod: roman sort) → true 3-way
     conflict. Cannot be resolved without prod's current body. **→ Decision D1.**
2. **Marks-private-by-default (2026-07-07, 13 functions)** — memory says deployed live; dev == baseline for all 13
   (dev never got it). Script emits nothing for them → prod keeps its version. ✔ (but dev is behind — separate task)
3. Anything else changed on prod after 2026-05-19 that we don't know about → caught at run time by the drift check.

## 2. Drift check design (how the script protects prod)

For every function it intends to replace, the script embeds two hashes computed with the same normalisation
(`md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g')))`):

- `before` = body in the 2026-05-19 prod snapshot (NULL for new functions)
- `after`  = body on dev today

Pre-flight classifies each live function: **PENDING** (live == before), **DONE** (live == after), **MISSING** (new),
**DRIFT** (live matches neither). If any DRIFT exists the script prints the list and aborts **before** the transaction
opens, unless run with `-v allow_drift=1`. The same is done for columns/tables/indexes/triggers (exists / missing).

## 3. Execution plan (Alok runs every step; Claude prepares files)

| # | Step | Who | Touches live? |
|---|---|---|---|
| 1 | Approve this plan (decisions D1–D5) | Alok | no |
| 2 | (Recommended) run `prod-inventory.sql` — **read-only SELECTs** — against live, save output folder, hand to Claude. Gives: true current hashes (replaces the May-19 assumption), and current bodies of `et_bundles` / `et_index_getfiles` / `roman_to_int` for the merge | Alok | read-only |
| 3 | Claude generates `prod_etabella_com_uuid_2026-09-XX.sql` (+ RUNBOOK section) from dev catalog + inventory | Claude | no |
| 4 | **Rehearsal**: restore the May-19 snapshot into local PG 17 (`etabella_rehearsal`), run the script there, confirm "ALL CHECKS PASSED", run it a second time to prove idempotency | Alok (Claude can drive local PG if given a local password) | no |
| 5 | Backup live: `pg_dump -Fc` of `etabella.com.uuid` (schema+data) to disk | Alok | read-only |
| 6 | Run script on live with `psql -v ON_ERROR_STOP=1 -f … \| tee log` ; read the PASS/FAIL table | Alok | **yes** |
| 7 | Deploy paired services (see §5) and the frontend | Alok | n/a |
| 8 | Smoke test list (§6) | Alok | read |

Rollback: step 5 dump (`pg_restore --clean`), or per-object: every replaced function's *before* body is kept in
`migrations/rollback/2026-09-XX_before_bodies.sql` generated from the baseline/inventory.

## 4. Script layout (`prod_etabella_com_uuid_2026-09-XX.sql`)

```
00  header: object manifest + hashes; psql vars (allow_drift, skip_relabel, skip_indexes)
01  GUARD: current_database() = 'etabella.com.uuid' else RAISE; print version/user/now
02  PRE-FLIGHT: temp table expected(kind, schema, name, before_md5, after_md5) → classify live → NOTICE table → abort on DRIFT
03  BEGIN
04    CREATE EXTENSION IF NOT EXISTS pg_trgm
05    CREATE TABLE IF NOT EXISTS ×3 (+ pkeys via DO/IF NOT EXISTS)
06    ALTER TABLE … ADD COLUMN IF NOT EXISTS ×21
07    DROP FUNCTION IF EXISTS public.et_dashboard(json, refcursor, refcursor, refcursor)
08    CREATE OR REPLACE FUNCTION ×76 (dev bodies verbatim; et_bundles per D1)
09    CREATE OR REPLACE TRIGGER ×3
10    DATA (idempotent, guarded):
        a. Codemaster: setval(seq, max); INSERT 10 new codes WHERE NOT EXISTS(cat, name)
        b. Codemaster: 14 relabel/serial UPDATEs guarded on old label   [skipped if :skip_relabel]
        c. BundleMaster backfill nHierarchyDepth / nFileCount / nFileCountDescendant WHERE still 0 (from 2026-05-20 files)
        d. SectionMaster backfill nSectionOrder WHERE NULL (2026-05-20_section_order)
        e. Annotations nBDid backfill WHERE NULL (2026-07-08_fact_annotation_nbdid)
11  COMMIT
12  CREATE INDEX CONCURRENTLY IF NOT EXISTS ×15   (outside txn; each independent)   [skipped if :skip_indexes]
13  VERIFY: recompute every object → PASS/FAIL rows + summary; final DO RAISE EXCEPTION if any FAIL (exit code ≠ 0)
```

Run command (Alok's terminal; password from the commented prod block of `.env.development`, never echoed):

```bash
export PGSSLMODE=require
psql -h db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com -p 25060 -U doadmin -d etabella.com.uuid \
  -v ON_ERROR_STOP=1 -f migrations/prod_etabella_com_uuid_2026-09-XX.sql 2>&1 | tee migrations/apply_log_prod_$(date +%Y%m%d_%H%M%S).log
```

## 5. Paired service deploys (SP-only changes need none; these do)

| Service | Why |
|---|---|
| coreapi | `et_dashboard` 5-cursor call, participants/tasks/workspace-view endpoints + DTOs, hearing schedule, `caselistcount`, bundle sizes |
| realtimeapi / realtime-server | fact fields (Review Status), claim/issue fields, `et_fact_insert_team` share edit, DocLink `jAn` DTO |
| downloadapi | `bForceNew`, hard delete, `jInclude`/`cZipname`, expire-downloads |
| export service | `bTeamMarks`, annotation-index rows, fonts |
| Angular frontend | everything above |

Order: DB script first (all additive, old services keep working on new schema), then services, then FE.

## 6. Smoke tests after deploy

Evidence list + search (trgm indexes) · Master Index ordering still roman-correct (`et_bundles` merge) · Full Fact:
Review Status dropdown shows Open/In Review/Finalized · Claim/Issue form fields · Workspace participants/tasks/views ·
Outputs download + export · Admin case detail + hearing schedule · Dashboard loads (5-cursor SP).

## 7. Decisions needed before Claude writes the script

- **D1 — `et_bundles` conflict.** Options: (a) Alok runs `prod-inventory.sql` (read-only) so Claude can 3-way merge
  roman sort + dev changes → recommended; (b) ship dev's version and re-apply the roman fix on top afterwards
  (needs the roman SQL, which is not saved anywhere — would have to be re-derived); (c) leave `et_bundles` out.
- **D2 — Codemaster relabels** (Impact "Heavily → Strongly", Source Type renames, retire Unsure/Neutral/Stipulated…):
  ship (matches the shipped FE wording) or hold?
- **D3 — Backfills** (BundleMaster depth/counts, SectionMaster order, Annotations nBDid): ship (recommended, all
  guarded `WHERE NULL/0`) or hold?
- **D4 — Indexes** `CONCURRENTLY` after commit (no table locks, may take minutes on `BundleDetail`) — OK?
- **D5 — Rehearsal on local PG 17**: Alok provides the local `postgres` password (or runs the restore himself) so the
  script is proven on a copy of prod before touching live. Recommended; skip only if time-boxed.

## 8. Security note (unrelated to migration, but seen while reading)

`migrations/RUNBOOK.md` is git-tracked and contains the Vultr admin password in plaintext (4 places). Recommend
rotating that credential and replacing the literal with `$PGPASSWORD` in the doc.
