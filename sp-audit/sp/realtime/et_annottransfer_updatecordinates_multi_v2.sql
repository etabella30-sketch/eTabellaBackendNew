CREATE OR REPLACE FUNCTION realtime.et_annottransfer_updatecordinates_multi_v2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
jList jsonb;
BEGIN
jList := (parameter->>'jList')::jsonb;

/*
select * From "RIssueDetail"

alter table "RIssueDetail" add column "isInActivated" boolean

select * From realtime."RIssueDetailLog" limit 10
select * from realtime.et_annottransfer_updatecordinates_multi_v2 ('{"jList":"[{\"nId\":\"9a597b86-fdcb-4b7e-9cb9-c23e7f3e2bcb\",\"cType\":\"F\",\"jCordinates\":[{\"l\":6,\"p\":1,\"t\":\"09:40:58:27\",\"oL\":6,\"oP\":1,\"text\":\"world.  This is exactly what we did in Chevron \",\"identity\":\"22324477987900\"},{\"l\":7,\"p\":1,\"t\":\"09:41:04:05\",\"oL\":7,\"oP\":1,\"text\":\"      when I worked for them.\",\"identity\":\"22324514457000\"},{\"l\":8,\"p\":1,\"t\":\"09:41:05:00\",\"oL\":8,\"oP\":1,\"text\":\"          Last but not least, we have to control our\",\"identity\":\"22324578492100\"},{\"l\":9,\"p\":1,\"t\":\"09:41:14:22\",\"oL\":9,\"oP\":1,\"text\":\"      professional ^^.  We''''re not going to get 80,\",\"identity\":\"22324631361700\"},{\"l\":10,\"p\":1,\"t\":\"09:41:23:00\",\"oL\":10,\"oP\":1,\"text\":\"      85 per cent recovery when the reservoir is\",\"identity\":\"22324791906800\"},{\"l\":11,\"p\":1,\"t\":\"09:41:25:11\",\"oL\":11,\"oP\":1,\"text\":\"      heterogeneous, when there is water influx, whether\",\"identity\":\"22324851560800\"},{\"l\":12,\"p\":1,\"t\":\"09:41:29:28\",\"oL\":12,\"oP\":1,\"text\":\"      edge water or bottom water.  It doesn''''t matter.\",\"identity\":\"22324894318400\"},{\"l\":13,\"p\":1,\"t\":\"09:41:33:16\",\"oL\":13,\"oP\":1,\"text\":\"          When water hits the gas, it''''s not like a piston\",\"identity\":\"22324962986400\"},{\"l\":14,\"p\":1,\"t\":\"09:41:40:00\",\"oL\":14,\"oP\":1,\"text\":\"      displacement.  It''''s a porous medium water meanders\",\"identity\":\"22325014136500\"},{\"l\":15,\"p\":1,\"t\":\"09:41:47:06\",\"oL\":15,\"oP\":1,\"text\":\"      through gas ^ and traps the gas and I''''m going to show\",\"identity\":\"22325066118500\"},{\"l\":16,\"p\":1,\"t\":\"09:41:51:15\",\"oL\":16,\"oP\":1,\"text\":\"      it to you, sir.  A huge amount of gas can be trapped\",\"identity\":\"22325112639400\"},{\"l\":17,\"p\":1,\"t\":\"09:41:55:15\",\"oL\":17,\"oP\":1,\"text\":\"      when the reservoir\",\"identity\":\"22325162956500\"}],\"cONote\":[\"world.  This is exactly what we did in Chevron \\n      when I worked for them.\\n          Last but not least, we have to control our\\n      professional ^^.  We''re not going to get 80,\\n      85 per cent recovery when the reservoir is\\n      heterogeneous, when there is water influx, whether\\n      edge water or bottom water.  It doesn''t matter.\\n          When water hits the gas, it''s not like a piston\\n      displacement.  It''s a porous medium water meanders\\n      through gas ^ and traps the gas and I''m going to show\\n      it to you, sir.  A huge amount of gas can be trapped\\n      when the reservoir\"],\"newCordinates\":[{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:40:58:27\",\"debug_t\":\"09:40:58:27\",\"l\":6,\"p\":1,\"text\":\"world. This is exactly what we did in Chevron\",\"oP\":1,\"oL\":6,\"identity\":22324477987900,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:04:05\",\"debug_t\":\"09:41:04:05\",\"l\":7,\"p\":1,\"text\":\"when I worked for them.\",\"oP\":1,\"oL\":7,\"identity\":22324514457000,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:05:00\",\"debug_t\":\"09:41:05:00\",\"l\":8,\"p\":1,\"text\":\"Last but not least, we have to control our\",\"oP\":15,\"oL\":7,\"identity\":22324578492100,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:14:22\",\"debug_t\":\"09:41:14:22\",\"l\":9,\"p\":1,\"text\":\"professional we''re not going to get 80, 85 per cent\",\"oP\":15,\"oL\":8,\"identity\":22324631361700,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:23:07\",\"debug_t\":\"09:41:23:07\",\"l\":10,\"p\":1,\"text\":\"recovery when the reservoir is heterogeneous, when\",\"oP\":15,\"oL\":9,\"identity\":22324631362005,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:27:11\",\"debug_t\":\"09:41:27:11\",\"l\":11,\"p\":1,\"text\":\"there is water influx, whether edge water or bottom\",\"oP\":15,\"oL\":10,\"identity\":22324631362424,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:31:10\",\"debug_t\":\"09:41:31:10\",\"l\":12,\"p\":1,\"text\":\"water.  It doesn''t matter.\",\"oP\":15,\"oL\":11,\"identity\":22324631362969,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:33:16\",\"debug_t\":\"09:41:33:16\",\"l\":13,\"p\":1,\"text\":\"When water hits the gas, it''s not like a piston\",\"oP\":1,\"oL\":13,\"identity\":22324962986400,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:40:00\",\"debug_t\":\"09:41:40:00\",\"l\":14,\"p\":1,\"text\":\"displacement.  It''s a porous medium water meanders\",\"oP\":1,\"oL\":14,\"identity\":22325014136500,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:47:06\",\"debug_t\":\"09:41:47:06\",\"l\":15,\"p\":1,\"text\":\"through gas ^ and traps the gas and I''m going to show\",\"oP\":1,\"oL\":15,\"identity\":22325066118500,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:51:15\",\"debug_t\":\"09:41:51:15\",\"l\":16,\"p\":1,\"text\":\"it to you, sir.  A huge amount of gas can be trapped\",\"oP\":1,\"oL\":16,\"identity\":22325112639400,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:55:15\",\"debug_t\":\"09:41:55:15\",\"l\":17,\"p\":1,\"text\":\"when the reservoir\",\"oP\":1,\"oL\":17,\"identity\":22325162956500,\"refreshCount\":3}],\"nRefresh\":3,\"firstPage\":1,\"firstLine\":6,\"isInActivated\":false},{\"nId\":\"330fa844-2fd2-4e5f-bf61-e485659e5201\",\"cType\":\"D\",\"jCordinates\":[{\"l\":10,\"p\":1,\"t\":\"09:41:23:00\",\"oL\":10,\"oP\":1,\"text\":\"per cent recovery when the reservoir is \",\"identity\":\"22324791906800\"},{\"l\":11,\"p\":1,\"t\":\"09:41:25:11\",\"oL\":11,\"oP\":1,\"text\":\"      heterogeneous, when there is water influx, whether\",\"identity\":\"22324851560800\"},{\"l\":12,\"p\":1,\"t\":\"09:41:29:28\",\"oL\":12,\"oP\":1,\"text\":\"      edge water or bottom water.  It doesn''''t matter.\",\"identity\":\"22324894318400\"},{\"l\":13,\"p\":1,\"t\":\"09:41:33:16\",\"oL\":13,\"oP\":1,\"text\":\"          When water hits the gas, it''''s not like a piston\",\"identity\":\"22324962986400\"},{\"l\":14,\"p\":1,\"t\":\"09:41:40:00\",\"oL\":14,\"oP\":1,\"text\":\"      displacement.  It''''s a porous medium water meanders\",\"identity\":\"22325014136500\"},{\"l\":15,\"p\":1,\"t\":\"09:41:47:06\",\"oL\":15,\"oP\":1,\"text\":\"      through gas ^ and traps the gas and I''''m going to show\",\"identity\":\"22325066118500\"},{\"l\":16,\"p\":1,\"t\":\"09:41:51:15\",\"oL\":16,\"oP\":1,\"text\":\"      it to you, sir.  A huge amount of gas can be trapped\",\"identity\":\"22325112639400\"},{\"l\":17,\"p\":1,\"t\":\"09:41:55:15\",\"oL\":17,\"oP\":1,\"text\":\"      when the reservoir influx.\",\"identity\":\"22325162956500\"},{\"l\":18,\"p\":1,\"t\":\"09:41:57:15\",\"oL\":18,\"oP\":1,\"text\":\"1  Q. So this is a summary of what should have happened and\",\"identity\":\"22325224659500\"},{\"l\":19,\"p\":1,\"t\":\"09:42:02:27\",\"oL\":19,\"oP\":1,\"text\":\"      what didn''''t happen?\",\"identity\":\"22325277260900\"},{\"l\":20,\"p\":1,\"t\":\"09:42:03:25\",\"oL\":20,\"oP\":1,\"text\":\"   A. Now, we''''re moving to the next slide, which is the fund\",\"identity\":\"22325347348900\"},{\"l\":21,\"p\":1,\"t\":\"09:42:14:15\",\"oL\":21,\"oP\":1,\"text\":\"      mental principles of reservoir management ^.\",\"identity\":\"22325400239000\"},{\"l\":22,\"p\":1,\"t\":\"09:42:17:04\",\"oL\":22,\"oP\":1,\"text\":\"   CHAIRMAN:  We''''ll be discussing the guiding objectionia,\",\"identity\":\"22325464688800\"},{\"l\":23,\"p\":1,\"t\":\"09:42:26:27\",\"oL\":23,\"oP\":1,\"text\":\"      doing we''''ll be discussing what happened in terms of\",\"identity\":\"22325519834700\"},{\"l\":24,\"p\":1,\"t\":\"09:42:31:04\",\"oL\":24,\"oP\":1,\"text\":\"      reservoir manage\",\"identity\":\"22325576867600\"}],\"cONote\":[\"per cent recovery when the reservoir is \\n      heterogeneous, when there is water influx, whether\\n      edge water or bottom water.  It doesn''t matter.\\n          When water hits the gas, it''s not like a piston\\n      displacement.  It''s a porous medium water meanders\\n      through gas ^ and traps the gas and I''m going to show\\n      it to you, sir.  A huge amount of gas can be trapped\\n      when the reservoir influx.\\n1  Q. So this is a summary of what should have happened and\\n      what didn''t happen?\\n   A. Now, we''re moving to the next slide, which is the fund\\n      mental principles of reservoir management ^.\\n   CHAIRMAN:  We''ll be discussing the guiding objectionia,\\n      doing we''ll be discussing what happened in terms of\\n      reservoir manage\"],\"newCordinates\":[{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:14:22\",\"debug_t\":\"09:41:14:22\",\"l\":9,\"p\":1,\"text\":\"per cent\",\"oP\":15,\"oL\":8,\"identity\":22324631361700,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:23:07\",\"debug_t\":\"09:41:23:07\",\"l\":10,\"p\":1,\"text\":\"recovery when the reservoir is heterogeneous, when\",\"oP\":15,\"oL\":9,\"identity\":22324631362005,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:27:11\",\"debug_t\":\"09:41:27:11\",\"l\":11,\"p\":1,\"text\":\"there is water influx, whether edge water or bottom\",\"oP\":15,\"oL\":10,\"identity\":22324631362424,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:31:10\",\"debug_t\":\"09:41:31:10\",\"l\":12,\"p\":1,\"text\":\"water.  It doesn''t matter.\",\"oP\":15,\"oL\":11,\"identity\":22324631362969,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:33:16\",\"debug_t\":\"09:41:33:16\",\"l\":13,\"p\":1,\"text\":\"When water hits the gas, it''s not like a piston\",\"oP\":1,\"oL\":13,\"identity\":22324962986400,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:40:00\",\"debug_t\":\"09:41:40:00\",\"l\":14,\"p\":1,\"text\":\"displacement.  It''s a porous medium water meanders\",\"oP\":1,\"oL\":14,\"identity\":22325014136500,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:47:06\",\"debug_t\":\"09:41:47:06\",\"l\":15,\"p\":1,\"text\":\"through gas ^ and traps the gas and I''m going to show\",\"oP\":1,\"oL\":15,\"identity\":22325066118500,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:51:15\",\"debug_t\":\"09:41:51:15\",\"l\":16,\"p\":1,\"text\":\"it to you, sir.  A huge amount of gas can be trapped\",\"oP\":1,\"oL\":16,\"identity\":22325112639400,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:55:15\",\"debug_t\":\"09:41:55:15\",\"l\":17,\"p\":1,\"text\":\"when the reservoir influx.\",\"oP\":1,\"oL\":17,\"identity\":22325162956500,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:41:57:15\",\"debug_t\":\"09:41:57:15\",\"l\":18,\"p\":1,\"text\":\"1  Q. So this is a summary of what should have happened and\",\"oP\":1,\"oL\":18,\"identity\":22325224659500,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:42:02:27\",\"debug_t\":\"09:42:02:27\",\"l\":19,\"p\":1,\"text\":\"what didn''t happen?\",\"oP\":1,\"oL\":19,\"identity\":22325277260900,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:42:03:25\",\"debug_t\":\"09:42:03:25\",\"l\":20,\"p\":1,\"text\":\"A. Now, we''re moving to the next slide, which is the fund\",\"oP\":1,\"oL\":20,\"identity\":22325347348900,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:42:14:15\",\"debug_t\":\"09:42:14:15\",\"l\":21,\"p\":1,\"text\":\"mental principles of reservoir management ^.\",\"oP\":1,\"oL\":21,\"identity\":22325400239000,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:42:17:04\",\"debug_t\":\"09:42:17:04\",\"l\":22,\"p\":1,\"text\":\"CHAIRMAN:  We''ll be discussing the guiding objectionia,\",\"oP\":1,\"oL\":22,\"identity\":22325464688800,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:42:26:27\",\"debug_t\":\"09:42:26:27\",\"l\":23,\"p\":1,\"text\":\"doing we''ll be discussing what happened in terms of\",\"oP\":1,\"oL\":23,\"identity\":22325519834700,\"refreshCount\":3},{\"x\":0,\"y\":0,\"height\":20,\"weight\":0,\"t\":\"09:42:31:04\",\"debug_t\":\"09:42:31:04\",\"l\":24,\"p\":1,\"text\":\"reservoir management\",\"oP\":1,\"oL\":24,\"identity\":22325576867600,\"refreshCount\":3}],\"nRefresh\":3,\"firstPage\":1,\"firstLine\":9,\"isInActivated\":false}]"}','r1');fetch all in "r1";

 select * From "RIssueDetail"  where "nIDid" = '5c0110e2-9ba9-4d7d-9e36-21f765f1f633'
update "RIssueDetail" r set "jOCordinates" = null where "nIDid" = '5c0110e2-9ba9-4d7d-9e36-21f765f1f633'
select * from temp_data

select * From realtime."RIssueDetailLog" limit 1

alter table realtime."RIssueDetailLog" add column "cType" character varying(2)

select * from "FactMaster"
select * from "FactDetail"

select * from "DocMaster"
select * from "DocDetail"

*/	

