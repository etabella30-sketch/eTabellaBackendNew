CREATE OR REPLACE FUNCTION public.et_realtime_get_connectivitylogs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    pageNum INT;
    offsetVal INT;
    logDate DATE;
    searchString TEXT;
BEGIN
    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
    pageNum := (parameter ->> 'nPage')::INT;
    logDate := (parameter ->> 'dDate')::DATE;
    searchString := (parameter ->> 'cSearch')::TEXT; -- Extracting search string
  
    -- Calculate offset based on page number and search string presence
 /*   IF searchString IS NOT NULL THEN
        offsetVal := 0; -- Avoid offset if search string is provided
    ELSE
        offsetVal := (pageNum - 1) * 20;
    END IF;*/

    OPEN ref FOR
        SELECT *
        FROM "RTConnectivityLogs"
        WHERE "nUserid" = nUserid
          AND (logDate IS NULL OR DATE_TRUNC('day', "dDt") = logDate) -- Filter by date if provided
          AND (searchString IS NULL OR "cMsg" ILIKE '%' || searchString || '%') -- Filter by search string
        ORDER BY "dDt" DESC
        LIMIT 50 OFFSET (pageNum - 1) * 20;

    RETURN ref;
END;
$function$
