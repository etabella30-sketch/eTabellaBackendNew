CREATE OR REPLACE FUNCTION public.et_bundles_ids(parameter json, searchedbundles json)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid     UUID := (parameter->>'nMasterid')::UUID;
    nSectionid    UUID := (parameter->>'nSectionid')::UUID;
    nBundleid     UUID := COALESCE((parameter->>'nBundleid')::UUID, '00000000-0000-0000-0000-000000000000');
    jElasticBundles JSONB := searchedBundles::jsonb;
    bundleids     jsonb;
    target_parent UUID;
BEGIN
    target_parent := COALESCE(nBundleid, '00000000-0000-0000-0000-000000000000'::UUID);

    -- Walk UP from each searched bundle ID to find its ancestor
    -- at the target parent level (direct child of nBundleid/root)
    WITH RECURSIVE walk_up AS (
        -- Start from the searched bundle IDs
        SELECT b."nBundleid",
               COALESCE(b."nParentBundleid", '00000000-0000-0000-0000-000000000000'::UUID) AS "nParentBundleid",
               0 AS depth
        FROM public."BundleMaster" b
        WHERE b."nSectionid" = nSectionid
          AND b."nBundleid" IN (
              SELECT (value::UUID)
              FROM jsonb_array_elements_text(COALESCE(jElasticBundles, '[]'::jsonb))
          )

        UNION ALL

        -- Walk up to parent
        SELECT p."nBundleid",
               COALESCE(p."nParentBundleid", '00000000-0000-0000-0000-000000000000'::UUID) AS "nParentBundleid",
               w.depth + 1
        FROM public."BundleMaster" p
        JOIN walk_up w ON w."nParentBundleid" = p."nBundleid"
        WHERE p."nSectionid" = nSectionid
          -- Stop if we already found the target level (don't walk past it)
          AND w."nParentBundleid" != target_parent
          -- Safety limit to prevent infinite loops
          AND w.depth < 50
    )
    SELECT jsonb_agg(DISTINCT "nBundleid") INTO bundleids
    FROM walk_up
    WHERE "nParentBundleid" = target_parent;

    RETURN COALESCE(bundleids, '[]'::jsonb);
END;
$function$
