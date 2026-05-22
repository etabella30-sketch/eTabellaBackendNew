CREATE OR REPLACE FUNCTION public.et_pm_role_statusmanage(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nRoleid uuid; cStatus text;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
nRoleid := (parameter ->>'nRoleid')::uuid;
cStatus := parameter ->>'cStatus';
/*
 select * from et_pm_role_statusmanage('{""nMasterid"":2,""nRoleid"":2,""cStatus"":""A"",""nCaseid"":22}','r1');FETCH All in ""r1""

select * from ""UserMaster"" 

select * from ""RolePermission""

*/

-- update ""UserMaster"" u set ""cStatus"" = cStatus  from ""TeamRelation"" tr  where tr.""nCaseid"" = nCaseid and tr.""nRoleid"" = nRoleid and tr.""nUserid"" = u.""nUserid"";

 update "TeamRelation" set "cStatus" = cStatus where "nCaseid" = nCaseid and "nRoleid" = nRoleid;

	
OPEN ref1 FOR 
select 1 as msg,'Updated' as value,coalesce((select jsonb_agg("nUserid") from "TeamRelation" where "nCaseid" = nCaseid and "nRoleid" = nRoleid),'[]'::jsonb) as "users";
RETURN NEXT ref1;

	 
END;
$function$
