CREATE OR REPLACE FUNCTION public.et_upload_filestatus(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nBundledetailid uuid;cStatus text;
BEGIN
-- select * from et_realtime_transcriptfiles('{""nCaseid"":17}','r');fetch all in ""r""
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cStatus := parameter ->>'cStatus';

update "BundleDetail" set "cStatus" = cStatus where "nBundledetailid" = nBundledetailid;

open ref for 
select 1 msg,'Updated' value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