drop table if exists temp_data;
	create temp table temp_data as
	select *
	From jsonb_to_recordset(jList) as 
	("nId" uuid,"cType" text,"jCordinates" jsonb,"cONote" text,"newCordinates" jsonb,"nRefresh" int,"firstPage" text,"firstLine" text,"isInActivated" boolean);

-- Update Original Cordinates */
update "FactDetail" r set "jOCordinates" = t."jCordinates" 
	from temp_data t 
	where t."nId" = r."nFSid" and t."cType" in ('QF','F') and r."jOCordinates" is null and t."jCordinates" is not null;
update "DocDetail" r set "jOCordinates" = t."jCordinates" 
	from temp_data t 
	where t."nId" = r."nDocid" and r."jOCordinates" is null and t."jCordinates" is not null;

	

-- Insert Detail log
	insert into realtime."RIssueDetailLog" ("nIDid","cONote","jCordinates","nRefresh","dCreatedt","cType")
	select "nId","cONote","newCordinates","nRefresh",now(),"cType" 
	from temp_data t ;

-- Update New Data 
 update "FactDetail" r set "jCordinates" = t."newCordinates","nPage" = t."firstPage"::int,"nLine" = t."firstLine"::int
from temp_data t 
where t."nId" = r."nFSid";

 update "DocDetail" r set "jCordinates" = t."newCordinates","nPage" = t."firstPage"::int,"nLine" = t."firstLine"::int
