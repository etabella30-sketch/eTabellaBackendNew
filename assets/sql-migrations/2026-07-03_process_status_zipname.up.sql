-- 2026-07-03  download.et_update_process_status also returns the package's
-- display name ("cZipname") so the completion socket event can carry it —
-- the FE toast can then say "<name> is ready to download" without refetching
-- the job list (plan §Phase C, G7). Additive column on the result cursor;
-- existing consumers read by name and are unaffected.

CREATE OR REPLACE FUNCTION download.et_update_process_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nDPid uuid;cStatus text;nMasterid uuid;dStartDt timestamp;cZipname text;

BEGIN

nDPid := parameter ->> 'nDPid';
cStatus := parameter ->> 'cStatus';

nDPid := NULLIF(parameter ->>'nDPid','')::uuid;

update download."ProcessMaster" set "cStatus" = cStatus,"dLastUpdateDt" = now(),
"dStartDt" = case when cStatus = 'C' then now() else "dStartDt" end
where "nDPid" = nDPid
returning "nCreateId","dStartDt","cZipname" into nMasterid,dStartDt,cZipname;

if(nDPid is not null)then
	insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
	values(nDPid,cStatus,now());
end if;

open ref for select 1 as msg,'Status Updated' as value,nMasterid as "nMasterid",dStartDt as "dStartDt",cZipname as "cZipname"

;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;
