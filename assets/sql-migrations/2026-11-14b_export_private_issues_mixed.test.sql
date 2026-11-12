-- 2026-11-14b_export_private_issues_mixed.test.sql
--
-- Scratch-database test of 2026-11-14b_export_private_issues_mixed.up.sql (the Reader export with Marks that hold Team
-- Issues and several Private Groups) and of its rollback 2026-11-14b_export_private_issues_mixed.down.sql: checks
-- X01-X08 of Task 4 (.superpowers/sdd/2026-11-12-private-issues-under-claims/task-4-brief.md) and
--   X09 a Mark with a Team Issue in a ticked group passes with bFTeam false and keeps the Team colour;
--   X10 the up script refuses while "FactPrivateGroup"."dCreateDt" is missing (before 2026-11-14) and changes nothing;
--   X11 a second run of the up script is accepted ("already applied") and changes nothing;
--   X12 a private-only Mark whose groups are not ticked passes neither through Unassigned, nor a Contact, nor "all
--       Team Issues" (the 2026-11-13b rule, kept);
--   X00 the fixture, and the defect under the 2026-11-13b bodies: a Mark in two ticked groups is listed twice, and a
--       Mark with a Team Issue does not pass through its ticked group.
--
-- NOT RUN YET. Written 2026-11-12 without a database. Running it needs the owner's approval first (Golden Rule 1).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261114b).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run. The one
--     exception is X10: it runs the up script once before 2026-11-14_private_issue_claim_multi.up.sql is loaded, with
--     ON_ERROR_STOP off, so psql prints the script's refusal and "current transaction is aborted" errors there. Those
--     ERROR lines are expected; the check after them decides.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * Creates the minimal stand-ins of the 27 relations of 2026-11-13b_export_private_groups.test.sql (same columns;
--     "IssueCategory" also has "nCaseid" and "cICtype", which 2026-11-14 requires). As there, "FactMaster" has no
--     "nCreateId" and "BundleDetail" has one, so the unqualified "nCreateId" of the "allfacts" lateral of
--     et_export_get_data_1 resolves to BundleDetail."nCreateId", as it does in production.
--   * Loads from this folder, in order: 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql,
--     2026-11-12b_private_groups_unassigned_only.up.sql, 2026-11-13_private_group_colour.up.sql, the July bodies
--     2026-07-08_export_team_marks.up.sql, 2026-07-08_index_sp_page_color.up.sql and
--     2026-07-20_annotation_index_team_marks.up.sql, then 2026-11-13b_export_private_groups.up.sql, the script under
--     test once (refused: X10), 2026-11-14_private_issue_claim_multi.up.sql, the script under test (a run and a second
--     run) and, at the end, its rollback.
--   * Fixture writes besides the loaded scripts: after 2026-11-14 the memberships are inserted directly with explicit
--     "dCreateDt" values (the k-th group of a Mark 1 microsecond after the previous one, as et_private_group_assign
--     stamps a list), then group 44 is marked deleted directly (a group delete would also remove its membership).
--   * Fixture ids are c0000000-0000-4000-8000-0000000000NN (a hex letter, so an upper-case id differs from the stored
--     one). Nothing is rolled back: the loaded scripts commit themselves. Throw the scratch database away afterwards (a
--     separate approval).
--
-- How results are compared
-- ------------------------
-- As in 2026-11-13b_export_private_groups.test.sql: the functions aggregate with jsonb_agg and no ORDER BY, so every
-- "md5 equal" check compares md5 of a canonical form (pg_temp.t_canon: every JSON array sorted by its elements' text,
-- recursively; "dExportdt" and the named keys dropped). Function bodies are compared two ways: as the drift guards hash
-- them (pg_temp.t_norm: md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g')))), which also proves the hash constants
-- written in the up and down scripts, and as md5(prosrc) with CR removed (a Windows checkout has CRLF files).
--
-- NOT COVERED BY THIS TEST:
--   * The real "annotations" view and the real column types of the 27 stand-ins (see 2026-11-13b's test).
--   * The drift guard refusing a changed body (2026-11-13b's test E14 covers the same guard code), the drift guard of
--     the down script (its refusal and its "already rolled back" branch), and the live 2026-09-15 text of
--     et_preview_document_list_1 (2026-11-13b replaced it).
--   * The Python burner and the PDF itself (the colour reaches the burner as highlights[].color, which is checked).
--   * Two sessions at once, production volumes and plans (in particular whether the planner inlines the helper).
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-14b_export_private_issues_mixed.test.sql
-- Pass: a NOTICE "PASS X.. ..." for each of X00-X12 (in the order X10, X00, X11, X01-X07, X09, X12, X08), then
-- "PASS all 13 checks". A failure stops at "FAIL X.. ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'export_private_issues_mixed test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'export_private_issues_mixed test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- Ids: pg_temp.tid(n) = c0000000-0000-4000-8000-<n as 12 digits>.
--   Users     1 = A (the exporter), 2 = B (A's teammate). Role 5, team 6. Case 11, section 12, bundle 13.
--   Document  21 (uploaded by A). Issues 31 = the system Unassigned Issue (ffff00), 32 = 'Liability' (ff9163), both in
--             claim 35. Contact 51.
--   Groups    41 'Alpha' (A, colour 0066FF), 42 'Beta' (A, no colour: 7C5CFF), 43 'B group' (B, colour 00AA00),
--             44 'Gone' (A, deleted after 68 joined it, colour AA0000), 45 'Delta' (A, colour CC00CC, no Mark).
--   Marks     on document 21, A's unless noted ('QF' = QFact, 'F' = Full Fact); "Alpha then Beta" = added to Alpha
--             first, to Beta 1 microsecond later:
--             61 QF Liability, Alpha then Beta (mixed)          62 QF Unassigned, Beta then Alpha (private-only)
--             63 QF Unassigned, Alpha then Beta (private-only)  64 QF Unassigned, no group, Contact 51
--             65 F  Liability, Alpha (mixed)                    66 QF Liability, no group
--             67 F  Unassigned, Alpha (private-only)            68 QF Unassigned, only in the deleted group 44
--             69 QF Unassigned, Beta (private-only), Contact 51 70 F  Unassigned, no group
--             91 QF Unassigned, B's, in B's group 43, shared with A (FMShared)
--   DocLink 71 and WebLink 81 (A's). One "annotations" row per Mark: ff9163 for Liability, ffff00 for Unassigned,
--   0000ff for the DocLink, aaaaaa for the WebLink.
CREATE FUNCTION pg_temp.tid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$f$ SELECT ('c0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;

BEGIN;
CREATE TABLE public."CaseMaster"("nCaseid" uuid PRIMARY KEY, "cCasename" text, "cDesc" text, "cCaseno" text);
CREATE TABLE public."UserMaster"("nUserid" uuid PRIMARY KEY, "isAdmin" boolean, "cFname" text, "cLname" text);
CREATE TABLE public."RoleMaster"("nRoleid" uuid PRIMARY KEY, "nSrno" integer);
CREATE TABLE public."TeamRelation"("nCaseid" uuid, "nUserid" uuid, "nTeamid" uuid, "nRoleid" uuid, "cStatus" text);
CREATE TABLE public."SectionMaster"("nSectionid" uuid PRIMARY KEY, "nCaseid" uuid);
CREATE TABLE public."BundleMaster"("nBundleid" uuid PRIMARY KEY, "cBundletag" text);
CREATE TABLE public."BundleDetail"("nBundledetailid" uuid PRIMARY KEY, "nSectionid" uuid, "nBundleid" uuid,
    "cFilename" text, "cPath" text, "cPage" text, "cTab" text, "cExhibitno" text, "sorted_tab" text[], "nCreateId" uuid);
CREATE TABLE public."IssueCategory"("nICid" uuid PRIMARY KEY, "nCaseid" uuid, "cCategory" text, "cICtype" text);
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
INSERT INTO public."IssueCategory" VALUES (pg_temp.tid(35), pg_temp.tid(11), 'Claims', 'C');
INSERT INTO public."RIssueMaster" VALUES (pg_temp.tid(31), NULL, pg_temp.tid(35), 'Unassigned', 'ffff00'),
    (pg_temp.tid(32), pg_temp.tid(1), pg_temp.tid(35), 'Liability', 'ff9163');
INSERT INTO public."ContactMaster" VALUES (pg_temp.tid(51), 'Carl', 'Cole', 'CC', 'carl@example.test', 'Witness');
INSERT INTO public."FactMaster"
SELECT pg_temp.tid(n), pg_temp.tid(11), pg_temp.tid(CASE WHEN n = 91 THEN 2 ELSE 1 END),
       CASE WHEN n IN (65, 67, 70) THEN 'F' ELSE 'QF' END, pg_temp.tid(21)
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]) n;
INSERT INTO public."FactDetail"
SELECT pg_temp.tid(n), 'S', n - 60, pg_temp.tid(CASE WHEN n IN (61, 65, 66) THEN 32 ELSE 31 END),
       jsonb_build_array('text ' || n), jsonb_build_array('text ' || n), jsonb_build_object('start', n - 60, 'end', n - 60)
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]) n;
INSERT INTO public."FMIssue"
SELECT pg_temp.tid(n), pg_temp.tid(CASE WHEN n IN (61, 65, 66) THEN 32 ELSE 31 END), 0, 0
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]) n;
INSERT INTO public."FMContact" VALUES (pg_temp.tid(64), pg_temp.tid(51)), (pg_temp.tid(69), pg_temp.tid(51));
INSERT INTO public."FMShared" VALUES (pg_temp.tid(91), pg_temp.tid(1));
INSERT INTO public."DocMaster" VALUES (pg_temp.tid(71), pg_temp.tid(1), pg_temp.tid(21));
INSERT INTO public."DocDetail" VALUES (pg_temp.tid(71), 'S', 2, '["link text"]', '{"start": 2, "end": 2}');
INSERT INTO public."WebMaster" VALUES (pg_temp.tid(81), pg_temp.tid(1), pg_temp.tid(21));
INSERT INTO public."WebDetail" VALUES (pg_temp.tid(81), 'S', 'https://example.test', 'Title', 'Note', '["web text"]', '{}');
INSERT INTO public.annotations
SELECT pg_temp.tid(100 + n), 'a' || n, 'highlight', '[]', '[]', 1,
       CASE WHEN n IN (61, 65, 66) THEN 'ff9163' WHEN n = 71 THEN '0000ff' WHEN n = 81 THEN 'aaaaaa' ELSE 'ffff00' END,
       CASE WHEN n IN (71, 81) THEN 2 ELSE n - 60 END,
       CASE WHEN n NOT IN (71, 81) THEN pg_temp.tid(n) END,
       CASE WHEN n = 71 THEN pg_temp.tid(n) END,
       CASE WHEN n = 81 THEN pg_temp.tid(n) END
