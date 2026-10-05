-- 2026-10-03_realtime_sessionlist_bycases.down.sql
--
-- Undo of 2026-10-03_realtime_sessionlist_bycases.sql: puts back et_realtime_combo_sessionlist exactly as it was
-- on etabella_tech_uuid before (body taken with pg_get_functiondef on 2026-10-03), drops the new SP and the index.
-- Undo realtime-server's POST session/getSessionsByCaseIds first (the front end then falls back to one call per case).
-- Dev etabella_tech_uuid only (guard below).

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'realtime_sessionlist_bycases down: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.et_realtime_combo_sessionlist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid; cType text;

BEGIN

nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
cType := NULLIF(parameter ->> 'cType','');

--select * from et_realtime_combo_sessionlist('{"nCaseid":"7f890b75-ffe5-4537-9967-c3c02b407500","nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r');fetch all in "r"
-- select * from "RSessionMaster"
 open ref for

 select r."nSesid","dStartDt",r."cName",r."cStatus",r."isTranscript",
     r."isUploaded",coalesce(r."cProtocol",'C') as "cProtocol"
 From "RSessionMaster" r
 left join "RSessionDetail" rd on rd."nSesid" = r."nSesid"
 and case when nUserid IS NOT NULL then "nUserid" = nUserid else true end
 where case when nCaseid IS NOT NULL then "nCaseid" = nCaseid else true end and r."dDelDt" is null
 and  case when cType IS NOT NULL then "isTranscript" else true end
 and r."cSType" != 'D'
 group by  r."nSesid","dStartDt",r."cName",r."cStatus",r."isTranscript",r."isUploaded",r."cProtocol"
 order by r."dStartDt" desc;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;

DROP FUNCTION IF EXISTS public.et_realtime_combo_sessionlist_bycases(json, refcursor);
DROP INDEX IF EXISTS public.ix_rsessionmaster_ncaseid;

COMMIT;
