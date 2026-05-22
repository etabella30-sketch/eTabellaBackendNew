CREATE OR REPLACE FUNCTION public.et_upload_getjobdetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nJobid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nJobid := NULLIF(parameter ->>'nJobid','')::uuid;

open ref for 
    select u."nJobid",u."cPath",u."nCaseid",u."nUserid",u."cStatus",u."nBundleid",u."nSectionid",u."identifier",u."converttype",u."bIsconvert",
    u."bIsocr",u."nOcrtype",coalesce(d."cName",'') as "cName"
    from "JobMaster" u 
    left join "UploadDetail" d on d."nUDid" = u."nUDid"
    where u."nJobid" = nJobid;
    
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