FROM unnest(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 81, 91]) n;
COMMIT;

-- ------------------------------------------------------------------------------------------------ load the earlier scripts
-- Their guard accepts the database named in etabella.expected_database. Name the scratch database only: anywhere
-- else the setting names no real database, so the migrations' own guards refuse too.
SELECT set_config('etabella.expected_database',
    CASE WHEN left(current_database(), 16) = 'etabella_scratch' THEN current_database() ELSE 'not-a-scratch-database' END,
    false) AS expected_database;

\ir 2026-10-09_private_fact_groups.up.sql
\ir 2026-11-12_private_groups_for_qfacts.up.sql
\ir 2026-11-12b_private_groups_unassigned_only.up.sql
\ir 2026-11-13_private_group_colour.up.sql

INSERT INTO public."PrivateFactGroup"("nGroupid", "nCaseid", "nUserid", "cName", "cColor") VALUES
    (pg_temp.tid(41), pg_temp.tid(11), pg_temp.tid(1), 'Alpha', '0066FF'),
    (pg_temp.tid(42), pg_temp.tid(11), pg_temp.tid(1), 'Beta', NULL),
    (pg_temp.tid(43), pg_temp.tid(11), pg_temp.tid(2), 'B group', '00AA00'),
    (pg_temp.tid(44), pg_temp.tid(11), pg_temp.tid(1), 'Gone', 'AA0000'),
    (pg_temp.tid(45), pg_temp.tid(11), pg_temp.tid(1), 'Delta', 'CC00CC');

-- The July bodies 2026-11-13b starts from (the latest ones in this repository).
\ir 2026-07-08_export_team_marks.up.sql
\ir 2026-07-08_index_sp_page_color.up.sql
\ir 2026-07-20_annotation_index_team_marks.up.sql

-- ------------------------------------------------------------------------------------------------ helpers
-- A sorted jsonb array of fixture ids as text.
CREATE FUNCTION pg_temp.t_ids(ns integer[]) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT COALESCE(jsonb_agg(pg_temp.tid(n)::text ORDER BY pg_temp.tid(n)::text), '[]'::jsonb) FROM unnest(ns) n $f$;

-- Fails the check when got is not want (NULL equals NULL).
CREATE FUNCTION pg_temp.t_expect(check_name text, what text, got jsonb, want jsonb) RETURNS void
LANGUAGE plpgsql AS $f$
BEGIN
    IF got IS DISTINCT FROM want THEN
        RAISE EXCEPTION 'FAIL % %: got %, expected %', check_name, what, got, want;
    END IF;
