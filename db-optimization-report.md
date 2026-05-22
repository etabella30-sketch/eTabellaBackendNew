# PostgreSQL Optimization Report — etabella_backend-tech

**Database:** Vultr managed PostgreSQL — `public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com:16751`
**Databases observed:** `etabella_tech_uuid` (dev), `etabella.legal` (prod)
**Driver:** `pg` v8.11.3, raw `Pool` (no ORM despite TypeORM being installed)
**Access pattern:** All queries go through `DbService.executeRef(fn, params)` → `public.et_*` / `realtime.et_*` PL/pgSQL stored procedures returning `refcursor`s
**Microservices using the pool:** 17 (each opens its own pool)

---

## 0. Severity summary

| # | Item | Severity | Effort |
|---|---|---|---|
| 1 | Credentials, JWT secret, DO Spaces keys committed to git in `.env.development` / `.env.production` | **CRITICAL** | 1 day (rotate + remove from history) |
| 2 | `rejectUnauthorized: false` against managed Postgres | **HIGH** | 1 hour |
| 3 | `process.exit(-1)` on transient idle-client error | **HIGH** | 15 min |
| 4 | Pool `max=10` × 17 microservices, no PgBouncer | **HIGH** | 1 day |
| 5 | No `statement_timeout` / `query_timeout` — runaway queries hold connections forever | **HIGH** | 30 min |
| 6 | SQL built by string interpolation (`'${modelString}'`) instead of `$1` parameters | **HIGH** | 1–2 weeks (scoped) |
| 7 | No `application_name` in pool config — `pg_stat_activity` is unattributable | **MEDIUM** | 15 min |
| 8 | Refcursor + multi-statement pattern blocks prepared statements & plan caching | **MEDIUM** | architectural |
| 9 | Index coverage on hot SPs (`et_marks`, `et_realtime_issuelist_group`) unverified | **HIGH** | 1 day to audit |
| 10 | `EXCEPTION WHEN OTHERS` swallows errors in SPs (e.g. `et_admin_update_bundledetail`) | **MEDIUM** | per-SP edit |
| 11 | `RAISE NOTICE 'nRoleid %', nRoleid;` left in `et_realtime_issuelist_group` | **LOW** | trivial |
| 12 | Dates stored as `varchar` in `BundleDetail.dIntrestDt` | **LOW** (documented intentional) | won't fix |

The rest of this document expands each item with concrete fixes, file paths, and copy-pasteable SQL.

---

## 1. CRITICAL — Secrets in version control

`/.env.development` and `/.env.production` are committed and contain:

- **DB password** `AVNS_VqdeFp4-sE6s4BCPhoU` — same on dev and prod, against the same Vultr cluster. Anyone with repo access has prod DB access.
- `JWT_SECRET=4fb28d2d…` (same on dev & prod)
- `DO_SPACES_KEY` / `DO_SPACES_SECRET` (DigitalOcean Spaces full-write)
- `DO_TOKEN` (DigitalOcean API token)

**Action**

1. **Rotate immediately**: DB password, JWT secret (forces all sessions to invalidate — coordinate), DO Spaces keys, DO API token.
2. Remove `.env.*` from `git` history with `git filter-repo` (not just `.gitignore` — the secrets are still in old commits).
3. Move secrets out of the repo: PM2 `ecosystem.config.js` already supports per-app env, or use Vultr's secret store / a vault.
4. Add `.env.development` and `.env.production` to `.gitignore` and ship `.env.example` placeholders instead.
5. Use **separate credentials and database names** for dev and prod. Sharing a Vultr cluster between dev and prod is a separate problem worth addressing (a misbehaving dev migration can corrupt prod).

---

## 2. Driver / connection-pool issues

File: `libs/global/src/db/pg/db.service.ts`

### 2.1 SSL is not validated

```ts
if (sslConnection > 0) {
  cfg.ssl = { rejectUnauthorized: false };
}
```

