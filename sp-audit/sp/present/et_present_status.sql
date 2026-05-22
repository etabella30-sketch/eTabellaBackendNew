CREATE OR REPLACE FUNCTION present.et_present_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nPresentid uuid;

BEGIN
-- select * from present.et_present_status('{"nPresentid":9, "nMasterid": 29}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
	-- select * from "PMContact"
open ref for

	SELECT   "cStatus"
		from present."PresentationMaster"
		where "nPresentid" = nPresentid ;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
