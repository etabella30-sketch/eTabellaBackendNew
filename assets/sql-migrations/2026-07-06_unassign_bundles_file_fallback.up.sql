-- Reinstall the canonical public.et_unassign_bundles (from sp-audit/sp/public).
-- WHY: single-file unassign from a Private Bundle folder silently no-ops on
-- deployments running an older SP without the file-only fallback branch
-- (temp_bundledetail stays empty when jFolders is empty, the BDAssignment
-- delete matches nothing, yet the SP still returns msg=1 'Unassinged').
-- The canonical body below was verified on a scratch Postgres 17:
--   assign file -> BDAssignment row created; unassign file -> row deleted.
-- Idempotent: CREATE OR REPLACE.
BEGIN;
CREATE OR REPLACE FUNCTION public.et_unassign_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
type text;nBundleid uuid;nSectionid uuid;inserted_ids uuid[];row RECORD;inserted_bids uuid[];
-- select * from et_unassign_bundles ('{"jFolders":"{}","jFiles":"{528593-uuid-format}","nSectionid":"865-uuid-format","nBundleid":"1346051-uuid-format","nMasterid":"59-uuid-format"}','r1');fetch all in "r1";
BEGIN
 -- select * from et_copy_bundles('{"nMasterid":"59-uuid-format","jFolders":"{}","jFiles":"{328446-uuid-format}","nSectionid":"94-uuid-format","nBundleid":"1342510-uuid-format","type":"Copy"}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nBundleid := parameter ->>'nBundleid';
nSectionid := parameter ->>'nSectionid';
type := parameter ->>'type';
drop table if exists temp_bundles;
create temp table temp_bundles as 
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid",COALESCE(nBundleid, '00000000-0000-0000-0000-000000000000'::uuid) "nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid"  = any (jFolders) and b1."nSectionid" = nSectionid
    UNION ALL
    SELECT bm."nBundleid",bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
) select "nBundleid","nParentBundleid" from ChildHierarchy
;

drop table if exists temp_bundledetail;
create temp table temp_bundledetail as
select distinct  bd."nBundledetailid",bd."cPath"
From temp_bundles t
join "BundleDetail" bd on bd."nBundleid" = t."nBundleid" or bd."nBundledetailid" = any (jFiles);
if not exists (select * from "temp_bundles") then
	insert into temp_bundledetail("nBundledetailid","cPath")
	select distinct  bd."nBundledetailid",bd."cPath"
	from "BundleDetail" bd where bd."nBundledetailid" = any (jFiles);
end if;
-- select * from et_copy_bundles ('{"jFolders":"{1342451-uuid-format}","jFiles":"{}","type":"Copy","nSectionid":"92-uuid-format","nBundleid":"1342475-uuid-format","nMasterid":"59-uuid-format"}','r1');fetch all in "r1";
 	DROP TABLE IF EXISTS temp_id_mapping;
    CREATE TEMP TABLE temp_id_mapping ( old_id UUID, new_id UUID );
-- select * from "BundleMaster"
    -- Insert root bundles
    delete from "BundleMaster" where "nSectionid" = nSectionid and "nBundleid" in (SELECT "nBundleid" FROM temp_bundles);
	 	
-- select * from "BDAssignment" where "nBundledetailid" = 528593
		delete from "BDAssignment" where "nBundledetailid" in (select "nBundledetailid" from temp_bundledetail) and CASE WHEN COALESCE(nBundleid, '00000000-0000-0000-0000-000000000000'::uuid) != '00000000-0000-0000-0000-000000000000'::uuid THEN "nBundleid" = nBundleid ELSE true END AND "nSectionid" = nSectionid;
	
	delete from "BDAssignment" where "nBundleid" in (select "nBundleid" from temp_bundles) AND "nSectionid" = nSectionid;
	
	
	-- select * from temp_id_mapping
  DROP TABLE if exists temp_id_mapping;
  DROP TABLE if exists temp_bundles;
  DROP TABLE if exists temp_bundledetail;
open ref for select 1 as msg,'Unassinged' as value,nBundleid
;
 
-- select * from et_copy_bundles ('{"jFolders":"{1687147-uuid-format}","jFiles":"{}","type":"Copy","nSectionid":"808-uuid-format","nBundleid":"1687148-uuid-format","nMasterid":"59-uuid-format"}','r1');fetch all in "r1";
 
 
RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
;
COMMIT;
