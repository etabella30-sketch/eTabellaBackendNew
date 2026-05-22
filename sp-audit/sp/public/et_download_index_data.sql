CREATE OR REPLACE FUNCTION public.et_download_index_data(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nCaseid uuid;
    nSectionid uuid;nDTaskid uuid;
	jFolders uuid[];jFiles uuid[];
BEGIN
    nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    nSectionid := NULLIF(parameter->>'nSectionid','')::uuid;
	nDTaskid := NULLIF(parameter->>'nDTaskid','')::uuid;	
	jFolders := parameter ->>'jFolders';
	jFiles := parameter ->>'jFiles';

-- select * from "DownloadTask" order by 1 desc
-- select * from "DownloadTDetail" where "nDTaskid" = 23 order by 1 desc
-- select * from et_download_index_data('{"nSectionid": 8850, "nCaseid": 1079,"nBundleid": 0, "nDTaskid": 24, "jFolders": "{9511,9461,9644}", "jFiles": "{}","nMasterid":367}','r','r1');fetch all in "r1"

open ref1 for 
			SELECT "nCaseid", "cCasename", "cCaseno", "dCreateDt", "cClaimant", "cRespondent", "cIndexheader"
			   FROM "CaseMaster"
			   WHERE "nCaseid" = nCaseid;

    RETURN NEXT ref1;

    OPEN ref2 FOR
    select "nBundledetailid", t."nBundleid","cFilename"::text,
                "cTab"::text,"cExhibitno"::text,"cRefpage"::text,"dIntrestDt"::text,"cDescription"::text,array_to_string(t.sub_info, ' / ') sub_info ,t.kind::text,t."cBundletag"::text,"nParentBundleid",sorted_tab,sorted_name from ( 
				
				
				WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[coalesce(bm."cBundletag",'') || bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag",case when coalesce(bm."cBundletag",'') !='' then sorted_bundletag else '{}'::text[] end sorted_bundletag,sorted_name,
				dt."nSerial"::text Serial
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "DownloadTDetail" dt on dt."nBid" = bm."nBundleid" and dt."nBDid" IS NULL and dt."nPBid" = bm."nParentBundleid" and "nDTaskid" = nDTaskid  
            left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
            WHERE bp."nBMPid" is null and sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid and
			 CASE WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN bm."nParentBundleid" IS NULL   
		ELSE bm."nBundleid" = ANY(jFolders::uuid[]) end
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || (coalesce(c."cBundletag",'') || c."cBundlename"::text), c."nSectionid", c."cBundletag", p.sorted_bundletag || case when coalesce(c."cBundletag",'') !='' then c.sorted_bundletag else '{}'::text[] end ,p.sorted_name || c.sorted_name,p.serial || '.' || dt."nSerial"::text
            FROM "BundleMaster" c
			left join "DownloadTDetail" dt on dt."nBid" = c."nBundleid" and dt."nBDid" IS NULL and dt."nPBid" = c."nParentBundleid" and "nDTaskid" = nDTaskid  
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"   
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
            WHERE bp."nBMPid" is null         
        )
         SELECT Serial,NULL AS "nBundledetailid", t."nBundleid", t."cBundlename"::text AS "cFilename",
                t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDescription", t.sub_info,''::text kind,t."cBundletag", t."nParentBundleid",sorted_bundletag as sorted_tab,sorted_name
            FROM bdl_tree t
			where (exists(select 1 from "BundleDetail" b WHERE t."nBundleid" = b."nBundleid" ) or t."nParentBundleid" IS NULL)
            GROUP BY Serial,t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info, t."cBundletag",sorted_bundletag,sorted_name
			
            UNION ALL
            
			SELECT p.serial || '.' || dt."nSerial"::text,bd."nBundledetailid", NULL AS "nBundleid", bd."cFilename",
                bd."cTab"::text, TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
                COALESCE(bd."cDesc", '')::text AS "cDescription", p.sub_info || bd."cFilename"::text ,"cFiletype"::text kind,p."cBundletag",null "nParentBundleid", p.sorted_bundletag || case when coalesce(bd."cTab",'') !='' then bd.sorted_tab else '{}'::text[] end ,p.sorted_name || bd.sorted_name
				
            FROM "BundleDetail" bd
            JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid" 
			left join "DownloadTDetail" dt on dt."nBDid" = bd."nBundledetailid" and dt."nBid" = p."nBundleid" and "nDTaskid" = nDTaskid 
				left join "BMPermission" bp on bd."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
		WHERE bp."nBMPid" is null 
UNION ALL
            
			SELECT dt."nSerial"::text,bd."nBundledetailid", NULL AS "nBundleid",bd."cFilename",
                bd."cTab"::text, TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
                COALESCE(bd."cDesc", '')::text AS "cDescription",ARRAY[bd."cFilename"::text] ,"cFiletype"::text kind,null "cBundletag",null "nParentBundleid",  case when coalesce(bd."cTab",'') !='' then bd.sorted_tab else '{}'::text[] end,bd.sorted_name
				
            FROM "BundleDetail" bd
			left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nMasterid     
			left join "DownloadTDetail" dt on dt."nBDid" = bd."nBundledetailid" and dt."nBid" = bd."nBundleid" and "nDTaskid" = nDTaskid 
			where  bp."nBDPid" is null and
(case when array_length(jFiles::uuid[], 1) IS NULL THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN bd."nBundleid" IS NULL   
	when array_length(jFiles::uuid[], 1) is not null then bd."nBundledetailid" = ANY(jFiles::uuid[]) and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
			
			) t ORDER BY string_to_array(serial, '.')::int[],sorted_tab,sorted_name

          ;

    RETURN NEXT ref2;		 
		 
	
	
END;
$function$
