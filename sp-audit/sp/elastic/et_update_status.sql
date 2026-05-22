CREATE OR REPLACE FUNCTION elastic.et_update_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nBundledetailid uuid;
	nStatus int;
BEGIN

	nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
	nStatus := parameter->>'nStatus';

	
/*

select * from "BDAttributes"

 */

	update "BDAttributes" 
		set "nEStatus" = nStatus 
		where "nBundledetailid" = nBundledetailid;

	open ref for
		select 1 as msg;

    RETURN ref; 
END;
$function$
