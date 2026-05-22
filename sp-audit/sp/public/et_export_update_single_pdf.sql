CREATE OR REPLACE FUNCTION public.et_export_update_single_pdf(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid;cPath text;

BEGIN

nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
cPath := parameter ->>'cPath';
/*
select * from "ExportMaster"

 select * from et_export_files ('{""nCaseid"":37,""jFiles"":""[{\""nBundledetailid\"":6112}]"",""nUserid"":2}','refcursor'); FETCH All in ""refcursor"";

*/

update "ExportMaster" set 
"cExppath" = cPath,"cStatus" = 'C'
where "nExportid" = nExportid;

open ref for select 1 as msg,"cType","cStatus","nUserid","nCaseid" from "ExportMaster" where "nExportid" = nExportid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
