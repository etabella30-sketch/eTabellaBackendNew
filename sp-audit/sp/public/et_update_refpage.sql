CREATE OR REPLACE FUNCTION public.et_update_refpage(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nBDid uuid;
	nStart int;
BEGIN

	nBDid := NULLIF(parameter ->>'nBDid','')::uuid;
	nStart := parameter ->>'nStart';

/*
SELECT * FROM public.et_update_refpage('{"nBDid":169648}', 'r1'); FETCH ALL IN "r1";
 */

	UPDATE "BundleDetail"
	SET "cRefpage" = CASE 
		WHEN nStart IS NOT NULL THEN 
			nStart || '-' || (COALESCE(NULLIF(SPLIT_PART(COALESCE("cPage", '1-1'), '-', 2), ''), '1')::int + (nStart - 1))
		ELSE 
			NULL 
		END	
	WHERE "nBundledetailid" = nBDid;

	update "BDAttributes" set "nEStatus" = null where "nBundledetailid" = nBDid;
	
    OPEN ref FOR 
		select 1 as msg, 'updated' as value;
	
    RETURN ref; -- Return the cursor
END;
$function$
