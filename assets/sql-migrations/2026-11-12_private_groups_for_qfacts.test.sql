-- 2026-11-12_private_groups_for_qfacts.test.sql
--
-- Scratch-database test of 2026-11-12_private_groups_for_qfacts.up.sql (a QFact, or a mark with a Team Issue, may be
-- in its creator's Private Group) and of its rollback 2026-11-12_private_groups_for_qfacts.down.sql: checks T01-T20
-- of docs/superpowers/plans/2026-11-11-qfact-private-analysis-groups.md, Task 1.
--
-- NOT RUN YET. Written 2026-11-11 without a database. Running it is Task 2, Operation A, and needs the owner's
-- approval first (Golden Rule 1).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261112).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * Creates the seven small tables the functions read (as tools/ci/test-private-fact-groups.cjs does), then loads
--     2026-10-09_private_fact_groups.up.sql and 2026-11-12_private_groups_for_qfacts.up.sql from this folder.
--   * Adds fixture rows with ids 10000000-0000-4000-8000-0000000000NN. The checks change only those rows; T18 deletes
--     one fixture mark to check the cascade. Nothing is rolled back: the loaded migrations commit themselves, so one
--     wrapping transaction is not possible. Throw the scratch database away afterwards (a separate approval).
--   * T20 loads 2026-11-12_private_groups_for_qfacts.down.sql, so the scratch database ends on the 2026-10-09 rules.
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git: copy it from the back-end
-- checkout before running).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-12_private_groups_for_qfacts.test.sql
-- Pass: a NOTICE "PASS Tnn ..." for each of T01-T20, then "PASS all 20 checks". A failure stops at "FAIL Tnn ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'private_groups_for_qfacts test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'private_groups_for_qfacts test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- Ids: pg_temp.tid(n) = 10000000-0000-4000-8000-<n as 12 digits>.
--   Users   1 = A, 2 = B.
--   Cases   11 = C1, 12 = C2, 13 = C3 (A works in Essential mode in C3; Advanced everywhere else).
--   Issues  31 = the system Unassigned Issue; 32 = a substantive Issue (a named Issue under the Unassigned Claim).
--   Groups  41 A/C1; 42 A/C1 deleted; 43 A/C2; 44 B/C1; 45 A/C3; 46 A/C1 (used by the identity-change checks).
--   Marks   21-28 and 30 belong to A in C1; 29 to A in C3; 51 to B in C1. 'QF' = QFact, 'F' = Full Fact.
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
    (pg_temp.tid(21), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(22), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(23), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(24), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(25), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(26), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(27), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(28), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(29), pg_temp.tid(13), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(30), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(51), pg_temp.tid(11), pg_temp.tid(2), 'QF');
-- 21 is Unassigned (linked to the system Issue only); 22 is a Full Fact with a substantive Issue.
INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES
    (pg_temp.tid(21), pg_temp.tid(31), 0, 0),
    (pg_temp.tid(22), pg_temp.tid(32), 4, 5);
COMMIT;

-- ------------------------------------------------------------------------------------------------ load the migrations
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
    (pg_temp.tid(46), pg_temp.tid(11), pg_temp.tid(1), 'A identity-change group', NULL);

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

-- One fingerprint per table, to prove the rollback changes no row.
CREATE FUNCTION pg_temp.t_snapshot() RETURNS TABLE(k text, v text) LANGUAGE sql AS $f$
    SELECT 'FactPrivateGroup'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FactPrivateGroup" t
    UNION ALL
    SELECT 'PrivateFactGroup'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."PrivateFactGroup" t
    UNION ALL
    SELECT 'FactMaster'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FactMaster" t
    UNION ALL
    SELECT 'FMIssue'::text, md5(COALESCE(string_agg(t::text, '|' ORDER BY t::text), '')) FROM public."FMIssue" t
$f$;

