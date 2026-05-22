CREATE OR REPLACE FUNCTION public.get_sorted_hierarchy_file(root_bundledetail_id bigint)
 RETURNS TABLE("nSerial" bigint, "nBundleid" integer, "nBundledetailid" integer, "cBundlename" text, "cTab" character varying)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH RECURSIVE bdl_tree AS (
        SELECT bm."nBundleid",bm."nBundledetailid", bm."cFilename"::text,
               (bm."cFilename"::text) AS sub_info,bm."cTab",bm.sorted_name
        FROM "BundleDetail" bm 
        WHERE bm."nBundleid" = root_bundledetail_id
		union all 
    SELECT  
        b."nParentBundleid" "nBundleid", 
		null "nBundledetailid",
        b."cBundlename" AS "cFilename", 
		(b."cBundlename"::text) AS sub_info,
        b."cBundletag",b.sorted_name
    FROM "BundleMaster" b where b."nParentBundleid" = root_bundledetail_id
       
    ),
    numbered_parts AS (
        SELECT *,
               sub_info AS full_path,
               string_to_array(sub_info, '/') AS path_parts,
               array_length(string_to_array(sub_info, '/'), 1) AS depth
        FROM bdl_tree
    ),
    expanded_parts AS (
        SELECT np.*,
               unnest(np.path_parts) AS path_part,
               generate_subscripts(np.path_parts, 1) AS idx
        FROM numbered_parts np
    ),
    parsed_parts AS (
        SELECT ep.*,
               (SELECT array_agg(
                   CASE 
                       WHEN part ~ '^[0-9.]+$' THEN  -- Check if the part is numeric
                           CASE 
                               WHEN strpos(part, '.') > 0 
                               THEN (COALESCE(NULLIF(split_part(part, '.', 1), ''), '0')::numeric * 1000) + 
                                    (COALESCE(NULLIF(right(part || '000000', 6), ''), '0')::numeric)
                               ELSE COALESCE(NULLIF(part, ''), '0')::numeric * 10000000
                           END
                       ELSE 0::numeric  -- Default to 0 for non-numeric parts
                   END
               )
                FROM unnest(string_to_array(regexp_replace(ep.path_part, '[^0-9.]+', ' ', 'g'), ' ')) AS part) AS numeric_parts
        FROM expanded_parts ep
    ),
    max_dimensions AS (
        SELECT MAX(array_length(numeric_parts, 1)) AS max_dim
        FROM parsed_parts
    ),
    padded_parts AS (
        SELECT pp.*,
               array_cat(
                   COALESCE(pp.numeric_parts, ARRAY[]::numeric[]),
                   array_fill(0::numeric, ARRAY[GREATEST(0, (SELECT max_dim FROM max_dimensions) - COALESCE(array_length(pp.numeric_parts, 1), 0))])
               ) AS padded_numeric_parts
        FROM parsed_parts pp
    ),
    sorted_parts AS (
        SELECT p."nBundleid",p."nBundledetailid", p."cFilename",p.sorted_name, sub_info, 
                p."cTab", full_path, path_parts, depth,
               array_agg(padded_numeric_parts ORDER BY idx) AS sorted_numbers
        FROM padded_parts p
        GROUP BY p."nBundleid", p."nBundledetailid", p."cFilename",p.sorted_name, sub_info, 
                 p."cTab", full_path, path_parts, depth
    ),final_result AS (
	  SELECT row_number() OVER(PARTITION BY sp."nBundleid" ORDER BY sp.sorted_name) nserial,sp."nBundleid",sp."nBundledetailid",sp."cFilename" "cFilename", 
            sp."cTab"
    FROM sorted_parts sp  -- where sp."nBundledetailid" is not null
	)
	select sp.nserial,sp."nBundleid",sp."nBundledetailid", sp."cFilename",sp."cTab" from final_result sp order by sp.nserial;--where sp."nBundledetailid" is not null;
/*
   SELECT  row_number() OVER(PARTITION BY sp."nBundleid" ORDER BY sp.sorted_numbers, sp."cFilename") nserial,sp."nBundleid",sp."nBundledetailid", sp."cFilename", 
            sp."cTab"
    FROM sorted_parts sp  -- where sp."nBundledetailid" is not null
    ORDER BY sp.sorted_numbers, sp."cFilename" ; */
-- select * from get_sorted_hierarchy_file(11751)
END;
$function$
