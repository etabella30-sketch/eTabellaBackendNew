CREATE OR REPLACE FUNCTION public.et_batchfile_log_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nBlogid uuid;
    cColumn TEXT;
    columnValues TEXT[];
    dynamicColumns TEXT;
BEGIN
    nBlogid := (parameter ->>'nBlogid')::uuid;
    SELECT "cColumn" INTO cColumn FROM "Batchlog" WHERE "nBlogid" = nBlogid;
    columnValues := ARRAY(SELECT jsonb_array_elements_text(('['|| cColumn ||']')::jsonb));
	
-- select * from et_batchfile_log_detail('{"nBlogid":18}','r');fetch all in "r"

    WITH RECURSIVE split(columnName, columnIndex) AS (
        SELECT columnValues[1], 1
        UNION ALL
        SELECT columnValues[columnIndex + 1], columnIndex + 1
        FROM split
        WHERE columnIndex < array_length(columnValues, 1)
    )
    SELECT
        STRING_AGG(
            CASE
                WHEN columnName LIKE '%""%' THEN 'CONCAT(''"'', "' || columnName || '", ''"'')'
                ELSE '"' || columnName || '"'
            END,
            ', '
        ) INTO dynamicColumns
    FROM split;

    OPEN ref FOR
        SELECT
            "nBlogid",
            "nBundledetailid",
            ARRAY_TO_STRING(ARRAY_AGG(DISTINCT CASE WHEN "isChange" THEN "column_name" END), ',') AS "changecol",
            dt.dynamicColumns
        FROM
            "BatchlogDetail"
        CROSS JOIN LATERAL (
            VALUES (dynamicColumns)
        ) AS dt(dynamicColumns)
        WHERE
            "nBlogid" = nBlogid
        GROUP BY
            "nBlogid",
            "nBundledetailid",
            dt.dynamicColumns;

    RETURN ref; -- Return the cursor to the caller
END;
$function$
