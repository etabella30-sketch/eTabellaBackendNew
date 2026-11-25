-- 2026-11-12b_private_groups_unassigned_only.test.sql
--
-- Scratch-database test of 2026-11-12b_private_groups_unassigned_only.up.sql (a Private Group only on a mark with no
-- substantive Team Issue, QFacts and Full Facts alike) and of its rollback
-- 2026-11-12b_private_groups_unassigned_only.down.sql: checks U01-U16 of the plan's Task 1b
-- (docs/superpowers/plans/2026-11-11-qfact-private-analysis-groups.md, addendum 2026-11-11), plus U17-U19 added at
-- review (the rollback's Issue cleanup and list; clearing a leftover membership on a mark with an Issue).
--
-- NOT RUN YET. Written 2026-11-11 without a database. Running it needs the owner's approval first (Golden Rule 1).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261112b).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * Creates the seven small tables the functions read (as 2026-11-12_private_groups_for_qfacts.test.sql does), then
--     loads from this folder, in order: 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql
--     and, after the U15 set-up, 2026-11-12b_private_groups_unassigned_only.up.sql.
--   * Adds fixture rows with ids 10000000-0000-4000-8000-0000000000NN. The checks change only those rows. Nothing is
--     rolled back: the loaded migrations commit themselves, so one wrapping transaction is not possible. Throw the
--     scratch database away afterwards (a separate approval).
--   * U16 loads 2026-11-12b_private_groups_unassigned_only.down.sql, so the scratch database ends on the 2026-11-12 rules.
--   * Order of the checks: U15 first (right after the script is loaded, because it checks what loading the script
--     did), then U01-U14 and U19 under this script, then U16-U18 after the rollback.
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-12b_private_groups_unassigned_only.test.sql
-- Pass: a NOTICE "PASS Unn ..." for each of U01-U19, then "PASS all 19 checks". A failure stops at "FAIL Unn ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'private_groups_unassigned_only test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'private_groups_unassigned_only test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- Ids: pg_temp.tid(n) = 10000000-0000-4000-8000-<n as 12 digits>.
--   Users   1 = A, 2 = B.
--   Cases   11 = C1, 12 = C2, 13 = C3 (A works in Essential mode in C3; Advanced everywhere else).
--   Issues  31 = the system Unassigned Issue; 32 = a substantive Issue (a named Issue under the Unassigned Claim).
--   Groups  41 A/C1; 42 A/C1 deleted; 43 A/C2; 44 B/C1; 45 A/C3; 46 A/C1 (used by the Issue and identity checks).
--   Marks   61-72, 74 and 75 belong to A in C1; 73 to A in C3; 91 to B in C1. 'QF' = QFact, 'F' = Full Fact.
--           61 QF Unassigned (system Issue row only); 62 F Unassigned (no Issue row); 63 QF and 64 F carry the
--           substantive Issue from the start; the others start with no Issue row. 74 and 75 become the leftovers
--           (grouped, then given a substantive Issue, under the 2026-11-12 rule): 74 stays to the end, 75 is cleared
--           in U19.
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
INSERT INTO public."CaseMaster"("nCaseid") VALUES (pg_temp.tid(11)), (pg_temp.tid(12)), (pg_temp.tid(13));
INSERT INTO public."TeamRelation"("nCaseid", "nUserid", "cStatus") VALUES
    (pg_temp.tid(11), pg_temp.tid(1), 'A'), (pg_temp.tid(12), pg_temp.tid(1), 'A'), (pg_temp.tid(13), pg_temp.tid(1), 'A'),
    (pg_temp.tid(11), pg_temp.tid(2), 'A');
INSERT INTO public."UserCaseUiMode"("nCaseid", "nUserid", "cUIMode") VALUES
    (pg_temp.tid(11), pg_temp.tid(1), 'A'), (pg_temp.tid(12), pg_temp.tid(1), 'A'), (pg_temp.tid(13), pg_temp.tid(1), 'E'),
    (pg_temp.tid(11), pg_temp.tid(2), 'A');
INSERT INTO public."RIssueMaster"("nIid", "nUserid", "cIName") VALUES
    (pg_temp.tid(31), NULL, 'Unassigned'),
    (pg_temp.tid(32), pg_temp.tid(1), 'Named Issue under Unassigned Claim');
INSERT INTO public."FactMaster"("nFSid", "nCaseid", "nUserid", "cFType") VALUES
    (pg_temp.tid(61), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(62), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(63), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(64), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(65), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(66), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(67), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(68), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(69), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(70), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(71), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(72), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(73), pg_temp.tid(13), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(74), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(75), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(91), pg_temp.tid(11), pg_temp.tid(2), 'QF');
INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES
    (pg_temp.tid(61), pg_temp.tid(31), 0, 0),
    (pg_temp.tid(63), pg_temp.tid(32), 4, 5),
    (pg_temp.tid(64), pg_temp.tid(32), 4, 5);
COMMIT;

-- ------------------------------------------------------------------------------------------------ load 2026-10-09 and 2026-11-12
-- Their guard accepts the database named in etabella.expected_database. Name the scratch database only: anywhere
-- else the setting names no real database, so the migrations' own guards refuse too.
SELECT set_config('etabella.expected_database',
    CASE WHEN left(current_database(), 16) = 'etabella_scratch' THEN current_database() ELSE 'not-a-scratch-database' END,
    false) AS expected_database;

\ir 2026-10-09_private_fact_groups.up.sql
\ir 2026-11-12_private_groups_for_qfacts.up.sql

INSERT INTO public."PrivateFactGroup"("nGroupid", "nCaseid", "nUserid", "cName", "dDeletedDt") VALUES
    (pg_temp.tid(41), pg_temp.tid(11), pg_temp.tid(1), 'A working group', NULL),
    (pg_temp.tid(42), pg_temp.tid(11), pg_temp.tid(1), 'A deleted group', now()),
    (pg_temp.tid(43), pg_temp.tid(12), pg_temp.tid(1), 'A group in another case', NULL),
    (pg_temp.tid(44), pg_temp.tid(11), pg_temp.tid(2), 'B working group', NULL),
    (pg_temp.tid(45), pg_temp.tid(13), pg_temp.tid(1), 'A group in an Essential case', NULL),
    (pg_temp.tid(46), pg_temp.tid(11), pg_temp.tid(1), 'A second group', NULL);

-- ------------------------------------------------------------------------------------------------ helpers
-- The assign answer as jsonb: {"msg": 1, "nFSid": ...} or {"msg": -1, "value": "<refusal>"}. grp_n null = clear.
CREATE FUNCTION pg_temp.t_assign(actor_n integer, mark_n integer, grp_n integer) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE c refcursor := 't_assign_result'; r record;
BEGIN
    PERFORM public.et_private_group_assign(json_build_object('nMasterid', pg_temp.tid(actor_n),
        'nFSid', pg_temp.tid(mark_n), 'nPrivateGroupid', pg_temp.tid(grp_n)), c);
    FETCH c INTO r;
    CLOSE c;
    RETURN row_to_json(r)::jsonb;
END $f$;

-- The list answer as jsonb: msg, nGroupid, groups, assignments, eligibleFactIds, systemIssueIds.
CREATE FUNCTION pg_temp.t_list(actor_n integer, case_n integer) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE c refcursor := 't_list_result'; r record;
BEGIN
    PERFORM public.et_workspace_private_groups(json_build_object('nMasterid', pg_temp.tid(actor_n),
        'nCaseid', pg_temp.tid(case_n)), c);
    FETCH c INTO r;
    CLOSE c;
    RETURN row_to_json(r)::jsonb;
END $f$;

-- The group a mark is in (null = none).
CREATE FUNCTION pg_temp.t_group_of(mark_n integer) RETURNS uuid LANGUAGE sql AS
$f$ SELECT "nGroupid" FROM public."FactPrivateGroup" WHERE "nFSid" = pg_temp.tid(mark_n) $f$;

-- One fingerprint per table, to prove a script changes no row.
CREATE FUNCTION pg_temp.t_snapshot() RETURNS TABLE(k text, v text) LANGUAGE sql AS $f$
    SELECT 'FactPrivateGroup'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FactPrivateGroup" t
    UNION ALL
    SELECT 'PrivateFactGroup'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."PrivateFactGroup" t
    UNION ALL
    SELECT 'FactMaster'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FactMaster" t
    UNION ALL
    SELECT 'FMIssue'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FMIssue" t
$f$;

-- ------------------------------------------------------------------------------------------------ U15 set-up (2026-11-12 rule)
-- Under the wider 2026-11-12 rule a mark may keep its group when it gets a substantive Issue: make two such rows,
-- 74 (kept to the end: U15, U12, U18) and 75 (cleared by its owner in U19).
DO $t$
DECLARE r74 jsonb; r75 jsonb;
BEGIN
    r74 := pg_temp.t_assign(1, 74, 41);
    r75 := pg_temp.t_assign(1, 75, 41);
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES
        (pg_temp.tid(74), pg_temp.tid(32), 4, 5),
        (pg_temp.tid(75), pg_temp.tid(32), 4, 5);
    IF (r74->>'msg')::int IS DISTINCT FROM 1 OR (r75->>'msg')::int IS DISTINCT FROM 1
       OR pg_temp.t_group_of(74) IS DISTINCT FROM pg_temp.tid(41) OR pg_temp.t_group_of(75) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL U15 set-up under 2026-11-12: answers % / %, groups % / %',
            r74, r75, pg_temp.t_group_of(74), pg_temp.t_group_of(75);
    END IF;
END $t$;

CREATE TEMP TABLE u15_before AS SELECT * FROM pg_temp.t_snapshot();

-- ------------------------------------------------------------------------------------------------ load the script under test
\ir 2026-11-12b_private_groups_unassigned_only.up.sql

DO $t$
DECLARE changed text; l jsonb; n_41 int;
BEGIN
    SELECT string_agg(b.k, ', ') INTO changed
      FROM u15_before b LEFT JOIN pg_temp.t_snapshot() a ON a.k = b.k
     WHERE a.v IS DISTINCT FROM b.v;
    IF changed IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U15 the script changed rows in: %', changed;
    END IF;
    l := pg_temp.t_list(1, 11);
    SELECT (e->>'count')::int INTO n_41 FROM jsonb_array_elements(l->'groups') e WHERE e->>'id' = pg_temp.tid(41)::text;
    IF pg_temp.t_group_of(74) IS DISTINCT FROM pg_temp.tid(41)
       OR pg_temp.t_group_of(75) IS DISTINCT FROM pg_temp.tid(41)
       OR (l->>'msg')::int IS DISTINCT FROM 1
       OR l->'assignments' IS DISTINCT FROM '{}'::jsonb
       OR n_41 IS DISTINCT FROM 0
       OR (l->'eligibleFactIds' ? pg_temp.tid(74)::text)
       OR (l->'eligibleFactIds' ? pg_temp.tid(75)::text) THEN
        RAISE EXCEPTION 'FAIL U15 the memberships on marks with an Issue: groups % / %, list %',
            pg_temp.t_group_of(74), pg_temp.t_group_of(75), l;
    END IF;
    RAISE NOTICE 'PASS U15 memberships left on marks with an Issue stay in the table, are not listed; the script changed no row';
END $t$;

-- ------------------------------------------------------------------------------------------------ U01-U14 (Unassigned only)
DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 61, 41);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(61) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL U01 QFact Unassigned: answer %, group %', r, pg_temp.t_group_of(61);
    END IF;
    RAISE NOTICE 'PASS U01 QFact Unassigned: msg 1';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 62, 41);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(62) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL U02 Full Fact Unassigned: answer %, group %', r, pg_temp.t_group_of(62);
    END IF;
    RAISE NOTICE 'PASS U02 Full Fact Unassigned: msg 1';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 63, 41);
    IF (r->>'msg')::int IS DISTINCT FROM -1
       OR r->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(63) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U03 QFact with a substantive Issue: answer %, group %', r, pg_temp.t_group_of(63);
    END IF;
    RAISE NOTICE 'PASS U03 QFact with a substantive Issue: msg -1, no row';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 64, 41);
    IF (r->>'msg')::int IS DISTINCT FROM -1
       OR r->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(64) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U04 Full Fact with a substantive Issue: answer %, group %', r, pg_temp.t_group_of(64);
    END IF;
    RAISE NOTICE 'PASS U04 Full Fact with a substantive Issue: msg -1, no row';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 65, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL U05 set-up: could not group QFact 65: %', r; END IF;
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(65), pg_temp.tid(32), 4, 5);
    IF pg_temp.t_group_of(65) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U05 adding a substantive Issue to a grouped QFact: membership still there (group %)', pg_temp.t_group_of(65);
    END IF;
    RAISE NOTICE 'PASS U05 adding a substantive Issue to a grouped QFact: membership removed';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 66, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL U06 set-up: could not group Full Fact 66: %', r; END IF;
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(66), pg_temp.tid(32), 4, 5);
    IF pg_temp.t_group_of(66) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U06 adding a substantive Issue to a grouped Full Fact: membership still there (group %)', pg_temp.t_group_of(66);
    END IF;
    RAISE NOTICE 'PASS U06 adding a substantive Issue to a grouped Full Fact: membership removed';
