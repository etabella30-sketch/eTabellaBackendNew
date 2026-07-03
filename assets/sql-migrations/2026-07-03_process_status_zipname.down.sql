-- Revert 2026-07-03_process_status_zipname: restore the pre-G7
-- download.et_update_process_status (no cZipname on the result cursor).

CREATE OR REPLACE FUNCTION download.et_update_process_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nDPid uuid;cStatus text;nMasterid uuid;dStartDt timestamp;

BEGIN

nDPid := parameter ->> 'nDPid';
cStatus := parameter ->> 'cStatus';

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
$function$;
