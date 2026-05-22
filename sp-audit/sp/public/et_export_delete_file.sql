CREATE OR REPLACE FUNCTION public.et_export_delete_file(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid;nEDid uuid;cType text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
cType := parameter ->>'cType';
-- select * from et_export_delete_file ('{"nCaseid":37,"nUserid":4}','refcursor'); FETCH All in "refcursor";

if(cType='S')then 

delete from "ExportMaster" where "nExportid" = nExportid;

delete from  "ExportDetail"  where "nExportid" = nExportid;

else

delete from  "ExportDetail" where "nEDid" = nEDid;
end if;

open ref for 
select 1 as msg,'Deleted' value
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