END $t$;

DO $t$
DECLARE r jsonb; sys_impact int; sys_relevance int;
BEGIN
    r := pg_temp.t_assign(1, 67, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL U07 set-up: could not group QFact 67: %', r; END IF;
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(67), pg_temp.tid(31), 4, 5);
    SELECT "nImpactid", "nRelevanceid" INTO sys_impact, sys_relevance
      FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(67) AND "nIssueid" = pg_temp.tid(31);
    IF pg_temp.t_group_of(67) IS DISTINCT FROM pg_temp.tid(46)
       OR sys_impact IS DISTINCT FROM 0 OR sys_relevance IS DISTINCT FROM 0 THEN
        RAISE EXCEPTION 'FAIL U07 the system Unassigned Issue row: group %, impact/relevance %/% (want 0/0)',
            pg_temp.t_group_of(67), sys_impact, sys_relevance;
    END IF;
    RAISE NOTICE 'PASS U07 adding only the system Unassigned Issue row: membership kept, impact / relevance 0';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 68, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL U08 set-up: could not group QFact 68: %', r; END IF;
    UPDATE public."FactMaster" SET "cFType" = 'F' WHERE "nFSid" = pg_temp.tid(68);
    IF pg_temp.t_group_of(68) IS DISTINCT FROM pg_temp.tid(46) THEN
        RAISE EXCEPTION 'FAIL U08 cFType QF -> F on a grouped Unassigned mark: group is now %', pg_temp.t_group_of(68);
    END IF;
    UPDATE public."FactMaster" SET "cFType" = 'QF' WHERE "nFSid" = pg_temp.tid(68);
    IF pg_temp.t_group_of(68) IS DISTINCT FROM pg_temp.tid(46) THEN
        RAISE EXCEPTION 'FAIL U08 cFType F -> QF on a grouped Unassigned mark: group is now %', pg_temp.t_group_of(68);
    END IF;
    RAISE NOTICE 'PASS U08 QF -> F and back on a grouped Unassigned mark: membership kept';
