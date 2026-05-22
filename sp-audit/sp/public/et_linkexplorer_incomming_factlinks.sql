CREATE OR REPLACE FUNCTION public.et_linkexplorer_incomming_factlinks(parameter json, ref refcursor)
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
select * From "FactMaster"
select * From "FactDetail"

 */

open ref for 

	select f."nBundledetailid",fd."jLinktype",b."cFilename",b."cTab",
    b."cExhibitno",
    b."cBundletag"
	from "FMLinks" fl
	join "FactMaster" f on f."nFSid" = fl."nFSid"
	join "FactDetail" fd on fd."nFSid" = f."nFSid"
	join "bundlesource" b on b."nBundledetailid" = f."nBundledetailid"
	where f."nUserid" = nUserid and fl."nBundledetailid" = nBundledetailid
	group by f."nBundledetailid",fd."jLinktype",b."cFilename",b."cTab",
    b."cExhibitno",
    b."cBundletag"
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
