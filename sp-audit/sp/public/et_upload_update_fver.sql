CREATE OR REPLACE FUNCTION public.et_upload_update_fver(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nBundledetailid uuid;
cFVer text;
cLVer text;
BEGIN
cFVer := parameter->>'cFVer';
cLVer := parameter->>'cLVer';
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

update "BDAttributes" set "cFVer" = cFVer,"cLVer" = case when cLVer IS NOT NULL then cLVer else "cLVer" end where "nBundledetailid" = nBundledetailid;

open ref for select 1 msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
