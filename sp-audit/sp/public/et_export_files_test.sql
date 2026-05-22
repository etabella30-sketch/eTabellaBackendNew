CREATE OR REPLACE FUNCTION public.et_export_files_test(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
type text;

BEGIN
 -- select * from et_export_files ('{""jFiles"":""{555364,555365,555366}"",""jFolders"":""{}"",""nMasterid"":59}','r1');fetch all in ""r1"";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := NULLIF(parameter ->>'jFolders','')::uuid[];
jFiles := NULLIF(parameter ->>'jFiles','')::uuid[];
-- select * from "BundleMaster"
	drop table if exists temp_bundles;
	create temp table temp_bundles as 
	WITH RECURSIVE ChildHierarchy AS (
		SELECT b1."nBundleid"
		FROM "BundleMaster" b1
		WHERE b1."nBundleid" = any (jFolders)
		UNION ALL
		SELECT bm."nBundleid"
		FROM "BundleMaster" bm
		INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
	) select "nBundleid" from ChildHierarchy
	;
-- select * from "BDAssignment" limit 10
	drop table if exists temp_bundledetail;
	create temp table temp_bundledetail as
	select distinct bd."nBundledetailid",bd."cFilename",bd."cTab",bd."cPage",bd."cExhibitno", bd."sorted_tab", bd."cFiletype"
	From temp_bundles t	
	left join "BDAssignment" ba on ba."nBundleid" = t."nBundleid"
	join "BundleDetail" bd on (bd."nBundleid" = t."nBundleid" or ba."nBundleid" = bd."nBundleid") or bd."nBundledetailid" = any (jFiles)	
	order by bd."sorted_tab";

	if not exists (select * from "temp_bundles") then
		insert into temp_bundledetail("nBundledetailid","cFilename","cTab","cPage","cExhibitno","sorted_tab", "cFiletype")
		select distinct bd."nBundledetailid",bd."cFilename",bd."cTab",bd."cPage",bd."cExhibitno", bd."sorted_tab", bd."cFiletype"
		from "BundleDetail" bd where bd."nBundledetailid" = any(jFiles) order by bd."sorted_tab";
	end if;

open ref for select * from temp_bundledetail order by "sorted_tab";

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
