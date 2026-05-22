CREATE OR REPLACE FUNCTION public.et_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 2000;nSectionid uuid;nBundleid uuid;
isAdmin boolean default false;
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := coalesce((parameter ->>'nBundleid')::uuid, null);
nSectionid := (parameter ->>'nSectionid')::uuid;
/*
 explain analyze
 select * from et_bundles('{"nMasterid":2,"pageNumber":1,"nSectionid":92}','r1');FETCH All in "r1"; 
 
  select * from et_bundles('{"nSectionid":9266,"nBundleid":7046,"nMasterid":10}','r1');FETCH All in "r1";
 
 select * from "BundleMaster" where "nSectionid" = 92 and "nParentBundleid" = 0
 
 
 select * From "BMPermission"
*/
	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
	
OPEN ref1 FOR
with bundle as (
  select ROW_NUMBER() OVER(
    ORDER BY split_hierarchical_sort_multi(b."cBundletag",  ARRAY['.', '-']),
             split_hierarchical_sort_multi(b."cBundlename", ARRAY['.', '-'])
  ) serial,
  b."nBundleid",
  coalesce(b."nParentBundleid", null) "nParentBundleid",
  b."cBundlename",
  b."cBundletag",
  b."nFileCount",
  b."nFileCountDescendant",
  b."nHierarchyDepth",
  EXISTS (
    SELECT 1 FROM "BundleMaster" c WHERE c."nParentBundleid" = b."nBundleid"
  ) AS "bHasChildren"
  from "BundleMaster" b
  left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
  where case when isAdmin then true else p."nBMPid" is null end
    and b."nSectionid" = nSectionid
    and case when nBundleid is not null then b."nParentBundleid" = nBundleid
             else b."nParentBundleid" is null end
) select * from bundle
/* 
		ORDER BY left("cBundlename"::text, 1),substring("cBundlename", '\D+'),substring("cBundlename", '\d+')::bigint
			,CAST(NULLIF(SPLIT_PART(SUBSTRING("cBundlename"::text FROM '[0-9\.]+'), '.', 3),'') AS bigint) NULLS FIRST
			,CAST(NULLIF(SPLIT_PART(SUBSTRING("cBundlename"::text FROM '[0-9\.]+'), '.', 4),'') AS bigint) NULLS FIRST
			,CAST(NULLIF(SPLIT_PART(SUBSTRING("cBundlename"::text FROM '[0-9\.]+'), '.', 5),'') AS bigint) NULLS FIRST
			,CAST(NULLIF(SPLIT_PART(SUBSTRING("cBundlename"::text FROM '[0-9\.]+'), '.', 6),'') AS bigint) NULLS FIRST
			--,"cBundlename" 
*/
order by serial
LIMIT perPage
OFFSET offsetCount
;
RETURN NEXT ref1;
    
END;
$function$
