CREATE OR REPLACE FUNCTION public.et_linkexplorer_incomming_doclinks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nCaseid uuid;nUserid uuid;nBundledetailid uuid;

BEGIN
	
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

/*
  select * from et_displayissue ('{""nSectionid"":857,""nCaseid"":289,""nMasterid"":59}','r1');fetch all in ""r1"";

select * From ""BundleDetail"" limit 10
select * From ""FactMaster""
select * From ""FactDetail""

 */

open ref for 

	select d."nBundledetailid",dd."jLinktype",b."cFilename",b."cTab",
    b."cExhibitno",
    b."cBundletag"
	from "DMLinks" l
	join "DocMaster" d on d."nDocid" = l."nDocid"
	Join "DocDetail" dd on dd."nDocid" = d."nDocid"
	join "bundlesource" b on b."nBundledetailid" = d."nBundledetailid"
	where d."nUserid" = nUserid and l."nBundledetailid" = nBundledetailid
	group by d."nBundledetailid",dd."jLinktype",b."cFilename",b."cTab",
    b."cExhibitno",
    b."cBundletag"

;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
