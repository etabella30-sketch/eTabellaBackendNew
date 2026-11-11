-- 2026-11-13_private_group_colour.test.sql
--
-- Scratch-database test of 2026-11-13_private_group_colour.up.sql (a Private Group has a colour) and of its rollback
-- 2026-11-13_private_group_colour.down.sql: checks U01-U10 of Task 1 (U11-U13 added in fix round 1) of
-- .superpowers/sdd/2026-11-11-private-group-colour-three-categories/task-1-brief.md.
--
-- NOT RUN YET. Written 2026-11-11 without a database. Running it needs the owner's approval first (Golden Rule 1).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261113).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * Creates the seven small tables the functions read (as 2026-11-12b_private_groups_unassigned_only.test.sql does),
--     then loads from this folder, in order: 2026-10-09_private_fact_groups.up.sql,
--     2026-11-12_private_groups_for_qfacts.up.sql, 2026-11-12b_private_groups_unassigned_only.up.sql and, after the
--     fixture is in place, 2026-11-13_private_group_colour.up.sql.
--   * Fixture ids are 10000000-0000-4000-8000-0000000000NN. Nothing is rolled back: the loaded scripts commit
--     themselves. Throw the scratch database away afterwards (a separate approval).
--   * U09 and U10 load 2026-11-13_private_group_colour.down.sql, so the scratch database ends on the 2026-11-12b rules.
--   * Order of execution: the baseline (the list and the memberships under 2026-11-12b), the up script, U08 and the
--     first half of U10, U01-U07, U11, U12, then the down script, U09, U13 and the second half of U10.
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-13_private_group_colour.test.sql
-- Pass: a NOTICE "PASS Unn ..." for each of U01-U13, then "PASS all 13 checks". A failure stops at "FAIL Unn ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'private_group_colour test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'private_group_colour test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- Ids: pg_temp.tid(n) = 10000000-0000-4000-8000-<n as 12 digits>.
--   Users   1 = A, 2 = B (both Advanced in case 11).   Case 11.
--   Issues  31 = the system Unassigned Issue.
--   Groups  41 'Alpha' and 42 'Beta' (A, case 11; both without a colour when created), 43 'B group' (B, case 11).
--   Marks   61 QF and 62 F in group 41, 63 QF in group 42 (A, Unassigned): 2 groups / 3 memberships. 64 F is A's and
--           ungrouped. 91 QF is B's in group 43.
CREATE FUNCTION pg_temp.tid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$f$ SELECT ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;

BEGIN;
CREATE TABLE public."CaseMaster"("nCaseid" uuid PRIMARY KEY);
CREATE TABLE public."UserMaster"("nUserid" uuid PRIMARY KEY, "isAdmin" boolean);
CREATE TABLE public."TeamRelation"("nCaseid" uuid, "nUserid" uuid, "cStatus" text);
CREATE TABLE public."UserCaseUiMode"("nCaseid" uuid, "nUserid" uuid, "cUIMode" text);
CREATE TABLE public."FactMaster"("nFSid" uuid PRIMARY KEY, "nCaseid" uuid, "nUserid" uuid, "cFType" text);
CREATE TABLE public."RIssueMaster"("nIid" uuid PRIMARY KEY, "nUserid" uuid, "cIName" text);
CREATE TABLE public."FMIssue"("nFSid" uuid, "nIssueid" uuid, "nImpactid" int, "nRelevanceid" int);

INSERT INTO public."UserMaster"("nUserid", "isAdmin") VALUES (pg_temp.tid(1), false), (pg_temp.tid(2), false);
INSERT INTO public."CaseMaster"("nCaseid") VALUES (pg_temp.tid(11));
INSERT INTO public."TeamRelation"("nCaseid", "nUserid", "cStatus") VALUES
    (pg_temp.tid(11), pg_temp.tid(1), 'A'), (pg_temp.tid(11), pg_temp.tid(2), 'A');
INSERT INTO public."UserCaseUiMode"("nCaseid", "nUserid", "cUIMode") VALUES
    (pg_temp.tid(11), pg_temp.tid(1), 'A'), (pg_temp.tid(11), pg_temp.tid(2), 'A');
INSERT INTO public."RIssueMaster"("nIid", "nUserid", "cIName") VALUES (pg_temp.tid(31), NULL, 'Unassigned');
INSERT INTO public."FactMaster"("nFSid", "nCaseid", "nUserid", "cFType") VALUES
    (pg_temp.tid(61), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(62), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(63), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(64), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(91), pg_temp.tid(11), pg_temp.tid(2), 'QF');
INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(61), pg_temp.tid(31), 0, 0);
COMMIT;

-- ------------------------------------------------------------------------------------------------ load the earlier scripts
SELECT set_config('etabella.expected_database',
    CASE WHEN left(current_database(), 16) = 'etabella_scratch' THEN current_database() ELSE 'not-a-scratch-database' END,
    false) AS expected_database;

\ir 2026-10-09_private_fact_groups.up.sql
\ir 2026-11-12_private_groups_for_qfacts.up.sql
\ir 2026-11-12b_private_groups_unassigned_only.up.sql

INSERT INTO public."PrivateFactGroup"("nGroupid", "nCaseid", "nUserid", "cName") VALUES
    (pg_temp.tid(41), pg_temp.tid(11), pg_temp.tid(1), 'Alpha'),
    (pg_temp.tid(42), pg_temp.tid(11), pg_temp.tid(1), 'Beta'),
    (pg_temp.tid(43), pg_temp.tid(11), pg_temp.tid(2), 'B group');
INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid") VALUES
    (pg_temp.tid(61), pg_temp.tid(41)), (pg_temp.tid(62), pg_temp.tid(41)), (pg_temp.tid(63), pg_temp.tid(42)),
    (pg_temp.tid(91), pg_temp.tid(43));

-- ------------------------------------------------------------------------------------------------ helpers
-- The answer of et_workspace_private_groups as jsonb: {msg, nGroupid, groups, assignments, eligibleFactIds,
-- systemIssueIds} or {msg: -1, value}. The parameter is passed as given, so a test controls which keys are present.
CREATE FUNCTION pg_temp.t_call(p json) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE c refcursor := 't_call_result'; r record;
BEGIN
    PERFORM public.et_workspace_private_groups(p, c);
    FETCH c INTO r;
    CLOSE c;
    RETURN row_to_json(r)::jsonb;
END $f$;

CREATE FUNCTION pg_temp.t_list(actor_n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(actor_n), 'nCaseid', pg_temp.tid(11))) $f$;

-- One fingerprint of the memberships table.
CREATE FUNCTION pg_temp.t_members_md5() RETURNS text LANGUAGE sql AS
$f$ SELECT md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FactPrivateGroup" t $f$;

-- An id array sorted: the function builds eligibleFactIds and systemIssueIds without ORDER BY (heap order).
CREATE FUNCTION pg_temp.t_sorted(a jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(x ORDER BY x), '[]'::jsonb) FROM jsonb_array_elements(a) x $f$;

