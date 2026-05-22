CREATE OR REPLACE FUNCTION public.et_activity_paginate_scan(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;
jBundles uuid[];nSectionid uuid;nUserid uuid;bundles uuid[];
totalFiles bigint;pagenatedFiles bigint;notpagenatedFiles bigint;
BEGIN
-- -- select * from public.et_activity_paginate_scan ('{"nCaseid":"1043-uuid-format","nSectionid":"8844-uuid-format","jBundles":"{}","nMasterid":"367-uuid-format"}','r1');fetch all in "r1";
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
jBundles := parameter ->>'jBundles';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;

    if(array_length(jBundles, 1) > 0) then
    bundles := (Array(WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."nParentBundleid"
            FROM "BundleMaster" bm
            join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
            WHERE CASE 
        WHEN array_length(jBundles, 1) IS NULL THEN bm."nParentBundleid" IS NULL   
        ELSE bm."nBundleid" = ANY(jBundles) END 
        AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."nParentBundleid"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
        )
        SELECT "nBundleid" from bdl_tree));
    end if;

    insert into "PaginateScanLog"("nCaseid","nUserid", "nSectionid", "jBundles")
    values (nCaseid, nUserid, nSectionid, jBundles);

    select count(distinct "nBundledetailid") into notpagenatedFiles from "BundleDetail" bd
    join "SectionMaster" s on s."nSectionid" = bd."nSectionid"
    left join "BundleMaster" b on b."nBundleid" = bd."nBundleid"
    where "cStatus" = 'C' and case when bd."nBundleid" IS NOT NULL then b."nBundleid" is not null else true end
        and upper("cFiletype") = 'PDF' and bd."cIsindex" = false 
    and case when array_length(jBundles, 1) > 0 then bd."nBundleid" = any(jBundles) else true end 
    and case when nSectionid IS NOT NULL then bd."nSectionid" = nSectionid else s."nCaseid" = nCaseid and s."cFoldertype" = 'MB' end    
    and coalesce(bd."cRefpage",'') =''
      -- and not exists(select 1 from "PTaskDetail" pd where pd."nID" = bd."nBundledetailid" and "bIspaginate" = true)
      ;
    
    select count(distinct "nBundledetailid") into pagenatedFiles from "BundleDetail" bd
    join "SectionMaster" s on s."nSectionid" = bd."nSectionid" 
    left join "BundleMaster" b on b."nBundleid" = bd."nBundleid"
    where "cStatus" = 'C' and case when bd."nBundleid" IS NOT NULL then b."nBundleid" is not null else true end
    and upper("cFiletype") = 'PDF' and bd."cIsindex" = false 
    and case when array_length(jBundles, 1) > 0 then bd."nBundleid" = any(jBundles) else true end 
    and case when nSectionid IS NOT NULL then bd."nSectionid" = nSectionid else s."nCaseid" = nCaseid and s."cFoldertype" = 'MB' end and coalesce(bd."cRefpage",'') !=''
    
     --  and exists(select 1 from "PTaskDetail" pd where pd."nID" = bd."nBundledetailid" and "bIspaginate" = true)
    ;

        open ref1 for select notpagenatedFiles,pagenatedFiles;

     RETURN NEXT ref1;
    
END;
$function$
