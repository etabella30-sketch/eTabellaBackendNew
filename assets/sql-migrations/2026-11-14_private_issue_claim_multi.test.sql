-- 2026-11-14_private_issue_claim_multi.test.sql
--
-- Scratch-database test of 2026-11-14_private_issue_claim_multi.up.sql (a Private Group has a claim, a Mark may be in
-- several of its creator's groups, a group may sit on a Mark beside its Team Issues) and of its rollback
-- 2026-11-14_private_issue_claim_multi.down.sql: checks M01-M15 of Task 1
-- (.superpowers/sdd/2026-11-12-private-issues-under-claims/task-1-brief.md) and, from review fix round 1, M16 (the
-- down script refuses while a membership sits on a Mark with a substantive Team Issue) and M17 (a list with a
-- duplicate id gives one membership).
--
-- NOT RUN YET. Written 2026-11-12 without a database. Running it needs the owner's approval first (Golden Rule 1).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261114).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run. The one
--     exception is the rollback part: it runs the down script three times while the down script must refuse (M15: a
--     Mark with two memberships; M15: a group with a claim; M16: a membership on a Mark with a substantive Team Issue),
--     each time with ON_ERROR_STOP off, so psql prints the refusal and "current transaction is aborted" errors there.
--     Those ERROR lines are expected; the check after each run decides.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * Creates the eight small tables the functions read (the seven of 2026-11-13_private_group_colour.test.sql plus
--     "IssueCategory"), then loads from this folder, in order: 2026-10-09_private_fact_groups.up.sql,
--     2026-11-12_private_groups_for_qfacts.up.sql (so a membership on a Mark with a Team Issue can be made, as it could
--     while 2026-11-12 was live), 2026-11-12b_private_groups_unassigned_only.up.sql,
--     2026-11-13_private_group_colour.up.sql, then the script under test and, at the end, its rollback.
--   * Fixture ids are f0000000-0000-4000-8000-0000000000NN. Nothing is rolled back: the loaded scripts commit
--     themselves. The checks change only fixture rows: M06 deletes the fixture claim row 38 this script created (to
--     show a claim that no longer exists), M14 deletes fixture group 42 through et_workspace_private_groups, and
--     M15 / M16 un-tick and clear fixture memberships and claims through the two functions so that the down script may
--     run. Before the up, the primary key of "FactPrivateGroup" is renamed to "FactPrivateGroup_key_r2", so the test
--     shows that the up and the down look the key's name up and keep it. Throw the scratch database away afterwards (a
--     separate approval).
--   * Order of execution: the baseline under the 2026-11-12b / 2026-11-13 bodies, the up script, M11 (what loading it
--     did), M01-M10, M17, M12-M14, then the rollback: two refused runs (M15), one refused run (M16), then the down
--     script (M15).
--
-- NOT COVERED BY THIS TEST:
--   * The real column types of the stand-ins (text here where production may have varchar or char), in particular
--     "IssueCategory"."cICtype" and "cCategory".
--   * The drift guard against a changed body and a second run of the up script (refused as "already applied"): the up
--     script is loaded once, against the 2026-11-12b / 2026-11-13 bodies, which its drift guard must accept.
--   * Two sessions at once (a concurrent assign, group delete or rollback) and production volumes.
--   * The code outside these four functions: the realtime-server statements (plan Task 3, deployed before this script)
--     and the export helper et_export_private_group of 2026-11-13b (2026-11-14b, applied together with this script).
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-14_private_issue_claim_multi.test.sql
-- Pass: a NOTICE "PASS Mnn ..." for each of M01-M17, then "PASS all 17 checks". A failure stops at "FAIL Mnn ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'private_issue_claim_multi test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'private_issue_claim_multi test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- Ids: pg_temp.tid(n) = f0000000-0000-4000-8000-<n as 12 digits>.
--   Users   1 = A, 2 = B. Both Advanced in case 11; A also Advanced in case 12.
--   Cases   11 = C1, 12 = C2.
--   Issues  31 = the system Unassigned Issue; 32 = a substantive Issue (a named Issue).
--   Claims  ("IssueCategory") 35 'Liability' (C1), 36 the system Unassigned claim of C1 (cICtype 'U', cCategory
--           'Unassigned'), 37 'Other case claim' (C2), 38 'Quantum' (C1; removed in M06).
--   Groups  41 'Alpha', 42 'Beta', 46 'Gamma' (A, C1), 43 'B group' (B, C1), 44 'Gone' (A, C1, deleted),
--           45 'Elsewhere' (A, C2). M01-M06 create four more (A, C1).
--   Marks   all A's in C1 ('QF' = QFact, 'F' = Full Fact):
--             61 QF with the substantive Issue 32 (M07)     62 F, no Issue row (M08, M09)
--             63 QF in 46 since before the up, then given Issue 32 under the 2026-11-12 rule: a leftover (M11)
--             64 QF (M10)     65 F in 41 since before the up (M12, M13)     66 QF (M14, M15)
--             67 QF (M07, a list in the other order)
CREATE FUNCTION pg_temp.tid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$f$ SELECT ('f0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;

BEGIN;
CREATE TABLE public."CaseMaster"("nCaseid" uuid PRIMARY KEY);
CREATE TABLE public."UserMaster"("nUserid" uuid PRIMARY KEY, "isAdmin" boolean);
CREATE TABLE public."TeamRelation"("nCaseid" uuid, "nUserid" uuid, "cStatus" text);
CREATE TABLE public."UserCaseUiMode"("nCaseid" uuid, "nUserid" uuid, "cUIMode" text);
CREATE TABLE public."FactMaster"("nFSid" uuid PRIMARY KEY, "nCaseid" uuid, "nUserid" uuid, "cFType" text);
CREATE TABLE public."RIssueMaster"("nIid" uuid PRIMARY KEY, "nUserid" uuid, "cIName" text);
CREATE TABLE public."FMIssue"("nFSid" uuid, "nIssueid" uuid, "nImpactid" int, "nRelevanceid" int);
CREATE TABLE public."IssueCategory"("nICid" uuid PRIMARY KEY, "nCaseid" uuid, "cCategory" text, "cICtype" text);

INSERT INTO public."UserMaster"("nUserid", "isAdmin") VALUES (pg_temp.tid(1), false), (pg_temp.tid(2), false);
INSERT INTO public."CaseMaster"("nCaseid") VALUES (pg_temp.tid(11)), (pg_temp.tid(12));
INSERT INTO public."TeamRelation"("nCaseid", "nUserid", "cStatus") VALUES
    (pg_temp.tid(11), pg_temp.tid(1), 'A'), (pg_temp.tid(12), pg_temp.tid(1), 'A'), (pg_temp.tid(11), pg_temp.tid(2), 'A');
INSERT INTO public."UserCaseUiMode"("nCaseid", "nUserid", "cUIMode") VALUES
    (pg_temp.tid(11), pg_temp.tid(1), 'A'), (pg_temp.tid(12), pg_temp.tid(1), 'A'), (pg_temp.tid(11), pg_temp.tid(2), 'A');
INSERT INTO public."RIssueMaster"("nIid", "nUserid", "cIName") VALUES
    (pg_temp.tid(31), NULL, 'Unassigned'),
    (pg_temp.tid(32), pg_temp.tid(1), 'Named Issue');
-- cICtype 'C' stands for any claim type other than the system 'U'.
INSERT INTO public."IssueCategory"("nICid", "nCaseid", "cCategory", "cICtype") VALUES
    (pg_temp.tid(35), pg_temp.tid(11), 'Liability', 'C'),
    (pg_temp.tid(36), pg_temp.tid(11), 'Unassigned', 'U'),
    (pg_temp.tid(37), pg_temp.tid(12), 'Other case claim', 'C'),
    (pg_temp.tid(38), pg_temp.tid(11), 'Quantum', 'C');
INSERT INTO public."FactMaster"("nFSid", "nCaseid", "nUserid", "cFType") VALUES
    (pg_temp.tid(61), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(62), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(63), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(64), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(65), pg_temp.tid(11), pg_temp.tid(1), 'F'),
    (pg_temp.tid(66), pg_temp.tid(11), pg_temp.tid(1), 'QF'),
    (pg_temp.tid(67), pg_temp.tid(11), pg_temp.tid(1), 'QF');
INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(61), pg_temp.tid(32), 4, 5);
COMMIT;

