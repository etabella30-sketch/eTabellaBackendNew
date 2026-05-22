CREATE OR REPLACE FUNCTION public.et_upload_update_version(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nBundledetailid uuid;nTCatid int;
cFVer text;
cLVer text;

BEGIN
cFVer := parameter->>'cFVer';
cLVer := parameter->>'cLVer';
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
nTCatid := parameter->>'nTCatid';

	update "BDAttributes" 
	set "cFVer" = coalesce(cFVer,"cFVer"),
	"cLVer" = cLVer
	where "nBundledetailid" = nBundledetailid;

-- END IF;

open ref for 
	select 1 as msg,d."nBundledetailid",coalesce(d."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) as "nBundleid",d."nSectionid",s."nCaseid"
	From "BundleDetail" d
	join "SectionMaster" s on s."nSectionid" = d."nSectionid"
	where d."nBundledetailid" = nBundledetailid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
