-- 2026-10-06_fact_get_contact_email.sql
--
-- Phase 7b of the shared-libraries plan, item 1 (approved 2026-10-06): the realtime schema is the canonical fact
-- schema (D8). realtime.et_fact_get_contact answers the Full Fact editor's participant list with the mention tag,
-- role, party, company and occupation that public.et_fact_get_contact lacks, but it dropped the contact's e-mail,
-- which the coreapi route fact/factcontact (Fact Workspace) still gets from the public variant today. Adding
-- cm."cEmail" here makes the realtime variant a strict superset, so coreapi can switch to it with zero loss.
-- Same signature and existing columns: CREATE OR REPLACE, no restart.
--
-- Apply to dev etabella_tech_uuid only (guard below). Idempotent. Prod is the operator's.
-- Check: 2026-10-06_fact_get_contact_email.test.sql. Undo: 2026-10-06_fact_get_contact_email.down.sql.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'fact_get_contact_email: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
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
        -- 2026-10-06 (7b item 1): + cm."cEmail", the one column public.et_fact_get_contact had and this one lacked.
        select fc."nFSid",fc."nFMCid",fc."nContactid",
        cm."cFname",cm."cLname",cm."cProfile",
        cm."cEmail",
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
