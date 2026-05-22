CREATE OR REPLACE FUNCTION public.et_filter_destinations_docs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nBundledetailid uuid;nMasterid uuid;

-- select * from ""FMShared"" limit 0
BEGIN
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

-- select * from et_filter_destinations_docs('{""nBundledetailid"":555364,""nMasterid"":2}','r');fetch all in ""r""

-- select * from ""DMLinks""
-- select * from ""bundlesource"" limit 1

	open ref for 

select d."nDocid",l."nDMLids",l."jLinktype",b."cTab",b."cBundletag",b."cFilename"
		From "DocMaster" d
		join "DMLinks" l on l."nDocid" = d."nDocid"
		join "bundlesource" b on b."nBundledetailid" = l."nBundledetailid"
		where d."nBundledetailid" = nBundledetailid and d."nUserid" = nMasterid 
		group by d."nDocid",l."nDMLids",l."jLinktype",b."cTab",b."cBundletag",b."cFilename"
	
		
	;

    RETURN ref;
END;
$function$