You're connecting to a managed DB over the public internet but disabling cert validation. This is a free MITM. Vultr publishes the CA cert — wire it in:

```ts
import * as fs from 'fs';

if (sslConnection > 0) {
  cfg.ssl = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(this.configService.get<string>('DB_CA_CERT_PATH')).toString(),
  };
}
```

Download the CA from the Vultr dashboard once, ship it as a file (or inline the PEM in env), and set `DB_CA_CERT_PATH=./ssl/vultr-ca.crt`.

### 2.2 `process.exit(-1)` on idle errors crashes the service

```ts
this.pool.on('error', (err, client) => {
  this.logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});
```

Cloud DBs reset idle TCP sessions routinely — you do not want every microservice to die on each blip. The pool already evicts dead clients itself; just log:

```ts
this.pool.on('error', (err) => {
  this.logger.error('Unexpected error on idle pg client', err);
  // do NOT exit — the pool will replace the broken client
});
```

### 2.3 Pool sizing & PgBouncer

`DB_MAX=10` × 17 microservices = 170 potential backend connections, **per host**. If you run multiple PM2 workers (`ecosystem.config.js` uses `instances: 'max'` for some apps), multiply that by core count. Vultr's managed Postgres has a hard `max_connections` ceiling (typically 200 on small plans) — you will hit it.

Two fixes, do both:

1. **Right-size per service.** Most microservices don't need 10. Set `DB_MAX` per service in `ecosystem.config.js`:
   - `coreapi`, `realtime-server` — 10–20 (hot path)
   - `authapi`, `socket-app` — 5
   - `backup`, `export`, `presentation`, `batchfile`, `download*` — 2–3 (occasional, batch-heavy work)
2. **Put PgBouncer in front of the DB** in transaction pooling mode. With PgBouncer, each Node service can keep, say, a pool of 20 logical connections that all multiplex through ~30 real backend connections. **But:** transaction-pooling kills session-scoped state — including server-side cursors. Refcursors only work inside one transaction, and the current SP pattern returns cursors that the client `FETCH`es later. With transaction pooling, you would have to wrap each `executeRef` call in a single round-trip transaction (which the current multi-statement string already does — verify this) or switch to session pooling. Test before rolling out.

### 2.4 Misnamed `DB_TIMEOUT`

```ts
idleTimeoutMillis: this.configService.get<Number>('DB_TIMEOUT')  // 30000
```

`DB_TIMEOUT=30000` is being applied as the **idle** timeout, not query timeout. There is **no `statement_timeout` or `query_timeout` set anywhere**. A single bad query can hold a connection forever and starve the pool.

Fix: add per-statement timeout at the pool level, plus a server-side safety net.

```ts
let cfg: any = {
  user: this.configService.get<string>('DB_USERNAME'),
  // ...
  max: this.configService.get<number>('DB_MAX'),
  idleTimeoutMillis: this.configService.get<number>('DB_IDLE_TIMEOUT_MS') ?? 30_000,
  connectionTimeoutMillis: this.configService.get<number>('DB_CONNECT_TIMEOUT_MS') ?? 10_000,
  statement_timeout: this.configService.get<number>('DB_STATEMENT_TIMEOUT_MS') ?? 30_000,
  query_timeout: this.configService.get<number>('DB_QUERY_TIMEOUT_MS') ?? 30_000,
  application_name: `etabella-${process.env.APP_NAME ?? 'unknown'}`,  // see 2.5
};
```

Different services need different ceilings — `coreapi` API requests want ≤5s; `batchfile` / `export` jobs need 5+ minutes. Put the value in `ecosystem.config.js` per app.

### 2.5 No `application_name`

Add `application_name: 'etabella-coreapi'` (or per-service) to the pool config. Then in DB:

```sql
SELECT application_name, count(*), state
FROM pg_stat_activity
WHERE datname = 'etabella.legal'
GROUP BY 1, 3;
```

…tells you which microservice is hoarding connections. Right now it just shows `node` for every row.

---

## 3. Query construction — the string-interpolation pattern

