CREATE OR REPLACE FUNCTION task.et_pagination_insert_tasks_backup(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare
	nCaseid uuid;nUserid uuid;nBundledetailid uuid;nBundleid uuid; nSectionid uuid; nStartpg int; bDefault boolean; bOriginal boolean; bHide boolean;
	bAll boolean;
    cBg text;
    cBColor text;
    cFColor text;
    nFSize int;
    cFType text;
    cPosition text;
    nTid uuid;
    nPid uuid;
    nBundleids uuid [];
	nTotal int;
	nRid uuid;
    

    BEGIN
        nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
        nUserid := NULLIF(parameter ->> 'nMasterid','')::uuid;
        nBundledetailid := NULLIF(parameter ->> 'nBundledetailid','')::uuid;
        nBundleid := NULLIF(parameter ->> 'nBundleid','')::uuid;
        nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
        nStartpg := parameter ->> 'nStartpg';
        bDefault := nullif((parameter ->> 'bDefault') :: text, '');
        bOriginal := nullif((parameter ->> 'bOriginal') :: text, '');
        bHide := nullif((parameter ->> 'bHide') :: text, '');
        bAll := nullif((parameter ->> 'bAll') :: text, '');
        cBg := parameter ->> 'cBg';
        cBColor := parameter ->> 'cBColor';
        cFColor := parameter ->> 'cFColor';
        nFSize := parameter ->> 'nFSize';
        cFType := parameter ->> 'cFType';
        cPosition := parameter ->> 'cPosition';
/*
 select * from task.et_pagination_insert_tasks ('{""nSectionid"":9088,""isDeepscan"":false,""nBundleid"":9654,""nBundledetailid"":169653,""nCaseid"":1122,""nMasterid"":464}','r1');fetch all in ""r1"";
 
 select * from task."PaginationMaster"
 select * from task."TaskMaster"
 
 */

insert into
	task."TaskMaster"("nTCatid", "nUserid", "nCaseid")
values
	(1, nUserid, nCaseid) returning "nTid" into nTid;

INSERT INTO task."PaginationMaster"("nTid", "nUserid", "nCaseid", "nBundleid", "nSectionid", "nBundledetailid", "nStartpg", "bDefault", "bOriginal",
"bHide", "bAll", "cBg", "cBColor", "cFColor", "nFSize", "cFType", "cPosition")
VALUES (nTid, nUserid, nCaseid, nBundleid, nSectionid, nBundledetailid, nStartpg, bDefault, bOriginal, bHide, bAll, cBg, cBColor, cFColor, nFSize, cFType, cPosition)
returning "nPid" into nPid;

-- if(bHide) then 

-- 	with dt as (
-- 		 SELECT ROW_NUMBER() OVER (ORDER BY "sorted_tab") AS "nRow", b."nBundledetailid","sorted_tab", COALESCE(NULLIF(SPLIT_PART(COALESCE(b."cPage", '1-1'), '-', 2), ''), '1' ) :: int AS "nPages"
-- 		 FROM "BundleDetail" b 
-- 		 where COALESCE(b."nBundleid", 0) = COALESCE(nBundleid, 0)
-- 		 AND b."cFiletype" = 'PDF'
-- 	),
--     filterd_data as (
-- 		select * from dt
--         where
--         (
--         CASE 
--             WHEN bAll then
--             ("nRow" >= (SELECT "nRow" FROM dt WHERE "nBundledetailid" = nBundledetailid limit 1))
--             else "nBundledetailid" = nBundledetailid end
--         ) 
-- 	),
-- 	inserted_rows AS (
-- 	    SELECT 
-- 	        filterd_data."nBundledetailid", 
-- 	        case 
-- 	            when bDefault then nStartpg
-- 	            else nStartpg + SUM(filterd_data."nPages") OVER ( ORDER BY "sorted_tab" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW ) - filterd_data."nPages"
-- 	        end as "nStart"
-- 	    FROM filterd_data
-- 	    ORDER BY "sorted_tab"
-- 	), updated_rows  as (
-- 		update "BundleDetail"
--         set "cRefpage" = inserted_rows."nStart" || '-' || (COALESCE(NULLIF(SPLIT_PART(COALESCE("cPage", '1-1'), '-', 2), ''), '1' )::int + (inserted_rows."nStart" -1))
--         from inserted_rows
--         where "BundleDetail"."nBundledetailid" = inserted_rows."nBundledetailid" RETURNING 1
-- 		)
		
-- 		SELECT COUNT(*) INTO nTotal FROM updated_rows;

--         -- open ref for 
--         --     select nPid as "nPid", nTid as "nTid", nTotal as "nTotal";
--         -- RETURN ref;

-- else 

	if(nBundleid IS NOT NULL and nBundledetailid IS NULL and bAll) then
		nBundleids := (array(SELECT "nBundleid" FROM get_sorted_hierarchy_bundle(nBundleid)));
	end if;

		with dt as (
			 SELECT ROW_NUMBER() OVER (ORDER BY "sorted_tab") AS "nRow", b."nBundledetailid",b."nBundleid", b."cFilename", b."cPath", b."cTab", b."cPage", COALESCE(NULLIF(SPLIT_PART(COALESCE(b."cPage", '1-1'), '-', 2), ''), '1' ) :: int AS "nPages",b."sorted_tab",ba."cFVer"
			 FROM "BundleDetail" b 
			 join "BDAttributes" ba on ba."nBundledetailid" =  b."nBundledetailid"
			 where case when array_length(nBundleids, 1) > 0 THEN 
			 b."nBundleid" = ANY(nBundleids)
			 ELSE b."nBundleid" = nBundleid
			 END
			 AND b."cFiletype" = 'PDF'
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
		),
	inserted_rows AS (
		INSERT INTO task."TaskDetail"("nTid", "nBDid", "nStart","version")
		SELECT 
			nTid, 
			filterd_data."nBundledetailid",
			case 
				when bDefault then nStartpg
				else nStartpg + SUM(filterd_data."nPages") OVER ( PARTITION BY "nBundleid" ORDER BY "sorted_tab" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW ) - filterd_data."nPages"
			end,
			coalesce("cFVer", 'null')
		FROM filterd_data
		ORDER BY "sorted_tab"
		RETURNING 1
)

	SELECT COUNT(*) INTO nTotal FROM inserted_rows;
	
	 nRid = (select "nRid" From task."TaskRemarks" where "nTCatid" = 1 and "nSerial" = 1);
	
		INSERT INTO task."TaskRemarkDetail"("nTDid", "nRid")
		select "nTDid", nRid from task."TaskDetail" where "nTid" = nTid;
	
		update task."TaskMaster" set 
		"nTotal" = nTotal
		where "nTid" = nTid;
	
-- end if;

open ref for 
		select nPid as "nPid", nTid as "nTid", nTotal as "nTotal";

RETURN ref;
-- Return the cursor to the caller
END;

$function$