END $t$;

DO $t$
DECLARE r69 jsonb; r70 jsonb; r71 jsonb;
BEGIN
    r69 := pg_temp.t_assign(1, 69, 46);
    r70 := pg_temp.t_assign(1, 70, 46);
    r71 := pg_temp.t_assign(1, 71, 46);
    IF (r69->>'msg')::int IS DISTINCT FROM 1 OR (r70->>'msg')::int IS DISTINCT FROM 1 OR (r71->>'msg')::int IS DISTINCT FROM 1 THEN
        RAISE EXCEPTION 'FAIL U09 set-up: answers % / % / %', r69, r70, r71;
    END IF;
    UPDATE public."FactMaster" SET "cFType" = 'X' WHERE "nFSid" = pg_temp.tid(69);
    UPDATE public."FactMaster" SET "nUserid" = pg_temp.tid(2) WHERE "nFSid" = pg_temp.tid(70);
    UPDATE public."FactMaster" SET "nCaseid" = pg_temp.tid(12) WHERE "nFSid" = pg_temp.tid(71);
    IF pg_temp.t_group_of(69) IS NOT NULL OR pg_temp.t_group_of(70) IS NOT NULL OR pg_temp.t_group_of(71) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U09 other type / owner change / case change: groups % / % / %',
            pg_temp.t_group_of(69), pg_temp.t_group_of(70), pg_temp.t_group_of(71);
    END IF;
    RAISE NOTICE 'PASS U09 other type, owner change, case change: membership removed';
