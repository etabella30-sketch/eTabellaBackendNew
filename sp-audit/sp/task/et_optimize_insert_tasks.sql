CREATE OR REPLACE FUNCTION task.et_optimize_insert_tasks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nCaseid uuid;
    nUserid uuid;
    nBundledetailid uuid;
    nBundleid uuid;
    nSectionid uuid;

    nTid uuid;
    nOPid uuid;
    nTotal int;
    nRid uuid;

    nDuplicateCount int;
    nRemainCount int;

    bIsChecked boolean;
    jBids uuid[];
    jBDids uuid[];
    bundles uuid[];
    nTCatid int default 8;

    gsParams text = '[""-sDEVICE=pdfwrite"", ""-dPDFSETTINGS=/printer"", ""-dFastWebView=true"",""-dCompatibilityLevel=1.4"", ""-dNOPAUSE"", ""-dBATCH"", ""-dQUIET""]'::jsonb;

BEGIN
    -- Parameter extraction
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    nUserid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    -- nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    nBundleid := NULLIF(parameter ->> 'nBundleid', '')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid', '')::uuid;
    bIsChecked := coalesce((parameter ->> 'bIsChecked')::boolean, false);

    jBids := (parameter ->>'jBids')::uuid[];
    jBDids := (parameter ->>'jBDids')::uuid[];

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
                select b."nBundledetailid", b."sorted_tab", ba."cFVer"
                from "BundleDetail" b
                join "BDAttributes" ba on ba."nBundledetailid" = b."nBundledetailid"
                where b."nSectionid" = nSectionid and b."cStatus" = 'C' 
                and (b."nBundledetailid" = any(jBDids) or b."nBundleid" = any(bundles))
                -- and b."nBundledetailid" = nBundledetailid 
                and upper(b."cPath") LIKE '%.PDF'
            )
            -- ,
            -- filterd_data as (
            -- select * from dt
            -- )                 
        SELECT fd."nBundledetailid", fd."sorted_tab", "cFVer" as "version"
        FROM dt fd
         left join (
            select d."nBDid", m."cStatus"
            from task."TaskMaster" m 
            join task."TaskDetail" d on d."nTid" = m."nTid"
            where m."cStatus" = 'P' and m."nCaseid" = nCaseid
            ) 
             d on d."nBDid" = fd."nBundledetailid"
            where case when bIsChecked = true then d."nBDid" is null else true end;

/*

select * from task.et_optimize_insert_tasks ('{""queueName"":"""",""nCaseid"":1126,""nSectionid"":9117,""nMasterid"":464,""nBundledetailid"":169984,""nOcrtype"":1}','r1');fetch all in ""r1"";
select * from task.""TaskMaster"" order by 1 desc

select * from ""temp_filterd_data""

*/

     select count(distinct case when d."nBDid" is null then t."nBundledetailid" end),
      count(distinct case when d."nBDid" is not null and d."cStatus" = 'P' then d."nBDid" end) into nRemainCount, nDuplicateCount
       from temp_filterd_data t
        left join (
            select d."nBDid", m."cStatus"
            from task."TaskMaster" m 
            join task."TaskDetail" d on d."nTid" = m."nTid"
            where m."cStatus" = 'P' and m."nCaseid" = nCaseid and m."nTCatid" = nTCatid
            ) d on d."nBDid" = t."nBundledetailid";

-- raise notice 'text % ,bIsChecked %', nDuplicateCount, bIsChecked;

IF NOT bIsChecked AND nDuplicateCount > 0 THEN
        OPEN ref FOR 
            SELECT -2 AS "msg", nRemainCount AS "nRemainCount", nDuplicateCount AS "nDuplicateCount", 'File already in Optimization' as value;

    elsif not exists (select 1 from temp_filterd_data) then 
        OPEN ref FOR 
            SELECT -1 AS "msg", 'No File Found for Optimize' as value;

    else 
    
    -- Insert into TaskMaster and get nTid
    INSERT INTO task."TaskMaster"("nTCatid", "nUserid", "nCaseid")
    VALUES (nTCatid, nUserid, nCaseid)
    RETURNING "nTid" INTO nTid;

    INSERT INTO task."OptimizeMaster"("nTid", "nUserid", "nCaseid", "nSectionid", "nBundledetailid")
    VALUES (nTid, nUserid, nCaseid, nSectionid, nBundledetailid)
    RETURNING "nOPid" INTO nOPid;

    -- -- Insert into TaskDetail using data from temporary table
    
    WITH inserted_rows AS (
    INSERT INTO task."TaskDetail"("nTid", "nBDid", "version")
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
        SELECT nOPid AS "nOPid", nTid AS "nTid", nTotal AS "nTotal", gsParams "gsParams";

END IF;

    RETURN ref;

END;
$function$
