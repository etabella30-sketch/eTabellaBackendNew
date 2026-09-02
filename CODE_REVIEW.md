# Etabella Backend — Code Review

Scope: whole monorepo (`apps/` + `libs/`), config, and repo hygiene. Findings below are
**verified against source** where marked ✅. Severity: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low.

---

## Executive summary

The architecture is sound — clean NestJS monorepo, sensible service split, Kafka + Redis +
Postgres, shared `libs/global`. The problems are **operational and hygiene**, not structural:

1. **Secrets and runtime data are committed to git** (real credentials + 25 case-data files).
2. **CORS is open** (reflect-any-origin) across every service, plus a `*` WebSocket gateway.
3. **TLS to Postgres is not validated** (`rejectUnauthorized: false`).
4. **Effectively no test coverage** (~95% of spec files are empty scaffolds).
5. **Large dead/duplicated code** (multi-thousand-line services, `_backup`/`_old` files, 1,500+ `console.log`).

None block the app from running; several are serious for a production/legal system.

---

## 🔴 Critical

### C1. Committed secrets & credentials ✅ (verified via `git ls-files`)
These are **tracked in git**:
- `.jetro/daemon/credentials.json` — tool credentials
- `authuser.json` — user auth record
- `local-session.json` — session token(s)
- `data.json`, `faileddata/data.json` — production/legal transcript data
- `etabella-firebase.json` — Firebase service account (verify contents; service-account keys are highly sensitive)

**Fix:** purge from history (`git filter-repo` / BFG), rotate every exposed credential,
add explicit `.gitignore` entries. Rotation matters more than deletion — assume leaked.

> ✅ Correction to an earlier automated pass: `.env.development/.production/.docker` are
> **NOT** committed — they are correctly gitignored. Only `docker/.env.example` is tracked.

### C2. 25 case-data files committed under UUID folders ✅
Folders like `000b14bd-…/` and `…_H/` hold `raw_issues_*.json`, `output_highlights_*.json`,
`update_script_issues.sql` — runtime output, not source. 25 tracked files.
**Fix:** remove from repo + history; write runtime output outside the working tree; gitignore the pattern.

### C3. Near-zero test coverage ✅
285 `*.spec.ts` files but ~272 are the NestJS `it('should be defined')` scaffold; only ~13
have real assertions. For a legal-document system this is a regression-risk hole.
**Fix:** prioritise integration tests on auth (`JwtMiddleware`), the DB query builder, and the
export/transcript mega-services.

---

## 🟠 High

### H1. CORS reflects any origin, everywhere ✅ (pattern confirmed in `main.ts` files)
Every service uses `enableCors({ origin: true, credentials: true })` — reflects the caller's
origin and allows credentials, i.e. any website can make authenticated cross-site calls.
`apps/realtime/src/events/events.gateway.ts` is worse: `cors: { origin: '*' }`.
**Fix:** replace with an explicit allow-list from env (`CORS_ORIGINS`). Never pair
`origin: true`/`*` with `credentials: true`.

### H2. Postgres TLS not validated ✅ `libs/global/src/db/pg/db.service.ts:30`
```ts
if (sslConnection > 0) { cfg.ssl = { rejectUnauthorized: false }; }
```
Encrypts but accepts any certificate → MITM possible.
**Fix:** `rejectUnauthorized: true` with the CA cert in production.

### H3. Process suicide on idle DB error ✅ `db.service.ts:37-40`
```ts
this.pool.on('error', (err, client) => { this.logger.error(...); process.exit(-1); });
```
A transient idle-client error takes the whole process down. Under PM2 cluster it restarts,
but this amplifies brief DB hiccups into rolling restarts.
**Fix:** log + let the pool recover; don't `process.exit` on idle errors.

### H4. Fragile hand-rolled SQL string building 🟡→🟠 `libs/global/src/db/pg/query-builder.service.ts:79-81`
Not raw concatenation of user values (an earlier pass overstated this), but also **not
parameterized**:
```ts
const modelString = JSON.stringify(cleanedModel).replace(/'/g, "''");
qr = `select * from ${schema || 'public'}.et_${apiFunction} ('${modelString}',${prs1})${prs2};`;
```
Params are escaped by doubling single quotes (safe only while `standard_conforming_strings`
is on). `schema` and `apiFunction` are interpolated **unescaped** — safe today only because
all callers pass hardcoded literals. If either ever takes user input → SQL injection.
**Fix:** pass the JSON payload as a real bound parameter (`$1`) instead of an inlined literal;
validate/whitelist `apiFunction` and `schema`.

### H5. Path-traversal exposure in batch file access `apps/batchfile/src/services/batch/batch.service.ts` (~82,93,142)
User-supplied `cPath` is only `@IsString()` and is joined/concatenated onto a base path with
no normalize-and-verify. `path.join` blocks many `../` cases but there's no allow-list.
**Fix:** `path.normalize` then assert the resolved path stays within the base dir; reject otherwise.