END $t$;

-- The four ownership / group refusals answer with one text. Essential mode is refused after the owner check passed,
-- with its own 2026-10-09 text (unchanged by 2026-11-12 and by this script).
DO $t$
DECLARE r_b_mark jsonb; r_b_group jsonb; r_deleted jsonb; r_other_case jsonb; r_essential jsonb;
BEGIN
    r_b_mark := pg_temp.t_assign(2, 72, 44);       -- B files A's mark in B's own group
    r_b_group := pg_temp.t_assign(1, 72, 44);      -- A uses B's group
    r_deleted := pg_temp.t_assign(1, 72, 42);      -- a deleted group
    r_other_case := pg_temp.t_assign(1, 72, 43);   -- a group of another case
    r_essential := pg_temp.t_assign(1, 73, 45);    -- A in Essential mode in C3
    IF (r_b_mark->>'msg')::int IS DISTINCT FROM -1 OR (r_b_group->>'msg')::int IS DISTINCT FROM -1
       OR (r_deleted->>'msg')::int IS DISTINCT FROM -1 OR (r_other_case->>'msg')::int IS DISTINCT FROM -1
       OR (r_essential->>'msg')::int IS DISTINCT FROM -1
       OR r_b_mark->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR r_b_group->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR r_deleted->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR r_other_case->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR r_essential->>'value' IS DISTINCT FROM 'Switch to Advanced to modify this Fact'
       OR pg_temp.t_group_of(72) IS NOT NULL OR pg_temp.t_group_of(73) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U10 refusals: % / % / % / % / %, groups % / %', r_b_mark, r_b_group, r_deleted, r_other_case,
            r_essential, pg_temp.t_group_of(72), pg_temp.t_group_of(73);
    END IF;
    RAISE NOTICE 'PASS U10 another user''s mark, another user''s group, a deleted group, another case''s group, Essential mode: msg -1 each, no row';
