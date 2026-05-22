CREATE OR REPLACE FUNCTION public.et_ocr_update(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
    nUDid uuid;
    cStatus TEXT;nCaseid uuid;
BEGIN
    -- Extract values from JSON
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    nUDid := NULLIF(parameter ->> 'nUDid', '')::uuid;
    cStatus := parameter ->> 'cStatus';

    RAISE NOTICE 'Master ID: %, Bundle Detail ID: %, UP ID: %, Status: %', nMasterid, nBundledetailid, nUDid, cStatus;

    IF cStatus = 'P' THEN
        select "nCaseid" into nCaseid from "SectionMaster" s 
        join "BundleDetail" b on b."nSectionid" = s."nSectionid" where b."nBundledetailid" = nBundledetailid;
    
        RAISE NOTICE 'Inserting into OCRLog: Bundle Detail ID = %, Status = %', nBundledetailid, cStatus;
        INSERT INTO "OCRLog" ("nBundledetailid","nUDid", "cStatus","nUserid","nCaseid")
        VALUES (nBundledetailid,nUDid, cStatus,nMasterid,nCaseid);
        
    ELSE
        RAISE NOTICE 'Updating OCRLog: Bundle Detail ID = %, Status = %', nBundledetailid, cStatus;
        UPDATE "OCRLog"
        SET "cStatus" = cStatus,"dStartDt" = case when cStatus = 'OCR' then now() else "dStartDt" end,"dEndDt" = case when cStatus = 'C' then now() else "dEndDt" end 
        WHERE "nBundledetailid" = nBundledetailid and  coalesce("nUDid",'00000000-0000-0000-0000-000000000000') = coalesce(nUDid,'00000000-0000-0000-0000-000000000000');

        if(cStatus = 'C') then
            update "BDAttributes" set "nEStatus" = null where "nBundledetailid" = nBundledetailid;
        end if;
        
    END IF;
    
    OPEN ref1 FOR SELECT 1 AS "msg", nBundledetailid "nBundledetailid", cStatus "cStatus";
    RETURN ref1;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RETURN NULL;
END;
$function$
