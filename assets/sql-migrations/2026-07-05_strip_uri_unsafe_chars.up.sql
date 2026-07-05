-- Phase D (reader Export linked Bundle): strip '#' and '%' from linked-copy
-- filenames. The burned PDF link is now a /URI action (localhyperlink.py) and
-- browsers parse it as a URI: '#' starts a fragment and '%xx' percent-decodes,
-- so either char in a target filename makes the click miss the extracted file.
-- LOCKSTEP RULE: the tar entry name (et_insert_download_process_files_hyperlink)
-- and the burned target (et_get_hyperlink_jobs) must stay byte-identical, so
-- both regex classes change in this one migration. The legacy cIsindex lane
-- ('hyperlink/' targets, GoToR via localhyperlinkindex.py) is NOT touched.

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
		-- One row per source PDF, merging BOTH link sources (a doc with auto
		-- hyperlinks AND reader DocLinks must not spawn two rewrite jobs).
		with links as (
			-- legacy auto hyperlinks (HyperLink -> Annotations by nHLid)
			select b."nBundledetailid" as src, b."cPath" as src_path, bs."cIsindex" as is_index,
				a.page as lpage, a.rects as lrect,
				'hyperlink doc/' ||
					(CASE WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))
						THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g')
						ELSE regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
					END) as ltarget,
				bd."cTab" as ltext
			from download."ProcessMaster" p
			join download."ProcessBatchs" b on b."nDPid" = p."nDPid"
			join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
			join "HyperLink" hl on hl."nBundledetailid" = b."nBundledetailid"
		    join "Annotations" a on hl."nHLid" = a."nHLid"
			join "BundleDetail" bd on bd."nBundledetailid" = coalesce(a.rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
			 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF'
			and case when bs."cIsindex" != true then  hl."nHLid" is not null else true end
			and coalesce(b."foldername",'') not like '%hyperlink doc/'
		union all
			-- reader DocLink marks (DocMaster -> DMLinks; rects live in
			-- Annotations keyed by the DocMaster PK, nHLid null â€” the column
			-- is overloaded, see marks schema notes)
			select b."nBundledetailid", b."cPath", bs."cIsindex",
				a.page, a.rects,
				'hyperlink doc/' ||
					(CASE WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))
						THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g')
						ELSE regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
					END),
				bd."cTab"
			from download."ProcessMaster" p
			join download."ProcessBatchs" b on b."nDPid" = p."nDPid"
			join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
			join "DocMaster" dm on dm."nBundledetailid" = b."nBundledetailid"
			join "DMLinks" dl on dl."nDocid" = dm."nDocid"
			join "Annotations" a on a."nDocid" = dm."nDocid" and a."nHLid" is null
			join "BundleDetail" bd on bd."nBundledetailid" = dl."nBundledetailid"
			 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF'
			and bd."cStatus" = 'C'
			and coalesce(b."foldername",'') not like '%hyperlink doc/'
		)
		select nMasterid "nMasterid",totalFiles "totalFiles",nDPid "nDPid",l.src "nBundledetailid",l.src_path "cPath",
			jsonb_agg(jsonb_build_object('page',l.lpage,'rect',l.lrect,'target_file_path',l.ltarget,'link_text',l.ltext)) "metadata",
			l.is_index "cIsindex"
		from links l
		group by l.src,l.src_path,l.is_index
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


CREATE OR REPLACE FUNCTION download.et_insert_download_process_files_hyperlink(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;nSectionid uuid;
jFolders jsonb;jFiles jsonb;
cFilename text;
nDPid uuid;totalFiles int;
cFoldertype text;

BEGIN

 nDPid := parameter ->>'nDPid';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

jFolders := coalesce((parameter ->>'jFolders')::jsonb,'[]'::jsonb);
jFiles := coalesce((parameter ->>'jFiles')::jsonb,'[]'::jsonb);

cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);

	SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

	if(jsonb_array_length(jFolders) = 1) then
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid"));
	end if;

		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
			AND (
          (jsonb_array_length(jFolders) = 0 AND jsonb_array_length(jFiles) = 0
            AND bm."nParentBundleid" IS NULL)
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
			WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
        ),final_data as (
	  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename"
        FROM (
			with tm as (
			            SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,80) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename", p.sub_info ||  '/' || (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' Foldername,"cPath"
			            FROM "BundleDetail" bd
						LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB' then true else false end
						JOIN bdl_tree p ON p."nBundleid" = case when cFoldertype != 'CB' then bd."nBundleid" else  ba."nBundleid" end
						left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
						WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
			)
				select "nBundledetailid","cPath",Foldername,"cFilename" from tm
			union all
				SELECT DISTINCT bd."nBundledetailid",bd."cPath", COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername,(CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END) AS "cFilename" from "HyperLink" h
					join tm on tm."nBundledetailid" = h."nBundledetailid"
					join "Annotations" a on h."nHLid" = a."nHLid"
					join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
					where  bd."cStatus" ='C'
			union all
				-- reader DocLink targets of the picked docs (L4)
				SELECT DISTINCT bd."nBundledetailid",bd."cPath", COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername,(CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END) AS "cFilename" from "DocMaster" dm
					join tm on tm."nBundledetailid" = dm."nBundledetailid"
					join "DMLinks" dl on dl."nDocid" = dm."nDocid"
					join "BundleDetail" bd on bd."nBundledetailid" = dl."nBundledetailid"
					where  bd."cStatus" ='C'
        ) t

 		 union all
		  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename" from
					( with tm as (SELECT bd."nBundledetailid","cPath",'/' ||  (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' as Foldername,(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,80) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename"
		    	    FROM "BundleDetail" bd
					LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB'  then true else false end
					left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
		   	      WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
					  and case when cFoldertype != 'CB' then bd."nSectionid" else  ba."nSectionid" end = nSectionid
					 and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN
			  coalesce(bd."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
				when jsonb_array_length(jFiles) > 0 then jFiles @> to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end)
					select "nBundledetailid","cPath",Foldername,"cFilename" from tm
				union all
				SELECT DISTINCT bd."nBundledetailid",bd."cPath",COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername, (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
								END) AS "cFilename" from "HyperLink" h
							join tm on tm."nBundledetailid" = h."nBundledetailid"
							join "Annotations" a on h."nHLid" = a."nHLid"
							join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
							where bd."cStatus" ='C'
				union all
				-- reader DocLink targets of the picked docs (L4)
				SELECT DISTINCT bd."nBundledetailid",bd."cPath",COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername, (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>#%\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
								END) AS "cFilename" from "DocMaster" dm
							join tm on tm."nBundledetailid" = dm."nBundledetailid"
							join "DMLinks" dl on dl."nDocid" = dm."nDocid"
							join "BundleDetail" bd on bd."nBundledetailid" = dl."nBundledetailid"
							where bd."cStatus" ='C') t

		)
		insert into download."ProcessBatchs" ("nDPid","nBundledetailid","cPath","foldername","cFilename","nSerial")
		select nDPid,f."nBundledetailid",f."cPath",f."foldername",f."cFilename",
   			 ROW_NUMBER() OVER (
     			 ORDER BY f."nBundledetailid"
   			 )
		-- DISTINCT: the same target reached via HyperLink AND DocLink (or twice)
		-- must produce ONE archive entry.
		from (select distinct "nBundledetailid","cPath","foldername","cFilename" from final_data) f;

select  count("nBundledetailid") into totalFiles from download."ProcessBatchs" where "nDPid" = nDPid;

open ref for select 1 as msg,'Download Process Started' as value,nDPid as "nDPid",totalFiles as "totalFiles"
;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;