-- ------------------------------------------------------------------------------------------------ T01-T19 (new rules)
DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 21, 41);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(21) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL T01 a QFact owned by the actor, Unassigned: answer %, group %', r, pg_temp.t_group_of(21);
    END IF;
    RAISE NOTICE 'PASS T01 a QFact owned by the actor, Unassigned: msg 1, row exists';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(21), pg_temp.tid(32), 4, 5);
    r := pg_temp.t_assign(1, 21, 41);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(21) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL T02 the same QFact with a substantive Issue: answer %, group %', r, pg_temp.t_group_of(21);
    END IF;
    RAISE NOTICE 'PASS T02 the same QFact with a substantive Issue: msg 1 (D1)';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 22, 41);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(22) IS DISTINCT FROM pg_temp.tid(41) THEN
        RAISE EXCEPTION 'FAIL T03 a Full Fact with a substantive Issue: answer %, group %', r, pg_temp.t_group_of(22);
    END IF;
    RAISE NOTICE 'PASS T03 a Full Fact with a substantive Issue: msg 1 (D1)';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 23, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL T04 setup: could not group QFact 23: %', r; END IF;
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(23), pg_temp.tid(32), 4, 5);
    IF pg_temp.t_group_of(23) IS DISTINCT FROM pg_temp.tid(46) THEN
        RAISE EXCEPTION 'FAIL T04 adding a substantive Issue to a grouped QFact: group is now %', pg_temp.t_group_of(23);
    END IF;
    RAISE NOTICE 'PASS T04 adding a substantive Issue to a grouped QFact: membership still there';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 24, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL T05 setup: could not group QFact 24: %', r; END IF;
    UPDATE public."FactMaster" SET "cFType" = 'F' WHERE "nFSid" = pg_temp.tid(24);
    IF pg_temp.t_group_of(24) IS DISTINCT FROM pg_temp.tid(46) THEN
        RAISE EXCEPTION 'FAIL T05 cFType QF -> F on a grouped mark: group is now %', pg_temp.t_group_of(24);
    END IF;
    UPDATE public."FactMaster" SET "cFType" = 'QF' WHERE "nFSid" = pg_temp.tid(24);
    IF pg_temp.t_group_of(24) IS DISTINCT FROM pg_temp.tid(46) THEN
        RAISE EXCEPTION 'FAIL T05 cFType F -> QF on a grouped mark: group is now %', pg_temp.t_group_of(24);
    END IF;
    RAISE NOTICE 'PASS T05 cFType QF -> F (and back) on a grouped mark: membership still there';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 25, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL T06 setup: could not group Full Fact 25: %', r; END IF;
    UPDATE public."FactMaster" SET "cFType" = 'X' WHERE "nFSid" = pg_temp.tid(25);
    IF pg_temp.t_group_of(25) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T06 cFType F -> X: membership still there (group %)', pg_temp.t_group_of(25);
    END IF;
    RAISE NOTICE 'PASS T06 cFType F -> X (any other type): membership removed';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 26, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL T07 setup: could not group Full Fact 26: %', r; END IF;
    UPDATE public."FactMaster" SET "nUserid" = pg_temp.tid(2) WHERE "nFSid" = pg_temp.tid(26);
    IF pg_temp.t_group_of(26) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T07 owner changes: membership still there (group %)', pg_temp.t_group_of(26);
    END IF;
    RAISE NOTICE 'PASS T07 owner changes: membership removed';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 27, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL T08 setup: could not group QFact 27: %', r; END IF;
    UPDATE public."FactMaster" SET "nCaseid" = pg_temp.tid(12) WHERE "nFSid" = pg_temp.tid(27);
    IF pg_temp.t_group_of(27) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T08 case changes: membership still there (group %)', pg_temp.t_group_of(27);
    END IF;
    RAISE NOTICE 'PASS T08 case changes: membership removed';
END $t$;

DO $t$
DECLARE r_own jsonb; r_a jsonb;
BEGIN
    r_own := pg_temp.t_assign(2, 28, 44);   -- B files A's QFact in B's own group
    r_a := pg_temp.t_assign(2, 28, 41);     -- B files A's QFact in A's group
    IF (r_own->>'msg')::int IS DISTINCT FROM -1 OR (r_a->>'msg')::int IS DISTINCT FROM -1
       OR r_own->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR r_a->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(28) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T09 actor B assigns actor A''s mark: answers % / %, group %', r_own, r_a, pg_temp.t_group_of(28);
    END IF;
    RAISE NOTICE 'PASS T09 actor B assigns actor A''s mark: msg -1, no row';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 28, 44);
    IF (r->>'msg')::int IS DISTINCT FROM -1
       OR r->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(28) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T10 actor A assigns B''s group to A''s mark: answer %, group %', r, pg_temp.t_group_of(28);
    END IF;
    RAISE NOTICE 'PASS T10 actor A assigns B''s group to A''s mark: msg -1, no row';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 28, 42);
    IF (r->>'msg')::int IS DISTINCT FROM -1
       OR r->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(28) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T11 a deleted group: answer %, group %', r, pg_temp.t_group_of(28);
    END IF;
    RAISE NOTICE 'PASS T11 a deleted group: msg -1, no row';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 28, 43);
    IF (r->>'msg')::int IS DISTINCT FROM -1
       OR r->>'value' IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(28) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T12 a group of another case: answer %, group %', r, pg_temp.t_group_of(28);
    END IF;
    RAISE NOTICE 'PASS T12 a group of another case: msg -1, no row';
