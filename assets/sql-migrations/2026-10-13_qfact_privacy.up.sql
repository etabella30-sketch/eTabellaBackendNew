-- QFACT privacy backstop. Preserves every existing mark and legacy share row.
-- Deploy with source guards: central list filtering, permission overrides and audience/export predicates.
BEGIN;
CREATE OR REPLACE FUNCTION public.et_qfact_share_private() RETURNS trigger LANGUAGE plpgsql AS $body$
DECLARE kind text;
BEGIN
  SELECT "cFType" INTO kind FROM public."FactMaster" WHERE "nFSid"=NEW."nFSid" FOR SHARE;
  IF kind='QF' THEN RAISE EXCEPTION 'QFACTs are private and cannot be shared' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END;
$body$;
DROP TRIGGER IF EXISTS qfact_share_private ON public."FMShared";
CREATE TRIGGER qfact_share_private BEFORE INSERT OR UPDATE ON public."FMShared" FOR EACH ROW EXECUTE FUNCTION public.et_qfact_share_private();

CREATE OR REPLACE FUNCTION public.et_qfact_view_scope(value jsonb, factscope boolean DEFAULT true) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $body$
DECLARE item record; entry jsonb; textvalue text;
BEGIN
  IF jsonb_typeof(value)='string' THEN
    BEGIN RETURN public.et_qfact_view_scope((value#>>'{}')::jsonb,factscope); EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  ELSIF jsonb_typeof(value)='array' THEN
    FOR entry IN SELECT jsonb_array_elements(value) LOOP IF public.et_qfact_view_scope(entry,factscope) THEN RETURN true; END IF; END LOOP;
  ELSIF jsonb_typeof(value)='object' THEN
    textvalue:=lower(coalesce(value->>'cEntity',value->>'entity',''));
    IF textvalue<>'' THEN factscope:=textvalue IN ('fact','facts','qf','qfact','qfacts'); END IF;
    FOR item IN SELECT t.key,t.part FROM jsonb_each(value) AS t(key,part) LOOP
      textvalue:=lower(item.part#>>'{}');
      IF item.key='assigned' AND item.part='false'::jsonb AND factscope THEN RETURN true; END IF;
      IF item.key IN ('cEntity','entity','markingType','cFacttype','cFType','cFtype') AND textvalue IN ('qf','qfact','qfacts') THEN RETURN true; END IF;
      IF item.key IN ('base','template','from','id') AND textvalue IN ('qfacts','qexpress','qissues','v-qfacts','v-qexpress','v-qissues') THEN RETURN true; END IF;
      IF item.key='type' THEN
        IF textvalue IN ('qf','qfact','qfacts') THEN RETURN true; END IF;
        IF jsonb_typeof(item.part)='array' THEN
          IF jsonb_array_length(item.part)>0
            AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(item.part) t(v) WHERE COALESCE(lower(t.v#>>'{}') NOT IN ('qf','qfact','qfacts'),true)) THEN RETURN true; END IF;
        END IF;
      END IF;
      IF public.et_qfact_view_scope(item.part,factscope) THEN RETURN true; END IF;
    END LOOP;
  END IF;
  RETURN false;
END;
$body$;
CREATE OR REPLACE FUNCTION public.et_qfact_view_private() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN
  IF NEW."bShared" IS TRUE AND public.et_qfact_view_scope(to_jsonb(NEW)) THEN
    RAISE EXCEPTION 'Views using QFACTs are private to their creator' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$body$;
DROP TRIGGER IF EXISTS qfact_view_private ON public."WorkspaceView";
CREATE TRIGGER qfact_view_private BEFORE INSERT OR UPDATE ON public."WorkspaceView" FOR EACH ROW EXECUTE FUNCTION public.et_qfact_view_private();
CREATE OR REPLACE FUNCTION public.et_qfact_conversion_private() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN
  IF OLD."cFType"='QF' AND NEW."cFType" IS DISTINCT FROM 'QF'
    AND EXISTS (SELECT 1 FROM public."FMShared" WHERE "nFSid"=OLD."nFSid") THEN
    RAISE EXCEPTION 'This QFACT has legacy sharing permissions. Ask your case administrator to remove those permissions before converting to a Full FACT.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$body$;
DROP TRIGGER IF EXISTS qfact_conversion_private ON public."FactMaster";
CREATE TRIGGER qfact_conversion_private BEFORE UPDATE OF "cFType" ON public."FactMaster" FOR EACH ROW EXECUTE FUNCTION public.et_qfact_conversion_private();
COMMIT;
