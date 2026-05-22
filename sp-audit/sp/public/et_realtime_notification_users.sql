CREATE OR REPLACE FUNCTION public.et_realtime_notification_users(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nSesid uuid;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
/*
select * from et_realtime_notification_users ('{""nSesid"":12}','r1');fetch all in ""r1"";
select * from "RSessionMaster" order by 1 desc
select * from "RSessionDetail" where "nSesid" = 10
select * from "RealtimeServers"
select * from "UserMaster" where "nUserid" = 2
select * from "CaseMaster"
*/

open ref for

with tbl as (

select u."nUserid",u."cToken",sm."cNotifytype",sm."dStartDt",sm."dStartDt" as "dDate",'Realtime live feed' as "title",
'Live feed '|| (case when sm."cNotifytype" !='O' then 'will be start' else 'started' end)  || ' @ '|| to_char(sm."dStartDt",'hh:mi AM dd/mm/yyyy') || ' for case ' || cm."cCasename"  as "message",coalesce(u."cFname",'') || ' ' || coalesce(u."cLname",'') as "user"

from "UserMaster" u
join "RSessionDetail" d on d."nSesid" = nSesid and d."nUserid" = u."nUserid"
join "RSessionMaster" sm on sm."nSesid" = d."nSesid" 
join "CaseMaster" cm on cm."nCaseid" = sm."nCaseid"
--where nullif(u."cToken",'') is not null
)
select t.* ,case when "cNotifytype" != 'O' then false else true end as "isScheduled",insert_notification("title","message","nUserid",case when "cNotifytype" != 'O' then null else "dStartDt" end) "nNTid"
from tbl t

;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
