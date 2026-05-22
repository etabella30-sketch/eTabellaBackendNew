CREATE OR REPLACE FUNCTION public.et_realtime_assignment(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nSesid uuid;jUserid jsonb;nRTSid uuid;cNotifytype text;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
jUserid := parameter ->>'jUserid';
nRTSid := NULLIF(parameter ->>'nRTSid','')::uuid;
cNotifytype := parameter ->>'cNotifytype';
/*
select * from et_realtime_assignment ('{"nCaseid":22,"nSesid":3,"nRTSid":1,"cNotifytype":"N","jUserid":"[{\"u\":4,\"t\":\"O\"},{\"u\":59,\"t\":\"O\"},{\"u\":123,\"t\":\"T\"},{\"u\":304,\"t\":\"T\"},{\"u\":36,\"t\":\"T\"},{\"u\":142,\"t\":\"T\"},{\"u\":216,\"t\":\"T\"}]","cUnicuserid":"mw0a2bm2od"}','r1');fetch all in "r1";
select * from "RSessionMaster"
select * from "RSessionDetail" where "nSesid" = 10
select * from "RealtimeServers"
select * from "UserMaster"
*/

update "RSessionMaster" set "nRTSid" = nRTSid,"cNotifytype"=cNotifytype  where "nSesid" = nSesid;

delete from "RSessionDetail" where "nSesid" = nSesid and (jUserid @> ('{"u":"'|| "nUserid" ||'"}')::jsonb ) = false;

insert into "RSessionDetail"("nSesid","nUserid","cUsertype")
select nSesid,t."u",t."t" From jsonb_to_recordset(jUserid) as t("u" uuid,"t" text) 
where not exists (select * from "RSessionDetail" sd where sd."nSesid" = nSesid and sd."nUserid" = t."u");

open ref for
select 1 as msg,'Assigned' as value,nSesid as "nSesid"
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
