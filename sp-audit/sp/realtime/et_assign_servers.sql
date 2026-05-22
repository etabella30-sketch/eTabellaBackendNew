CREATE OR REPLACE FUNCTION realtime.et_assign_servers(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;nSesid uuid;nRTSid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
nSesid := parameter ->>'nSesid';
nRTSid := parameter ->>'nRTSid';

/*
select * from realtime.et_assign_servers ('{"body":{"nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","nSesid":"518f6223-fe7a-436d-bb9c-613eb0bffc7e","nRTSid":"efc7c25a-7f4b-41fe-8bc7-23d5a8d7fa2e","cNotifytype":"O","jUserid":"[]","cUnicuserid":"aefcf5ef-9bc2-45e3-b45b-7634b036960c"}}','r1');fetch all in "r1";

select * from "RSessionMaster"
select * from "RealtimeServers"
*/

	if(nRTSid is not null) then
		update "RSessionMaster" set "nRTSid" = nRTSid where  "nSesid" = nSesid;
    	OPEN ref1 FOR 
			select 1 as msg , 'Server assigned' as value;
	else
		OPEN ref1 FOR 
			select -1 as msg , 'Please select server' as value;
	end if;
    
  
    RETURN NEXT ref1;
    
    
END;
$function$
