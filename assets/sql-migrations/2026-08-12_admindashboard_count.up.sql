-- 2026-08-12 — et_admindashboard_count: unpaginated case total for the Super
-- Admin case list.
--
-- The admin case-list SPs (et_admindashboard / et_admin_archivecase) return
-- three refcursors and NO total-count cursor, and the legacy admin frontend
-- hard-fails unless the response is exactly 3 cursors — so the count lives in
-- its own single-cursor SP instead of a 4th cursor. Filters mirror
-- et_admindashboard exactly: isArchived flag + case-insensitive
-- cCasename||cCaseno LIKE search. Consumed by the new
-- GET /admin-dashboard/caselistcount (Angular 21 admin Cases tiles/pager).

-- Dev-only guard: this migration must never run on prod (etabella.com.uuid).
DO $$
BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Refusing to run on database % — dev (etabella_tech_uuid) only', current_database();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.et_admindashboard_count(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare
    nMasterid uuid;
    cSearch text;
    bIsarchived boolean;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cSearch := coalesce(parameter ->>'cSearch', '');
bIsarchived := coalesce((parameter ->>'bIsarchived')::boolean, false);

/*
 select * from et_admindashboard_count('{"nMasterid":"<uuid>","cSearch":"","bIsarchived":false}','r1');FETCH All in "r1";
*/

OPEN ref1 FOR
select count(*)::int as "nTotalCount"
from "CaseMaster"
where "isArchived" = bIsarchived
  and upper("cCasename" || "cCaseno") like ('%' || upper(cSearch) || '%');

RETURN NEXT ref1;

END;
$function$;
