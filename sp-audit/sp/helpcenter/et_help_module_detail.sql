CREATE OR REPLACE FUNCTION helpcenter.et_help_module_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare
	nMasterid uuid;
	nMainid uuid;

BEGIN

/*	
	select * from helpcenter.et_help_module_detail('{""nMainid"": 3, ""nMasterid"": 29}','r');fetch all in ""r""
	select * from helpcenter."Module";
*/

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nMainid := NULLIF(parameter ->>'nMainid','')::uuid;

	open ref for
		select "nMainid", "cTitle", "cImage", "dCreateDt" FROM helpcenter."Module" where "nMainid" = nMainid;
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
