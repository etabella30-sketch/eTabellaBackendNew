-- Expand/migrate only: retain every physical legacy row and its history.
-- Stable nFSid=nHid; mapping survives QFACT deletion so retries never resurrect it.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('qfact-express-legacy-migration',0));
LOCK TABLE public."RHighlights", public."RHighlightMapid" IN SHARE ROW EXCLUSIVE MODE;
CREATE INDEX IF NOT EXISTS qfact_legacy_issue_lookup ON public."RHighlightMapid"("nHid");
CREATE INDEX IF NOT EXISTS qfact_legacy_history_lookup ON realtime."RHighlightsLog"("nHid");
CREATE TABLE IF NOT EXISTS public."QfactLegacyConversion" (
  "nHid" uuid PRIMARY KEY, "nFSid" uuid NOT NULL UNIQUE,
  "jLegacyRow" jsonb NOT NULL, "jLegacyIssues" jsonb NOT NULL,
  "jLegacyHistory" jsonb NOT NULL, "jBaseline" jsonb,
  "bActive" boolean NOT NULL DEFAULT true, "dConvertedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."QfactLegacyRoutineBackup" (
  "cRoutine" text PRIMARY KEY, "cDefinition" text NOT NULL
);
CREATE OR REPLACE VIEW public."QfactLegacyHighlights" AS
 SELECT h.* FROM public."RHighlights" h WHERE NOT EXISTS
 (SELECT 1 FROM public."QfactLegacyConversion" m WHERE m."nHid"=h."nHid" AND m."bActive");

CREATE OR REPLACE FUNCTION public.qfact_legacy_int(value text) RETURNS integer
 LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE WHEN value ~ '^[0-9]{1,9}$' THEN CASE WHEN value::bigint>0 THEN value::integer END END
 $$;
CREATE OR REPLACE FUNCTION public.qfact_legacy_coordinates(row_data jsonb, published boolean DEFAULT false)
 RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT jsonb_agg(item || jsonb_strip_nulls(jsonb_build_object(
   'p',CASE WHEN published THEN public.qfact_legacy_int(row_data->>'cTPageno')
     ELSE COALESCE(public.qfact_legacy_int(item->>'p'),public.qfact_legacy_int(row_data->>'cPageno'),public.qfact_legacy_int(row_data->>'oP')) END,
   'l',CASE WHEN published THEN public.qfact_legacy_int(row_data->>'cTLineno')
     ELSE COALESCE(public.qfact_legacy_int(item->>'l'),public.qfact_legacy_int(row_data->>'cLineno'),public.qfact_legacy_int(row_data->>'oL')) END,
   'oP',COALESCE(public.qfact_legacy_int(item->>'oP'),public.qfact_legacy_int(row_data->>'oP'),public.qfact_legacy_int(row_data->>'cOPageno')),
   'oL',COALESCE(public.qfact_legacy_int(item->>'oL'),public.qfact_legacy_int(row_data->>'oL'),public.qfact_legacy_int(row_data->>'cOLineno')),
   'identity',CASE WHEN published THEN COALESCE(NULLIF(row_data->>'tidentity',''),item->>'identity') ELSE COALESCE(item->>'identity',row_data->>'identity') END,
   't',CASE WHEN published THEN COALESCE(NULLIF(row_data->>'cTTime',''),item->>'t') ELSE COALESCE(item->>'t',row_data->>'cTime') END,
   'text',COALESCE(item->>'text',row_data->>'cNote'),
   'otext',COALESCE(item->>'otext',item->>'text',row_data->>'cNote')) ) ORDER BY ordinal)
 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(row_data->'jCordinates')='array' AND jsonb_array_length(row_data->'jCordinates')>0
   THEN row_data->'jCordinates' ELSE '[{}]'::jsonb END) WITH ORDINALITY AS a(item,ordinal)
 $$;
