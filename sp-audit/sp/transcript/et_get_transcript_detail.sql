CREATE OR REPLACE FUNCTION transcript.et_get_transcript_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare p_transid uuid;
maxDayno int;
maxDayText TEXT;
BEGIN
-- alter table transcript."Transcripts" add column "nPages" int
	p_transid := parameter->>'cTransid';

	begin 
	select
        "cCDay" into maxDayText
    FROM (
        SELECT "cCDay",
               COALESCE(NULLIF(regexp_replace("cCDay", '^.*?(\d+).*$', '\1'), ''), '0')::INT AS day_number
        FROM transcript."Transcripts"
        WHERE "cCCaseno" = (
            SELECT "cCCaseno" 
            FROM transcript."Transcripts" 
            WHERE "cTransid" = p_transid
        )
    ) sub
    ORDER BY day_number DESC
    LIMIT 1;

	 RAISE NOTICE 'Next cCDay: %', maxDayText; 
	maxDayText := regexp_replace(maxDayText, '(\d+)',(COALESCE(NULLIF(regexp_replace(maxDayText, '^.*?(\d+).*$', '\1'), ''), '0')::INT + 2)::text);
	
	EXCEPTION WHEN OTHERS THEN
		-- If any error occurs, fallback to default value
		RAISE NOTICE 'Error extracting max day, defaulting to Day 1';
	END;
	
	-- select * from  transcript."Transcripts"
    OPEN ref FOR
    SELECT "cTransid", "cThemeid", "cCasetype", "cCCaseno", "cCAlign", "cClaiment", "cRespondent", "cArbitrator", "cCDay", "dCDate", "cBClaiment", "cBRespondent", "cCasename", "cTCaseno", "dTDate", "tTTime", "cReporter", "cTitle", "cTVolume", "dTranscribedDate", "cCompany", "cCompanyinfo", "dImportDt","cPath",
	"cClaimentH","cRespondentH","cBClaimentH","cBRespondentH","nStartpg","nSecondpg","nLines","nPages","cHtmlpath","cHtmlpath4pg","nSesid","dPublishDt",
	"cArbitratorH","cBehalfAlign","nCSpacing",maxDayText "maxDayText",to_char("dCDate",'MM-DD-YYYY') "dCDate1",to_char("dTDate",'MM-DD-YYYY') "dTDate1",to_char("dTranscribedDate",'MM-DD-YYYY') "dTranscribedDate1"
    FROM transcript."Transcripts"
    WHERE "cTransid" = p_transid;

    RETURN ref;
END;
$function$
