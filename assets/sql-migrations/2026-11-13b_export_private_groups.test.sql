-- 2026-11-13b_export_private_groups.test.sql
--
-- Scratch-database test of 2026-11-13b_export_private_groups.up.sql (the Reader export filters and colours by the
-- exporter's own Private Groups) and of its rollback 2026-11-13b_export_private_groups.down.sql: checks E01-E09 of
-- Task 9 of .superpowers/sdd/2026-11-11-private-group-colour-three-categories/task-9-brief.md, plus E00 (the fixture
-- reproduces today's behaviour), E01b (a new export without group keys), E04b (a picked Contact does not let a grouped
-- mark through) and E05b (a colleague's mark in the colleague's group keeps today's rules).
--
-- NOT RUN YET. Written 2026-11-11 without a database. Running it needs the owner's approval first (Golden Rule 1).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261113b).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * Creates minimal stand-ins of the 27 relations the four functions and the earlier Private Group scripts read, with
--     only the columns they use ("annotations" is a view in the real database; here it is a table with the columns
--     et_export_get_data_1 reads). As in the real schema (sp-audit/schema-dump-output.txt), "FactMaster" has no
--     "nCreateId" and "BundleDetail" has one, so the unqualified "nCreateId" of the "allfacts" lateral of
--     et_export_get_data_1 resolves to BundleDetail."nCreateId", as it does in production.
--   * Loads from this folder, in order: 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql
--     (so a leftover membership on a mark with a Team Issue can be made, as it was while 2026-11-12 was live),
--     2026-11-12b_private_groups_unassigned_only.up.sql, 2026-11-13_private_group_colour.up.sql, then the "before" bodies
--     2026-07-08_export_team_marks.up.sql, 2026-07-08_index_sp_page_color.up.sql and
--     2026-07-20_annotation_index_team_marks.up.sql, then the script under test and, at the end, its rollback.
--   * Fixture ids are 10000000-0000-4000-8000-0000000000NN. Nothing is rolled back: the loaded scripts commit
--     themselves. Throw the scratch database away afterwards (a separate approval).
--
-- How results are compared
-- ------------------------
-- The functions aggregate with jsonb_agg and no ORDER BY, so the order of elements inside an aggregate follows the
-- plan, which a new LEFT JOIN may change. Every "md5 equal" check therefore compares md5 of a canonical form:
-- pg_temp.t_canon sorts every JSON array by its elements' text, recursively, and drops the key "dExportdt" (today's date
-- in the case header of et_preview_document_list_1). Function sources are compared as md5(prosrc) with CR removed (a
-- Windows checkout has CRLF files, the committed files are LF).
--
-- NOT COVERED BY THIS TEST:
--   * The real "annotations" view and the real column types of the 27 stand-ins (text here where production may have
--     varchar). The up script itself refuses to run when annotations."color" is not text / character varying.
--   * The Python burner and the PDF itself (the colour reaches the burner as highlights[].color, which is checked).
--   * The retry path of et_export_get_data_1 (bIsRetry, unchanged code) and the factsheet cursor of
--     et_preview_document_list_1 in group mode (unchanged on purpose; only checked to show no group name).
--   * Production volumes and plans.
--   * Whether the live bodies equal the committed "before" bodies: compare pg_get_functiondef with the down script
--     before applying.
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-13b_export_private_groups.test.sql
-- Pass: a NOTICE "PASS E.. ..." for each of E00, E01, E01b, E02, E03, E04, E04b, E05, E05b, E06, E07, E08 and E09 (E09
-- has an up half and a down half), then "PASS all 13 checks". A failure stops at "FAIL E.. ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'export_private_groups test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'export_private_groups test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- Ids: pg_temp.tid(n) = 10000000-0000-4000-8000-<n as 12 digits>.
--   Users     1 = A (the exporter), 2 = B (A's teammate). Role 5, team 6. Case 11, section 12, bundle 13.
--   Document  21 (uploaded by A). Issues 31 = the system Unassigned Issue (ffff00), 32 = 'Liability' (ff9163), both in
--             category 35. Contact 51.
--   Groups    41 'Alpha' (A, colour 0066FF), 42 'Beta' (A, no colour), 43 'B group' (B, colour 00AA00),
--             44 'Gone' (A, deleted, colour AA0000).
--   Marks     on document 21, A's unless noted ('QF' = QFact, 'F' = Full Fact):
--             61 QF Unassigned, in 41, Contact 51     62 F  no Issue row, in 41
--             63 QF Unassigned, in 42                  64 QF Unassigned, no group, Contact 51
--             65 F  Liability                          66 QF Liability
--             67 QF Liability, leftover membership in 41 (made under the 2026-11-12 rule)
--             68 QF Unassigned, stale membership in the deleted group 44
--             91 QF Unassigned, B's, in B's group 43, shared with A (FMShared)
--   DocLink 71 and WebLink 81 (A's). One "annotations" row per mark: ffff00 for Unassigned / no Issue, ff9163 for
--   Liability, 0000ff for the DocLink, aaaaaa for the WebLink.
CREATE FUNCTION pg_temp.tid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$f$ SELECT ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;

BEGIN;
CREATE TABLE public."CaseMaster"("nCaseid" uuid PRIMARY KEY, "cCasename" text, "cDesc" text, "cCaseno" text);
CREATE TABLE public."UserMaster"("nUserid" uuid PRIMARY KEY, "isAdmin" boolean, "cFname" text, "cLname" text);
CREATE TABLE public."RoleMaster"("nRoleid" uuid PRIMARY KEY, "nSrno" integer);
CREATE TABLE public."TeamRelation"("nCaseid" uuid, "nUserid" uuid, "nTeamid" uuid, "nRoleid" uuid, "cStatus" text);
CREATE TABLE public."SectionMaster"("nSectionid" uuid PRIMARY KEY, "nCaseid" uuid);
CREATE TABLE public."BundleMaster"("nBundleid" uuid PRIMARY KEY, "cBundletag" text);
CREATE TABLE public."BundleDetail"("nBundledetailid" uuid PRIMARY KEY, "nSectionid" uuid, "nBundleid" uuid,
    "cFilename" text, "cPath" text, "cPage" text, "cTab" text, "cExhibitno" text, "sorted_tab" text[], "nCreateId" uuid);
CREATE TABLE public."IssueCategory"("nICid" uuid PRIMARY KEY, "cCategory" text);
CREATE TABLE public."RIssueMaster"("nIid" uuid PRIMARY KEY, "nUserid" uuid, "nICid" uuid, "cIName" text, "cColor" varchar);
CREATE TABLE public."Codemaster"("nCodeid" integer PRIMARY KEY, "cCodename" text);
CREATE TABLE public."ContactMaster"("nContactid" uuid PRIMARY KEY, "cFname" text, "cLname" text, "cAlias" text,
    "cEmail" text, "cProfile" text);
CREATE TABLE public."FactMaster"("nFSid" uuid PRIMARY KEY, "nCaseid" uuid, "nUserid" uuid, "cFType" varchar,
    "nBundledetailid" uuid);
CREATE TABLE public."FactDetail"("nFSid" uuid, "cType" varchar, "nPage" integer, "nColorid" uuid, "jOT" jsonb,
    "jTexts" jsonb, "jLinktype" jsonb);
CREATE TABLE public."FMIssue"("nFSid" uuid, "nIssueid" uuid, "nImpactid" integer, "nRelevanceid" integer);
CREATE TABLE public."FMContact"("nFSid" uuid, "nContactid" uuid);
CREATE TABLE public."FMShared"("nFSid" uuid, "nUserid" uuid);
CREATE TABLE public."FMLinks"("nFSid" uuid, "nBundledetailid" uuid, "jLinktype" jsonb);
CREATE TABLE public."DocMaster"("nDocid" uuid PRIMARY KEY, "nUserid" uuid, "nBundledetailid" uuid);
CREATE TABLE public."DocDetail"("nDocid" uuid, "cType" varchar, "nPage" integer, "jOText" jsonb, "jLinktype" jsonb);
CREATE TABLE public."DMShared"("nDocid" uuid, "nUserid" uuid);
CREATE TABLE public."DMLinks"("nDocid" uuid, "nBundledetailid" uuid, "jLinktype" jsonb);
CREATE TABLE public."WebMaster"("nWebid" uuid PRIMARY KEY, "nUserid" uuid, "nBundledetailid" uuid);
CREATE TABLE public."WebDetail"("nWebid" uuid, "cType" varchar, "cUrl" text, "cTitle" text, "cNote" text,
    "jOText" jsonb, "jLinktype" jsonb);
CREATE TABLE public."WMShared"("nWebid" uuid, "nUserid" uuid);
CREATE TABLE public.annotations("nAId" uuid PRIMARY KEY, "uuid" text, "type" text, "rects" jsonb, "lines" jsonb,
    "width" integer, "color" varchar, "page" integer, "nFSid" uuid, "nDocid" uuid, "nWebid" uuid);
CREATE TABLE public."ExportMaster"("nExportid" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "nUserid" uuid,
    "nCaseid" uuid, "cType" text, "dReqDt" timestamp, "cStatus" text, "bPagination" boolean, "bDoc" boolean,
    "bFact" boolean, "bQfact" boolean, "bCoverpg" boolean, "bFitpg" boolean, "cDsize" text, "cFsize" text,
    "cQFsize" text, "cOrientation" text, "cPgsize" text, "jFContact" jsonb, "jFIssue" jsonb, "jQFContact" jsonb,
    "jQFIssue" jsonb, "jPages" jsonb, "bWeb" boolean, "bTeamMarks" boolean NOT NULL DEFAULT false);
CREATE TABLE public."ExportDetail"("nEDid" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "nExportid" uuid, "nBDid" uuid,
    "cStatus" text);

INSERT INTO public."UserMaster" VALUES (pg_temp.tid(1), false, 'Ann', 'Able'), (pg_temp.tid(2), false, 'Ben', 'Bee');
INSERT INTO public."RoleMaster" VALUES (pg_temp.tid(5), 2);
INSERT INTO public."CaseMaster" VALUES (pg_temp.tid(11), 'Case', 'A test case', 'C-1');
INSERT INTO public."TeamRelation" VALUES (pg_temp.tid(11), pg_temp.tid(1), pg_temp.tid(6), pg_temp.tid(5), 'A'),
    (pg_temp.tid(11), pg_temp.tid(2), pg_temp.tid(6), pg_temp.tid(5), 'A');
INSERT INTO public."SectionMaster" VALUES (pg_temp.tid(12), pg_temp.tid(11));
INSERT INTO public."BundleMaster" VALUES (pg_temp.tid(13), 'A');
INSERT INTO public."BundleDetail" VALUES (pg_temp.tid(21), pg_temp.tid(12), pg_temp.tid(13), 'd1.pdf',
    'export/d1.pdf', '1-10', 'A1', 'A1', '{A1}', pg_temp.tid(1));
INSERT INTO public."IssueCategory" VALUES (pg_temp.tid(35), 'Claims');
INSERT INTO public."RIssueMaster" VALUES (pg_temp.tid(31), NULL, pg_temp.tid(35), 'Unassigned', 'ffff00'),
    (pg_temp.tid(32), pg_temp.tid(1), pg_temp.tid(35), 'Liability', 'ff9163');
INSERT INTO public."ContactMaster" VALUES (pg_temp.tid(51), 'Carl', 'Cole', 'CC', 'carl@example.test', 'Witness');
INSERT INTO public."FactMaster"
SELECT pg_temp.tid(n), pg_temp.tid(11), pg_temp.tid(CASE WHEN n = 91 THEN 2 ELSE 1 END),
       CASE WHEN n IN (62, 65) THEN 'F' ELSE 'QF' END, pg_temp.tid(21)
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 91]) n;
INSERT INTO public."FactDetail"
SELECT pg_temp.tid(n), 'S', n - 60, pg_temp.tid(CASE WHEN n IN (65, 66, 67) THEN 32 ELSE 31 END),
       jsonb_build_array('text ' || n), jsonb_build_array('text ' || n), jsonb_build_object('start', n - 60, 'end', n - 60)
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 91]) n;
INSERT INTO public."FMIssue"
SELECT pg_temp.tid(n), pg_temp.tid(CASE WHEN n IN (65, 66, 67) THEN 32 ELSE 31 END), 0, 0
FROM unnest(ARRAY[61, 63, 64, 65, 66, 67, 68, 91]) n;
INSERT INTO public."FMContact" VALUES (pg_temp.tid(61), pg_temp.tid(51)), (pg_temp.tid(64), pg_temp.tid(51));
INSERT INTO public."FMShared" VALUES (pg_temp.tid(91), pg_temp.tid(1));
INSERT INTO public."DocMaster" VALUES (pg_temp.tid(71), pg_temp.tid(1), pg_temp.tid(21));
INSERT INTO public."DocDetail" VALUES (pg_temp.tid(71), 'S', 2, '["link text"]', '{"start": 2, "end": 2}');
INSERT INTO public."WebMaster" VALUES (pg_temp.tid(81), pg_temp.tid(1), pg_temp.tid(21));
INSERT INTO public."WebDetail" VALUES (pg_temp.tid(81), 'S', 'https://example.test', 'Title', 'Note', '["web text"]', '{}');
INSERT INTO public.annotations
SELECT pg_temp.tid(100 + n), 'a' || n, 'highlight', '[]', '[]', 1,
       CASE WHEN n IN (65, 66, 67) THEN 'ff9163' WHEN n = 71 THEN '0000ff' WHEN n = 81 THEN 'aaaaaa' ELSE 'ffff00' END,
       CASE WHEN n IN (71, 81) THEN 2 ELSE n - 60 END,
       CASE WHEN n < 70 OR n = 91 THEN pg_temp.tid(n) END,
       CASE WHEN n = 71 THEN pg_temp.tid(n) END,
       CASE WHEN n = 81 THEN pg_temp.tid(n) END
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 71, 81, 91]) n;
COMMIT;

