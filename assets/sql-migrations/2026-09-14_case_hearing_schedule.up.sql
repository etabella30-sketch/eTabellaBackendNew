-- 2026-09-14_case_hearing_schedule.up.sql
--
-- Adds the case's hearing schedule so the admin can record when a case is
-- going to be heard and every case member's Home page can show it ("Next
-- hearing · 12 Oct 2026 · 10:00 (UTC+04:00) · 5 days").
--
-- Three nullable columns on CaseMaster:
--   "dHearingDt"       timestamp  - hearing start as the VENUE's wall clock (no tz)
--   "cHearingTimezone" varchar    - IANA zone of the venue (e.g. Asia/Dubai); pairs with dHearingDt
--   "nHearingDays"     integer    - scheduled length in days
-- All NULL = no hearing scheduled (existing rows unaffected).
--
-- SP patches (bodies based on the live etabella_tech_uuid functions):
--   et_admin_insertupdate_case - accepts the three keys on create ('N') and edit ('E').
--     The edit path only touches a column when its key is PRESENT in the JSON, so the
--     legacy admin app (which never sends them) cannot wipe a schedule saved by the
--     new admin; the new admin sends all three every time ('' / null clears).
--   et_admin_case_getdetail    - returns the three columns (serves both
--     /case/casedetail (admin) and /case/caseinfo (Home)).
--
-- coreapi DTO CaseModal whitelists the three keys (forbidNonWhitelisted) -> restart
-- coreapi after applying.

-- Safety guard: refuse to run against prod by accident (apply to dev etabella_tech_uuid first).
DO $guard$
BEGIN
    IF current_database() = 'etabella.com.uuid' THEN
        RAISE EXCEPTION 'Refusing to run on prod database % - apply via the release runbook', current_database();
    END IF;
END
$guard$;

BEGIN;

ALTER TABLE "CaseMaster"
  ADD COLUMN IF NOT EXISTS "dHearingDt" timestamp without time zone NULL,
  ADD COLUMN IF NOT EXISTS "cHearingTimezone" character varying NULL,
  ADD COLUMN IF NOT EXISTS "nHearingDays" integer NULL;

COMMENT ON COLUMN "CaseMaster"."dHearingDt" IS
  'Hearing start as the venue''s wall clock (no timezone); interpret in cHearingTimezone. NULL = no hearing scheduled.';
COMMENT ON COLUMN "CaseMaster"."cHearingTimezone" IS
  'IANA timezone of the hearing venue (e.g. Asia/Dubai) for dHearingDt.';
COMMENT ON COLUMN "CaseMaster"."nHearingDays" IS
  'Scheduled hearing length in days, starting on dHearingDt.';