END $t$;

DO $t$
DECLARE refused boolean := false; m text;
BEGIN
    BEGIN
        INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid") VALUES (pg_temp.tid(63), pg_temp.tid(41));
    EXCEPTION WHEN raise_exception THEN
        refused := true;
        GET STACKED DIAGNOSTICS m = MESSAGE_TEXT;
    END;
    IF NOT refused OR m IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(63) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U11 direct INSERT for a mark with a substantive Issue: refused %, message %, group %',
            refused, m, pg_temp.t_group_of(63);
    END IF;
    RAISE NOTICE 'PASS U11 direct INSERT into FactPrivateGroup for a mark with a substantive Issue: refused by the guard trigger';
END $t$;

-- Now in the table for A in C1: 61 and 62 in 41 (Unassigned), 74 and 75 in 41 (substantive Issue, U15 set-up; hidden),
-- 67 and 68 in 46. 63, 64, 65, 66 and 75 have a substantive Issue; 69 is type X; 70 is B's now; 71 is in C2.
DO $t$
DECLARE r jsonb; n_41 int; n_46 int; eligible text[];
BEGIN
    r := pg_temp.t_list(1, 11);
    SELECT (e->>'count')::int INTO n_41 FROM jsonb_array_elements(r->'groups') e WHERE e->>'id' = pg_temp.tid(41)::text;
    SELECT (e->>'count')::int INTO n_46 FROM jsonb_array_elements(r->'groups') e WHERE e->>'id' = pg_temp.tid(46)::text;
    SELECT array_agg(x ORDER BY x) INTO eligible FROM jsonb_array_elements_text(r->'eligibleFactIds') x;
    IF (r->>'msg')::int IS DISTINCT FROM 1
       OR jsonb_array_length(r->'groups') IS DISTINCT FROM 2
       OR n_41 IS DISTINCT FROM 2 OR n_46 IS DISTINCT FROM 2
       OR r->'assignments' IS DISTINCT FROM jsonb_build_object(
            pg_temp.tid(61)::text, pg_temp.tid(41)::text, pg_temp.tid(62)::text, pg_temp.tid(41)::text,
            pg_temp.tid(67)::text, pg_temp.tid(46)::text, pg_temp.tid(68)::text, pg_temp.tid(46)::text)
       OR eligible IS DISTINCT FROM ARRAY[pg_temp.tid(61)::text, pg_temp.tid(62)::text, pg_temp.tid(67)::text,
            pg_temp.tid(68)::text, pg_temp.tid(72)::text] THEN
        RAISE EXCEPTION 'FAIL U12 list as A: eligible %, answer %', eligible, r;
    END IF;
    RAISE NOTICE 'PASS U12 list as A: only Unassigned marks'' memberships, counts and eligible ids';