-- ------------------------------------------------------------------------------------------------ load the earlier scripts
SELECT set_config('etabella.expected_database',
    CASE WHEN left(current_database(), 16) = 'etabella_scratch' THEN current_database() ELSE 'not-a-scratch-database' END,
    false) AS expected_database;

\ir 2026-10-09_private_fact_groups.up.sql
\ir 2026-11-12_private_groups_for_qfacts.up.sql

-- Under 2026-11-12 a group could sit on a mark with a Team Issue: 67 keeps such a leftover membership in 41.
-- 68's group 44 is deleted afterwards, leaving a stale membership.
INSERT INTO public."PrivateFactGroup"("nGroupid", "nCaseid", "nUserid", "cName") VALUES
    (pg_temp.tid(41), pg_temp.tid(11), pg_temp.tid(1), 'Alpha'),
    (pg_temp.tid(42), pg_temp.tid(11), pg_temp.tid(1), 'Beta'),
    (pg_temp.tid(43), pg_temp.tid(11), pg_temp.tid(2), 'B group'),
    (pg_temp.tid(44), pg_temp.tid(11), pg_temp.tid(1), 'Gone');
INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid") VALUES
    (pg_temp.tid(61), pg_temp.tid(41)), (pg_temp.tid(62), pg_temp.tid(41)), (pg_temp.tid(63), pg_temp.tid(42)),
    (pg_temp.tid(67), pg_temp.tid(41)), (pg_temp.tid(68), pg_temp.tid(44)), (pg_temp.tid(91), pg_temp.tid(43));
