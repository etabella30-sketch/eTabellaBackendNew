CREATE OR REPLACE FUNCTION public.et_teams(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
 select * from et_teams('{"nMasterid":2,"pageNumber":1,"nCaseid":22}','r1');FETCH All in "r1"
 
 
*/
	
OPEN ref1 FOR 
select t."nTeamid",t."cTeamname",t."cFlag",t."cClr"
--,case when count(u."nTeamid") > 0 then jsonb_agg(distinct u) else '[]'::jsonb  end as "users"
from "TeamMaster" t
/*left join (
	select u."nUserid",u."cFname",u."cLname",u."cProfile",tr."nTeamid"
	from "UserMaster" u
	join "UserSetting" us on us."nCaseid" = nCaseid and us."nUserid" = u."nUserid"
	join "TeamRelation" tr on tr."nUserid" = u."nUserid"
) u on u."nTeamid" = t."nTeamid"*/
where t."nCaseid" = nCaseid
--group by  t."nTeamid",t."cTeamname",t."cFlag"
;
RETURN NEXT ref1;
/*
OPEN ref2 FOR 
   	select u."nUserid",u."cFname",u."cLname",u."cProfile",tr."nTeamid"
	from "UserMaster" u
	--join "UserSetting" us on  us."nUserid" = u."nUserid"
	join "TeamRelation" tr on tr."nUserid" = u."nUserid"
 	join "TeamMaster" tm on tm."nTeamid" = tr."nTeamid"
	where tm."nCaseid" = nCaseid
	;
RETURN NEXT ref2;*/
	 
END;
$function$
