CREATE OR REPLACE FUNCTION transcript.et_list_transcripts(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
BEGIN

-- select * FROM transcript."Transcripts"
    OPEN ref FOR
    SELECT 
        "cTransid", "cTitle", "cCasename", "cCCaseno",
      TO_CHAR("dTranscribedDate",'DD-MM-YYYY') "dTranscribedDate", "dImportDt","nPages","cPath","cReporter","cHtmlpath","cHtmlpath4pg","nSesid"
    FROM transcript."Transcripts"
    ORDER BY "dImportDt" DESC;

    RETURN ref;
END;
$function$
