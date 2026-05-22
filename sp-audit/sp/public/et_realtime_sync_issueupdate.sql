CREATE OR REPLACE FUNCTION public.et_realtime_sync_issueupdate(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jCat jsonb;jIssue jsonb; jTemp jsonb;jNCat jsonb;jNIssue jsonb;
BEGIN
    jCat := parameter ->> 'jCat';
    jIssue := parameter ->> 'jIssue';
/*

select * from et_realtime_sync_issueupdate ('{"jCat":"[{\"nICid\":1,\"nRefICid\":null,\"nCaseid\":1,\"cCategory\":\"Category Name\",\"nUserid\":1,\"dCreateDt\":\"2024-09-21T11:43:38.129Z\",\"dUpdateDt\":null,\"cICtype\":null,\"nOICid\":null,\"isSynced\":0,\"tempid\":\"cf3b3e54-8ab1-4dc4-b5bc-d6db292ed796\"},{\"nICid\":2,\"nRefICid\":null,\"nCaseid\":2,\"cCategory\":\"Category Name2\",\"nUserid\":1,\"dCreateDt\":\"2024-09-21T11:43:51.848Z\",\"dUpdateDt\":\"2024-09-23T11:27:03.737Z\",\"cICtype\":null,\"nOICid\":null,\"isSynced\":0,\"tempid\":\"cb26f432-e591-472d-a772-4a62afcacf52\"},{\"nICid\":3,\"nRefICid\":null,\"nCaseid\":2,\"cCategory\":\"Categoryhg Nameg fg\",\"nUserid\":1,\"dCreateDt\":\"2024-09-21T11:44:07.165Z\",\"dUpdateDt\":null,\"cICtype\":null,\"nOICid\":null,\"isSynced\":0,\"tempid\":\"e671c9b4-a027-436c-b389-a6ac5233b17a\"},{\"nICid\":4,\"nRefICid\":null,\"nCaseid\":2,\"cCategory\":\"4Category Name\",\"nUserid\":1,\"dCreateDt\":\"2024-09-21T11:44:19.179Z\",\"dUpdateDt\":\"2024-09-21T11:44:45.367Z\",\"cICtype\":null,\"nOICid\":null,\"isSynced\":0,\"tempid\":\"d740c011-0fc6-4e15-8115-cb5ef3c2fd0c\"},{\"nICid\":5,\"nRefICid\":null,\"nCaseid\":1,\"cCategory\":\"Categoryhghgg Nameg fg\",\"nUserid\":1,\"dCreateDt\":\"2024-09-21T11:45:04.548Z\",\"dUpdateDt\":null,\"cICtype\":null,\"nOICid\":null,\"isSynced\":0,\"tempid\":\"3d73bce6-0c8e-46e9-a850-b63ad8cef1fc\"}]","jIssue":"[{\"nIid\":1,\"cIName\":\"Issue Name\",\"cColor\":\"000000\",\"nICid\":1,\"dCreatedt\":\"2024-09-21T12:12:43.219Z\",\"nUserid\":1,\"dUpdatedt\":null,\"nCaseid\":1,\"isSynced\":0,\"nRefIid\":null},{\"nIid\":2,\"cIName\":\"1Issue Name\",\"cColor\":\"000000\",\"nICid\":1,\"dCreatedt\":\"2024-09-21T12:13:01.434Z\",\"nUserid\":1,\"dUpdatedt\":null,\"nCaseid\":1,\"isSynced\":0,\"nRefIid\":null},{\"nIid\":3,\"cIName\":\"2Issue Name\",\"cColor\":\"000000\",\"nICid\":1,\"dCreatedt\":\"2024-09-21T12:13:04.499Z\",\"nUserid\":1,\"dUpdatedt\":null,\"nCaseid\":1,\"isSynced\":0,\"nRefIid\":null},{\"nIid\":4,\"cIName\":\"2Issue Name2\",\"cColor\":\"000000\",\"nICid\":1,\"dCreatedt\":\"2024-09-21T12:13:06.171Z\",\"nUserid\":1,\"dUpdatedt\":null,\"nCaseid\":1,\"isSynced\":0,\"nRefIid\":null},{\"nIid\":6,\"cIName\":\"33Issue Name23\",\"cColor\":\"000000\",\"nICid\":2,\"dCreatedt\":\"2024-09-21T12:13:32.475Z\",\"nUserid\":1,\"dUpdatedt\":null,\"nCaseid\":1,\"isSynced\":0,\"nRefIid\":null}]"}','r1');fetch all in "r1";

select * from et_realtime_sync_issueupdate ('{"jCat":"[{\"nICid\":5,\"nRefICid\":0,\"nCaseid\":1043,\"cCategory\":\"CAT MARK 2\",\"nUserid\":2,\"dCreateDt\":\"2024-09-26T12:41:21.832Z\",\"dUpdateDt\":null,\"cICtype\":null,\"nOICid\":null,\"isSynced\":0}]","jIssue":"[]"}','r1');fetch all in "r1";

select * from et_realtime_sync_issueupdate ('{"jCat":"[{\"nICid\":8,\"nRefICid\":null,\"nCaseid\":1043,\"cCategory\":\"sded\",\"nUserid\":3,\"dCreateDt\":\"2024-09-26T12:58:55.200Z\",\"dUpdateDt\":null,\"cICtype\":null,\"nOICid\":null,\"isSynced\":0}]","jIssue":"[{\"nIid\":12,\"cIName\":\"ek or issue\",\"cColor\":\"515cff\",\"nICid\":8,\"dCreatedt\":\"2024-09-26T12:58:56.411Z\",\"nUserid\":3,\"dUpdatedt\":null,\"nCaseid\":1043,\"isSynced\":0,\"nRefIid\":null,\"nRefICid\":null}]"}','r1');fetch all in "r1";

select * From "IssueCategory" order by 1 desc 4741
delete from "" where "nICid" = 

select * From "RIssueMaster"  order by 1 desc 488

4735
select r.*,i.* From "RIssueMaster" r  
join "IssueCategory" i on i."nICid" = r."nICid" 
where  r."nTempid" is not null order by r."nIid"

select * 
from "RIssueMaster" i	
join "IssueCategory" c on c.""

where i."nTempid" is not null 

delete from "IssueCategory" where "nTempid" is not null;
delete from "RIssueMaster" where "nTempid" is not null;

select * from temp_cat
select * from temp_issue
*/

alter table "IssueCategory" add column if not exists "nTempid" int;
alter table "RIssueMaster" add column if not exists "nTempid" int;

drop table if exists temp_cat;
create temp table temp_cat as 
select "nICid",coalesce("nRefICid",'00000000-0000-0000-0000-000000000000'::uuid) as "nRefICid","nCaseid","cCategory","nUserid","cICtype","dCreateDt","dUpdateDt" 
From jsonb_to_recordset(jCat) as ("nICid" text,"nRefICid" uuid,"nCaseid" uuid,"cCategory" text,"nUserid" uuid,"cICtype" text,"dCreateDt" timestamp,"dUpdateDt" timestamp);

drop table if exists temp_issue;
create temp table temp_issue as 
select "nIid",coalesce("nRefIid",'00000000-0000-0000-0000-000000000000'::uuid) as "nRefIid","cIName","cColor","nICid","dCreatedt","nUserid","dUpdatedt","nCaseid" ,"nRefICid" 
From jsonb_to_recordset(jIssue) as ("nIid" text,"nRefIid" uuid,"cIName" text,"cColor" text,"nICid" text,"dCreatedt" timestamp,"nUserid" uuid,"dUpdatedt" timestamp,"nCaseid" uuid,"nRefICid" uuid);

	

			with tbl as (
			select "nICid", "nRefICid","nCaseid","cCategory","nUserid","cICtype","dCreateDt","dUpdateDt" 
			From temp_cat 
			),insert_cat as (
					insert into "IssueCategory"("nCaseid","cCategory","nUserid","dCreateDt","dUpdateDt","cICtype","nTempid")
					select t."nCaseid",t."cCategory",t."nUserid",t."dCreateDt",t."dUpdateDt",t."cICtype",t."nICid"
					from tbl t where t."nRefICid" = '00000000-0000-0000-0000-000000000000'::uuid and not exists 
						(select * from "IssueCategory" ic 
						where ic."nCaseid" = t."nCaseid" 
						and CASE WHEN t."nUserid" IS NOT NULL THEN ic."nUserid" = t."nUserid" ELSE TRUE END and trim(upper(ic."cCategory")) = trim(upper(t."cCategory")) )
					returning *
				
			),update_cat as (
					update "IssueCategory" i set "cCategory" = t."cCategory","dUpdateDt" = t."dUpdateDt" 
					from tbl t 
					where  t."nRefICid" = i."nICid"
					returning *
			)
			,update_temp as (
					update temp_cat c set "nRefICid" = t."nICid"
					from  insert_cat t 
					where t."nTempid" = c."nICid" 
					returning *
			),update_temp_updated as (

					update temp_cat ic set "nRefICid" = t."nICid"
					from "IssueCategory" t 
					where ic."nRefICid" = '00000000-0000-0000-0000-000000000000'::uuid and 
					(ic."nCaseid" = t."nCaseid" and CASE WHEN ic."nUserid" IS NOT NULL THEN t."nUserid" = ic."nUserid" ELSE TRUE END and trim(upper(ic."cCategory")) = trim(upper(t."cCategory")) ) 
					returning *
			) ,newData as (
				select t."nRefICid" as "nICid",t."nICid" as "nOICid"  
				from temp_cat t
			) select jsonb_agg(t) into jTemp from newData t;

			select jsonb_agg(t)  into  jNCat from (
				select t."nRefICid" as "nICid",t."nICid" as "nOICid"  
				from temp_cat t
				) t;

			with tbl as (
				select "nIid", "nRefIid","cIName","cColor","nICid","dCreatedt","nUserid","dUpdatedt","nCaseid" ,"nRefICid"
				from temp_issue
			),insert_issue as (
				insert into "RIssueMaster"("cIName","cColor","nICid","dCreatedt","nUserid","dUpdatedt","nCaseid","nTempid")
				select t."cIName",t."cColor",coalesce(c."nRefICid",t."nRefICid"),t."dCreatedt",t."nUserid",t."dUpdatedt",t."nCaseid",t."nIid"
				from tbl t 
				left join "temp_cat" c on c."nICid" = t."nICid" 
				where t."nRefIid" = '00000000-0000-0000-0000-000000000000'::uuid and not exists (
					select * From "RIssueMaster" im where im."nCaseid" = t."nCaseid" 
						and CASE WHEN t."nUserid" IS NOT NULL THEN im."nUserid" = t."nUserid" ELSE TRUE END and trim(upper(im."cIName")) = trim(upper(t."cIName"))
				)
				returning *
			),update_issue as (
				update "RIssueMaster" i set "cIName" = t."cIName","cColor" = t."cColor","dUpdatedt" = t."dUpdatedt" 
				from tbl t 
				where t."nRefIid" = i."nIid"
				returning *
			),update_temp as (
					update temp_issue t set "nRefIid" = i."nIid"
					from insert_issue i 
					where t."nIid" = i."nTempid"
					returning *
			),update_temp_updt as (
				
				update temp_issue t set "nRefIid" = i."nIid"
					from "RIssueMaster" i 
					where t."nRefIid" = '00000000-0000-0000-0000-000000000000'::uuid and  i."nCaseid" = t."nCaseid" 
						and CASE WHEN t."nUserid" IS NOT NULL THEN i."nUserid" = t."nUserid" ELSE TRUE END and trim(upper(i."cIName")) = trim(upper(t."cIName"))
					returning *
			),newData as (
				select i."nIid",i."nTempid" as "nOIid" 
				from insert_issue i 				
			) select jsonb_agg(t) into jTemp from newData t; 

			select jsonb_agg(t)  into  jNIssue from (
				select t."nRefIid" as "nIid",t."nIid" as "nOIid"  
				from temp_issue t
				) t;
 
	
OPEN ref FOR
	select 1 as msg,coalesce(jNCat,'[]'::jsonb) as "jNCat",coalesce(jNIssue,'[]'::jsonb) as "jNIssue";
	
				
		
    RETURN ref;
END;
$function$
