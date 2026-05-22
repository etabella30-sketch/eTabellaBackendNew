CREATE OR REPLACE FUNCTION public.et_upload_getbundledetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nBundleid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;

/*

select * from et_upload_getsectiondetail ('{""nJobid"":1,""nMasterid"":1,""cPath"":""test2.pdf"",""nSectionid"":1,""nBundleid"":0}','refcursor'); FETCH All in ""refcursor"";

*/

open ref for 
    select "nBundleid","cBundlename" from "BundleMaster" where "nBundleid" = nBundleid;
        

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