END $t$;

DO $t$
DECLARE r jsonb; r_clear jsonb;
BEGIN
    r := pg_temp.t_assign(1, 29, 45);
    IF (r->>'msg')::int IS DISTINCT FROM -1 OR r->>'value' IS DISTINCT FROM 'Switch to Advanced to modify this Fact'
       OR pg_temp.t_group_of(29) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T13 Essential mode (cUIMode E): answer %, group %', r, pg_temp.t_group_of(29);
    END IF;
    -- Clearing needs the same conditions: a membership made outside the assign function stays.
    INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid") VALUES (pg_temp.tid(29), pg_temp.tid(45));
    r_clear := pg_temp.t_assign(1, 29, NULL);
    IF (r_clear->>'msg')::int IS DISTINCT FROM -1 OR pg_temp.t_group_of(29) IS DISTINCT FROM pg_temp.tid(45) THEN
        RAISE EXCEPTION 'FAIL T13 Essential mode clear: answer %, group %', r_clear, pg_temp.t_group_of(29);
    END IF;
    RAISE NOTICE 'PASS T13 Essential mode (cUIMode E): msg -1, no row; a clear is refused too';
END $t$;

DO $t$
DECLARE refused boolean := false; m text;
BEGIN
    BEGIN
        INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid") VALUES (pg_temp.tid(28), pg_temp.tid(44));
    EXCEPTION WHEN raise_exception THEN
        refused := true;
        GET STACKED DIAGNOSTICS m = MESSAGE_TEXT;
    END;
    IF NOT refused OR m IS DISTINCT FROM 'Private Group is available only to the creator of the mark'
       OR pg_temp.t_group_of(28) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T14 direct INSERT, other owner: refused %, message %, group %', refused, m, pg_temp.t_group_of(28);
    END IF;
    RAISE NOTICE 'PASS T14 direct INSERT into FactPrivateGroup, other owner: refused by the guard trigger';
END $t$;

DO $t$
DECLARE r jsonb; n_41 int;
BEGIN
    r := pg_temp.t_list(1, 11);
    SELECT (e->>'count')::int INTO n_41 FROM jsonb_array_elements(r->'groups') e WHERE e->>'id' = pg_temp.tid(41)::text;
    IF (r->>'msg')::int IS DISTINCT FROM 1
       OR r->'assignments'->>(pg_temp.tid(21)::text) IS DISTINCT FROM pg_temp.tid(41)::text
       OR r->'assignments'->>(pg_temp.tid(22)::text) IS DISTINCT FROM pg_temp.tid(41)::text
       OR n_41 IS DISTINCT FROM 2
       OR NOT (r->'eligibleFactIds' ? pg_temp.tid(21)::text)
       OR NOT (r->'eligibleFactIds' ? pg_temp.tid(22)::text)
       OR EXISTS (SELECT 1 FROM jsonb_array_elements(r->'groups') e
                   WHERE e->>'id' IN (pg_temp.tid(42)::text, pg_temp.tid(43)::text, pg_temp.tid(44)::text)) THEN
        RAISE EXCEPTION 'FAIL T15 list as A: %', r;
    END IF;
    RAISE NOTICE 'PASS T15 list as A: QFact + Fact memberships shown, count = 2';
END $t$;