-- The same answer with the "color" key removed from every group element (what 2026-11-12b answered; the group
-- order is kept) and the two unordered id arrays sorted.
CREATE FUNCTION pg_temp.t_without_colour(a jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_set(jsonb_set(jsonb_set(a, '{groups}', COALESCE((SELECT jsonb_agg(e - 'color' ORDER BY n)
                                              FROM jsonb_array_elements(a->'groups') WITH ORDINALITY x(e, n)), '[]'::jsonb)),
                    '{eligibleFactIds}', pg_temp.t_sorted(a->'eligibleFactIds')),
                    '{systemIssueIds}', pg_temp.t_sorted(a->'systemIssueIds')) $f$;

-- ------------------------------------------------------------------------------------------------ baseline (2026-11-12b)
CREATE TEMP TABLE c_before AS SELECT pg_temp.t_list(1) AS list_a, pg_temp.t_members_md5() AS members_md5,
    (SELECT md5(prosrc) FROM pg_proc WHERE proname = 'et_workspace_private_groups'
        AND pronamespace = 'public'::regnamespace) AS fn_md5;

\ir 2026-11-13_private_group_colour.up.sql

-- ------------------------------------------------------------------------------------------------ U08, first half of U10
DO $t$
DECLARE l jsonb; b record; col_info text;
BEGIN
    SELECT * INTO b FROM c_before;
    l := pg_temp.t_list(1);
    IF jsonb_array_length(l->'groups') IS DISTINCT FROM 2
       OR (SELECT count(*) FROM public."FactPrivateGroup" f JOIN public."FactMaster" m USING("nFSid") WHERE m."nUserid" = pg_temp.tid(1)) IS DISTINCT FROM 3 THEN
        RAISE EXCEPTION 'FAIL U08 fixture is not 2 groups / 3 memberships: %', l;
    END IF;
    -- Order of groups, count, assignments, eligibleFactIds and systemIssueIds as before; only "color" is new.
    IF pg_temp.t_without_colour(l) IS DISTINCT FROM pg_temp.t_without_colour(b.list_a)
       OR l->'assignments' IS DISTINCT FROM (b.list_a)->'assignments'
       OR pg_temp.t_sorted(l->'eligibleFactIds') IS DISTINCT FROM pg_temp.t_sorted((b.list_a)->'eligibleFactIds')
       OR pg_temp.t_sorted(l->'systemIssueIds') IS DISTINCT FROM pg_temp.t_sorted((b.list_a)->'systemIssueIds')
       OR l->'groups' IS DISTINCT FROM (SELECT jsonb_agg(e || '{"color": null}'::jsonb ORDER BY n)
            FROM jsonb_array_elements((b.list_a)->'groups') WITH ORDINALITY x(e, n)) THEN
        RAISE EXCEPTION 'FAIL U08 the list changed beyond the new color key: before %, after %', b.list_a, l;
    END IF;
    SELECT data_type || '(' || character_maximum_length || ') ' || is_nullable INTO col_info
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'PrivateFactGroup' AND column_name = 'cColor';
    IF col_info IS DISTINCT FROM 'character varying(6) YES' THEN
        RAISE EXCEPTION 'FAIL U08 column "cColor" is %', col_info;
    END IF;
    RAISE NOTICE 'PASS U08 list for 2 groups / 3 memberships: order, count, assignments, eligibleFactIds, systemIssueIds unchanged; only color added';
    IF pg_temp.t_members_md5() IS DISTINCT FROM b.members_md5 THEN
        RAISE EXCEPTION 'FAIL U10 "FactPrivateGroup" changed by the up script';
    END IF;
    RAISE NOTICE 'PASS U10 (up half) "FactPrivateGroup" md5 identical before and after the up script';
END $t$;

-- ------------------------------------------------------------------------------------------------ U01-U07
DO $t$
DECLARE l jsonb; e jsonb;
BEGIN
    l := pg_temp.t_list(1);
    FOR e IN SELECT jsonb_array_elements(l->'groups') LOOP
        IF NOT (e ? 'color') OR e->'color' IS DISTINCT FROM 'null'::jsonb THEN
            RAISE EXCEPTION 'FAIL U01 group %: color should be JSON null, element %', e->>'id', e;
        END IF;
    END LOOP;
    RAISE NOTICE 'PASS U01 list returns color: null for groups created without a colour';
END $t$;

DO $t$
DECLARE r jsonb; g uuid; e jsonb;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Blue', 'cColor', '0066ff'));
    g := (r->>'nGroupid')::uuid;
    SELECT x INTO e FROM jsonb_array_elements(r->'groups') x WHERE x->>'id' = g::text;
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR e->>'color' IS DISTINCT FROM '0066FF'
       OR (SELECT "cColor" FROM public."PrivateFactGroup" WHERE "nGroupid" = g) IS DISTINCT FROM '0066FF' THEN
        RAISE EXCEPTION 'FAIL U02 create with cColor 0066ff: answer %', r;
    END IF;
    -- Keep the id for the next checks.
    PERFORM set_config('c_test.blue', g::text, false);
    RAISE NOTICE 'PASS U02 create with cColor 0066ff returns and stores 0066FF';
END $t$;

DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.blue')::uuid; e jsonb;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Blue renamed'));
    SELECT x INTO e FROM jsonb_array_elements(r->'groups') x WHERE x->>'id' = g::text;
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR e->>'color' IS DISTINCT FROM '0066FF' OR e->>'name' IS DISTINCT FROM 'Blue renamed'
       OR (SELECT "cColor" FROM public."PrivateFactGroup" WHERE "nGroupid" = g) IS DISTINCT FROM '0066FF' THEN
        RAISE EXCEPTION 'FAIL U03 rename without a cColor key: answer %', r;
    END IF;
    RAISE NOTICE 'PASS U03 rename without cColor keeps 0066FF';
END $t$;

-- U07 comes before U04 so the colour is still set when another user tries to change it.
DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.blue')::uuid; before_md5 text;
BEGIN
    before_md5 := md5((SELECT t::text FROM public."PrivateFactGroup" t WHERE "nGroupid" = g));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(2), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Taken over', 'cColor', 'FF0000'));
    IF (r->>'msg')::int IS DISTINCT FROM -1 OR r->>'value' IS DISTINCT FROM 'Private Group is unavailable'
       OR md5((SELECT t::text FROM public."PrivateFactGroup" t WHERE "nGroupid" = g)) IS DISTINCT FROM before_md5 THEN
        RAISE EXCEPTION 'FAIL U07 another user''s rename with a colour: answer %', r;
    END IF;
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(2), 'nCaseid', pg_temp.tid(11)));
    IF r::text LIKE '%' || g::text || '%' THEN
        RAISE EXCEPTION 'FAIL U07 B''s list shows A''s group: %', r;
    END IF;
    RAISE NOTICE 'PASS U07 another user''s rename with a colour: refused (Private Group is unavailable), row md5 unchanged, group not in their list';
