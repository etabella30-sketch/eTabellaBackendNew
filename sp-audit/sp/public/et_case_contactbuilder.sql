CREATE OR REPLACE FUNCTION public.et_case_contactbuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$DECLARE
    nMasterid    uuid;
    nCaseid      uuid;
    nContactid   uuid;

    cProfile     text;
    cFname       text;
    cLname       text;
    cAlias       text;
    cLinkedin    text;

    cEmail       text;
    cCountrycode text;
    cMobile      text;

    nRoleid      uuid;
    nCompanyid   uuid;
    cNote        text;
    nTZid        integer;
    cIso         text;

    cPermission  text;
    emailExists  boolean;

    cType        text;
    cMentiontag  text;
    cOccupation  text;
    nPartyid     integer;
BEGIN
    --------------------------------------------------
    -- READ PARAMETERS
    --------------------------------------------------
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    nContactid := NULLIF(parameter ->> 'nContactid','0')::uuid;

    cProfile  := parameter ->> 'cProfile';
    cFname    := parameter ->> 'cFname';
    cLname    := parameter ->> 'cLname';

    cAlias    := parameter ->> 'cAlias';
    cLinkedin := parameter ->> 'cLinkedin';

    cEmail    := NULLIF(TRIM(parameter ->> 'cEmail'), '');
    cCountrycode := parameter ->> 'cCountrycode';
    cMobile   := NULLIF(TRIM(parameter ->> 'cMobile'), '');

    nRoleid    := (parameter ->> 'nRoleid')::uuid;
    nCompanyid := (parameter ->> 'nCompanyid')::uuid;

    cNote := parameter ->> 'cNote';
    nTZid := (parameter ->> 'nTZid')::integer;
    cIso  := parameter ->> 'cIso';

    cPermission := parameter ->> 'permission';
    cType := COALESCE(NULLIF(parameter ->> 'cType', ''), 'C');

    cMentiontag := parameter ->> 'cMentiontag';
    cOccupation := parameter ->> 'cOccupation';
    nPartyid    := (parameter ->> 'nPartyid')::integer;

    --------------------------------------------------
    -- VALIDATIONS
    --------------------------------------------------
    IF cPermission = 'N' AND cEmail IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg,'Email is required' AS value;
        RETURN ref;
    END IF;

    --------------------------------------------------
    -- DUPLICATE EMAIL CHECK
    --------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM "ContactMaster"
        WHERE LOWER(TRIM("cEmail")) = LOWER(cEmail)
          AND "nCaseid" = nCaseid
    ) INTO emailExists;

    IF emailExists AND cPermission = 'N' THEN
        OPEN ref FOR SELECT -1 AS msg,'Email Already Exists' AS value;
        RETURN ref;
    END IF;

    --------------------------------------------------
    -- VALIDATE PARTY IS UNIQUE TO CATEGORY 22
    --------------------------------------------------
    IF nPartyid IS NOT NULL THEN

        IF NOT EXISTS (
            SELECT 1
            FROM "Codemaster"
            WHERE "nCodeid" = nPartyid
              AND "nCategoryid" = 22
        ) THEN
            OPEN ref FOR
            SELECT -1 AS msg,'Invalid Party (not in category 22)' AS value;
            RETURN ref;
        END IF;

      IF NOT EXISTS (
    SELECT 1
    FROM "Codemaster"
    WHERE "nCodeid" = nPartyid
      AND "nCategoryid" = 22
) THEN
    OPEN ref FOR
    SELECT -1 AS msg,'Invalid Party (not in category 22)' AS value;
    RETURN ref;
END IF;

    END IF;

    --------------------------------------------------
    -- INSERT
    --------------------------------------------------
    IF cPermission = 'N' THEN

        INSERT INTO "ContactMaster" (
            "nCaseid","cProfile","cFname","cLname","cEmail",
            "cCountrycode","cMobile","cAlias","cLinkedin",
            "nTZid","cIso","nRoleid","cMentiontag","cOccupation",
            "nPartyid","nCompanyid","cNote","dCreateDt","nUserid","cType"
        )
        VALUES (
            nCaseid,cProfile,cFname,cLname,cEmail,
            cCountrycode,cMobile,cAlias,cLinkedin,
            nTZid,cIso,nRoleid,cMentiontag,cOccupation,
            nPartyid,nCompanyid,cNote,NOW(),nMasterid,cType
        )
        RETURNING "nContactid" INTO nContactid;

        IF nContactid IS NULL THEN
            OPEN ref FOR SELECT -1 AS msg,'Contact insert failed' AS value;
            RETURN ref;
        END IF;

        OPEN ref FOR
        SELECT 1 AS msg,'Contact Inserted' AS value,nContactid AS "nContactid";

    ELSIF cPermission = 'E' THEN

        UPDATE "ContactMaster"
        SET
            "cProfile" = cProfile,
            "cFname" = cFname,
            "cLname" = cLname,
            "cEmail" = cEmail,
            "cCountrycode" = cCountrycode,
            "cMobile" = cMobile,
            "cAlias" = cAlias,
            "cLinkedin" = cLinkedin,
            "nTZid" = nTZid,
            "cIso" = cIso,
            "cMentiontag" = cMentiontag,
            "cOccupation" = cOccupation,
            "nPartyid" = nPartyid,
            "nRoleid" = nRoleid,
            "nCompanyid" = nCompanyid,
            "cNote" = cNote,
            "dUpdateDt" = NOW()
        WHERE "nContactid" = nContactid;

        IF NOT FOUND THEN
            OPEN ref FOR SELECT -1 AS msg,'Contact update failed' AS value;
            RETURN ref;
        END IF;

        OPEN ref FOR
        SELECT 1 AS msg,'Contact Updated' AS value,nContactid AS "nContactid";
    END IF;

    IF cPermission = 'D' THEN
        DELETE FROM "ContactMaster" WHERE "nContactid" = nContactid;

        IF NOT FOUND THEN
            OPEN ref FOR SELECT -1 AS msg,'Contact delete failed' AS value;
            RETURN ref;
        END IF;

        DELETE FROM "BDContacts" WHERE "nContactid" = nContactid;
        DELETE FROM "FMContact"  WHERE "nContactid" = nContactid;

        OPEN ref FOR SELECT 1 AS msg,'Contact Deleted' AS value;
    END IF;

    RETURN ref;
END;
$function$
