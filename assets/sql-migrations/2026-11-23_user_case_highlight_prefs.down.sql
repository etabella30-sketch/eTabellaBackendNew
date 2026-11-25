-- 2026-11-23_user_case_highlight_prefs.down.sql
--
-- Rollback of 2026-11-23_user_case_highlight_prefs.up.sql. Roll back the matching coreapi and front end first.
-- Drops the two functions only. public."UserCaseHighlightPrefs" is intentionally KEPT: dropping it would destroy the
-- preferences users saved (the same choice as 2026-10-08_user_case_ui_mode.down.sql). No row is deleted or changed.
-- The front end falls back to the copy it keeps in the browser when the routes are gone.
--
-- Safety: one transaction; the same database guard as the up script.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-23_user_case_highlight_prefs.down.sql

BEGIN;
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for the highlight preferences rollback';
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.et_user_case_highlight_get(json, refcursor);
DROP FUNCTION IF EXISTS public.et_user_case_highlight_set(json, refcursor);
COMMIT;
