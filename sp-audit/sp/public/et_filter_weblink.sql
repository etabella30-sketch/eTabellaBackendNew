CREATE OR REPLACE FUNCTION public.et_filter_weblink(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nBundledetailid uuid;nMasterid uuid;

-- select * from "FMShared" limit 0
BEGIN
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

-- select * from et_filter_weblink('{"nBundledetailid":555364,"nMasterid":2}','r');fetch all in "r"

	open ref for 

	select w."nWebid",d."cUrl",d."cTitle",d."cNote" 
		From "WebMaster" w 
		join "WebDetail" d on d."nWebid" = w."nWebid"
		where w."nUserid" = nMasterid and w."nBundledetailid" = nBundledetailid
		
	;

    RETURN ref;
END;
$function$
