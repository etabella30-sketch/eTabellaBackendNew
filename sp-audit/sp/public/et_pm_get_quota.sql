CREATE OR REPLACE FUNCTION public.et_pm_get_quota(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nRoleid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nRoleid := NULLIF(parameter ->>'nRoleid','')::uuid;
/*
 select * from et_pm_get_quota('{"nMasterid":2,"nRoleid":2,"cStatus":"A","nCaseid":22}','r1');FETCH All in "r1"

select * From "PermissionModule"
*/

	
OPEN ref1 FOR 

select "nCodeid","cCodename","jOther"->>'size' as "value" from "Codemaster" where "nCategoryid" = 12;
RETURN NEXT ref1;

	 
END;
$function$
