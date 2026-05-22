CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_details(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
nIDid UUID;
BEGIN
nIDid := NULLIF(parameter ->> 'nIDid', '')::UUID;
OPEN ref FOR
SELECT
id."nIDid",
"cNote","cONote",
"bNote",
"nSessionid",
"nCaseid",
"cPageno",
"cLineno",
"jCordinates",
"nUserid",
string_agg(im."nIid"::TEXT, ',') AS "cIidStr"
FROM "RIssueDetail" id
LEFT JOIN "RIssueMapid" im ON id."nIDid" = im."nIDid"
WHERE id."nIDid" = CASE WHEN nIDid IS NULL OR nIDid = '00000000-0000-0000-0000-000000000000'::uuid THEN id."nIDid" ELSE nIDid END
GROUP BY id."nIDid";
RETURN ref;
END;
$function$
