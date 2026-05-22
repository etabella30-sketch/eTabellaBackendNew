CREATE OR REPLACE FUNCTION helpcenter.et_help_module_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare
	nMasterid uuid;
	nKeyid uuid;

BEGIN

/*	
	select * from helpcenter.et_help_module_list('{""nKeyid"": 25, ""nMasterid"": 29}','r');fetch all in ""r""
	select * from helpcenter."Modules";
*/

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nKeyid := NULLIF(parameter ->>'nKeyid','')::uuid;

	open ref for
		select "nMainid", "cTitle", "cImage" FROM helpcenter."Module" order by "cTitle" asc;
		-- SELECT DISTINCT ON (mm."cTitle") mm."cTitle", mm."nMainid", mm."cImage" FROM helpcenter."Module" mm
		-- left join helpcenter."RelationKey" rk on rk."nMainid" = mm."nMainid"
		-- where COALESCE(nKeyid, 0) = 0 OR rk."nKeyid" = nKeyid
		-- order by mm."cTitle" asc;
 
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
