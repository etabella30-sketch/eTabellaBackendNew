CREATE OR REPLACE FUNCTION public.et_preview_document_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    nBundledetailid UUID;
    nCaseid UUID;
    nSectionid UUID;
    cUsername TEXT;
    factlinks JSONB;
    casedetail JSONB;
    factsheet JSONB;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nUserid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->>'nBundledetailid', '')::uuid;

    /*
     select * from et_preview_document_list (
       '{"nBundledetailid":"8166acd3-70e8-47ce-8362-443cd69b9b37",
         "nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}',
       'r1'
     );
     FETCH All in "r1";
    */
    
    -- Get section and case IDs
    SELECT "nSectionid" INTO nSectionid 
    FROM "BundleDetail" 
    WHERE "nBundledetailid" = nBundledetailid;
    
    SELECT "nCaseid" INTO nCaseid 
    FROM "SectionMaster" 
    WHERE "nSectionid" = nSectionid;
    
    -- Get username
    SELECT "cFname" || ' ' || "cLname" INTO cUsername 
    FROM "UserMaster" 
    WHERE "nUserid" = nUserid;
    
    -- Build case detail JSON
    SELECT jsonb_agg(t) INTO casedetail 
    FROM (
        SELECT 
            c."nCaseid", c."cCasename", c."cDesc", c."cCaseno",
            to_char(now(), 'Mon dd,yyyy') AS "dExportdt"
        FROM "CaseMaster" c 
        WHERE "nCaseid" = nCaseid
    ) t;
    
    -- Build fact links JSON
    SELECT jsonb_agg(t) INTO factlinks 
    FROM (
        WITH tbl AS (
            SELECT 
                t."nFSid", t."nDocid", t."nWebid", t."nBundledetailid",
                t."cType", bd."cPage", NULL AS "text", "jTexts",
                false AS "isHighlight", t."jLinktype"
            FROM (
                -- Fact master data
                SELECT 
                    f."nFSid", ZeroUUID AS "nDocid", ZeroUUID AS "nWebid",
                    f."nBundledetailid", fd."cType", fd."jLinktype",
                    "jOT" AS "jTexts"
                FROM "FactMaster" f 
                JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
                WHERE f."nUserid" = nUserid AND f."nBundledetailid" = nBundledetailid 
                
                UNION ALL
                
                -- Document master data
                SELECT 
                    ZeroUUID AS "nFSid", d."nDocid", ZeroUUID AS "nWebid",
                    d."nBundledetailid", dd."cType", dd."jLinktype",
                    "jOText" AS "jTexts"
                FROM "DocMaster" d 
                JOIN "DocDetail" dd ON dd."nDocid" = d."nDocid"
                WHERE 
                    dd."cType" = 'M' 
                    AND d."nUserid" = nUserid 
                    AND d."nBundledetailid" = nBundledetailid 
                
                UNION ALL
                
                -- Web master data
                SELECT 
                    ZeroUUID AS "nFSid", ZeroUUID AS "nDocid", w."nWebid",
                    w."nBundledetailid", wd."cType", wd."jLinktype",
                    "jOText" AS "jTexts"
                FROM "WebMaster" w 
                JOIN "WebDetail" wd ON wd."nWebid" = w."nWebid"
                WHERE 
                    w."nUserid" = nUserid 
                    AND w."nBundledetailid" = nBundledetailid
            ) t
            JOIN "BundleDetail" bd ON bd."nBundledetailid" = t."nBundledetailid"
        ) 
        
        SELECT 
            t.*, bd."cTab", bm."cBundletag", bd."cExhibitno",
            CASE 
                WHEN count(l."nBundledetailid") > 0 
                THEN jsonb_agg(l) 
                ELSE '[]'::jsonb 
            END AS "jFiles"
        FROM tbl t
        JOIN "BundleDetail" bd ON bd."nBundledetailid" = t."nBundledetailid"
        LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
        LEFT JOIN (
            -- Fact links
            SELECT 
                f."nFSid", null AS "nDocid", 
                t."nBundledetailid", d."cFilename"
            FROM "FactMaster" f
            JOIN "FMLinks" t ON t."nFSid" = f."nFSid"
            JOIN "BundleDetail" d ON d."nBundledetailid" = t."nBundledetailid"
            
            UNION ALL 
            
            -- Document links
            SELECT 
                null AS "nFSid", d."nDocid", 
                t."nBundledetailid", dd."cFilename"
            FROM "DocMaster" d    
            JOIN "DMLinks" t ON t."nDocid" = d."nDocid"
            JOIN "BundleDetail" dd ON dd."nBundledetailid" = t."nBundledetailid"
        ) l ON l."nFSid" = t."nFSid" OR l."nDocid" = t."nDocid"
        
        GROUP BY 
            t."nFSid", t."nDocid", t."nWebid", t."nBundledetailid",
            t."cType", t."cPage", t."text", t."isHighlight", t."jLinktype",
            bd."cTab", bm."cBundletag", bd."cExhibitno", "jTexts"
    ) t;

    -- Build fact sheet JSON
    SELECT jsonb_agg(t) INTO factsheet 
    FROM (
        WITH fdetail AS (
            SELECT 
                f."nFSid", "jTexts",
                CASE 
                    WHEN ("jLinktype"->>'pages')::jsonb IS NOT NULL 
                    AND jsonb_array_length(("jLinktype"->>'pages')::jsonb) > 0 
                    THEN ("jLinktype"->>'pages')::jsonb 
                    ELSE '[]'::jsonb 
                END AS "cPage",
                fd."cType"
            FROM "FactMaster" f
            JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
            WHERE 
                "nBundledetailid" = nBundledetailid 
                AND f."nUserid" = nUserid
        ),        
        issuelist AS (
            SELECT 
                f_1."nFSid",
                im."cIName" AS "cIssue",
                im."cColor" AS "cClr",
                r."cCodename" AS "cRelevance",
                imp."cCodename" AS "cImpact",
                ic."cCategory"
            FROM "fdetail" f_1
            JOIN "FMIssue" i ON i."nFSid" = f_1."nFSid"
            JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
            JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
            LEFT JOIN "Codemaster" r ON r."nCodeid" = i."nRelevanceid"
            LEFT JOIN "Codemaster" imp ON imp."nCodeid" = i."nImpactid"
        ),
        contacts AS (
            SELECT 
                c_1."cFname",
                c_1."nContactid",
                f_1."nFSid",
                c_1."cProfile",
                c_1."cLname",
                c_1."cAlias",
                c_1."cEmail"
            FROM "fdetail" f_1
            JOIN "FMContact" fc ON fc."nFSid" = f_1."nFSid"
            JOIN "ContactMaster" c_1 ON c_1."nContactid" = fc."nContactid"
        )
        
        SELECT 
            jsonb_agg(c) AS "jContacts",
            f."nFSid", f."jTexts", "cPage", f."cType",
            jsonb_agg(i) AS issuelist 
        FROM fdetail f
        JOIN issuelist i ON i."nFSid" = f."nFSid"
        LEFT JOIN contacts c ON c."nFSid" = f."nFSid"
        GROUP BY f."nFSid", f."jTexts", "cPage", f."cType"
    ) t;

    OPEN ref FOR
    SELECT 
        cUsername AS "cUsername",
        COALESCE(casedetail, '[]') AS casedetail,
        COALESCE(factsheet, '[]'::jsonb) AS "factsheet",
        COALESCE(factlinks, '[]'::jsonb) AS factlinks;

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
