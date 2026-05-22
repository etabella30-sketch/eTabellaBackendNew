CREATE OR REPLACE FUNCTION public.et_realtime_notification_pending(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nNTid uuid;nMsg int;

BEGIN

nNTid := NULLIF(parameter ->>'nNTid','')::uuid;
nMsg := parameter ->>'nMsg';

open ref for
select n."nNTid",n."nUserid",n."cTitle" as "title",n."cMsg" as "message",n."dDate",u."cToken",n."isScheduled"
from "Notifications" n
join "UserMaster" u on u."nUserid" = n."nUserid"
where n."cStatus" = 'P';

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
