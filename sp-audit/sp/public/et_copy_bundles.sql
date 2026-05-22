CREATE OR REPLACE FUNCTION public.et_copy_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
type text;nBundleid uuid;nSectionid uuid;inserted_ids uuid[];row RECORD;inserted_bids uuid[];

bundle_count int;maxbatchid int;jCopyFiles jsonb;

	-- select * from public.et_copy_bundles ('{""jFolders"":""{}"",""jFiles"":""{169622,169626}"",""type"":""Copy"",""nSectionid"":8850,""nBundleid"":9672,""nMasterid"":367}','r1');fetch all in ""r1"";
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nBundleid:= NULLIF(parameter ->>'nBundleid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
type:= parameter ->>'type';

drop table if exists temp_bundles;
create temp table temp_bundles as 
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid",coalesce(nBundleid,'00000000-0000-0000-0000-000000000000'::uuid) "nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid" = any (jFolders) and ("nParentBundleid" IS NULL OR "nParentBundleid" != any(jFolders))
    UNION ALL
    SELECT bm."nBundleid",bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
) select "nBundleid","nParentBundleid" from ChildHierarchy
;
-- select now()
drop table if exists temp_bundledetail;
create temp table temp_bundledetail as
select distinct bd."nBundledetailid",bd."cPath"
From temp_bundles t
join "BundleDetail" bd on bd."nBundleid" = t."nBundleid" or bd."nBundledetailid" = any (jFiles);

-- select * from public.et_copy_bundles ('{""jFolders"":""{9483}"",""jFiles"":""{}"",""type"":""Copy"",""nSectionid"":8850,""nBundleid"":9461,""nMasterid"":367}','r1');fetch all in ""r1"";

	

if not exists (select * from temp_bundles) then
	insert into temp_bundledetail("nBundledetailid","cPath")
	select distinct bd."nBundledetailid",bd."cPath"
	from "BundleDetail" bd where bd."nBundledetailid" = any (jFiles);
end if;

 	DROP TABLE IF EXISTS temp_id_mapping;
    CREATE TEMP TABLE temp_id_mapping (old_id uuid, new_id uuid);
	
-- select * from "BundleMaster"
    -- Insert root bundles
	
	
   INSERT INTO temp_id_mapping (old_id, new_id)
    SELECT tb."nBundleid", bm."nBundleid"
    FROM temp_bundles tb
    JOIN "BundleMaster" bm ON bm."cBundlename" = (SELECT "cBundlename" FROM "BundleMaster" WHERE "nBundleid" = tb."nBundleid")
    WHERE bm."nSectionid" = nSectionid;

   -- SELECT COUNT(*) INTO bundle_count FROM temp_id_mapping;	
   -- RAISE NOTICE 'The count of rows in temp_bundles is: %', bundle_count;

	WITH new_records AS (
    SELECT
        nSectionid "nSectionid",
        bm."cBundlename",
       tb."nParentBundleid",
        bm."cBundletag",
        NOW() AS "dCreateDt",
        tb."nBundleid" AS old_id  -- Capture old_id here from the joined table
    FROM "BundleMaster" bm
    JOIN temp_bundles tb ON tb."nBundleid" = bm."nBundleid"
		WHERE NOT EXISTS (
            SELECT 1 FROM "BundleMaster"
            WHERE "cBundlename" = bm."cBundlename"
            AND "nSectionid" = nSectionid and "nParentBundleid" = tb."nParentBundleid"
        )
),
inserted AS (
    INSERT INTO "BundleMaster" ("nSectionid", "cBundlename", "nParentBundleid", "cBundletag", "dCreateDt", "nCreateId")
    SELECT "nSectionid", "cBundlename", "nParentBundleid", "cBundletag", "dCreateDt", nMasterid
    FROM new_records
    RETURNING "nBundleid" AS new_id, "nSectionid", "cBundlename", "nParentBundleid", "cBundletag", "dCreateDt", "nCreateId" -- Return all details to match later
)
-- Now, join the inserted results back to new_records to get the old_id
	INSERT INTO temp_id_mapping (old_id, new_id)
	SELECT nr.old_id, i.new_id
	FROM inserted i
	JOIN new_records nr ON i."nSectionid" = nr."nSectionid" AND i."cBundlename" = nr."cBundlename" AND i."nParentBundleid" = nr."nParentBundleid" AND i."dCreateDt" = nr."dCreateDt" AND i."nCreateId" = nMasterid;

	
	 update "BundleMaster" b set "nParentBundleid" = new_id from temp_id_mapping where b."nParentBundleid" = old_id and "dCreateDt" = now() and old_id != COALESCE(nBundleid,'00000000-0000-0000-0000-000000000000'::uuid);

		 select max(coalesce("nBatchid",0)) +1 into maxbatchid from "CopyFileLog";
		 
	insert into "CopyFileLog" ("nBundleid","nBDid","cPath","cNewPath","dCreateDt","nBatchid")
	select coalesce(im.new_id,nBundleid),t."nBundledetailid",t."cPath",replace(t."cPath",'.', '_' || t."nBundledetailid" || '.' ),now(),maxbatchid from temp_bundledetail t
			join "BundleDetail" bd on t."nBundledetailid" = bd."nBundledetailid"
		 	left join temp_id_mapping im on im.old_id = bd."nBundleid"
		   WHERE NOT EXISTS (
            SELECT 1 FROM "BundleDetail"
            WHERE "cFilename" = bd."cFilename" and "nBundleid" = coalesce(im.new_id,nBundleid)
            AND "nSectionid" = nSectionid
		);

	 WITH inserted AS (
			  insert into "BundleDetail" ("nBundleid","nSectionid","cFilename","cPath","dCreateDt","nCreateId","cStatus","cPage","cFilesize","cFiletype","dIntrestDt","cDesc")
			select t."nBundleid",nSectionid,"cFilename",t."cNewPath",now(),nMasterid,"cStatus","cPage","cFilesize","cFiletype","dIntrestDt","cDesc" from "CopyFileLog" t
			join "BundleDetail" bd on t."nBDid" = bd."nBundledetailid"
			where t."nBatchid" = maxbatchid        
 		RETURNING "nBundledetailid","cPath"  -- Assuming 'id' is the name of the auto-incrementing primary key
     )
	 UPDATE "CopyFileLog" cfl
SET "nBDnewid" = inserted."nBundledetailid"
FROM inserted
WHERE cfl."cNewPath" = inserted."cPath"
AND cfl."nBatchid" = maxbatchid;
     -- SELECT array_agg("nBundledetailid") INTO inserted_ids FROM inserted;
	
	select array_agg("nBDnewid") into inserted_ids from "CopyFileLog" where "nBatchid" = maxbatchid;
	
	insert into "BDAttributes" ("nBundledetailid","cDescription")
    SELECT "nBundledetailid","cDesc" FROM "BundleDetail" where "nBundledetailid" = any (inserted_ids);
	
	
	select array_agg(im.new_id) into inserted_bids from temp_id_mapping im;

select jsonb_agg(t) into jCopyFiles from 
 (select "nBDnewid" as "nBundledetailid","cPath","cNewPath" as "cToPath","cFVer" as version from "CopyFileLog" c
 join "BDAttributes" bd on bd."nBundledetailid" = c."nBDid" where "nBatchid" = maxbatchid
 ) t;
	-- select * from temp_id_mapping
  -- DROP TABLE temp_id_mapping;
open ref for select 1 as msg,'file copying process' as value,inserted_ids "newBDids",inserted_bids "newBids",jCopyFiles as "jCopyFiles" 

;
 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
