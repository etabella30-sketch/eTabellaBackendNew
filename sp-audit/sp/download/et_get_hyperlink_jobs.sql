CREATE OR REPLACE FUNCTION download.et_get_hyperlink_jobs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
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
/*

select * from download.et_get_download_jobs ('{"nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212"}','r1');fetch all in "r1";

 select * from download.et_get_download_jobs ('{"nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","PageNumber":2,"cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";
 
select * from download."ProcessMaster"  order by "dCreateDt"
select * from download."ProcessBatchs" 
select * from "SectionMaster"  limit 1
select * from download."ProcessBatchs" 

select * from download."ProcessMaster"  
select * from download."Users" 
select * from "BundleMaster"  limit 1

select rects[0]->>'bundledetailid',* From "Annotations" where "nHLid" is not null limit 10

*/

    OPEN ref FOR
		select nMasterid "nMasterid",totalFiles "totalFiles",p."nDPid",b."nBundledetailid",b."cPath",jsonb_agg(jsonb_build_object('page',a.page,'rect',a.rects,'target_file_path','hyperlink/'|| (case when coalesce(bd."cTab",'') !='' then  bd."cTab" || '_' else '' end) || ((CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
								END)),'link_text',bd."cTab")) "metadata",bs."cIsindex"
		from download."ProcessMaster" p
		join download."ProcessBatchs" b on b."nDPid" = p."nDPid" 
		join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
		join "HyperLink" hl on hl."nBundledetailid" = b."nBundledetailid" 
	    join "Annotations" a on hl."nHLid" = a."nHLid" 
		join "BundleDetail" bd on bd."nBundledetailid" = coalesce(a.rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
		 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF' 
		and case when bs."cIsindex" != true then  hl."nHLid" is not null else true end
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
$function$
