CREATE OR REPLACE FUNCTION public.et_index_getfiles(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    nSectionid UUID;
    oldPath TEXT;
    nBundledetailid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nCaseid := NULLIF(parameter->>'nCaseid', '')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid', '')::uuid;
    nSectionid := NULLIF(parameter->>'nSectionid', '')::uuid;
    
    /*
    select * from et_index_getfiles (
      '{"nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec",
        "nSectionid":"8166acd3-70e8-47ce-8362-443cd69b9b37",
        "cHyperlinktype":"T",
        "column":"[\"Tab\",\"cTab\",70],[\"Name\",\"cFilename\",\"*\"],[\"Date of Interest\",\"dIntrestDt\",70],[\"Description\",\"cDescription\",80],[\"Page\",\"cRefpage\",40],[\"Exhibit\",\"cExhibitno\",75]",
        "bCoverpg":true,
        "bIndexpg":true,
        "nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}',
      'r1','r2','r3'
    );
    fetch all in "r1";
    fetch all in "r2";
    */

    SELECT "cPath", "nBundledetailid" INTO oldPath, nBundledetailid 
    FROM "BundleDetail" 
    WHERE "nSectionid" = nSectionid AND "cIsindex" = true;

    DELETE FROM "Annotations" a 
    WHERE "nHLid" IN (
        SELECT "nHLid" FROM "HyperLink" 
        WHERE "nBundledetailid" = nBundledetailid
    );

    OPEN ref1 FOR 
    SELECT 
        "nCaseid", "cCasename", "cCaseno", "dCreateDt", "cClaimant", 
        "cRespondent", "cIndexheader", oldPath AS "oldPath"
    FROM "CaseMaster"
    WHERE "nCaseid" = nCaseid;

    RETURN NEXT ref1;

    OPEN ref2 FOR
    SELECT 
        "nBundledetailid", t."nBundleid", "cFilename"::text,
        "cTab"::text, "cExhibitno"::text, "cRefpage"::text, 
        "dIntrestDt"::text, "cDescription"::text, "cAuthor"::text,
        array_to_string(t.sub_info, ' / ') AS sub_info,
        t.kind::text, t."cBundletag"::text, t."nParentBundleid" 
    FROM (
        WITH RECURSIVE bdl_tree AS (
            SELECT 
                bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag",
                sorted_bundletag,sorted_name
            FROM "BundleMaster" bm
            JOIN "SectionMaster" sm ON sm."nSectionid" = bm."nSectionid"
            WHERE (bm."nParentBundleid" = ZeroUUID OR bm."nParentBundleid"  IS NOT DISTINCT FROM NULL) AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            
            UNION ALL
            
            SELECT 
                c."nBundleid", c."cBundlename", c."nParentBundleid",                
                p.sub_info || c."cBundlename"::text, c."nSectionid", c."cBundletag",case when c."cBundletag" = p."cBundletag" then (p.sorted_bundletag || c.sorted_name) else (p.sorted_bundletag || c.sorted_bundletag) end,p.sorted_name || c.sorted_name
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
        )
        SELECT 
            NULL AS "nBundledetailid", t."nBundleid", t."cBundlename"::text AS "cFilename",
            t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDescription", ''::text AS "cAuthor", t.sub_info,''::text kind,t."cBundletag", t."nParentBundleid",sorted_bundletag as sorted_tab,sorted_name
        FROM bdl_tree t
        LEFT JOIN bundlesource b ON t."nBundleid" = b."nBundleid"
		 WHERE case when (t."nParentBundleid" IS NULL OR t."nParentBundleid" = '00000000-0000-0000-0000-000000000000') then true else b."nBundleid"  IS DISTINCT FROM NULL end
        GROUP BY 
            t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info, 
            t."cBundletag", sorted_bundletag, sorted_name
            
        UNION ALL
        
        SELECT 
            bd."nBundledetailid", NULL AS "nBundleid", 
            REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
            bd."cTab"::text, 
            TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
            COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
            COALESCE(bd."cDesc", '')::text AS "cDescription", COALESCE(bd."cAuthor", '')::text AS "cAuthor", 
            p.sub_info || (CASE WHEN COALESCE(bd."cTab"::text,'') = '' THEN bd."cFilename"::text ELSE bd."cTab"::text END),
            "cFiletype"::text AS kind, p."cBundletag", NULL AS "nParentBundleid", 
            p.sorted_bundletag || bd.sorted_tab,p.sorted_name || bd.sorted_name
        FROM "BundleDetail" bd
        JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid"
    ) t 
    ORDER BY sorted_tab nulls first,sorted_name nulls first;

    RETURN NEXT ref2;    
     
    OPEN ref3 FOR 
    WITH tm AS (
        SELECT DISTINCT 
            bd."nBundledetailid", 
            REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '') AS "cFilename",
            TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', '')) AS "cExhibitno",
            "nSectionid", COALESCE(bd."cRefpage", '') AS "cRefpage", 
            TRIM(COALESCE(bd."cTab", '')) AS "cTab",
            COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt", 
            COALESCE(bd."cDesc", '')::text AS "cDescription", 
            COALESCE(bd."cAuthor", '')::text AS "cAuthor",
            "cFiletype"::text AS kind, sorted_tab, sorted_name
        FROM "BundleDetail" bd
        WHERE 
            COALESCE(bd."nBundleid", ZeroUUID) = ZeroUUID 
            AND bd."nSectionid" = nSectionid 
            AND bd."cIsindex" != true
        ORDER BY sorted_tab NULLS FIRST, sorted_name NULLS FIRST
    ) 
    SELECT 
        "nBundledetailid", "cFilename", "cExhibitno", "nSectionid", 
        "cRefpage", "cTab", "dIntrestDt", "cDescription", "cAuthor", "kind"
    FROM tm;
    
    RETURN NEXT ref3;
END;
$function$
