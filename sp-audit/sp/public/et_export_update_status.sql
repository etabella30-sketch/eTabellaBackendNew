CREATE OR REPLACE FUNCTION public.et_export_update_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid; nExportid uuid; nEDid uuid; cStatus text; jResponce jsonb;

BEGIN

nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
cStatus := parameter ->>'cStatus';
jResponce := parameter ->>'jResponce';
--  select * from et_export_update_status ('{""nExportid"":1,""nEDid"":1,""cStatus"":""C""}','refcursor'); FETCH All in ""refcursor"";
/*

select * From ""ExportMaster""

select * From ""ExportDetail""

*/

update "ExportDetail" set "cStatus" = cStatus,
"dStartDt" = (case when cStatus = 'I' then now() else "dStartDt" end),
"dCompDt" = (case when cStatus != 'I' then now() else "dCompDt" end),
"jResponce" = "jResponce" || coalesce(jResponce,'[]'::jsonb)
where "nEDid" = nEDid;

if exists(select * from "ExportDetail" where "nExportid" = nExportid and "dCompDt" is not null)then
update "ExportMaster" set "cStatus" = 'C' where "nExportid" = nExportid;
end if;

open ref for 
select 1 as msg;
-- select * from highlights

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
