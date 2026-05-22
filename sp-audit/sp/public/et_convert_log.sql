CREATE OR REPLACE FUNCTION public.et_convert_log(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
    nUDid uuid;
    cStatus TEXT;nCaseid uuid;
    cMessage text;
BEGIN
    -- Extract values from JSON
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    nUDid := NULLIF(parameter ->> 'nUDid', '')::uuid;
    cStatus := parameter ->> 'cStatus';
    cMessage := parameter ->> 'cMessage';

    RAISE NOTICE 'Master ID: %, Bundle Detail ID: %, UP ID: %, Status: %', nMasterid, nBundledetailid, nUDid, cStatus;

    IF cStatus = 'P' THEN
        select "nCaseid" into nCaseid from "SectionMaster" s 
        join "BundleDetail" b on b."nSectionid" = s."nSectionid" where b."nBundledetailid" = nBundledetailid;
    
        RAISE NOTICE 'Inserting into ConvertLog: Bundle Detail ID = %, Status = %', nBundledetailid, cStatus;
        INSERT INTO "ConvertLog" ("nBundledetailid","nUDid", "cStatus","nUserid","nCaseid","dStartDt")
        VALUES (nBundledetailid,nUDid, cStatus,nMasterid,nCaseid,now());
    ELSE
        RAISE NOTICE 'Updating ConvertLog: Bundle Detail ID = %, Status = %', nBundledetailid, cStatus;
        UPDATE "ConvertLog"
        SET "cStatus" = cStatus,"dStartDt" = case when cStatus = 'S' then now() else "dStartDt" end,"dEndDt" = case when cStatus = 'C' then now() else "dEndDt" end,"cMessage" =cMessage
        WHERE "nBundledetailid" = nBundledetailid and "nUDid" = nUDid;
    END IF;
    
    OPEN ref1 FOR SELECT 1 AS "msg", nBundledetailid "nBundledetailid", cStatus "cStatus";
    RETURN ref1;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RETURN NULL;
END;
$function$
