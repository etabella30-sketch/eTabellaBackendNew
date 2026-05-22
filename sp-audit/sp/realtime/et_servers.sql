CREATE OR REPLACE FUNCTION realtime.et_servers(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;cSessionUnicId text;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
cSessionUnicId := parameter ->>'cSessionUnicId';

/*

 select * from realtime.et_servers ('{"sessionUserId":"0a95010bbe6a","nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";
 

select * from "RSessionMaster" where "nSesid" = '518f6223-fe7a-436d-bb9c-613eb0bffc7e'

  select * from "RSessionMaster" where "cSessionUnicId" is not null order by "cSessionUnicId"

select * from "RealtimeServers"
*/

    
    OPEN ref1 FOR 
	select s."cName" ,s."cUrl",s."nPort",s."nRTSid"
	from "RealtimeServers" s
	where s."cSessionUnicId" = cSessionUnicId or "bIsDefault" = true
    ;    
        
    RETURN NEXT ref1;
    
    
END;
$function$
