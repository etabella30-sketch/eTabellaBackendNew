CREATE OR REPLACE FUNCTION public.et_linkexplorer_outgoing_factlinks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nCaseid uuid;nUserid uuid;nBundledetailid uuid;

BEGIN
	
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

/*
  select * from et_displayissue ('{"nSectionid":857,"nCaseid":289,"nMasterid":59}','r1');fetch all in "r1";

select * From "BundleDetail" limit 10

 */

open ref for 
	select fl."nBundledetailid",fl."jLinktype",b."cFilename",b."cTab",
    b."cExhibitno",
    b."cBundletag"
	from "FactMaster" f
	join "FMLinks" fl on fl."nFSid" = f."nFSid"
	join "bundlesource" b on b."nBundledetailid" = fl."nBundledetailid"
	where f."nUserid" = nUserid and f."nBundledetailid" = nBundledetailid
	group by fl."nBundledetailid",fl."jLinktype",b."cFilename",b."cTab",
    b."cExhibitno",
    b."cBundletag"
	;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
