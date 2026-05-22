CREATE OR REPLACE FUNCTION helpcenter.et_help_sub_module_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nMainid uuid;
nKeyid uuid;

BEGIN

/*
	 select * from helpcenter.et_help_sub_module_list('{"nKeyid": 17, "nMainid":2, "nMasterid": 29}','r');fetch all in "r"
	 select * from helpcenter."SubModule";
	 select * from helpcenter."Modules";
	select * from helpcenter."RelationKey"
	
*/
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nMainid := NULLIF(parameter ->>'nMainid','')::uuid;
nKeyid := NULLIF(parameter ->>'nKeyid','')::uuid;

	open ref for
		select "cTitle", "cLink", "nSMid" FROM helpcenter."SubModule" where "nMainid"= nMainid order by 1 asc;
		-- SELECT DISTINCT ON (sm."cTitle") sm."cTitle", sm."cLink" FROM helpcenter."SubModule" sm
		-- left join helpcenter."RelationKey" rk on rk."nSMid" = sm."nSMid"
		-- where sm."nMainid"= nMainid
		-- and (nKeyid IS NULL OR rk."nKeyid" = nKeyid) 
		-- order by sm."cTitle" asc;
 
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
