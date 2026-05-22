CREATE OR REPLACE FUNCTION task.et_task_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    nTid uuid;
    nPageno INT;
    nBatchsize INT;
    nOffset INT;
BEGIN
    -- Extract values from JSON parameter
    nTid := NULLIF(parameter ->>'nTid','')::uuid;
    nPageno := (parameter ->>'nPageno')::INTEGER;
    nBatchsize := (parameter ->>'nBatchsize')::INTEGER;

    -- Calculate OFFSET for pagination
    nOffset := (nPageno - 1) * nBatchsize;

/*
SELECT * FROM task.et_task_detail('{"nTid": 32, "nPageno": 1, "nBatchsize": 10}', 'r1');
FETCH ALL IN "r1";
 */
-- select * from task."PaginationMaster" order by 1 desc
-- select * from task."TaskDetail"
    -- Open cursor with pagination logic
    OPEN ref FOR 
    SELECT 
        b."nBundledetailid" AS id,
        b."nBundledetailid",
        b."cFilename",
        b."cPath",
		h."nStart",b."cTab",h."version"
    FROM task."TaskDetail" h
    JOIN "BundleDetail" b ON b."nBundledetailid" = h."nBDid"
    WHERE h."nTid" = nTid
    ORDER BY b."nBundledetailid"  -- Order by a column for consistent pagination
    LIMIT nBatchsize OFFSET nOffset;  -- Apply pagination

    RETURN ref; -- Return the cursor
END;
$function$
