-- Revert 2026-08-12_admindashboard_count: drop the count SP.

DO $$
BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Refusing to run on database % — dev (etabella_tech_uuid) only', current_database();
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.et_admindashboard_count(json, refcursor);