END $f$;

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
-- 21; the index rows of every Mark and the DocLink, by the given actor).
CREATE FUNCTION pg_temp.t_get(x uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_export_get_data_1', jsonb_build_object('nExportid', x, 'nMasterid', pg_temp.tid(1))) $f$;
CREATE FUNCTION pg_temp.t_preview(x uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_preview_document_list_1', jsonb_build_object('nBundledetailid', pg_temp.tid(21),
        'nMasterid', pg_temp.tid(1), 'nExportid', x)) -> 0 $f$;
CREATE FUNCTION pg_temp.t_index(x uuid, actor_n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_annotation_index_rows', jsonb_build_object(
        'jFactIds', pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]), 'jDocIds', pg_temp.t_ids(ARRAY[71]),
        'nMasterid', pg_temp.tid(actor_n), 'nExportid', x)) -> 0 $f$;
CREATE FUNCTION pg_temp.t_snapshot(x uuid) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object('get', pg_temp.t_get(x), 'preview', pg_temp.t_preview(x), 'index', pg_temp.t_index(x, 1)) $f$;
-- The index called as before the export service change (no nMasterid / nExportid).
CREATE FUNCTION pg_temp.t_index_plain() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_annotation_index_rows', jsonb_build_object(
        'jFactIds', pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]), 'jDocIds', pg_temp.t_ids(ARRAY[71]))) -> 0 $f$;

-- The Fact / QFact ids (or those of one type) of get_data's burned highlights, and of its allfacts, sorted.
CREATE FUNCTION pg_temp.t_burned(g jsonb, typ text DEFAULT NULL) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(DISTINCT h->>'nFSid' ORDER BY h->>'nFSid'), '[]'::jsonb)
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'linktype' IN ('F', 'QF') AND (typ IS NULL OR h->>'linktype' = typ) $f$;
CREATE FUNCTION pg_temp.t_allfacts(g jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(DISTINCT a ORDER BY a), '[]'::jsonb)
    FROM jsonb_array_elements(g) r, jsonb_array_elements_text(r->'allfacts') a $f$;
-- The canonical highlight objects of one type.
CREATE FUNCTION pg_temp.t_hl(g jsonb, typ text) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_canon(COALESCE(jsonb_agg(h), '[]'::jsonb))
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'linktype' = typ $f$;
-- The Mark ids of a list of rows (preview factlinks, index factlinks), sorted; and the canonical rows of one type.
CREATE FUNCTION pg_temp.t_list_ids(list jsonb, typ text DEFAULT NULL) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(e->>'nFSid' ORDER BY e->>'nFSid'), '[]'::jsonb) FROM jsonb_array_elements(list) e
    WHERE typ IS NULL OR e->>'cFType' = typ $f$;