UPDATE public."PrivateFactGroup" SET "dDeletedDt" = now() WHERE "nGroupid" = pg_temp.tid(44);

\ir 2026-11-12b_private_groups_unassigned_only.up.sql
\ir 2026-11-13_private_group_colour.up.sql

UPDATE public."PrivateFactGroup" SET "cColor" = CASE "nGroupid" WHEN pg_temp.tid(41) THEN '0066FF'
    WHEN pg_temp.tid(43) THEN '00AA00' WHEN pg_temp.tid(44) THEN 'AA0000' END
WHERE "nGroupid" IN (pg_temp.tid(41), pg_temp.tid(43), pg_temp.tid(44));

-- The "before" bodies (the latest ones in this repository).
\ir 2026-07-08_export_team_marks.up.sql
\ir 2026-07-08_index_sp_page_color.up.sql
\ir 2026-07-20_annotation_index_team_marks.up.sql

-- ------------------------------------------------------------------------------------------------ helpers
-- A sorted jsonb array of fixture ids as text.
CREATE FUNCTION pg_temp.t_ids(ns integer[]) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT COALESCE(jsonb_agg(pg_temp.tid(n)::text ORDER BY pg_temp.tid(n)::text), '[]'::jsonb) FROM unnest(ns) n $f$;

-- All rows of a refcursor function as one jsonb array, in cursor order.
CREATE FUNCTION pg_temp.t_rows(fn text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE c refcursor := 't_rows_result'; r record; result jsonb := '[]'::jsonb;
BEGIN
    EXECUTE format('SELECT public.%I($1::json, $2)', fn) USING p, c;
    LOOP
        FETCH c INTO r;
        EXIT WHEN NOT FOUND;
        result := result || jsonb_build_array(to_jsonb(r));
    END LOOP;
    CLOSE c;
    RETURN result;
END $f$;

-- Canonical form (see the header): arrays sorted by element text, recursively; "dExportdt" and drop_keys removed.
CREATE FUNCTION pg_temp.t_canon(j jsonb, drop_keys text[] DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE AS $f$
BEGIN
    IF jsonb_typeof(j) = 'array' THEN
        RETURN COALESCE((SELECT jsonb_agg(s.x ORDER BY s.x::text)
                         FROM (SELECT pg_temp.t_canon(e.v, drop_keys) AS x FROM jsonb_array_elements(j) AS e(v)) s), '[]'::jsonb);
    ELSIF jsonb_typeof(j) = 'object' THEN
        RETURN COALESCE((SELECT jsonb_object_agg(kv.k, pg_temp.t_canon(kv.v, drop_keys)) FROM jsonb_each(j) AS kv(k, v)
                         WHERE kv.k <> 'dExportdt' AND kv.k <> ALL (drop_keys)), '{}'::jsonb);
    END IF;
    RETURN j;
END $f$;

-- A new export of document 21 by A through et_export_insert_data_1 (the body loaded at the time); extra overrides keys.
CREATE FUNCTION pg_temp.t_insert(extra jsonb) RETURNS uuid
LANGUAGE plpgsql AS $f$
DECLARE c refcursor := 't_insert_result'; r record;
BEGIN
    PERFORM public.et_export_insert_data_1((jsonb_build_object(
        'nMasterid', pg_temp.tid(1), 'nCaseid', pg_temp.tid(11), 'cPdftype', 'S', 'bPagination', false,
        'bDoc', false, 'bFact', true, 'bQfact', true, 'bCoverpg', false, 'bFitpg', false, 'bWeb', false,
        'bTeamMarks', true, 'cDsize', 'N', 'cFsize', 'N', 'cQFsize', 'N', 'cOrientation', 'A', 'cPgsize', 'A4',
        'jFContact', '[]'::jsonb, 'jFIssue', '[]'::jsonb, 'jQFContact', '[]'::jsonb, 'jQFIssue', '[]'::jsonb,
        'jPages', '[]'::jsonb, 'jFiles', jsonb_build_array(pg_temp.tid(21))) || extra)::json, c);
    FETCH c INTO r;
    CLOSE c;
    RETURN r."nExportid";
END $f$;

-- The three answers for export x, as the export service asks for them (get_data by its creator A; preview of document
-- 21; the index rows of every mark and the DocLink, by the given actor).
CREATE FUNCTION pg_temp.t_get(x uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_export_get_data_1', jsonb_build_object('nExportid', x, 'nMasterid', pg_temp.tid(1))) $f$;
CREATE FUNCTION pg_temp.t_preview(x uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_preview_document_list_1', jsonb_build_object('nBundledetailid', pg_temp.tid(21),
        'nMasterid', pg_temp.tid(1), 'nExportid', x)) -> 0 $f$;
CREATE FUNCTION pg_temp.t_index(x uuid, actor_n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_annotation_index_rows', jsonb_build_object(
        'jFactIds', pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 91]), 'jDocIds', pg_temp.t_ids(ARRAY[71]),
        'nMasterid', pg_temp.tid(actor_n), 'nExportid', x)) -> 0 $f$;
