CREATE OR REPLACE FUNCTION task.et_elasticsearch_upload_insert_tasks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nCaseid uuid;
    nUserid uuid;
	nUPid uuid;
	nTotal int;
	nTid uuid;
	keepAlive int default 60000; -- 18000000 ; -- 1000 * 60 * 60 * 5;
BEGIN
    -- Parameter extraction
    nUserid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    nUPid := NULLIF(parameter ->> 'nUPid', '')::uuid;

--select 1000 * 60;

/*
 select * from task.et_elasticsearch_upload_insert_tasks ('{""nUPid"":1,""nTotal"":1,""nMasterid"":366}','r1');fetch all in ""r1"";

 select * from task.et_elasticsearch_upload_insert_tasks ('{"nUPid":"7a6dbf2a-ea86-401d-9368-37bc4bbe510b","nTotal":1,"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

 
select * from ""temp_filterd_data""

select * From ""UploadDetail""

select * From "UploadMaster"

alter table "UploadMaster" add column "nTid" uuid

select * From task.""TaskMaster""
	
select * From "UploadDetail"

alter table ""UploadMaster"" add column ""nTid"" int

*/

select count("nUDid") into nTotal 
from "UploadDetail" 
where "nUPid" = nUPid and "cType" = 'PDF';

if(nTotal>0)then
	if exists (select * from  "UploadMaster" where "nUPid" = nUPid and "nTid" is null)then

	
		select "nCaseid" into nCaseid 
		From "UploadMaster" where "nUPid" = nUPid;

		insert into task."TaskMaster" ("nTCatid","nUserid","nCaseid","nTotal","keepAlive")
		values(6,nUserid,nCaseid,nTotal,keepAlive) returning "nTid" into nTid; 

		update "UploadMaster" set "nTid" = nTid where "nUPid" = nUPid;

		OPEN ref FOR 
			select 1 as msg,nTid as "nTid",nCaseid as "nCaseid",nTotal as "nTotal",keepAlive as "keepAlive";
	else
   		OPEN ref FOR 
			select -1 as msg;

	end if;
else

    OPEN ref FOR 
		select -1 as msg;

end if;

RETURN ref;

END;
$function$
