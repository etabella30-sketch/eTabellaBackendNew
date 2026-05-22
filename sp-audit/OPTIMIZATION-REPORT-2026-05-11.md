# etabella DB optimization report

**Date:** 2026-05-11
**Target DB:** `dev.etabella.com.uuid` on Vultr managed PostgreSQL 16.13
**Host:** `public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com:16751`
**Method:** Code analysis of `apps/` (NestJS, 461 distinct SPs across 14 services) + live read-only diagnostics + static SP audit (1,081 SPs / 907 findings)

---

## TL;DR

1. **`pg_stat_statements` is NOT enabled.** Without it, no historical runtime data. **First action: turn it on via Vultr support.**
2. **Critical fix is index coverage, not SP rewrites.** Seven `CREATE INDEX CONCURRENTLY` statements on hot tables will speed up dozens of SPs at once.
3. **TimescaleDB 2.25.2 is available on Vultr.** No need to migrate to TigerData Cloud for hypertables — install the extension here.
4. **Two strong hypertable candidates:** `BatchlogDetail` (515 MB) and `RTConnectivityLogs` (125 MB). Expected 10×–20× compression, 100×+ faster recent-window queries.
5. **`statement_timeout = 0`.** Runaway queries can hold pool connections forever. Set to 30 s.
6. **113 MB of unused indexes on `BundleDetail`** — 7 tsvector indexes never scanned. Drop or wire up FTS.

Already executed today: `CREATE EXTENSION timescaledb` on dev (reversible).
Pending user confirmation: hypertable conversion of `BatchlogDetail`.

---

## 1. Hot tables — the real prioritization signal

The actionable finding from live diagnostics: **eleven tables run at near-100 % sequential scans**. These are joined into nearly every SP. Adding the right indexes here speeds up the whole API, not just one SP.

| Table | Rows | Seq scans | Tuples read | Idx scans | **% seq** | Comment |
|---|---:|---:|---:|---:|---:|---|
| `TeamRelation` | 1,479 | **13,700** | 19.8 M | 0 | **100 %** | 🔥 hottest fix — every permission check scans whole table |
| `BDPermission` | 1,506 | 5,562 | 8.4 M | 0 | **100 %** | in every bundle SP |
| `FactDetail` | 2,296 | 3,324 | 7.3 M | 0 | **100 %** | RT marks path |
| `BDAssignment` | 64,588 | 2,309 | **115 M** | 0 | **100 %** | bundle assignment lookups |
| `RIssueMaster` | 1,249 | 2,212 | 2.7 M | 30,181 | 6.8 % | OK |
| `FMIssue` | 2,432 | 1,495 | 3.4 M | 0 | **100 %** | issue list SPs |
| `RSessionDetail` | 8,679 | 1,625 | 14 M | 0 | **100 %** | per-session joins |
| `Annotations` | 152,748 | 247 | **37 M** | 0 | **100 %** | doc viewer |
| `BDAttributes` | 336,483 | 153 | **51 M** | 0 | **100 %** | bundle metadata |
| `BundleDetail` | 280,515 | 399 | **107 M** | 118,993 | 0.3 % | OK on lookup, but FTS indexes wasted |
| `BatchlogDetail` | 3,293,691 | 9 | 23 M | 0 | **100 %** | audit log → hypertable candidate |

**Action — Tier 1 indexes (one migration window, all `CONCURRENTLY`):**

```sql
CREATE INDEX CONCURRENTLY ix_TeamRelation_nUserid_nCaseid
  ON "TeamRelation" ("nUserid", "nCaseid");

CREATE INDEX CONCURRENTLY ix_BDPermission_nUserid_nBundleid
  ON "BDPermission" ("nUserid", "nBundleid");

CREATE INDEX CONCURRENTLY ix_BDAssignment_nBundledetailid
  ON "BDAssignment" ("nBundledetailid");

CREATE INDEX CONCURRENTLY ix_BDAttributes_nBundledetailid
  ON "BDAttributes" ("nBundledetailid");

CREATE INDEX CONCURRENTLY ix_Annotations_nBundledetailid
  ON "Annotations" ("nBundledetailid");

CREATE INDEX CONCURRENTLY ix_FactDetail_nFSid
  ON "FactDetail" ("nFSid");

CREATE INDEX CONCURRENTLY ix_FMIssue_nIssueid
  ON "FMIssue" ("nIssueid");
```

Column names inferred from migration files in `assets/sql-migrations/`. Confirm the actual join columns with `EXPLAIN` on one of `et_marks`, `et_realtime_issuelist_group`, or `et_bundledetail_search` before running.

---

## 2. Critical stored procedures

