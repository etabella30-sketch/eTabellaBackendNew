CREATE OR REPLACE FUNCTION public.et_realtime_annotation_highlight_transfer(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
BEGIN

--select * From "RHighlights"

    -- Update the RIssueDetail table with the new values from the JSON array
    UPDATE "RHighlights" rd
    SET 
        "cTPageno" = (jdata->>'cTPageno')::int,
        "cTLineno" = (jdata->>'cTLineno')::int,
        "cTTime" = (jdata->>'cNewtimestamp')
    FROM (
        SELECT jsonb_array_elements(parameter::jsonb) AS jdata
    ) AS sub
    WHERE rd."nHid" = (sub.jdata->>'nIDid')::uuid;

    -- Open the ref cursor with a select statement
    OPEN ref FOR
        SELECT 1 AS msg, 'Annotations transferred' AS msg_text, 
               array_agg("nHid") AS "nHid"
        FROM "RHighlights"
        WHERE "nHid" IN (SELECT (jsonb_array_elements(parameter::jsonb)->>'nIDid')::uuid);

    RETURN ref;
END;
$function$