File: `libs/global/src/db/pg/query-builder.service.ts:62-85`

```ts
const cleanedModel = this.setNullValues({ ...model });
const modelString = JSON.stringify(cleanedModel).replace(/'/g, "''");
qr = `select * from ${schema || 'public'}.et_${apiFunction} ('${modelString}',${prs1})${prs2};`;
```

### 3.1 The risk

You build SQL by string concat with **manual single-quote escaping**. The single layer of `.replace(/'/g, "''")` is easy to bypass — for example, any value containing the byte sequence the parser treats as an end-of-string-literal in extended escape mode, or a smuggled JSON value with a backslash + quote sequence, can break out. This pattern is **the textbook SQL-injection footgun** that parameterized queries exist to eliminate.

It mostly hasn't bitten you because:
- All inputs go through one JSON blob that becomes a single string literal — most attacks need a structural break.
- `set_nullValues` coerces by prefix.

But it is **one bad call** away from RCE-level damage. The fix is to use the driver's parameter binding:

```ts
const sql = `select * from ${schema}.et_${apiFunction} ($1::json, ${prs1})${prs2};`;
const params = [JSON.stringify(cleanedModel)];
return this.pool.query(sql, params);
```

The `$1::json` placeholder ships the JSON as a typed parameter — the driver handles escaping, no manual `.replace()` needed. The `${schema}.et_${apiFunction}` is identifier interpolation; this is OK **only if** `schema` and `apiFunction` come from a hard-coded allowlist (your `schemaType` union enforces schema; `apiFunction` is currently any string — clamp it to `^[a-z_][a-z0-9_]*$` and reject anything else).

### 3.2 Refcursor batch fetch — what it costs you

The generated SQL looks like:

```sql
select * from public.et_marks ('{...json...}','r1','r2','r3'); fetch all in "r1"; fetch all in "r2"; fetch all in "r3";
```

This is a multi-statement query. Side effects:

- **Implicit transaction.** The whole thing runs in one transaction, so cursors stay open between statements. That's why it works at all. But it also means **every** call holds a transaction for its full duration — locks are held longer, MVCC bloat grows faster.
- **No prepared statements.** `pool.query(text)` with no params and a unique JSON-literal in every call defeats the planner cache. Postgres re-parses and re-plans every call. For frequent small SPs (e.g. `et_marks`, `et_realtime_issuelist_group`) that adds 0.5–2 ms × every call.
- **No protocol-level pipelining.** All result sets come back serialized, including any you don't use.

The alternative is to call functions normally and let them return tables instead of cursors:

```sql
CREATE OR REPLACE FUNCTION realtime.et_marks_v2(parameter json)
RETURNS TABLE(part text, payload json) AS $$
BEGIN
  RETURN QUERY SELECT 'fact'::text, json_agg(...) FROM ... ;
  RETURN QUERY SELECT 'highlight', json_agg(...) FROM ... ;
END;
$$ LANGUAGE plpgsql STABLE;
```

…called with `pool.query('SELECT part, payload FROM realtime.et_marks_v2($1::json)', [json])`. One round trip, no transaction, cacheable plan, parameterized. Migrating every SP is a multi-week project — pick the top ~20 hottest from `pg_stat_statements` and start there. Don't try to do it all at once.

---

## 4. Stored-procedure code quality

Patterns observed across migrations in `assets/sql-migrations/`:

### 4.1 `EXCEPTION WHEN OTHERS` swallows everything

`et_admin_update_bundledetail.sql:100-102`:

```sql
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Logging failed: %', SQLERRM;
END;
```

Catches **any** exception — including out-of-memory, deadlock, query cancellation — and logs it as a NOTICE. Audit logs silently drop on errors. Use specific exception classes (`unique_violation`, `foreign_key_violation`) and let everything else propagate.

### 4.2 Sequential lookups inside SPs

Many SPs do this:

```sql
isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true) then true else false end;
select "nTeamid","nRoleid" into nTeamid, nRoleid from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
if (isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
  isAdmin := true;
end if;
```

