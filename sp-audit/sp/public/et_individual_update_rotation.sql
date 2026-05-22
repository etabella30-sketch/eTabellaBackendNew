CREATE OR REPLACE FUNCTION public.et_individual_update_rotation(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
DECLARE nBundledetailid uuid;nMasterid uuid;nRotate int;

BEGIN
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
nRotate := parameter->>'nRotate';
/*

*/

update "BDAttributes" set  "nRotate" = nRotate where "nBundledetailid" = nBundledetailid;

	  
    OPEN ref FOR
		select 1 as msg;

    RETURN ref;
END;
$function$