END $t$;

DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.blue')::uuid;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Blue renamed', 'cColor', ''));
    IF (r->>'msg')::int IS DISTINCT FROM 1
       OR (SELECT "cColor" FROM public."PrivateFactGroup" WHERE "nGroupid" = g) IS NOT NULL
       OR (SELECT x->'color' FROM jsonb_array_elements(r->'groups') x WHERE x->>'id' = g::text) IS DISTINCT FROM 'null'::jsonb THEN
        RAISE EXCEPTION 'FAIL U04 rename with cColor empty: answer %', r;
    END IF;
    -- Put the colour back for U05 / U06.
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Blue renamed', 'cColor', '0066FF'));
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL U04 set-up: could not set the colour again: %', r; END IF;
    RAISE NOTICE 'PASS U04 rename with cColor empty string stores NULL';
END $t$;

DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.blue')::uuid; before_md5 text; n_before int; n_after int;
BEGIN
    before_md5 := md5((SELECT t::text FROM public."PrivateFactGroup" t WHERE "nGroupid" = g));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Yellow try', 'cColor', 'FFFF00'));
    IF (r->>'msg')::int IS DISTINCT FROM -1 OR r->>'value' IS DISTINCT FROM 'Choose a valid colour'
       OR md5((SELECT t::text FROM public."PrivateFactGroup" t WHERE "nGroupid" = g)) IS DISTINCT FROM before_md5 THEN
        RAISE EXCEPTION 'FAIL U05 rename with FFFF00: answer %', r;
    END IF;
    SELECT count(*) INTO n_before FROM public."PrivateFactGroup";
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Yellow group', 'cColor', 'ffff00'));
    SELECT count(*) INTO n_after FROM public."PrivateFactGroup";
    IF (r->>'msg')::int IS DISTINCT FROM -1 OR r->>'value' IS DISTINCT FROM 'Choose a valid colour' OR n_after IS DISTINCT FROM n_before THEN
        RAISE EXCEPTION 'FAIL U05 create with ffff00: answer %, rows % -> %', r, n_before, n_after;
    END IF;
    RAISE NOTICE 'PASS U05 cColor FFFF00 refused on rename and on create (Choose a valid colour); row unchanged, none created';
END $t$;

DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.blue')::uuid; before_md5 text; v text;
BEGIN
    before_md5 := md5((SELECT t::text FROM public."PrivateFactGroup" t WHERE "nGroupid" = g));
    FOREACH v IN ARRAY ARRAY['zzz', '#0066FF', '0066F', '0066FFF', 'GG66FF', ' 0066FF'] LOOP
        r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
            'operation', 'rename', 'nGroupid', g, 'cName', 'Bad try', 'cColor', v));
        IF (r->>'msg')::int IS DISTINCT FROM -1 OR r->>'value' IS DISTINCT FROM 'Choose a valid colour'
           OR md5((SELECT t::text FROM public."PrivateFactGroup" t WHERE "nGroupid" = g)) IS DISTINCT FROM before_md5 THEN
            RAISE EXCEPTION 'FAIL U06 rename with cColor "%": answer %', v, r;
        END IF;
    END LOOP;
    -- The table constraint is the second line of defence: a direct write of a bad value is refused too.
    BEGIN
        UPDATE public."PrivateFactGroup" SET "cColor" = 'zzzzzz' WHERE "nGroupid" = g;
        RAISE EXCEPTION 'FAIL U06 the CHECK constraint let "zzzzzz" through';
    EXCEPTION WHEN check_violation THEN
        NULL;
    END;
    RAISE NOTICE 'PASS U06 cColor zzz, #0066FF and other non-RRGGBB values refused; the CHECK constraint refuses a direct write';
END $t$;

-- U11: a create WITHOUT a cColor key (the old client) stores NULL and lists color null.
DO $t$
DECLARE r jsonb; g uuid; e jsonb;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Plain'));
    g := (r->>'nGroupid')::uuid;
    SELECT x INTO e FROM jsonb_array_elements(r->'groups') x WHERE x->>'id' = g::text;
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR e->'color' IS DISTINCT FROM 'null'::jsonb
       OR (SELECT "cColor" FROM public."PrivateFactGroup" WHERE "nGroupid" = g) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U11 create without a cColor key: answer %', r;
    END IF;
    RAISE NOTICE 'PASS U11 create without a cColor key stores NULL and lists color null';
