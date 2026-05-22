CREATE OR REPLACE FUNCTION public.et_teamcolors(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
	
    OPEN ref FOR 
	-- select "cClr" from "TeamMaster" where coalesce("cClr",'') !='' limit 20;
	select distinct "cClr" from "TeamMaster" where coalesce("cClr",'') !='' and "nCaseid" = nCaseid;
		
	 RETURN ref;
	 
END;
$function$