DO $t$
DECLARE r jsonb; seed jsonb; leaked text;
BEGIN
    seed := pg_temp.t_assign(2, 51, 44);
    IF (seed->>'msg')::int IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'FAIL T16 setup: B could not group B''s own QFact: %', seed; END IF;
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
       OR r->'assignments' IS DISTINCT FROM jsonb_build_object(pg_temp.tid(51)::text, pg_temp.tid(44)::text) THEN
        RAISE EXCEPTION 'FAIL T16 list as B: A''s ids in the answer: %; answer %', leaked, r;
    END IF;
    RAISE NOTICE 'PASS T16 list as B (same case): none of A''s groups, ids, counts';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 21, NULL);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(21) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T17 clearing a grouped QFact: answer %, group %', r, pg_temp.t_group_of(21);
    END IF;
    RAISE NOTICE 'PASS T17 clearing (null) on a grouped QFact: row removed, msg 1';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 30, 46);
    IF (r->>'msg')::int IS DISTINCT FROM 1 OR pg_temp.t_group_of(30) IS DISTINCT FROM pg_temp.tid(46) THEN
        RAISE EXCEPTION 'FAIL T18 setup: could not group QFact 30: %', r;
    END IF;
    DELETE FROM public."FactMaster" WHERE "nFSid" = pg_temp.tid(30);   -- the fixture mark this check created
    IF pg_temp.t_group_of(30) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T18 deleting the mark: membership still there';
    END IF;
    RAISE NOTICE 'PASS T18 deleting the mark: membership cascades';
END $t$;

DO $t$
DECLARE sys_impact int; sys_relevance int; sub_impact int; sub_relevance int;
BEGIN
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(22), pg_temp.tid(31), 4, 5);
    SELECT "nImpactid", "nRelevanceid" INTO sys_impact, sys_relevance
      FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(22) AND "nIssueid" = pg_temp.tid(31);
    SELECT "nImpactid", "nRelevanceid" INTO sub_impact, sub_relevance
      FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(23) AND "nIssueid" = pg_temp.tid(32);
    IF sys_impact IS DISTINCT FROM 0 OR sys_relevance IS DISTINCT FROM 0
       OR sub_impact IS DISTINCT FROM 4 OR sub_relevance IS DISTINCT FROM 5 THEN
        RAISE EXCEPTION 'FAIL T19 system Unassigned row %/% (want 0/0), substantive row %/% (want 4/5)',
            sys_impact, sys_relevance, sub_impact, sub_relevance;
    END IF;
    RAISE NOTICE 'PASS T19 a system Unassigned Issue row still gets impact 0 / relevance 0';
END $t$;

-- ------------------------------------------------------------------------------------------------ T20 (rollback)
CREATE TEMP TABLE t20_before AS SELECT * FROM pg_temp.t_snapshot();

\ir 2026-11-12_private_groups_for_qfacts.down.sql

-- T01's case again (an Unassigned QFact of the actor: 28, as 21 now has a substantive Issue) under the old rule.
DO $t$
DECLARE changed text; r jsonb; l jsonb;
BEGIN
    SELECT string_agg(b.k, ', ') INTO changed
      FROM t20_before b LEFT JOIN pg_temp.t_snapshot() a ON a.k = b.k
     WHERE a.v IS DISTINCT FROM b.v;
    IF changed IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T20 the rollback changed rows in: %', changed;
    END IF;
    r := pg_temp.t_assign(1, 28, 41);
    IF (r->>'msg')::int IS DISTINCT FROM -1
       OR r->>'value' IS DISTINCT FROM 'Private Group is available only to the Full Fact creator'
       OR pg_temp.t_group_of(28) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL T20 after down.sql, assigning an Unassigned QFact: answer %, group %', r, pg_temp.t_group_of(28);
    END IF;
    -- Memberships made under the wider rule stay in the table and the old list does not show them.
    l := pg_temp.t_list(1, 11);
    IF pg_temp.t_group_of(22) IS DISTINCT FROM pg_temp.tid(41) OR pg_temp.t_group_of(23) IS DISTINCT FROM pg_temp.tid(46)
       OR pg_temp.t_group_of(24) IS DISTINCT FROM pg_temp.tid(46)
       OR (l->>'msg')::int IS DISTINCT FROM 1 OR l->'assignments' IS DISTINCT FROM '{}'::jsonb THEN
        RAISE EXCEPTION 'FAIL T20 after down.sql, memberships kept and not listed: groups % / % / %, list %',
            pg_temp.t_group_of(22), pg_temp.t_group_of(23), pg_temp.t_group_of(24), l;
    END IF;
    RAISE NOTICE 'PASS T20 down.sql then T01: msg -1 (old rule back); rows untouched';
END $t$;

\echo 'PASS all 20 checks'
