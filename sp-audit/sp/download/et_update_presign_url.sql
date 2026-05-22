CREATE OR REPLACE FUNCTION download.et_update_presign_url(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nDPid uuid;cUrl text;

BEGIN

nDPid := parameter ->> 'nDPid';
cUrl := parameter ->> 'cUrl';

/*

 select * from download.et_update_presign_url ('{"nDPid":"d4ed7930-b312-4c8f-8d76-6d4bdeac7d90","cStatus":"C"}','r1');fetch all in "r1";
select * From download."ProcessStatusLogs"

select * From download."ProcessMaster"

 
*/
 
nDPid := NULLIF(parameter ->>'nDPid','')::uuid;
cUrl := parameter ->>'cUrl';

update download."ProcessMaster" set "cUrl" = cUrl,"dLastUpdateDt" = now() where "nDPid" = nDPid;

open ref for select 1 as msg,'Status Updated' as value;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
