CREATE OR REPLACE FUNCTION download.et_process_retry(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare
nDPid uuid;
nMasterid uuid;

BEGIN

/*

select * from download.et_process_retry('{"nDPid":1}','r');fetch all in "r"

 select * from download.et_process_retry('{"nDPid":"1a9ba0f6-7e30-4501-8dbb-89a2e0ba4064","nSectionid":9425,"nMasterid":59}','r');fetch all in "r";

select * From download."ProcessMaster" 
 select * From download."ProcessStatusLogs" where "nDPid" = '1a9ba0f6-7e30-4501-8dbb-89a2e0ba4064'
*/
 
nDPid := NULLIF(parameter ->>'nDPid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

-- SEC3 (2026-07-02): the SP previously ignored nMasterid entirely, so any
-- authenticated user could retry any job by nDPid. Deny non-members of the
-- job's case before mutating anything.
if not exists (
  select 1 from download."ProcessMaster" p
  where p."nDPid" = nDPid and public.et_is_case_member(p."nCaseid", nMasterid)
) then
  open ref for select 0 as msg,'Not authorized for this job' as value;
  return ref;
end if;

update download."ProcessMaster" set "cStatus" = 'R' where "nDPid" = nDPid;

insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
values(nDPid,'R',now());

open ref for
select 1 as msg,'Retried job' as value;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
