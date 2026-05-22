CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_claim_secquence(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    msg_text TEXT := 'Sequence updated successfully';
	nUserid uuid :=parameter->>'nUserid';
BEGIN

    WITH input_data AS (
        SELECT *
        FROM jsonb_to_recordset((parameter ->> 'jClaims')::jsonb)
        AS x("nICid" uuid, "nSequence" integer)
    )
    INSERT INTO realtime."RClaimSequence"("nICid", "nSequence","nUserid")
    SELECT "nICid", "nSequence",nUserid FROM input_data
    ON CONFLICT ("nICid")
    DO UPDATE SET "nSequence" = EXCLUDED."nSequence",
    "nUserid" = nUserid;

    OPEN ref FOR
    SELECT 1 AS msg, msg_text AS message,*
        FROM jsonb_to_recordset((parameter ->> 'jClaims')::jsonb)
        AS x("nICid" uuid, "nSequence" integer)
    ;

    RETURN ref;
END;
$function$
