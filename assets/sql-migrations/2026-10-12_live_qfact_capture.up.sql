-- QFACT Express: ordinary QFACTs, internal pristine state, and retry receipts.
-- No existing mark is regrouped or converted by this schema migration.
BEGIN;
ALTER TABLE public."FactDetail" ADD COLUMN IF NOT EXISTS "bLiveCapturePristine" boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public."LiveQfactRequest" (
  "nUserid" uuid NOT NULL, "nSesid" uuid NOT NULL, "nRequestid" uuid NOT NULL,
  "cRun" text NOT NULL, "cIdentity" text NOT NULL, "cAction" text NOT NULL CHECK ("cAction" IN ('mark','unmark')),
  "jResult" jsonb NOT NULL, "dCreatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("nUserid","nSesid","nRequestid")
);
CREATE INDEX IF NOT EXISTS live_qfact_coordinates ON public."FactDetail" USING gin ("jCordinates" jsonb_path_ops);
CREATE INDEX IF NOT EXISTS live_qfact_owner_session ON public."FactMaster" ("nUserid","nSesid") WHERE "cFType"='QF';

-- Eligibility is never restored by deleting a note or unassigning an Issue.
-- Only the server's atomic capture operation uses this transaction-local bypass.
CREATE OR REPLACE FUNCTION public.live_qfact_freeze() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid; BEGIN
  IF current_setting('etabella.live_qfact_write',true)='on' THEN
    IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  IF TG_TABLE_NAME='FactDetail' THEN NEW."bLiveCapturePristine":=false; RETURN NEW; END IF;
  IF TG_OP='DELETE' THEN target:=OLD."nFSid"; ELSE target:=NEW."nFSid"; END IF;
  UPDATE public."FactDetail" SET "bLiveCapturePristine"=false WHERE "nFSid"=target AND "bLiveCapturePristine";
  IF TG_OP='UPDATE' AND OLD."nFSid" IS DISTINCT FROM NEW."nFSid" THEN
    UPDATE public."FactDetail" SET "bLiveCapturePristine"=false WHERE "nFSid"=OLD."nFSid" AND "bLiveCapturePristine";
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
DROP TRIGGER IF EXISTS live_qfact_detail_freeze ON public."FactDetail";
CREATE TRIGGER live_qfact_detail_freeze BEFORE UPDATE ON public."FactDetail" FOR EACH ROW EXECUTE FUNCTION public.live_qfact_freeze();
DROP TRIGGER IF EXISTS live_qfact_master_freeze ON public."FactMaster";
CREATE TRIGGER live_qfact_master_freeze AFTER UPDATE ON public."FactMaster" FOR EACH ROW EXECUTE FUNCTION public.live_qfact_freeze();
-- Cover notes, Issues, contacts, shares, tasks, comments and future associations
-- at the storage boundary, so another edit endpoint cannot bypass the safeguard.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t USING (table_schema,table_name)
    WHERE c.table_schema='public' AND c.column_name='nFSid' AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
      AND c.table_name NOT IN ('FactMaster','FactDetail') LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS live_qfact_association_freeze ON public.%I',r.table_name);
    EXECUTE format('CREATE TRIGGER live_qfact_association_freeze AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.live_qfact_freeze()',r.table_name);
  END LOOP;
END $$;
COMMIT;