CREATE OR REPLACE FUNCTION public.qfact_legacy_snapshot(fact_id uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT jsonb_build_object('master',to_jsonb(m),'detail',to_jsonb(d),'issues',COALESCE(
   (SELECT jsonb_agg(to_jsonb(i) ORDER BY i."nFMIid") FROM public."FMIssue" i WHERE i."nFSid"=fact_id),'[]'::jsonb))
 FROM public."FactMaster" m JOIN public."FactDetail" d ON d."nFSid"=m."nFSid" WHERE m."nFSid"=fact_id
 $$;
CREATE OR REPLACE FUNCTION public.qfact_legacy_rollback_one(fact_id uuid) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE r record; association_exists boolean; t record; BEGIN
 SELECT * INTO r FROM public."QfactLegacyConversion" WHERE "nFSid"=fact_id AND "bActive" FOR UPDATE;
 IF NOT FOUND OR public.qfact_legacy_snapshot(fact_id) IS DISTINCT FROM r."jBaseline" THEN RETURN false; END IF;
 FOR t IN SELECT DISTINCT c.table_schema,c.table_name FROM information_schema.columns c
   JOIN information_schema.tables i USING(table_schema,table_name)
   WHERE c.column_name='nFSid' AND c.udt_name='uuid' AND i.table_type='BASE TABLE'
     AND (c.table_schema,c.table_name) NOT IN (('public','FactMaster'),('public','FactDetail'),('public','FMIssue'),('public','QfactLegacyConversion')) LOOP
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.%I WHERE "nFSid"=$1)',t.table_schema,t.table_name) INTO association_exists USING fact_id;
   IF association_exists THEN RETURN false; END IF;
 END LOOP;
 DELETE FROM public."FMIssue" WHERE "nFSid"=fact_id;
 DELETE FROM public."FactDetail" WHERE "nFSid"=fact_id;
 DELETE FROM public."FactMaster" WHERE "nFSid"=fact_id;
 UPDATE public."QfactLegacyConversion" SET "bActive"=false WHERE "nFSid"=fact_id;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.qfact_legacy_convert_one(legacy_id uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE h public."RHighlights"%ROWTYPE; archived jsonb; history jsonb; original jsonb; coords jsonb; final_coords jsonb; issue_rows jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public."QfactLegacyConversion" WHERE "nHid"=legacy_id AND "bActive") THEN RETURN legacy_id; END IF;
 SELECT * INTO h FROM public."RHighlights" WHERE "nHid"=legacy_id FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public."FactMaster" WHERE "nFSid"=legacy_id) THEN
   RAISE EXCEPTION 'QFACT legacy UUID collision: %. No legacy records were changed.',legacy_id; END IF;
 archived:=to_jsonb(h);
 SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i."nMapid"),'[]'::jsonb) INTO issue_rows FROM public."RHighlightMapid" i WHERE i."nHid"=legacy_id;
 SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY to_jsonb(l)::text),'[]'::jsonb) INTO history FROM realtime."RHighlightsLog" l WHERE l."nHid"=legacy_id;
 SELECT to_jsonb(l) INTO original FROM realtime."RHighlightsLog" l WHERE l."nHid"=legacy_id AND l."bIsOrg"=true ORDER BY to_jsonb(l)::text LIMIT 1;
 coords:=public.qfact_legacy_coordinates(archived,false);
 -- Legacy published lines have scalar final anchors even when jTCordinates was never populated.
 final_coords:=CASE WHEN h."cTransferStatus" IS DISTINCT FROM 'O' AND public.qfact_legacy_int(h."cTPageno") IS NOT NULL
   THEN COALESCE(h."jTCordinates",public.qfact_legacy_coordinates(archived,true)) END;
 INSERT INTO public."FactMaster"("nFSid","nUserid","nCaseid","nSesid","cFType","cFFrom","dCreateDt")
 VALUES(legacy_id,h."nUserid",COALESCE(h."nCaseid",(SELECT "nCaseid" FROM public."RSessionMaster" WHERE "nSesid"=h."nSessionId")),h."nSessionId",'QF','RT',h."dCreatedt");
 INSERT INTO public."FactDetail"("nFSid","jOT","jTexts","cIsNote","bIsHighlighted","nColorid","jCordinates","jOCordinates","jTCordinates",
   "nPage","nLine","nTPage","nTLine","cTransferStatus","bLiveCapturePristine")
 VALUES(legacy_id,jsonb_build_array(COALESCE(NULLIF(h."cNote",''),(SELECT string_agg(COALESCE(e->>'otext',e->>'text'),'\n') FROM jsonb_array_elements(coords) e))),'[]'::jsonb,'N',false,h."nLID",coords,
   CASE WHEN original IS NOT NULL THEN public.qfact_legacy_coordinates(original,false) ELSE coords END,final_coords,
   public.qfact_legacy_int(h."cPageno"),public.qfact_legacy_int(h."cLineno"),public.qfact_legacy_int(h."cTPageno"),public.qfact_legacy_int(h."cTLineno"),h."cTransferStatus",false);
 INSERT INTO public."FMIssue"("nFSid","nIssueid","nImpactid","nRelevanceid")
 SELECT legacy_id,issue_id,0,0 FROM (
   SELECT "nIid" issue_id FROM public."RHighlightMapid" WHERE "nHid"=legacy_id
   UNION SELECT h."nLID") i WHERE issue_id IS NOT NULL;
 INSERT INTO public."QfactLegacyConversion"("nHid","nFSid","jLegacyRow","jLegacyIssues","jLegacyHistory","jBaseline")
 VALUES(legacy_id,legacy_id,archived,issue_rows,history,public.qfact_legacy_snapshot(legacy_id))
 ON CONFLICT("nHid") DO UPDATE SET "bActive"=true,"jBaseline"=EXCLUDED."jBaseline","dConvertedAt"=now();
 RETURN legacy_id;
