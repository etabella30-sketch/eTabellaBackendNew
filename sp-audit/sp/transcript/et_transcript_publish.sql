CREATE OR REPLACE FUNCTION transcript.et_transcript_publish(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$-- PATCHED et_transcript_publish
declare
  nSesid uuid;
  nCaseid uuid;
  cTransid uuid;
  cPath text;
  cNewpath text;
BEGIN
  nSesid   := parameter->>'nSesid';
  nCaseid  := parameter->>'nCaseid';
  cTransid := parameter->>'cTransid';

  cNewpath := 's_' || nSesid || '.json';

  select "cPath" into cPath
  from transcript."Transcripts"
  where "cTransid" = cTransid;

  update transcript."Transcripts"
    set "dPublishDt" = now(),
        "nSesid" = nSesid
    where "cTransid" = cTransid;

  update "RSessionMaster"
    set "isTranscript" = true,
        "isUploaded"   = true,
        "cStatus"      = 'P'          -- ← NEW: move session to "Published"
    where "nSesid" = nSesid;

  OPEN ref FOR
    select 1 msg, 'Published' value, cPath "cPath", cNewpath "cNewpath";

  RETURN ref;
END;$function$
