CREATE OR REPLACE FUNCTION public.dynamic_pivot(nblogid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    col_names text;col_names2 text;
    result jsonb;
    has_data boolean;
BEGIN

    -- Check if data exists
    SELECT EXISTS(SELECT 1 FROM filled_data WHERE "nBlogid" = nBlogid) INTO has_data;
    
    -- If no data, return empty jsonb
    IF NOT has_data THEN
        RETURN '[]'::jsonb;
    END IF;
	
    -- Generate the list of column names dynamically
    SELECT string_agg(quote_ident(column_name) || ' text', ', ') INTO col_names
    FROM (SELECT DISTINCT column_name FROM filled_data WHERE "nBlogid" = nBlogid) t;
    -- Generate the list of column names dynamically without data types
    SELECT string_agg(quote_ident(column_name), ', ') INTO col_names2
    FROM (SELECT DISTINCT column_name FROM filled_data WHERE "nBlogid" = nBlogid ) t;

	col_names := coalesce(col_names,'');
	col_names2 := coalesce(col_names2,'');
    -- Generate the dynamic pivot query and aggregate results as JSON
    EXECUTE format(
        'SELECT jsonb_agg(row_to_json(pivoted_data))
         FROM (
             SELECT "nBundledetailid", %s
             FROM crosstab(
                 ''SELECT "nBundledetailid", column_name, new_value
                   FROM filled_data
                   WHERE "nBlogid" = ''''%s''''::uuid
                   ORDER BY "nBundledetailid", column_name'',
                 ''SELECT DISTINCT column_name
                   FROM filled_data
                   WHERE "nBlogid" = ''''%s''''::uuid
                   ORDER BY column_name''
             ) AS ct("nBundledetailid" uuid, %s)
         ) AS pivoted_data;',
        col_names2, nBlogid, nBlogid, col_names
    ) INTO result;
    RETURN result;
END;
$function$