Without `pg_stat_statements`, ranking by real runtime is impossible. The list below combines **code call-site frequency** (461 SPs called by NestJS, ranked) with **static audit issues** (1,081 SPs scanned) and **which hot tables each SP touches**.

### Tier 1 — RT module hot path (per-session / per-mark / per-issue)

| SP | Lines | Issues | Why critical |
|---|---:|---|---|
| `realtime.et_marks` | 250 | MANY_LEFT_JOINS_NO_DISTINCT | Loaded every time RT marks panel opens |
| `public.et_realtime_issuelist_group` | — | 9 LEFT JOINs no DISTINCT, NOTICE, VOLATILE | Refreshed on every RT issue event |
| `realtime.et_realtime_sessiondata` | — | 5 SELECT INTO, 4 LEFT JOINs | Called 3× in [session.service.ts](../etabella_backend-tech/apps/realtime-server/src/services/session/session.service.ts:59) per session join |
| `realtime.et_navigate_get_all` | 404 | VERY_LONG_BODY, 4 EXECUTE w/o USING | Largest RT SP; called from coreapi + RT |
| `realtime.et_navigate_factlist` | 288 | EXECUTE w/o USING, 3 SELECT INTO | Fact list rendering |
| `realtime.et_marknav_doclinks` | — | EXECUTE w/o USING, 3 SELECT INTO | Mark-nav doc links |

### Tier 2 — Heavy bundle/admin paths

| SP | Lines | Notes |
|---|---:|---|
| `public.et_bundledetail_search` | 523 | 6 issues; touches `BundleDetail` + `BDAttributes` + `BDPermission` |
| `public.et_admin_bundles_filetypes` | 470 | 7 issues, 3 SELECT INTO |
| `public.et_bundledetail_with_filter` | 377 | 6 issues |
| `public.et_admin_searched_bundles` | 343 | 6 issues |
| `public.et_displayfiles` | 331 | Refactor candidate |
| `upload.et_save_bundledetails` | 279 | **14 SELECT INTO** — heaviest in static audit |
| `public.et_get_bundle_links` | — | **20 LEFT JOINs no DISTINCT**, 7 refcursors |

### Tier 3 — Foundational / called everywhere

| SP | Why |
|---|---|
| `public.et_log_insert` | DYNAMIC_SQL + EXCEPTION_WHEN_OTHERS + 8 RAISE_NOTICE; called from authapi, pagination, every audit event |
| `public.et_navigate_checkdata` | 17 LEFT JOINs no DISTINCT, 9 SELECT * — duplication-bug magnet |

### Skip / drop

All `*_backup`, `*_test`, `*_backup1`, `*_backup1312026` SPs. They double the audit noise and live in the active schema. Move out or delete.

---

## 3. Hypertable candidates

TimescaleDB 2.25.2 is **available on this Vultr cluster** (`pg_available_extensions`). No need to migrate to TigerData Cloud for hypertables — install the extension here and convert in place.

**`CREATE EXTENSION timescaledb` was run on dev today as part of this analysis** (reversible via `DROP EXTENSION`).

### Strong candidates (score 18/17)

#### 🥇 `BatchlogDetail` — score 18

| | |
|---|---|
| Size | 515 MB / 3.29 M rows |
| Pattern | 100 % inserts (3.29 M ins / 0 upd / 2.9 K del) |
| Time column | `change_time` (NULL-free verified) |
| Entity column | `nBundledetailid` (segment_by) |
| Date range | 2024-12-26 → 2026-04-29 |
| Triggers / FKs / sym replication | None ✅ |
| Existing indexes | PK on `nBLid` only |
| Dependents | View `public.filled_data` (stays compatible) |

**Expected gain:** 10×–20× compression on chunks >30 days old, 100×+ faster recent-window queries.

Migration SQL in [sp-audit/migrate-batchlogdetail.sql](migrate-batchlogdetail.sql) — pending user go-ahead.

#### 🥇 `RTConnectivityLogs` — score 18

| | |
|---|---|
| Size | 125 MB / 1.09 M rows |
| Pattern | 100 % inserts |
| Time column | `dDt` |
| Entity column | `nUserid` |
| Indexes | 64 kB total — essentially none |

Convert after `BatchlogDetail` succeeds and is observed for ~1 week.

### Good candidates (score 12–16) — batch conversion

All `Log*` audit tables — same shape (`nLCatid`, `cRemark`, `jOther`, `dCreateDt`, `n*id`), all 100 % inserts. Convert in one migration window with `dCreateDt` as partition.

