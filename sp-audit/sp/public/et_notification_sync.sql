CREATE OR REPLACE FUNCTION public.et_notification_sync(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_notification_list ('{""nCaseid"":22,""nMasterid"":2}','r1');fetch all in ""r1"";

select * From ""UploadMaster""
*/

	update "Notifications" set "bIsseen" = true where "nCaseid" = nCaseid and "nUserid" = nMasterid;

open ref for select 1 msg;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