CREATE FUNCTION pg_temp.t_snapshot(x uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object('get', pg_temp.t_get(x), 'preview', pg_temp.t_preview(x), 'index', pg_temp.t_index(x, 1)) $f$;

-- The Fact / QFact ids of get_data's burned highlights, and of its allfacts, sorted.
CREATE FUNCTION pg_temp.t_burned(g jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(DISTINCT h->>'nFSid' ORDER BY h->>'nFSid'), '[]'::jsonb)
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'linktype' IN ('F', 'QF') $f$;
CREATE FUNCTION pg_temp.t_allfacts(g jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(DISTINCT a ORDER BY a), '[]'::jsonb)
    FROM jsonb_array_elements(g) r, jsonb_array_elements_text(r->'allfacts') a $f$;
-- The mark ids of a list of rows (preview factlinks, index factlinks), sorted.
CREATE FUNCTION pg_temp.t_list_ids(list jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(e->>'nFSid' ORDER BY e->>'nFSid'), '[]'::jsonb) FROM jsonb_array_elements(list) e $f$;
-- The burned colour(s) of mark n, and the row of mark n in a list.
CREATE FUNCTION pg_temp.t_burn_colour(g jsonb, n integer) RETURNS text LANGUAGE sql AS
$f$ SELECT string_agg(DISTINCT h->>'color', ',')
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'nFSid' = pg_temp.tid(n)::text $f$;
CREATE FUNCTION pg_temp.t_row(list jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT e FROM jsonb_array_elements(list) e WHERE e->>'nFSid' = pg_temp.tid(n)::text LIMIT 1 $f$;
-- The index entry a mark in a picked group gets.
CREATE FUNCTION pg_temp.t_group_issue(name text, colour text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_array(jsonb_build_object('nIssueid', NULL, 'cIssue', name, 'cClr', colour)) $f$;

CREATE FUNCTION pg_temp.t_fn_md5(fn text) RETURNS text LANGUAGE sql AS
$f$ SELECT md5(replace(prosrc, E'\r', '')) FROM pg_proc WHERE proname = fn AND pronamespace = 'public'::regnamespace $f$;

-- ------------------------------------------------------------------------------------------------ exports made before the up
CREATE TEMP TABLE c_exports(name text PRIMARY KEY, x uuid NOT NULL, pre boolean NOT NULL);
INSERT INTO c_exports VALUES
    ('X1 all Issues, DocLinks and WebLinks', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31, 32]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31, 32]), 'bDoc', true, 'bWeb', true)), true),
    ('X2 Unassigned', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31]))), true),
    ('X3 no filter', pg_temp.t_insert(jsonb_build_object('bDoc', true)), true),
    ('X4 Liability, own marks only', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[32]),
        'jQFIssue', pg_temp.t_ids(ARRAY[32]), 'bTeamMarks', false)), true),
    ('X5 QFact Contact 51', pg_temp.t_insert(jsonb_build_object('jQFContact', pg_temp.t_ids(ARRAY[51]))), true);

CREATE FUNCTION pg_temp.t_x(name_prefix text) RETURNS uuid LANGUAGE sql AS
$f$ SELECT x FROM c_exports WHERE name LIKE name_prefix || ' %' $f$;
-- The rows the up must not change: every column but the two new ones, of the exports made before it.
CREATE FUNCTION pg_temp.t_export_rows_md5() RETURNS text LANGUAGE sql AS
$f$ SELECT md5(string_agg((to_jsonb(m) - 'jFGroup' - 'jQFGroup')::text, '|' ORDER BY m."nExportid"))
    FROM public."ExportMaster" m WHERE m."nExportid" IN (SELECT x FROM c_exports WHERE pre) $f$;
