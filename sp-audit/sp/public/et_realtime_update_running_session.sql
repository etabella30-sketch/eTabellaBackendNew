CREATE OR REPLACE FUNCTION public.et_realtime_update_running_session(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;dDate timestamp;nSesid uuid;

BEGIN

cUnicuserid := parameter ->>'cUnicuserid';
dDate := parameter ->>'dDate';
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
/*
select * From "RSessionMaster" order by 1 desc
select * From "RSessionDetail" order by 1 desc
select * from et_realtime_update_running_session ('{"nSesid":1,"permission":"D"}','r1');fetch all in "r1";
*/

update "RSessionMaster" set "cStatus" = 'C' where "cUnicuserid" = cUnicuserid and "cStatus" = 'R' and "nSesid" != nSesid and "dDelDt" is null;

update "RSessionMaster" set "cStatus" = 'R' where "nSesid" = nSesid  and "cStatus" != 'C' and "dDelDt" is null ;

 open ref for select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
