CREATE OR REPLACE FUNCTION realtime.et_session_servers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cSessionUnicId text;

BEGIN

cSessionUnicId := parameter ->> 'cSessionUnicId';

	open ref for
	
	select r."cName",r."dStartDt",r."nDays",r."nLines",r."cUnicuserid",r."cStatus",
	r."dCreatedt",r."cProtocol",r."nCaseid",r."nRTSid",r."nSesid" ,s."cUrl",s."nPort"
	from "RSessionMaster" r 
	join "RealtimeServers" s on s."nRTSid" = r."nRTSid"
	where r."dDelDt" is null and r."cSessionUnicId" = cSessionUnicId and r."cStatus" != 'C';

	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