CREATE FUNCTION pg_temp.t_detail_rows_md5() RETURNS text LANGUAGE sql AS
$f$ SELECT md5(string_agg(to_jsonb(d)::text, '|' ORDER BY d."nEDid"))
    FROM public."ExportDetail" d WHERE d."nExportid" IN (SELECT x FROM c_exports WHERE pre) $f$;

-- ------------------------------------------------------------------------------------------------ baseline (before the up)
CREATE TEMP TABLE c_before AS
SELECT e.name, e.x, s.snap, md5(pg_temp.t_canon(s.snap)::text) AS snap_md5
FROM c_exports e CROSS JOIN LATERAL (SELECT pg_temp.t_snapshot(e.x) AS snap) s;
CREATE TEMP TABLE c_before_db AS SELECT pg_temp.t_export_rows_md5() AS export_md5, pg_temp.t_detail_rows_md5() AS detail_md5,
    (SELECT count(*) FROM public."ExportMaster") AS n_exports,
    pg_temp.t_fn_md5('et_export_insert_data_1') AS insert_md5, pg_temp.t_fn_md5('et_export_get_data_1') AS get_md5,
    pg_temp.t_fn_md5('et_preview_document_list_1') AS preview_md5, pg_temp.t_fn_md5('et_annotation_index_rows') AS index_md5,
    pg_temp.t_index(NULL, 1) AS index_rows;

-- ------------------------------------------------------------------------------------------------ E00 (fixture, before the up)
DO $t$
DECLARE s jsonb;
BEGIN
    SELECT snap INTO s FROM c_before WHERE x = pg_temp.t_x('X2');
    IF pg_temp.t_burned(s->'get') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 63, 64, 68, 91]) THEN
        RAISE EXCEPTION 'FAIL E00 before the up an Unassigned export burns %, expected 61, 63, 64, 68, 91', pg_temp.t_burned(s->'get');
    END IF;
    SELECT snap INTO s FROM c_before WHERE x = pg_temp.t_x('X3');
    IF pg_temp.t_burned(s->'get') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 91])
       OR pg_temp.t_allfacts(s->'get') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 91]) THEN
        RAISE EXCEPTION 'FAIL E00 before the up an export with no filter burns %, allfacts %', pg_temp.t_burned(s->'get'), pg_temp.t_allfacts(s->'get');
    END IF;
    SELECT snap INTO s FROM c_before WHERE x = pg_temp.t_x('X5');
    IF pg_temp.t_burned(s->'get') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 64]) THEN
        RAISE EXCEPTION 'FAIL E00 before the up a Contact export burns %, expected 61, 64', pg_temp.t_burned(s->'get');
    END IF;
    IF (SELECT count(*) FROM public."FactPrivateGroup") IS DISTINCT FROM 6::bigint
       OR NOT EXISTS (SELECT 1 FROM public."FMIssue" WHERE "nFSid" = pg_temp.tid(67) AND "nIssueid" = pg_temp.tid(32)) THEN
        RAISE EXCEPTION 'FAIL E00 the fixture does not hold 6 memberships including the leftover on mark 67';
    END IF;
    RAISE NOTICE 'PASS E00 fixture: today an Unassigned export burns the grouped marks 61 and 63; no filter burns all 9 marks';
END $t$;

\ir 2026-11-13b_export_private_groups.up.sql

-- ------------------------------------------------------------------------------------------------ E09 (up half), E01, E01b
DO $t$
DECLARE b record; shape text;
BEGIN
    SELECT * INTO b FROM c_before_db;
    IF pg_temp.t_export_rows_md5() IS DISTINCT FROM b.export_md5 OR pg_temp.t_detail_rows_md5() IS DISTINCT FROM b.detail_md5 THEN
        RAISE EXCEPTION 'FAIL E09 the up changed the existing "ExportMaster" / "ExportDetail" rows';
    END IF;
    IF EXISTS (SELECT 1 FROM public."ExportMaster" WHERE ("jFGroup" IS NOT NULL OR "jQFGroup" IS NOT NULL)
                 AND "nExportid" IN (SELECT x FROM c_exports WHERE pre)) THEN
        RAISE EXCEPTION 'FAIL E09 an existing export has a group array after the up';
    END IF;
    SELECT string_agg(column_name || ' ' || data_type || ' ' || is_nullable || ' ' || COALESCE(column_default, 'no default'), ', ' ORDER BY column_name)
      INTO shape FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'ExportMaster' AND column_name IN ('jFGroup', 'jQFGroup');
    IF shape IS DISTINCT FROM 'jFGroup jsonb YES no default, jQFGroup jsonb YES no default' THEN
        RAISE EXCEPTION 'FAIL E09 new columns are %', shape;
    END IF;
    RAISE NOTICE 'PASS E09 (up half) existing "ExportMaster" / "ExportDetail" rows md5 unchanged; jFGroup / jQFGroup nullable jsonb, NULL on them';
END $t$;

DO $t$
DECLARE b record; snap_now jsonb;
BEGIN
    FOR b IN SELECT * FROM c_before ORDER BY name LOOP
        snap_now := pg_temp.t_snapshot(b.x);
        IF md5(pg_temp.t_canon(snap_now)::text) IS DISTINCT FROM b.snap_md5 THEN
            RAISE EXCEPTION 'FAIL E01 export "%" with no group arrays: before %, after %', b.name, pg_temp.t_canon(b.snap), pg_temp.t_canon(snap_now);
        END IF;
    END LOOP;
    -- et_annotation_index_rows called as before the export service change (no nMasterid / nExportid).
    IF md5(pg_temp.t_canon(pg_temp.t_rows('et_annotation_index_rows', jsonb_build_object(
            'jFactIds', pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 91]), 'jDocIds', pg_temp.t_ids(ARRAY[71]))) -> 0)::text)
       IS DISTINCT FROM md5(pg_temp.t_canon((SELECT index_rows FROM c_before_db))::text) THEN
        RAISE EXCEPTION 'FAIL E01 et_annotation_index_rows without nMasterid / nExportid changed';
    END IF;
    RAISE NOTICE 'PASS E01 no group arrays: get_data, preview and index answers md5-equal to before the up for all 5 exports, and the index called the old way';