| Table | Size | Rows | Score |
|---|---:|---:|---:|
| `LogPagination` | 62 MB | 234 K | 16 |
| `LogBundleDetail` | 37 MB | 132 K | 15 |
| `LogBundleMaster` | 12 MB | 51 K | 13 |
| `LogSectionMaster` | 12 MB | 45 K | 13 |
| `UserLog` | 11 MB | 38 K | 13 |
| `LogDashboard` | 4.7 MB | 38 K | 12 |
| `RTLogs` | 1.8 MB | 11 K | 12 |

### Borderline

| Table | Why not now |
|---|---|
| `Annotations` (73 MB) | Insert-only ✓ but query pattern is entity-based (by `nDocid`/`nFSid`), not time-based. No locality benefit. |
| `download.ProcessBatchs` (144 MB) | Needs separate column check — no timestamp column visible. |

### Do NOT touch

| Table | Reason |
|---|---|
| `BundleDetail` | Hot lookup, has updates, queried by id |
| `BDAttributes`, `BDAssignment`, `BDPermission` | Entity-keyed permission tables |
| `RHighlights`, `FactDetail`, `Annotations` | Query pattern is entity-based |
| `pdf_data` (472 MB) | No time column — binary blob storage |
| `PTaskDetail` | No time column |
| `sym_data`, `sym_data_event`, `sym_outgoing_batch` | **SymmetricDS internals.** Conversion will break replication. |

---

## 4. Wasted indexes — drop to speed writes

`BundleDetail` carries **113+ MB of indexes that have never been scanned**. Every INSERT/UPDATE pays maintenance cost.

| Index | Size | Scans |
|---|---:|---:|
| `idx_bundle_detail_fulltext` | 37 MB | 0 |
| `idx_bd_section_status_sort` | 33 MB | 0 |
| `idx_tsv_filename` | 23 MB | 0 |
| `idx_tsv_tab` | 15 MB | 0 |
| `idx_tsv_exhibit` | 2.6 MB | 0 |
| `idx_tsv_desc` | 2.1 MB | 0 |
| `idx_tsv_author` | 0.4 MB | 0 |
| `idx_bundle_sorted` | 5.2 MB | 0 |
| `idx_bundle_parent` | 384 kB | 0 |

**Decision needed before dropping:** is the FTS feature using `idx_tsv_*` planned to come back? If no, drop them. If yes, the SP code needs to actually use them — currently nothing queries them.

```sql
DROP INDEX CONCURRENTLY idx_bundle_detail_fulltext;
DROP INDEX CONCURRENTLY idx_bd_section_status_sort;
DROP INDEX CONCURRENTLY idx_tsv_filename;
DROP INDEX CONCURRENTLY idx_tsv_tab;
DROP INDEX CONCURRENTLY idx_tsv_exhibit;
DROP INDEX CONCURRENTLY idx_tsv_desc;
DROP INDEX CONCURRENTLY idx_tsv_author;
```

Other zero-scan indexes worth dropping after confirmation: `idx_factmaster_case_user`, `ix_RUserQFactPref_user_seq`, `ix_RUserQFactClaimPref_user_seq`, `idx_bdpermission_user_bundle`, several `sym_idx_*`.

---

## 5. Server tuning issues

| Setting | Current | Recommended | Why |
|---|---|---|---|
| `statement_timeout` | **0 (none)** | 30 s default, 5 min for batch | Runaway queries hold pool conns forever |
| `idle_in_transaction_session_timeout` | 24 h | 60 s | Stuck-in-txn sessions block VACUUM |
| `work_mem` | 4 MB | 16–32 MB | Heavy joins spill to disk |
| `default_statistics_target` | 100 | 200 | Better plans on skewed columns |
| `shared_buffers` | ~780 MB | ✅ fine for current size | |
| `effective_cache_size` | ~2.3 GB | ✅ fine | |
| `random_page_cost` | 1 | ✅ correct for SSD | |
| `log_min_duration_statement` | 1000 ms | ✅ already set | |
| `pg_stat_statements` | **NOT installed** | install + restart | **Highest priority** — no historical runtime data |

---

## 6. Schema hygiene

**FK coverage is dire.** Only **18 tables** have any FK constraint, and most are SymmetricDS internals. Business tables — `FactDetail`, `FMIssue`, `BDAttributes`, `Annotations`, `RHighlights`, `RSessionDetail` — have **zero FKs**. Orphaned-row bugs are defended against in application code instead. Add them retroactively with the two-step pattern:

```sql
-- Step 1: add NOT VALID (instant, no scan, enforced for new writes only)
ALTER TABLE "FactDetail"
  ADD CONSTRAINT "FactDetail_nFSid_fkey"
  FOREIGN KEY ("nFSid") REFERENCES "FactMaster"("nFSid") NOT VALID;

-- Step 2: validate later in low-traffic window (scans, doesn't block writes)
ALTER TABLE "FactDetail" VALIDATE CONSTRAINT "FactDetail_nFSid_fkey";
```

