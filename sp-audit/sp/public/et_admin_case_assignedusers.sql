CREATE OR REPLACE FUNCTION public.et_admin_case_assignedusers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;

BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
select * from et_admin_case_assignedusers ('{"nCaseid":"22-uuid-format","nMasterid":"2-uuid-format"}','refcursor'); FETCH All in "refcursor";

*/

open ref for 
select "nTeamid" as t,"nUserid" as u,"nRoleid" as r
from "TeamRelation" 
where "nCaseid" = nCaseid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