from temp_data t 
where t."nId" = r."nDocid";

/*
update "RIssueDetail" r set "jOCordinates" = t."jCordinates" 
	from temp_data t 
	where t."nIDid" = r."nIDid" and r."jOCordinates" is null and t."jCordinates" is not null and coalesce(t."isInActivated",false) = false ;

update "RIssueDetail" r set "isInActivated" = true
	from temp_data t 
	where t."nIDid" = r."nIDid" and coalesce(t."isInActivated",false) = true;
	
	
	insert into realtime."RIssueDetailLog"("nIDid","cONote","jCordinates","nRefresh","dCreatedt")
	select "nIDid","cONote","newCordinates","nRefresh",now() 
	from temp_data t 
	where coalesce(t."isInActivated",false) = false ;
	
 update "RIssueDetail" r set "jCordinates" = t."newCordinates","cPageno" = t."firstPage" ,"isInActivated" = false
from temp_data t 
where t."nIDid" = r."nIDid"
and coalesce(t."isInActivated",false) = false;*/

/*
	update "RIssueDetail" set "jOCordinates" = jCordinates WHERE "nIDid" = nIDid and "jOCordinates" is null;

	insert into realtime."RIssueDetailLog"("nIDid","cONote","jCordinates","nRefresh","jDCordinates")
	values(nIDid,cONote,newCordinates,nRefresh,jDCordinates);

	update "RIssueDetail" set "jCordinates" = newCordinates,"cPageno" = firstPage where "nIDid" = nIDid;
*/
	open ref for select 1 as msg,'Annotations updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
