CREATE OR REPLACE FUNCTION public.et_combo_teams(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
 select * from et_combo_teams('{""nMasterid"":2,""nCaseid"":22}','r1');FETCH All in ""r1"";
 
 
*/
	
OPEN ref1 FOR 
select "nTeamid","cTeamname","cFlag","cClr"
from "TeamMaster" where "nCaseid" = nCaseid;
RETURN NEXT ref1;
	 
END;
$function$
