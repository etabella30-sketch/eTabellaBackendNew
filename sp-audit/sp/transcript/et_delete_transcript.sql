CREATE OR REPLACE FUNCTION transcript.et_delete_transcript(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare cTransid uuid;
BEGIN
	cTransid := parameter->>'cTransid';

	/*
		if( select 1 from transcript."Transcripts" where "nSesid" is not null and  "cTransid" = cTransid)then 
				 update "RSessionMaster" set "isTranscript" = null,"isUploaded" = null where "cSesid" = cSesid;
		end if;
	*/

	delete from  transcript."Transcripts" where "cTransid" = cTransid;
	-- select * from "CaseMaster" order by 1 desc
    OPEN ref FOR select 1  msg,'Deleted' value;

    RETURN ref;
END;
$function$
