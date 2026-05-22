-- 2026-05-20 — Section render order (Phase 2.1)
--
-- The Evidence sidebar lists sections (Master Bundle, Private Bundle,
-- Transcript, …) in whatever order `et_admin_sections` returns them. Today
-- that's `ORDER BY "nSectionid"` — a UUID, so the order is effectively
-- random per case (Transcript before Master Bundle is the typical bad case).
--
-- This migration moves the ordering into the data:
--   1. Adds nSectionOrder SMALLINT to SectionMaster.
--   2. Back-fills it from the legacy cFoldertype code:
--        MB → 0   Master Bundle
--        CB → 1   Private Bundle (production label for cFoldertype='CB')
--        CO → 2   Core Assigned
--        TS → 3   Transcript
--        M  → 4   Generic / My Folders
--        TF → 5   Team Folders
--        CF → 6   User Files
--        anything else → 999 (sorts to the end)
--   3. Creates ix_section_case_order to keep the new ORDER BY index-only.
--   4. Replaces et_admin_sections to ORDER BY nSectionOrder.
--
-- Backward-compatible: rows that don't get a value still sort by nSectionid
-- via the COALESCE fallback in the SP. Frontend keeps its belt-and-suspenders
-- service-layer sort (Phase 1) as defence-in-depth.
--
-- Rollback: see 2026-05-20_section_order.down.sql
-- Run against: dev.etabella.com.uuid first; then etabella.legal.

BEGIN;

-- 1. Column
ALTER TABLE "SectionMaster"
  ADD COLUMN IF NOT EXISTS "nSectionOrder" SMALLINT;

-- 2. Back-fill (only rows that don't already have a value, in case this
--    migration is re-run after partial application).
UPDATE "SectionMaster" SET "nSectionOrder" =
  CASE "cFoldertype"
    WHEN 'MB' THEN 0
    WHEN 'CB' THEN 1
    WHEN 'CO' THEN 2
    WHEN 'TS' THEN 3
    WHEN 'M'  THEN 4
    WHEN 'TF' THEN 5
    WHEN 'CF' THEN 6
    ELSE 999
  END
WHERE "nSectionOrder" IS NULL;

-- 3. Index — `et_admin_sections` filters by nCaseid then orders by
--    (nSectionOrder, nSectionid), so a composite covers both clauses.
CREATE INDEX IF NOT EXISTS ix_section_case_order
  ON "SectionMaster" ("nCaseid", "nSectionOrder", "nSectionid");

-- 4. SP — same signature, new ORDER BY. COALESCE keeps anything with a
--    NULL nSectionOrder (shouldn't happen post-backfill) sorting to the end
--    instead of vanishing.
CREATE OR REPLACE FUNCTION public.et_admin_sections(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID; nCaseid UUID;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
nCaseid := (parameter ->>'nCaseid')::UUID;
/*
 select * from et_admin_sections('{"nMasterid":59,"nCaseid":22}','r1');FETCH All in "r1";
 */
OPEN ref1 FOR
select "nSectionid","cFolder","cFoldertype"
from "SectionMaster"
where "nCaseid" = nCaseid and "nUserid" IS NULL
order by COALESCE("nSectionOrder", 999), "nSectionid";

RETURN NEXT ref1;

END;
$function$;

COMMIT;
