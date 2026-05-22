CREATE OR REPLACE FUNCTION task.et_convert_insert_tasks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nCaseid uuid;
    nUserid uuid;
    nBundledetailid uuid;
    nBundleid uuid;
    nSectionid uuid;
    bDefault boolean;

    nTid uuid;
    nCid uuid;
    nBundleids uuid[];
    nTotal int;
    nRid uuid;

    nDuplicateCount int;
    nRemainCount int;

    bIsChecked boolean;
    jBids uuid[];
    jBDids uuid[];
    jFtypes jsonb;
    bundles uuid[];
    bMetadata boolean;
    cConvertType text;
    nTCatid int default 5;

BEGIN
    -- Parameter extraction
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
    nUserid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid','')::uuid;
    nBundleid := NULLIF(parameter ->> 'nBundleid','')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
    bIsChecked := coalesce((parameter ->> 'bIsChecked')::boolean, false);

    bMetadata := coalesce((parameter ->> 'bMetadata')::boolean, false);

    cConvertType:= (parameter ->>'cConvertType');
    jBids := NULLIF(parameter ->>'jBids','')::uuid[];
    jBDids := NULLIF(parameter ->>'jBDids','')::uuid[];
    jFtypes:= parameter ->>'jFtypes';

    
    bundles := (array (
            WITH RECURSIVE bdl_tree AS (
                SELECT bm."nBundleid", bm."nParentBundleid"
                FROM "BundleMaster" bm
                join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
                WHERE bm."nBundleid" = ANY(jBids) AND bm."nSectionid" = nSectionid
                UNION ALL
                SELECT c."nBundleid", c."nParentBundleid"
                FROM "BundleMaster" c
                JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"            
            )
            select "nBundleid" from "bdl_tree"));

drop table if exists temp_filterd_data;

    create temp table temp_filterd_data ON COMMIT DROP as 
        with dt as (
                select b."nBundledetailid",b."sorted_tab", ba."cFVer"
                from "BundleDetail" b
                join "BDAttributes" ba on ba."nBundledetailid" =  b."nBundledetailid"
                where b."nSectionid" = nSectionid  and b."cStatus" = 'C' 
                and (b."nBundledetailid" = any(jBDids) or b."nBundleid" = any(bundles))
                and  jFtypes @> to_jsonb(upper(b."cFiletype"))
            )
        
        SELECT fd."nBundledetailid",fd."sorted_tab", "cFVer" as "version"
        FROM dt fd
         left join (
            select d."nBDid",m."cStatus"
            from task."TaskMaster" m 
            join task."TaskDetail" d on d."nTid" = m."nTid"
            where m."cStatus" = 'P' and m."nCaseid" = nCaseid
            ) 
             d on d."nBDid" = fd."nBundledetailid"
            where case when bIsChecked = true then d."nBDid" is null else true end;

/*
select * from task.et_convert_insert_tasks ('{"queueName":"","nCaseid":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","nSectionid":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","nMasterid":"00000000-0000-0000-0000-000000000000","jBids":"{}","jBDids":"{a1b2c3d4-e5f6-7890-abcd-ef1234567890}","jFtypes":"[\"DOCX\"]","bMetadata":true,"cConvertType":"B"}','r1');fetch all in "r1";

select * from task."TaskMaster" order by 1 desc

select * from "temp_filterd_data"
*/

     select count(distinct case when d."nBDid" is null then t."nBundledetailid" end),
      count(distinct case when d."nBDid" is not null and d."cStatus" = 'P' then d."nBDid" end) into  nRemainCount,nDuplicateCount
       from temp_filterd_data t
        left join (
            select d."nBDid",m."cStatus"
            from task."TaskMaster" m 
            join task."TaskDetail" d on d."nTid" = m."nTid"
            where m."cStatus" = 'P' and m."nCaseid" = nCaseid and m."nTCatid" = nTCatid
            )  d on d."nBDid" = t."nBundledetailid";

-- raise notice 'text % ,bIsChecked %', nDuplicateCount, bIsChecked;

IF NOT bIsChecked AND nDuplicateCount > 0 THEN
        OPEN ref FOR 
            SELECT -2 AS "msg", nRemainCount AS "nRemainCount", nDuplicateCount AS "nDuplicateCount", 'File already converting' as value;

    elsif not exists (select 1 from temp_filterd_data) then 
        OPEN ref FOR 
            SELECT -1 AS "msg", 'No File Found for Convert' as value;

    else 
    
    -- Insert into TaskMaster and get nTid
    INSERT INTO task."TaskMaster"("nTCatid", "nUserid", "nCaseid")
    VALUES (nTCatid, nUserid, nCaseid)
    RETURNING "nTid" INTO nTid;

    -- -- Insert into ConvertMaster and get nCid
    INSERT INTO task."ConvertMaster"("nTid", "nUserid", "nCaseid", "jBDids", "nSectionid", "jBids", "jFtypes", "bMetadata", "cConvertType")
    VALUES (nTid, nUserid, nCaseid, jBDids, nSectionid, jBids, jFtypes, bMetadata, cConvertType)
    RETURNING "nCid" INTO nCid;

    -- -- Insert into TaskDetail using data from temporary table
    
    WITH inserted_rows AS (
    INSERT INTO task."TaskDetail"("nTid", "nBDid","version")
        SELECT 
            nTid, 
            "nBundledetailid",
            "version"
        FROM temp_filterd_data
        ORDER BY "sorted_tab"
        RETURNING 1
    )

    SELECT COUNT(*) INTO nTotal FROM inserted_rows;

    -- -- Fetch nRid for TaskRemarks
    nRid := (SELECT "nRid" FROM task."TaskRemarks" WHERE "nTCatid" = nTCatid AND "nSerial" = 1);

    -- Insert into TaskRemarkDetail
    INSERT INTO task."TaskRemarkDetail"("nTDid", "nRid")
    SELECT "nTDid", nRid FROM task."TaskDetail" WHERE "nTid" = nTid;

    -- Update TaskMaster with total count
    UPDATE task."TaskMaster" 
    SET "nTotal" = nTotal
    WHERE "nTid" = nTid;

    -- Open refcursor to return results
    OPEN ref FOR 
        SELECT nCid AS "nCid", nTid AS "nTid", nTotal AS "nTotal";

END IF;

    RETURN ref;

END;
$function$
