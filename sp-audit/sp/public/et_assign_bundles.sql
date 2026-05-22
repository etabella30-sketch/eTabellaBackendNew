CREATE OR REPLACE FUNCTION public.et_assign_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
type text;nBundleid uuid;nSectionid uuid;inserted_ids uuid[];row RECORD;inserted_bids uuid[];
nowDt timestamp := now();
BEGIN
 -- select * from et_copy_bundles('{""nMasterid"":59,""jFolders"":""{}"",""jFiles"":""{328446}"",""nSectionid"":94,""nBundleid"":1342510,""type"":""Copy""}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nBundleid := parameter ->>'nBundleid';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
type := parameter ->>'type';

/*
select * from public.et_assign_bundles ('{"jFolders":"{02a9865d-c796-4942-8299-ac540b80aa14}","jFiles":"{}","nSectionid":"40199979-83f5-451f-934f-447eb2ad4b97","nBundleid":null,"nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1');fetch all in "r1";

    SELECT tb."nBundleid", bm."nBundleid"
    FROM temp_bundles tb
    JOIN "BundleMaster" bm ON bm."cBundlename" = (SELECT i."cBundlename" FROM "BundleMaster" i WHERE i."nBundleid" = tb."nBundleid" and i."nParentBundleid" = tb."nParentBundleid" 
	and i."nSectionid" = '613bfeae-c77c-482e-bfc7-7cc6e5923a1d'
	)
    WHERE bm."nSectionid" = '613bfeae-c77c-482e-bfc7-7cc6e5923a1d';
SELECT  * FROM "BundleMaster" i WHERE i."nBundleid" = '9ad327fb-fba6-4616-b445-776e53079973'
-- select * from public.et_assign_bundles ('{"jFolders":"{9ad327fb-fba6-4616-b445-776e53079973}","jFiles":"{}","nSectionid":"613bfeae-c77c-482e-bfc7-7cc6e5923a1d","nBundleid":null,"nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699"}','r1');fetch all in "r1";

-- select * from temp_bundles
-- select * from temp_id_mapping
-- select * from temp_bundledetail

*/

if not exists (select * from "SectionMaster" where "nSectionid" = nSectionid and "cFoldertype" in ('CB','CO') )then

open ref for select  -1 as msg,'You can not assign to this Bundle' as value;

else

drop table if exists temp_bundles;
create temp table temp_bundles as 
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid",nBundleid "nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid" = any (jFolders)
    UNION ALL
    SELECT bm."nBundleid",bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
) select "nBundleid","nParentBundleid" from ChildHierarchy
;
-- select * from "SectionMaster" where "nCaseid" = 22
-- select * from "BundleMaster" where "nSectionid" = 92 and "nBundleid" =1342476
-- select * from "BundleMaster" where "nSectionid" = 92 and "nBundleid" =1342475
-- select * from "BundleMaster" where "nSectionid" = 92 and "nBundleid" =1342475
-- select * from "BundleDetail" where "nSectionid" = 94
-- select * from "BDAttributes" limit 20 where "nBundledetailid" = 528459
-- select * from "BundleDetail" where "nSectionid" = 92 order by 1 desc
-- select * from "BundleMaster" where "nSectionid" = 92 order by 1 desc
-- select now()

drop table if exists temp_bundledetail;
create temp table temp_bundledetail as
select distinct bd."nBundledetailid",bd."cPath"
From temp_bundles t
join "BundleDetail" bd on bd."nBundleid" = t."nBundleid" or bd."nBundledetailid" = any (jFiles);

if not exists (select * from "temp_bundles") then
	insert into temp_bundledetail("nBundledetailid","cPath")
	select distinct bd."nBundledetailid",bd."cPath"
	from "BundleDetail" bd where bd."nBundledetailid" = any (jFiles);
end if;

-- select * from et_copy_bundles ('{""jFolders"":""{1342451}"",""jFiles"":""{}"",""type"":""Copy"",""nSectionid"":92,""nBundleid"":1342475,""nMasterid"":59}','r1');fetch all in ""r1"";

 	DROP TABLE IF EXISTS temp_id_mapping;
    CREATE TEMP TABLE temp_id_mapping (old_id uuid, new_id uuid);

