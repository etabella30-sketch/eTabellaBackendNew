CREATE OR REPLACE FUNCTION public.et_realtime_insertupdate_servers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nRTSid uuid;cUrl text;nPort integer;cName text;permission text;

BEGIN

nRTSid := NULLIF(parameter ->>'nRTSid','')::uuid;
cUrl := parameter ->>'cUrl';
nPort := parameter ->>'nPort';
cName := parameter ->>'cName';
permission := parameter ->>'permission';

/*
select * From "RealtimeServers" order by 1 desc
select * From "CaseMaster" order by 1 limit 10
select * from et_realtime_sessionlist('{"cUnicuserid":"asd"}','r');fetch all in "r"
*/

if(permission = 'N')then 

	
	if not exists(select * from "RealtimeServers" where "cUrl" = cUrl and "nPort" = nPort )then   

		insert into "RealtimeServers"("cUrl","nPort","cName")
		values(cUrl,nPort,cName)
        RETURNING "nRTSid" INTO nRTSid;
		
	 	open ref for 
 		select 1 as msg,'Server created successfully' as value,nRTSid as "nRTSid";

	else
		open ref for select -1 as msg,'Server already exists' as value;
	end if;

end if;

if(permission = 'E')then 

	if not exists(select * from "RealtimeServers" where "cUrl" = "cUrl" and "nPort" = nPort and  "nRTSid" != nRTSid )then   

		update "RealtimeServers" 
		set "cUrl"=cUrl,"nPort"=nPort,"cName"=cName
		where "nRTSid" = nRTSid ;

	 	open ref for 
 		select 1 as msg,'Server updated successfully' as value;

	else
		open ref for select -1 as msg,'Server already exists' as value;
	end if;
end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