CREATE OR REPLACE FUNCTION public.et_admin_insertupdate_case(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid       uuid;
    nCaseid       uuid;
    cCasename     text;
    cDesc         text;
    permission    text;
    cCaseno       text;
    cClaimant     text;
    cRespondent   text;
    cTClaimant    text;
    cTRespondent  text;
    cIndexheader  text;
    nICid         uuid;
    -- Hearing schedule (2026-09-14): venue wall-clock start, IANA zone, length in days.
    dHearingDt        timestamp;
    cHearingTimezone  text;
    nHearingDays      integer;
BEGIN
    nUserid      := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid      := NULLIF(parameter ->> 'nCaseid','')::uuid;
    cCasename    :=  parameter ->> 'cCasename';
    cDesc        :=  parameter ->> 'cDesc';
    permission   :=  parameter ->> 'permission';
    cCaseno      :=  parameter ->> 'cCaseno';
    cClaimant    :=  parameter ->> 'cClaimant';
    cRespondent  :=  parameter ->> 'cRespondent';
    cTClaimant   :=  parameter ->> 'cTClaimant';
    cTRespondent :=  parameter ->> 'cTRespondent';
    cIndexheader :=  parameter ->> 'cIndexheader';
    dHearingDt       := NULLIF(parameter ->> 'dHearingDt','')::timestamp;
    cHearingTimezone := NULLIF(parameter ->> 'cHearingTimezone','');
    nHearingDays     := NULLIF(parameter ->> 'nHearingDays','')::integer;

    IF permission = 'N' THEN
        IF NOT EXISTS (
            SELECT *
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        ELSE
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
            ) THEN
                INSERT INTO "CaseMaster"(
                    "cCasename","dCreateDt","nCreateId","cDesc","cCaseno",
                    "cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader",
                    "cTranscriptMode",
                    "dHearingDt","cHearingTimezone","nHearingDays"
                )
                VALUES(
                    cCasename, now(), nUserid, cDesc, cCaseno,
                    cClaimant, cRespondent, cTClaimant, cTRespondent, cIndexheader,
                    'HTML',
                    dHearingDt, cHearingTimezone, nHearingDays
                )
                RETURNING "nCaseid" INTO nCaseid;

                INSERT INTO "TeamMaster"(
                    "cTeamname","dCreateDt","nCreateId","nCaseid","cFlag","cClr"
                )
                SELECT
                    "cCodename", now(), nUserid, nCaseid,
                    COALESCE(("jOther"->>'flag')::text, ''),
                    ("jOther"->>'cClr')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 11
              ORDER BY "nSerialno";

                INSERT INTO "SectionMaster"(
                    "cFolder","cIcon","nCaseid","nUserid","cFoldertype","cMsg"
                )
                SELECT
                    "cCodename", "jOther"->>'icon', nCaseid, NULL,
                    "jOther"->>'cFlag', ("jOther"->>'cMsg')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 13
                   AND ("jOther"->>'cFlag')::text IN ('MB','TS')
              ORDER BY "nSerialno";

                INSERT INTO "IssueCategory"(
                    "nCaseid","cCategory","nUserid","dCreateDt","cICtype"
                )
                VALUES(
                    nCaseid, 'Unassigned',
                    null,
                    now(), 'U'
                )
                RETURNING "nICid" INTO nICid;

                INSERT INTO "RIssueMaster"(
                    "cIName","cColor","nICid","nUserid","dCreatedt","nCaseid"
                )
                VALUES(
                    'Unassigned', 'FFA94D',
                    nICid,
                    null,
                    now(), nCaseid
                );

                insert into "RolePermission" ("nPMid","cType","nCaseid","nRoleid","dModifydt")
                select "nPMid",'R',nCaseid,r."nRoleid",now() from "RoleMaster" r
                join "PermissionDefault" pd on pd."nRoleid" = r."nRoleid" where "bStatus" = false ;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case Created' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;

                INSERT INTO public."LogCaseMaster"(
                    "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
                )
                SELECT
                    7, "nCaseid", "cCasename", "cCaseno", nUserid
                  FROM "CaseMaster"
                 WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;
        END IF;
    END IF;

    IF permission = 'E' THEN
        IF EXISTS (
            SELECT 1
              FROM "TeamRelation" t
             WHERE t."nCaseid" = nCaseid
               AND t."nUserid" = nUserid
               AND t."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid
            UNION
            SELECT 1
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE (
                       upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
                   )
                   AND "nCaseid" <> nCaseid
            ) THEN
                UPDATE "CaseMaster"
                   SET "cCasename"  = cCasename,
                       "cCaseno"    = cCaseno,
                       "cDesc"      = cDesc,
                       "cClaimant"  = cClaimant,
                       "cRespondent"= cRespondent,
                       "cTClaimant" = cTClaimant,
                       "cTRespondent"= cTRespondent,
                       "cIndexheader"= cIndexheader,
                       -- Key-presence guarded: a client that does not send the hearing keys
                       -- (the legacy admin app) leaves the stored schedule untouched; the
                       -- new admin always sends them, with '' / null to clear.
                       "dHearingDt"       = CASE WHEN (parameter::jsonb) ? 'dHearingDt'       THEN dHearingDt       ELSE "dHearingDt"       END,
                       "cHearingTimezone" = CASE WHEN (parameter::jsonb) ? 'cHearingTimezone' THEN cHearingTimezone ELSE "cHearingTimezone" END,
                       "nHearingDays"     = CASE WHEN (parameter::jsonb) ? 'nHearingDays'     THEN nHearingDays     ELSE "nHearingDays"     END,
                       "dUpdateDt"  = now(),
                       "nUpdateId"  = nUserid
                 WHERE "nCaseid"   = nCaseid;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case updated' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;

            INSERT INTO public."LogCaseMaster"(
                "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
            )
            SELECT
                8, "nCaseid", "cCasename", "cCaseno", nUserid
              FROM "CaseMaster"
             WHERE "nCaseid" = nCaseid;
        ELSE
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        END IF;
    END IF;

    RETURN ref;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.et_admin_case_getdetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;
isPresent boolean = false;
nPresentid uuid;
nSesid text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;

 select "nSesid"::text into nSesid From "RSessionMaster" where "nCaseid" = nCaseid and "dCreatedt"::date=now()::date and  "cStatus" ='R' order by "dCreatedt" desc limit  1;

if exists(select 1 from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A') then
    isPresent = true;

    select p."nPresentid" into nPresentid from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A';
 end if;

open ref for
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode","bHideBundleColumn","dHearingDt","cHearingTimezone","nHearingDays",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;
    END;
$function$
;

COMMIT;