CREATE FUNCTION pg_temp.t_links(list jsonb, typ text) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_canon(COALESCE(jsonb_agg(e), '[]'::jsonb)) FROM jsonb_array_elements(list) e WHERE e->>'cFType' = typ $f$;
-- The burned colour(s) of Mark n as a jsonb string, and the (first) row of Mark n in a list.
CREATE FUNCTION pg_temp.t_burn_colour(g jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT to_jsonb(string_agg(DISTINCT h->>'color', ','))
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'nFSid' = pg_temp.tid(n)::text $f$;
CREATE FUNCTION pg_temp.t_row(list jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT e FROM jsonb_array_elements(list) e WHERE e->>'nFSid' = pg_temp.tid(n)::text LIMIT 1 $f$;
-- How many times Mark n appears: highlight entries in get_data's answer, rows in a list.
CREATE FUNCTION pg_temp.t_hl_count(g jsonb, n integer) RETURNS integer LANGUAGE sql AS
$f$ SELECT count(*)::integer
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'nFSid' = pg_temp.tid(n)::text $f$;
CREATE FUNCTION pg_temp.t_row_count(list jsonb, n integer) RETURNS integer LANGUAGE sql AS
$f$ SELECT count(*)::integer FROM jsonb_array_elements(COALESCE(list, '[]'::jsonb)) e WHERE e->>'nFSid' = pg_temp.tid(n)::text $f$;
-- Mark n's appearances in a snapshot: [highlight entries, preview rows, index rows].
CREATE FUNCTION pg_temp.t_counts(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_array(pg_temp.t_hl_count(s->'get', n), pg_temp.t_row_count(s->'preview'->'factlinks', n),
        pg_temp.t_row_count(s->'index'->'factlinks', n)) $f$;
-- Mark n's colour in a snapshot: [burned, preview "cColor", index "cColor"].
CREATE FUNCTION pg_temp.t_colours(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_array(pg_temp.t_burn_colour(s->'get', n), pg_temp.t_row(s->'preview'->'factlinks', n)->'cColor',
        pg_temp.t_row(s->'index'->'factlinks', n)->'cColor') $f$;
-- Index "issuelist" elements: an Issue (as et_annotation_index_rows builds it) and the one a ticked group adds.
CREATE FUNCTION pg_temp.t_issue_el(n integer, name text, colour text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('nIssueid', pg_temp.tid(n), 'cIssue', name, 'cClr', colour) $f$;
CREATE FUNCTION pg_temp.t_group_el(name text, colour text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('nIssueid', NULL, 'cIssue', name, 'cClr', colour) $f$;
CREATE FUNCTION pg_temp.t_label(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_row(s->'index'->'factlinks', n)->'issuelist' $f$;
-- Fails when the snapshot (export ids removed) names one of the groups, or shows one of the colours (upper case).
CREATE FUNCTION pg_temp.t_absent(check_name text, s jsonb, names text[], colours text[]) RETURNS void
LANGUAGE plpgsql AS $f$
DECLARE txt text := pg_temp.t_canon(s, '{nExportid,nEDid}')::text; v text;
BEGIN
    FOREACH v IN ARRAY names LOOP
        IF position(v IN txt) > 0 THEN
            RAISE EXCEPTION 'FAIL % the group name % appears: %', check_name, v, txt;
        END IF;
    END LOOP;
    FOREACH v IN ARRAY colours LOOP
        IF position(v IN upper(txt)) > 0 THEN
            RAISE EXCEPTION 'FAIL % the group colour % appears: %', check_name, v, txt;
        END IF;
    END LOOP;
END $f$;

-- Function bodies as the drift guards hash them (NULL when the function does not exist), and md5(prosrc) without CR.
CREATE FUNCTION pg_temp.t_norm(sig text) RETURNS text LANGUAGE sql AS
$f$ SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc WHERE oid = to_regprocedure(sig) $f$;
CREATE FUNCTION pg_temp.t_norms() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object(
    'insert', pg_temp.t_norm('public.et_export_insert_data_1(json,refcursor)'),
    'get', pg_temp.t_norm('public.et_export_get_data_1(json,refcursor)'),
    'preview', pg_temp.t_norm('public.et_preview_document_list_1(json,refcursor)'),
    'index', pg_temp.t_norm('public.et_annotation_index_rows(json,refcursor)'),
    'old_helper', pg_temp.t_norm('public.et_export_private_group(uuid,uuid,jsonb,jsonb)'),
    'helper', pg_temp.t_norm('public.et_export_private_groups_mark(uuid,uuid,jsonb,jsonb)'),
    'team_rule', pg_temp.t_norm('public.et_export_team_rule(text,jsonb,jsonb,boolean,boolean,jsonb,jsonb,jsonb,jsonb)'),
    'nonempty', pg_temp.t_norm('public.et_export_nonempty_array(jsonb)')) $f$;
-- The 2026-11-13b state: the four hashes 2026-11-13b documents for its own bodies, its three helpers, no new helper.
CREATE FUNCTION pg_temp.t_13b_norms() RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('insert', 'c709859c0771bb7ffd67cb69743f0f68', 'get', '4e153224b2e1927c0814afd5937f725c',
    'preview', '717ffc7a38a6285b45353a096bc0c931', 'index', 'd960718d865d3c928dad4725b7fb7fa6',
    'old_helper', 'da6f80d67bdd12996c8baf8c059b8955', 'helper', NULL, 'team_rule', '9a3c937a112f46a36c00aab7dba6085c',
    'nonempty', 'edd66f294d7497718e63d9bb0dab7f9e') $f$;
-- The state after the up script: its own four hashes (written in its drift guard), the rest unchanged.
CREATE FUNCTION pg_temp.t_mine_norms() RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT pg_temp.t_13b_norms() || jsonb_build_object('get', 'fa3f9ddcdaa972a223625e060a87684e', 'preview', '83e6f1bebf65216106dc8509732661fb',
    'index', '0b28d7598121e6ac4f84811251607f88', 'helper', 'ec2d72152aacff217a94ee587f62e792') $f$;
CREATE FUNCTION pg_temp.t_fn_md5(fn text) RETURNS text LANGUAGE sql AS
$f$ SELECT md5(replace(prosrc, E'\r', '')) FROM pg_proc WHERE proname = fn AND pronamespace = 'public'::regnamespace $f$;
CREATE FUNCTION pg_temp.t_fns() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_object_agg(proname, md5(replace(prosrc, E'\r', ''))) FROM pg_proc WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('et_export_insert_data_1', 'et_export_get_data_1', 'et_preview_document_list_1', 'et_annotation_index_rows',
                    'et_export_nonempty_array', 'et_export_private_group', 'et_export_team_rule',
                    'et_export_private_groups_mark') $f$;

-- ------------------------------------------------------------------------------------------------ exports
-- kind 'old': made before 2026-11-13b (its four columns NULL); 'nogroup': no group ticked; 'group': groups ticked.
-- Every export has both types (bFact and bQfact true) and B's shared Mark 91 visible (bTeamMarks true) unless noted.
CREATE TEMP TABLE c_exports(name text PRIMARY KEY, x uuid NOT NULL, kind text NOT NULL);
CREATE FUNCTION pg_temp.t_x(name_prefix text) RETURNS uuid LANGUAGE sql AS
$f$ SELECT x FROM c_exports WHERE name LIKE name_prefix || ' %' $f$;

INSERT INTO c_exports VALUES
    ('N1 all Issues, DocLinks and WebLinks', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31, 32]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31, 32]), 'bDoc', true, 'bWeb', true)), 'old'),
    ('N2 Unassigned', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31]))), 'old'),
    ('N3 no filter', pg_temp.t_insert(jsonb_build_object('bDoc', true)), 'old'),
    ('N4 Liability, own Marks only', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[32]),
        'jQFIssue', pg_temp.t_ids(ARRAY[32]), 'bTeamMarks', false)), 'old'),
    ('N5 QFact Contact 51', pg_temp.t_insert(jsonb_build_object('jQFContact', pg_temp.t_ids(ARRAY[51]))), 'old');

-- ------------------------------------------------------------------------------------------------ 2026-11-13b
\ir 2026-11-13b_export_private_groups.up.sql

-- ------------------------------------------------------------------------------------------------ X10 (no "dCreateDt" yet)
-- 2026-11-14 is not loaded: "FactPrivateGroup" has no "dCreateDt" (only "PrivateFactGroup" has a column of that name).
-- The up script must refuse before anything is changed. ON_ERROR_STOP is off for that one run only.
CREATE TEMP TABLE c_13b AS SELECT pg_temp.t_norms() AS norms, pg_temp.t_fn_md5('et_export_get_data_1') AS get_md5,
    pg_temp.t_fn_md5('et_preview_document_list_1') AS preview_md5, pg_temp.t_fn_md5('et_annotation_index_rows') AS index_md5;

DO $t$
BEGIN
    PERFORM pg_temp.t_expect('X10', 'bodies and helpers before the run (the 2026-11-13b state)',
        (SELECT norms FROM c_13b), pg_temp.t_13b_norms());
    PERFORM pg_temp.t_expect('X10', '"FactPrivateGroup"."dCreateDt" before 2026-11-14', to_jsonb((SELECT count(*)
        FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'FactPrivateGroup'
         AND column_name = 'dCreateDt')), '0');
END $t$;

\echo 'X10: the up script runs once before 2026-11-14_private_issue_claim_multi.up.sql; the ERROR lines up to the next PASS are expected'
\set ON_ERROR_STOP off
\ir 2026-11-14b_export_private_issues_mixed.up.sql
\set ON_ERROR_STOP on

DO $t$
BEGIN
    PERFORM pg_temp.t_expect('X10', 'bodies and helpers after the refused run', pg_temp.t_norms(), pg_temp.t_13b_norms());
    RAISE NOTICE 'PASS X10 without "FactPrivateGroup"."dCreateDt" the up script changed nothing (no helper, the 2026-11-13b bodies kept)';
END $t$;

-- ------------------------------------------------------------------------------------------------ 2026-11-14 and memberships
\ir 2026-11-14_private_issue_claim_multi.up.sql

-- 2026-11-14's guard allows a group beside a Team Issue and several groups per Mark. 44 is deleted afterwards.
INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid", "dCreateDt")
SELECT pg_temp.tid(v.m), pg_temp.tid(v.g), timestamptz '2026-11-14 10:00:00+00' + v.k * interval '1 microsecond'
FROM (VALUES (61, 41, 0), (61, 42, 1), (62, 42, 0), (62, 41, 1), (63, 41, 0), (63, 42, 1), (65, 41, 0), (67, 41, 0),
             (68, 44, 0), (69, 42, 0), (91, 43, 0)) AS v(m, g, k);
