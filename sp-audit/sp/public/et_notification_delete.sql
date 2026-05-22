CREATE OR REPLACE FUNCTION public.et_notification_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nNTid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nNTid := NULLIF(parameter ->>'nNTid','')::uuid;

/*
select * from et_notification_clearall ('{""nCaseid"":22,""nMasterid"":2}','r1');fetch all in ""r1"";

select * from "Notifications"

*/

delete from "Notifications" where "nUserid" = nMasterid and nCaseid = nCaseid and case when nNTid IS NOT NULL then "nNTid" = nNTid else true end;

open ref for
	select 1 as msg
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