END $t$;

DO $t$
DECLARE r jsonb; seed jsonb; leaked text;
BEGIN
    seed := pg_temp.t_assign(2, 91, 44);
    IF (seed->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL U13 set-up: B could not group B''s own QFact: %', seed; END IF;
    r := pg_temp.t_list(2, 11);
    SELECT string_agg(x.id::text, ', ') INTO leaked
      FROM (SELECT "nGroupid" AS id FROM public."PrivateFactGroup" WHERE "nUserid" = pg_temp.tid(1)
            UNION ALL
            SELECT "nFSid" FROM public."FactMaster" WHERE "nUserid" = pg_temp.tid(1)) x
     WHERE position(x.id::text IN r::text) > 0;
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR leaked IS NOT NULL
       OR jsonb_array_length(r->'groups') IS DISTINCT FROM 1
       OR r->'groups'->0->>'id' IS DISTINCT FROM pg_temp.tid(44)::text
       OR (r->'groups'->0->>'count')::int IS DISTINCT FROM 1
       OR r->'assignments' IS DISTINCT FROM jsonb_build_object(pg_temp.tid(91)::text, pg_temp.tid(44)::text) THEN
        RAISE EXCEPTION 'FAIL U13 list as B: A''s ids in the answer: %; answer %', leaked, r;
    END IF;
    RAISE NOTICE 'PASS U13 list as B: none of A''s groups, ids, counts';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 61, NULL);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(61) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U14 clearing a grouped QFact: answer %, group %', r, pg_temp.t_group_of(61);
    END IF;
    RAISE NOTICE 'PASS U14 clear with null on a grouped QFact: row removed, msg 1';
END $t$;

