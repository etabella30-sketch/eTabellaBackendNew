CREATE OR REPLACE FUNCTION realtime.et_update_transcript_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;cStatus boolean;

BEGIN

nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
cStatus := parameter ->> 'cStatus';

-- select * From "RSessionMaster" where "dCreatedt"::date = now()::date

	update "RSessionMaster" set "isTranscript" = cStatus where "nSesid" = nSesid;

	open ref for select 1 as msg,'Transcript status updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