END $t$;

DO $t$
DECLARE nx uuid; m record;
BEGIN
    nx := pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]), 'jQFIssue', pg_temp.t_ids(ARRAY[31])));
    SELECT "jFGroup", "jQFGroup" INTO m FROM public."ExportMaster" WHERE "nExportid" = nx;
    IF m."jFGroup" IS DISTINCT FROM '[]'::jsonb OR m."jQFGroup" IS DISTINCT FROM '[]'::jsonb THEN
        RAISE EXCEPTION 'FAIL E01b a new export without group keys stored jFGroup %, jQFGroup %', m."jFGroup", m."jQFGroup";
    END IF;
    IF pg_temp.t_canon(pg_temp.t_snapshot(nx), '{nExportid,nEDid}')
       IS DISTINCT FROM pg_temp.t_canon((SELECT snap FROM c_before WHERE x = pg_temp.t_x('X2')), '{nExportid,nEDid}') THEN
        RAISE EXCEPTION 'FAIL E01b a new Unassigned export without group keys answers differently from one made before the up';
    END IF;
    RAISE NOTICE 'PASS E01b a new export without group keys stores [] / [] and answers as the same export made before the up';
END $t$;

-- ------------------------------------------------------------------------------------------------ exports with groups
INSERT INTO c_exports VALUES
    ('E02 QFact group 41 only', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[41]))), false),
    ('E03 Liability and QFact group 41', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[32]),
        'jQFIssue', pg_temp.t_ids(ARRAY[32]), 'jQFGroup', pg_temp.t_ids(ARRAY[41]))), false),
    ('E04 Unassigned and QFact group 42', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31]), 'jQFGroup', pg_temp.t_ids(ARRAY[42]))), false),
    ('E04b Contact 51 and QFact group 42', pg_temp.t_insert(jsonb_build_object('jQFContact', pg_temp.t_ids(ARRAY[51]),
        'jQFGroup', pg_temp.t_ids(ARRAY[42]))), false),
    ('E05 B''s group 43 only', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[43]),
        'jFGroup', pg_temp.t_ids(ARRAY[43]))), false),
    ('E05b Unassigned and B''s group 43', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31]), 'jQFGroup', pg_temp.t_ids(ARRAY[43]))), false),
    ('E06 deleted group 44 only', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[44]))), false),
    ('E07 QFact groups 41, 42 and Fact group 41', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[41, 42]),
        'jFGroup', pg_temp.t_ids(ARRAY[41]), 'bDoc', true)), false);

-- ------------------------------------------------------------------------------------------------ E02-E07
DO $t$
DECLARE x uuid := pg_temp.t_x('E02'); g jsonb := pg_temp.t_get(x); p jsonb := pg_temp.t_preview(x);
BEGIN
    IF (SELECT "jQFGroup" FROM public."ExportMaster" WHERE "nExportid" = x) IS DISTINCT FROM pg_temp.t_ids(ARRAY[41])
       OR (SELECT "jFGroup" FROM public."ExportMaster" WHERE "nExportid" = x) IS DISTINCT FROM '[]'::jsonb THEN
        RAISE EXCEPTION 'FAIL E02 the insert did not store jQFGroup [41] / jFGroup []';
    END IF;
    -- 62 is a Full Fact in 41 (jFGroup is empty); 67's membership in 41 is a leftover on a mark with a Team Issue.
    IF pg_temp.t_burned(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[61])
       OR pg_temp.t_allfacts(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[61])
       OR pg_temp.t_list_ids(p->'factlinks') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61]) THEN
        RAISE EXCEPTION 'FAIL E02 jQFGroup [41], no Issue: burned %, allfacts %, preview %', pg_temp.t_burned(g),
            pg_temp.t_allfacts(g), pg_temp.t_list_ids(p->'factlinks');
    END IF;
    RAISE NOTICE 'PASS E02 jQFGroup [41] and no Issue: only A''s QFact 61 in group 41 (burned, allfacts, preview); not the Full Fact 62, not the leftover 67';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E03'); g jsonb := pg_temp.t_get(x); p jsonb := pg_temp.t_preview(x);
BEGIN
    IF pg_temp.t_burned(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 65, 66, 67])
       OR pg_temp.t_allfacts(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 65, 66, 67])
       OR pg_temp.t_list_ids(p->'factlinks') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 65, 66, 67]) THEN
        RAISE EXCEPTION 'FAIL E03 Liability and group 41: burned %, allfacts %, preview %', pg_temp.t_burned(g),
            pg_temp.t_allfacts(g), pg_temp.t_list_ids(p->'factlinks');
    END IF;
    IF pg_temp.t_burn_colour(g, 67) IS DISTINCT FROM 'ff9163' OR pg_temp.t_burn_colour(g, 61) IS DISTINCT FROM '0066FF' THEN
        RAISE EXCEPTION 'FAIL E03 colours: 67 %, 61 %', pg_temp.t_burn_colour(g, 67), pg_temp.t_burn_colour(g, 61);
    END IF;
    RAISE NOTICE 'PASS E03 Liability and group 41: the union 61 (group, 0066FF) + 65, 66, 67 (Liability; 67''s leftover membership counts as Team, ff9163)';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E04'); g jsonb := pg_temp.t_get(x); p jsonb := pg_temp.t_preview(x);
