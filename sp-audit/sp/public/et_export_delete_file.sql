CREATE OR REPLACE FUNCTION public.et_export_delete_file(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid;nEDid uuid;cType text;vCaseid uuid;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
cType := parameter ->>'cType';
-- select * from et_export_delete_file ('{"nCaseid":37,"nUserid":4}','refcursor'); FETCH All in "refcursor";

-- SEC4 (2026-07-02): the SP read nMasterid but never used it — any user could
-- delete any export by guessing nExportid/nEDid. Resolve the export's case and
-- deny non-members before deleting.
if nExportid is null and nEDid is not null then
	select "nExportid" into nExportid from "ExportDetail" where "nEDid" = nEDid;
end if;
select "nCaseid" into vCaseid from "ExportMaster" where "nExportid" = nExportid;
if vCaseid is null or not public.et_is_case_member(vCaseid, nUserid) then
	open ref for select 0 as msg,'Not authorized for this export' as value;
	return ref;
end if;

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
