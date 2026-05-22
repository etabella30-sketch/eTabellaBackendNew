CREATE OR REPLACE FUNCTION public.et_pm_user_modules(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nUserid uuid;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
nUserid := (parameter ->>'nUserid')::uuid;
/*
 select * from et_pm_role_modules('{""nMasterid"":2,""nRoleid"":2,""cStatus"":""A"",""nCaseid"":22}','r1');FETCH All in ""r1""

select * From ""UserPermission""
*/

	
OPEN ref1 FOR 

select p."nPMid",p."cModule",case when count(up."nUPid")>0 then false else true end as "bValue"
from "PermissionModule" p
left join "UserPermission" up on up."nCaseid" = nCaseid and up."nUserid" = nUserid and up."nPMid" = p."nPMid"
group by p."nPMid",p."cModule";

RETURN NEXT ref1;

	 
END;
$function$
