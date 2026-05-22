CREATE OR REPLACE FUNCTION upload.et_save_bundle(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;nBundleid uuid;nMainbundleid uuid;jFolders jsonb;

rec RECORD;x record;
nExistsid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nMainbundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
jFolders := parameter ->>'jFolders';

/*

SELECT * FROM upload.et_save_bundle (
  '{
    ""nCaseid"": 1129,
    ""nSectionid"": 9124,
    ""nBundleid"": 9744,
    ""jFolders"": [
      {""id"":1,""parentId"":0,""name"":""Alpha 1""},
      {""id"":2,""parentId"":0,""name"":""Alpha 2""},
      {""id"":3,""parentId"":1,""name"":""Alpha 1.1""},
      {""id"":4,""parentId"":3,""name"":""Alpha 1.1.1""},
      {""id"":5,""parentId"":2,""name"":""Alpha 2.1""},
      {""id"":6,""parentId"":5,""name"":""Alpha 1.1.1""}
    ],
    ""nMasterid"": 2
  }',
  'r1'
);
FETCH ALL IN ""r1"";

delete from ""BundleMaster"" where ""nSectionid"" = 9124 and ""nBundleid"" not in (9744)

*/

drop table if exists temp_folders;
create temp table temp_folders as 
	select "id","parentId","name",'00000000-0000-0000-0000-000000000000'::uuid as "nBundleid",case when "parentId" = 0 then nMainbundleid else '00000000-0000-0000-0000-000000000000'::uuid end as "nParentBundleid"
	From jsonb_to_recordset(jFolders) as ("id" int,"parentId" int,"name" text);

-- select * from "BundleMaster" 

	FOR rec IN SELECT * FROM temp_folders ORDER BY "id", "parentId"
	LOOP
	    SELECT * INTO x FROM temp_folders t WHERE t.id = rec.id;
			
	    /*RAISE NOTICE 'Before Insert/Update => ID: %, Name: %, ParentID: %, nBundleid: %, nParentBundleid: %',
	        x.id, x.name, x.parentId, x."nBundleid", x."nParentBundleid"";*/

	 	nBundleid := CASE 
                 WHEN x."nBundleid" != '00000000-0000-0000-0000-000000000000'::uuid THEN x."nBundleid"
                 WHEN x."nParentBundleid" != '00000000-0000-0000-0000-000000000000'::uuid THEN x."nParentBundleid"
                 ELSE '00000000-0000-0000-0000-000000000000'::uuid
             END;
	
	    nExistsid := (
	        SELECT "nBundleid"
	        FROM "BundleMaster"
	        WHERE "nSectionid" = nSectionid
	          AND ("nParentBundleid" = x."nParentBundleid" OR ("nParentBundleid" IS NULL AND x."nParentBundleid" = '00000000-0000-0000-0000-000000000000'::uuid))
	          AND TRIM(UPPER("cBundlename")) = TRIM(UPPER(x.name))
	    );

	
	    IF nExistsid IS NULL THEN
	        INSERT INTO "BundleMaster"("cBundlename", "nParentBundleid", "nSectionid", "nCreateId", "dCreateDt")
	        VALUES (x.name, nBundleid, nSectionid, nMasterid, NOW())
	        RETURNING "nBundleid" INTO nExistsid;
	
	        RAISE NOTICE 'Inserted new bundle: %, new ID: %', x.name, nExistsid;
	    ELSE
	        RAISE NOTICE 'Found existing bundle: %, ID: %', x.name, nExistsid;
	    END IF;

	
	    UPDATE temp_folders SET "nBundleid" = nExistsid WHERE "id" = x.id;
	    UPDATE temp_folders SET "nParentBundleid" = nExistsid WHERE "parentId" = x.id;

	   /* -- 🔍 View the effect of update before next loop
	    RAISE NOTICE 'After Update => ID: %, nBundleid: %, Updated ParentBundleid(s): %',
	        x.id, nExistsid, array(
	            SELECT "id" FROM temp_folders WHERE "parentId" = x.id
	        );*/
	
	END LOOP;

open ref for select * from temp_folders;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
