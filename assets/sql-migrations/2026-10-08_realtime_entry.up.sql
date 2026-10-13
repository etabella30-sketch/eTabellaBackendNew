-- Realtime entry: apply before realtime-server/frontend. Does not end or delete any session.
-- Preflight lists every conflicting case; an operator must identify/close stale sessions first.
-- Historical hearing-day identities are frozen here; future scheduling never rewrites them.
BEGIN;
DO $$ DECLARE conflicts text; BEGIN
  SELECT string_agg(x."nCaseid"::text, ', ') INTO conflicts FROM
    (SELECT "nCaseid" FROM public."RSessionMaster" WHERE "cStatus"='R' AND "dDelDt" IS NULL
      GROUP BY "nCaseid" HAVING count(*)>1) x;
  IF conflicts IS NOT NULL THEN RAISE EXCEPTION 'Multiple live sessions exist. Review and close stale sessions in cases: %', conflicts; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public."RealtimeHearingDay" (
  "nCaseid" uuid NOT NULL REFERENCES public."CaseMaster"("nCaseid"),
  "dDate" date NOT NULL, "nDay" integer NOT NULL CHECK ("nDay">0),
  PRIMARY KEY ("nCaseid","dDate"), UNIQUE ("nCaseid","nDay")
);
ALTER TABLE public."RSessionMaster" ADD COLUMN IF NOT EXISTS "nEntryEventid" uuid;
ALTER TABLE public."RSessionMaster" ADD COLUMN IF NOT EXISTS "dEntryStartedAt" timestamptz;
ALTER TABLE public."RSessionMaster" ADD COLUMN IF NOT EXISTS "dEntryEndedAt" timestamptz;
ALTER TABLE public."RSessionMaster" ADD COLUMN IF NOT EXISTS "dHearingDay" date;

