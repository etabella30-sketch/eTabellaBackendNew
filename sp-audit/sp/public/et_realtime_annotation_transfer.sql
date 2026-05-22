CREATE OR REPLACE FUNCTION public.et_realtime_annotation_transfer(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
BEGIN
    -- Update the RIssueDetail table with the new values from the JSON array
    UPDATE "RIssueDetail" rd
    SET "jTCordinates" = (jdata->>'jTCordinates')::jsonb,
        "cTPageno" = (jdata->>'cTPageno')::int
    FROM (
        SELECT jsonb_array_elements(parameter::jsonb) AS jdata
    ) AS sub
    WHERE rd."nIDid" = (sub.jdata->>'nIDid')::uuid;

    -- Open the ref cursor with a select statement
    OPEN ref FOR
        SELECT 1 AS msg, 'Annotations transferred' AS msg_text, 
               array_agg("nIDid") AS "nIDid"
        FROM "RIssueDetail"
        WHERE "nIDid" IN (SELECT (jsonb_array_elements(parameter::jsonb)->>'nIDid')::uuid);

    RETURN ref;
END;
$function$