Three sequential index lookups before the real query. Combine into one CTE:

```sql
WITH ctx AS (
  SELECT
    um."isAdmin"
      OR (rm."nSrno" = 1) AS "isAdmin",
    tr."nTeamid", tr."nRoleid"
  FROM "UserMaster" um
  LEFT JOIN "TeamRelation" tr ON tr."nUserid" = um."nUserid" AND tr."nCaseid" = nCaseid
  LEFT JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
  WHERE um."nUserid" = nUserid
)
SELECT ... FROM ctx, "FactMaster" f WHERE ...;
```

For a hot SP called per-session, this saves 2 round-trip-equivalents per call.

### 4.3 Function volatility not declared

None of the SPs you've shown have `STABLE` or `IMMUTABLE` markers. Default is `VOLATILE`, which means the planner cannot:
- Reuse the result inside a single query
- Push the call into an index expression
- Run it in a parallel worker

Mark **read-only** SPs as `STABLE`:

```sql
CREATE OR REPLACE FUNCTION public.et_realtime_issuelist_group(...)
  RETURNS SETOF refcursor
  LANGUAGE plpgsql
  STABLE   -- <-- add
AS $function$ ... $function$;
```

Mark mutating SPs as `VOLATILE` (default) and leave them.

### 4.4 Diagnostic noise

`et_realtime_issuelist_group.sql:64`: `raise notice 'nRoleid %', nRoleid;` — strip these before shipping, or gate behind `current_setting('app.debug', true) = 'on'`. Each NOTICE is a server-to-client message.

### 4.5 The migrations themselves show a pattern

5 of the 15 migrations in `assets/sql-migrations/` are bug fixes for **unbounded JOIN explosions** in `et_marks` (returning N×duplicates because of a `LEFT JOIN "TeamRelation"` not bound to anything). That's a symptom of writing SPs without a regression test harness. Consider:

- A simple Jest spec per SP that seeds rows and asserts row counts/shapes (you already have ts-jest set up)
- `EXPLAIN (ANALYZE, BUFFERS)` snapshots committed alongside the SP definition
- Storing SP source in `assets/sql-migrations/` consistently — currently several SPs (`public.et_realtime_issuelist_group_backup`) live only in the DB, which makes review impossible

---

## 5. Schema observations

What I can infer from the migrations + JOINs:

| Table | Notes |
|---|---|
| `UserMaster`, `TeamRelation`, `RoleMaster`, `IssueCategory`, `RIssueMaster`, `FactMaster`, `FactDetail`, `FMShared`, `FMIssue`, `RHighlights`, `RSessionMaster`, `DocMaster`, `DocDetail`, `DMShared`, `BundleDetail`, `BDAttributes`, `RUserQFactPref`, `RUserQFactClaimPref`, `RClaimSequence`, `RIssueSequence` | All quoted PascalCase identifiers — locked in forever. Hot tables for the realtime module. |
| `team_issues` | A view, not a table. Joins `RIssueMaster` → `IssueCategory` → `TeamRelation` via the issue's `nUserid`. Hot in `et_realtime_issuelist_group`. **Materialized view candidate** if it's slow under load — see §7. |

### 5.1 Missing FKs

The only FK in the migrations I read is `RUserQFactPref.nIid → RIssueMaster.nIid ON DELETE CASCADE`. It is highly likely that most of `FactDetail.nFSid → FactMaster`, `RHighlights.nSessionId → RSessionMaster`, `BDAttributes.nBundledetailid → BundleDetail`, etc. **have no FK at all**. Verify with:

```sql
SELECT
  conrelid::regclass AS table_name,
  conname,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'f'
ORDER BY conrelid::regclass::text;
```

Missing FKs mean orphaned-row bugs that the application has to defend against in every SP. Adding FKs retroactively is risky on a live DB (the validation scan can lock the table for minutes). The safe pattern:

```sql
-- 1. Add as NOT VALID first (instant, no scan, enforced for new writes only)
ALTER TABLE "FactDetail"
  ADD CONSTRAINT "FactDetail_nFSid_fkey"
  FOREIGN KEY ("nFSid") REFERENCES "FactMaster"("nFSid")
  NOT VALID;

-- 2. Validate later in low-traffic window (scans, but doesn't block writes)
ALTER TABLE "FactDetail" VALIDATE CONSTRAINT "FactDetail_nFSid_fkey";
```

### 5.2 Naming convention has costs

The `nXxx` / `cXxx` / `bXxx` / `dXxx` / `jXxx` prefix scheme drives the JS-side `setNullValues()` switch in `query-builder.service.ts:22-60`. That function:
- Treats anything starting with `n` as a number (but UUIDs are also `n`-prefixed — `nUserid` is a UUID, not a number)
- Treats anything starting with `j` as JSON and runs `JSON.stringify().replace(/'/g, "''")` on it

This works because everything is shipped as JSON in one blob and the SP unpacks it, but it means **your TypeScript layer has no idea what the actual column types are**. There is no compile-time check that `nUserid` is a UUID. Anyone passing a malformed UUID gets a Postgres error at runtime, deep in a SP. This is a long-term debt, not a quick fix.

### 5.3 Multiple schemas

`schemaType = 'present' | 'public' | 'helpcenter' | 'elastic' | 'download' | 'realtime' | 'transcript' | 'task'`

If these were created for isolation (search_path-driven privilege separation), that's good. If they were created because someone wanted folders, they add overhead — every cross-schema JOIN needs explicit qualification, and a fully-qualified name in a hot loop costs catalog lookups. Verify with:

```sql
SELECT schemaname, count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY 1;
```

---

## 6. Run these diagnostic queries NOW — they are the basis for everything else

Without `EXPLAIN ANALYZE` plans and `pg_stat_statements` data, every recommendation below is a guess. Run these in `psql` against the prod DB and paste the results back to me — that's the difference between this report and a real optimization plan.

### 6.1 Enable `pg_stat_statements`

Vultr ships with the extension available; enable it once:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- Add to postgresql.conf via Vultr console:
--   shared_preload_libraries = 'pg_stat_statements'
--   pg_stat_statements.max = 10000
--   pg_stat_statements.track = all
-- Restart required.
```

### 6.2 Top-20 slowest queries (after a week of traffic)

```sql
SELECT
  substr(query, 1, 200) AS query,
  calls,
  round(total_exec_time::numeric, 0) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct,
  rows
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 20;
```

This is the **single most valuable thing** you can collect. The whole "where do I add indexes" question evaporates once you have this list.

### 6.3 Tables with heavy seq scans (missing indexes)

```sql
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
```

High `seq_tup_read` + high `pct_seq` on a large table = missing index.

### 6.4 Unused indexes (dead weight on writes)

```sql
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
```

### 6.5 Bloat estimate (autovacuum keeping up?)

```sql
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC NULLS LAST
LIMIT 30;
```

Anything > 20% dead tuples on a hot table needs a more aggressive `autovacuum_vacuum_scale_factor` for that table.

### 6.6 Connection state right now

```sql
SELECT application_name, state, wait_event_type, wait_event, count(*)
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY 1, 2, 3, 4
ORDER BY count(*) DESC;
```

If you see hundreds of `idle in transaction` rows, that's the multi-statement-per-call pattern (§3.2) holding transactions longer than necessary. If `state=active` count is close to your pool ceiling, you need PgBouncer.

### 6.7 Long-running queries (find runaway SPs now)

```sql
SELECT pid, application_name, state,
       now() - query_start AS runtime,
       wait_event_type, wait_event,
       substr(query, 1, 200) AS query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - interval '10 seconds'
