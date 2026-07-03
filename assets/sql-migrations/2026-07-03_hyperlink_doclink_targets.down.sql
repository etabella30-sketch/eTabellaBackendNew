-- Revert 2026-07-03_hyperlink_doclink_targets: restore the pre-L4 functions
-- (insert SP without DMLinks branches; get_hyperlink_jobs = the L3-fixed
--  single-source version from 2026-07-03_hyperlink_link_targets.up.sql).

CREATE OR REPLACE FUNCTION download.et_insert_download_process_files_hyperlink(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;nSectionid uuid;
-- jFolders uuid[];jFiles uuid[];
jFolders jsonb;jFiles jsonb;
cFilename text;
nDPid uuid;totalFiles int;
cFoldertype text;

BEGIN

/*

 select * from download.et_insert_download_process_files ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377}','r1');fetch all in "r1";

select * From download."ProcessMaster"
select * From download."Options"
select * From download."Users"

select * from download."ProcessBatchs"

alter table download."ProcessBatchs" add column "cFilename" character varying(500)

*/
 nDPid := parameter ->>'nDPid';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

-- jFolders := parameter ->>'jFolders';
-- jFiles := parameter ->>'jFiles';

jFolders := coalesce((parameter ->>'jFolders')::jsonb,'[]'::jsonb);
jFiles := coalesce((parameter ->>'jFiles')::jsonb,'[]'::jsonb);

-- alter table download."ProcessBatchs" add column "isFileExists"

-- select * from download.et_insert_download_process_files ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377,"nDPid":2}','r1');fetch all in "r1";

cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);
/*
	if(array_length(jFolders,1) = 1) then 
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where "nBundleid" = any(jFolders));
	end if;
*/

	SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;
	
	if(jsonb_array_length(jFolders) = 1) then 
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid"));
	end if;

