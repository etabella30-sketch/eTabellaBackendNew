CREATE OR REPLACE FUNCTION public.et_export_grid_test(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    nUserid uuid;
    nCaseid uuid;
    nExportid uuid;
    nEDid uuid;
    cSortBy text;
    query text;
BEGIN
    -- Extract parameters from the JSON input
    nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
    nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
    nExportid := NULLIF(parameter->>'nExportid','')::uuid;
    nEDid := NULLIF(parameter->>'nEDid','')::uuid;
    cSortBy := coalesce(parameter->>'cSortby', 'N');

    -- Build the dynamic query string
    query := 'WITH tbl AS (
        SELECT 
            e."nExportid",
            e."cType",
            e."nUserid",
            e."nCaseid",
            e."dReqDt",
            TO_CHAR(e."dReqDt", ''dd/Mon/yyyy hh24:mi'') AS "dStartdt",
            e."cPgsize",
            ed."nEDid",
            bd."nBundledetailid",
            ed."cPath",
            ed."dStartDt",
            ed."cStatus",
            bd."cFilename",
            bd."cFilename" AS "cOUTname",
            ROUND(ed."nProgress") AS "comp_progres",
            100 AS "total_prog"
        FROM "ExportMaster" e
        JOIN "ExportDetail" ed ON ed."nExportid" = e."nExportid"
        JOIN "BundleDetail" bd ON bd."nBundledetailid" = ed."nBDid"
        WHERE e."nUserid" = ''' || nUserid || '''::uuid 
            AND e."nCaseid" = ''' || nCaseid || '''::uuid 
            AND "cType" = ''M''
        UNION ALL
        SELECT 
            e."nExportid",
            e."cType",
            e."nUserid",
            e."nCaseid",
            e."dReqDt",
            TO_CHAR(e."dReqDt", ''dd/Mon/yyyy hh24:mi'') AS "dStartdt",
            e."cPgsize",
            NULL AS "nEDid",
            NULL AS "nBundledetailid",
            e."cExppath" AS "cPath",
            e."dReqDt" AS "dStartDt",
            e."cStatus",
            CASE 
                WHEN ed."nBundleid" IS NOT NULL THEN STRING_AGG(DISTINCT "cFolder", '','' ORDER BY "cFolder")  
                ELSE COALESCE(STRING_AGG(bd."cFilename", '','' ORDER BY bd."cFilename"), '''') 
            END AS "cFilename",
            CASE 
                WHEN ed."nBundleid" IS NOT NULL THEN STRING_AGG(DISTINCT "cFolder", '','' ORDER BY "cFolder") 
                WHEN COUNT(bd."nBundledetailid") > 1 THEN (cm."cCasename" || ''_'' || "dReqDt"::date)  
                ELSE COALESCE(STRING_AGG((CASE 
                        WHEN COALESCE(bd."cTab", '''') != '''' THEN COALESCE(bd."cTab", '''') || ''-'' 
                        ELSE '''' 
                    END || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(bd."cFilename", ''/'', ''''), ''\'', ''''), ''"'', ''''), '':'', ''''), ''?'', ''''), ''<'', ''''), ''>'', '''')), '','' ORDER BY bd."cTab",bd."cFilename"), '''') 
            END AS "cOUTname",
            ROUND(e."nProgress" / COUNT(ed."nEDid")) AS "comp_progres",
            (100 * COUNT(ed."nEDid")) AS "total_prog"
        FROM "ExportMaster" e
        JOIN "ExportDetail" ed ON ed."nExportid" = e."nExportid"
        LEFT JOIN "BundleDetail" bd ON bd."nBundledetailid" = ed."nBDid"
        LEFT JOIN "BundleMaster" b ON b."nBundleid" = ed."nBundleid" 
        LEFT JOIN "SectionMaster" f ON f."nSectionid" = b."nSectionid"
        JOIN "CaseMaster" cm ON cm."nCaseid" = e."nCaseid"
        WHERE e."nUserid" = ''' || nUserid || '''::uuid 
            AND e."nCaseid" = ''' || nCaseid || '''::uuid 
            AND "cType" = ''S''
        GROUP BY  
            e."nExportid",
            e."nUserid",
            e."nCaseid",
            e."dReqDt",
            e."cPgsize",
            e."cExppath",
            e."dReqDt",
            e."cStatus",
            cm."cCasename",
            ed."nBundleid" 
    )
    SELECT * 
    FROM tbl t
    WHERE ' || CASE WHEN nExportid IS NULL THEN 'true' ELSE 't."nExportid" = ''' || nExportid || '''::uuid' END || '
      AND ' || CASE WHEN nEDid IS NULL THEN 'true' ELSE 't."nEDid" = ''' || nEDid || '''::uuid' END || '
    ORDER BY "dReqDt" ' || CASE WHEN cSortBy = 'N' THEN 'DESC NULLS LAST' ELSE 'ASC' END || ',t."cOUTname",t."cFilename"';

    -- Execute the dynamic query
    open ref for EXECUTE query;

    RETURN ref;
END;
$function$
