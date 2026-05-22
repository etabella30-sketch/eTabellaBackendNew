CREATE OR REPLACE FUNCTION public.get_sorted_hierarchy_bundle(root_folder_id uuid)
 RETURNS TABLE("nSerial" bigint, "nBundleid" uuid, "cBundlename" text, "nParentBundleid" uuid, "cBundletag" character varying, level integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
        SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
               (bm."cBundlename"::text) AS sub_info, bm."nSectionid", bm."cBundletag", 1 as level
        FROM "BundleMaster" bm
        WHERE bm."nBundleid" = root_folder_id
        UNION ALL
        -- Recursive selection for child folders
        SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
               p.sub_info || '/' || (c."cBundlename"::text), c."nSectionid", c."cBundletag", p.level + 1
        FROM "BundleMaster" c
        JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
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
                               THEN (COALESCE(NULLIF(split_part(part, '.', 1), ''), '0')::numeric * 1000000000) + 
                                    (COALESCE(NULLIF(right(part || '000000000', 9), ''), '0')::numeric)
                               ELSE COALESCE(NULLIF(part, ''), '0')::numeric * 1000000000
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
        SELECT p."nBundleid", p."cBundlename", p."nParentBundleid", sub_info, 
               p."nSectionid", p."cBundletag", p.level, full_path, path_parts, depth,
               array_agg(padded_numeric_parts ORDER BY idx) AS sorted_numbers
        FROM padded_parts p
        GROUP BY p."nBundleid", p."cBundlename", p."nParentBundleid", sub_info, 
                 p."nSectionid", p."cBundletag", p.level, full_path, path_parts, depth
    )
	,
final_result AS (
    SELECT 
        sp."nBundleid", 
        sp."cBundlename", 
        sp."nParentBundleid",
        sp."cBundletag", 
        sp.level::int,
		null "nBundledetailid"
    FROM sorted_parts sp

    UNION ALL

    SELECT 
        sp."nBundleid", 
        bd."cFilename" AS "cBundlename", 
        sp."nBundleid" "nParentBundleid",
        sp."cBundletag", 
        1 + sp.level::int ,
		bd."nBundledetailid"
    FROM sorted_parts sp
    JOIN "BundleDetail" bd ON bd."nBundleid" = sp."nBundleid"
), result as(SELECT row_number() OVER (PARTITION BY r."nParentBundleid" ORDER BY r.level,
                          SUBSTRING(r."cBundlename", '\D+'),SUBSTRING(r."cBundlename", '\d+'),
						  COALESCE(CAST(NULLIF(SPLIT_PART(SUBSTRING(r."cBundlename" FROM '[0-9\.]+'), '.', 2), '') AS numeric), 0),
						  COALESCE(CAST(NULLIF(SPLIT_PART(SUBSTRING(r."cBundlename" FROM '[0-9\.]+'), '.', 3), '') AS numeric), 0)) AS nserial,r."nBundleid",r."cBundlename",r."nParentBundleid",r."cBundletag",r.level,r."nBundledetailid"
FROM final_result r
ORDER BY nserial ) select r.nserial,r."nBundleid",r."cBundlename",r."nParentBundleid",r."cBundletag",r.level from result r where r."nBundledetailid" is null order by r.level,r.nserial;
/*    SELECT  row_number() OVER( PARTITION BY sp."nParentBundleid" ORDER BY sp.sorted_numbers, sp."cBundlename") nserial,sp."nBundleid", sp."cBundlename", sp."nParentBundleid",
            sp."cBundletag", sp.level::int
    FROM sorted_parts sp
    ORDER BY sp.sorted_numbers, sp."cBundlename"; */
END;
$function$