ORDER BY query_start;
```

Anything > 30s without a reason is a candidate to kill, then to investigate. With `statement_timeout` set (§2.4), this list should be near-empty.

---

## 7. Index strategy — what to verify on the hot SPs

Without `pg_stat_statements`, these are **best guesses** based on the JOIN columns I saw in `et_marks`, `et_realtime_issuelist_group`, and `et_admin_update_bundledetail`. Run §6.3 first; only add what shows up missing.

```sql
-- et_marks (called per user-session in realtime module)
CREATE INDEX IF NOT EXISTS ix_FactMaster_nSesid_nUserid
  ON "FactMaster" ("nSesid", "nUserid");
CREATE INDEX IF NOT EXISTS ix_FactDetail_nFSid
  ON "FactDetail" ("nFSid");
CREATE INDEX IF NOT EXISTS ix_RHighlights_nSessionId_nUserid
  ON "RHighlights" ("nSessionId", "nUserid");
CREATE INDEX IF NOT EXISTS ix_FMShared_nFSid_nUserid
  ON "FMShared" ("nFSid", "nUserid");
CREATE INDEX IF NOT EXISTS ix_DMShared_nDocid_nUserid
  ON "DMShared" ("nDocid", "nUserid");
CREATE INDEX IF NOT EXISTS ix_DocMaster_nSesid_nUserid
  ON "DocMaster" ("nSesid", "nUserid");
CREATE INDEX IF NOT EXISTS ix_TeamRelation_nUserid_nCaseid
  ON "TeamRelation" ("nUserid", "nCaseid");

-- et_realtime_issuelist_group
CREATE INDEX IF NOT EXISTS ix_IssueCategory_nCaseid
  ON "IssueCategory" ("nCaseid");
CREATE INDEX IF NOT EXISTS ix_RIssueMaster_nICid
  ON "RIssueMaster" ("nICid");
CREATE INDEX IF NOT EXISTS ix_FMIssue_nIssueid
  ON "FMIssue" ("nIssueid");

-- BundleDetail update path
CREATE INDEX IF NOT EXISTS ix_BDAttributes_nBundledetailid
  ON "BDAttributes" ("nBundledetailid");
```

**Add indexes `CONCURRENTLY` in production** — a normal `CREATE INDEX` takes an `ACCESS EXCLUSIVE` lock and freezes writes:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_FactMaster_nSesid_nUserid
  ON "FactMaster" ("nSesid", "nUserid");
```

`CONCURRENTLY` cannot run inside a transaction, takes 2× longer, and can leave an `INVALID` index if it fails — re-create it if it does.

### 7.1 The `team_issues` view

If `et_realtime_issuelist_group` is in the top-10 of pg_stat_statements, consider materializing `team_issues`:

```sql
CREATE MATERIALIZED VIEW team_issues_mv AS
SELECT ... FROM "RIssueMaster" im
JOIN "IssueCategory" ic ON ...
JOIN "TeamRelation" tr ON ...;

CREATE UNIQUE INDEX ON team_issues_mv ("nIid", "nTeamid");

-- Refresh on a schedule, or trigger from RIssueMaster / TeamRelation INSERT/UPDATE/DELETE.
REFRESH MATERIALIZED VIEW CONCURRENTLY team_issues_mv;
```

A materialized view trades freshness (you pick the refresh interval) for query speed. Worth it only if the view is hot AND its inputs change less often than it's read.

---

## 8. Server-side tuning (Vultr managed Postgres)

Vultr managed Postgres exposes `postgresql.conf` knobs through its dashboard. The defaults are conservative — check the current values and tune.

```sql
-- See current values
SELECT name, setting, unit, source
FROM pg_settings
WHERE name IN (
  'shared_buffers', 'effective_cache_size', 'work_mem', 'maintenance_work_mem',
  'max_connections', 'random_page_cost', 'effective_io_concurrency',
  'autovacuum_vacuum_scale_factor', 'autovacuum_analyze_scale_factor',
  'wal_buffers', 'checkpoint_completion_target', 'default_statistics_target',
  'max_wal_size', 'jit', 'log_min_duration_statement'
)
ORDER BY name;
```

