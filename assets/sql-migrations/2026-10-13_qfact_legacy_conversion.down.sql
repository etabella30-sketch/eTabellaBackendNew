-- Conservative rollback: restore untouched copies to the retained legacy reader;
-- keep edited/deleted mappings active, preventing lost edits or resurrected marks.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('qfact-express-legacy-migration',0));
DROP TRIGGER IF EXISTS qfact_legacy_insert ON public."RHighlights";
DROP TRIGGER IF EXISTS qfact_legacy_issue_insert ON public."RHighlightMapid";
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT * FROM public."QfactLegacyConversion" WHERE "bActive" LOOP
   PERFORM public.qfact_legacy_rollback_one(r."nFSid");
 END LOOP;
END $$;
-- Retain the view and backed-up routines: mapped edited/deleted marks must never
-- reappear through their archived legacy rows. No destructive schema contraction.
COMMIT;