BEGIN
    IF pg_temp.t_burned(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[63, 64, 68, 91])
       OR pg_temp.t_allfacts(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[63, 64, 68, 91])
       OR pg_temp.t_list_ids(p->'factlinks') IS DISTINCT FROM pg_temp.t_ids(ARRAY[63, 64, 68]) THEN
        RAISE EXCEPTION 'FAIL E04 Unassigned and group 42: burned %, allfacts %, preview %', pg_temp.t_burned(g),
            pg_temp.t_allfacts(g), pg_temp.t_list_ids(p->'factlinks');
    END IF;
    IF pg_temp.t_burn_colour(g, 63) IS DISTINCT FROM '7C5CFF' OR pg_temp.t_burn_colour(g, 64) IS DISTINCT FROM 'ffff00'
       OR pg_temp.t_burn_colour(g, 68) IS DISTINCT FROM 'ffff00' OR pg_temp.t_burn_colour(g, 91) IS DISTINCT FROM 'ffff00' THEN
        RAISE EXCEPTION 'FAIL E04 colours: 63 %, 64 %, 68 %, 91 %', pg_temp.t_burn_colour(g, 63), pg_temp.t_burn_colour(g, 64),
            pg_temp.t_burn_colour(g, 68), pg_temp.t_burn_colour(g, 91);
    END IF;
    RAISE NOTICE 'PASS E04 Unassigned ticked, group 41 not: the grouped 61 (and the grouped Full Fact 62) absent; 64, 68 (stale group) and B''s 91 as Unassigned, 63 via group 42';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E04b'); g jsonb := pg_temp.t_get(x);
BEGIN
    IF pg_temp.t_burned(g) IS DISTINCT FROM pg_temp.t_ids(ARRAY[63, 64]) THEN
        RAISE EXCEPTION 'FAIL E04b Contact 51 and group 42: burned %, expected 63, 64', pg_temp.t_burned(g);
    END IF;
    RAISE NOTICE 'PASS E04b Contact 51 and group 42: 64 via the Contact, 63 via the group; 61 (Contact 51, in group 41) absent';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E05'); g jsonb := pg_temp.t_get(x); p jsonb := pg_temp.t_preview(x);
BEGIN
    IF pg_temp.t_burned(g) IS DISTINCT FROM '[]'::jsonb OR pg_temp.t_allfacts(g) IS DISTINCT FROM '[]'::jsonb
       OR pg_temp.t_list_ids(p->'factlinks') IS DISTINCT FROM '[]'::jsonb THEN
        RAISE EXCEPTION 'FAIL E05 B''s group 43 picked by A: burned %, allfacts %, preview %', pg_temp.t_burned(g),
            pg_temp.t_allfacts(g), pg_temp.t_list_ids(p->'factlinks');
    END IF;
    RAISE NOTICE 'PASS E05 another user''s group id in jFGroup / jQFGroup: no Fact / QFact row at all (B''s 91 in that group not burned)';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E05b'); s jsonb := pg_temp.t_snapshot(x);
BEGIN
    IF pg_temp.t_burned(s->'get') IS DISTINCT FROM pg_temp.t_ids(ARRAY[64, 68, 91]) OR pg_temp.t_burn_colour(s->'get', 91) IS DISTINCT FROM 'ffff00' THEN
        RAISE EXCEPTION 'FAIL E05b Unassigned and B''s group 43: burned %, 91 colour %', pg_temp.t_burned(s->'get'), pg_temp.t_burn_colour(s->'get', 91);
    END IF;
    -- Searched without the random export / detail ids, which could hold the six hex digits by chance.
    IF pg_temp.t_canon(s, '{nExportid,nEDid}')::text LIKE '%B group%'
       OR upper(pg_temp.t_canon(s, '{nExportid,nEDid}')::text) LIKE '%00AA00%' THEN
        RAISE EXCEPTION 'FAIL E05b B''s group name or colour appears in A''s export: %', s;
    END IF;
    RAISE NOTICE 'PASS E05b Unassigned and B''s group 43: B''s 91 still burns as Unassigned (ffff00); B''s group name and colour appear nowhere';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E06'); s jsonb := pg_temp.t_snapshot(x);
BEGIN
    IF pg_temp.t_burned(s->'get') IS DISTINCT FROM '[]'::jsonb OR pg_temp.t_allfacts(s->'get') IS DISTINCT FROM '[]'::jsonb
       OR pg_temp.t_list_ids(s->'preview'->'factlinks') IS DISTINCT FROM '[]'::jsonb THEN
        RAISE EXCEPTION 'FAIL E06 deleted group 44: burned %, allfacts %, preview %', pg_temp.t_burned(s->'get'),
            pg_temp.t_allfacts(s->'get'), pg_temp.t_list_ids(s->'preview'->'factlinks');
    END IF;
    IF pg_temp.t_canon(s, '{nExportid,nEDid}')::text LIKE '%Gone%'
       OR upper(pg_temp.t_canon(s, '{nExportid,nEDid}')::text) LIKE '%AA0000%' THEN
        RAISE EXCEPTION 'FAIL E06 the deleted group shows: %', s;
    END IF;
    RAISE NOTICE 'PASS E06 a deleted group id: no Fact / QFact row, no error (68''s stale membership selects nothing)';
END $t$;