Sane targets for a managed DB on, say, 4GB RAM / 2 vCPU:

| Setting | Target | Why |
|---|---|---|
| `shared_buffers` | 25% of RAM | Default is usually 128MB — way too low |
| `effective_cache_size` | 50–75% of RAM | Planner hint, not allocation |
| `work_mem` | 16–32 MB | Per-sort/hash-op. Too low → spill to disk; too high → OOM under concurrency |
| `maintenance_work_mem` | 256 MB+ | Speeds `CREATE INDEX`, `VACUUM` |
| `random_page_cost` | 1.1 | Default 4.0 assumes spinning disk; SSD is ~1.1 |
| `effective_io_concurrency` | 200 | SSD parallel-read hint |
| `default_statistics_target` | 200 | Default 100 — bump for better plans on skewed columns |
| `log_min_duration_statement` | 500 | Log any query > 500ms (start higher in prod, lower as you fix) |
| `autovacuum_vacuum_scale_factor` | 0.1 (down from 0.2) globally, or per-table on hot ones | Vacuum sooner |

These need a restart for `shared_buffers`. Schedule a window.

---

## 9. Caching — Redis is here, use it

`RedisDbService` exists (`libs/global/src/db/redis-db/redis-db.service.ts`) and you've wired ioredis. Two underused opportunities:

1. **Read-side cache for read-heavy SPs.** `et_realtime_issuelist_group` returns a per-case-per-user list of issues — cache key `issues:{caseid}:{userid}`, TTL 60s, invalidate on any mutation to `RIssueMaster` / `RUserQFactPref` / `RUserQFactClaimPref` for that case. The migration already has the invalidation surface (only those tables drive the response).
2. **Permission/role cache.** Every SP starts with the same `SELECT isAdmin FROM UserMaster + TeamRelation lookup` (see §4.2). That's static-per-session data. Cache it in Redis with a 5-minute TTL keyed by `(nUserid, nCaseid)`, invalidate on team membership change. You already have `JwtMiddleware` checking Redis for sessions — same pattern.

Both are in service code, not in SPs — keeps the DB simpler.

`redis-db.service.ts` also has a debug listener that logs **every command** (`this.redis.on('command', ...)`). Strip in prod or it'll dominate your log volume.

---

## 10. Long-term roadmap

Order of work:

1. **Week 1** — security: rotate creds, fix SSL, add `application_name`, add `statement_timeout`, fix `process.exit`. Low risk, high impact.
2. **Week 2** — observability: enable `pg_stat_statements`, ship the diagnostic queries (§6) to a dashboard, set `log_min_duration_statement=500`. You can't optimize what you can't see.
3. **Week 3–4** — measure, then add indexes (§6.3) to the actual top-10 sequential-scan victims. Don't add the speculative ones in §7 until §6.3 confirms.
4. **Week 4** — Redis caching for the two hot read paths (§9).
5. **Month 2** — PgBouncer in front of Vultr. Test session vs. transaction pooling carefully because of the refcursor pattern.
6. **Quarter 2** — start migrating the top-N hottest SPs from refcursor pattern to `RETURNS TABLE` + parameterized calls (§3). One per sprint, with regression tests.
7. **Ongoing** — every new SP committed to `assets/sql-migrations/` ships with `EXPLAIN (ANALYZE, BUFFERS)` against representative data.

---

## What I could not assess without DB access

- **Actual table sizes & row counts** — drives index-vs-no-index decisions
- **Real query frequencies** — which of the ~118 `executeRef` call sites in the codebase are hot vs. cold
- **Lock contention** — does the multi-statement transaction pattern (§3.2) actually cause waits? `pg_locks` would tell us
- **The full SP catalog** — only 15 SPs are in `assets/sql-migrations/`; the other (~hundreds) live only in the database
- **`autovacuum` health** — table bloat needs §6.5 to assess

Run the queries in §6 against the prod DB and paste me the results — I can then turn this generic plan into a ranked, table-by-table action list with concrete numbers.