-- select * From download."ProcessBatchs"
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid  --  bp."nBMPid" is null
			/*  and CASE  WHEN 
		 array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN  bm."nParentBundleid" is null  
		ELSE bm."nBundleid" = ANY(jFolders::uuid[]) 
			END */
			AND (
          -- when client asked “all” (no folders/files) we start at root
          (jsonb_array_length(jFolders) = 0 AND jsonb_array_length(jFiles) = 0
            AND bm."nParentBundleid" IS NULL)
          -- otherwise only the explicit folder list
          OR (jFolders IS NOT NULL and jsonb_array_length(jFolders) > 0
            AND jFolders @> to_jsonb(bm."nBundleid"))
        )
			
			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || ' / ' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid  -- bp."nBMPid" is null 
        ),final_data as (
	  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename"
        FROM (
			with tm as (		
			            SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,150) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename", p.sub_info ||  '/' || (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' Foldername,"cPath"
			            FROM "BundleDetail" bd						
						LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB' then true else false end
						JOIN bdl_tree p ON p."nBundleid" = case when cFoldertype != 'CB' then bd."nBundleid" else  ba."nBundleid" end
			            -- JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid" 
						left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
						WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null 
			)
				select "nBundledetailid","cPath",Foldername,"cFilename" from tm
			union all
				SELECT DISTINCT bd."nBundledetailid",bd."cPath", COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername,(CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END) AS "cFilename" from "HyperLink" h
					join tm on tm."nBundledetailid" = h."nBundledetailid"
					join "Annotations" a on h."nHLid" = a."nHLid"
					join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
					where  bd."cStatus" ='C'
        ) t

	
		
 		 union all 
		  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename" from
					( with tm as (SELECT bd."nBundledetailid","cPath",'/' ||  (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' as Foldername,(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,150) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename"
		    	    FROM "BundleDetail" bd
					
					LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB'  then true else false end
					left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
		   	      WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null 
					  and case when cFoldertype != 'CB' then bd."nSectionid" else  ba."nSectionid" end = nSectionid 
					/* and   CASE WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN   bd."nBundleid" is null
					when array_length(jFiles::uuid[], 1) is not null then bd."nBundledetailid" = ANY(jFiles::uuid[]) and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
					*/
					 and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN
			  coalesce(bd."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
				when jsonb_array_length(jFiles) > 0 then jFiles @> to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end)
					select "nBundledetailid","cPath",Foldername,"cFilename" from tm
				union all
				SELECT DISTINCT bd."nBundledetailid",bd."cPath",COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername, (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
								END) AS "cFilename" from "HyperLink" h
							join tm on tm."nBundledetailid" = h."nBundledetailid"
							join "Annotations" a on h."nHLid" = a."nHLid"
							join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
							where bd."cStatus" ='C') t
		
		)
		insert into download."ProcessBatchs" ("nDPid","nBundledetailid","cPath","foldername","cFilename","nSerial")
		select nDPid,f."nBundledetailid",f."cPath",f."foldername",f."cFilename",
   			 ROW_NUMBER() OVER (
     			 ORDER BY f."nBundledetailid"
   			 ) 
	
		from final_data f;

		   

select  count("nBundledetailid") into totalFiles from download."ProcessBatchs" where "nDPid" = nDPid;

open ref for select 1 as msg,'Download Process Started' as value,nDPid as "nDPid",totalFiles as "totalFiles"

;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;

CREATE OR REPLACE FUNCTION download.et_get_hyperlink_jobs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nMasterid uuid;pageNumber int;cSortBy text;

offsetCount int;perPage int default 10;nDPid uuid;totalFiles int;
BEGIN
nCaseid := parameter ->>'nCaseid';
nMasterid := parameter ->>'nMasterid';
pageNumber := parameter ->>'PageNumber';
cSortBy := parameter ->>'cSortBy';
nDPid := parameter ->>'nDPid';
totalFiles := parameter ->>'totalFiles';

offsetCount := (pageNumber - 1) * perPage;

    OPEN ref FOR
		select nMasterid "nMasterid",totalFiles "totalFiles",p."nDPid",b."nBundledetailid",b."cPath",
			jsonb_agg(jsonb_build_object(
				'page',a.page,
				'rect',a.rects,
				-- Relative to the SOURCE PDF's folder; must equal the linked copy's
				-- ProcessBatchs entry: 'hyperlink doc/' + cleaned filename (+ UPPER ext
				-- when the name doesn't already carry it) â€” the same expression
				-- et_insert_download_process_files_hyperlink stores as "cFilename".
				'target_file_path','hyperlink doc/' ||
					(CASE WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))
						THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g')
						ELSE regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
					END),
				'link_text',bd."cTab")) "metadata",bs."cIsindex"
		from download."ProcessMaster" p
		join download."ProcessBatchs" b on b."nDPid" = p."nDPid"
		join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
		join "HyperLink" hl on hl."nBundledetailid" = b."nBundledetailid"
	    join "Annotations" a on hl."nHLid" = a."nHLid"
		join "BundleDetail" bd on bd."nBundledetailid" = coalesce(a.rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
		 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF'
		and case when bs."cIsindex" != true then  hl."nHLid" is not null else true end
		-- exclude the linked COPIES themselves (rows under 'hyperlink doc/'):
		-- only the picked source documents get their hotspots rewritten.
		and coalesce(b."foldername",'') not like '%hyperlink doc/'
		group by p."nDPid",b."nBundledetailid",b."cPath",bs."cIsindex"
	union all
		select nMasterid "nMasterid",totalFiles "totalFiles",p."nDPid",b."nBundledetailid",b."cPath",jsonb_agg(jsonb_build_object('page',0,'rect','[]'::jsonb,'target_file_path','hyperlink/'||  (case when coalesce(bd."cTab",'') !='' then  bd."cTab" || '_' else '' end) || ((CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
									END)),'link_text',bd."cTab")) "metadata",bs."cIsindex"
			from download."ProcessMaster" p
			join download."ProcessBatchs" b on b."nDPid" = p."nDPid"
			join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
			join "SectionMaster" s on s."nCaseid" = p."nCaseid"
			join "BundleDetail" bd on bd."nSectionid" = s."nSectionid"
			 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF' and bs."cIsindex" = true
			group by p."nDPid",b."nBundledetailid",b."cPath",bs."cIsindex";

   return ref ;-- Return the cursor to the caller
    END;
$function$;

