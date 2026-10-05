-- 2026-10-03_realtime_sessionlist_bycases.sql
--
-- RT Production (/admin/realtime) load time. The page asked realtime-server for one case's session list per case
-- (GET session/getSessionsByCaseId, about 100 requests for a global admin), each one et_realtime_combo_sessionlist.
-- The SQL was never the slow part (1.5 ms per case, all 103 dev cases 62 ms); the request count was. This file
-- adds the SP behind the new POST session/getSessionsByCaseIds (many cases, one request) and tidies the old one.
--
--   et_realtime_combo_sessionlist_bycases(json, refcursor)   NEW. {"nCaseids":[uuid...], "cType"?}: every listed
--       case's sessions in one cursor, the same rows and filters as et_realtime_combo_sessionlist plus "nCaseid",
--       ordered by case, then "dStartDt" newest first. Access is checked by realtime-server before the call.
--   et_realtime_combo_sessionlist(json, refcursor)            TIDIED. It LEFT JOINed "RSessionDetail" (by nUserid)
--       and selected none of its columns, then GROUP BY'd the duplicates away. The join and the GROUP BY are gone;
--       the rows, columns and order are the same (nSesid is the primary key). nUserid is still accepted and unused.
--   ix_rsessionmaster_ncaseid                                 NEW partial index ("nCaseid") WHERE "dDelDt" IS NULL.
--
-- Same signatures and return types: CREATE OR REPLACE is enough. SymmetricDS: nothing here writes a row.
-- Apply to dev etabella_tech_uuid only (guard below). Idempotent: safe to re-run.
-- Undo: 2026-10-03_realtime_sessionlist_bycases.down.sql.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'realtime_sessionlist_bycases: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

CREATE INDEX IF NOT EXISTS ix_rsessionmaster_ncaseid ON public."RSessionMaster" ("nCaseid") WHERE "dDelDt" IS NULL;

CREATE OR REPLACE FUNCTION public.et_realtime_combo_sessionlist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid; cType text;

BEGIN

nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;  -- accepted, unused (the RSessionDetail join selected nothing)
cType := NULLIF(parameter ->> 'cType','');

--select * from et_realtime_combo_sessionlist('{"nCaseid":"7f890b75-ffe5-4537-9967-c3c02b407500","nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r');fetch all in "r"
 open ref for

 select r."nSesid",r."dStartDt",r."cName",r."cStatus",r."isTranscript",
     r."isUploaded",coalesce(r."cProtocol",'C') as "cProtocol"
 From "RSessionMaster" r
 where case when nCaseid IS NOT NULL then r."nCaseid" = nCaseid else true end and r."dDelDt" is null
 and  case when cType IS NOT NULL then r."isTranscript" else true end
 and r."cSType" != 'D'
 order by r."dStartDt" desc;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;

CREATE OR REPLACE FUNCTION public.et_realtime_combo_sessionlist_bycases(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseids uuid[]; cType text;

BEGIN

-- select * from et_realtime_combo_sessionlist_bycases('{"nCaseids":["7f890b75-ffe5-4537-9967-c3c02b407500"]}','r');fetch all in "r"
nCaseids := ARRAY(SELECT DISTINCT NULLIF(v, '')::uuid
                    FROM json_array_elements_text(CASE WHEN json_typeof(parameter -> 'nCaseids') = 'array'
                                                       THEN parameter -> 'nCaseids' ELSE '[]'::json END) AS e(v)
                   WHERE NULLIF(v, '') IS NOT NULL);
cType := NULLIF(parameter ->> 'cType','');

 open ref for

 select r."nCaseid",r."nSesid",r."dStartDt",r."cName",r."cStatus",r."isTranscript",
     r."isUploaded",coalesce(r."cProtocol",'C') as "cProtocol"
 From "RSessionMaster" r
 where r."nCaseid" = ANY(nCaseids) and r."dDelDt" is null
 and  case when cType IS NOT NULL then r."isTranscript" else true end
 and r."cSType" != 'D'
 order by r."nCaseid", r."dStartDt" desc;

 RETURN ref;
    END;
$function$;

COMMIT;
