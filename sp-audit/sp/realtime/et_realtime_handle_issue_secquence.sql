CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_issue_secquence(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    msg_text TEXT := 'Sequence updated successfully';
BEGIN

    WITH input_data AS (
        SELECT *
        FROM jsonb_to_recordset((parameter ->> 'jIssues')::jsonb)
        AS x("nIid" uuid, "nSequence" integer)
    )
    INSERT INTO realtime."RIssueSequence"("nIid", "nSequence")
    SELECT "nIid", "nSequence" FROM input_data
    ON CONFLICT ("nIid")
    DO UPDATE SET "nSequence" = EXCLUDED."nSequence";

    OPEN ref FOR
    SELECT 1 AS msg, msg_text AS message;

    RETURN ref;
END;
$function$
