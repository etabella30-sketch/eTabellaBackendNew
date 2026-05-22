CREATE OR REPLACE FUNCTION download.et_update_process_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nDPid uuid;cStatus text;nMasterid uuid;dStartDt timestamp;

BEGIN

nDPid := parameter ->> 'nDPid';
cStatus := parameter ->> 'cStatus';

/*

select * from download.et_update_process_status('{}','r');fetch all in "r"
 select * from download.et_update_process_status ('{"nDPid":"4507d890-5ab0-4adf-84f8-25f13f1b8475","cStatus":"C"}','r1');fetch all in "r1";
select * From download."ProcessStatusLogs"

select * From download."ProcessMaster" order by "dCreateDt"

alter table download."ProcessMaster" add column "dStartDt" timestamp

"dStartDt"
"dEndDt"

update "ProcessMaster" set "cStatus" = 'E' where "nCaseid" = 'b33c9fc9-2512-46b7-8770-2e71c685fb15' and "cStatus" = 'C' 
 
*/
 
nDPid := NULLIF(parameter ->>'nDPid','')::uuid;

update download."ProcessMaster" set "cStatus" = cStatus,"dLastUpdateDt" = now(),
"dStartDt" = case when cStatus = 'C' then now() else "dStartDt" end
where "nDPid" = nDPid
returning "nCreateId","dStartDt" into nMasterid,dStartDt;

if(nDPid is not null)then
	insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
	values(nDPid,cStatus,now());
end if;

open ref for select 1 as msg,'Status Updated' as value,nMasterid as "nMasterid",dStartDt as "dStartDt"

;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
