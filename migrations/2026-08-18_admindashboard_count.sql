-- et_admindashboard_count: unpaginated case totals for the Super Admin Cases
-- screen ("Active cases" / "Archived" tiles + table pager).
--
-- Already applied on dev (etabella_tech_uuid). Apply to the database the
-- deployed coreapi points at before/with the coreapi deploy that adds
-- GET /admin-dashboard/caselistcount, otherwise the FE falls back to "N+".
--
-- Guard: run only after confirming the target database.
--   select current_database();

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
$function$
