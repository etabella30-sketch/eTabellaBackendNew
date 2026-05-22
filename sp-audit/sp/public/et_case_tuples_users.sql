CREATE OR REPLACE FUNCTION public.et_case_tuples_users(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN
-- select * from "UserMaster"
-- select * from et_case_tuples_users ('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","nMasterid":"bc669a9e-6388-42af-9a94-f438e907ea30"}','r1');fetch all in "r1";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from "TeamRelation"
*/
	
OPEN ref FOR 
	select distinct  t."nCaseid",t."nTeamid",t."nUserid"
	From "TeamRelation" t  
	where t."nCaseid" = nCaseid;

RETURN ref;

END;
$function$
