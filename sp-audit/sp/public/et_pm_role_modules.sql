CREATE OR REPLACE FUNCTION public.et_pm_role_modules(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nRoleid uuid;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
nRoleid := (parameter ->>'nRoleid')::uuid;
/*
 select * from et_pm_role_modules('{""nMasterid"":2,""nRoleid"":2,""cStatus"":""A"",""nCaseid"":22}','r1');FETCH All in ""r1""

select * From ""PermissionModule""
*/

	
OPEN ref1 FOR 

select p."nPMid",p."cModule",case when count(rp."nRPid")>0 then false else true end as "bValue"
from "PermissionModule" p
left join "RolePermission" rp on rp."nCaseid" = nCaseid and rp."nRoleid" = nRoleid and rp."nPMid" = p."nPMid"
group by p."nPMid",p."cModule";

RETURN NEXT ref1;

	 
END;
$function$
