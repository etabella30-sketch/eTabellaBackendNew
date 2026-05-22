CREATE OR REPLACE FUNCTION public.et_export_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    jFolders uuid[];
    jFiles   uuid[];
BEGIN
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    jFolders  := NULLIF(parameter ->> 'jFolders','')::uuid[];
    jFiles    := NULLIF(parameter ->> 'jFiles','')::uuid[];

   
    -- Recursive CTE directly
    OPEN ref FOR WITH RECURSIVE ChildHierarchy AS (
        SELECT b1."nBundleid"
        FROM "BundleMaster" b1
        WHERE b1."nBundleid" = ANY (jFolders)
        UNION ALL
        SELECT bm."nBundleid"
        FROM "BundleMaster" bm
        JOIN ChildHierarchy ch 
          ON bm."nParentBundleid" = ch."nBundleid"
    ),
    BundleDetails AS (
        SELECT bd."nBundledetailid", bd."cFilename", bd."cTab", bd."cPage",
               bd."cExhibitno", bd."sorted_tab", bd."cFiletype"
        FROM "BundleDetail" bd
        WHERE bd."nBundledetailid" = ANY (jFiles)

        UNION

        SELECT bd."nBundledetailid", bd."cFilename", bd."cTab", bd."cPage",
               bd."cExhibitno", bd."sorted_tab", bd."cFiletype"
        FROM "BundleDetail" bd
        JOIN ChildHierarchy ch ON bd."nBundleid" = ch."nBundleid"

        UNION

        SELECT bd."nBundledetailid", bd."cFilename", bd."cTab", bd."cPage",
               bd."cExhibitno", bd."sorted_tab", bd."cFiletype"
        FROM "BundleDetail" bd
        JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid"
        JOIN ChildHierarchy ch ON ba."nBundleid" = ch."nBundleid"
    )
    SELECT DISTINCT *
    FROM BundleDetails
    ORDER BY "sorted_tab";
    RETURN ref;
END;
$function$
