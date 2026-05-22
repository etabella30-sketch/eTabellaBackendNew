CREATE OR REPLACE FUNCTION public.et_companybuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCompanyid uuid;
    nCaseid uuid;
    cCompany VARCHAR(200);
    nMasterid uuid;
    cPermission TEXT;
BEGIN
    nCompanyid := (parameter ->> 'nCompanyid')::uuid;
    nCaseid := (parameter ->> 'nCaseid')::uuid;
    cCompany := parameter ->> 'cCompany';
    nMasterid := (parameter ->> 'nMasterid')::uuid;
    cPermission := parameter ->> 'permission';

    IF cPermission = 'N' THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM "ContactCompany" 
            WHERE TRIM(UPPER("cCompany")) = TRIM(UPPER(cCompany))  
              AND "nCaseid" = nCaseid and "nUserid" = nMasterid
        ) THEN
            INSERT INTO "ContactCompany" (
                "nCaseid", "cCompany", "dCreateDt", "nUserid"
            ) VALUES (
                nCaseid, cCompany, NOW(), nMasterid
            ) 
			returning "nCompanyid" into nCompanyid;

            -- nCompanyid := (SELECT MAX("nCompanyid") FROM "ContactCompany");

            OPEN ref FOR 
            SELECT 1 AS msg, 'Company Inserted' AS value, nCompanyid AS "nCompanyid";
        ELSE
            OPEN ref FOR 
            SELECT -1 AS msg, 'Company Already Exists' AS value;
        END IF;
    ELSIF cPermission = 'E' THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM "ContactCompany" 
            WHERE TRIM(UPPER("cCompany")) = TRIM(UPPER(cCompany))  
              AND "nCaseid" = nCaseid and "nUserid" = nMasterid
              AND "nCompanyid" != nCompanyid
        ) THEN
            UPDATE "ContactCompany" 
            SET "cCompany" = cCompany, 
                "dUpdateDt" = NOW()
            WHERE "nCompanyid" = nCompanyid;

            OPEN ref FOR 
            SELECT 1 AS msg, 'Company Updated' AS value, nCompanyid AS "nCompanyid";
        ELSE
            OPEN ref FOR 
            SELECT -1 AS msg, 'Company Already Exists' AS value;
        END IF;
     ELSIF cPermission = 'D' THEN
        delete from "ContactCompany" where "nCompanyid" = nCompanyid;        
        open ref for SELECT 1 AS msg, 'Deleted' AS value;
    END IF;

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
