CREATE OR REPLACE FUNCTION public.et_index_getdata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nCaseid uuid;
    nSectionid uuid;
BEGIN
    nCaseid := (parameter->>'nCaseid')::uuid;
    nMasterid := (parameter->>'nMasterid')::uuid;
    nSectionid := (parameter->>'nSectionid')::uuid;
-- select * from et_get_indexdata('{""nCaseid"":22,""nSectionid"":92}','r');fetch all in ""r""
-- select * from ""BundleMaster"" limit 10
    OPEN ref FOR
    SELECT
        (SELECT jsonb_agg(t)
         FROM (SELECT "nCaseid", "cCasename", "cCaseno", "dCreateDt", "cClaimant", "cRespondent", "cIndexheader"
               FROM "CaseMaster"
               WHERE "nCaseid" = nCaseid) t) AS casedetail,
        (WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
            WHERE bm."nParentBundleid" IS NULL AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
           
        )
        SELECT jsonb_agg(t ORDER BY sub_info[1],substring(array_to_string("sub_info",' / '), '\D+'),substring(array_to_string("sub_info",' / '), '\d+')::numeric  NULLS FIRST, substring(sub_info[1], '\D+'),
	
	   CASE WHEN sub_info[1] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[1] FROM '[0-9\.]+'), '.', 2),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[1] FROM '[0-9\.]+'), '.', 2),'') AS numeric)  ELSE NULL END NULLS FIRST,
	   CASE WHEN sub_info[1] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[1] FROM '[0-9\.]+'), '.', 3),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[1] FROM '[0-9\.]+'), '.', 3),'') AS numeric)  ELSE NULL END NULLS FIRST,
	
      CASE WHEN sub_info[2] ~ '\d+' THEN substring(sub_info[2] FROM '(\d+)')::numeric ELSE NULL END NULLS FIRST, 
      CASE WHEN sub_info[2] ~ '\D+' THEN substring(sub_info[2], '\D+') ELSE NULL END NULLS FIRST, 																 
	  
	   CASE WHEN sub_info[2] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 2),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 2),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[2] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 3),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 3),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[2] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 4),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 4),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[2] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 5),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 5),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[2] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 6),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[2] FROM '[0-9\.]+'), '.', 6),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  
	  
      CASE WHEN sub_info[3] ~ 'd+' THEN substring(sub_info[3] FROM '(\d+)')::numeric ELSE NULL END NULLS FIRST, 
      CASE WHEN sub_info[3] ~ '\D+' THEN substring(sub_info[3], '\D+') ELSE NULL END NULLS FIRST, 
	  
	 
	   CASE WHEN sub_info[3] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 2),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 2),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[3] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 3),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 3),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[3] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 4),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 4),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[3] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 5),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 5),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  CASE WHEN sub_info[3] ~ '\d+' and NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 6),'') !='' THEN  CAST(NULLIF(SPLIT_PART(SUBSTRING(sub_info[3] FROM '[0-9\.]+'), '.', 6),'') AS numeric)  ELSE NULL END NULLS FIRST,
	  
      /* Many more CASE statements omitted for brevity */
	  
      CASE WHEN array_length(sub_info, 1) > 2 AND sub_info[3] ~ 'F\d+\.\d+' THEN substring(sub_info[3] FROM 'F\d+\.(\d+)')::numeric
		WHEN array_length(sub_info, 1) > 3 AND sub_info[4] ~ 'F\d+\.\d+' THEN substring(sub_info[4] FROM 'F\d+\.(\d+)')::numeric 
 		WHEN array_length(sub_info, 1) > 4 AND sub_info[5] ~ 'F\d+\.\d+' THEN substring(sub_info[5] FROM 'F\d+\.(\d+)')::numeric 
 		WHEN array_length(sub_info, 1) > 5 AND sub_info[6] ~ 'F\d+\.\d+' THEN substring(sub_info[6] FROM 'F\d+\.(\d+)')::numeric 
		WHEN array_length(sub_info, 1) > 6 AND sub_info[7] ~ 'F\d+\.\d+' THEN substring(sub_info[7] FROM 'F\d+\.(\d+)')::numeric
		WHEN array_length(sub_info, 1) > 7 AND sub_info[8] ~ 'F\d+\.\d+' THEN substring(sub_info[8] FROM 'F\d+\.(\d+)')::numeric 
		WHEN array_length(sub_info, 1) > 8 AND sub_info[9] ~ 'F\d+\.\d+' THEN substring(sub_info[9] FROM 'F\d+\.(\d+)')::numeric
	WHEN array_length(sub_info, 1) > 9 AND sub_info[10] ~ 'F\d+\.\d+' THEN substring(sub_info[10] FROM 'F\d+\.(\d+)')::numeric
	WHEN array_length(sub_info, 1) > 10 AND sub_info[11] ~ 'F\d+\.\d+' THEN substring(sub_info[11] FROM 'F\d+\.(\d+)')::numeric 
	WHEN array_length(sub_info, 1) > 11 AND sub_info[12] ~ 'F\d+\.\d+' THEN substring(sub_info[12] FROM 'F\d+\.(\d+)')::numeric ELSE NULL END NULLS FIRST,
      sub_info[2], sub_info[3], sub_info[4], sub_info[5], sub_info[6], sub_info[7], sub_info[8], sub_info[9], sub_info[10], sub_info[11]  )
        FROM (
            SELECT NULL AS "nBundledetailid", t."nBundleid", t."cBundlename"::text AS "cFilename",
                t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDescription", t.sub_info, ''::text kind, t."cBundletag"
            FROM bdl_tree t
            GROUP BY t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info, t."cBundletag"
            UNION ALL
            SELECT bd."nBundledetailid", NULL AS "nBundleid", REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
                bd."cTab"::text, TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
                COALESCE(bd."cDesc", '')::text AS "cDescription", p.sub_info || bd."cTab"::text, "cFiletype"::text kind, p."cBundletag"
            FROM "BundleDetail" bd
            JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid"
           
        ) t ) AS bundlelist,
        (SELECT jsonb_agg(t) 
         FROM (SELECT DISTINCT bd."nBundledetailid", REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '') AS "cFilename",
                                TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', '')) AS "cExhibitno",
                                "nSectionid", COALESCE(bd."cRefpage", '') AS "cRefpage", TRIM(COALESCE(bd."cTab", '')) AS "cTab",
                                COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt", COALESCE(bd."cDesc", '')::text AS "cDescription", "cFiletype"::text kind
               FROM "BundleDetail" bd
               WHERE bd."nBundleid" IS NULL AND bd."nSectionid" = nSectionid AND bd."cIsindex" != true) t) AS tablelist;
-- select * from ""BundleDetail""
    RETURN ref;
END;
$function$
