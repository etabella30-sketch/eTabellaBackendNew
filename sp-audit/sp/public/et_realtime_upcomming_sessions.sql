CREATE OR REPLACE FUNCTION public.et_realtime_upcomming_sessions(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

BEGIN

 open ref for
 select "nSesid","dStartDt","cUnicuserid" from "RSessionMaster" where coalesce("cStatus",'P') = 'P' and "dDelDt" is null;
 
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