UPDATE public."PrivateFactGroup" SET "dDeletedDt" = now() WHERE "nGroupid" = pg_temp.tid(44);

INSERT INTO c_exports VALUES
    ('N6 Liability, empty group arrays, flags false', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[32]),
        'jQFIssue', pg_temp.t_ids(ARRAY[32]), 'jFGroup', '[]'::jsonb, 'jQFGroup', '[]'::jsonb, 'bFTeam', false,
        'bQFTeam', false)), 'nogroup'),
    ('N7 Unassigned, no group keys', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFIssue', pg_temp.t_ids(ARRAY[31]))), 'nogroup'),
    ('G02a QFact Liability only', pg_temp.t_insert(jsonb_build_object('jQFIssue', pg_temp.t_ids(ARRAY[32]))), 'group'),
    ('G02b QFact Liability and group Delta', pg_temp.t_insert(jsonb_build_object('jQFIssue', pg_temp.t_ids(ARRAY[32]),
        'jQFGroup', pg_temp.t_ids(ARRAY[45]))), 'group'),
    ('G03 QFact Liability and groups Alpha, Beta', pg_temp.t_insert(jsonb_build_object('jQFIssue', pg_temp.t_ids(ARRAY[32]),
        'jQFGroup', pg_temp.t_ids(ARRAY[41, 42]))), 'group'),
    ('G04 QFact group Alpha, bQFTeam false', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[41]),
        'bQFTeam', false)), 'group'),
    ('G04u QFact group Alpha as an upper-case id, bQFTeam false', pg_temp.t_insert(jsonb_build_object(
        'jQFGroup', jsonb_build_array(upper(pg_temp.tid(41)::text)), 'bQFTeam', false)), 'group'),
    ('G05a QFact Unassigned, groups Alpha and B group', pg_temp.t_insert(jsonb_build_object(
        'jQFIssue', pg_temp.t_ids(ARRAY[31]), 'jQFGroup', pg_temp.t_ids(ARRAY[41, 43]))), 'group'),
    ('G05b QFact B group, bQFTeam false', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[43]),
        'bQFTeam', false)), 'group'),
    ('G06 QFact group Beta, bQFTeam false', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[42]),
        'bQFTeam', false)), 'group'),
    ('G07 deleted and unknown group ids, flags false', pg_temp.t_insert(jsonb_build_object(
        'jFGroup', pg_temp.t_ids(ARRAY[44, 99]), 'jQFGroup', pg_temp.t_ids(ARRAY[44, 99]), 'bFTeam', false,
        'bQFTeam', false)), 'group'),
    ('G09 Fact group Alpha, bFTeam false', pg_temp.t_insert(jsonb_build_object('jFGroup', pg_temp.t_ids(ARRAY[41]),
        'bFTeam', false)), 'group'),
    ('G12a QFact Unassigned and group Delta', pg_temp.t_insert(jsonb_build_object('jQFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFGroup', pg_temp.t_ids(ARRAY[45]))), 'group'),
    ('G12b QFact group Delta, all Team Issues', pg_temp.t_insert(jsonb_build_object('jQFGroup', pg_temp.t_ids(ARRAY[45]),
        'bQFTeam', true)), 'group'),
    ('G12c QFact Contact 51 and group Delta', pg_temp.t_insert(jsonb_build_object('jQFContact', pg_temp.t_ids(ARRAY[51]),
        'jQFGroup', pg_temp.t_ids(ARRAY[45]))), 'group');

-- ------------------------------------------------------------------------------------------------ baseline (before the up)
CREATE TEMP TABLE c_before AS
SELECT e.name, e.x, s.snap, md5(pg_temp.t_canon(s.snap)::text) AS snap_md5
FROM c_exports e CROSS JOIN LATERAL (SELECT pg_temp.t_snapshot(e.x) AS snap) s
WHERE e.kind IN ('old', 'nogroup');
CREATE TEMP TABLE c_before_db AS SELECT pg_temp.t_index_plain() AS index_plain, pg_temp.t_index(NULL, 1) AS index_rows,
    (SELECT snap FROM c_before WHERE name LIKE 'N3 %') AS no_filter_snap;
-- Two group exports under the 2026-11-13b bodies (X00), compared again after the down (X08).
CREATE TEMP TABLE c_red AS
SELECT e.name, e.x, pg_temp.t_snapshot(e.x) AS snap FROM c_exports e WHERE e.name LIKE 'G03 %' OR e.name LIKE 'G09 %';

-- ------------------------------------------------------------------------------------------------ X00 (fixture, 2026-11-13b)
DO $t$
DECLARE s03 jsonb := (SELECT snap FROM c_red WHERE name LIKE 'G03 %'); s09 jsonb := (SELECT snap FROM c_red WHERE name LIKE 'G09 %');
BEGIN
    PERFORM pg_temp.t_expect('X00', 'memberships', to_jsonb((SELECT count(*) FROM public."FactPrivateGroup")), '11');
    PERFORM pg_temp.t_expect('X00', 'groups of 62, oldest first', (SELECT jsonb_agg("nGroupid"::text ORDER BY "dCreateDt")
        FROM public."FactPrivateGroup" WHERE "nFSid" = pg_temp.tid(62)), jsonb_build_array(pg_temp.tid(42)::text, pg_temp.tid(41)::text));
    PERFORM pg_temp.t_expect('X00', 'groups of 63, oldest first', (SELECT jsonb_agg("nGroupid"::text ORDER BY "dCreateDt")
        FROM public."FactPrivateGroup" WHERE "nFSid" = pg_temp.tid(63)), jsonb_build_array(pg_temp.tid(41)::text, pg_temp.tid(42)::text));
    PERFORM pg_temp.t_expect('X00', 'bodies before the up (the 2026-11-13b state)', pg_temp.t_norms(), pg_temp.t_13b_norms());
    PERFORM pg_temp.t_expect('X00', 'no filter: burned', pg_temp.t_burned((SELECT no_filter_snap FROM c_before_db)->'get'),
        pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]));
    -- The defect: 62 (Unassigned, in Alpha and Beta, both ticked) appears twice in each of the three functions ...
    PERFORM pg_temp.t_expect('X00', '2026-11-13b, G03: appearances of 62', pg_temp.t_counts(s03, 62), '[2, 2, 2]');
    -- ... and a Mark with a Team Issue does not pass through its ticked group: with bFTeam false only 67 of Alpha's
    -- Facts is burned, not 65 (Liability, in Alpha).
    PERFORM pg_temp.t_expect('X00', '2026-11-13b, G09: burned Facts', pg_temp.t_burned(s09->'get', 'F'), pg_temp.t_ids(ARRAY[67]));
    RAISE NOTICE 'PASS X00 fixture: 11 memberships in adding order; under the 2026-11-13b bodies 62 in two ticked groups appears twice in get_data, preview and index, and Fact 65 (Liability, in Alpha) is not let through by Alpha';