-- select * from "SectionMaster" where "nCaseid" = '134523e3-00e0-410d-bbf5-ea9f7137288f'
    -- Insert root bundles
-- select * from "BundleMaster" bm join temp_id_mapping b on b.new_id = "nBundleid" and "nSectionid" = '79d6f60e-83fe-4446-abf1-6917c8343865' order by sorted_bundletag
	
	
  	INSERT INTO temp_id_mapping (old_id, new_id)
    SELECT tb."nBundleid", bm."nBundleid"
    FROM temp_bundles tb
    JOIN "BundleMaster" bm ON bm."cBundlename" = (
		SELECT i."cBundlename" FROM "BundleMaster" i WHERE i."nBundleid" = tb."nBundleid" and coalesce(i."nParentBundleid",'00000000-0000-0000-0000-000000000000') = coalesce(tb."nParentBundleid",'00000000-0000-0000-0000-000000000000') 
		and i."nSectionid" = nSectionid
	)
    WHERE bm."nSectionid" = nSectionid;

	WITH new_records AS (
    SELECT distinct
        nSectionid "nSectionid",
        bm."cBundlename",
        tb."nParentBundleid",
        bm."cBundletag",
        nowDt AS "dCreateDt",
        tb."nBundleid" AS old_id  -- Capture old_id here from the joined table
    FROM "BundleMaster" bm
    JOIN temp_bundles tb ON tb."nBundleid" = bm."nBundleid"
		WHERE  NOT EXISTS (
            SELECT 1 FROM "BundleMaster" b
            WHERE b."cBundlename" = bm."cBundlename" and coalesce(b."nParentBundleid",'00000000-0000-0000-0000-000000000000') = coalesce(tb."nParentBundleid",'00000000-0000-0000-0000-000000000000')
            AND b."nSectionid" = nSectionid  
        )
),
inserted AS (
    INSERT INTO "BundleMaster" ("nSectionid", "cBundlename", "nParentBundleid", "cBundletag", "dCreateDt", "nCreateId")
    SELECT distinct "nSectionid", "cBundlename", "nParentBundleid", "cBundletag", "dCreateDt", nMasterid
    FROM new_records
    RETURNING "nBundleid" AS new_id, "nSectionid", "cBundlename", "nParentBundleid", "cBundletag", "dCreateDt", "nCreateId" -- Return all details to match later
)
-- Now, join the inserted results back to new_records to get the old_id
INSERT INTO temp_id_mapping (old_id, new_id)
SELECT nr.old_id, i.new_id
FROM inserted i
JOIN new_records nr ON i."nSectionid" = nr."nSectionid" AND i."cBundlename" = nr."cBundlename" AND 
coalesce(i."nParentBundleid",'00000000-0000-0000-0000-000000000000') = coalesce(nr."nParentBundleid",'00000000-0000-0000-0000-000000000000')
 AND i."dCreateDt" = nr."dCreateDt" AND i."nCreateId" = nMasterid;

	raise notice 'nowDt %',nowDt;
	
	 update "BundleMaster" b set "nParentBundleid" = new_id from temp_id_mapping where b."nParentBundleid" = old_id and  "dCreateDt" = nowDt and 
	 coalesce(old_id,'00000000-0000-0000-0000-000000000000') != coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') and b."nSectionid" = nSectionid;
	 	
-- select * from "BDAssignment"
			  insert into "BDAssignment" ("nBundleid","nSectionid","nBundledetailid","cPage","nUserid")
			select distinct coalesce(im.new_id,nBundleid),nSectionid,bd."nBundledetailid","cPage",nMasterid from temp_bundledetail t
			join "BundleDetail" bd on t."nBundledetailid" = bd."nBundledetailid"
		 	left join temp_id_mapping im on im.old_id = bd."nBundleid"
			  WHERE NOT EXISTS (
            SELECT 1 FROM "BundleDetail"
            WHERE "cFilename" = bd."cFilename" and "nBundleid" = coalesce(im.new_id,nBundleid)
            AND "nSectionid" = nSectionid
        );
	
	
	-- select * from temp_id_mapping
  -- DROP TABLE temp_id_mapping;
  
-- DROP TABLE IF EXISTS temp_id_mapping;
-- drop table if exists temp_bundledetail;
-- drop table if exists temp_bundles;
open ref for select 1 as msg,'Assinged' as value;

end if;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
