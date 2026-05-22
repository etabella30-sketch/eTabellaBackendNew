CREATE OR REPLACE FUNCTION public.et_batchfile_log_detail(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nBlogid UUID;
    cColumn TEXT;
    columnValues TEXT[];
    dynamicColumns TEXT;
BEGIN
    nBlogid := NULLIF(parameter ->>'nBlogid','')::UUID;
    SELECT "cColumn" INTO cColumn FROM "Batchlog" WHERE "nBlogid" = nBlogid;
    columnValues := ARRAY(SELECT jsonb_array_elements_text(('['|| cColumn ||']')::jsonb));
	
	open ref1 for select cColumn;
	RETURN next ref1;
-- select * from et_batchfile_log_detail('{"nBlogid":"uuid-value"}','r','r1','r2');fetch all in "r2"
open ref2 for
WITH cte AS ( 
	SELECT "nBlogid", "nBundledetailid", "column_name", "new_value",
	( '{"' || ("column_name" || '":"' || coalesce("new_value",'') ) || '"}') AS columns, "isChange"
    FROM "BatchlogDetail" WHERE "nBlogid" = nBlogid
)
SELECT "nBlogid", "nBundledetailid", "changecol" 
FROM (
        SELECT "nBlogid", "nBundledetailid",  ARRAY_TO_STRING(ARRAY_AGG(DISTINCT CASE WHEN "isChange" THEN "column_name" END), ',') AS "changecol"
        FROM cte GROUP BY "nBlogid", "nBundledetailid"
    ) subquery;

    RETURN next ref2; -- Return the cursor to the caller
	
	open ref3 for 
		select * from dynamic_pivot(nBlogid) ;
	
	RETURN next ref3; -- Return the cursor to the caller
END;
$function$
