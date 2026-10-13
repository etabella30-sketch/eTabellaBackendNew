-- Recovery: keep all ordinary QFACTs and their source coordinates.
BEGIN;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT c.relname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
    AND t.tgname IN ('live_qfact_detail_freeze','live_qfact_master_freeze','live_qfact_association_freeze') LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS live_qfact_detail_freeze ON public.%I',r.relname);
    EXECUTE format('DROP TRIGGER IF EXISTS live_qfact_master_freeze ON public.%I',r.relname);
    EXECUTE format('DROP TRIGGER IF EXISTS live_qfact_association_freeze ON public.%I',r.relname);
  END LOOP;
END $$;
DROP FUNCTION IF EXISTS public.live_qfact_freeze();
DROP INDEX IF EXISTS public.live_qfact_coordinates;
DROP INDEX IF EXISTS public.live_qfact_owner_session;
DROP TABLE IF EXISTS public."LiveQfactRequest";
ALTER TABLE public."FactDetail" DROP COLUMN IF EXISTS "bLiveCapturePristine";
COMMIT;
