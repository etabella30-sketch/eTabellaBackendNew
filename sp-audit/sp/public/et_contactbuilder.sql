CREATE OR REPLACE FUNCTION public.et_contactbuilder(parameter json, ref refcursor)
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
    emailExists  boolean := false;
    mobileExists boolean := false;
    cType        text;

BEGIN
    ----------------------------------------------------
    -- READ PARAMETERS
    ----------------------------------------------------
    nMasterid := (parameter ->> 'nMasterid')::uuid;
    nCaseid   := (parameter ->> 'nCaseid')::uuid;
    nContactid:= (parameter ->> 'nContactid')::uuid;

    cProfile  := parameter ->> 'cProfile';
    cFname    := parameter ->> 'cFname';
    cLname    := parameter ->> 'cLname';
    cAlias    := parameter ->> 'cAlias';
    cLinkedin := parameter ->> 'cLinkedin';

    cEmail    := parameter ->> 'cEmail';
    cCountrycode := parameter ->> 'cCountrycode';
    cMobile   := parameter ->> 'cMobile';

    nRoleid   := (parameter ->> 'nRoleid')::uuid;
    nCompanyid:= (parameter ->> 'nCompanyid')::uuid;
    cNote     := parameter ->> 'cNote';
    nTZid     := (parameter ->> 'nTZid')::integer;
    cIso      := parameter ->> 'cIso';

    cPermission := parameter ->> 'permission';

    cType := COALESCE(NULLIF(parameter ->> 'cType', ''), 'C');

    ----------------------------------------------------
    -- NORMALIZE INPUT
    ----------------------------------------------------
    cEmail  := NULLIF(TRIM(cEmail), '');
    cMobile := NULLIF(TRIM(cMobile), '');

    ----------------------------------------------------
    -- DELETE PATH (EXCLUSIVE)
    ----------------------------------------------------
    IF cPermission = 'D' THEN

        DELETE FROM "BDContacts"    WHERE "nContactid" = nContactid;
        DELETE FROM "FMContact"     WHERE "nContactid" = nContactid;
        DELETE FROM "ContactMaster" WHERE "nContactid" = nContactid;

        OPEN ref FOR SELECT 1 AS msg,'Contact Deleted' AS value;
        RETURN ref;
    END IF;

    ----------------------------------------------------
    -- VALIDATION FOR NEW
    ----------------------------------------------------
    IF cPermission = 'N' AND cEmail IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg,'Email is required' AS value;
        RETURN ref;
    END IF;

    ----------------------------------------------------
    -- DUPLICATE CHECK - EMAIL
    ----------------------------------------------------
    IF cEmail IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM "ContactMaster"
           WHERE UPPER(TRIM("cEmail")) = UPPER(TRIM(cEmail))
             AND "nCaseid" = nCaseid
             AND (
                 cPermission = 'N'
                 OR "nContactid" <> COALESCE(nContactid,'00000000-0000-0000-0000-000000000000')
             )
        ) INTO emailExists;
    END IF;

    ----------------------------------------------------
    -- DUPLICATE CHECK - MOBILE
    ----------------------------------------------------
    IF cMobile IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM "ContactMaster"
           WHERE "cMobile" = cMobile
             AND "nCaseid" = nCaseid
             AND "cCountrycode" = cCountrycode
             AND (
                 cPermission = 'N'
                 OR "nContactid" <> COALESCE(nContactid,'00000000-0000-0000-0000-000000000000')
             )
        ) INTO mobileExists;
    END IF;

    ----------------------------------------------------
    -- RESPONSES
    ----------------------------------------------------
    IF emailExists THEN
        OPEN ref FOR SELECT -1 AS msg,'Email Already Exists' AS value;
        RETURN ref;

    ELSIF mobileExists THEN
        OPEN ref FOR SELECT -1 AS msg,'Mobile Already Exists' AS value;
        RETURN ref;
    END IF;

    ----------------------------------------------------
    -- INSERT NEW
    ----------------------------------------------------
    IF cPermission = 'N' THEN

        INSERT INTO "ContactMaster" (
            "nCaseid","cProfile","cFname","cLname","cAlias","cLinkedin",
            "cEmail","cCountrycode","cMobile","nTZid","nRoleid",
            "nCompanyid","cNote","cIso","dCreateDt","nUserid","cType"
        )
        VALUES (
            nCaseid,cProfile,cFname,cLname,cAlias,cLinkedin,
            cEmail,cCountrycode,cMobile,nTZid,nRoleid,
            nCompanyid,cNote,cIso,NOW(),nMasterid,cType
        )
        RETURNING "nContactid" INTO nContactid;

        OPEN ref FOR 
        SELECT 1 AS msg,'Contact Inserted' AS value,nContactid AS "nContactid";
        RETURN ref;

    ----------------------------------------------------
    -- UPDATE EXISTING
    ----------------------------------------------------
    ELSIF cPermission = 'E' THEN

        UPDATE "ContactMaster"
        SET 
           "cProfile"  = cProfile,
           "cFname"    = cFname,
           "cLname"    = cLname,
           "cAlias"    = cAlias,
           "cLinkedin" = cLinkedin,
           "cEmail"    = cEmail,
           "cCountrycode" = cCountrycode,
           "cMobile"   = cMobile,
           "nTZid"     = nTZid,
           "nRoleid"   = nRoleid,
           "nCompanyid"= nCompanyid,
           "cNote"     = cNote,
           "dUpdateDt" = NOW(),
           "cIso"      = cIso
        WHERE "nContactid" = nContactid;

        OPEN ref FOR 
        SELECT 1 AS msg,'Contact Updated' AS value,nContactid AS "nContactid";
        RETURN ref;

    END IF;

    RETURN ref;
END;
$function$
