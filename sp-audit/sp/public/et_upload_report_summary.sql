CREATE OR REPLACE FUNCTION public.et_upload_report_summary(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    cStatus TEXT;
    dDate TIMESTAMP;
    cFiletype TEXT;
    nUPid UUID;
    cSearch TEXT;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
    nSectionid UUID;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    cStatus := parameter ->>'cStatus';
    dDate := (parameter ->>'dDate')::timestamp;
    cFiletype := parameter ->>'cFiletype';
    nUPid := NULLIF(parameter ->>'nUPid', '')::uuid;
    cSearch := parameter ->>'cSearch';
	nSectionid:= parameter ->>'nSectionid';
    
    /*
    select * from et_upload_report_summary ('{"nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec","nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}','r1');fetch all in "r1";
    */

    OPEN ref FOR
    SELECT 
        u."nUPid",
        u."nUPid" || to_char(u."dCreateDt",'_yyyy_mm_dd') AS "cUnicid",
        b."nBundleid",
        s."nSectionid",
        b."cBundlename",
        s."cFolder",
        ('[]')::jsonb AS files,
        u."nTotal" AS totalfiles,
        u."nCompleted" AS completed,
        (u."nTotal" - u."nCompleted") AS "failed",
        u."nTid"
    FROM 
        "UploadMaster" u 
    LEFT JOIN 
        "BundleMaster" b ON b."nBundleid" = u."nBundleid"
    LEFT JOIN 
        "SectionMaster" s ON s."nSectionid" = u."nSectionid"
    JOIN (
        SELECT "nUPid" 
        FROM "UploadDetail" 
        WHERE 
            CASE WHEN cStatus IS NOT NULL THEN "cStatus" = cStatus ELSE TRUE END AND
            CASE WHEN cSearch IS NOT NULL THEN trim(upper("cName" || "cType")) LIKE trim(upper('%'|| cSearch ||'%')) ELSE TRUE END AND
            CASE WHEN cFiletype IS NOT NULL THEN "cType" = cFiletype ELSE TRUE END 
    ) d ON d."nUPid" = u."nUPid"
    WHERE 
        u."nCaseid" = nCaseid AND		
        CASE WHEN nSectionid IS NOT NULL THEN u."nSectionid" = nSectionid ELSE TRUE END AND 
        CASE WHEN nUPid IS NOT NULL THEN u."nUPid" = nUPid ELSE TRUE END AND 
        CASE WHEN dDate IS NOT NULL THEN u."dCreateDt"::date = dDate::date ELSE TRUE END
    GROUP BY 
        u."nUPid", b."cBundlename", s."cFolder", b."nBundleid", s."nSectionid", u."nTotal", u."nCompleted", u."nTid"
    ORDER BY 
        u."nUPid" DESC;

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
