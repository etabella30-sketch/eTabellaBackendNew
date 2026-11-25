-- 2026-11-23_user_case_highlight_prefs.up.sql
--
-- Why
-- ---
-- Owner, 2026-11-23: the highlight colour preferences (the Highlight ranking switch, Default ranking or My ranking, the
-- viewer's own order, and the Issue chosen for an exact combination of Issues) were kept in the browser only. They must
-- be kept in the database, so they follow the user to another browser or machine.
--
-- What
-- ----
--   * public."UserCaseHighlightPrefs": one row per user and case (the pattern of "UserCaseUiMode", 2026-10-08).
--       "bOn"       the Highlight ranking is in use for this case (default true; false = the viewer turned it off)
--       "cMode"     'D' Default ranking, 'M' My ranking
--       "jMyOrder"  My ranking: a JSON array of Issue / Private Analysis Group ids, highest first; NULL = never set
--       "jCombos"   saved choices: a JSON object {"team:<id>+<id>": "<id>", "private:<id>+<id>": "<id>"}
--       "nRev"      counts every save of this row (the revision an export can name)
--     Ids only: no Issue name, no text. A preference, not a permission, and nothing here is written onto a mark.
--   * public.et_user_case_highlight_get(json, refcursor): the caller's OWN row for a case, or the defaults with
--     "bExists" = false when there is none.
--   * public.et_user_case_highlight_set(json, refcursor): saves the caller's OWN row for a case.
--       - the caller is nMasterid (injected from the JWT by the middleware, never taken from the client);
--       - refused without current case access (an active TeamRelation, or a global admin), as et_user_case_uimode_set;
--       - refused when the input is not well formed (see the function);
--       - jMyOrder and jCombos arrive as JSON TEXT: the shared query builder (setNullValues) sends every j-prefixed
--         key of a request as a string. The function reads the text back as JSON; a real list / object is read too.
--       - refused (msg -2) when the row was saved by another window since the caller read it: the caller's nRev must
--         equal the stored one. The stored row comes back, so the caller can show it. A first save (no row) is accepted
--         with any nRev (the choices carried over from a browser).
--
-- Rows
-- ----
-- This script deletes and changes no existing row: CREATE TABLE IF NOT EXISTS (a new, empty table) and CREATE OR
-- REPLACE FUNCTION (two new functions) only. No DELETE, UPDATE, TRUNCATE, DROP or ALTER of anything that exists.
-- At run time the set function inserts or updates ONLY the caller's own row of the new table.
-- The table's foreign keys are ON DELETE CASCADE, as "UserCaseUiMode": a user's or a case's preference rows go with it.
--
-- Safety
-- ------
--   * One transaction; the same database guard as the 2026-11 migrations: etabella_tech_uuid only, unless the session
--     setting etabella.expected_database names another database (the scratch test sets it).
--   * Rollback: 2026-11-23_user_case_highlight_prefs.down.sql (drops the two functions, keeps the table).
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-23_user_case_highlight_prefs.up.sql

BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for the highlight preferences migration';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public."UserCaseHighlightPrefs" (
  "nUserid" uuid NOT NULL REFERENCES public."UserMaster"("nUserid") ON DELETE CASCADE,
  "nCaseid" uuid NOT NULL REFERENCES public."CaseMaster"("nCaseid") ON DELETE CASCADE,
  "bOn" boolean NOT NULL DEFAULT true,
  "cMode" varchar(1) NOT NULL DEFAULT 'D' CHECK ("cMode" IN ('D', 'M')),
  "jMyOrder" jsonb NULL CHECK ("jMyOrder" IS NULL OR jsonb_typeof("jMyOrder") = 'array'),
  "jCombos" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof("jCombos") = 'object'),
  "nRev" integer NOT NULL DEFAULT 0 CHECK ("nRev" >= 0),
  "dUpdateDt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("nUserid", "nCaseid")
);

CREATE OR REPLACE FUNCTION public.et_user_case_highlight_get(parameter json, ref refcursor)
RETURNS refcursor LANGUAGE plpgsql AS $fn$
DECLARE actor uuid; case_id uuid;
BEGIN
  BEGIN
    actor := NULLIF(parameter->>'nMasterid', '')::uuid;
    case_id := NULLIF(parameter->>'nCaseid', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN actor := NULL;
  END;
  IF actor IS NULL OR case_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM public."CaseMaster" WHERE "nCaseid" = case_id)
    OR NOT EXISTS (
      SELECT 1 FROM public."TeamRelation" WHERE "nUserid" = actor AND "nCaseid" = case_id AND "cStatus" = 'A'
      UNION ALL SELECT 1 FROM public."UserMaster" WHERE "nUserid" = actor AND "isAdmin" = true
    ) THEN
    OPEN ref FOR SELECT -1 AS msg, 'Case access is required' AS value;
    RETURN ref;
  END IF;
  OPEN ref FOR
    SELECT 1 AS msg, 'Highlight preferences' AS value, true AS "bExists",
           p."bOn", p."cMode"::text AS "cMode", p."jMyOrder", p."jCombos", p."nRev"
      FROM public."UserCaseHighlightPrefs" p WHERE p."nUserid" = actor AND p."nCaseid" = case_id
    UNION ALL
    SELECT 1, 'Highlight preferences', false, true, 'D', NULL::jsonb, '{}'::jsonb, 0
     WHERE NOT EXISTS (SELECT 1 FROM public."UserCaseHighlightPrefs" p WHERE p."nUserid" = actor AND p."nCaseid" = case_id);
  RETURN ref;