### H6. Admin privilege sourced only from Redis cache `libs/global/src/middleware/jwt.middleware.ts`
`isAdmin` comes from the cached session and is never re-checked against the DB for sensitive
operations. Redis poisoning ⇒ privilege escalation. (Client cannot set the admin flag directly — that part is fine.)
**Fix:** re-validate admin server-side for high-impact actions, or tighten Redis auth/TTL.

---

## 🟡 Medium

### M1. Duplicate / conflicting dependencies ✅ (package.json)
- `aws-sdk` v2 **and** `@aws-sdk/*` v3 both present — v2 is EOL. Migrate to v3 only.
- `bull-board` v2 **and** `@bull-board/*` v5 — consolidate on v5.
- `pdfjs-dist@2.9` — ~2 major versions behind; security/parsing fixes missed.
- `"app": "^0.1.0"` — meaningless placeholder package; remove if unused.
- `sqlite3` + `lowdb` alongside `pg` — confirm each is actually needed (sqlite is used by `realtime` offline sync; `lowdb`?).

### M2. PM2 config drift ✅ `ecosystem.config.js`
14 processes defined vs 17 services. Missing: `downloadapi`, `realtime`, `backup`,
`etabella-nest`. Includes a non-existent `ocrbatch` (`./ocrbatch/main.js`). Script paths
`./apps/<svc>/main.js` may not match `nest build` output.
**Fix:** regenerate ecosystem to match `nest-cli.json`; verify paths against `dist/`.

### M3. Silent error swallowing ✅ (16 files, ~9 empty catches)
e.g. `apps/coreapi/src/controllers/task/task.controller.ts` (5×),
`apps/hyperlink/src/services/hyperlinksearch/hyperlinksearch.service.ts:199,268,293`,
`apps/upload/src/services/convert/convert.service.ts:145`,
`apps/pagination/src/services/paginate/paginate.service.ts:391`.
Also `DbService.query/executeRef` return `{success:false}` instead of throwing — every caller
must check, and many won't. **Fix:** log with context and propagate; add a lint rule against empty catches.

### M4. Hardcoded internal URL `apps/download/src/services/downloadfile/downloadfile.service.ts:36`
`private readonly pythonApiUrl = 'http://localhost:5020/download';` — move to env.

### M5. Backup script run via shell string `apps/backup/src/services/pgbackup/pgbackup.service.ts:82`
`execAsync(\`sh ${backupScript}\`)` — path is env-controlled (safe today) but shell
interpolation is fragile. **Fix:** `execFile('sh', [backupScript])`.

---

## ⚪ Low / cleanup

- **1,548 `console.log`** across 178 files — route through Winston or strip. High spots:
  `indexapi/.../queue.processor.ts` (53), `export-file.service.ts` (49),
  `realtime-server/.../events.gateway.ts` (23).
- **Dead/duplicate files:** `export-file_backup.service.ts` (2,077 lines),
  `issue.service_old.ts` (1,155), `filecopy.service.old.ts` — delete; git is the backup.
- **Mega-services (SRP violations):** `export-file.service.ts` (**2,986**),
  `bridge-parse.service.ts` (**2,634**, ~40% commented), `transcript_publish.service.ts` (2,407),
  `theme-css.service.ts` (1,519), `transcript-html.service.ts` (1,486),
  `downloadfile.service.ts` (1,448). Split into 400–600-line units.
- **24 TODO/FIXME/HACK** left in code (downloadapi, realtime-server utility/feed-data).
- **Stray root files:** `_t2.js`, `es-search-stub.js`, `hyperlink_test.txt`,
  `commands_replace.txt`, many `*.log`, and a **2.5 GB `docker.zip`** — remove from repo.
- **README.md** is one line — point it at this guide.
- Positive signals: **0 `@ts-ignore`**, consistent bootstrap pattern, Swagger everywhere,
  Winston wired, clean module boundaries.

---

## Suggested order of work

1. **Contain the leak** (C1): rotate secrets, purge git history, fix `.gitignore`. *(today)*
2. **Lock down the perimeter** (H1, H2): CORS allow-list, real TLS validation.
3. **Stability** (H3): stop `process.exit` on idle DB errors.
4. **Data hygiene** (C2, Low): drop UUID data folders, logs, `docker.zip`, `_backup/_old` files.
5. **Harden data layer** (H4, H5, H6, M3): parameterize SQL, validate paths, re-check admin, stop swallowing errors.
6. **Deps & PM2** (M1, M2): AWS SDK v3-only, consolidate bull-board, fix ecosystem drift.
7. **Tests** (C3): integration coverage on auth + DB + export/transcript.
8. **Refactor** (Low): split mega-services, purge `console.log`/dead code.

*Line numbers are approximate where not marked ✅; verify against the working tree before editing.*
