CREATE OR REPLACE FUNCTION public.et_activity_paginate_scandata(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;
jBundles uuid[];nSectionid uuid;nUserid uuid;bundles uuid[];
totalFiles bigint;pagenatedFiles bigint;
BEGIN
-- select * from et_activity_paginate_scandata('{"nMasterid":"367-uuid-format"}','r');fetch all in "r"
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
jBundles := parameter ->>'jBundles';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;

    open ref1 for select * from (WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
            join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
            WHERE CASE 
        WHEN array_length(jBundles, 1) IS NULL THEN bm."nParentBundleid" IS NULL   
        ELSE bm."nBundleid" = ANY(jBundles)  
    END
            
            AND sm."nCaseid" = nCaseid AND case when nSectionid IS NOT NULL then bm."nSectionid" = nSectionid else sm."cFoldertype" = 'MB' end
            UNION ALL
            SELECT c."nBundleid",p."cBundlename" || ' / ' || c."cBundlename", c."nParentBundleid",
                p.sub_info || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"        
        )
        
            SELECT '00000000-0000-0000-0000-000000000000'::uuid AS "nBundledetailid", t."nBundleid", null AS "cFilename",
                t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDesc", t.sub_info,''::text kind,t."cBundletag",'' "cPaginated"
            FROM bdl_tree t
            GROUP BY t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info, t."cBundletag"
            UNION ALL
            SELECT bd."nBundledetailid", bd."nBundleid", REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
                coalesce(bd."cTab",'')::text, TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                COALESCE(bd."cRefpage", bd."cPage")::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
                COALESCE(bd."cDesc", '')::text AS "cDesc", p.sub_info || coalesce(bd."cTab",bd."cFilename")::text || coalesce(bd."cFilename",'')::text,"cFiletype"::text kind,'' "cBundletag", --case when count("nPTDid") > 0 then 'Yes' else 'No' end 
                case when TRIM(COALESCE(bd."cTab", ''))::text = '' then 'Tab not assign' when bd."cRefpage" is null then 'No Pagination attempt' else 'No Paginated' end as "cPaginated"        
            FROM "BundleDetail" bd
            --left join "PTaskDetail" pd on pd."nID" = bd."nBundledetailid" and pd."bIspaginate" = true
            JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid" where bd."cStatus" = 'C' and upper("cFiletype") ='PDF'
              and coalesce(bd."cRefpage",'') = ''
            
        group by bd."nBundleid",bd."nBundledetailid",bd."cFilename",bd."cTab",bd."cExhibitno",bd."cRefpage",bd."cPage",bd."dIntrestDt","cFiletype",bd."cDesc",p.sub_info,p."cBundletag"
    --    select * from et_batchfile_getdata('{"nCaseid":1105,"nSectionid":8469}','r');fetch all in "r"
        union all 

            SELECT bd."nBundledetailid",NULL "nBundleid", REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
            TRIM(COALESCE(bd."cTab", ''))::text AS "cTab", 
                                TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                                 COALESCE(bd."cRefpage", bd."cPage")::text AS "cRefpage", 
                                COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt", COALESCE(bd."cDesc", '')::text AS "cDesc",
                                ARRAY[coalesce(bd."cTab",bd."cFilename")] as sub_info,"cFiletype"::text kind,'' "cBundletag"
                                ,case when TRIM(COALESCE(bd."cTab", ''))::text = '' then 'Tab not assign' when bd."cRefpage" is null then 'No Pagination attempt' else 'No Paginated' end as "cPaginated"                                
               FROM "BundleDetail" bd
                 join "SectionMaster" s on s."nSectionid" = bd."nSectionid"
                -- left join "PTaskDetail" pd on pd."nID" = bd."nBundledetailid" and pd."bIspaginate" = true
               WHERE bd."nBundleid" IS NULL AND case when nSectionid IS NOT NULL then bd."nSectionid" = nSectionid else s."nCaseid" = nCaseid and s."cFoldertype" = 'MB' and bd."nBundleid" IS NULL end AND bd."cStatus" = 'C'
                    and CASE WHEN array_length(jBundles, 1) IS NULL THEN true   
        ELSE false end and upper("cFiletype")='PDF' and bd."cIsindex" = false 
         and coalesce(bd."cRefpage",'') = ''
    group by bd."nBundleid",bd."nBundledetailid",bd."cFilename",bd."cTab",bd."cExhibitno",bd."cRefpage",bd."cPage",bd."dIntrestDt","cFiletype",bd."cDesc"
                  

            ) s    
                where case when "nBundledetailid" = '00000000-0000-0000-0000-000000000000'::uuid then exists (select 1 from "BundleDetail" bd where bd."cStatus" = 'C' and bd."cFiletype" ='PDF' and s."nBundleid" = bd."nBundleid" and bd."cRefpage" is null) else true end
         ORDER BY (s."nBundleid" IS NULL),
         alphanumeric_sort(array_to_string("sub_info",' / '));

     RETURN NEXT ref1;
    
END;
$function$