-- ------------------------------------------------------------------------------------------------ load the earlier scripts
-- Their guard accepts the database named in etabella.expected_database. Name the scratch database only: anywhere
-- else the setting names no real database, so the migrations' own guards refuse too.
SELECT set_config('etabella.expected_database',
    CASE WHEN left(current_database(), 16) = 'etabella_scratch' THEN current_database() ELSE 'not-a-scratch-database' END,
    false) AS expected_database;

\ir 2026-10-09_private_fact_groups.up.sql
\ir 2026-11-12_private_groups_for_qfacts.up.sql

INSERT INTO public."PrivateFactGroup"("nGroupid", "nCaseid", "nUserid", "cName", "dDeletedDt") VALUES
    (pg_temp.tid(41), pg_temp.tid(11), pg_temp.tid(1), 'Alpha', NULL),
    (pg_temp.tid(42), pg_temp.tid(11), pg_temp.tid(1), 'Beta', NULL),
    (pg_temp.tid(43), pg_temp.tid(11), pg_temp.tid(2), 'B group', NULL),
    (pg_temp.tid(44), pg_temp.tid(11), pg_temp.tid(1), 'Gone', now()),
    (pg_temp.tid(45), pg_temp.tid(12), pg_temp.tid(1), 'Elsewhere', NULL),
    (pg_temp.tid(46), pg_temp.tid(11), pg_temp.tid(1), 'Gamma', NULL);
-- Under 2026-11-12 a group could stay on a Mark that got a Team Issue: 63 keeps such a membership in 46.
INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid") VALUES
    (pg_temp.tid(63), pg_temp.tid(46)), (pg_temp.tid(65), pg_temp.tid(41));
INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(63), pg_temp.tid(32), 4, 5);

\ir 2026-11-12b_private_groups_unassigned_only.up.sql
\ir 2026-11-13_private_group_colour.up.sql

-- ------------------------------------------------------------------------------------------------ helpers
-- Fails the check when got is not want (NULL equals NULL).
CREATE FUNCTION pg_temp.t_expect(check_name text, what text, got jsonb, want jsonb) RETURNS void
LANGUAGE plpgsql AS $f$
BEGIN
    IF got IS DISTINCT FROM want THEN
        RAISE EXCEPTION 'FAIL % %: got %, expected %', check_name, what, got, want;
    END IF;
END $f$;

-- A jsonb array of fixture ids as text, in the given order.
CREATE FUNCTION pg_temp.t_ids(ns integer[]) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT COALESCE(jsonb_agg(pg_temp.tid(u.n)::text ORDER BY u.o), '[]'::jsonb) FROM unnest(ns) WITH ORDINALITY u(n, o) $f$;

-- The answer of et_workspace_private_groups as jsonb: {msg, nGroupid, groups, assignments, memberships,
-- eligibleFactIds, systemIssueIds} or {msg: -1, value}. The parameter is passed as given, so a check controls which
-- keys are present.
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

