-- Rollback for 2026-06-02_bundledetail_search_trgm.up.sql
--
-- Drops the four advanced-search trigram indexes. The advanced search keeps
-- working after this (it falls back to the section-scan + Filter plan) but the
-- substring "contains" path returns to ~300-600 ms on large sections.
--
-- DROP INDEX CONCURRENTLY also cannot run inside a transaction block — no
-- BEGIN/COMMIT here.

DROP INDEX CONCURRENTLY IF EXISTS public.ix_bd_filename_trgm;
DROP INDEX CONCURRENTLY IF EXISTS public.ix_bd_tab_trgm;
DROP INDEX CONCURRENTLY IF EXISTS public.ix_bd_exhibit_trgm;
DROP INDEX CONCURRENTLY IF EXISTS public.ix_bd_desc_trgm;
