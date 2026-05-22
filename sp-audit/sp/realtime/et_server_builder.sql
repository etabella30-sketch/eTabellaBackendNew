CREATE OR REPLACE FUNCTION realtime.et_server_builder(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;cSessionUnicId text;permission text;
nPort int;cName text;cUrl text;nRTSid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
cSessionUnicId := parameter ->>'cSessionUnicId';

nPort := parameter ->>'nPort';
cName := parameter ->>'cName';
cUrl := parameter ->>'cUrl';

permission := parameter ->>'permission';

/*

 select * from realtime.et_server_builder ('{"cSessionUnicId":"0a95010bbe6a","cName":"DFC","nPort":4545,"cUrl":"109.22.22.22","permission":"E"}','r1');fetch all in "r1";
 
select * from "RealtimeServers"
alter table "RealtimeServers" add column "bIsDefault" boolean
*/

if permission = 'N' then

	if not exists (select * from "RealtimeServers" where ("cSessionUnicId" = cSessionUnicId or "bIsDefault" = true) and "nPort" = nPort and "cUrl" = cUrl )then
	
		insert into "RealtimeServers"("cName","nPort","cUrl","cSessionUnicId")
		values(cName,nPort,cUrl,cSessionUnicId)
		returning "nRTSid" into nRTSid;
		open ref1 for select 1 as msg,nRTSid as "nSesid" ,'Server Created' as value;
		
	else
		open ref1 for select -1 as msg,'Server already exists' as value;
	end if;

	

elsif permission = 'E' then

	if not exists (select * from "RealtimeServers" where  ("cSessionUnicId" = cSessionUnicId or "bIsDefault" = true) and "nPort" = nPort and "cUrl" = cUrl  and "nRTSid" != nRTSid )then
		
		
		update "RealtimeServers" set "cName" =  cName,"nPort" = nPort,"cUrl" = cUrl where "nRTSid" = nRTSid;
		open ref1 for select 1 as msg,nSesid as "nSesid" ,'Server Updated' as value;
	
	else
		open ref1 for select -1 as msg,'Server already exists' as value;
	end if;

else 

	
		open ref1 for select -1 as msg,'Invalid request' as value;

end if;

        
    RETURN NEXT ref1;
    
    

     
END;
$function$