---

## 7. Bloat — healthy

Only one table flagged with >1 000 dead tuples (`BatchlogDetail`, 0.1 % dead). Autovacuum is keeping up across the board. No bloat-driven optimization needed today.

---

## 8. Connection state — healthy

Three connections active at diagnostic time (pgAdmin × 2 idle + this psql session). Two long-running queries are Vultr replication / pghoard backup — expected. No idle-in-transaction monsters. No `application_name` set on app pools (item 7 in earlier `db-optimization-report.md`).

---

## 9. Roadmap

### Week 1 — security & visibility (low risk, high impact)

1. **Enable `pg_stat_statements`** via Vultr support. Restart required.
2. Set `statement_timeout = 30000` (per-service) and `idle_in_transaction_session_timeout = 60000`.
3. Add `application_name` to each microservice's pool config so `pg_stat_activity` is attributable.
4. Rotate the credentials in `.env.production` / `.env.development` (they're in repo per the earlier report).

### Week 2 — index sweep

5. Run the seven Tier 1 `CREATE INDEX CONCURRENTLY` from §1.
6. Re-run [sp-audit/diagnostics.sql](diagnostics.sql); confirm `pct_seq` drops on the affected tables.
7. Decide on the 7 unused `BundleDetail` tsvector indexes — drop or wire up.

### Week 3 — TimescaleDB pilot

8. **Convert `BatchlogDetail`** ([migrate-batchlogdetail.sql](migrate-batchlogdetail.sql)).
9. Monitor for 1 week — table size, query times against `filled_data` view, any errors in SPs that touch the table.
10. If green, convert `RTConnectivityLogs` next.

### Week 4 — measure & target SPs

11. With `pg_stat_statements` live for ~2 weeks, pull top-20 SPs by total exec time.
12. Refactor the top 3–5 from Tier 1/2 list in §2. One per sprint with regression tests.

### Quarter 2

13. Batch-convert remaining `Log*` tables to hypertables.
14. Backfill FK constraints (`NOT VALID` then `VALIDATE`) on `FactDetail`, `FMIssue`, `BDAttributes`, `Annotations`.
15. Evaluate TigerData Cloud migration if you need: hyperfunctions (`first()`, `last()`, gapfill), tiered storage to S3, gapless continuous aggregates. Otherwise stay on Vultr.

---

## 10. Files produced today

| File | Purpose |
|---|---|
| [`sp-audit/diagnostics.sql`](diagnostics.sql) | Read-only diagnostics (14 queries) |
| [`sp-audit/diagnostics-output.txt`](diagnostics-output.txt) | Output of above against dev DB |
| [`sp-audit/hypertable-candidates.sql`](hypertable-candidates.sql) | Candidate scoring queries |
| [`sp-audit/hypertable-output.txt`](hypertable-output.txt) | Output of above |
| [`sp-audit/pre-migration-check.sql`](pre-migration-check.sql) | Safety checks before `BatchlogDetail` conversion |
| [`sp-audit/pre-migration-output.txt`](pre-migration-output.txt) | Output of safety checks |
| [`sp-audit/migrate-batchlogdetail.sql`](migrate-batchlogdetail.sql) | Hypertable migration script (pending user go-ahead) |
| `sp-audit/OPTIMIZATION-REPORT-2026-05-11.md` | This document |

Existing reports referenced:
- `sp-audit/REPORT.md` — static SP audit (1,081 SPs, 907 findings)
- `sp-audit/inventory.csv` — full SP inventory
- `sp-audit/findings.csv` — per-finding detail
- `db-optimization-report.md` — strategic plan from earlier audit

---

## 11. Open questions for the team

1. **Are the BundleDetail tsvector indexes meant to be live?** Nothing queries them. Drop or wire up.
2. **What's the right retention for `BatchlogDetail`?** Currently no rows older than 2 years; the proposed migration adds a 2-year retention policy that's a no-op today but will drop chunks once data ages.
3. **`et_log_insert` swallows errors and uses DYNAMIC_SQL** — does the audit-log feature have a downstream consumer that depends on this? Refactor opportunity.
4. **Should dev and prod share a Vultr cluster?** The `.env.development` and `.env.production` point at the same host. A misbehaving dev migration can corrupt prod metadata. Separate clusters recommended for cases like adding `shared_preload_libraries` (requires restart).
5. **`statement_timeout` default per service** — `coreapi` API requests want ≤5 s; `batchfile` / `export` jobs need 5+ minutes. Confirm the values per service before rollout.
