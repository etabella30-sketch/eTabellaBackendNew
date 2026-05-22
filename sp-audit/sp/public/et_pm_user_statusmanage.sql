CREATE OR REPLACE FUNCTION public.et_pm_user_statusmanage(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nUserid uuid;cStatus text;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
cStatus := parameter ->>'cStatus';
/*
 select * from et_pm_user_statusmanage('{""nMasterid"":2,""nRoleid"":2,""cStatus"":""A"",""nCaseid"":22}','r1');FETCH All in ""r1""

select * from ""UserMaster"" 

select * from ""UserPermission""
-- select * from ""TeamRelation""
*/

-- update ""UserMaster"" set ""cStatus"" = cStatus where ""nUserid"" =nUserid;
 update "TeamRelation" set "cStatus" = cStatus where "nUserid" = nUserid and "nCaseid" = nCaseid;
 
	
OPEN ref1 FOR 
select 1 as msg,'Updated' as value;
RETURN NEXT ref1;

	 
END;
$function$