-- The element of "groups" with id g (NULL when it is not listed).
CREATE FUNCTION pg_temp.t_group_id(l jsonb, g uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT e FROM jsonb_array_elements(l->'groups') e WHERE e->>'id' = g::text $f$;
CREATE FUNCTION pg_temp.t_group(l jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_group_id(l, pg_temp.tid(n)) $f$;

-- The assign answer as jsonb ({"msg": 1, "nFSid": ...} or {"msg": -1, "value": ...}); the parameter as given.
CREATE FUNCTION pg_temp.t_assign_p(p jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE c refcursor := 't_assign_result'; r record;
BEGIN
    PERFORM public.et_private_group_assign(p::json, c);
    FETCH c INTO r;
    CLOSE c;
    RETURN row_to_json(r)::jsonb;
END $f$;
-- jPrivateGroupids = the groups ns, in that order.
CREATE FUNCTION pg_temp.t_assign(actor_n integer, mark_n integer, ns integer[]) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_assign_p(jsonb_build_object('nMasterid', pg_temp.tid(actor_n), 'nFSid', pg_temp.tid(mark_n),
        'jPrivateGroupids', pg_temp.t_ids(ns))) $f$;
-- The legacy single key nPrivateGroupid; grp_n null sends nPrivateGroupid: null.
CREATE FUNCTION pg_temp.t_assign_one(actor_n integer, mark_n integer, grp_n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_assign_p(jsonb_build_object('nMasterid', pg_temp.tid(actor_n), 'nFSid', pg_temp.tid(mark_n),
        'nPrivateGroupid', pg_temp.tid(grp_n))) $f$;

-- The memberships as (mark, group) pairs, without dCreateDt (so the value is comparable before the up and after the down).
CREATE FUNCTION pg_temp.t_pairs_md5() RETURNS text LANGUAGE sql AS
$f$ SELECT md5(COALESCE(string_agg("nFSid"::text || '/' || "nGroupid"::text, '|' ORDER BY "nFSid"::text, "nGroupid"::text), ''))
    FROM public."FactPrivateGroup" $f$;
-- The rows a script must not change: the pairs, the groups (without the new "nICid"), the marks and the Issue rows.
CREATE FUNCTION pg_temp.t_rows_md5() RETURNS text LANGUAGE sql AS
$f$ SELECT md5(concat_ws('#', pg_temp.t_pairs_md5(),
    (SELECT md5(COALESCE(string_agg((to_jsonb(t) - 'nICid')::text, '|' ORDER BY t."nGroupid"), '')) FROM public."PrivateFactGroup" t),
    (SELECT md5(COALESCE(string_agg(to_jsonb(t)::text, '|' ORDER BY t::text), '')) FROM public."FactMaster" t),
    (SELECT md5(COALESCE(string_agg(to_jsonb(t)::text, '|' ORDER BY t::text), '')) FROM public."FMIssue" t))) $f$;

-- md5 of the four function sources (CR removed: a Windows checkout has CRLF files, the committed files are LF).
CREATE FUNCTION pg_temp.t_fns() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_object_agg(proname, md5(replace(prosrc, E'\r', ''))) FROM pg_proc WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('et_fact_private_group_guard', 'et_fact_issue_private_cleanup', 'et_private_group_assign',
                    'et_workspace_private_groups') $f$;

-- The primary key columns of "FactPrivateGroup" ('nFSid' or 'nFSid,nGroupid'), the two new columns and the new index.
CREATE FUNCTION pg_temp.t_pk() RETURNS text LANGUAGE sql AS
$f$ SELECT string_agg(a.attname::text, ',' ORDER BY k.ord) FROM pg_constraint c
    CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.conrelid = 'public."FactPrivateGroup"'::regclass AND c.contype = 'p' $f$;
CREATE FUNCTION pg_temp.t_shape() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object('pk', pg_temp.t_pk(),
    'pk_name', (SELECT conname::text FROM pg_constraint WHERE conrelid = 'public."FactPrivateGroup"'::regclass AND contype = 'p'),
    'nICid', (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public'
                AND table_name = 'PrivateFactGroup' AND column_name = 'nICid'),
    'dCreateDt', (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public'
                    AND table_name = 'FactPrivateGroup' AND column_name = 'dCreateDt'),
    'index', to_regclass('public.fact_private_group_fact') IS NOT NULL) $f$;

-- ------------------------------------------------------------------------------------------------ baseline (2026-11-12b / 2026-11-13)
-- A primary key name that is not the default one: the up and the down must look it up and keep it (M11, M15).
DO $t$
DECLARE pk text := (SELECT conname::text FROM pg_constraint WHERE conrelid = 'public."FactPrivateGroup"'::regclass AND contype = 'p');
BEGIN
    EXECUTE format('ALTER TABLE public."FactPrivateGroup" RENAME CONSTRAINT %I TO "FactPrivateGroup_key_r2"', pk);
END $t$;

CREATE TEMP TABLE c_before AS SELECT pg_temp.t_list(1) AS list_a, pg_temp.t_rows_md5() AS rows_md5,
    pg_temp.t_fns() AS fns, pg_temp.t_shape() AS shape;

DO $t$
DECLARE b record;
BEGIN
    SELECT * INTO b FROM c_before;
    PERFORM pg_temp.t_expect('set-up', 'shape before the up', b.shape,
        '{"pk": "nFSid", "pk_name": "FactPrivateGroup_key_r2", "nICid": 0, "dCreateDt": 0, "index": false}');
    PERFORM pg_temp.t_expect('set-up', 'four function sources before the up', to_jsonb((SELECT count(*) FROM jsonb_object_keys(b.fns))), '4');
END $t$;

-- ------------------------------------------------------------------------------------------------ the up script
\ir 2026-11-14_private_issue_claim_multi.up.sql

CREATE TEMP TABLE c_after_up AS SELECT pg_temp.t_fns() AS fns, pg_temp.t_shape() AS shape;

-- Helpers that read the new columns (created only now: a LANGUAGE sql body is checked when it is created).
-- The groups of mark n, oldest first, as stored.
CREATE FUNCTION pg_temp.t_groups_of(mark_n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg("nGroupid"::text ORDER BY "dCreateDt", "nGroupid"), '[]'::jsonb) FROM public."FactPrivateGroup"
    WHERE "nFSid" = pg_temp.tid(mark_n) $f$;
-- The stored claim of group g, and a fingerprint of one group row.
CREATE FUNCTION pg_temp.t_claim(g uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT to_jsonb("nICid") FROM public."PrivateFactGroup" WHERE "nGroupid" = g $f$;
CREATE FUNCTION pg_temp.t_group_md5(g uuid) RETURNS text LANGUAGE sql AS
$f$ SELECT md5(t::text) FROM public."PrivateFactGroup" t WHERE "nGroupid" = g $f$;
-- What a refused down script must leave as it was: sources, shape, rows, claims and membership times.
CREATE FUNCTION pg_temp.t_state() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object('fns', pg_temp.t_fns(), 'shape', pg_temp.t_shape(), 'rows', pg_temp.t_rows_md5(),
    'claims', (SELECT md5(COALESCE(string_agg("nGroupid"::text || '/' || COALESCE("nICid"::text, '-'), '|' ORDER BY "nGroupid"), ''))
               FROM public."PrivateFactGroup"),
    'times', (SELECT md5(COALESCE(string_agg("nFSid"::text || '/' || "nGroupid"::text || '/' || "dCreateDt"::text, '|'
                                              ORDER BY "nFSid", "nGroupid"), ''))
              FROM public."FactPrivateGroup")) $f$;

-- ------------------------------------------------------------------------------------------------ M11 (what loading the up did)
DO $t$
DECLARE b record; l jsonb;
BEGIN
    SELECT * INTO b FROM c_before;
    -- Before the up (2026-11-12b / 2026-11-13 bodies) 63's membership in 46 was hidden: not listed, not counted.
    PERFORM pg_temp.t_expect('M11', 'before the up: 63 in assignments', to_jsonb((b.list_a->'assignments') ? pg_temp.tid(63)::text), 'false');
    PERFORM pg_temp.t_expect('M11', 'before the up: count of Gamma', pg_temp.t_group(b.list_a, 46)->'count', '0');
    -- The up deleted and changed no row; every existing membership got the same dCreateDt (the migration's time).
    PERFORM pg_temp.t_expect('M11', 'rows (memberships, groups, marks, Issue rows)', to_jsonb(pg_temp.t_rows_md5()), to_jsonb(b.rows_md5));
    PERFORM pg_temp.t_expect('M11', 'distinct dCreateDt of the 2 existing memberships',
        to_jsonb((SELECT count(DISTINCT "dCreateDt") FROM public."FactPrivateGroup")), '1');
    PERFORM pg_temp.t_expect('M11', 'claims after the up', to_jsonb((SELECT count(*) FROM public."PrivateFactGroup" WHERE "nICid" IS NOT NULL)), '0');
    PERFORM pg_temp.t_expect('M11', 'shape after the up', (SELECT shape FROM c_after_up),
        '{"pk": "nFSid,nGroupid", "pk_name": "FactPrivateGroup_key_r2", "nICid": 1, "dCreateDt": 1, "index": true}');
    -- After the up: listed and counted, the Team Issue still there.
    l := pg_temp.t_list(1);
    PERFORM pg_temp.t_expect('M11', 'msg', l->'msg', '1');
    PERFORM pg_temp.t_expect('M11', 'memberships of 63', l->'memberships'->(pg_temp.tid(63)::text), pg_temp.t_ids(ARRAY[46]));
    PERFORM pg_temp.t_expect('M11', 'assignments of 63', l->'assignments'->(pg_temp.tid(63)::text), to_jsonb(pg_temp.tid(46)::text));
    PERFORM pg_temp.t_expect('M11', 'count of Gamma', pg_temp.t_group(l, 46)->'count', '1');
    PERFORM pg_temp.t_expect('M11', '63 eligible', to_jsonb((l->'eligibleFactIds') ? pg_temp.tid(63)::text), 'true');
    PERFORM pg_temp.t_expect('M11', '63 keeps Issue 32', to_jsonb(EXISTS (SELECT 1 FROM public."FMIssue"
        WHERE "nFSid" = pg_temp.tid(63) AND "nIssueid" = pg_temp.tid(32))), 'true');
    RAISE NOTICE 'PASS M11 a membership made before the up on a Mark with a Team Issue is listed (memberships, assignments) and counted after it; the up changed no row';
END $t$;

-- ------------------------------------------------------------------------------------------------ M01-M06 (claim on a group)
DO $t$
DECLARE r jsonb; g uuid;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Claimed', 'nICid', pg_temp.tid(35)));
    PERFORM pg_temp.t_expect('M01', 'answer msg', r->'msg', '1');
    g := (r->>'nGroupid')::uuid;
    PERFORM pg_temp.t_expect('M01', 'listed claimId', pg_temp.t_group_id(r, g)->'claimId', to_jsonb(pg_temp.tid(35)::text));
    PERFORM pg_temp.t_expect('M01', 'stored nICid', pg_temp.t_claim(g), to_jsonb(pg_temp.tid(35)::text));
    -- Keep the id for M03, M04 and M15.
    PERFORM set_config('c_test.claimed', g::text, false);
    RAISE NOTICE 'PASS M01 create with nICid of a claim of the case: stored and listed as claimId';
END $t$;

DO $t$
DECLARE r jsonb; g uuid; e jsonb;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Unclaimed'));
    PERFORM pg_temp.t_expect('M02', 'answer msg', r->'msg', '1');
    g := (r->>'nGroupid')::uuid;
    e := pg_temp.t_group_id(r, g);
    PERFORM pg_temp.t_expect('M02', 'element has the claimId key', to_jsonb(e ? 'claimId'), 'true');
    PERFORM pg_temp.t_expect('M02', 'listed claimId', e->'claimId', 'null');
    PERFORM pg_temp.t_expect('M02', 'stored nICid', pg_temp.t_claim(g), NULL);
    PERFORM pg_temp.t_expect('M02', 'element keys', (SELECT jsonb_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(e) k),
        '["claimId", "color", "count", "id", "name"]');
    RAISE NOTICE 'PASS M02 create without an nICid key: stored NULL, listed claimId null; element {id, name, color, claimId, count}';
END $t$;

DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.claimed')::uuid;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Claimed renamed'));
    PERFORM pg_temp.t_expect('M03', 'rename without nICid: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M03', 'rename without nICid: name', pg_temp.t_group_id(r, g)->'name', '"Claimed renamed"');
    PERFORM pg_temp.t_expect('M03', 'rename without nICid: listed claimId', pg_temp.t_group_id(r, g)->'claimId', to_jsonb(pg_temp.tid(35)::text));
    PERFORM pg_temp.t_expect('M03', 'rename without nICid: stored nICid', pg_temp.t_claim(g), to_jsonb(pg_temp.tid(35)::text));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Claimed renamed', 'nICid', NULL));
    PERFORM pg_temp.t_expect('M03', 'rename with nICid null: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M03', 'rename with nICid null: listed claimId', pg_temp.t_group_id(r, g)->'claimId', 'null');
    PERFORM pg_temp.t_expect('M03', 'rename with nICid null: stored nICid', pg_temp.t_claim(g), NULL);
    -- '' clears too.
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Claimed renamed', 'nICid', pg_temp.tid(35)));
    PERFORM pg_temp.t_expect('M03', 'set the claim again', pg_temp.t_claim(g), to_jsonb(pg_temp.tid(35)::text));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Claimed renamed', 'nICid', ''));
    PERFORM pg_temp.t_expect('M03', 'rename with nICid '''': msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M03', 'rename with nICid '''': stored nICid', pg_temp.t_claim(g), NULL);
    RAISE NOTICE 'PASS M03 rename without an nICid key keeps the claim; with nICid null (or '''') clears it';
END $t$;

DO $t$
DECLARE r jsonb; g uuid := current_setting('c_test.claimed')::uuid; before_md5 text; n_before bigint; v text;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Claimed renamed', 'nICid', pg_temp.tid(35)));
    PERFORM pg_temp.t_expect('M04', 'set-up: claim 35', pg_temp.t_claim(g), to_jsonb(pg_temp.tid(35)::text));
    before_md5 := pg_temp.t_group_md5(g);
    -- 37 is a claim of case 12; 99 is no claim at all; then a value that is not a uuid.
    FOREACH v IN ARRAY ARRAY[pg_temp.tid(37)::text, pg_temp.tid(99)::text, 'not-a-uuid'] LOOP
        r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
            'operation', 'rename', 'nGroupid', g, 'cName', 'Bad claim', 'nICid', v));
        PERFORM pg_temp.t_expect('M04', 'rename with nICid ' || v || ': answer', r, '{"msg": -1, "value": "Choose a valid Claim"}');
        PERFORM pg_temp.t_expect('M04', 'rename with nICid ' || v || ': row md5', to_jsonb(pg_temp.t_group_md5(g)), to_jsonb(before_md5));
    END LOOP;
    SELECT count(*) INTO n_before FROM public."PrivateFactGroup";
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Bad claim', 'nICid', pg_temp.tid(37)));
    PERFORM pg_temp.t_expect('M04', 'create with another case''s claim: answer', r, '{"msg": -1, "value": "Choose a valid Claim"}');
    PERFORM pg_temp.t_expect('M04', 'create with another case''s claim: groups', to_jsonb((SELECT count(*) FROM public."PrivateFactGroup")),
        to_jsonb(n_before));
    RAISE NOTICE 'PASS M04 a claim of another case, a random uuid or a non-uuid: msg -1 Choose a valid Claim; row md5 unchanged, no group created';
END $t$;

DO $t$
DECLARE r jsonb; g uuid;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Unassigned claim', 'nICid', pg_temp.tid(36)));
    PERFORM pg_temp.t_expect('M05', 'create: msg', r->'msg', '1');
    g := (r->>'nGroupid')::uuid;
    PERFORM pg_temp.t_expect('M05', 'create: stored nICid', pg_temp.t_claim(g), NULL);
    PERFORM pg_temp.t_expect('M05', 'create: listed claimId', pg_temp.t_group_id(r, g)->'claimId', 'null');
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Unassigned claim', 'nICid', pg_temp.tid(35)));
    PERFORM pg_temp.t_expect('M05', 'rename set-up: claim 35', pg_temp.t_claim(g), to_jsonb(pg_temp.tid(35)::text));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'rename', 'nGroupid', g, 'cName', 'Unassigned claim', 'nICid', pg_temp.tid(36)));
    PERFORM pg_temp.t_expect('M05', 'rename: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M05', 'rename: stored nICid', pg_temp.t_claim(g), NULL);
    RAISE NOTICE 'PASS M05 the case''s system Unassigned claim is stored as NULL (create and rename)';
END $t$;

DO $t$
DECLARE r jsonb; g uuid; l jsonb;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'create', 'cName', 'Quantum group', 'nICid', pg_temp.tid(38)));
    PERFORM pg_temp.t_expect('M06', 'set-up: msg', r->'msg', '1');
    g := (r->>'nGroupid')::uuid;
    PERFORM set_config('c_test.quantum', g::text, false);
    PERFORM pg_temp.t_expect('M06', 'set-up: listed claimId', pg_temp.t_group_id(r, g)->'claimId', to_jsonb(pg_temp.tid(38)::text));
    -- The fixture claim row this script created (scratch database only).
    DELETE FROM public."IssueCategory" WHERE "nICid" = pg_temp.tid(38);
    l := pg_temp.t_list(1);
    PERFORM pg_temp.t_expect('M06', 'list msg', l->'msg', '1');
    PERFORM pg_temp.t_expect('M06', 'listed claimId', pg_temp.t_group_id(l, g)->'claimId', 'null');
    PERFORM pg_temp.t_expect('M06', 'stored nICid (kept)', pg_temp.t_claim(g), to_jsonb(pg_temp.tid(38)::text));
    RAISE NOTICE 'PASS M06 a group whose claim row no longer exists in the case is listed with claimId null, no error';
END $t$;

-- ------------------------------------------------------------------------------------------------ M07-M10 (several groups per Mark)
DO $t$
DECLARE r jsonb; l jsonb;
BEGIN
    r := pg_temp.t_assign(1, 61, ARRAY[41, 42]);
    PERFORM pg_temp.t_expect('M07', 'answer', r, jsonb_build_object('msg', 1, 'nFSid', pg_temp.tid(61)));
    PERFORM pg_temp.t_expect('M07', 'rows of 61', (SELECT jsonb_agg("nGroupid"::text ORDER BY "nGroupid") FROM public."FactPrivateGroup"
        WHERE "nFSid" = pg_temp.tid(61)), pg_temp.t_ids(ARRAY[41, 42]));
    PERFORM pg_temp.t_expect('M07', '61 keeps its substantive Issue', to_jsonb(EXISTS (SELECT 1 FROM public."FMIssue"
        WHERE "nFSid" = pg_temp.tid(61) AND "nIssueid" = pg_temp.tid(32))), 'true');
    -- The same list in the other order: the list order decides "most recently added".
    r := pg_temp.t_assign(1, 67, ARRAY[42, 41]);
    PERFORM pg_temp.t_expect('M07', 'other order: answer msg', r->'msg', '1');
    l := pg_temp.t_list(1);
    PERFORM pg_temp.t_expect('M07', 'memberships of 61', l->'memberships'->(pg_temp.tid(61)::text), pg_temp.t_ids(ARRAY[41, 42]));
    PERFORM pg_temp.t_expect('M07', 'assignments of 61', l->'assignments'->(pg_temp.tid(61)::text), to_jsonb(pg_temp.tid(42)::text));
    PERFORM pg_temp.t_expect('M07', 'memberships of 67', l->'memberships'->(pg_temp.tid(67)::text), pg_temp.t_ids(ARRAY[42, 41]));
    PERFORM pg_temp.t_expect('M07', 'assignments of 67', l->'assignments'->(pg_temp.tid(67)::text), to_jsonb(pg_temp.tid(41)::text));
    PERFORM pg_temp.t_expect('M07', '61 eligible', to_jsonb((l->'eligibleFactIds') ? pg_temp.tid(61)::text), 'true');
    RAISE NOTICE 'PASS M07 jPrivateGroupids [g1, g2] on a Mark with a substantive Issue: both rows; memberships [g1, g2], assignments g2 (list order decides)';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 62, ARRAY[41, 42]);
    PERFORM pg_temp.t_expect('M08', 'set-up', pg_temp.t_groups_of(62), pg_temp.t_ids(ARRAY[41, 42]));
    r := pg_temp.t_assign_one(1, 62, 41);
    PERFORM pg_temp.t_expect('M08', 'legacy nPrivateGroupid g1: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M08', 'legacy nPrivateGroupid g1: groups', pg_temp.t_groups_of(62), pg_temp.t_ids(ARRAY[41]));
    r := pg_temp.t_assign_one(1, 62, NULL);
    PERFORM pg_temp.t_expect('M08', 'legacy nPrivateGroupid null: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M08', 'legacy nPrivateGroupid null: groups', pg_temp.t_groups_of(62), '[]');
    RAISE NOTICE 'PASS M08 legacy nPrivateGroupid g1 on a Mark in [g1, g2] leaves exactly [g1]; null leaves none';
END $t$;

DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign_p(jsonb_build_object('nMasterid', pg_temp.tid(1), 'nFSid', pg_temp.tid(62),
        'jPrivateGroupids', pg_temp.t_ids(ARRAY[42]), 'nPrivateGroupid', pg_temp.tid(41)));
    PERFORM pg_temp.t_expect('M09', 'both keys: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M09', 'both keys: groups', pg_temp.t_groups_of(62), pg_temp.t_ids(ARRAY[42]));
    r := pg_temp.t_assign_p(jsonb_build_object('nMasterid', pg_temp.tid(1), 'nFSid', pg_temp.tid(62),
        'jPrivateGroupids', '[]'::jsonb, 'nPrivateGroupid', pg_temp.tid(41)));
    PERFORM pg_temp.t_expect('M09', 'empty array and nPrivateGroupid: groups', pg_temp.t_groups_of(62), '[]');
    r := pg_temp.t_assign(1, 62, ARRAY[42]);
    r := pg_temp.t_assign_p(jsonb_build_object('nMasterid', pg_temp.tid(1), 'nFSid', pg_temp.tid(62),
        'jPrivateGroupids', NULL::jsonb, 'nPrivateGroupid', pg_temp.tid(41)));
    PERFORM pg_temp.t_expect('M09', 'jPrivateGroupids null and nPrivateGroupid: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M09', 'jPrivateGroupids null and nPrivateGroupid: groups', pg_temp.t_groups_of(62), '[]');
    RAISE NOTICE 'PASS M09 both keys sent: jPrivateGroupids wins ([g2] -> [g2]; [] or JSON null -> none)';
END $t$;

DO $t$
DECLARE r jsonb; sys_impact int; sys_relevance int;
BEGIN
    r := pg_temp.t_assign(1, 64, ARRAY[41, 42]);
    PERFORM pg_temp.t_expect('M10', 'set-up', pg_temp.t_groups_of(64), pg_temp.t_ids(ARRAY[41, 42]));
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(64), pg_temp.tid(32), 4, 5);
    PERFORM pg_temp.t_expect('M10', 'after a substantive Issue row', pg_temp.t_groups_of(64), pg_temp.t_ids(ARRAY[41, 42]));
    INSERT INTO public."FMIssue"("nFSid", "nIssueid", "nImpactid", "nRelevanceid") VALUES (pg_temp.tid(64), pg_temp.tid(31), 4, 5);
    SELECT "nImpactid", "nRelevanceid" INTO sys_impact, sys_relevance
      FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(64) AND "nIssueid" = pg_temp.tid(31);
    PERFORM pg_temp.t_expect('M10', 'system Unassigned row impact / relevance', jsonb_build_array(sys_impact, sys_relevance), '[0, 0]');
    PERFORM pg_temp.t_expect('M10', 'substantive row impact / relevance kept', (SELECT jsonb_build_array("nImpactid", "nRelevanceid")
        FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(64) AND "nIssueid" = pg_temp.tid(32)), '[4, 5]');
    PERFORM pg_temp.t_expect('M10', 'after the system Unassigned row', pg_temp.t_groups_of(64), pg_temp.t_ids(ARRAY[41, 42]));
    RAISE NOTICE 'PASS M10 a substantive Issue row keeps the Mark''s memberships; a system Unassigned row still gets impact / relevance 0';
END $t$;

-- ------------------------------------------------------------------------------------------------ M17 (a duplicate id)
-- Without de-duplication the list [g1, g1] would count 2 ids against 1 available group and be refused.
DO $t$
DECLARE r jsonb;
BEGIN
    PERFORM pg_temp.t_expect('M17', 'set-up: 62 in no group', pg_temp.t_groups_of(62), '[]');
    r := pg_temp.t_assign(1, 62, ARRAY[41, 41]);
    PERFORM pg_temp.t_expect('M17', '[g1, g1]: answer', r, jsonb_build_object('msg', 1, 'nFSid', pg_temp.tid(62)));
    PERFORM pg_temp.t_expect('M17', '[g1, g1]: rows of 62', to_jsonb((SELECT count(*) FROM public."FactPrivateGroup"
        WHERE "nFSid" = pg_temp.tid(62))), '1');
    PERFORM pg_temp.t_expect('M17', '[g1, g1]: groups of 62', pg_temp.t_groups_of(62), pg_temp.t_ids(ARRAY[41]));
    -- The same id in upper and lower case is one group too.
    r := pg_temp.t_assign_p(jsonb_build_object('nMasterid', pg_temp.tid(1), 'nFSid', pg_temp.tid(62),
        'jPrivateGroupids', jsonb_build_array(upper(pg_temp.tid(41)::text), pg_temp.tid(41)::text)));
    PERFORM pg_temp.t_expect('M17', 'upper- and lower-case g1: answer msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M17', 'upper- and lower-case g1: rows of 62', to_jsonb((SELECT count(*) FROM public."FactPrivateGroup"
        WHERE "nFSid" = pg_temp.tid(62))), '1');
    RAISE NOTICE 'PASS M17 a list with a duplicate id ([g1, g1], or g1 in upper and lower case) is accepted and gives exactly one membership row';
END $t$;

-- ------------------------------------------------------------------------------------------------ M12-M14
DO $t$
DECLARE r jsonb; before_md5 text := pg_temp.t_pairs_md5(); p jsonb; i int := 0;
BEGIN
    PERFORM pg_temp.t_expect('M12', 'set-up: 65 in Alpha', pg_temp.t_groups_of(65), pg_temp.t_ids(ARRAY[41]));
    -- 43 is B's group, 44 is deleted, 45 is A's group in case 12; then a malformed id, a list that is not an array,
    -- and the legacy key with B's group.
    FOREACH p IN ARRAY ARRAY[
        jsonb_build_object('jPrivateGroupids', pg_temp.t_ids(ARRAY[41, 43])),
        jsonb_build_object('jPrivateGroupids', pg_temp.t_ids(ARRAY[44])),
        jsonb_build_object('jPrivateGroupids', pg_temp.t_ids(ARRAY[41, 45])),
        jsonb_build_object('jPrivateGroupids', jsonb_build_array(pg_temp.tid(41)::text, 'not-a-uuid')),
        jsonb_build_object('jPrivateGroupids', pg_temp.tid(42)::text),
        jsonb_build_object('nPrivateGroupid', pg_temp.tid(43))] LOOP
        i := i + 1;
        r := pg_temp.t_assign_p(p || jsonb_build_object('nMasterid', pg_temp.tid(1), 'nFSid', pg_temp.tid(65)));
        PERFORM pg_temp.t_expect('M12', 'case ' || i || ' ' || p::text || ': answer', r,
            '{"msg": -1, "value": "Choose an available Private Group"}');
        PERFORM pg_temp.t_expect('M12', 'case ' || i || ': memberships md5', to_jsonb(pg_temp.t_pairs_md5()), to_jsonb(before_md5));
    END LOOP;
    RAISE NOTICE 'PASS M12 another user''s, a deleted or another case''s group (or a malformed list): msg -1 Choose an available Private Group, memberships unchanged';
END $t$;

DO $t$
DECLARE r jsonb; before_md5 text := pg_temp.t_pairs_md5();
BEGIN
    FOREACH r IN ARRAY ARRAY[pg_temp.t_assign(2, 65, ARRAY[43]), pg_temp.t_assign(2, 65, ARRAY[]::integer[]),
                             pg_temp.t_assign_one(2, 65, NULL)] LOOP
        PERFORM pg_temp.t_expect('M13', 'B on A''s Mark: answer', r,
            '{"msg": -1, "value": "Private Group is available only to the creator of the mark"}');
    END LOOP;
    PERFORM pg_temp.t_expect('M13', 'memberships md5', to_jsonb(pg_temp.t_pairs_md5()), to_jsonb(before_md5));
    PERFORM pg_temp.t_expect('M13', '65 still in Alpha', pg_temp.t_groups_of(65), pg_temp.t_ids(ARRAY[41]));
    RAISE NOTICE 'PASS M13 a non-owner actor gets the existing refusal (Private Group is available only to the creator of the mark), nothing changes';
END $t$;

DO $t$
DECLARE r jsonb; alpha_before jsonb; l jsonb;
BEGIN
    r := pg_temp.t_assign(1, 66, ARRAY[41, 42]);
    PERFORM pg_temp.t_expect('M14', 'set-up', pg_temp.t_groups_of(66), pg_temp.t_ids(ARRAY[41, 42]));
    PERFORM pg_temp.t_expect('M14', 'set-up: Marks in Beta', (SELECT jsonb_agg("nFSid"::text ORDER BY "nFSid")
        FROM public."FactPrivateGroup" WHERE "nGroupid" = pg_temp.tid(42)), pg_temp.t_ids(ARRAY[61, 64, 66, 67]));
    SELECT jsonb_agg("nFSid"::text ORDER BY "nFSid") INTO alpha_before FROM public."FactPrivateGroup" WHERE "nGroupid" = pg_temp.tid(41);
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11),
        'operation', 'delete', 'nGroupid', pg_temp.tid(42)));
    PERFORM pg_temp.t_expect('M14', 'delete: msg', r->'msg', '1');
    PERFORM pg_temp.t_expect('M14', 'rows of Beta', to_jsonb((SELECT count(*) FROM public."FactPrivateGroup" WHERE "nGroupid" = pg_temp.tid(42))), '0');
    PERFORM pg_temp.t_expect('M14', 'Marks in Alpha', (SELECT jsonb_agg("nFSid"::text ORDER BY "nFSid")
        FROM public."FactPrivateGroup" WHERE "nGroupid" = pg_temp.tid(41)), alpha_before);
    PERFORM pg_temp.t_expect('M14', 'Marks of the deleted group', jsonb_build_array(pg_temp.t_groups_of(61), pg_temp.t_groups_of(64),
        pg_temp.t_groups_of(66), pg_temp.t_groups_of(67)), jsonb_build_array(pg_temp.t_ids(ARRAY[41]), pg_temp.t_ids(ARRAY[41]),
        pg_temp.t_ids(ARRAY[41]), pg_temp.t_ids(ARRAY[41])));
    PERFORM pg_temp.t_expect('M14', 'Beta is a tombstone', to_jsonb((SELECT "dDeletedDt" IS NOT NULL FROM public."PrivateFactGroup"
        WHERE "nGroupid" = pg_temp.tid(42))), 'true');
    l := pg_temp.t_list(1);
    PERFORM pg_temp.t_expect('M14', 'Beta not listed', pg_temp.t_group(l, 42), NULL);
    PERFORM pg_temp.t_expect('M14', 'memberships of 66 listed', l->'memberships'->(pg_temp.tid(66)::text), pg_temp.t_ids(ARRAY[41]));
    RAISE NOTICE 'PASS M14 deleting a group removes its memberships only; the same Marks keep their other groups';
END $t$;

-- ------------------------------------------------------------------------------------------------ M15, M16 (rollback)
-- The three things the down script refuses on: Marks with more than one membership ("multi"), groups with a claim
-- ("claimed"), memberships on a Mark with a substantive Team Issue ("beside"). Each refused run below has exactly one.
CREATE FUNCTION pg_temp.t_blockers() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object(
    'multi', (SELECT count(*) FROM (SELECT 1 FROM public."FactPrivateGroup" GROUP BY "nFSid" HAVING count(*) > 1) m),
    'claimed', (SELECT count(*) FROM public."PrivateFactGroup" WHERE "nICid" IS NOT NULL),
    'beside', (SELECT count(*) FROM public."FactPrivateGroup" a WHERE EXISTS (SELECT 1 FROM public."FMIssue" i
                 WHERE i."nFSid" = a."nFSid" AND NOT public.et_is_system_unassigned(i."nIssueid")))) $f$;

-- Refused run 1 (M15): Mark 66 in two groups; no claim; no membership beside a Team Issue.
DO $t$
DECLARE r jsonb;
BEGIN
    PERFORM pg_temp.t_expect('M15', 'shape before the down', pg_temp.t_shape(), (SELECT shape FROM c_after_up));
    r := pg_temp.t_assign(1, 66, ARRAY[41, 46]);
    PERFORM pg_temp.t_expect('M15', 'set-up 1: 66 in two groups', pg_temp.t_groups_of(66), pg_temp.t_ids(ARRAY[41, 46]));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11), 'operation', 'rename',
        'nGroupid', current_setting('c_test.claimed')::uuid, 'cName', 'Claimed renamed', 'nICid', NULL));
    PERFORM pg_temp.t_expect('M15', 'set-up 1: clear claim of Claimed renamed', r->'msg', '1');
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11), 'operation', 'rename',
        'nGroupid', current_setting('c_test.quantum')::uuid, 'cName', 'Quantum group', 'nICid', NULL));
    PERFORM pg_temp.t_expect('M15', 'set-up 1: clear claim of Quantum group', r->'msg', '1');
    -- 61, 63 and 64 carry the substantive Issue 32: their owner un-ticks their groups.
    FOREACH r IN ARRAY ARRAY[pg_temp.t_assign(1, 61, ARRAY[]::integer[]), pg_temp.t_assign(1, 63, ARRAY[]::integer[]),
                             pg_temp.t_assign(1, 64, ARRAY[]::integer[])] LOOP
        PERFORM pg_temp.t_expect('M15', 'set-up 1: un-tick a Mark with a Team Issue', r->'msg', '1');
    END LOOP;
    PERFORM pg_temp.t_expect('M15', 'set-up 1: blockers', pg_temp.t_blockers(), '{"multi": 1, "claimed": 0, "beside": 0}');
END $t$;

CREATE TEMP TABLE c_refused1 AS SELECT pg_temp.t_state() AS state;

\echo 'M15: the down script runs while Mark 66 has two memberships; the ERROR lines up to the next check are expected'
\set ON_ERROR_STOP off
\ir 2026-11-14_private_issue_claim_multi.down.sql
\set ON_ERROR_STOP on

DO $t$
BEGIN
    PERFORM pg_temp.t_expect('M15', 'refused run 1 (two memberships): state', pg_temp.t_state(), (SELECT state FROM c_refused1));
    PERFORM pg_temp.t_expect('M15', 'refused run 1: sources are the up''s', pg_temp.t_fns(), (SELECT fns FROM c_after_up));
END $t$;

-- Refused run 2 (M15): one membership per Mark, one group with a claim, no membership beside a Team Issue.
DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign_one(1, 66, 41);
    PERFORM pg_temp.t_expect('M15', 'set-up 2: 66 back to one group', pg_temp.t_groups_of(66), pg_temp.t_ids(ARRAY[41]));
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11), 'operation', 'rename',
        'nGroupid', current_setting('c_test.claimed')::uuid, 'cName', 'Claimed renamed', 'nICid', pg_temp.tid(35)));
    PERFORM pg_temp.t_expect('M15', 'set-up 2: claim 35 on Claimed renamed', pg_temp.t_claim(current_setting('c_test.claimed')::uuid),
        to_jsonb(pg_temp.tid(35)::text));
    PERFORM pg_temp.t_expect('M15', 'set-up 2: blockers', pg_temp.t_blockers(), '{"multi": 0, "claimed": 1, "beside": 0}');
END $t$;

CREATE TEMP TABLE c_refused2 AS SELECT pg_temp.t_state() AS state;

\echo 'M15: the down script runs while a group has a claim; the ERROR lines up to the next check are expected'
\set ON_ERROR_STOP off
\ir 2026-11-14_private_issue_claim_multi.down.sql
\set ON_ERROR_STOP on

DO $t$
BEGIN
    PERFORM pg_temp.t_expect('M15', 'refused run 2 (a claim): state', pg_temp.t_state(), (SELECT state FROM c_refused2));
    PERFORM pg_temp.t_expect('M15', 'refused run 2: sources are the up''s', pg_temp.t_fns(), (SELECT fns FROM c_after_up));
END $t$;

-- Refused run 3 (M16): one membership per Mark, no claim, but Mark 61 (substantive Issue 32) is in a group again.
DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_call(json_build_object('nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11), 'operation', 'rename',
        'nGroupid', current_setting('c_test.claimed')::uuid, 'cName', 'Claimed renamed', 'nICid', NULL));
    PERFORM pg_temp.t_expect('M16', 'set-up: clear the claim', r->'msg', '1');
    r := pg_temp.t_assign(1, 61, ARRAY[41]);
    PERFORM pg_temp.t_expect('M16', 'set-up: 61 in Alpha', pg_temp.t_groups_of(61), pg_temp.t_ids(ARRAY[41]));
    PERFORM pg_temp.t_expect('M16', 'set-up: 61 has the substantive Issue 32', to_jsonb(EXISTS (SELECT 1 FROM public."FMIssue"
        WHERE "nFSid" = pg_temp.tid(61) AND "nIssueid" = pg_temp.tid(32))), 'true');
    PERFORM pg_temp.t_expect('M16', 'set-up: blockers', pg_temp.t_blockers(), '{"multi": 0, "claimed": 0, "beside": 1}');
END $t$;

CREATE TEMP TABLE c_refused3 AS SELECT pg_temp.t_state() AS state;

\echo 'M16: the down script runs while Mark 61 holds a Team Issue and a Private Group; the ERROR lines up to the next check are expected'
\set ON_ERROR_STOP off
\ir 2026-11-14_private_issue_claim_multi.down.sql
\set ON_ERROR_STOP on

DO $t$
BEGIN
    PERFORM pg_temp.t_expect('M16', 'refused run 3 (beside a Team Issue): state', pg_temp.t_state(), (SELECT state FROM c_refused3));
    PERFORM pg_temp.t_expect('M16', 'refused run 3: sources are the up''s', pg_temp.t_fns(), (SELECT fns FROM c_after_up));
    PERFORM pg_temp.t_expect('M16', 'refused run 3: 61 still in Alpha', pg_temp.t_groups_of(61), pg_temp.t_ids(ARRAY[41]));
    RAISE NOTICE 'PASS M16 down: refused while a membership sat on a Mark with a substantive Team Issue; state unchanged, the membership kept';
END $t$;

-- The down script: its owner un-ticks 61 again, so nothing blocks it.
DO $t$
DECLARE r jsonb;
BEGIN
    r := pg_temp.t_assign(1, 61, ARRAY[]::integer[]);
    PERFORM pg_temp.t_expect('M15', 'set-up 4: un-tick 61', r->'msg', '1');
    PERFORM pg_temp.t_expect('M15', 'set-up 4: blockers', pg_temp.t_blockers(), '{"multi": 0, "claimed": 0, "beside": 0}');
END $t$;

CREATE TEMP TABLE c_before_down AS SELECT pg_temp.t_pairs_md5() AS pairs_md5,
    (SELECT count(*) FROM public."PrivateFactGroup") AS n_groups, (SELECT count(*) FROM public."FactPrivateGroup") AS n_members;

\ir 2026-11-14_private_issue_claim_multi.down.sql

DO $t$
DECLARE b record; d record;
BEGIN
    SELECT * INTO b FROM c_before;
    SELECT * INTO d FROM c_before_down;
    PERFORM pg_temp.t_expect('M15', 'shape after the down (pk nFSid under the same name; nICid, dCreateDt, fact_private_group_fact gone)',
        pg_temp.t_shape(), b.shape);
    PERFORM pg_temp.t_expect('M15', 'function sources after the down', pg_temp.t_fns(), b.fns);
    PERFORM pg_temp.t_expect('M15', 'memberships after the down', jsonb_build_array(pg_temp.t_pairs_md5(),
        (SELECT count(*) FROM public."FactPrivateGroup")), jsonb_build_array(d.pairs_md5, d.n_members));
    PERFORM pg_temp.t_expect('M15', 'groups after the down', to_jsonb((SELECT count(*) FROM public."PrivateFactGroup")), to_jsonb(d.n_groups));
    RAISE NOTICE 'PASS M15 down: refused (nothing changed) while a Mark had two memberships or a group had a claim; then primary key ("nFSid") again under its name, nICid / dCreateDt / fact_private_group_fact gone, md5(prosrc) of the four functions equal to before the up, no membership removed';
END $t$;

\echo 'PASS all 17 checks'
