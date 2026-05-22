CREATE OR REPLACE FUNCTION public.et_realtime_sync_issuedetail_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jIssue jsonb;jMap jsonb; jNIssue jsonb;jUpdated jsonb;jNMap jsonb;nSesid uuid;
BEGIN
    jIssue := parameter ->> 'jIssue';
    jMap := parameter ->> 'jMap';
/*
select * from et_realtime_sync_issuedetail_update ('{"jIssue":"[{\"nIDid\":2,\"cNote\":\"Note text 1\",\"nSessionid\":57,\"nCaseid\":22,\"cPageno\":null,\"jCordinates\":null,\"nUserid\":3,\"dCreatedt\":\"2024-09-21T12:57:20.589Z\",\"dUpdatedt\":null,\"cONote\":\"Original Note text\",\"nLID\":1,\"jTCordinates\":null,\"cTPageno\":null,\"jCordinates1\":null,\"bTrf\":0,\"isSynced\":0,\"nRefIDid\":null},{\"nIDid\":4,\"cNote\":\"Note text 2\",\"nSessionid\":57,\"nCaseid\":22,\"cPageno\":\"1\",\"jCordinates\":\"[object Object]\",\"nUserid\":3,\"dCreatedt\":\"2024-09-21T13:00:30.289Z\",\"dUpdatedt\":null,\"cONote\":\"Original Note text\",\"nLID\":1,\"jTCordinates\":null,\"cTPageno\":null,\"jCordinates1\":null,\"bTrf\":0,\"isSynced\":0,\"nRefIDid\":null},{\"nIDid\":5,\"cNote\":\"Note text 3\",\"nSessionid\":57,\"nCaseid\":22,\"cPageno\":\"1\",\"jCordinates\":\"[object Object]\",\"nUserid\":3,\"dCreatedt\":\"2024-09-21T13:03:06.666Z\",\"dUpdatedt\":null,\"cONote\":\"Original Note text\",\"nLID\":1,\"jTCordinates\":null,\"cTPageno\":null,\"jCordinates1\":null,\"bTrf\":0,\"isSynced\":0,\"nRefIDid\":null},{\"nIDid\":6,\"cNote\":\"Note text 4\",\"nSessionid\":57,\"nCaseid\":22,\"cPageno\":\"1\",\"jCordinates\":\"[{\\\"x\\\":1001,\\\"y\\\":2002}]\",\"nUserid\":3,\"dCreatedt\":\"2024-09-21T13:05:25.270Z\",\"dUpdatedt\":\"2024-09-21T13:33:08.682Z\",\"cONote\":\"1Original Note text\",\"nLID\":1,\"jTCordinates\":null,\"cTPageno\":null,\"jCordinates1\":null,\"bTrf\":0,\"isSynced\":0,\"nRefIDid\":null},{\"nIDid\":7,\"cNote\":\"Note text 5\",\"nSessionid\":57,\"nCaseid\":22,\"cPageno\":null,\"jCordinates\":null,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T11:29:50.317Z\",\"dUpdatedt\":null,\"cONote\":\"Original Note text\",\"nLID\":1,\"jTCordinates\":null,\"cTPageno\":null,\"jCordinates1\":null,\"bTrf\":0,\"isSynced\":0,\"nRefIDid\":null}]","jMap":"[{\"nMapid\":2,\"nIDid\":2,\"nIid\":1,\"nRelid\":2,\"nImpactid\":3,\"isSynced\":0,\"nRefMapid\":null,\"nRefIDid\":null,\"nRefIid\":74},{\"nMapid\":4,\"nIDid\":4,\"nIid\":1,\"nRelid\":2,\"nImpactid\":3,\"isSynced\":0,\"nRefMapid\":null,\"nRefIDid\":null,\"nRefIid\":74},{\"nMapid\":5,\"nIDid\":5,\"nIid\":1,\"nRelid\":2,\"nImpactid\":3,\"isSynced\":0,\"nRefMapid\":null,\"nRefIDid\":null,\"nRefIid\":74},{\"nMapid\":11,\"nIDid\":7,\"nIid\":1,\"nRelid\":2,\"nImpactid\":3,\"isSynced\":0,\"nRefMapid\":null,\"nRefIDid\":null,\"nRefIid\":74}]"}','r1');fetch all in "r1";

select * From "RIssueDetail" order by 1 desc
select serialno From "RIssueMapid" order by 1 desc

delete from "RIssueDetail" where "nTempid" is not null;
delete from "RIssueMapid" where "nTempid" is not null;

select * from temp_cat
select * from temp_issue
*/

alter table "RIssueDetail" add column if not exists "nTempid" int;
alter table "RIssueMapid" add column if not exists "nTempid" int;

