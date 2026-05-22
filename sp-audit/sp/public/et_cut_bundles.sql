CREATE OR REPLACE FUNCTION public.et_cut_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
type text;nBundleid uuid;nSectionid uuid;inserted_ids uuid[];

BEGIN
 -- select * from et_cut_bundles('{""jFolders"": ""{1342578,1342579}"", ""jFiles"": ""{}"", ""type"": ""Cut"", ""nSectionid"": 32, ""nBundleid"": 0 }','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nBundleid:= NULLIF(parameter ->>'nBundleid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
type:= parameter ->>'type';

drop table if exists temp_bundles;
create temp table temp_bundles as 
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid", b1."nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid" = any (jFolders)  -- and  b1."nBundleid" != (nBundleid)
) select "nBundleid" from ChildHierarchy
;
-- select * from "SectionMaster" where "nCaseid" = 22
-- select * from "BundleMaster" where "nSectionid" = 94
-- select * from "BundleDetail" where "nSectionid" = 94
-- select * from "BDAttributes" limit 20 where "nBundledetailid" = 528459
-- select * from "BundleDetail" where "nSectionid" = 92 order by 1 desc
drop table if exists temp_bundledetail;
create temp table temp_bundledetail as
	select distinct bd."nBundledetailid",bd."cPath"
	from "BundleDetail" bd where bd."nBundledetailid" = any (jFiles);

	 update "BundleMaster" b set "nParentBundleid" = nBundleid,"nSectionid" = nSectionid from temp_bundles t where b."nBundleid" = t."nBundleid";

	 update "BundleDetail" b set "nBundleid" = nBundleid,"nSectionid" = nSectionid from temp_bundledetail t where b."nBundledetailid" = t."nBundledetailid";
 	

open ref for select 1 as msg,'Paste' as value

;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