-- U19: clearing with null is allowed on a mark WITH a substantive Issue. Apart from deleting the group, this is the
-- owner's only way to remove a hidden leftover membership. It uses leftover 75, so 74 stays for U16-U18. The Team
-- Issue row of 75 is not touched.
DO $t$
DECLARE r jsonb; n_issue bigint;
BEGIN
    r := pg_temp.t_assign(1, 75, NULL);
    SELECT count(*) INTO n_issue FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(75) AND "nIssueid" = pg_temp.tid(32);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(75) IS NOT NULL OR n_issue IS DISTINCT FROM 1 THEN
        RAISE EXCEPTION 'FAIL U19 clearing a leftover on a mark with a substantive Issue: answer %, group %, Issue rows %',
            r, pg_temp.t_group_of(75), n_issue;
    END IF;
    RAISE NOTICE 'PASS U19 clear with null on a mark with a substantive Issue (a leftover): row removed, msg 1, Issue kept';
END $t$;

-- ------------------------------------------------------------------------------------------------ U16-U18 (rollback)
CREATE TEMP TABLE u16_before AS SELECT * FROM pg_temp.t_snapshot();

\ir 2026-11-12b_private_groups_unassigned_only.down.sql

-- U03's case again (QFact 63 with a substantive Issue) under the 2026-11-12 rule.
DO $t$
DECLARE changed text; r jsonb;
BEGIN
    SELECT string_agg(b.k, ', ') INTO changed
      FROM u16_before b LEFT JOIN pg_temp.t_snapshot() a ON a.k = b.k
     WHERE a.v IS DISTINCT FROM b.v;
    IF changed IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL U16 the rollback changed rows in: %', changed;
    END IF;
    r := pg_temp.t_assign(1, 63, 41);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(63) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL U16 after down.sql, a QFact with a substantive Issue: answer %, group %', r, pg_temp.t_group_of(63);
    END IF;
    RAISE NOTICE 'PASS U16 down.sql then U03: msg 1 again (2026-11-12 rule back); rows untouched';
END $t$;

-- U17 and U18 check the other two restored 2026-11-12 bodies: the Issue cleanup and the list. "Rows untouched" means
-- the rollback script itself changed no row; U16 compared the fingerprints before anything below ran. U17 then writes
-- one Issue row on purpose, as a test action.
DO $t$
BEGIN
    IF pg_temp.t_group_of(62) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL U17 set-up: Full Fact 62 is not in group 41 (group %)', pg_temp.t_group_of(62);
    END IF;
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(62), pg_temp.tid(32), 4, 5);
    IF pg_temp.t_group_of(62) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL U17 after down.sql, adding a substantive Issue to grouped Full Fact 62: group is now %', pg_temp.t_group_of(62);
    END IF;
    RAISE NOTICE 'PASS U17 after down.sql, adding a substantive Issue to a grouped mark: membership kept (2026-11-12 cleanup back)';
END $t$;

-- In the table for A in C1 now: 62 (Issue since U17), 63 (Issue, grouped in U16) and leftover 74 (Issue) in 41; 67 and
-- 68 in 46. 61 and 75 were cleared (U14, U19). The 2026-11-12 list shows and counts marks with Issues too.
DO $t$
DECLARE l jsonb; n_41 int;
BEGIN
    l := pg_temp.t_list(1, 11);
    SELECT (e->>'count')::int INTO n_41 FROM jsonb_array_elements(l->'groups') e WHERE e->>'id' = pg_temp.tid(41)::text;
    IF (l->>'msg')::int IS DISTINCT FROM 1
       OR l->'assignments'->>(pg_temp.tid(74)::text) IS DISTINCT FROM pg_temp.tid(41)::text
       OR n_41 IS DISTINCT FROM 3
       OR NOT (l->'eligibleFactIds' ? pg_temp.tid(74)::text) THEN
        RAISE EXCEPTION 'FAIL U18 after down.sql, list as A: count of 41 %, answer %', n_41, l;
    END IF;
    RAISE NOTICE 'PASS U18 after down.sql, list as A: leftover 74 is in assignments, counted and eligible again';
END $t$;

\echo 'PASS all 19 checks'
