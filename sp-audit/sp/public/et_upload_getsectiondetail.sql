CREATE OR REPLACE FUNCTION public.et_upload_getsectiondetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nSectionid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

/*

select * from et_upload_getsectiondetail ('{""nJobid"":1,""nMasterid"":1,""cPath"":""test2.pdf"",""nSectionid"":1,""nBundleid"":0}','refcursor'); FETCH All in ""refcursor"";

*/

open ref for 
    select "nSectionid","cFolder" from "SectionMaster" where "nSectionid" = nSectionid;
        

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