END $$;
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT "nHid" FROM public."RHighlights" ORDER BY "nHid" LOOP PERFORM public.qfact_legacy_convert_one(r."nHid"); END LOOP;
END $$;

-- All legacy reads/writes see only unconverted rows. Originals remain physical
-- and immutable through these application routines, including case-wide Issue operations.
DO $$ DECLARE r record; original text; patched text; BEGIN
 FOR r IN SELECT p.oid,n.nspname,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.prokind='f' AND n.nspname IN ('public','realtime') AND p.proname NOT LIKE 'qfact_%' LOOP
   original:=pg_get_functiondef(r.oid);
   IF position('"RHighlights"' IN original)>0 THEN
     INSERT INTO public."QfactLegacyRoutineBackup" VALUES(r.oid::regprocedure::text,original) ON CONFLICT DO NOTHING;
     patched:=replace(original,'"RHighlights"','"QfactLegacyHighlights"');
     EXECUTE patched;
   END IF;
 END LOOP;
END $$;

-- A mixed-version client still calling the legacy insert creates an ordinary QFACT,
-- with the same returned UUID. Associated Issue rows may follow in the same transaction.
CREATE OR REPLACE FUNCTION public.qfact_legacy_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN PERFORM public.qfact_legacy_convert_one(NEW."nHid"); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS qfact_legacy_insert ON public."RHighlights";
CREATE TRIGGER qfact_legacy_insert AFTER INSERT ON public."RHighlights" FOR EACH ROW EXECUTE FUNCTION public.qfact_legacy_insert();
CREATE OR REPLACE FUNCTION public.qfact_legacy_issue_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."nIid" IS NOT NULL AND EXISTS(SELECT 1 FROM public."QfactLegacyConversion" WHERE "nHid"=NEW."nHid" AND "bActive" AND "dConvertedAt"=transaction_timestamp()) THEN
   INSERT INTO public."FMIssue"("nFSid","nIssueid","nImpactid","nRelevanceid") SELECT NEW."nHid",NEW."nIid",0,0
   WHERE NOT EXISTS(SELECT 1 FROM public."FMIssue" WHERE "nFSid"=NEW."nHid" AND "nIssueid"=NEW."nIid");
   UPDATE public."QfactLegacyConversion" SET "jBaseline"=public.qfact_legacy_snapshot(NEW."nHid"),
     "jLegacyIssues"=(SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i."nMapid"),'[]'::jsonb) FROM public."RHighlightMapid" i WHERE i."nHid"=NEW."nHid") WHERE "nHid"=NEW."nHid";
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS qfact_legacy_issue_insert ON public."RHighlightMapid";
CREATE TRIGGER qfact_legacy_issue_insert AFTER INSERT ON public."RHighlightMapid" FOR EACH ROW EXECUTE FUNCTION public.qfact_legacy_issue_insert();

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public."RHighlights" h LEFT JOIN public."QfactLegacyConversion" m ON m."nHid"=h."nHid"
   LEFT JOIN public."FactMaster" f ON f."nFSid"=m."nFSid" WHERE m."nHid" IS NULL OR (m."bActive" AND f."nFSid" IS NULL AND m."jBaseline" IS NULL)) THEN
   RAISE EXCEPTION 'Legacy conversion verification failed'; END IF;
END $$;
COMMIT;
