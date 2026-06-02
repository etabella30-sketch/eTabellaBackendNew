-- 2026-06-02 — Advanced document search "rocket" indexes (Phase 2.5)
--
-- Powers the Evidence toolbar "Search by name, exhibit, tab…" box and the
-- Advanced Search panel (keyword + metadata scope), both of which call
-- public.et_bundledetail_search (executeRef key 'bundledetail_search',
-- endpoint GET /bundles/bundledetail-search).
--
-- PROBLEM
--   The SP's field-scoped "contains" predicate for each metadata column is
--       tsv_<col> @@ tsquery   OR   LOWER(COALESCE(bd."c<Col>", '')) ILIKE '%term%'
--   The tsv_<col> half was already GIN-indexed (idx_tsv_filename / _tab /
--   _exhibit / _desc / _author), but the ILIKE half was NOT. Because ONE side of
--   the OR was unindexable, the planner could not BitmapOr — so it ignored the
--   tsv GIN too and brute-scanned every row in the section
--   (idx_bd_section_status_sort + Filter). On the largest section (77,051 rows)
--   that measured (EXPLAIN ANALYZE, live DB):
--       cTab       contains  ~600 ms
--       cExhibitno contains  ~323 ms
--   …i.e. the advanced search was NOT "rocket" for substring queries.
--
-- FIX
--   Add an expression trigram (pg_trgm) GIN index on lower(coalesce(c<Col>,''))
--   for each searchable BundleDetail text column. The index expression matches
--   the SP's ILIKE predicate EXACTLY, so the planner can now
--       BitmapOr( idx_tsv_<col> , ix_bd_<col>_trgm )
--   and BitmapAnd that with the section index. Measured after (same section):
--       cTab        600 ms -> 0.7 ms
--       cExhibitno  323 ms -> 9.4 ms
--       cFilename        -> 15 ms
--       cDesc            -> 6.6 ms
--
-- DELIBERATELY SKIPPED
--   • cAuthor — 99.5% NULL, n_distinct=5 on this DB; a trigram index would be
--     dead weight. (Re-add with the same pattern if author data grows.)
--   • The contentType='All' path concatenates all 5 columns at runtime
--     (LOWER(cTab)||' '||LOWER(cFilename)||…) which is inherently unindexable; it
--     still relies on the section bound + the per-column tsv GIN, which is fast
--     because to_tsquery uses prefix (:*) matching for whole words.
--   • BundleMaster.tsv_bundlename / tsv_bundletag have no GIN, but BundleMaster
--     is small (27k rows / 22 MB) and every query is section-scoped first
--     (ix_bundlemaster_section), so its scan is already sub-5 ms. The existing
--     raw-column trigram GINs (ix_bundlemaster_bundlename/bundletag_trgm from
--     2026-06-02_bundle_name_search) cover folder-name substring search.
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block, so this
--       migration has NO BEGIN/COMMIT. BundleDetail is 414 MB / 304k rows;
--       CONCURRENTLY keeps writes online during the (~1-6 s each) build. If a
--       build is interrupted it can leave an INVALID index — re-running this
--       file is safe (IF NOT EXISTS), but drop any invalid index first.
--
-- Index footprint: ~46 MB total (cFilename 31 MB, cTab 7 MB, cDesc 4 MB,
--                  cExhibit 3.7 MB) on a 414 MB table.
-- Rollback: 2026-06-02_bundledetail_search_trgm.down.sql
-- Run against: 3.0.etabella.com.uuid (the active DB in .env.development) — APPLIED.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Expression trigram GIN per searchable column. Expression mirrors the SP's
-- predicate lower(coalesce("c<Col>", ''))::text so the planner matches it.
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_bd_filename_trgm
  ON public."BundleDetail" USING gin (lower(coalesce("cFilename", ''::character varying)::text) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_bd_tab_trgm
  ON public."BundleDetail" USING gin (lower(coalesce("cTab", ''::character varying)::text) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_bd_exhibit_trgm
  ON public."BundleDetail" USING gin (lower(coalesce("cExhibitno", ''::character varying)::text) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_bd_desc_trgm
  ON public."BundleDetail" USING gin (lower(coalesce("cDesc", ''::character varying)::text) gin_trgm_ops);

-- Refresh planner stats for the new expression indexes (Postgres only gathers
-- expression-column stats during ANALYZE).
ANALYZE public."BundleDetail";

-- Smoke test (largest section on 3.0.etabella.com.uuid):
--   EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM "BundleDetail" bd
--   WHERE bd."nSectionid" = '34f80f0a-e9d4-46f1-9713-b08b5e9c7040' AND bd."cStatus"='C'
--   AND (bd.tsv_tab @@ to_tsquery('report:*') OR LOWER(COALESCE(bd."cTab",'')) ILIKE '%report%');
--   -- expect: BitmapOr(idx_tsv_tab, ix_bd_tab_trgm), sub-millisecond.
