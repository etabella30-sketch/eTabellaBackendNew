CREATE OR REPLACE FUNCTION public.et_user_sections(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    
    /*
     select * from et_user_sections('{"nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37","nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec"}','r1','r2');
     FETCH All in "r2"; 
    */
        
    OPEN ref1 FOR 
    SELECT "nSectionid", "cFolder", "cFoldertype"
    FROM "SectionMaster" 
    WHERE "nCaseid" = nCaseid 
      AND COALESCE("nUserid", ZeroUUID) = ZeroUUID
      AND "cFoldertype" != 'TS'
    ORDER BY "nSectionid";

    RETURN NEXT ref1;

    OPEN ref2 FOR 
    SELECT 
        COALESCE(s."nSectionid", ZeroUUID) AS "nSectionid",
        CASE WHEN s."nSectionid" IS NOT NULL THEN s."cFolder" ELSE "cCodename" END AS "cFolder",
        "jOther"->>'cFlag' AS "cFoldertype",
        "jOther"->>'cMsg' AS "cMsg",
        CASE 
            WHEN s."cFoldertype" = 'TS' AND sd."nUserid" = nMasterid THEN true 
            WHEN s."nUserid" = nMasterid THEN true 
            ELSE false 
        END AS "isActive"
    FROM "Codemaster" c
    LEFT JOIN "SectionMaster" s ON 
        s."cFoldertype" = ("jOther"->>'cFlag')::text 
        AND s."nCaseid" = nCaseid 
        AND CASE 
            WHEN s."cFoldertype" = 'TS' THEN true 
            ELSE s."nUserid" = nMasterid 
        END
    LEFT JOIN "SectionDetail" sd ON 
        sd."nSectionid" = s."nSectionid" 
        AND sd."nUserid" = nMasterid
    WHERE "nCategoryid" = 13 
      AND ("jOther"->>'cFlag') NOT IN ('MB','ALL') 
    ORDER BY "nSerialno","nCodeid";

    RETURN NEXT ref2;
END;
$function$
