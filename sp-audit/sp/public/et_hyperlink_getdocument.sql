CREATE OR REPLACE FUNCTION public.et_hyperlink_getdocument(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
	nDocid uuid;
BEGIN

	nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
	nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
	nDocid := NULLIF(parameter ->>'nDocid','')::uuid;

-- select * from et_hyperlink_getdocument ('{""nBundledetailid"":0,""nDocid"":20,""nMasterid"":2}','r1');fetch all in ""r1"";
	-- select  * from bundlesource
if(nDocid IS NOT NULL)then
	
	open ref for 

		select b."nBundledetailid",b."cFilename",b."cTab",b."cExhibitno",b."cBundletag" 
		from "DMLinks" l
		join bundlesource b on l."nBundledetailid" = b."nBundledetailid"
		where l."nDocid" = nDocid;
		
	
else
		
	open ref for 

		select b."nBundledetailid",b."cFilename",b."cTab",b."cExhibitno",b."cBundletag" 
		from bundlesource b 
		where "nBundledetailid" = nBundledetailid;
		

end if;

	
    RETURN ref; -- Return the cursor to the caller
END;
$function$
