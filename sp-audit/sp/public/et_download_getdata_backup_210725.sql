CREATE OR REPLACE FUNCTION public.et_download_getdata_backup_210725(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
jFolders uuid[];jFiles uuid[];cFilename text;

BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
	-- select * from et_download_getdata ('{"nCaseid":22,"nSectionid":92,"jFolders":"{}","jFiles":"{}","nMasterid":59}','r1');fetch all in "r1";
	
	cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);

-- select * from et_download_getdata ('{"nCaseid":22,"nSectionid":92,"jFiles":"{555379}","jFolders":"{1348075,1342387}","nMasterid":59}','r');fetch all in "r"

/*

select * from et_download_getdata ('{"nCaseid":1091,"nSectionid":8880,"jFiles":"{}","jFolders":"{}","nMasterid":263}','r1');fetch all in "r1";
*/

	if(array_length(jFolders,1) = 1) then 
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where "nBundleid" = any(jFolders));
	end if;

    OPEN ref FOR
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE bp."nBMPid" is null and  CASE 
        WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN  bm."nParentBundleid" IS NULL   
		ELSE bm."nBundleid" = ANY(jFolders::uuid[]) 
    END
			
			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || '/' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE bp."nBMPid" is null 
        )
        SELECT t.*
        FROM (
            SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text  || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename", p.sub_info Foldername,"cPath"
            FROM "BundleDetail" bd
            JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid" 
			left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
			where  bp."nBDPid" is null 
        ) t 		
		union all 
			SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename",'/' as Foldername,"cPath"
               FROM "BundleDetail" bd
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  bp."nBDPid" is null and  bd."nSectionid" = nSectionid AND (case when array_length(jFiles::uuid[], 1) IS NULL THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN bd."nBundleid" IS NULL   
	when array_length(jFiles::uuid[], 1) is not null then bd."nBundledetailid" = ANY(jFiles::uuid[]) and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
			
		
		;
		   
			   
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
