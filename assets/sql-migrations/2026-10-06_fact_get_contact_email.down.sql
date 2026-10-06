-- 2026-10-06_fact_get_contact_email.down.sql
--
-- Undo of 2026-10-06_fact_get_contact_email.sql: the realtime.et_fact_get_contact body without cm."cEmail".
-- Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'fact_get_contact_email down: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION realtime.et_fact_get_contact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;nMasterid uuid;
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

        open ref for
        select fc."nFSid",fc."nFMCid",fc."nContactid",
        cm."cFname",cm."cLname",cm."cProfile",
        cm."cMentiontag",
        cr."cRole",
        pr."cCodename" "cPartyname",
        cc."cCompany",
        cm."cOccupation"
        from "FMContact" fc
        join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
        LEFT JOIN "ContactRole" cr ON cr."nCRoleid" = cm."nRoleid"
        LEFT JOIN "ContactCompany" cc ON cc."nCompanyid" = cm."nCompanyid"
        LEFT JOIN "Codemaster" pr ON pr."nCodeid" = cm."nPartyid"
        where fc."nFSid"  = nFSid;

        RETURN ref;

END;
$function$;

COMMIT;
