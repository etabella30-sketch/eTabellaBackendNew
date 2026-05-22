CREATE OR REPLACE FUNCTION task.et_pagination_insert_tasks_non_paginated(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nCaseid uuid;
    nUserid uuid;
    nBundledetailid uuid;
    nBundleid uuid;
    nSectionid uuid;
    nStartpg int;
    bDefault boolean;
    bOriginal boolean;
    bHide boolean;
    bAll boolean;

    cBg text;
    cBColor text;
    cFColor text;
    nFSize int;
    cFType text;
    cPosition text;

    nTid uuid;
    nPid uuid;
    nBundleids uuid[];
    nTotal int;
    nRid uuid;

	 
    bIsChecked boolean;
	nDuplicateCount int;
	nRemainCount int;

BEGIN
    -- Parameter extraction
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
    nUserid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
    nStartpg := parameter ->> 'nStartpg';
	bDefault := coalesce((parameter ->> 'bDefault')::boolean, false);
	bOriginal := coalesce((parameter ->> 'bOriginal')::boolean, false);
	bHide := coalesce((parameter ->> 'bHide')::boolean, false);
	bAll := coalesce((parameter ->> 'bAll')::boolean, false);
    cBg := parameter ->> 'cBg';
    cBColor := parameter ->> 'cBColor';
    cFColor := parameter ->> 'cFColor';
    nFSize := parameter ->> 'nFSize';
    cFType := parameter ->> 'cFType';
    cPosition := parameter ->> 'cPosition';
	bIsChecked := coalesce((parameter ->> 'bIsChecked')::boolean, false);

drop table if exists temp_filterd_data;

create temp table temp_filterd_data ON COMMIT DROP as 

    with dt as (
			/* SELECT ROW_NUMBER() OVER (ORDER BY "sorted_tab") AS "nRow", b."nBundledetailid",b."nBundleid", b."cFilename", b."cPath", b."cTab", b."cPage", COALESCE(NULLIF(SPLIT_PART(COALESCE(b."cPage", '1-1'), '-', 2), ''), '1' ) :: int AS "nPages",b."sorted_tab",ba."cFVer"
			 FROM "BundleDetail" b 
			 join "BDAttributes" ba on ba."nBundledetailid" =  b."nBundledetailid"
			 where case when array_length(nBundleids, 1) > 0 THEN 
			 COALESCE(b."nBundleid", 0) = ANY(nBundleids)
			 ELSE COALESCE(b."nBundleid", 0) = COALESCE(nBundleid, 0)
			 END
			 AND b."cFiletype" = 'PDF' */

			  SELECT ROW_NUMBER() OVER (ORDER BY "sorted_tab") AS "nRow", b."nBundledetailid",b."nBundleid", b."cFilename", b."cPath", b."cTab", b."cPage", COALESCE(NULLIF(SPLIT_PART(COALESCE(b."cPage", '1-1'), '-', 2), ''), '1' ) :: int AS "nPages",b."sorted_tab",ba."cFVer"
		   FROM "BundleDetail" b 
			 join "SectionMaster" s on s."nSectionid" = b."nSectionid"
		join "BDAttributes" ba on ba."nBundledetailid" =b."nBundledetailid"
		where "cStatus" = 'C' and b."cFiletype" = 'PDF'  and b."cIsindex" = false
		and case when nSectionid IS NOT NULL then b."nSectionid" = nSectionid else s."nCaseid" = nCaseid and s."cFoldertype" = 'MB' end	
		and b."cRefpage" is null  
		),				
		filterd_data as (
			select * from dt
			where case when nBundledetailid IS NOT NULL
			then 
			(
			CASE 
				WHEN bAll then
				("nRow" >= (SELECT "nRow" FROM dt WHERE "nBundledetailid" = nBundledetailid limit 1))
				else "nBundledetailid" = nBundledetailid end
			) 
			else true
			end
		)
		SELECT fd."nBundledetailid", "sorted_tab",
			case 
				when bDefault then nStartpg
				else nStartpg + SUM(fd."nPages") OVER ( PARTITION BY "nBundleid" ORDER BY "sorted_tab" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW ) - fd."nPages"
			end as "nStartpg",
			coalesce("cFVer", 'null') as "version"
		FROM filterd_data fd
		 left join (
			select d."nBDid",m."cStatus"
			from task."TaskMaster" m 
			join task."TaskDetail" d on d."nTid" = m."nTid"
			where m."cStatus" = 'P' and m."nCaseid" = nCaseid
			)  d on d."nBDid" = fd."nBundledetailid"
			where case when bIsChecked = true then d."nBDid" is null else true end;
/*
	select count(distinct td."nTDid") from task."TaskMaster" tm
	join task."TaskDetail" td on tm."nTid" = td."nTid"
	join temp_filterd_data tf on tf."nBundledetailid" =  td."nBDid"
 	where tm."cStatus" = 'P' and tm."nCaseid" = nCaseid;
*/

/*

select * from task.et_pagination_insert_tasks ('{"queueName":"","nCaseid":1122,"nSectionid":9088,"nMasterid":464,"nBundledetailid":169662,"nBundleid":9649,"nStartpg":5,"bDefault":false,"bOriginal":false,"bHide":false,"bAll":true,"cBg":"#fff","cBColor":"#ffffff00","cFColor":"#000","nFSize":16,"cFType":"arial","cPosition":"BR","cRefpage":"5-150","bIsSkipped":false}','r1');fetch all in "r1";

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
			where m."cStatus" = 'P' and m."nCaseid" = nCaseid
			)  d on d."nBDid" = t."nBundledetailid";

-- raise notice 'text % ,bIsChecked %', nDuplicateCount, bIsChecked;

IF NOT bIsChecked AND nDuplicateCount > 0 THEN
	    OPEN ref FOR 
	        SELECT -2 AS "msg", nRemainCount AS "nRemainCount", nDuplicateCount AS "nDuplicateCount";

else 
	
    -- Insert into TaskMaster and get nTid
    INSERT INTO task."TaskMaster"("nTCatid", "nUserid", "nCaseid")
    VALUES (1, nUserid, nCaseid)
    RETURNING "nTid" INTO nTid;

    -- -- Insert into PaginationMaster and get nPid
    INSERT INTO task."PaginationMaster"("nTid", "nUserid", "nCaseid", "nBundleid", "nSectionid", 
        "nBundledetailid", "nStartpg", "bDefault", "bOriginal",
        "bHide", "bAll", "cBg", "cBColor", "cFColor", "nFSize", "cFType", "cPosition")
    VALUES (nTid, nUserid, nCaseid, '00000000-0000-0000-0000-000000000000'::uuid, nSectionid, '00000000-0000-0000-0000-000000000000'::uuid, 
        nStartpg, bDefault, bOriginal, bHide, bAll, cBg, cBColor, cFColor, nFSize, cFType, cPosition)
    RETURNING "nPid" INTO nPid;

    -- Insert into TaskDetail using data from temporary table
	
    WITH inserted_rows AS (
	INSERT INTO task."TaskDetail"("nTid", "nBDid", "nStart","version")
		SELECT 
			nTid, 
			"nBundledetailid",
			"nStartpg",
			"version"
		FROM temp_filterd_data
		ORDER BY "sorted_tab"
		RETURNING 1
    )

	
    SELECT COUNT(*) INTO nTotal FROM inserted_rows;

    -- -- Fetch nRid for TaskRemarks
    nRid := (SELECT "nRid" FROM task."TaskRemarks" WHERE "nTCatid" = 1 AND "nSerial" = 1);

    -- Insert into TaskRemarkDetail
    INSERT INTO task."TaskRemarkDetail"("nTDid", "nRid")
    SELECT "nTDid", nRid FROM task."TaskDetail" WHERE "nTid" = nTid;

    -- Update TaskMaster with total count
    UPDATE task."TaskMaster" 
    SET "nTotal" = nTotal
    WHERE "nTid" = nTid;

    -- Open refcursor to return results
    OPEN ref FOR 
        SELECT nPid AS "nPid", nTid AS "nTid", nTotal AS "nTotal";

END IF;

    RETURN ref;

END;

$function$
