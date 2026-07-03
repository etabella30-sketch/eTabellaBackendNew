-- 2026-07-03  Fix the burned GoToR link targets for hyperlink download packages
-- (docs: eTabella angular 21/docs/reader-export-plan.md §Phase C, gap G5).
--
-- download.et_get_hyperlink_jobs feeds assets/pythons/hyperlink/localhyperlink.py
-- the per-annotation `target_file_path` that gets burned into the REWRITTEN
-- source PDF as a relative GoToR link. The old value was
--     'hyperlink/<cTab>_<cleaned name>.<EXT>'
-- — the S3 *staging* prefix, not the archive layout. The tar actually lays the
-- linked copy at
--     '<source doc folder>/hyperlink doc/<cleaned name>.<EXT>'
-- (see download.et_insert_download_process_files_hyperlink), i.e. RELATIVE to
-- the source PDF the link lives in it is simply 'hyperlink doc/<cleaned name>'.
-- With the old value every link 404'd after extraction.
--
-- Branch 1 (per-document HyperLink annotations) now emits
--     'hyperlink doc/' || <exactly the filename expression the insert SP
--     stores in ProcessBatchs."cFilename" for the linked copy>
-- so the burned target and the tar entry agree (node additionally passes both
-- through the same sanitize-filename rules at write time).
--
-- Branch 2 (cIsindex legacy index PDFs, which link EVERY doc of the section)
-- is left as-was: those targets need per-document folder paths relative to the
-- index location and the legacy behaviour is out of scope for the linked-bundle
-- lane. Tracked separately.

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
				-- when the name doesn't already carry it) — the same expression
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
