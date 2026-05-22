-- Frozen copy of et_admin_sections.sql immediately before the Phase 2.1
-- "section_order" migration (2026-05-20). Restore by running this file
-- as-is against the DB, or use 2026-05-20_section_order.down.sql.

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
$function$