END $t$;

-- ------------------------------------------------------------------------------------------------ the up script
\ir 2026-11-14b_export_private_issues_mixed.up.sql

-- ------------------------------------------------------------------------------------------------ X11 (a second run)
CREATE TEMP TABLE c_first_up AS SELECT pg_temp.t_norms() AS norms, pg_temp.t_fns() AS fns;

\ir 2026-11-14b_export_private_issues_mixed.up.sql

DO $t$
DECLARE f record;
BEGIN
    SELECT * INTO f FROM c_first_up;
    PERFORM pg_temp.t_expect('X11', 'bodies and helpers after the first run (the hashes written in the drift guard)',
        f.norms, pg_temp.t_mine_norms());
    PERFORM pg_temp.t_expect('X11', 'eight functions after the first run', to_jsonb((SELECT count(*) FROM jsonb_object_keys(f.fns))), '8');
    PERFORM pg_temp.t_expect('X11', 'function sources after the second run', pg_temp.t_fns(), f.fns);
    RAISE NOTICE 'PASS X11 the up script left its own four hashes and the 2026-11-13b insert / helpers unchanged; a second run is accepted (already applied) and changes nothing';
END $t$;

-- ------------------------------------------------------------------------------------------------ X01 (no group arrays)
DO $t$
DECLARE b record; snap_now jsonb;
BEGIN
    FOR b IN SELECT * FROM c_before ORDER BY name LOOP
        snap_now := pg_temp.t_snapshot(b.x);
        IF md5(pg_temp.t_canon(snap_now)::text) IS DISTINCT FROM b.snap_md5 THEN
            RAISE EXCEPTION 'FAIL X01 export "%" with no group arrays: before %, after %', b.name, pg_temp.t_canon(b.snap), pg_temp.t_canon(snap_now);
        END IF;
    END LOOP;
    PERFORM pg_temp.t_expect('X01', 'index called without nMasterid / nExportid', pg_temp.t_canon(pg_temp.t_index_plain()),
        pg_temp.t_canon((SELECT index_plain FROM c_before_db)));
    PERFORM pg_temp.t_expect('X01', 'index without an export', pg_temp.t_canon(pg_temp.t_index(NULL, 1)),
        pg_temp.t_canon((SELECT index_rows FROM c_before_db)));
    PERFORM pg_temp.t_expect('X01', 'exports compared', to_jsonb((SELECT count(*) FROM c_before)), '7');
    RAISE NOTICE 'PASS X01 no group arrays (NULL or []): get_data, preview and index answers md5-equal to the 2026-11-13b answers for all 7 exports; the index called without an export too';
END $t$;

