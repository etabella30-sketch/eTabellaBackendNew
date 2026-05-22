CREATE OR REPLACE FUNCTION public.et_realtime_onnewtask_start(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;nSesid uuid;

BEGIN

cUnicuserid := parameter ->>'cUnicuserid';
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
/*
select * From "RSessionMaster" order by 1 desc
select * From "RSessionDetail" order by 1 desc
*/

update "RSessionMaster" set "cStatus" = 'C' where "cUnicuserid" = cUnicuserid and "cStatus" = 'R';

update "RSessionMaster" set "cStatus" = 'R' where "nSesid" = nSesid ; -- and "cStatus" != 'C' 

 open ref for select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
