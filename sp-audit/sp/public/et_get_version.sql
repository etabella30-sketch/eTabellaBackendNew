CREATE OR REPLACE FUNCTION public.et_get_version(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nBDid uuid;
BEGIN

	nBDid := NULLIF(parameter ->>'nBDid','')::uuid;
	
/*
SELECT * FROM public.et_get_version('{""nBDid"":169648}', 'r1'); FETCH ALL IN ""r1"";
 */

    OPEN ref FOR 
		select "cLVer" from "BDAttributes" where "nBundledetailid" = nBDid;
	
    RETURN ref; -- Return the cursor
END;
$function$