-- ------------------------------------------------------------------------------------------------ X02 (Issue ticked, no group)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G02a'));
BEGIN
    PERFORM pg_temp.t_expect('X02', 'burned', pg_temp.t_burned(s->'get'), pg_temp.t_ids(ARRAY[61, 66]));
    PERFORM pg_temp.t_expect('X02', 'preview factlinks', pg_temp.t_list_ids(s->'preview'->'factlinks'), pg_temp.t_ids(ARRAY[61, 66]));
    PERFORM pg_temp.t_expect('X02', 'appearances of 61', pg_temp.t_counts(s, 61), '[1, 1, 1]');
    PERFORM pg_temp.t_expect('X02', 'colours of 61', pg_temp.t_colours(s, 61), '["ff9163", "ff9163", "ff9163"]');
    PERFORM pg_temp.t_expect('X02', 'index label of 61', pg_temp.t_label(s, 61),
        jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163')));
    PERFORM pg_temp.t_absent('X02', s, ARRAY['Alpha', 'Beta', 'Delta'], ARRAY['0066FF', '7C5CFF', 'CC00CC']);
    -- A ticked group the Mark is not in (Delta) changes nothing.
    PERFORM pg_temp.t_expect('X02', 'answers with group Delta also ticked (export ids removed)',
        pg_temp.t_canon(pg_temp.t_snapshot(pg_temp.t_x('G02b')), '{nExportid,nEDid}'), pg_temp.t_canon(s, '{nExportid,nEDid}'));
    RAISE NOTICE 'PASS X02 Liability ticked: 61 (Liability, in Alpha and Beta) listed once in all three functions, Team colour ff9163, no group name; ticking Delta as well changes nothing';
END $t$;

-- ------------------------------------------------------------------------------------------------ X03 (two ticked groups)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G03')); n integer;
BEGIN
    PERFORM pg_temp.t_expect('X03', 'burned', pg_temp.t_burned(s->'get'), pg_temp.t_ids(ARRAY[61, 62, 63, 66, 69]));
    PERFORM pg_temp.t_expect('X03', 'allfacts', pg_temp.t_allfacts(s->'get'), pg_temp.t_ids(ARRAY[61, 62, 63, 66, 69]));
    PERFORM pg_temp.t_expect('X03', 'preview factlinks', pg_temp.t_list_ids(s->'preview'->'factlinks'), pg_temp.t_ids(ARRAY[61, 62, 63, 66, 69]));
    FOREACH n IN ARRAY ARRAY[61, 62, 63, 66, 69] LOOP
        PERFORM pg_temp.t_expect('X03', 'appearances of ' || n, pg_temp.t_counts(s, n), '[1, 1, 1]');
    END LOOP;
    PERFORM pg_temp.t_expect('X03', 'index rows', to_jsonb(jsonb_array_length(s->'index'->'factlinks')), '11');
    PERFORM pg_temp.t_expect('X03', 'colours of 61, 62, 63, 66, 69', jsonb_build_array(pg_temp.t_colours(s, 61),
        pg_temp.t_colours(s, 62), pg_temp.t_colours(s, 63), pg_temp.t_colours(s, 66), pg_temp.t_colours(s, 69)),
        '[["ff9163", "ff9163", "ff9163"], ["0066FF", "0066FF", "0066FF"], ["7C5CFF", "7C5CFF", "7C5CFF"],
          ["ff9163", "ff9163", "ff9163"], ["7C5CFF", "7C5CFF", "7C5CFF"]]');
    PERFORM pg_temp.t_expect('X03', 'index labels of 61, 62, 63, 69', jsonb_build_array(pg_temp.t_label(s, 61),
        pg_temp.t_label(s, 62), pg_temp.t_label(s, 63), pg_temp.t_label(s, 69)),
        jsonb_build_array(
            jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163'), pg_temp.t_group_el('Alpha, Beta', '7C5CFF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha, Beta', '0066FF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha, Beta', '7C5CFF')),
            jsonb_build_array(pg_temp.t_group_el('Beta', '7C5CFF'))));
    RAISE NOTICE 'PASS X03 Liability and groups Alpha, Beta: 61 (both ticks), 62, 63 (two groups each) listed once in all three functions; label "Alpha, Beta" in name order, colour of the most recently added ticked group (62 0066FF, 63 7C5CFF); 61 keeps ff9163 and its Liability label';
END $t$;

-- ------------------------------------------------------------------------------------------------ X04 (private-only, one group ticked)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G04'));
BEGIN
    PERFORM pg_temp.t_expect('X04', 'burned QFacts', pg_temp.t_burned(s->'get', 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63]));
    PERFORM pg_temp.t_expect('X04', 'colours of 61, 62, 63', jsonb_build_array(pg_temp.t_colours(s, 61),
        pg_temp.t_colours(s, 62), pg_temp.t_colours(s, 63)),
        '[["ff9163", "ff9163", "ff9163"], ["0066FF", "0066FF", "0066FF"], ["0066FF", "0066FF", "0066FF"]]');
    -- 63 was added to Beta after Alpha, but Beta is not ticked: Alpha's colour and name only.
    PERFORM pg_temp.t_expect('X04', 'index labels of 61, 62, 63', jsonb_build_array(pg_temp.t_label(s, 61),
        pg_temp.t_label(s, 62), pg_temp.t_label(s, 63)),
        jsonb_build_array(
            jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163'), pg_temp.t_group_el('Alpha', '0066FF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF'))));
    PERFORM pg_temp.t_absent('X04', s, ARRAY['Beta', 'Delta', 'B group', 'Gone'], ARRAY['7C5CFF', 'CC00CC', '00AA00', 'AA0000']);
    PERFORM pg_temp.t_expect('X04', 'answers with Alpha''s id in upper case (export ids removed)',
        pg_temp.t_canon(pg_temp.t_snapshot(pg_temp.t_x('G04u')), '{nExportid,nEDid}'), pg_temp.t_canon(s, '{nExportid,nEDid}'));
    RAISE NOTICE 'PASS X04 group Alpha: private-only 62 and 63 get Alpha''s colour 0066FF and label "Alpha" (63''s later, unticked Beta is never named); an upper-case id selects the same';
END $t$;

-- ------------------------------------------------------------------------------------------------ X05 (another user's Mark)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G05a')); s2 jsonb := pg_temp.t_snapshot(pg_temp.t_x('G05b'));
BEGIN
    -- A ticks Alpha and B's group id: B's 91 (in B's group) passes only as an Unassigned Team Mark.
    PERFORM pg_temp.t_expect('X05', 'burned', pg_temp.t_burned(s->'get'), pg_temp.t_ids(ARRAY[61, 62, 63, 64, 68, 91]));
    PERFORM pg_temp.t_expect('X05', 'appearances and colour of 91', jsonb_build_array(pg_temp.t_hl_count(s->'get', 91),
        pg_temp.t_burn_colour(s->'get', 91), pg_temp.t_label(s, 91)),
        jsonb_build_array(1, 'ffff00', jsonb_build_array(pg_temp.t_issue_el(31, 'Unassigned', 'ffff00'))));
    PERFORM pg_temp.t_absent('X05', s, ARRAY['B group'], ARRAY['00AA00']);
    -- B's group alone with bQFTeam false selects no QFact; the index of A's export asked by B colours nothing.
    PERFORM pg_temp.t_expect('X05', 'B''s group only: burned QFacts', pg_temp.t_burned(s2->'get', 'QF'), '[]');
    PERFORM pg_temp.t_absent('X05', s2, ARRAY['B group'], ARRAY['00AA00']);
    PERFORM pg_temp.t_expect('X05', 'index of A''s export asked by B', pg_temp.t_canon(pg_temp.t_index(pg_temp.t_x('G05a'), 2)),
        pg_temp.t_canon((SELECT index_rows FROM c_before_db)));
    RAISE NOTICE 'PASS X05 B''s Mark 91 in B''s group is never selected through a group (A''s Alpha or B''s id ticked); it passes only as Unassigned, ffff00; B''s group name and colour appear nowhere';
END $t$;

-- ------------------------------------------------------------------------------------------------ X06 (bQFTeam false)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G04')); s6 jsonb := pg_temp.t_snapshot(pg_temp.t_x('G06'));
    was jsonb := (SELECT no_filter_snap FROM c_before_db);
BEGIN
    PERFORM pg_temp.t_expect('X06', 'Alpha: burned QFacts', pg_temp.t_burned(s->'get', 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63]));
    PERFORM pg_temp.t_expect('X06', 'Alpha: preview QFacts', pg_temp.t_list_ids(s->'preview'->'factlinks', 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63]));
    -- Facts have no group ticked: exactly the Facts of the export with no filter.
    PERFORM pg_temp.t_expect('X06', 'Alpha: Fact highlights', pg_temp.t_hl(s->'get', 'F'), pg_temp.t_hl(was->'get', 'F'));
    PERFORM pg_temp.t_expect('X06', 'Alpha: Fact preview rows', pg_temp.t_links(s->'preview'->'factlinks', 'F'),
        pg_temp.t_links(was->'preview'->'factlinks', 'F'));
    PERFORM pg_temp.t_expect('X06', 'Beta: burned QFacts', pg_temp.t_burned(s6->'get', 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63, 69]));
    PERFORM pg_temp.t_expect('X06', 'Beta: preview QFacts', pg_temp.t_list_ids(s6->'preview'->'factlinks', 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63, 69]));
    PERFORM pg_temp.t_expect('X06', 'Beta: colours of 61, 62, 63, 69', jsonb_build_array(pg_temp.t_colours(s6, 61),
        pg_temp.t_colours(s6, 62), pg_temp.t_colours(s6, 63), pg_temp.t_colours(s6, 69)),
        '[["ff9163", "ff9163", "ff9163"], ["7C5CFF", "7C5CFF", "7C5CFF"], ["7C5CFF", "7C5CFF", "7C5CFF"], ["7C5CFF", "7C5CFF", "7C5CFF"]]');
    PERFORM pg_temp.t_expect('X06', 'Beta: index label of 61', pg_temp.t_label(s6, 61),
        jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163'), pg_temp.t_group_el('Beta', '7C5CFF')));
    RAISE NOTICE 'PASS X06 bQFTeam false: Alpha gives only Alpha''s QFacts 61, 62, 63, Beta only Beta''s 61, 62, 63, 69 (64, 66, 68, 91 out); Facts as with no filter';
END $t$;

-- ------------------------------------------------------------------------------------------------ X07 (deleted / unknown ids)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G07'));
BEGIN
    PERFORM pg_temp.t_expect('X07', 'burned, allfacts, preview', jsonb_build_array(pg_temp.t_burned(s->'get'),
        pg_temp.t_allfacts(s->'get'), pg_temp.t_list_ids(s->'preview'->'factlinks')), '[[], [], []]');
    PERFORM pg_temp.t_absent('X07', s, ARRAY['Gone', 'Alpha', 'Beta'], ARRAY['AA0000', '0066FF', '7C5CFF']);
    PERFORM pg_temp.t_expect('X07', 'index rows', pg_temp.t_canon(s->'index'), pg_temp.t_canon((SELECT index_rows FROM c_before_db)));
    RAISE NOTICE 'PASS X07 a deleted group id and an unknown id (flags false): no Fact / QFact row, no error, no group named (68''s membership in the deleted group selects nothing)';
END $t$;

-- ------------------------------------------------------------------------------------------------ X09 (Team Issue, bFTeam false)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G09')); was jsonb := (SELECT no_filter_snap FROM c_before_db);
BEGIN
    PERFORM pg_temp.t_expect('X09', 'burned Facts', pg_temp.t_burned(s->'get', 'F'), pg_temp.t_ids(ARRAY[65, 67]));
    PERFORM pg_temp.t_expect('X09', 'preview Facts', pg_temp.t_list_ids(s->'preview'->'factlinks', 'F'), pg_temp.t_ids(ARRAY[65, 67]));
    PERFORM pg_temp.t_expect('X09', 'colours of 65, 67', jsonb_build_array(pg_temp.t_colours(s, 65), pg_temp.t_colours(s, 67)),
        '[["ff9163", "ff9163", "ff9163"], ["0066FF", "0066FF", "0066FF"]]');
    PERFORM pg_temp.t_expect('X09', 'index labels of 65, 67', jsonb_build_array(pg_temp.t_label(s, 65), pg_temp.t_label(s, 67)),
        jsonb_build_array(
            jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163'), pg_temp.t_group_el('Alpha', '0066FF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF'))));
    -- QFacts have no group ticked: exactly the QFacts of the export with no filter.
    PERFORM pg_temp.t_expect('X09', 'QFact highlights', pg_temp.t_hl(s->'get', 'QF'), pg_temp.t_hl(was->'get', 'QF'));
    RAISE NOTICE 'PASS X09 Fact group Alpha, bFTeam false: 65 (Liability, in Alpha) passes through Alpha with its Team colour ff9163 and labels Liability + Alpha; 67 gets 0066FF; 70 out; QFacts as with no filter';
END $t$;

-- ------------------------------------------------------------------------------------------------ X12 (2026-11-13b rule kept)
DO $t$
DECLARE a jsonb := pg_temp.t_get(pg_temp.t_x('G12a')); b jsonb := pg_temp.t_get(pg_temp.t_x('G12b'));
    c jsonb := pg_temp.t_get(pg_temp.t_x('G12c'));
BEGIN
    -- Groups ticked for QFacts (Delta, which holds no Mark): the private-only 62, 63, 69 (their groups unticked) pass
    -- neither as Unassigned, nor by Contact 51 (69), nor as "all Team Issues"; the mixed 61 is a Team Mark.
    PERFORM pg_temp.t_expect('X12', 'Unassigned and Delta: burned', pg_temp.t_burned(a), pg_temp.t_ids(ARRAY[64, 68, 91]));
    PERFORM pg_temp.t_expect('X12', 'Delta, all Team Issues: burned QFacts', pg_temp.t_burned(b, 'QF'), pg_temp.t_ids(ARRAY[61, 64, 66, 68, 91]));
    PERFORM pg_temp.t_expect('X12', 'Delta, all Team Issues: burned Facts', pg_temp.t_burned(b, 'F'), pg_temp.t_ids(ARRAY[65, 67, 70]));
    PERFORM pg_temp.t_expect('X12', 'Contact 51 and Delta: burned', pg_temp.t_burned(c), pg_temp.t_ids(ARRAY[64]));
    RAISE NOTICE 'PASS X12 with groups ticked for QFacts, a private-only Mark whose groups are not ticked passes neither through Unassigned, nor a Contact, nor "all Team Issues"; a Mark with a Team Issue still does';
END $t$;

-- ------------------------------------------------------------------------------------------------ X08 (the down)
\ir 2026-11-14b_export_private_issues_mixed.down.sql

DO $t$
DECLARE b record; snap_now jsonb;
BEGIN
    PERFORM pg_temp.t_expect('X08', 'bodies and helpers after the down (the 2026-11-13b state)', pg_temp.t_norms(), pg_temp.t_13b_norms());
    PERFORM pg_temp.t_expect('X08', 'md5(prosrc) of the three bodies after the down', jsonb_build_array(pg_temp.t_fn_md5('et_export_get_data_1'),
        pg_temp.t_fn_md5('et_preview_document_list_1'), pg_temp.t_fn_md5('et_annotation_index_rows')),
        (SELECT jsonb_build_array(get_md5, preview_md5, index_md5) FROM c_13b));
    FOR b IN SELECT * FROM c_before ORDER BY name LOOP
        snap_now := pg_temp.t_snapshot(b.x);
        IF md5(pg_temp.t_canon(snap_now)::text) IS DISTINCT FROM b.snap_md5 THEN
            RAISE EXCEPTION 'FAIL X08 export "%" after the down: before %, after %', b.name, pg_temp.t_canon(b.snap), pg_temp.t_canon(snap_now);
        END IF;
    END LOOP;
    PERFORM pg_temp.t_expect('X08', 'index called without nMasterid / nExportid', pg_temp.t_canon(pg_temp.t_index_plain()),
        pg_temp.t_canon((SELECT index_plain FROM c_before_db)));
    FOR b IN SELECT * FROM c_red ORDER BY name LOOP
        PERFORM pg_temp.t_expect('X08', 'group export "' || b.name || '" answers as under 2026-11-13b',
            pg_temp.t_canon(pg_temp.t_snapshot(b.x)), pg_temp.t_canon(b.snap));
    END LOOP;
    RAISE NOTICE 'PASS X08 down: the three 2026-11-13b bodies restored verbatim, the new helper gone, et_export_private_group kept; the X01 answers and two group exports equal to before the up';
END $t$;

\echo 'PASS all 13 checks'
