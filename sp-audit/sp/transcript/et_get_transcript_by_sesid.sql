CREATE OR REPLACE FUNCTION transcript.et_get_transcript_by_sesid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nSesid uuid;cTransid uuid;
cProtocol text;
BEGIN
	nSesid := parameter->>'nSessionid';
-- select * from transcript.et_get_transcript_by_sesid('{"nSessionid":"38cef4a5-1d50-4c4b-916c-2e1d8b7a6d4c"}','r');fetch all in "r"
	select "cProtocol" into cProtocol from "RSessionMaster" where "nSesid" = nSesid  limit 1;
	select "cTransid" into cTransid from transcript."Transcripts" where "nSesid" = nSesid order by "dPublishDt" desc limit 1;
	-- select * from "CaseMaster" order by 1 desc
	if(cTransid is not null) then 
    	OPEN ref FOR select 1  msg,cTransid "cTransid",cProtocol "cProtocol";
	else 
		OPEN ref FOR select -1  msg,'Transcript not exists',cProtocol "cProtocol";
	end if;

    RETURN ref;
END;
$function$