CREATE TABLE IF NOT EXISTS public."RealtimeAvailabilityEvent" (
  "nEventid" uuid PRIMARY KEY, "nSesid" uuid NOT NULL REFERENCES public."RSessionMaster"("nSesid"),
  "nCaseid" uuid NOT NULL REFERENCES public."CaseMaster"("nCaseid"), "dAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."RealtimeAvailabilityNotification" (
  "nNotificationid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nEventid" uuid NOT NULL REFERENCES public."RealtimeAvailabilityEvent"("nEventid"),
  "nUserid" uuid NOT NULL REFERENCES public."UserMaster"("nUserid"),
  "dAt" timestamptz NOT NULL DEFAULT now(), "bSeen" boolean NOT NULL DEFAULT false,
  "bDismissed" boolean NOT NULL DEFAULT false, UNIQUE ("nEventid","nUserid")
);
CREATE INDEX IF NOT EXISTS "RealtimeAvailabilityNotification_user" ON public."RealtimeAvailabilityNotification"("nUserid","dAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "RSessionMaster_one_live_per_case" ON public."RSessionMaster"("nCaseid") WHERE "cStatus"='R' AND "dDelDt" IS NULL;

-- A current live session or associated transcript/feed establishes a used hearing date.
-- C/P status alone is not proof of actual activity (a planned session can be cancelled).
UPDATE public."RSessionMaster" r SET "dHearingDay"=CASE WHEN z.case_zone IS NOT NULL AND z.session_zone IS NOT NULL
 THEN (r."dStartDt" AT TIME ZONE z.session_zone AT TIME ZONE z.case_zone)::date ELSE r."dStartDt"::date END
 FROM (SELECT s."nSesid",cz.name AS case_zone,sz.name AS session_zone FROM public."RSessionMaster" s
 JOIN public."CaseMaster" c ON c."nCaseid"=s."nCaseid"
 LEFT JOIN pg_timezone_names cz ON cz.name=c."cHearingTimezone" LEFT JOIN pg_timezone_names sz ON sz.name=s."cTimezone") z
 WHERE r."nSesid"=z."nSesid" AND "dHearingDay" IS NULL AND "dStartDt" IS NOT NULL
   AND (r."cStatus"='R' OR r."isTranscript" IS TRUE OR r."nAppliedRawSeq">0 OR r."nFinalLines">0);
WITH historical AS (
 SELECT DISTINCT "nCaseid","dHearingDay" AS day FROM public."RSessionMaster" WHERE "dHearingDay" IS NOT NULL
), dates AS (
 SELECT "nCaseid",day FROM historical UNION
 SELECT c."nCaseid",c."dHearingDt"::date+i FROM public."CaseMaster" c
 CROSS JOIN LATERAL generate_series(0,LEAST(GREATEST(COALESCE(c."nHearingDays",0),0),3660)-1) i
 WHERE c."dHearingDt" IS NOT NULL AND EXISTS (SELECT 1 FROM historical h WHERE h."nCaseid"=c."nCaseid")
), numbered AS (
 SELECT "nCaseid",day,row_number() OVER(PARTITION BY "nCaseid" ORDER BY day)::int AS number FROM dates
)
INSERT INTO public."RealtimeHearingDay" ("nCaseid","dDate","nDay")
SELECT d."nCaseid",d.day,n.number FROM historical d JOIN numbered n ON n."nCaseid"=d."nCaseid" AND n.day=d.day
WHERE NOT EXISTS (SELECT 1 FROM public."RealtimeHearingDay" h WHERE h."nCaseid"=d."nCaseid")
ON CONFLICT DO NOTHING;
UPDATE public."RSessionMaster" r SET "nEntryEventid"=COALESCE("nEntryEventid",gen_random_uuid()),
 "dEntryStartedAt"=COALESCE("dEntryStartedAt",now()) WHERE "cStatus"='R' AND "dDelDt" IS NULL;

CREATE OR REPLACE FUNCTION public.rt_entry_eligible(p_session uuid,p_user uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
 SELECT EXISTS (SELECT 1 FROM public."RSessionMaster" r JOIN public."UserMaster" u ON u."nUserid"=p_user
 WHERE r."nSesid"=p_session AND r."dDelDt" IS NULL AND
   (u."isAdmin" IS TRUE OR EXISTS (SELECT 1 FROM public."TeamRelation" t WHERE t."nCaseid"=r."nCaseid" AND t."nUserid"=p_user AND t."cStatus"='A')
    OR EXISTS (SELECT 1 FROM public."RSessionDetail" d WHERE d."nSesid"=r."nSesid" AND d."nUserid"=p_user AND d."dDelDt" IS NULL)))
$$;

CREATE OR REPLACE FUNCTION public.rt_entry_notify(p_session uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record; BEGIN
 SELECT * INTO r FROM public."RSessionMaster" WHERE "nSesid"=p_session AND "cStatus"='R' AND "dDelDt" IS NULL;
 IF r."nEntryEventid" IS NULL THEN RETURN; END IF;
 INSERT INTO public."RealtimeAvailabilityEvent"("nEventid","nSesid","nCaseid","dAt")
 VALUES(r."nEntryEventid",r."nSesid",r."nCaseid",r."dEntryStartedAt") ON CONFLICT DO NOTHING;
 INSERT INTO public."RealtimeAvailabilityNotification"("nEventid","nUserid")
 SELECT r."nEntryEventid",u."nUserid" FROM public."UserMaster" u WHERE public.rt_entry_eligible(p_session,u."nUserid")
 ON CONFLICT ("nEventid","nUserid") DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.rt_entry_session_before() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c record; zone text; session_zone text; actual_date date; day_number int; last_date date; last_number int; pending_days int; starts_live boolean; BEGIN
 IF TG_OP='UPDATE' AND OLD."dEntryStartedAt" IS NOT NULL AND NEW."nCaseid" IS DISTINCT FROM OLD."nCaseid" THEN
   RAISE EXCEPTION 'A used Realtime session cannot be moved into another case' USING ERRCODE='23514';
 END IF;
 starts_live:=NEW."cStatus"='R' AND NEW."dDelDt" IS NULL AND
   (TG_OP='INSERT' OR OLD."cStatus" IS DISTINCT FROM 'R' OR OLD."dDelDt" IS NOT NULL);
 IF starts_live OR (NEW."dHearingDay" IS NULL AND NEW."dStartDt" IS NOT NULL AND
   (NEW."isTranscript" IS TRUE OR NEW."nAppliedRawSeq">0 OR NEW."nFinalLines">0)) THEN
   SELECT * INTO c FROM public."CaseMaster" WHERE "nCaseid"=NEW."nCaseid" FOR UPDATE;
   IF starts_live AND EXISTS (SELECT 1 FROM public."RSessionMaster" r WHERE r."nCaseid"=NEW."nCaseid" AND r."nSesid"<>NEW."nSesid" AND r."cStatus"='R' AND r."dDelDt" IS NULL)
   THEN RAISE EXCEPTION 'A Realtime session is already active for this case' USING ERRCODE='23505'; END IF;
   SELECT name INTO zone FROM pg_timezone_names WHERE name=COALESCE(c."cHearingTimezone",NEW."cTimezone");
   SELECT name INTO session_zone FROM pg_timezone_names WHERE name=NEW."cTimezone";
   actual_date:=COALESCE(NEW."dHearingDay",CASE WHEN zone IS NOT NULL AND session_zone IS NOT NULL
     THEN (NEW."dStartDt" AT TIME ZONE session_zone AT TIME ZONE zone)::date ELSE NEW."dStartDt"::date END,
     CASE WHEN zone IS NOT NULL THEN (now() AT TIME ZONE zone)::date END);
   IF actual_date IS NOT NULL THEN
   SELECT "nDay" INTO day_number FROM public."RealtimeHearingDay" WHERE "nCaseid"=NEW."nCaseid" AND "dDate"=actual_date;
   IF day_number IS NULL THEN
     SELECT COALESCE(max("nDay"),0),max("dDate") INTO last_number,last_date
     FROM public."RealtimeHearingDay" WHERE "nCaseid"=NEW."nCaseid";
     SELECT count(*) INTO pending_days FROM generate_series(0,LEAST(GREATEST(COALESCE(c."nHearingDays",0),0),3660)-1) i
      WHERE c."dHearingDt" IS NOT NULL AND c."dHearingDt"::date+i<=actual_date
        AND (last_date IS NULL OR (actual_date>last_date AND c."dHearingDt"::date+i>last_date)
          OR (actual_date<last_date AND NOT EXISTS (SELECT 1 FROM public."RealtimeHearingDay" h
            WHERE h."nCaseid"=NEW."nCaseid" AND h."dDate"=c."dHearingDt"::date+i)));
     day_number:=last_number+GREATEST(pending_days,1);
     INSERT INTO public."RealtimeHearingDay" VALUES(NEW."nCaseid",actual_date,day_number);
   END IF;
   NEW."dHearingDay":=actual_date;
   END IF;
   IF starts_live THEN NEW."nEntryEventid":=gen_random_uuid(); NEW."dEntryStartedAt":=now(); NEW."dEntryEndedAt":=NULL; END IF;
 END IF;
 IF TG_OP='UPDATE' AND OLD."cStatus"='R' AND (NEW."cStatus"<>'R' OR NEW."dDelDt" IS NOT NULL) THEN
   NEW."dEntryEndedAt":=now();
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.rt_entry_session_after() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN PERFORM public.rt_entry_notify(NEW."nSesid"); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.rt_entry_membership_after() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target record; BEGIN
 IF TG_TABLE_NAME='RSessionDetail' THEN PERFORM public.rt_entry_notify(NEW."nSesid");
 ELSIF TG_TABLE_NAME='TeamRelation' THEN
   FOR target IN SELECT "nSesid" FROM public."RSessionMaster" WHERE "nCaseid"=NEW."nCaseid" AND "cStatus"='R' AND "dDelDt" IS NULL LOOP
     PERFORM public.rt_entry_notify(target."nSesid"); END LOOP;
 ELSIF NEW."isAdmin" IS TRUE THEN
   FOR target IN SELECT "nSesid" FROM public."RSessionMaster" WHERE "cStatus"='R' AND "dDelDt" IS NULL LOOP
     PERFORM public.rt_entry_notify(target."nSesid"); END LOOP;
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rt_entry_session_before ON public."RSessionMaster";
CREATE TRIGGER rt_entry_session_before BEFORE INSERT OR UPDATE OF "cStatus","dDelDt","nCaseid","isTranscript","nAppliedRawSeq","nFinalLines" ON public."RSessionMaster" FOR EACH ROW EXECUTE FUNCTION public.rt_entry_session_before();
DROP TRIGGER IF EXISTS rt_entry_session_after ON public."RSessionMaster";
CREATE TRIGGER rt_entry_session_after AFTER INSERT OR UPDATE OF "cStatus","dDelDt" ON public."RSessionMaster" FOR EACH ROW EXECUTE FUNCTION public.rt_entry_session_after();
DROP TRIGGER IF EXISTS rt_entry_assignment_after ON public."RSessionDetail";
CREATE TRIGGER rt_entry_assignment_after AFTER INSERT OR UPDATE ON public."RSessionDetail" FOR EACH ROW EXECUTE FUNCTION public.rt_entry_membership_after();
DROP TRIGGER IF EXISTS rt_entry_team_after ON public."TeamRelation";
CREATE TRIGGER rt_entry_team_after AFTER INSERT OR UPDATE ON public."TeamRelation" FOR EACH ROW EXECUTE FUNCTION public.rt_entry_membership_after();
DROP TRIGGER IF EXISTS rt_entry_admin_after ON public."UserMaster";
CREATE TRIGGER rt_entry_admin_after AFTER INSERT OR UPDATE OF "isAdmin" ON public."UserMaster" FOR EACH ROW EXECUTE FUNCTION public.rt_entry_membership_after();
-- Seed exactly one event/notification for sessions already active at deployment.
DO $$ DECLARE r record; BEGIN FOR r IN SELECT "nSesid" FROM public."RSessionMaster" WHERE "cStatus"='R' AND "dDelDt" IS NULL LOOP
 PERFORM public.rt_entry_notify(r."nSesid"); END LOOP; END $$;
COMMIT;
