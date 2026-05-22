CREATE OR REPLACE FUNCTION public.et_get_issue_details_grouped(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    grouped_data JSON;nCaseid uuid;nSessionid uuid;nUserid uuid;
BEGIN
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
nUserid := NULLIF(parameter->>'nUserid','')::uuid;

--select * From ""RIssueMapid""

    SELECT
        array_to_json(array_agg(row_to_json(t)))
    INTO
        grouped_data
    FROM
        (
           WITH cte AS (
    SELECT "nIDid",  count(*) AS "TotalIssue"
    FROM "RIssueMapid"
    GROUP BY "nIDid"
)
SELECT
    rm."nIid",
    array_agg(
        json_build_object(
            'nIDid', rd."nIDid",
            'cNote', rd."cNote",
            'cONote', rd."cONote",
            'bNote', rd."bNote",
            'nPageno', rd."cPageno",
            'jCordinates', rd."jCordinates",
            'cColor', coalesce("cColor", ''),
            'TotalIssue', c."TotalIssue"
        )
    ) AS details
FROM
    "RIssueMapid" rm
    JOIN "RIssueDetail" rd ON rm."nIDid" = rd."nIDid"
    LEFT JOIN "RIssueMaster" rl ON rl."nIid" = rd."nLID"
    LEFT JOIN cte c ON rm."nIDid" = c."nIDid"
     where rd."nSessionid" = nSessionid and rd."nCaseid" = nCaseid and rd."nUserid" = nUserid
GROUP BY
    rm."nIid", c."TotalIssue"
        ) t;

    OPEN ref FOR
        SELECT
            grouped_data AS data;

    RETURN ref;
END;
$function$
