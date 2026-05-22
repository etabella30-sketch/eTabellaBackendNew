CREATE OR REPLACE FUNCTION transcript.et_transcripts_builder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Identifiers
    c_transid UUID;
    inserted_id UUID;

    -- Operation tracking
    msg INT := 1;
    msg_text TEXT := '';
    op_type TEXT := parameter ->> 'cOpType';

    -- Extracted fields
    c_themeid UUID;
    c_casetype VARCHAR;
    c_ccaseno VARCHAR;
    c_calign CHAR(1);
    c_claiment VARCHAR;
    c_respondent VARCHAR;
    c_claiment_h VARCHAR;
    c_respondent_h VARCHAR;
    c_arbitrator VARCHAR;
    c_cday VARCHAR;
    d_cdate DATE;
    c_bclaiment VARCHAR;
    c_brespondent VARCHAR;
    c_bclaiment_h VARCHAR;
    c_brespondent_h VARCHAR;
    c_casename VARCHAR;
    c_tcaseno VARCHAR;
    d_tdate DATE;
    t_ttime TIME;
    c_reporter VARCHAR;
    c_title VARCHAR;
    c_TVolume VARCHAR;
    d_transcribeddate DATE;
    c_company VARCHAR;
    c_companyinfo VARCHAR;
    n_startpg INT;
    n_secondpg INT;
    n_lines INT;
    n_userid uuid;
    d_publishdt TIMESTAMP;
    d_updatedt TIMESTAMP;
	cPath text;nPages int;
	cBehalfAlign text;cArbitratorH text;
	nCSpacing int;
	
