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
						THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g')
						ELSE regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
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
						THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g')
						ELSE regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
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

