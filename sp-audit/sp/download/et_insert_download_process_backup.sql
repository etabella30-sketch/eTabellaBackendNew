CREATE OR REPLACE FUNCTION download.et_insert_download_process_backup(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;
jFolder jsonb;jFiles jsonb;
nDPid uuid;isExistingJob boolean default false;

BEGIN

/*

 select * from download.et_insert_download_process ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377}','r1');fetch all in "r1";

select * From download."ProcessMaster"
select * From download."Options"
select * From download."Users"

*/
 
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

jFolder := parameter ->>'jFolder';
jFiles := parameter ->>'jFiles';

/*
select "nDPid" into nDPid 
	From download."ProcessMaster" 
	where "nCaseid" = nCaseid and "nSectionid" = nSectionid and 
	"cStatus" not in ('E','F')  and "jFiles" = jFiles and 
	"jFolder" = jFolder;*/
	

insert into download."ProcessMaster"("nCaseid","nSectionid","nCreateId","jFiles","jFolders")
values (nCaseid,nSectionid,nMasterid,jFiles,jFolder)
returning "nDPid" into nDPid;

insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
values(nDPid,'Q',now());

open ref for select 1 as msg,'Download Process Started' as value,nDPid as "nDPid",isExistingJob as "isExistingJob"

;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
