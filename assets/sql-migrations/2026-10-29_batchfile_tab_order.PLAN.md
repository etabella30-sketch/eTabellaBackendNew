# Batch file export order — `public.et_batchfile_getdata` (2026-10-29)

**Status:** PLAN ONLY — nothing applied to any database.
**Target:** DO prod `etabella.com.uuid` (`db-pgsql-sgp1-42479-…ondigitalocean.com:25060`). Dev `etabella_tech_uuid` should get the same change.
**Files:** `2026-10-29_batchfile_tab_order.up.sql` (fix) · `2026-10-29_batchfile_tab_order.down.sql` (rollback)

## Problem
Admin → Download Batch File for **ICC 28757/KFH — QD-SBG CONSTRUCTION WLL v URBACON** (case `75155c84-0528-4880-96e5-04f06da6daa3`), folder **Bundle D – EXPERT REPORTS** (`e2c07edd-3973-4617-8bbd-11deb58a59a6`, section `17773619-8295-48b2-a084-9726331106b8`) starts with `28 - Appendices`, then `Appendices` → `NCR 332`…, instead of D1, D2, D3…

## Root cause (verified on live, read-only)
Call path: coreapi/batchfile → Redis `batch_download:*` → Python `ocrbatch/tasks/batchfile.py` → `et_batchfile_getdata` → `generateBatchfile.py` (writes rows in SP order; no re-sort).

The SP orders by
```sql
ORDER BY (nBundleid IS NULL), alphanumeric_sort(array_to_string(sub_info,' / '))
-- sub_info = folder NAMES ... || cTab||cFilename
```
- `cBundletag` is never used → folders sort by **name**. Renamed folders without the tag prefix (`28 - Appendices` = D28, `Appendices` = D34, `Exhibits` = D35) jump ahead (digits < letters).
- The whole path is flattened into one string, so level boundaries are lost.
- Live run of the old query on this bundle reproduces the user's Excel row-for-row.

Data quality here is fine: 1,688 folders with 0 blank tags; 10,969 files with 0 blank tabs. Section-wide there's 1 blank tag, 1 blank tab, and 1 folder whose tag equals its parent's (`D3` under `D3`).

## Fix (SP body only)
Rule: **tab/tag assigned → sort by it; blank → sort by name.** This is the same rule the Master Index (`et_index_getfiles`) already uses on prod.

| Row | Level key |
|---|---|
| Folder | `sorted_bundletag` if tag non-empty **and** ≠ parent tag **and** unique among siblings; else `sorted_name` |
| File | `sorted_tab` if `cTab` non-empty; else `sorted_name` (filename) |
| Top level | Roman tags (I, II … X) are converted to numbers only when **all** top-level tags are roman (`roman_to_int`) |

- `sort_key = parent.sort_key || level_key || ['']`. The `''` terminator makes the comparison level by level, so D2 and its whole subtree come before D2.1 and D3, and D2 before D10.
- `ORDER BY (nBundleid IS NULL), sort_key, <old name key as tie-break>`.
- Uses the existing generated columns `BundleMaster.sorted_bundletag/sorted_name` and `BundleDetail.sorted_tab/sorted_name`. No new objects.
- Added a recursion **cycle guard** (`path_ids`). The old CTE never ends on a cyclic `BundleMaster`.
- Unchanged: the output columns and their order, the `Batchlog` insert, loose section files last, signature `(json, refcursor)`, owner and ACL. No service restart is needed.

## Dry run (live, read-only, plain SELECT of the new query; no Batchlog insert)
- Top level: `D1, D2/, D3/, D4/, D5/, D6, D7/, D8/, D9, D10/ … D27, 28 - Appendices/(D28), D29/, … D33, Appendices/(D34), Exhibits/(D35), D36 … D47/` ✔
- Inside a folder: `D2/ → D2.1/ → D2.1.1 … D2.1.15 → D2.1.16/ → D2.1.16.1/ → …` ✔
- Rows: 12,657 new = 12,657 old ✔. Time: ~12.3 s new vs ~12.5 s old ✔

## Apply (when approved)
1. Dev first: `psql … -d etabella_tech_uuid --set ON_ERROR_STOP=on -f 2026-10-29_batchfile_tab_order.up.sql`. The pre-flight may refuse if the dev body differs from prod; if so, compare and re-base.
2. Prod: same command with `-d "etabella.com.uuid"`. The pre-flight aborts unless the live body md5 is `2d638421b95595e715fa026557b4acd6` (checked 2026-10-29) or the new version is already installed (safe to re-run).
3. Verify: export Bundle D for the URBACON case from Admin and confirm it runs D1, D2, D3…

## Rollback
`psql … -d "etabella.com.uuid" --set ON_ERROR_STOP=on -f 2026-10-29_batchfile_tab_order.down.sql`
This restores the exact live body captured with `pg_get_functiondef` on 2026-10-29, then re-checks its md5 (`2d638421…`) and aborts if it doesn't match. It's a single `CREATE OR REPLACE` in one transaction, with no data touched, so it's instant and safe at any time.

## Known limits
- Two sibling folders with the **same** tag fall back to name order, by design (same as Master Index).
- `elastic.*` and the Evidence page are untouched (they already sort tag-first).