END $fn$;

CREATE OR REPLACE FUNCTION public.et_user_case_highlight_set(parameter json, ref refcursor)
RETURNS refcursor LANGUAGE plpgsql AS $fn$
DECLARE
  actor uuid; case_id uuid;
  p jsonb := parameter::jsonb;
  is_on boolean; mode text := p->>'cMode';
  my_order jsonb := p->'jMyOrder'; combos jsonb := COALESCE(p->'jCombos', '{}'::jsonb);
  base_rev integer; stored public."UserCaseHighlightPrefs"%ROWTYPE;
  id_re constant text := '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  bad constant text := 'Valid highlight preferences and current case access are required';
BEGIN
  BEGIN
    actor := NULLIF(p->>'nMasterid', '')::uuid;
    case_id := NULLIF(p->>'nCaseid', '')::uuid;
    base_rev := COALESCE(NULLIF(p->>'nRev', ''), '0')::integer;
    is_on := (p->>'bOn')::boolean;
    -- The shared query builder sends every j-prefixed key as JSON text ("[...]", "{...}"): read it back as JSON.
    IF jsonb_typeof(my_order) = 'string' THEN my_order := NULLIF(my_order #>> '{}', '')::jsonb; END IF;
    IF jsonb_typeof(combos) = 'string' THEN combos := COALESCE(NULLIF(combos #>> '{}', '')::jsonb, '{}'::jsonb); END IF;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN actor := NULL;
  END;
  IF my_order IS NOT NULL AND jsonb_typeof(my_order) = 'null' THEN my_order := NULL; END IF;

  -- Well formed: the switch, the mode, a list of at most 200 distinct ids, at most 500 choices, each for a combination
  -- of two or more ids of one kind and naming one of those ids.
  IF actor IS NULL OR case_id IS NULL OR is_on IS NULL OR mode IS NULL OR mode NOT IN ('D', 'M') OR base_rev < 0
    OR (my_order IS NOT NULL AND (jsonb_typeof(my_order) <> 'array' OR jsonb_array_length(my_order) > 200
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(my_order) e WHERE jsonb_typeof(e) <> 'string' OR (e #>> '{}') !~* ('^' || id_re || '$'))
      OR (SELECT count(DISTINCT lower(e #>> '{}')) FROM jsonb_array_elements(my_order) e) <> jsonb_array_length(my_order)))
    OR jsonb_typeof(combos) <> 'object' OR (SELECT count(*) FROM jsonb_object_keys(combos)) > 500
    OR EXISTS (SELECT 1 FROM jsonb_each(combos) c WHERE
         c.key !~* ('^(team|private):' || id_re || '(\+' || id_re || ')+$')
         OR jsonb_typeof(c.value) <> 'string'
         OR NOT (lower(c.value #>> '{}') = ANY (string_to_array(lower(split_part(c.key, ':', 2)), '+'))))
  THEN
    OPEN ref FOR SELECT -1 AS msg, bad AS value;
    RETURN ref;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."CaseMaster" WHERE "nCaseid" = case_id)
    OR NOT EXISTS (
      SELECT 1 FROM public."TeamRelation" WHERE "nUserid" = actor AND "nCaseid" = case_id AND "cStatus" = 'A'
      UNION ALL SELECT 1 FROM public."UserMaster" WHERE "nUserid" = actor AND "isAdmin" = true
    ) THEN
    OPEN ref FOR SELECT -1 AS msg, bad AS value;
    RETURN ref;
  END IF;

  -- Two first saves at once: the second one waits here and then meets the row.
  INSERT INTO public."UserCaseHighlightPrefs" ("nUserid", "nCaseid", "bOn", "cMode", "jMyOrder", "jCombos", "nRev")
    VALUES (actor, case_id, is_on, mode, my_order, combos, 1)
    ON CONFLICT ("nUserid", "nCaseid") DO NOTHING;
  IF NOT FOUND THEN
    SELECT * INTO stored FROM public."UserCaseHighlightPrefs" WHERE "nUserid" = actor AND "nCaseid" = case_id FOR UPDATE;
    IF stored."nRev" <> base_rev THEN
      -- Saved from another window since this caller read it: nothing is written, the stored row comes back.
      OPEN ref FOR SELECT -2 AS msg, 'These preferences were changed in another window' AS value, true AS "bExists",
        stored."bOn" AS "bOn", stored."cMode"::text AS "cMode", stored."jMyOrder" AS "jMyOrder", stored."jCombos" AS "jCombos", stored."nRev" AS "nRev";
      RETURN ref;
    END IF;
    UPDATE public."UserCaseHighlightPrefs"
       SET "bOn" = is_on, "cMode" = mode, "jMyOrder" = my_order, "jCombos" = combos, "nRev" = stored."nRev" + 1, "dUpdateDt" = now()
     WHERE "nUserid" = actor AND "nCaseid" = case_id;
  END IF;

  OPEN ref FOR SELECT 1 AS msg, 'Highlight preferences saved' AS value, true AS "bExists",
    q."bOn", q."cMode"::text AS "cMode", q."jMyOrder", q."jCombos", q."nRev"
    FROM public."UserCaseHighlightPrefs" q WHERE q."nUserid" = actor AND q."nCaseid" = case_id;
  RETURN ref;
END $fn$;
COMMIT;
