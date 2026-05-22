CREATE OR REPLACE FUNCTION helpcenter.et_help_sub_module_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;
	nSMid uuid;

BEGIN

/*
	 select * from helpcenter.et_help_sub_module_detail('{"nSMid": 15, "nMasterid": 29}','r');fetch all in "r"
	 select * from helpcenter."SubModule";
	 select * from helpcenter."Modules";
	select * from helpcenter."RelationKey"
	
*/
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSMid := NULLIF(parameter ->>'nSMid','')::uuid;

	open ref for
		select * FROM helpcenter."SubModule" where "nSMid"= nSMid;
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
