CREATE OR REPLACE FUNCTION public.et_pm_userpermission(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
select * from et_pm_userpermission('{""nMasterid"":2,""pageNumber"":1,""nCaseid"":259}','r1','r2');FETCH All in ""r1"";FETCH All in ""r2""

select * from ""TeamMaster""
select * from ""RoleMaster""

select * from ""RolePermission""
-- select * from ""Codemaster""
*/

	-- select * from """"
OPEN ref1 FOR 

select distinct tm."nTeamid",tm."cTeamname",tm."cClr"
From "TeamMaster" tm
join "TeamRelation" tr on tm."nTeamid" = tr."nTeamid"  
join "UserMaster" um on um."nUserid" = tr."nUserid" 
where tm."nCaseid" = nCaseid
;

RETURN NEXT ref1;

	 -- select * from ""UserSetting""
	
OPEN ref2 FOR 
select tr."nRoleid",tr."nTeamid",r."cRole",um."nUserid",um."cFname",um."cLname",um."cProfile" ,tr."cStatus",coalesce(us."nQuota",1000000000000) "nQuota"
from "TeamRelation" tr 
join "UserMaster" um on um."nUserid" = tr."nUserid" 
join "RoleMaster" r on r."nRoleid" = tr."nRoleid"
left join "UserSetting" us on us."nCaseid" = nCaseid and us."nUserid" = um."nUserid"
where tr."nCaseid" = nCaseid
group by tr."nRoleid",tr."nTeamid",r."cRole",um."nUserid",um."cFname",um."cLname",um."cProfile" ,tr."cStatus",us."nQuota";

RETURN NEXT ref2;
	 
	 
END;
$function$
