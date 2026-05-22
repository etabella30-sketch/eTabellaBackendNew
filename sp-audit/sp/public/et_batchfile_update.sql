CREATE OR REPLACE FUNCTION public.et_batchfile_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    cPath text;
    nCaseid uuid;
    nUserid uuid;nSectionid uuid;
    filedata jsonb;
    cColumn text;
    columnMappings jsonb;
    columnMappingRecord jsonb;
    sqlUpdate text;nBlogid uuid;
BEGIN
    cPath := parameter ->> 'cPath';
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    nSectionid:= NULLIF(parameter ->> 'nSectionid', '')::uuid; 
    nUserid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    filedata := (parameter ->> 'filedata')::jsonb;
    cColumn := (parameter ->> 'column');

    DROP TABLE IF EXISTS bundleimpfile;
    CREATE TEMP TABLE bundleimpfile AS
        SELECT * 
        FROM jsonb_populate_recordset(NULL::record, filedata) AS (
            "ID" text,
            "Bundle" text,
            "Tab" text,
            "Name" text,
            "Date" text,
            "Description" text,
            "Page" text,
            "Exhibit" text,
            "Author" text
        );

    -- Handle empty IDs and Date
    UPDATE bundleimpfile 
    SET "ID" = NULL 
    WHERE COALESCE("ID", '') = '';
    
    UPDATE bundleimpfile 
    SET "Date" = NULL 
    WHERE COALESCE("Date", '') = '';
    
    -- Add nBundleid column
    ALTER TABLE bundleimpfile 
    ADD COLUMN "nBundleid" uuid;
    
    -- Update nBundleid based on BundleDetail
    UPDATE bundleimpfile f 
    SET "nBundleid" = bd."nBundleid" 
    FROM "BundleDetail" bd 
    WHERE bd."nBundledetailid" = f."ID"::uuid;
    -- select * from "Batchlog"

	-- select * from "Batchlog" 
    select "nBlogid" into nBlogid from "Batchlog" where "nCaseid" = nCaseid and "nSectionid" = nSectionid and "nCreateId" = nUserid order by "dCreateDt" desc limit 1;

	
    update "Batchlog" set "cStatus" = 'C',"dUpdateDt" = now(),"cColumn" = cColumn,"nUpdateid" = nUserid where "nBlogid" = nBlogid;
    delete from "Batchlog" where  "cStatus" = 'P' and "nCaseid" = nCaseid and "nSectionid" = nSectionid and "nCreateId" = nUserid;
    delete from "BatchlogDetail" where "nBlogid" = nBlogid;
    
    
    sqlUpdate := 'UPDATE "BundleDetail" b SET ';
    FOR columnMappingRecord IN SELECT value::jsonb FROM jsonb_array_elements(('['|| cColumn ||']')::jsonb) LOOP
        -- Log changes
        if(columnMappingRecord->>1 !='cBundletag' and columnMappingRecord->>1 != 'kind') then
        
        EXECUTE format('INSERT INTO "BatchlogDetail" ("nBundledetailid","nBlogid", column_name, old_value, new_value,"isChange")
                        SELECT b."nBundledetailid",''%s''::uuid, %L, b.%I::text, f.%I::text, coalesce(b.%I,'''') IS DISTINCT FROM coalesce(f.%I,'''')
                        FROM "BundleDetail" b
                        JOIN bundleimpfile f ON b."nBundledetailid" = f."ID"::uuid',
                       nBlogid, columnMappingRecord->>0, columnMappingRecord->>1, columnMappingRecord->>0, 
                       columnMappingRecord->>1, columnMappingRecord->>0);
                       
                       
             RAISE NOTICE 'Inserted log entry for column: %', columnMappingRecord->>1;
        
        sqlUpdate := sqlUpdate || format('%I = COALESCE(f.%I,''''), ', 
                                         columnMappingRecord->>1, columnMappingRecord->>0, columnMappingRecord->>1);
        end if;    
        
        if(columnMappingRecord->>1 ='cBundletag') then 
        
          EXECUTE format('INSERT INTO "BatchlogDetail" ("nBundledetailid","nBlogid", column_name, old_value, new_value,"isChange")
                        SELECT b."nBundledetailid",''%s''::uuid, %L, bm.%I::text, f.%I::text, coalesce(bm.%I,'''') IS DISTINCT FROM coalesce(f.%I,'''')
                        FROM "BundleDetail" b
                         join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
                        JOIN bundleimpfile f ON b."nBundledetailid" = f."ID"::uuid',
                       nBlogid, columnMappingRecord->>0, columnMappingRecord->>1, columnMappingRecord->>0, 
                       columnMappingRecord->>1, columnMappingRecord->>0);
        end if;
           
           
        
    END LOOP;
     sqlUpdate := left(sqlUpdate, length(sqlUpdate) - 2);  -- Remove the last comma and space
     sqlUpdate := sqlUpdate || ' FROM bundleimpfile f WHERE b."nBundledetailid" = f."ID"::uuid;';
    
--     -- Execute the dynamic SQL update for BundleDetail
raise notice 'sqlUpdate %', sqlUpdate;
    EXECUTE sqlUpdate;

--    Update the BundleMaster table and log changes
    UPDATE "BundleMaster" b 
    SET "cBundletag" = t."Bundle" 
    FROM (
        SELECT "Bundle", "nBundleid" 
        FROM bundleimpfile 
        WHERE "nBundleid" IS NOT NULL AND COALESCE("Bundle", '') != ''
        GROUP BY "nBundleid", "Bundle"
    ) t 
    WHERE t."nBundleid" = b."nBundleid"
    AND b."cBundletag" IS DISTINCT FROM t."Bundle";
    
    -- Log changes for BundleMaster
    -- select * from "BatchlogDetail"
    INSERT INTO "BatchlogDetail" ("nBundledetailid","nBlogid", column_name, old_value, new_value)
    SELECT "nBundledetailid",nBlogid,'cBundletag', b."cBundletag"::text, t."Bundle"::text
    FROM "BundleMaster" b
    JOIN (
        SELECT "ID"::uuid "nBundledetailid","Bundle", "nBundleid" 
        FROM bundleimpfile 
        WHERE "nBundleid" IS NOT NULL AND COALESCE("Bundle", '') != ''
        GROUP BY "ID","nBundleid", "Bundle"
    ) t ON t."nBundleid" = b."nBundleid"
    WHERE b."cBundletag" IS DISTINCT FROM t."Bundle";

    -- Open cursor to return the log entries
    
    OPEN ref FOR SELECT 1 msg,jsonb_array_elements(('['|| cColumn ||']')::jsonb),format('INSERT INTO bundle_update_log (nBundledetailid, column_name, old_value, new_value)
                        SELECT b."nBundledetailid", %L, b.%I::text, f.%I::text
                        FROM "BundleDetail" b
                        JOIN bundleimpfile f ON b."nBundledetailid" = f."ID"::uuid
                        WHERE b.%I IS DISTINCT FROM f.%I',
                       columnMappingRecord->>0, columnMappingRecord->>1, columnMappingRecord->>0, 
                       columnMappingRecord->>1, columnMappingRecord->>0); 

    RETURN ref;
END;
$function$