drop table if exists temp_issuedetail;
create temp table temp_issuedetail as 
select "nIDid","cNote","nSessionid","nCaseid","cPageno","jCordinates","nUserid","dCreatedt","dUpdatedt","cONote","nLID","jTCordinates","cTPageno","bTrf",coalesce("nRefIDid",'00000000-0000-0000-0000-000000000000'::uuid) as "nRefIDid","cUNote"
From jsonb_to_recordset(jIssue) as ("nIDid" text,"cNote" text,"nSessionid" uuid,"nCaseid" uuid,"cPageno" text,"jCordinates" jsonb,"nUserid" uuid,"dCreatedt" timestamp,"dUpdatedt" timestamp,"cONote" text,
"nLID" uuid,"jTCordinates" jsonb,"cTPageno" text,"bTrf" boolean,"nRefIDid" uuid,"cUNote" text);

nSesid = (select "nSessionid" from temp_issuedetail t where "nSessionid" is not null limit 1);

drop table if exists temp_mapids;
create temp table temp_mapids as 
select "nMapid","nIDid","nIid","nRelid","nImpactid",coalesce("nRefMapid",'00000000-0000-0000-0000-000000000000'::uuid) "nRefMapid","nRefIDid","nRefIid","serialno"
From jsonb_to_recordset(jMap) as ("nMapid" text,"nIDid" text,"nIid" uuid,"nRelid" int,"nImpactid" int,"nRefMapid" uuid,"nRefIDid" uuid,"nRefIid" uuid,"serialno" int);

	select jsonb_agg(t.*) into jUpdated from (
		select "nRefIDid" as "nIDid","nUserid" 
		from temp_issuedetail 
		where "nRefIDid" IS NOT NULL
	) t;
		

		with tbl as (
			select  "nIDid","cNote","nSessionid","nCaseid","cPageno","jCordinates","nUserid","dCreatedt","dUpdatedt","cONote","nLID","jTCordinates","cTPageno","bTrf","nRefIDid","cUNote"
			From temp_issuedetail 
		),insert_issue as (
			INSERT INTO "RIssueDetail"("cNote", "nSessionid", "nCaseid", "cPageno", "jCordinates", "nUserid", "dCreatedt", "dUpdatedt", "cONote", "nLID", "jTCordinates", "cTPageno","bTrf","nTempid","cUNote")
			select "cNote","nSessionid","nCaseid","cPageno","jCordinates","nUserid","dCreatedt","dUpdatedt","cONote","nLID","jTCordinates","cTPageno","bTrf","nIDid","cUNote" 
			from tbl t where "nRefIDid" = '00000000-0000-0000-0000-000000000000'::uuid
			returning *
		),update_issue as (
			update "RIssueDetail"  i set "cNote"= t."cNote","cPageno"= t."cPageno","jCordinates"= t."jCordinates","dUpdatedt"= t."dUpdatedt",
			"cONote"=t."cONote","nLID"=t."nLID","jTCordinates"=t."jTCordinates","cTPageno"=t."cTPageno","bTrf" = t."bTrf","cUNote" = t."cUNote"
			from tbl t where t."nRefIDid" = i."nIDid"
			returning * 
		),update_temp as (
			update  temp_issuedetail c set "nRefIDid" = t."nIDid" from insert_issue t where t."nTempid" = c."nIDid"
			returning *
		),newData as (
				select i."nIDid",i."nTempid" as "nOIDid","nUserid"  from insert_issue i
		) select jsonb_agg(t) into jNIssue 
		from newData t;

		with tbl as (
			select "nMapid","nIDid","nIid","nRelid","nImpactid","nRefMapid","nRefIDid","nRefIid" ,"serialno"
			from temp_mapids 
		),insert_issue as (
			insert into "RIssueMapid"("nIDid","nIid","nRelid","nImpactid","nTempid","serialno")
				select coalesce(c."nRefIDid",t."nRefIDid"),t."nRefIid",t."nRelid",t."nImpactid",t."nMapid",t."serialno"
				from tbl t 
				left join "temp_issuedetail" c on c."nIDid" = t."nIDid" 
				where t."nRefMapid" = '00000000-0000-0000-0000-000000000000'::uuid
				returning *
		),update_issue as (
				update "RIssueMapid" i set "nRelid" = t."nRelid","nImpactid" = t."nImpactid"
				from tbl t 
				where t."nRefMapid" = i."nMapid"
				returning *
		),update_temp as (
				update temp_mapids t set "nRefMapid" = i."nMapid" from insert_issue i where t."nMapid" = i."nTempid" 
				returning *
		),newData as (
				select i."nMapid",i."nTempid" as "nOMapid" 
				from insert_issue i 				
		) select jsonb_agg(t) into jNMap from newData t; 

	
OPEN ref FOR
	select 1 as msg,nSesid as "nSesid",coalesce(jNIssue,'[]'::jsonb) as "jNIssue",coalesce(jNMap,'[]'::jsonb) as "jNMap",coalesce(jUpdated,'[]'::jsonb) as "jUpdated";
	
				
		
    RETURN ref;
END;
$function$
