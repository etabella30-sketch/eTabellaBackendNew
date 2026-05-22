CREATE OR REPLACE FUNCTION public.et_contact_case_rolebuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCRoleid    uuid;
    nCaseid     uuid;
    cRole       varchar(200);
    cIsdefault  varchar(1);
    nMasterid   uuid;
    cPermission text;
BEGIN
    nCRoleid   := (parameter ->> 'nCRoleid')::uuid;
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    cRole      :=  parameter ->> 'cRole';
    cIsdefault :=  COALESCE(parameter ->> 'cIsdefault','N');
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    cPermission:=  parameter ->> 'permission';

    IF cPermission = 'N' THEN
        IF NOT EXISTS (
            SELECT 1
              FROM "ContactRole"
             WHERE TRIM(UPPER("cRole")) = TRIM(UPPER(cRole))
               AND "nCaseid" = nCaseid
               AND "nUserid" = nMasterid
        ) THEN
            INSERT INTO "ContactRole" (
                "nCaseid","cRole","cIsdefault","dCreateDt","nUserid"
            ) VALUES (
                nCaseid, cRole, cIsdefault, NOW(), nMasterid
            )
			returning "nCRoleid" into nCRoleid;
            --nCRoleid := (SELECT MAX("nCRoleid") FROM "ContactRole");
            OPEN ref FOR SELECT 1 AS msg,'Role Inserted' AS value,nCRoleid AS "nCRoleid";
        ELSE
            OPEN ref FOR SELECT -1 AS msg,'Role Already Exists' AS value;
        END IF;

    ELSIF cPermission = 'E' THEN
        IF NOT EXISTS (
            SELECT 1
              FROM "ContactRole"
             WHERE TRIM(UPPER("cRole")) = TRIM(UPPER(cRole))
               AND "nCaseid" = nCaseid
               AND "nUserid" = nMasterid
               AND "nCRoleid" <> nCRoleid
        ) THEN
            UPDATE "ContactRole"
               SET "cRole"       = cRole,
                   "cIsdefault"  = cIsdefault,
                   "dUpdateDt"   = NOW()
             WHERE "nCRoleid" = nCRoleid;
            OPEN ref FOR SELECT 1 AS msg,'Role Updated' AS value,nCRoleid AS "nCRoleid";
        ELSE
            OPEN ref FOR SELECT -1 AS msg,'Role Already Exists' AS value1;
        END IF;

    ELSIF cPermission = 'D' THEN
        DELETE FROM "ContactRole" WHERE "nCRoleid" = nCRoleid;
        OPEN ref FOR SELECT 1 AS msg,'Deleted' AS value;
    END IF;

    RETURN ref;
END;
$function$
