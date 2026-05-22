CREATE OR REPLACE FUNCTION public.et_export_update_progress(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid;nEDid uuid;
cStatus text;cType text;jObj jsonb;nProgress int;
total_prog int;comp_progres int;
countId int;cPath text;
BEGIN

nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
cStatus := parameter ->>'cStatus';
cPath := parameter ->>'cPath';

-- 
/*
 
 select * from public.et_export_update_progress ('{"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","nExportid":"9f3439a6-ec7d-42df-9099-887839e5abec","nEDid":"cb672a48-31e8-41e8-9fec-d185398cd277","cPath":"doc/case1043/dc_01730202635498.PDF","cStatus":"S","isComplete":""}','r1');fetch all in "r1";

 
P (Pending)
S (Started)
L (Loaded)
I (Indexing)
M (Merged)
R (Rendered)
U (Internal Link)
C (Completed)

truncate table "ExportMaster" restart identity;
truncate table "ExportDetail" restart identity;
*/
/*
update "ExportDetail" set "nTotal_page" = nTotal_page,"nCompleted_page" = nCompleted_page where "nEDid" = nEDid;

select * From "Codemaster"
select * From "ExportMaster"
select * From "ExportDetail"
*/

-- select * from public.et_export_update_progress ('{"nMasterid":"878bc958-8546-4bbf-8799-09a43f78b2dd","nExportid":"5ba3b682-40b4-4da7-861a-754f1ec7b6e2","nEDid":"1c15c06c-aeb1-4676-9355-c211e46daf9a","cPath":"doc/case1131/file_1207672399194.PDF","cStatus":"M","isComplete":""}','r1');fetch all in "r1";

select "nSerialno"  into nProgress
from "Codemaster" 
where "nCategoryid" = 15 and "jOther" @> ('{"status":"'|| cStatus ||'"}')::jsonb;

update "ExportDetail" set "nProgress" = nProgress,"cStatus" = (case when cStatus = 'C' then 'C'  
 when cStatus in ('P','S','L','I','M','R','U') then 'I' else "cStatus" end ),
 "dStartDt" = (case when cStatus in ('P','S','L','I','M','R','U') then now() else "dStartDt" end),
 "dCompDt" = (case when cStatus = 'C' then now() else "dCompDt" end),
 "cPath"= (case when cStatus = 'C' then cPath else "cPath" end)
 where "nEDid" = nEDid;

total_prog := 100;
comp_progres := nProgress;

update "ExportMaster" m set "nProgress" = d."totalpregress" from (
select ed."nExportid",sum(ed."nProgress") as "totalpregress" from "ExportDetail" ed  where ed."nExportid" = nExportid
group by "nExportid"
)d 
where m."nExportid" = nExportid and m."nExportid" = d."nExportid";

if exists(select * from "ExportMaster" where "nExportid" = nExportid -- and "cType" = 'S'
)then
countId = (select count("nEDid") from "ExportDetail" where "nExportid" = nExportid);
total_prog := 100 * (select count("nEDid") from "ExportDetail" where "nExportid" = nExportid);
comp_progres := (select "nProgress" from "ExportMaster" where "nExportid" = nExportid);
-- select * from et_export_update_progress ('{""nMasterid"":59,""nExportid"":17,""nEDid"":32,""cPath"":""doc/case289/demo1.pdf"",""cStatus"":""C"",""isComplete"":""""}','r1');fetch all in ""r1"";
end if;
/*
if not exists(select * from "ExportDetail" where "nExportid" = nExportid and "cStatus" != 'C')then
	-- update "ExportMaster" set "cStatus" = 'C' where "nExportid" = nExportid;
end if;
*/
raise notice ' countId %',countId;
open ref for 
select 1 as msg,total_prog/countId total_prog,comp_progres/countId comp_progres,"cType","nExportid","cStatus","nCaseid" from "ExportMaster" where "nExportid" = nExportid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
