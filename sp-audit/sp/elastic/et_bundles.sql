CREATE OR REPLACE FUNCTION elastic.et_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare
    nMasterid uuid;
    pageNumber int;
    offsetCount int;
    perPage int default 2000;
    nSectionid uuid;
    nBundleid uuid;
    isAdmin boolean default false;
    jElasticBundles jsonb;
    target_parent uuid;
BEGIN
    nMasterid := parameter->>'nMasterid';
    pageNumber := coalesce((parameter->>'pageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
    nBundleid := coalesce((parameter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000');
    nSectionid := parameter->>'nSectionid';
    jElasticBundles := parameter->>'jElasticBundles';
    target_parent := coalesce(nBundleid, '00000000-0000-0000-0000-000000000000'::uuid);

    SELECT "isAdmin" INTO isAdmin FROM "UserMaster" WHERE "nUserid" = nMasterid;

    OPEN ref1 FOR
    WITH RECURSIVE walk_up AS (
        -- Start from the input bundle IDs
        SELECT b."nBundleid",
               coalesce(b."nParentBundleid", '00000000-0000-0000-0000-000000000000'::uuid) AS "nParentBundleid",
               0 AS depth
        FROM public."BundleMaster" b
        WHERE b."nSectionid" = nSectionid
          AND b."nBundleid" IN (
              SELECT (value::uuid)
              FROM jsonb_array_elements_text(coalesce(jElasticBundles, '[]'::jsonb))
          )

        UNION ALL

        -- Walk up to parent
        SELECT p."nBundleid",
               coalesce(p."nParentBundleid", '00000000-0000-0000-0000-000000000000'::uuid) AS "nParentBundleid",
               w.depth + 1
        FROM public."BundleMaster" p
        JOIN walk_up w ON w."nParentBundleid" = p."nBundleid"
        WHERE p."nSectionid" = nSectionid
          -- Stop when we've reached the target parent level
          AND w."nParentBundleid" != target_parent
          -- Safety limit
          AND w.depth < 50
    )
    SELECT DISTINCT m."nBundleid", m."cBundlename", m."nParentBundleid", m."cBundletag",
           m.sorted_bundletag, m.sorted_name
    FROM walk_up w
    JOIN public."BundleMaster" m ON m."nBundleid" = w."nBundleid"
    LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = m."nBundleid"
    WHERE w."nParentBundleid" = target_parent
      AND m."nSectionid" = nSectionid
      AND (CASE WHEN isAdmin THEN TRUE
           ELSE coalesce(p."nBMPid", null) IS NOT DISTINCT FROM NULL
           END)
    ORDER BY m.sorted_bundletag, m.sorted_name;

    RETURN NEXT ref1;
END;
$function$
