CREATE OR REPLACE FUNCTION public.et_navigate_bundletabs(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nSectionid uuid;nBundleid uuid;bRecursive boolean;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
bRecursive := coalesce((parameter ->>'bRecursive')::boolean, false);
	-- select * from et_navigate_bundletabs ('{"nSectionid":"...","nBundleid":"...","nMasterid":"...","bRecursive":true}','r1');fetch all in "r1";

IF bRecursive THEN
-- Issue 048: tabs for the WHOLE subtree under nBundleid (parent bundles hold
-- only folders, so the direct-children query returns nothing there). Bundles
-- hidden by BMPermission are pruned per level, so a hidden folder's subtree
-- never leaks. Ordering: tree position (sorted_bundletag path — a parent's own
-- docs sort before its subfolders' docs) then the tab's natural sort key.
OPEN ref1 FOR
WITH RECURSIVE subtree AS (
  SELECT bm."nBundleid", coalesce(bm.sorted_bundletag, '{}') AS path,
         ARRAY[bm."nBundleid"] AS path_ids
  FROM "BundleMaster" bm
  WHERE bm."nBundleid" = nBundleid AND bm."nSectionid" = nSectionid
  UNION ALL
  SELECT c."nBundleid", s.path || coalesce(c.sorted_bundletag, '{}'),
         s.path_ids || c."nBundleid"
  FROM "BundleMaster" c
  JOIN subtree s ON c."nParentBundleid" = s."nBundleid"
  LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = c."nBundleid"
  WHERE p."nBMPid" IS NULL AND c."nSectionid" = nSectionid
)
SELECT b."cTab", b."nBundledetailid", b."cPage", b."nBundleid",
       bm."cBundletag", bm."cBundlename", s.path_ids AS "jPathIds"
FROM subtree s
JOIN "BundleDetail" b ON b."nBundleid" = s."nBundleid"
JOIN "BundleMaster" bm ON bm."nBundleid" = s."nBundleid"
LEFT JOIN "BMPermission" p ON p."nUserid" = nMasterid AND p."nBundleid" = b."nBundleid"
WHERE p."nBMPid" IS NULL AND b."nSectionid" = nSectionid AND coalesce(b."cTab", '') != ''
GROUP BY b."cTab", b."nBundledetailid", b."cPage", b."nBundleid",
         bm."cBundletag", bm."cBundlename", s.path, s.path_ids, b.sorted_tab
ORDER BY s.path, b.sorted_tab;

ELSE
OPEN ref1 FOR

select b."cTab",b."nBundledetailid","cPage" from "BundleDetail" b
left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
where p."nBMPid" is null  and b."nBundleid" = nBundleid and
  b."nSectionid" = nSectionid and coalesce("cTab",'') != ''
  group by b."cTab",b."nBundledetailid","cPage",sorted_tab
order by sorted_tab;

END IF;

RETURN NEXT ref1;

END;
$function$
