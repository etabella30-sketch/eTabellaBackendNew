CREATE OR REPLACE FUNCTION public.et_realtime_setserver(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nSesid uuid;nRTSid uuid;

BEGIN

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nRTSid := NULLIF(parameter ->>'nRTSid','')::uuid;
/*
select * from et_realtime_setserver ('{"nCaseid":22,"nSesid":3,"nRTSid":1,"cNotifytype":"N","jUserid":"[{\"u\":4,\"t\":\"O\"},{\"u\":59,\"t\":\"O\"},{\"u\":123,\"t\":\"T\"},{\"u\":304,\"t\":\"T\"},{\"u\":36,\"t\":\"T\"},{\"u\":142,\"t\":\"T\"},{\"u\":216,\"t\":\"T\"}]","cUnicuserid":"mw0a2bm2od"}','r1');fetch all in "r1";
select * from "RSessionMaster"
select * from "RSessionDetail" where "nSesid" = 10
select * from "RealtimeServers"
*/

update "RSessionMaster" set "nRTSid" = nRTSid where "nSesid" = nSesid;

open ref for
select 1 as msg,'Assigned' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