BEGIN
    -- Extract fields from JSON
	
    c_themeid := (parameter ->> 'cThemeid')::UUID;
    c_casetype := parameter ->> 'cCasetype';
    c_ccaseno := parameter ->> 'cCCaseno';
    c_calign := (parameter ->> 'cCAlign')::CHAR(1);
    c_claiment := parameter ->> 'cClaiment';
    c_respondent := parameter ->> 'cRespondent';
    c_claiment_h := parameter ->> 'cClaimentH';
    c_respondent_h := parameter ->> 'cRespondentH';
    c_arbitrator := parameter ->> 'cArbitrator';
    c_cday := (parameter ->> 'cCDay');
    d_cdate := (parameter ->> 'dCDate')::DATE;
    c_bclaiment_h := parameter ->> 'cBClaimentH';
    c_brespondent_h := parameter ->> 'cBRespondentH';
    c_bclaiment := parameter ->> 'cBClaiment';
    c_brespondent := parameter ->> 'cBRespondent';
    c_casename := parameter ->> 'cCasename';
    c_tcaseno := parameter ->> 'cTCaseno';
    d_tdate := (parameter ->> 'dTDate')::DATE;
    t_ttime := (parameter ->> 'tTTime')::TIME;
    c_reporter := parameter ->> 'cReporter';
    c_title := parameter ->> 'cTitle';
    c_TVolume := (parameter ->> 'cTVolume');
    d_transcribeddate := (parameter ->> 'dTranscribedDate')::DATE;
    c_company := parameter ->> 'cCompany';
    c_companyinfo := parameter ->> 'cCompanyinfo';
    n_startpg := (parameter ->> 'nStartpg')::INT;
    n_secondpg := (parameter ->> 'nSecondpg')::INT;
    n_lines := (parameter ->> 'nLines')::INT;
    n_userid := (parameter ->> 'nMasterid');
    op_type := (parameter ->> 'permission')::text;
	cPath := (parameter ->> 'cPath')::text;
	nPages:= (parameter ->> 'nPages')::INT;
	cBehalfAlign := parameter ->> 'cBehalfAlign';
	cArbitratorH := parameter ->> 'cArbitratorH';
	nCSpacing := coalesce((parameter ->> 'nCSpacing')::int,1);

    IF op_type = 'I' THEN

	
        INSERT INTO transcript."Transcripts" (
            "cThemeid", "cCasetype", "cCCaseno", "cCAlign", "cClaimentH", "cRespondentH","cClaiment", "cRespondent",
            "cArbitrator", "cCDay", "dCDate", "cBClaimentH", "cBRespondentH","cBClaiment", "cBRespondent", "cCasename",
            "cTCaseno", "dTDate", "tTTime", "cReporter", "cTitle", "cTVolume", "dTranscribedDate",
            "cCompany", "cCompanyinfo", "nStartpg", "nSecondpg", "nLines", "nCreateid","cPath","nPages","cArbitratorH","cBehalfAlign",
			"nCSpacing"
        )
        VALUES (
            c_themeid, c_casetype, c_ccaseno, c_calign, c_claiment_h, c_respondent_h,c_claiment, c_respondent,
            c_arbitrator, c_cday, d_cdate, c_bclaiment_h, c_brespondent_h, c_bclaiment, c_brespondent, c_casename,
            c_tcaseno, d_tdate, t_ttime, c_reporter, c_title, c_TVolume, d_transcribeddate,
            c_company, c_companyinfo, n_startpg, n_secondpg, n_lines, n_userid,
            cPath,nPages,cArbitratorH,cBehalfAlign,nCSpacing
        )
        RETURNING "cTransid" INTO inserted_id;

        msg_text := 'Transcript inserted';

    ELSIF op_type = 'U' THEN
        c_transid := (parameter ->> 'cTransid')::UUID;

        UPDATE transcript."Transcripts"
        SET
            "cThemeid" = c_themeid,
            "cCasetype" = c_casetype,
            "cCCaseno" = c_ccaseno,
            "cCAlign" = c_calign,
            "cClaimentH" = c_claiment_h,
            "cRespondentH" = c_respondent_h,
            "cClaiment" = c_claiment,
            "cRespondent" = c_respondent,
            "cArbitrator" = c_arbitrator,
            "cCDay" = c_cday,
            "dCDate" = d_cdate,
            "cBClaiment" = c_bclaiment,
            "cBRespondent" = c_brespondent,
            "cBClaimentH" = c_bclaiment_h,
            "cBRespondentH" = c_brespondent_h,
            "cCasename" = c_casename,
            "cTCaseno" = c_tcaseno,
            "dTDate" = d_tdate,
            "tTTime" = t_ttime,
            "cReporter" = c_reporter,
            "cTitle" = c_title,
            "cTVolume" = c_TVolume,
            "dTranscribedDate" = d_transcribeddate,
            "cCompany" = c_company,
            "cCompanyinfo" = c_companyinfo,
            "nStartpg" = n_startpg,
            "nSecondpg" = n_secondpg,
            "nLines" = n_lines,
            "nUpdateid" = n_userid,
            "dUpdateDt" = now(),
			"cArbitratorH"= cArbitratorH,"cBehalfAlign" = cBehalfAlign,
			"nCSpacing" = nCSpacing
        WHERE "cTransid" = c_transid;

        inserted_id := c_transid;
        msg_text := 'Transcript updated';

    ELSIF op_type = 'D' THEN
        c_transid := (parameter ->> 'cTransid')::UUID;

        BEGIN
            DELETE FROM transcript."Transcripts"
            WHERE "cTransid" = c_transid;

            inserted_id := c_transid;
            msg_text := 'Transcript deleted';
        EXCEPTION
            WHEN foreign_key_violation THEN
                msg := -1;
                msg_text := 'Cannot delete transcript. It is being referenced.';
                OPEN ref FOR SELECT msg, msg_text AS value, NULL::UUID AS inserted_id;
                RETURN ref;
            WHEN OTHERS THEN
                msg := -1;
                msg_text := 'Error deleting transcript: ' || SQLERRM;
                OPEN ref FOR SELECT msg, msg_text AS value, NULL::UUID AS inserted_id;
                RETURN ref;
        END;

    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    OPEN ref FOR SELECT msg, msg_text AS value, inserted_id;
    RETURN ref;
END;
$function$
