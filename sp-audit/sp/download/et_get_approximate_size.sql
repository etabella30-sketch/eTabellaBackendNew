CREATE OR REPLACE FUNCTION download.et_get_approximate_size(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
jFolders jsonb;jFiles jsonb;cFilename text;cFinalSize numeric;cDSize numeric;defaultSize numeric default 1073741824;
isHyperlink boolean;

BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
isHyperlink:= parameter ->>'bIshyperlink';
	-- select * from et_download_getdata ('{"nCaseid":22,"nSectionid":92,"jFolders":"{}","jFiles":"{}","nMasterid":59}','r1');fetch all in "r1";
	
	cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);

/*

select * from "SectionMaster" where "nCaseid" = '007a3614-ac77-40e4-bad1-4962b6571c58'

 select * from download.et_get_approximate_size ('{"nCaseid":"2de50566-859e-4d12-b1f4-8cebbf1e58a3","nSectionid":"59445b8f-f372-49d1-a443-8c597e7bd62d","jFolders":"[]","jFiles":"[]","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1"; 

-- select * From "CaseMaster"

alter table "CaseMaster" add column "cDSize" character varying(150)

*/

	select nullif("cDSize",'')::numeric into cDSize From "CaseMaster" where "nCaseid" = nCaseid;

	if(cDSize is null)then
		cDSize = defaultSize;
	end if;

	if(jsonb_array_length(jFolders) > 0) then 
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid") limit 1);
	end if;

		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  CASE 
        WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN  bm."nParentBundleid" IS NULL   
		ELSE jFolders @> to_jsonb(bm."nBundleid") -- bm."nBundleid" = ANY(jFolders::uuid[]) 
    END
			
			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || '/' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
       ), final_detail as (
					  SELECT t.*
		        FROM (
					with tm as (		
					            SELECT bd."nBundledetailid",bd."cFilesize"
					            FROM "BundleDetail" bd		
								JOIN bdl_tree p ON p."nBundleid" = bd."nBundleid"
								left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
								WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null 
						union all
								 SELECT bd."nBundledetailid",bd."cFilesize"
					            FROM "BundleDetail" bd	
								 join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
								JOIN bdl_tree p ON p."nBundleid" = ba."nBundleid"
								left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
								WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null 
					)
						select "nBundledetailid","cFilesize" from tm
					union all
						SELECT DISTINCT bd."nBundledetailid",bd."cFilesize" from "HyperLink" h
							join tm on tm."nBundledetailid" = h."nBundledetailid"
							join "Annotations" a on h."nHLid" = a."nHLid"
							join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
							where  bd."cStatus" ='C' and isHyperlink = true
		        ) t
		
			union all 
			select "nBundledetailid","cFilesize" from
			( with tm as ( SELECT bd."nBundledetailid",bd."cFilesize"
               FROM "BundleDetail" bd
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  bd."nSectionid" = nSectionid AND (case when jsonb_array_length(jFiles) = 0 THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN bd."nBundleid" IS NULL   
			when jsonb_array_length(jFiles) > 0 then jFiles @>  to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
			
			union all

			SELECT bd."nBundledetailid",bd."cFilesize"
               FROM "BundleDetail" bd
			   join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  ba."nSectionid" = nSectionid AND (case when jsonb_array_length(jFiles) = 0 THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN ba."nBundleid" IS NULL   
			when jsonb_array_length(jFiles) > 0 then jFiles @>  to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = ba."nBundleid")	ELSE false end
			
			)
					select "nBundledetailid","cFilesize" from tm
				union all
				SELECT DISTINCT bd."nBundledetailid",bd."cFilesize" from "HyperLink" h
				join tm on tm."nBundledetailid" = h."nBundledetailid"
				join "Annotations" a on h."nHLid" = a."nHLid"
				join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
				where bd."cStatus" ='C' and isHyperlink = true
				
			) t
			
		

	   ) select sum(nullif("cFilesize",'')::numeric) into cFinalSize from final_detail;

	   
    OPEN ref FOR
	   select 1 as msg,cDSize >= coalesce(cFinalSize,0) as "isValidForStream",coalesce(cFinalSize,0) as "cFinalSize";

	
		   
   return ref ;-- Return the cursor to the caller
    END;
$function$
