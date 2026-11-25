-- 2026-11-23_user_case_highlight_prefs.test.sql
--
-- Scratch-database test of 2026-11-23_user_case_highlight_prefs.up.sql and of its rollback (.down.sql).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch. It refuses any other database, and it
--     refuses a database that already has a "UserMaster" table.
--   * It creates the three small tables the functions read ("UserMaster", "CaseMaster", "TeamRelation"), loads the up
--     script from this folder, runs H01-H19, loads the down script and checks H17. Nothing is rolled back: throw the
--     scratch database away afterwards.
-- Needs psql (\set, \ir, \echo) and PostgreSQL 13 or later.
-- Run:
--   psql -h <host> -U <user> -d etabella_scratch_hl_<date> -f 2026-11-23_user_case_highlight_prefs.test.sql

\set ON_ERROR_STOP on
DO $guard$ BEGIN
  IF left(current_database(), 16) <> 'etabella_scratch' THEN
    RAISE EXCEPTION 'highlight prefs test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
  END IF;
  IF to_regclass('public."UserMaster"') IS NOT NULL THEN
    RAISE EXCEPTION 'highlight prefs test: database % already has "UserMaster"; use a new, empty scratch database', current_database();
  END IF;
END $guard$;

CREATE TABLE public."UserMaster" ("nUserid" uuid PRIMARY KEY, "cFname" text, "isAdmin" boolean NOT NULL DEFAULT false);
CREATE TABLE public."CaseMaster" ("nCaseid" uuid PRIMARY KEY, "cCasename" text);
CREATE TABLE public."TeamRelation" ("nCaseid" uuid, "nTeamid" uuid, "nUserid" uuid, "cStatus" varchar(1));

-- u1 and u2 are members of c1; u3 was removed from c1; u4 is a global admin with no membership; c2 has no member.
INSERT INTO public."UserMaster" VALUES
  ('10000000-0000-4000-8000-000000000001', 'u1', false), ('10000000-0000-4000-8000-000000000002', 'u2', false),
  ('10000000-0000-4000-8000-000000000003', 'u3 removed', false), ('10000000-0000-4000-8000-000000000004', 'u4 admin', true);
