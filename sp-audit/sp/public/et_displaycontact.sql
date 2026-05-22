CREATE OR REPLACE FUNCTION public.et_displaycontact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare 
    nCaseid uuid;
    nUserid uuid;
    nSectionid uuid;
    ZeroUUID uuid := '00000000-0000-0000-0000-000000000000'::uuid;
	cFoldertype text;nBundleid uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    nUserid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nSectionid := NULLIF(parameter ->>'nSectionid', '')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
    
/*
 select * from et_displaycontact ('{"nSectionid":"a25a6f34-6237-4e1a-b35e-1afe95258c58","nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec","nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}','refcursor'); FETCH All in "refcursor";
 select * from fun_bundledetail()
 -- select * from "ContactRole"
*/
-- select * from public.et_displaycontact ('{"nSectionid":"a25a6f34-6237-4e1a-b35e-1afe95258c58","nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec","nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}','r1');fetch all in "r1";

-- select * from public.et_displaycontact ('{"nSectionid":"d4d3bc39-dc80-477a-b133-19e05e4326fc","nCaseid":"d2aaed5d-a05e-458e-a90f-710d6267ad0a","nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699"}','r1');fetch all in "r1";

	 select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;

    OPEN ref FOR 
    WITH RECURSIVE tbl AS (
    -- Company list materialized first
    SELECT "nCompanyid", "nCompanyid" as "nMasterid", "cCompany"
    FROM "ContactCompany" 
    WHERE "nUserid" = nUserid 
    AND "nCaseid" = nCaseid
    UNION ALL
    SELECT ZeroUUID, ZeroUUID, 'Unassigned'::text
),
-- -- Pre-aggregate file details to avoid multiple scans
-- bundle_detail_section AS (
--     SELECT 
--         bd."nBundledetailid",
-- 		COALESCE(CASE WHEN cFoldertype = 'CB' THEN ba."nSectionid" END, bd."nSectionid") "nSectionid"
--     FROM "BundleDetail" bd
--     LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid"
-- ),
file_details AS (
   SELECT DISTINCT
        bc."nContactid"
    FROM "BDContacts" bc
    JOIN "BundleDetail" f ON f."nBundledetailid" = bc."nBundledetailid" 
	LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = f."nBundledetailid"    
    WHERE COALESCE(CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" END, f."nSectionid") = nSectionid and coalesce(bc."nBDCtid",'00000000-0000-0000-0000-000000000000'::uuid) != '00000000-0000-0000-0000-000000000000'::uuid 
	AND bc."nUserid" = nUserid
	 and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
	
	union all 
SELECT DISTINCT
        c."nContactid"
    FROM "ContactMaster" c
    JOIN "FMContact" fc ON  fc."nContactid" = c."nContactid"
	JOIN "FactMaster" fm ON fc."nFSid" = fm."nFSid"  AND fm."nUserid" = nUserid 
	 JOIN "BundleDetail" f ON f."nBundledetailid" = fm."nBundledetailid" 
	LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = f."nBundledetailid"   
	 WHERE COALESCE(CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" END, f."nSectionid") = nSectionid and coalesce(fc."nFMCid",'00000000-0000-0000-0000-000000000000'::uuid) != '00000000-0000-0000-0000-000000000000'::uuid 
	 and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
	
   /*  SELECT DISTINCT
        c."nContactid" FROM "ContactMaster" c
    JOIN bundle_detail_section f ON f."nSectionid" = nSectionid
    LEFT JOIN "BDContacts" bc ON f."nBundledetailid" = bc."nBundledetailid" 
        AND bc."nUserid" = nUserid 
        AND bc."nContactid" = c."nContactid"
    LEFT JOIN "FactMaster" fm ON fm."nBundledetailid" = f."nBundledetailid" 
        AND fm."nUserid" = nUserid
    LEFT JOIN "FMContact" fc ON fc."nFSid" = fm."nFSid" 
        AND fc."nContactid" = c."nContactid"
    WHERE (bc."nBDCtid" IS NOT NULL OR fc."nFMCid" IS NOT NULL)
    GROUP BY c."nContactid" */
)
-- Main query
SELECT 
    t."nCompanyid",
    t."nCompanyid" as "nMasterid",
    t."nMasterid",
    t."cCompany",
    jsonb_agg(distinct 
        jsonb_build_object(
            'nContactid', c."nContactid",
            'nCaseid', c."nCaseid",
            'cProfile', c."cProfile",
            'cFname', c."cFname",
            'cLname', c."cLname",
            'cEmail', c."cEmail",
            'cRole', cr."cRole",
            'nCompanyid', COALESCE(c."nCompanyid", ZeroUUID),
            'tablelist',  '[]'::jsonb
        )
    ) as "contactls"
FROM tbl t
JOIN "ContactMaster" c ON COALESCE(c."nCompanyid", ZeroUUID) = t."nCompanyid"
LEFT JOIN "ContactRole" cr ON cr."nCRoleid" = c."nRoleid"
JOIN file_details fd ON fd."nContactid" = c."nContactid"
GROUP BY 
    t."nCompanyid",
    t."nMasterid",
    t."cCompany"
ORDER BY t."nCompanyid";

    RETURN ref;

 RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
