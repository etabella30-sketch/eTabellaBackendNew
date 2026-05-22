CREATE OR REPLACE FUNCTION public.et_upload_report_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nUPid uuid;cStatus text;dDate timestamp;cFiletype text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nUPid := NULLIF(parameter ->>'nUPid','')::uuid;
cStatus := parameter ->>'cStatus';
dDate := parameter ->>'dDate';
cFiletype := parameter ->>'cFiletype';

open ref for
select d."nUDid",d."cName" as "cFilename",d."cType" as "filetype",d."cSize" as "filesize",d."nBundledetailid",d."cStatus",case when "cType" = 'ZIP' then "nFiles" else 1 end "nFiles",count("nOLid") "nOCRFiles",sum(case when os."cStatus" = 'OCR' then 1 else 0 end) "nOProgress",sum(case when os."cStatus" = 'C' then 1 else 0 end) "nCompleted",sum(case when os."cStatus" = 'F' then 1 else 0 end) "nFailed"
from "UploadDetail" d 
left join "OCRLog" os on os."nUDid" = d."nUDid"
where d."nUPid" = nUPid and
case when cStatus is not null then d."cStatus" = cStatus else true end and
case when cFiletype is not null then d."cType" = cFiletype else true end 
group by d."nUDid",d."cName",d."cType",d."cSize",d."nBundledetailid",d."cStatus",d."nFiles"
order by d."nUDid" desc;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
