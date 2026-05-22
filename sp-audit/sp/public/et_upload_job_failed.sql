CREATE OR REPLACE FUNCTION public.et_upload_job_failed(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nJobid uuid;cStatus text;
BEGIN

nJobid := NULLIF(parameter ->>'nJobid','')::uuid;
cStatus := parameter ->>'cStatus';

update "JobMaster" set "cStatus" = cStatus where "nJobid" = nJobid;

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
