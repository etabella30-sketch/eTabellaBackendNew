-- 2026-05-20 — Rollback of section render order (Phase 2.1)
--
-- Restores et_admin_sections to its previous ORDER BY "nSectionid",
-- drops the helper index, then drops the nSectionOrder column.
--
-- Idempotent: every step is IF EXISTS-guarded so re-running is safe.
-- Run against the same DB the .up.sql was applied to.

BEGIN;

-- 1. Restore the previous SP body (frozen copy lives at
--    sp-audit/sp/public/_versions/et_admin_sections.before-section_order.sql).
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
 -- select * From "SectionMaster"
 */
    -- select * from "SectionMaster"
OPEN ref1 FOR
select "nSectionid","cFolder","cFoldertype"
from "SectionMaster" where "nCaseid" = nCaseid and "nUserid" IS NULL
order by "nSectionid";

RETURN NEXT ref1;

END;
$function$;

-- 2. Drop the helper index.
DROP INDEX IF EXISTS ix_section_case_order;

-- 3. Drop the column.
ALTER TABLE "SectionMaster" DROP COLUMN IF EXISTS "nSectionOrder";

COMMIT;
