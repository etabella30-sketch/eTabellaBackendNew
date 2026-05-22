CREATE OR REPLACE FUNCTION public.et_realtime_notification_status_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nNTid uuid;nMsg int;

BEGIN

nNTid := NULLIF(parameter ->>'nNTid','')::uuid;
nMsg := parameter ->>'nMsg';
/*
select * from et_realtime_notification_users ('{""nSesid"":12}','r1');fetch all in ""r1"";

select * From "Notifications"
*/

update "Notifications" set "cStatus" = case when nMsg = 1 then 'C' else 'F' end where "nNTid" = nNTid;

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
