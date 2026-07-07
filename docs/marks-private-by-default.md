# Marks private by default (2026-07-07)

Migration: `assets/sql-migrations/2026-07-07_marks_private_by_default.{up,down}.sql`

## Requirement

Any annotation (QFact / Fact / DocLink / highlight — document or transcript) is
visible ONLY to its creator until explicitly shared. Sharing later stays
available through the existing flows.

## What we found (live SP audit, 2026-07-07)

The DB layer already implements default-private for regular members:

- Fetch SPs (`realtime.et_marks`, `realtime.et_navigate_get_all`,
  `public.et_doc_annotations`, `public.et_navigate_*`, …) filter
  `creator = viewer OR share-row exists`.
- Share tables: `FMShared` (facts, per-user bCanEdit/bCanReshare/bCanComment +
  nShareBy), `DMShared` (doclinks), `WMShared` (weblinks), `LocationShare`
  (per document location), `BDShare` (bundles / Team Folders).
- "Share later" = `et_fact_insert_team` → FMShared upsert + notification.
- Insert SPs write NO share rows — creation is private.

The leak was the **admin bypass**: `isAdmin = UserMaster.isAdmin OR case role
nSrno = 1` unlocked an `or (case when isAdmin then X."nUserid" = tr."nUserid")`
branch, showing admins every teammate's marks. The whole internal test team has
`isAdmin = true`, which is why "everyone sees everything".

## What the migration changes

Removes ONLY the admin team-visibility branch from:

| Schema | SPs |
|---|---|
| realtime | et_marks, et_navigate_get_all, et_navigate_factlist, filter_marknav (6-arg), et_marknav_doclinks, et_navigate_fact_companies, et_navigate_facts_bycompany, et_marknav_team_user, et_factsheet_detail (bCanView/Comment/Edit/Reshare) |
| public | et_get_bundle_links, et_workspace_fact_list, et_bundledetail_with_filter (mark-filter subqueries only), et_fact_permissions |

Deliberately untouched:

- `public.et_doc_annotations` + the `public.et_navigate_*` doc-mode family —
  already private.
- `(isAdmin or "nBDPid" is null)` private-document gates — different feature.
- `et_bundledetail`'s isAdmin gates (private docs + BMPermission, not marks).
- `realtime.et_factsheet_delete` + `et_factsheet_detail.bCanDelete` — admin
  cleanup power stays (moot in UI once the row is invisible).
- `filter_marknav`'s 6-arg signature — the `isadmin` argument stays but is
  inert; callers keep passing it.

## Semantics after the migration

- Creator always sees own marks.
- Teammates (admin or not) see a mark only via FMShared/DMShared/LocationShare.
- The Navigate "created by" user dropdown (`et_marknav_team_user`) lists only
  yourself + users who shared marks with you.
- Transcript quick highlights (`RHighlights`) have no share table → strictly
  private, no share-later lane.

## Proof (throwaway PG)

`pg_dump --schema-only` of the live DB restored into a local postgres:16
container; fixture = 3 users (owner / teammate / admin=isAdmin), one case-team,
doc + session marks (fact, qfact, doclink, highlight) + FMLinks + issue.

Harness: scratchpad `test-marks-privacy.mjs` — 73 assertions, 0 failures:

1. PRE (live defs): owner sees own, teammate sees nothing, admin sees all.
2. `up.sql`: owner unchanged, admin sees nothing, `bCanView=false`,
   `bCanDelete` still true, smoke calls (doclinks / companies / bycompany /
   workspace) run clean, bundledetail_with_filter source bypass-free.
3. Share row (FMShared) → teammate sees the fact in Mark Nav + `bCanView=true`.
4. `down.sql`: PRE matrix passes again — rollback restores live behavior.

Pre-existing live bug found (NOT fixed here): `et_marknav_team_user` doc-mode
`nCaseid` lookup selects `bm."nCaseid"` — `BundleMaster` has no such column, so
the SP errors whenever called with `nBundledetailid` and no `nSesid`.

## Deploy

1. Run `2026-07-07_marks_private_by_default.up.sql` on live (single transaction
   safe — all CREATE OR REPLACE FUNCTION).
2. No backend service restart needed (SP-only), no FE change.
3. Smoke: two admin accounts open the same document — each sees only their own
   marks; share a fact → recipient sees it.
4. Rollback: run the `.down.sql`.