END $t$;

-- U12: rename with a JSON null for cColor clears the colour (the key is present, the value is null).
DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.blue')::uuid;
BEGIN
    IF (SELECT "cColor" FROM public."PrivateFactGroup" WHERE "nGroupid" = g) IS DISTINCT FROM '0066FF' THEN
        RAISE EXCEPTION 'FAIL U12 set-up: the colour of the Blue group is not 0066FF';
    END IF;
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Blue renamed', 'cColor', NULL));
    IF (r->>'msg')::int IS DISTINCT FROM 1
       OR (SELECT "cColor" FROM public."PrivateFactGroup" WHERE "nGroupid" = g) IS NOT NULL
       OR (SELECT x->'color' FROM jsonb_array_elements(r->'groups') x WHERE x->>'id' = g::text) IS DISTINCT FROM 'null'::jsonb THEN
        RAISE EXCEPTION 'FAIL U12 rename with a JSON null cColor: answer %', r;
    END IF;
    RAISE NOTICE 'PASS U12 rename with cColor JSON null clears the colour';
END $t$;

-- ------------------------------------------------------------------------------------------------ U09, U13, second half of U10 (rollback)
CREATE TEMP TABLE c_after_up AS SELECT pg_temp.t_members_md5() AS members_md5;

\ir 2026-11-13_private_group_colour.down.sql

DO $t$
DECLARE l jsonb; b record; a record; n_col int; n_con int;
BEGIN
    SELECT * INTO b FROM c_before;
    SELECT * INTO a FROM c_after_up;
    SELECT count(*) INTO n_col FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'PrivateFactGroup' AND column_name = 'cColor';
    SELECT count(*) INTO n_con FROM pg_constraint WHERE conname = 'private_fact_group_colour';
    IF n_col IS DISTINCT FROM 0 OR n_con IS DISTINCT FROM 0 THEN
        RAISE EXCEPTION 'FAIL U09 after the down script: column rows %, constraint rows %', n_col, n_con;
    END IF;
    -- A's list now also holds the group created in U02 ('Blue renamed'), which U08 could not have: compare the
    -- fixture groups only, then the other keys.
    l := pg_temp.t_list(1);
    IF (l->>'msg')::int IS DISTINCT FROM 1
       OR l->'assignments' IS DISTINCT FROM (b.list_a)->'assignments'
       OR pg_temp.t_sorted(l->'eligibleFactIds') IS DISTINCT FROM pg_temp.t_sorted((b.list_a)->'eligibleFactIds')
       OR pg_temp.t_sorted(l->'systemIssueIds') IS DISTINCT FROM pg_temp.t_sorted((b.list_a)->'systemIssueIds')
       OR (SELECT jsonb_agg(e ORDER BY n) FROM jsonb_array_elements(l->'groups') WITH ORDINALITY x(e, n)
            WHERE e->>'id' IN (pg_temp.tid(41)::text, pg_temp.tid(42)::text))
          IS DISTINCT FROM (b.list_a)->'groups'
       OR EXISTS (SELECT 1 FROM jsonb_array_elements(l->'groups') e WHERE e ? 'color') THEN
        RAISE EXCEPTION 'FAIL U09 after the down script the list is not the 2026-11-12b one: before %, after %', b.list_a, l;
    END IF;
    RAISE NOTICE 'PASS U09 down script: column and constraint gone; the list is the 2026-11-12b answer again (no color key)';
    IF pg_temp.t_members_md5() IS DISTINCT FROM b.members_md5 OR pg_temp.t_members_md5() IS DISTINCT FROM a.members_md5 THEN
        RAISE EXCEPTION 'FAIL U10 "FactPrivateGroup" changed by the down script';
    END IF;
    RAISE NOTICE 'PASS U10 (down half) "FactPrivateGroup" md5 identical before the up script, after it and after the down script';
    -- U13: the function source is byte for byte the 2026-11-12b one again.
    IF (SELECT md5(prosrc) FROM pg_proc WHERE proname = 'et_workspace_private_groups'
            AND pronamespace = 'public'::regnamespace) IS DISTINCT FROM b.fn_md5 THEN
        RAISE EXCEPTION 'FAIL U13 et_workspace_private_groups after the down script differs from the 2026-11-12b source';
    END IF;
    RAISE NOTICE 'PASS U13 md5(prosrc) of et_workspace_private_groups equal before the up script and after the down script';
END $t$;

\echo 'PASS all 13 checks'