INSERT INTO public."CaseMaster" VALUES ('20000000-0000-4000-8000-000000000001', 'c1'), ('20000000-0000-4000-8000-000000000002', 'c2');
INSERT INTO public."TeamRelation" VALUES
  ('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '10000000-0000-4000-8000-000000000001', 'A'),
  ('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '10000000-0000-4000-8000-000000000002', 'A'),
  ('20000000-0000-4000-8000-000000000001', gen_random_uuid(), '10000000-0000-4000-8000-000000000003', 'D');

SELECT set_config('etabella.expected_database',
  CASE WHEN left(current_database(), 16) = 'etabella_scratch' THEN current_database() ELSE 'not-a-scratch-database' END, false) AS expected_database;
\ir 2026-11-23_user_case_highlight_prefs.up.sql

-- One call of a function, as jsonb (the first row of its cursor).
CREATE FUNCTION pg_temp.hl(fn text, body jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE cur refcursor := 'hl_test_cursor'; row_out record; out jsonb;
BEGIN
  EXECUTE format('SELECT public.%I($1::json, $2)', fn) USING body::text, cur;
  FETCH cur INTO row_out; out := to_jsonb(row_out); CLOSE cur;
  RETURN out;
END $$;

DO $test$
DECLARE
  u1 text := '10000000-0000-4000-8000-000000000001'; u2 text := '10000000-0000-4000-8000-000000000002';
  u3 text := '10000000-0000-4000-8000-000000000003'; u4 text := '10000000-0000-4000-8000-000000000004';
  c1 text := '20000000-0000-4000-8000-000000000001'; c2 text := '20000000-0000-4000-8000-000000000002';
  a text := '30000000-0000-4000-8000-00000000000a'; b text := '30000000-0000-4000-8000-00000000000b'; c text := '30000000-0000-4000-8000-00000000000c';
  r jsonb; before text; n integer; big jsonb;
  base jsonb;
BEGIN
  base := jsonb_build_object('nMasterid', u1, 'nCaseid', c1, 'bOn', true, 'cMode', 'D', 'jMyOrder', NULL, 'jCombos', '{}'::jsonb, 'nRev', 0);

  -- H01 nothing stored: the defaults, bExists false, and nothing is written by a read
  r := pg_temp.hl('et_user_case_highlight_get', jsonb_build_object('nMasterid', u1, 'nCaseid', c1));
  IF r <> jsonb_build_object('msg', 1, 'value', 'Highlight preferences', 'bExists', false, 'bOn', true, 'cMode', 'D', 'jMyOrder', NULL, 'jCombos', '{}'::jsonb, 'nRev', 0)
    THEN RAISE EXCEPTION 'FAIL H01 %', r; END IF;
  IF (SELECT count(*) FROM public."UserCaseHighlightPrefs") <> 0 THEN RAISE EXCEPTION 'FAIL H01 a read wrote a row'; END IF;
  RAISE NOTICE 'PASS H01 nothing stored: defaults, bExists false, no row written';

  -- H02 first save (the browser's choices carried over, any nRev): stored as revision 1
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('cMode', 'M', 'jMyOrder', jsonb_build_array(b, a),
    'jCombos', jsonb_build_object('team:' || a || '+' || b, b), 'nRev', 7));
  IF (r->>'msg')::int <> 1 OR (r->>'nRev')::int <> 1 OR r->>'cMode' <> 'M' OR r->'jMyOrder' <> jsonb_build_array(b, a)
    OR r->'jCombos' <> jsonb_build_object('team:' || a || '+' || b, b) OR (r->>'bOn')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'FAIL H02 %', r; END IF;
  RAISE NOTICE 'PASS H02 first save accepted with any nRev, stored as revision 1';

  -- H03 read back
  r := pg_temp.hl('et_user_case_highlight_get', jsonb_build_object('nMasterid', u1, 'nCaseid', c1));
  IF (r->>'bExists')::boolean IS NOT TRUE OR (r->>'nRev')::int <> 1 OR r->>'cMode' <> 'M' THEN RAISE EXCEPTION 'FAIL H03 %', r; END IF;
  RAISE NOTICE 'PASS H03 the saved row reads back';

  -- H04 a save from the revision read: revision 2; the switch can be turned off
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('bOn', false, 'nRev', 1));
  IF (r->>'msg')::int <> 1 OR (r->>'nRev')::int <> 2 OR (r->>'bOn')::boolean IS NOT FALSE OR r->'jMyOrder' <> 'null'::jsonb OR r->'jCombos' <> '{}'::jsonb
    THEN RAISE EXCEPTION 'FAIL H04 %', r; END IF;
  RAISE NOTICE 'PASS H04 save on the current revision: revision 2';

  -- H05 a stale save (another window saved since): refused with msg -2, the stored row comes back, nothing changes
  SELECT md5(t::text) INTO before FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u1::uuid;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('cMode', 'M', 'nRev', 1));
  IF (r->>'msg')::int <> -2 OR (r->>'nRev')::int <> 2 OR (r->>'bOn')::boolean IS NOT FALSE OR r->>'cMode' <> 'D' THEN RAISE EXCEPTION 'FAIL H05 %', r; END IF;
  IF before <> (SELECT md5(t::text) FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u1::uuid) THEN RAISE EXCEPTION 'FAIL H05 the row changed'; END IF;
  RAISE NOTICE 'PASS H05 stale save refused (msg -2), stored row returned, row unchanged';

  -- H06 own row only: u2 reads the defaults, and u2 saving leaves u1 alone
  r := pg_temp.hl('et_user_case_highlight_get', jsonb_build_object('nMasterid', u2, 'nCaseid', c1));
  IF (r->>'bExists')::boolean IS NOT FALSE THEN RAISE EXCEPTION 'FAIL H06 u2 sees a row: %', r; END IF;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u2, 'cMode', 'M'));
  IF (r->>'msg')::int <> 1 OR (r->>'nRev')::int <> 1 THEN RAISE EXCEPTION 'FAIL H06 %', r; END IF;
  IF before <> (SELECT md5(t::text) FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u1::uuid) THEN RAISE EXCEPTION 'FAIL H06 u1 row changed'; END IF;
  IF (SELECT count(*) FROM public."UserCaseHighlightPrefs") <> 2 THEN RAISE EXCEPTION 'FAIL H06 row count'; END IF;
  RAISE NOTICE 'PASS H06 a user reads and writes only their own row';

  -- H07 no case access: a removed member, a non-member of c2, an unknown case, an unknown user: refused, nothing written
  SELECT count(*) INTO n FROM public."UserCaseHighlightPrefs";
  FOR r IN SELECT pg_temp.hl('et_user_case_highlight_set', base || x) FROM (VALUES
      (jsonb_build_object('nMasterid', u3)), (jsonb_build_object('nCaseid', c2)),
      (jsonb_build_object('nCaseid', '20000000-0000-4000-8000-0000000000ff')), (jsonb_build_object('nMasterid', '10000000-0000-4000-8000-0000000000ff'))) v(x)
  LOOP IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H07 set %', r; END IF; END LOOP;
  FOR r IN SELECT pg_temp.hl('et_user_case_highlight_get', x) FROM (VALUES
      (jsonb_build_object('nMasterid', u3, 'nCaseid', c1)), (jsonb_build_object('nMasterid', u1, 'nCaseid', c2)),
      (jsonb_build_object('nMasterid', u1)), (jsonb_build_object('nCaseid', c1)), (jsonb_build_object('nMasterid', 'x', 'nCaseid', c1))) v(x)
  LOOP IF (r->>'msg')::int <> -1 OR r ? 'jCombos' THEN RAISE EXCEPTION 'FAIL H07 get %', r; END IF; END LOOP;
  IF n <> (SELECT count(*) FROM public."UserCaseHighlightPrefs") THEN RAISE EXCEPTION 'FAIL H07 a refused call wrote'; END IF;
  RAISE NOTICE 'PASS H07 no case access: read and save refused, nothing written';

  -- H08 a global admin with no membership may keep preferences for a case
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u4, 'nCaseid', c2));
  IF (r->>'msg')::int <> 1 THEN RAISE EXCEPTION 'FAIL H08 %', r; END IF;
  RAISE NOTICE 'PASS H08 a global admin may save for a case';

  -- H09 input that is not well formed: refused before any write
  SELECT count(*) INTO n FROM public."UserCaseHighlightPrefs";
  SELECT md5(string_agg(t::text, '|' ORDER BY t."nUserid", t."nCaseid")) INTO before FROM public."UserCaseHighlightPrefs" t;
  FOR r IN SELECT pg_temp.hl('et_user_case_highlight_set', (base || jsonb_build_object('nMasterid', u2, 'nRev', 1)) || x) FROM (VALUES
      (jsonb_build_object('cMode', 'X')), (jsonb_build_object('cMode', NULL)), (jsonb_build_object('bOn', 'maybe')), (jsonb_build_object('bOn', NULL)),
      (jsonb_build_object('nRev', -1)), (jsonb_build_object('nRev', 'abc')),
      (jsonb_build_object('jMyOrder', 'not a list')), (jsonb_build_object('jMyOrder', jsonb_build_array('not-an-id'))),
      (jsonb_build_object('jMyOrder', jsonb_build_array(7))), (jsonb_build_object('jMyOrder', jsonb_build_array(a, a))),
      (jsonb_build_object('jCombos', jsonb_build_array())), (jsonb_build_object('jCombos', jsonb_build_object('team:' || a, a))),
      (jsonb_build_object('jCombos', jsonb_build_object('team:' || a || '+' || b, c))),
      (jsonb_build_object('jCombos', jsonb_build_object('team:' || a || '+' || b, 5))),
      (jsonb_build_object('jCombos', jsonb_build_object('other:' || a || '+' || b, a))),
      (jsonb_build_object('jCombos', jsonb_build_object('team:' || a || '+' || b || '; DROP TABLE x', a)))) v(x)
  LOOP IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H09 accepted: %', r; END IF; END LOOP;
  IF n <> (SELECT count(*) FROM public."UserCaseHighlightPrefs")
    OR before <> (SELECT md5(string_agg(t::text, '|' ORDER BY t."nUserid", t."nCaseid")) FROM public."UserCaseHighlightPrefs" t)
    THEN RAISE EXCEPTION 'FAIL H09 a refused save wrote'; END IF;
  RAISE NOTICE 'PASS H09 16 malformed inputs refused, nothing written';

  -- H10 size limits: 200 ranked ids and 500 choices pass; 201 and 501 are refused
  SELECT jsonb_agg(('40000000-0000-4000-8000-' || lpad(to_hex(g), 12, '0'))) INTO big FROM generate_series(1, 200) g;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u2, 'nRev', 1, 'jMyOrder', big));
  IF (r->>'msg')::int <> 1 OR jsonb_array_length(r->'jMyOrder') <> 200 THEN RAISE EXCEPTION 'FAIL H10 200 ids %', r->>'msg'; END IF;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u2, 'nRev', 2, 'jMyOrder', big || jsonb_build_array(a)));
  IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H10 201 ids accepted'; END IF;
  SELECT jsonb_object_agg('team:' || a || '+40000000-0000-4000-8000-' || lpad(to_hex(g), 12, '0'), a) INTO big FROM generate_series(1, 500) g;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u2, 'nRev', 2, 'jCombos', big));
  IF (r->>'msg')::int <> 1 OR (SELECT count(*) FROM jsonb_object_keys(r->'jCombos')) <> 500 THEN RAISE EXCEPTION 'FAIL H10 500 choices %', r->>'msg'; END IF;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u2, 'nRev', 3, 'jCombos', big || jsonb_build_object('team:' || a || '+' || b, a)));
  IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H10 501 choices accepted'; END IF;
  RAISE NOTICE 'PASS H10 limits: 200 ids / 500 choices accepted, 201 / 501 refused';

  -- H11 a private combination and upper-case ids are accepted
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u4, 'nCaseid', c2, 'nRev', 1,
    'jCombos', jsonb_build_object('private:' || upper(a) || '+' || upper(b), upper(b))));
  IF (r->>'msg')::int <> 1 THEN RAISE EXCEPTION 'FAIL H11 %', r; END IF;
  RAISE NOTICE 'PASS H11 private combination, upper-case ids';

  -- H12 the table refuses a direct write of a bad value (second line of defence)
  BEGIN
    UPDATE public."UserCaseHighlightPrefs" SET "cMode" = 'X' WHERE "nUserid" = u1::uuid;
    RAISE EXCEPTION 'FAIL H12 bad mode stored';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public."UserCaseHighlightPrefs" SET "jCombos" = '[]'::jsonb WHERE "nUserid" = u1::uuid;
    RAISE EXCEPTION 'FAIL H12 list stored as choices';
  EXCEPTION WHEN check_violation THEN NULL; END;
  RAISE NOTICE 'PASS H12 table constraints refuse a bad mode and a non-object jCombos';

  -- H13 one row per user and case
  IF (SELECT count(*) FROM public."UserCaseHighlightPrefs") <> 3 THEN RAISE EXCEPTION 'FAIL H13 rows %', (SELECT count(*) FROM public."UserCaseHighlightPrefs"); END IF;
  RAISE NOTICE 'PASS H13 three rows: u1/c1, u2/c1, u4/c2';

  -- H14 a member who loses access can no longer read or save, and the row stays as it was
  UPDATE public."TeamRelation" SET "cStatus" = 'D' WHERE "nUserid" = u2::uuid;
  SELECT md5(t::text) INTO before FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u2::uuid;
  r := pg_temp.hl('et_user_case_highlight_get', jsonb_build_object('nMasterid', u2, 'nCaseid', c1));
  IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H14 get %', r; END IF;
  r := pg_temp.hl('et_user_case_highlight_set', base || jsonb_build_object('nMasterid', u2, 'nRev', 3));
  IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H14 set %', r; END IF;
  IF before <> (SELECT md5(t::text) FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u2::uuid) THEN RAISE EXCEPTION 'FAIL H14 row changed'; END IF;
  RAISE NOTICE 'PASS H14 access removed: refused, row kept';

  -- H18 the form coreapi really sends (found 2026-11-23: the first build refused every save): the shared query builder
  --     turns jMyOrder and jCombos into JSON TEXT. Accepted, and stored as a real list and a real object.
  r := pg_temp.hl('et_user_case_highlight_set', jsonb_build_object('nMasterid', u1, 'nCaseid', c1, 'bOn', true, 'cMode', 'M', 'nRev', 2,
    'jMyOrder', jsonb_build_array(b, a)::text, 'jCombos', jsonb_build_object('team:' || a || '+' || b, b)::text));
  IF (r->>'msg')::int <> 1 OR r->'jMyOrder' <> jsonb_build_array(b, a) OR r->'jCombos' <> jsonb_build_object('team:' || a || '+' || b, b)
    THEN RAISE EXCEPTION 'FAIL H18 %', r; END IF;
  IF (SELECT jsonb_typeof("jMyOrder") || '/' || jsonb_typeof("jCombos") FROM public."UserCaseHighlightPrefs" WHERE "nUserid" = u1::uuid) <> 'array/object'
    THEN RAISE EXCEPTION 'FAIL H18 stored as text'; END IF;
  -- "never set" and "nothing saved" in that form: jMyOrder null, jCombos the text {}
  r := pg_temp.hl('et_user_case_highlight_set', jsonb_build_object('nMasterid', u1, 'nCaseid', c1, 'bOn', true, 'cMode', 'D', 'nRev', 3,
    'jMyOrder', NULL, 'jCombos', '{}'));
  IF (r->>'msg')::int <> 1 OR r->'jMyOrder' <> 'null'::jsonb OR r->'jCombos' <> '{}'::jsonb THEN RAISE EXCEPTION 'FAIL H18 empty %', r; END IF;
  RAISE NOTICE 'PASS H18 JSON text for jMyOrder / jCombos (what coreapi sends): accepted, stored as list and object';

  -- H19 JSON text that is not JSON, or not well formed inside: refused, nothing written
  SELECT md5(t::text) INTO before FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u1::uuid;
  FOR r IN SELECT pg_temp.hl('et_user_case_highlight_set', jsonb_build_object('nMasterid', u1, 'nCaseid', c1, 'bOn', true, 'cMode', 'D', 'nRev', 4, 'jMyOrder', NULL, 'jCombos', '{}') || x) FROM (VALUES
      (jsonb_build_object('jMyOrder', '[not json')), (jsonb_build_object('jCombos', 'x')), (jsonb_build_object('jMyOrder', '["not-an-id"]')),
      (jsonb_build_object('jCombos', '[]')), (jsonb_build_object('jCombos', jsonb_build_object('team:' || a || '+' || b, c)::text))) v(x)
  LOOP IF (r->>'msg')::int <> -1 THEN RAISE EXCEPTION 'FAIL H19 accepted: %', r; END IF; END LOOP;
  IF before <> (SELECT md5(t::text) FROM public."UserCaseHighlightPrefs" t WHERE "nUserid" = u1::uuid) THEN RAISE EXCEPTION 'FAIL H19 a refused save wrote'; END IF;
  RAISE NOTICE 'PASS H19 bad JSON text refused, nothing written';

  -- H15 the up script can be loaded again without losing a row (checked after the second load below)
  -- H16 nothing but the new table was written to
  IF (SELECT count(*) FROM public."UserMaster") <> 4 OR (SELECT count(*) FROM public."CaseMaster") <> 2 OR (SELECT count(*) FROM public."TeamRelation") <> 3
    THEN RAISE EXCEPTION 'FAIL H16 another table changed'; END IF;
  RAISE NOTICE 'PASS H16 the other tables hold the same rows';
END $test$;

\ir 2026-11-23_user_case_highlight_prefs.up.sql
DO $$ BEGIN
  IF (SELECT count(*) FROM public."UserCaseHighlightPrefs") <> 3 THEN RAISE EXCEPTION 'FAIL H15 a second load lost rows'; END IF;
  RAISE NOTICE 'PASS H15 the up script loaded twice: the three rows are still there';
END $$;

\ir 2026-11-23_user_case_highlight_prefs.down.sql
DO $$ BEGIN
  IF to_regprocedure('public.et_user_case_highlight_get(json, refcursor)') IS NOT NULL
    OR to_regprocedure('public.et_user_case_highlight_set(json, refcursor)') IS NOT NULL THEN RAISE EXCEPTION 'FAIL H17 a function is left'; END IF;
  IF (SELECT count(*) FROM public."UserCaseHighlightPrefs") <> 3 THEN RAISE EXCEPTION 'FAIL H17 the rollback lost rows'; END IF;
  RAISE NOTICE 'PASS H17 rollback: both functions gone, the table and its three rows kept';
END $$;
\echo ALL HIGHLIGHT PREFERENCE CHECKS PASSED