DO $t$
DECLARE x uuid := pg_temp.t_x('E07'); s jsonb := pg_temp.t_snapshot(x); n integer; r jsonb; r_was jsonb;
BEGIN
    IF pg_temp.t_burned(s->'get') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 62, 63])
       OR pg_temp.t_list_ids(s->'preview'->'factlinks') IS DISTINCT FROM pg_temp.t_ids(ARRAY[61, 62, 63]) THEN
        RAISE EXCEPTION 'FAIL E07 groups 41 / 42: burned %, preview %', pg_temp.t_burned(s->'get'), pg_temp.t_list_ids(s->'preview'->'factlinks');
    END IF;
    -- Burned highlight, preview factlinks and index rows of the three group rows.
    IF pg_temp.t_burn_colour(s->'get', 61) IS DISTINCT FROM '0066FF' OR pg_temp.t_burn_colour(s->'get', 62) IS DISTINCT FROM '0066FF'
       OR pg_temp.t_burn_colour(s->'get', 63) IS DISTINCT FROM '7C5CFF'
       OR pg_temp.t_row(s->'preview'->'factlinks', 61)->>'cColor' IS DISTINCT FROM '0066FF'
       OR pg_temp.t_row(s->'preview'->'factlinks', 62)->>'cColor' IS DISTINCT FROM '0066FF'
       OR pg_temp.t_row(s->'preview'->'factlinks', 63)->>'cColor' IS DISTINCT FROM '7C5CFF'
       OR pg_temp.t_row(s->'index'->'factlinks', 61)->>'cColor' IS DISTINCT FROM '0066FF'
       OR pg_temp.t_row(s->'index'->'factlinks', 62)->>'cColor' IS DISTINCT FROM '0066FF'
       OR pg_temp.t_row(s->'index'->'factlinks', 63)->>'cColor' IS DISTINCT FROM '7C5CFF'
       OR pg_temp.t_row(s->'index'->'factlinks', 61)->'issuelist' IS DISTINCT FROM pg_temp.t_group_issue('Alpha', '0066FF')
       OR pg_temp.t_row(s->'index'->'factlinks', 62)->'issuelist' IS DISTINCT FROM pg_temp.t_group_issue('Alpha', '0066FF')
       OR pg_temp.t_row(s->'index'->'factlinks', 63)->'issuelist' IS DISTINCT FROM pg_temp.t_group_issue('Beta', '7C5CFF') THEN
        RAISE EXCEPTION 'FAIL E07 group colour / label: get %, preview %, index %', s->'get', s->'preview'->'factlinks', s->'index'->'factlinks';
    END IF;
    -- Every other index row (64-68, 91, the DocLink) is the row from before the up.
    FOREACH n IN ARRAY ARRAY[64, 65, 66, 67, 68, 91] LOOP
        r := pg_temp.t_row(s->'index'->'factlinks', n);
        r_was := pg_temp.t_row((SELECT index_rows FROM c_before_db)->'factlinks', n);
        IF pg_temp.t_canon(r) IS DISTINCT FROM pg_temp.t_canon(r_was) THEN
            RAISE EXCEPTION 'FAIL E07 index row of mark % changed: before %, after %', n, r_was, r;
        END IF;
    END LOOP;
    IF pg_temp.t_canon(s->'index'->'doclinks') IS DISTINCT FROM pg_temp.t_canon((SELECT index_rows FROM c_before_db)->'doclinks') THEN
        RAISE EXCEPTION 'FAIL E07 index DocLink rows changed';
    END IF;
    -- The index asked by someone who is not the export's creator, or without the export: nothing is coloured.
    IF pg_temp.t_canon(pg_temp.t_index(x, 2)) IS DISTINCT FROM pg_temp.t_canon((SELECT index_rows FROM c_before_db))
       OR pg_temp.t_canon(pg_temp.t_index(NULL, 1)) IS DISTINCT FROM pg_temp.t_canon((SELECT index_rows FROM c_before_db)) THEN
        RAISE EXCEPTION 'FAIL E07 the index colours the groups for another actor or without an export';
    END IF;
    -- The factsheet cursor (unchanged on purpose) never names a group.
    IF (s->'preview'->'factsheet')::text LIKE '%Alpha%' OR (s->'preview'->'factsheet')::text LIKE '%Beta%' THEN
        RAISE EXCEPTION 'FAIL E07 the factsheet names a group: %', s->'preview'->'factsheet';
    END IF;
    RAISE NOTICE 'PASS E07 group rows: colour 0066FF (Alpha) / 7C5CFF (Beta has no colour), index label = group name; other rows, another actor and no export unchanged';
END $t$;

-- ------------------------------------------------------------------------------------------------ E08, E09 (down half)
CREATE TEMP TABLE c_after_up AS SELECT (SELECT count(*) FROM public."ExportMaster") AS n_exports;

\ir 2026-11-13b_export_private_groups.down.sql

DO $t$
DECLARE b record; d record; snap_now jsonb; n_col int;
BEGIN
    SELECT * INTO d FROM c_before_db;
    SELECT count(*) INTO n_col FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'ExportMaster' AND column_name IN ('jFGroup', 'jQFGroup');
    IF n_col IS DISTINCT FROM 0
       OR to_regprocedure('public.et_export_private_group(uuid, uuid, jsonb, jsonb)') IS NOT NULL
       OR to_regprocedure('public.et_export_has_private_groups(jsonb, jsonb)') IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL E08 after the down: % group columns; helpers % / %', n_col,
            to_regprocedure('public.et_export_private_group(uuid, uuid, jsonb, jsonb)'), to_regprocedure('public.et_export_has_private_groups(jsonb, jsonb)');
    END IF;
    IF pg_temp.t_fn_md5('et_export_insert_data_1') IS DISTINCT FROM d.insert_md5
       OR pg_temp.t_fn_md5('et_export_get_data_1') IS DISTINCT FROM d.get_md5
       OR pg_temp.t_fn_md5('et_preview_document_list_1') IS DISTINCT FROM d.preview_md5
       OR pg_temp.t_fn_md5('et_annotation_index_rows') IS DISTINCT FROM d.index_md5 THEN
        RAISE EXCEPTION 'FAIL E08 a function source after the down differs from the "before" body';
    END IF;
    FOR b IN SELECT * FROM c_before ORDER BY name LOOP
        snap_now := pg_temp.t_snapshot(b.x);
        IF md5(pg_temp.t_canon(snap_now)::text) IS DISTINCT FROM b.snap_md5 THEN
            RAISE EXCEPTION 'FAIL E08 export "%" after the down: before %, after %', b.name, pg_temp.t_canon(b.snap), pg_temp.t_canon(snap_now);
        END IF;
    END LOOP;
    RAISE NOTICE 'PASS E08 down: both columns and both helpers gone; md5(prosrc) of the 4 functions and the E01 answers equal to before the up';
    IF pg_temp.t_export_rows_md5() IS DISTINCT FROM d.export_md5 OR pg_temp.t_detail_rows_md5() IS DISTINCT FROM d.detail_md5
       OR (SELECT count(*) FROM public."ExportMaster") IS DISTINCT FROM (SELECT n_exports FROM c_after_up) THEN
        RAISE EXCEPTION 'FAIL E09 the down changed or removed "ExportMaster" / "ExportDetail" rows';
    END IF;
    RAISE NOTICE 'PASS E09 (down half) the exports from before the up md5-equal again; no export row removed by the down';
END $t$;

\echo 'PASS all 13 checks'
