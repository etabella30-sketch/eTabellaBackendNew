CREATE OR REPLACE FUNCTION public.fun_childers_bundles(bundleid uuid)
 RETURNS TABLE("nBundleid" uuid)
 LANGUAGE plpgsql
AS $function$
    BEGIN
	
-- select * from fun_childers_bundles(1)
-- select * from "PermissionModule"
-- roleid
 RETURN QUERY
  
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid", b1."cBundlename", b1."nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid" = bundleid
    UNION ALL
    SELECT bm."nBundleid", bm."cBundlename", bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
)
SELECT c."nBundleid"
FROM ChildHierarchy c;
  
    END;
$function$
