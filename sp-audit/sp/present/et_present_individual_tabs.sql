CREATE OR REPLACE FUNCTION present.et_present_individual_tabs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nPresentid uuid;

BEGIN
-- select * from present.et_present_individual_tabs('{""nPresentid"":1, ""nMasterid"": 29}','r');fetch all in ""r""

	
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
	-- select * from ""BundleDetail""
open ref for
select DISTINCT ON(b."cTab",pd."nBundledetailid")
b."nBundledetailid",b."cFilename",b."cPath" as "originalPath",false as "isLoaded",pd."cType"
from present."PMDocuments"  pd
join "BundleDetail" b on b."nBundledetailid" = pd."nBundledetailid"
left join "BDPermission" p on p."nUserid" = nMasterid and p."nBundledetailid" = b."nBundledetailid"
where p."nBDPid" is null and pd."nPresentid" = nPresentid and pd."isActive" = true and b."cIsindex" != true
-- order by b."cFilename" ;
order by b."cTab",pd."nBundledetailid";

 -- Return the cursor to the caller
 RETURN ref;    
END;
$function$
