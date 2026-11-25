-- 2026-11-15_export_private_groups_ticked_only.test.sql
--
-- Scratch-database test of 2026-11-15_export_private_groups_ticked_only.up.sql (the Reader export selects through
-- ticked Private Analysis Groups only, and lists each ticked group as its own "issuelist" element) and of its rollback
-- 2026-11-15_export_private_groups_ticked_only.down.sql. It keeps every check of
-- 2026-11-14b_export_private_issues_mixed.test.sql that still holds (X01-X09, X11; X03-X05 and X09 with the new
-- per-group elements, X05 with 69 now passing as Unassigned) and adds:
--   X12 rewritten (owner decision 3, review finding I1): a private-only Mark none of whose groups is ticked is treated
--       as a Mark with no group: with Unassigned and the empty group Delta ticked it passes as Unassigned, with
--       "all Team Issues" it passes, with Contact 51 it passes through the Contact;
--   X14 the owner's case: group Alpha and Unassigned ticked for QFacts; QFact 69 (Unassigned, only in the unticked
--       Beta) is exported as Unassigned, with its stored colour and Issue label; Beta's name and colour appear nowhere;
--       the same for a Full Fact (67, only in Alpha) with Unassigned and Delta ticked for Facts;
--   X15 a Mark whose groups are not ticked passes or fails exactly as a Mark with no group, in every export that does
--       not tick its group (69, in Beta, against 64, no group: both QF Unassigned with Contact 51);
--   X16 bQFTeam false with a Mark whose groups are not ticked: excluded even when Unassigned is ticked;
--   X17 "issuelist": one element per ticked group, in the group-list order, each with bPrivate true and its own colour;
--       the Issue elements unchanged (no bPrivate key); another user's Mark never gets a group element;
--   X18 M4: with two ticked memberships added in the same microsecond, the burned colour is the larger group id's
--       ("dCreateDt" DESC, "nGroupid" DESC); under 2026-11-14b it was the smaller one's;
--   X13 after the down, the up script runs again and gives the same bodies and answers (round trip);
--   X10 the up script refuses (drift) while 2026-11-14b is not applied, and changes nothing;
--   X00 the fixture and the defects under the 2026-11-14b bodies (I1 in X14's exports, the joined label, the tie).
--
-- NOT RUN ON ANY SHARED DATABASE. Running it needs a new scratch database (see below).
--
-- Where it may run
-- ----------------
--   * ONLY in a NEW, EMPTY database whose name starts with etabella_scratch (for example etabella_scratch_pg_20261115).
--     It refuses any other database, and it refuses a database that already has a "FactMaster" table.
--   * ON_ERROR_STOP is switched on by the script itself, so the first refusal or failure ends the run. The one
--     exception is X10: it runs the up script once before 2026-11-14b_export_private_issues_mixed.up.sql is loaded,
--     with ON_ERROR_STOP off, so psql prints the script's refusal and "current transaction is aborted" errors there.
--     Those ERROR lines are expected; the check after them decides.
--
-- What it writes (only in that scratch database)
-- ----------------------------------------------
--   * The fixture of 2026-11-14b_export_private_issues_mixed.test.sql, unchanged (the 27 minimal stand-in relations;
--     "FactMaster" has no "nCreateId" and "BundleDetail" has one, as there).
--   * Loads from this folder, in order: 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql,
--     2026-11-12b_private_groups_unassigned_only.up.sql, 2026-11-13_private_group_colour.up.sql, the July bodies
--     2026-07-08_export_team_marks.up.sql, 2026-07-08_index_sp_page_color.up.sql and
--     2026-07-20_annotation_index_team_marks.up.sql, 2026-11-13b_export_private_groups.up.sql,
--     2026-11-14_private_issue_claim_multi.up.sql, the script under test once (refused: X10),
--     2026-11-14b_export_private_issues_mixed.up.sql, the script under test (a run and a second run), its rollback,
--     and the script under test once more (X13). The database ends with the script under test applied.
--   * Fixture writes besides the loaded scripts: the memberships of 2026-11-14b's test (inserted directly with explicit
--     "dCreateDt" values), group 44 marked deleted directly, and in X18 (and its X00 part) the two memberships of
--     Mark 62 set to one "dCreateDt" and put back afterwards.
--   * Fixture ids are c0000000-0000-4000-8000-0000000000NN. Nothing is rolled back: the loaded scripts commit
--     themselves. Throw the scratch database away afterwards (a separate approval).
--
-- How results are compared
-- ------------------------
-- As in 2026-11-14b's test: md5 of a canonical form (pg_temp.t_canon: arrays sorted by their elements' text,
-- recursively; "dExportdt" and named keys dropped); function bodies as the drift guards hash them (pg_temp.t_norm), which
-- also proves the hash constants written in the up and down scripts, and as md5(prosrc) with CR removed.
--
-- NOT COVERED BY THIS TEST:
--   * The real "annotations" view and the real column types of the 27 stand-ins (see 2026-11-13b's test).
--   * The drift guard refusing a changed body other than in X10, and the down script's refusal branch.
--   * The Python burner and the PDF itself (the colour reaches the burner as highlights[].color, which is checked; the
--     pills are the export app's, covered by its Jest specs).
--   * Two sessions at once, production volumes and plans.
--
-- Needs: psql (the script uses \set, \ir and \echo), PostgreSQL 13 or later (gen_random_uuid), and
-- 2026-10-09_private_fact_groups.up.sql in this folder (that file is not tracked by git).
--
-- Run (after reading it, with the owner's approval):
--   psql -h <host> -U <user> -d etabella_scratch_pg_<date> -v ON_ERROR_STOP=1 -f 2026-11-15_export_private_groups_ticked_only.test.sql
-- Pass: a NOTICE "PASS X.. ..." for each of X00-X18 (in the order X10, X00, X11, X01-X07, X09, X12, X14-X18, X08,
-- X13), then "PASS all 19 checks". A failure stops at "FAIL X.. ...".

\set ON_ERROR_STOP on

-- ------------------------------------------------------------------------------------------------ guard
DO $guard$
BEGIN
    IF left(current_database(), 16) <> 'etabella_scratch' THEN
        RAISE EXCEPTION 'export_private_groups_ticked_only test: refusing to run on database % (only a database whose name starts with etabella_scratch)', current_database();
    END IF;
    IF to_regclass('public."FactMaster"') IS NOT NULL THEN
        RAISE EXCEPTION 'export_private_groups_ticked_only test: database % already has "FactMaster"; use a new, empty scratch database', current_database();
    END IF;
END
$guard$;

-- ------------------------------------------------------------------------------------------------ fixtures
-- As 2026-11-14b's test. Ids: pg_temp.tid(n) = c0000000-0000-4000-8000-<n as 12 digits>.
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
-- Their guard accepts the database named in etabella.expected_database. Name the scratch database only.
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

\ir 2026-07-08_export_team_marks.up.sql
\ir 2026-07-08_index_sp_page_color.up.sql
\ir 2026-07-20_annotation_index_team_marks.up.sql

-- ------------------------------------------------------------------------------------------------ helpers
-- (As 2026-11-14b's test, plus t_in, t_group_el with bPrivate, t_tie_colours and the 2026-11-14b / 2026-11-15 states.)
CREATE FUNCTION pg_temp.t_ids(ns integer[]) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT COALESCE(jsonb_agg(pg_temp.tid(n)::text ORDER BY pg_temp.tid(n)::text), '[]'::jsonb) FROM unnest(ns) n $f$;

CREATE FUNCTION pg_temp.t_expect(check_name text, what text, got jsonb, want jsonb) RETURNS void
LANGUAGE plpgsql AS $f$
BEGIN
    IF got IS DISTINCT FROM want THEN
        RAISE EXCEPTION 'FAIL % %: got %, expected %', check_name, what, got, want;
    END IF;
END $f$;

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
CREATE FUNCTION pg_temp.t_index_plain() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_rows('et_annotation_index_rows', jsonb_build_object(
        'jFactIds', pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]), 'jDocIds', pg_temp.t_ids(ARRAY[71]))) -> 0 $f$;

CREATE FUNCTION pg_temp.t_burned(g jsonb, typ text DEFAULT NULL) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(DISTINCT h->>'nFSid' ORDER BY h->>'nFSid'), '[]'::jsonb)
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'linktype' IN ('F', 'QF') AND (typ IS NULL OR h->>'linktype' = typ) $f$;
CREATE FUNCTION pg_temp.t_allfacts(g jsonb) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(DISTINCT a ORDER BY a), '[]'::jsonb)
    FROM jsonb_array_elements(g) r, jsonb_array_elements_text(r->'allfacts') a $f$;
CREATE FUNCTION pg_temp.t_hl(g jsonb, typ text) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_canon(COALESCE(jsonb_agg(h), '[]'::jsonb))
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'linktype' = typ $f$;
CREATE FUNCTION pg_temp.t_list_ids(list jsonb, typ text DEFAULT NULL) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT COALESCE(jsonb_agg(e->>'nFSid' ORDER BY e->>'nFSid'), '[]'::jsonb) FROM jsonb_array_elements(list) e
    WHERE typ IS NULL OR e->>'cFType' = typ $f$;
CREATE FUNCTION pg_temp.t_links(list jsonb, typ text) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_canon(COALESCE(jsonb_agg(e), '[]'::jsonb)) FROM jsonb_array_elements(list) e WHERE e->>'cFType' = typ $f$;
CREATE FUNCTION pg_temp.t_burn_colour(g jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT to_jsonb(string_agg(DISTINCT h->>'color', ','))
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'nFSid' = pg_temp.tid(n)::text $f$;
CREATE FUNCTION pg_temp.t_row(list jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT e FROM jsonb_array_elements(list) e WHERE e->>'nFSid' = pg_temp.tid(n)::text LIMIT 1 $f$;
CREATE FUNCTION pg_temp.t_hl_count(g jsonb, n integer) RETURNS integer LANGUAGE sql AS
$f$ SELECT count(*)::integer
    FROM jsonb_array_elements(g) r,
         jsonb_array_elements(CASE WHEN jsonb_typeof(r->'highlights') = 'array' THEN r->'highlights' ELSE '[]'::jsonb END) h
    WHERE h->>'nFSid' = pg_temp.tid(n)::text $f$;
CREATE FUNCTION pg_temp.t_row_count(list jsonb, n integer) RETURNS integer LANGUAGE sql AS
$f$ SELECT count(*)::integer FROM jsonb_array_elements(COALESCE(list, '[]'::jsonb)) e WHERE e->>'nFSid' = pg_temp.tid(n)::text $f$;
CREATE FUNCTION pg_temp.t_counts(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_array(pg_temp.t_hl_count(s->'get', n), pg_temp.t_row_count(s->'preview'->'factlinks', n),
        pg_temp.t_row_count(s->'index'->'factlinks', n)) $f$;
CREATE FUNCTION pg_temp.t_colours(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_array(pg_temp.t_burn_colour(s->'get', n), pg_temp.t_row(s->'preview'->'factlinks', n)->'cColor',
        pg_temp.t_row(s->'index'->'factlinks', n)->'cColor') $f$;
-- Whether Mark n is exported by a snapshot: [burned, in allfacts, in the preview rows].
CREATE FUNCTION pg_temp.t_in(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_array(pg_temp.t_hl_count(s->'get', n) > 0, pg_temp.t_allfacts(s->'get') ? pg_temp.tid(n)::text,
        pg_temp.t_row_count(s->'preview'->'factlinks', n) > 0) $f$;
-- Index "issuelist" elements: an Issue (as et_annotation_index_rows builds it, no bPrivate key), a ticked group as
-- 2026-11-15 lists it (bPrivate true) and as 2026-11-14b listed it (joined names, no bPrivate).
CREATE FUNCTION pg_temp.t_issue_el(n integer, name text, colour text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('nIssueid', pg_temp.tid(n), 'cIssue', name, 'cClr', colour) $f$;
CREATE FUNCTION pg_temp.t_group_el(name text, colour text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('nIssueid', NULL, 'cIssue', name, 'cClr', colour, 'bPrivate', true) $f$;
CREATE FUNCTION pg_temp.t_group_el_14b(name text, colour text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('nIssueid', NULL, 'cIssue', name, 'cClr', colour) $f$;
CREATE FUNCTION pg_temp.t_label(s jsonb, n integer) RETURNS jsonb LANGUAGE sql AS
$f$ SELECT pg_temp.t_row(s->'index'->'factlinks', n)->'issuelist' $f$;
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
-- M4: Mark 62's two memberships (Beta 42, then Alpha 41 1 microsecond later) set to ONE "dCreateDt"; the colours of 62
-- in export x; then the two original stamps put back.
CREATE FUNCTION pg_temp.t_tie_colours(x uuid) RETURNS jsonb
LANGUAGE plpgsql AS $f$
DECLARE result jsonb;
BEGIN
    UPDATE public."FactPrivateGroup" SET "dCreateDt" = timestamptz '2026-11-14 10:00:00+00' WHERE "nFSid" = pg_temp.tid(62);
    result := pg_temp.t_colours(pg_temp.t_snapshot(x), 62);
    UPDATE public."FactPrivateGroup" SET "dCreateDt" = timestamptz '2026-11-14 10:00:00+00'
        + (CASE WHEN "nGroupid" = pg_temp.tid(41) THEN 1 ELSE 0 END) * interval '1 microsecond'
    WHERE "nFSid" = pg_temp.tid(62);
    RETURN result;
END $f$;

CREATE FUNCTION pg_temp.t_norm(sig text) RETURNS text LANGUAGE sql AS
$f$ SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc WHERE oid = to_regprocedure(sig) $f$;
CREATE FUNCTION pg_temp.t_norms() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_build_object(
    'insert', pg_temp.t_norm('public.et_export_insert_data_1(json,refcursor)'),
    'get', pg_temp.t_norm('public.et_export_get_data_1(json,refcursor)'),
    'preview', pg_temp.t_norm('public.et_preview_document_list_1(json,refcursor)'),
    'index', pg_temp.t_norm('public.et_annotation_index_rows(json,refcursor)'),
    'old_helper', pg_temp.t_norm('public.et_export_private_group(uuid,uuid,jsonb,jsonb)'),
    'mark', pg_temp.t_norm('public.et_export_private_groups_mark(uuid,uuid,jsonb,jsonb)'),
    'ticked', pg_temp.t_norm('public.et_export_private_groups_ticked(uuid,uuid,jsonb,jsonb)'),
    'team_rule', pg_temp.t_norm('public.et_export_team_rule(text,jsonb,jsonb,boolean,boolean,jsonb,jsonb,jsonb,jsonb)'),
    'nonempty', pg_temp.t_norm('public.et_export_nonempty_array(jsonb)')) $f$;
-- The 2026-11-13b state (before 2026-11-14b): the hashes 2026-11-13b and 2026-11-14b's test document.
CREATE FUNCTION pg_temp.t_13b_norms() RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT jsonb_build_object('insert', 'c709859c0771bb7ffd67cb69743f0f68', 'get', '4e153224b2e1927c0814afd5937f725c',
    'preview', '717ffc7a38a6285b45353a096bc0c931', 'index', 'd960718d865d3c928dad4725b7fb7fa6',
    'old_helper', 'da6f80d67bdd12996c8baf8c059b8955', 'mark', NULL, 'ticked', NULL,
    'team_rule', '9a3c937a112f46a36c00aab7dba6085c', 'nonempty', 'edd66f294d7497718e63d9bb0dab7f9e') $f$;
-- The 2026-11-14b state (live on 2026-11-13): its own four hashes, written in its drift guard.
CREATE FUNCTION pg_temp.t_14b_norms() RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT pg_temp.t_13b_norms() || jsonb_build_object('get', 'fa3f9ddcdaa972a223625e060a87684e',
    'preview', '83e6f1bebf65216106dc8509732661fb', 'index', '0b28d7598121e6ac4f84811251607f88',
    'mark', 'ec2d72152aacff217a94ee587f62e792') $f$;
-- The state after the script under test: its own four hashes (written in its drift guard), the rest unchanged.
CREATE FUNCTION pg_temp.t_mine_norms() RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$f$ SELECT pg_temp.t_14b_norms() || jsonb_build_object('get', '1a934edbc4906ab5c912ca0575da833c',
    'preview', '7e7744b2b6c2cf816b6a98b6e82be3f4', 'index', '76380882d387dcd967d284972cb0be17',
    'ticked', '0dee20b9cebf3f3869c015a141c0b7a9') $f$;
CREATE FUNCTION pg_temp.t_fn_md5(fn text) RETURNS text LANGUAGE sql AS
$f$ SELECT md5(replace(prosrc, E'\r', '')) FROM pg_proc WHERE proname = fn AND pronamespace = 'public'::regnamespace $f$;
CREATE FUNCTION pg_temp.t_fns() RETURNS jsonb LANGUAGE sql AS
$f$ SELECT jsonb_object_agg(proname, md5(replace(prosrc, E'\r', ''))) FROM pg_proc WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('et_export_insert_data_1', 'et_export_get_data_1', 'et_preview_document_list_1', 'et_annotation_index_rows',
                    'et_export_nonempty_array', 'et_export_private_group', 'et_export_team_rule',
                    'et_export_private_groups_mark', 'et_export_private_groups_ticked') $f$;

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

-- ------------------------------------------------------------------------------------------------ 2026-11-13b, 2026-11-14
\ir 2026-11-13b_export_private_groups.up.sql
\ir 2026-11-14_private_issue_claim_multi.up.sql

-- 2026-11-14's guard allows a group beside a Team Issue and several groups per Mark. 44 is deleted afterwards.
INSERT INTO public."FactPrivateGroup"("nFSid", "nGroupid", "dCreateDt")
SELECT pg_temp.tid(v.m), pg_temp.tid(v.g), timestamptz '2026-11-14 10:00:00+00' + v.k * interval '1 microsecond'
FROM (VALUES (61, 41, 0), (61, 42, 1), (62, 42, 0), (62, 41, 1), (63, 41, 0), (63, 42, 1), (65, 41, 0), (67, 41, 0),
             (68, 44, 0), (69, 42, 0), (91, 43, 0)) AS v(m, g, k);
UPDATE public."PrivateFactGroup" SET "dDeletedDt" = now() WHERE "nGroupid" = pg_temp.tid(44);

-- ------------------------------------------------------------------------------------------------ X10 (no 2026-11-14b yet)
-- The live bodies are the 2026-11-13b ones: the drift guard must refuse before anything is changed. ON_ERROR_STOP is
-- off for that one run only.
DO $t$
BEGIN
    PERFORM pg_temp.t_expect('X10', 'bodies and helpers before the run (the 2026-11-13b state)', pg_temp.t_norms(), pg_temp.t_13b_norms());
END $t$;

\echo 'X10: the up script runs once before 2026-11-14b_export_private_issues_mixed.up.sql; the ERROR lines up to the next PASS are expected'
\set ON_ERROR_STOP off
\ir 2026-11-15_export_private_groups_ticked_only.up.sql
\set ON_ERROR_STOP on

DO $t$
BEGIN
    PERFORM pg_temp.t_expect('X10', 'bodies and helpers after the refused run', pg_temp.t_norms(), pg_temp.t_13b_norms());
    RAISE NOTICE 'PASS X10 without 2026-11-14b the up script changed nothing (drift refused; no new helper, the 2026-11-13b bodies kept)';
END $t$;

-- ------------------------------------------------------------------------------------------------ 2026-11-14b (live today)
\ir 2026-11-14b_export_private_issues_mixed.up.sql

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
        'jQFGroup', pg_temp.t_ids(ARRAY[45]))), 'group'),
    ('G14a QFact Unassigned and group Alpha', pg_temp.t_insert(jsonb_build_object('jQFIssue', pg_temp.t_ids(ARRAY[31]),
        'jQFGroup', pg_temp.t_ids(ARRAY[41]))), 'group'),
    ('G14b Fact Unassigned and group Delta', pg_temp.t_insert(jsonb_build_object('jFIssue', pg_temp.t_ids(ARRAY[31]),
        'jFGroup', pg_temp.t_ids(ARRAY[45]))), 'group'),
    ('G16 QFact Unassigned and group Delta, bQFTeam false', pg_temp.t_insert(jsonb_build_object(
        'jQFIssue', pg_temp.t_ids(ARRAY[31]), 'jQFGroup', pg_temp.t_ids(ARRAY[45]), 'bQFTeam', false)), 'group');

-- ------------------------------------------------------------------------------------------------ baseline (2026-11-14b)
CREATE TEMP TABLE c_before AS
SELECT e.name, e.x, s.snap, md5(pg_temp.t_canon(s.snap)::text) AS snap_md5
FROM c_exports e CROSS JOIN LATERAL (SELECT pg_temp.t_snapshot(e.x) AS snap) s
WHERE e.kind IN ('old', 'nogroup');
CREATE TEMP TABLE c_before_db AS SELECT pg_temp.t_index_plain() AS index_plain, pg_temp.t_index(NULL, 1) AS index_rows,
    (SELECT snap FROM c_before WHERE name LIKE 'N3 %') AS no_filter_snap;
-- Every group export under the 2026-11-14b bodies (X00), compared again after the down (X08).
CREATE TEMP TABLE c_red AS
SELECT e.name, e.x, pg_temp.t_snapshot(e.x) AS snap FROM c_exports e WHERE e.kind = 'group';
CREATE TEMP TABLE c_14b AS SELECT pg_temp.t_norms() AS norms, pg_temp.t_fn_md5('et_export_get_data_1') AS get_md5,
    pg_temp.t_fn_md5('et_preview_document_list_1') AS preview_md5, pg_temp.t_fn_md5('et_annotation_index_rows') AS index_md5,
    pg_temp.t_tie_colours(pg_temp.t_x('G03')) AS tie_colours;

-- ------------------------------------------------------------------------------------------------ X00 (fixture, 2026-11-14b)
DO $t$
DECLARE s14a jsonb := (SELECT snap FROM c_red WHERE name LIKE 'G14a %'); s14b jsonb := (SELECT snap FROM c_red WHERE name LIKE 'G14b %');
    s03 jsonb := (SELECT snap FROM c_red WHERE name LIKE 'G03 %');
BEGIN
    PERFORM pg_temp.t_expect('X00', 'memberships', to_jsonb((SELECT count(*) FROM public."FactPrivateGroup")), '11');
    PERFORM pg_temp.t_expect('X00', 'groups of 62, oldest first', (SELECT jsonb_agg("nGroupid"::text ORDER BY "dCreateDt")
        FROM public."FactPrivateGroup" WHERE "nFSid" = pg_temp.tid(62)), jsonb_build_array(pg_temp.tid(42)::text, pg_temp.tid(41)::text));
    PERFORM pg_temp.t_expect('X00', 'bodies under 2026-11-14b', (SELECT norms FROM c_14b), pg_temp.t_14b_norms());
    PERFORM pg_temp.t_expect('X00', 'no filter: burned', pg_temp.t_burned((SELECT no_filter_snap FROM c_before_db)->'get'),
        pg_temp.t_ids(ARRAY[61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91]));
    -- I1: with Alpha and Unassigned ticked for QFacts, 69 (Unassigned, only in the unticked Beta) is dropped ...
    PERFORM pg_temp.t_expect('X00', '2026-11-14b, Unassigned and Alpha: burned', pg_temp.t_burned(s14a->'get'),
        pg_temp.t_ids(ARRAY[61, 62, 63, 64, 68, 91]));
    -- ... and with Unassigned and Delta ticked for Facts, 67 (Unassigned, only in the unticked Alpha) is dropped.
    PERFORM pg_temp.t_expect('X00', '2026-11-14b, Fact Unassigned and Delta: burned Facts', pg_temp.t_burned(s14b->'get', 'F'),
        pg_temp.t_ids(ARRAY[70]));
    -- One joined element for two ticked groups.
    PERFORM pg_temp.t_expect('X00', '2026-11-14b, G03: index label of 62', pg_temp.t_label(s03, 62),
        jsonb_build_array(pg_temp.t_group_el_14b('Alpha, Beta', '0066FF')));
    -- M4: the same-microsecond tie went to the smaller group id (Alpha 41, 0066FF).
    PERFORM pg_temp.t_expect('X00', '2026-11-14b, tie: colours of 62', (SELECT tie_colours FROM c_14b), '["0066FF", "0066FF", "0066FF"]');
    PERFORM pg_temp.t_expect('X00', 'stamps of 62 put back', (SELECT jsonb_agg("nGroupid"::text ORDER BY "dCreateDt")
        FROM public."FactPrivateGroup" WHERE "nFSid" = pg_temp.tid(62)), jsonb_build_array(pg_temp.tid(42)::text, pg_temp.tid(41)::text));
    RAISE NOTICE 'PASS X00 fixture: 11 memberships; under the 2026-11-14b bodies 69 (QF) and 67 (F) in unticked groups are dropped despite the Unassigned tick, two ticked groups are one joined element, and a tie goes to the smaller group id';
END $t$;

-- ------------------------------------------------------------------------------------------------ the up script
\ir 2026-11-15_export_private_groups_ticked_only.up.sql

-- ------------------------------------------------------------------------------------------------ X11 (a second run)
CREATE TEMP TABLE c_first_up AS SELECT pg_temp.t_norms() AS norms, pg_temp.t_fns() AS fns;

\ir 2026-11-15_export_private_groups_ticked_only.up.sql

DO $t$
DECLARE f record;
BEGIN
    SELECT * INTO f FROM c_first_up;
    PERFORM pg_temp.t_expect('X11', 'bodies and helpers after the first run (the hashes written in the drift guard)',
        f.norms, pg_temp.t_mine_norms());
    PERFORM pg_temp.t_expect('X11', 'nine functions after the first run', to_jsonb((SELECT count(*) FROM jsonb_object_keys(f.fns))), '9');
    PERFORM pg_temp.t_expect('X11', 'function sources after the second run', pg_temp.t_fns(), f.fns);
    RAISE NOTICE 'PASS X11 the up script left its own four hashes and the other export functions (2026-11-14b''s helper included) unchanged; a second run is accepted (already applied) and changes nothing';
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
    RAISE NOTICE 'PASS X01 no group arrays (NULL or []): get_data, preview and index answers md5-equal to the 2026-11-14b answers for all 7 exports; the index called without an export too';
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
    PERFORM pg_temp.t_absent('X02', s, ARRAY['Alpha', 'Beta', 'Delta', 'bPrivate'], ARRAY['0066FF', '7C5CFF', 'CC00CC']);
    PERFORM pg_temp.t_expect('X02', 'answers with group Delta also ticked (export ids removed)',
        pg_temp.t_canon(pg_temp.t_snapshot(pg_temp.t_x('G02b')), '{nExportid,nEDid}'), pg_temp.t_canon(s, '{nExportid,nEDid}'));
    RAISE NOTICE 'PASS X02 Liability ticked: 61 (Liability, in Alpha and Beta) listed once in all three functions, Team colour ff9163, no group named; ticking Delta as well changes nothing';
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
            jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163'), pg_temp.t_group_el('Alpha', '0066FF'), pg_temp.t_group_el('Beta', '7C5CFF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF'), pg_temp.t_group_el('Beta', '7C5CFF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF'), pg_temp.t_group_el('Beta', '7C5CFF')),
            jsonb_build_array(pg_temp.t_group_el('Beta', '7C5CFF'))));
    RAISE NOTICE 'PASS X03 Liability and groups Alpha, Beta: 61 (both ticks), 62, 63 (two groups each) one row and one burn in all three functions; burned colour of the most recently added ticked group (62 0066FF, 63 7C5CFF); 61 keeps ff9163';
END $t$;

-- ------------------------------------------------------------------------------------------------ X04 (private-only, one group ticked)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G04'));
BEGIN
    PERFORM pg_temp.t_expect('X04', 'burned QFacts', pg_temp.t_burned(s->'get', 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63]));
    PERFORM pg_temp.t_expect('X04', 'colours of 61, 62, 63', jsonb_build_array(pg_temp.t_colours(s, 61),
        pg_temp.t_colours(s, 62), pg_temp.t_colours(s, 63)),
        '[["ff9163", "ff9163", "ff9163"], ["0066FF", "0066FF", "0066FF"], ["0066FF", "0066FF", "0066FF"]]');
    PERFORM pg_temp.t_expect('X04', 'index labels of 61, 62, 63', jsonb_build_array(pg_temp.t_label(s, 61),
        pg_temp.t_label(s, 62), pg_temp.t_label(s, 63)),
        jsonb_build_array(
            jsonb_build_array(pg_temp.t_issue_el(32, 'Liability', 'ff9163'), pg_temp.t_group_el('Alpha', '0066FF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF')),
            jsonb_build_array(pg_temp.t_group_el('Alpha', '0066FF'))));
    PERFORM pg_temp.t_absent('X04', s, ARRAY['Beta', 'Delta', 'B group', 'Gone'], ARRAY['7C5CFF', 'CC00CC', '00AA00', 'AA0000']);
    PERFORM pg_temp.t_expect('X04', 'answers with Alpha''s id in upper case (export ids removed)',
        pg_temp.t_canon(pg_temp.t_snapshot(pg_temp.t_x('G04u')), '{nExportid,nEDid}'), pg_temp.t_canon(s, '{nExportid,nEDid}'));
    RAISE NOTICE 'PASS X04 group Alpha: private-only 62 and 63 get Alpha''s colour 0066FF and the element "Alpha" (63''s later, unticked Beta is never named); an upper-case id selects the same';
END $t$;

-- ------------------------------------------------------------------------------------------------ X05 (another user's Mark)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G05a')); s2 jsonb := pg_temp.t_snapshot(pg_temp.t_x('G05b'));
BEGIN
    -- A ticks Unassigned, Alpha and B's group id: B's 91 (in B's group) passes only as an Unassigned Team Mark. 69 (in
    -- the unticked Beta) now passes as Unassigned too (I1).
    PERFORM pg_temp.t_expect('X05', 'burned', pg_temp.t_burned(s->'get'), pg_temp.t_ids(ARRAY[61, 62, 63, 64, 68, 69, 91]));
    PERFORM pg_temp.t_expect('X05', 'appearances and colour of 91', jsonb_build_array(pg_temp.t_hl_count(s->'get', 91),
        pg_temp.t_burn_colour(s->'get', 91), pg_temp.t_label(s, 91)),
        jsonb_build_array(1, 'ffff00', jsonb_build_array(pg_temp.t_issue_el(31, 'Unassigned', 'ffff00'))));
    PERFORM pg_temp.t_absent('X05', s, ARRAY['B group'], ARRAY['00AA00']);
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
    RAISE NOTICE 'PASS X06 bQFTeam false: Alpha gives only Alpha''s QFacts 61, 62, 63 (69, in the unticked Beta, out), Beta only Beta''s 61, 62, 63, 69 (64, 66, 68, 91 out); Facts as with no filter';
END $t$;

-- ------------------------------------------------------------------------------------------------ X07 (deleted / unknown ids)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G07'));
BEGIN
    PERFORM pg_temp.t_expect('X07', 'burned, allfacts, preview', jsonb_build_array(pg_temp.t_burned(s->'get'),
        pg_temp.t_allfacts(s->'get'), pg_temp.t_list_ids(s->'preview'->'factlinks')), '[[], [], []]');
    PERFORM pg_temp.t_absent('X07', s, ARRAY['Gone', 'Alpha', 'Beta'], ARRAY['AA0000', '0066FF', '7C5CFF']);
    PERFORM pg_temp.t_expect('X07', 'index rows', pg_temp.t_canon(s->'index'), pg_temp.t_canon((SELECT index_rows FROM c_before_db)));
    RAISE NOTICE 'PASS X07 a deleted group id and an unknown id (flags false): no Fact / QFact row, no error, no group named';
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
    PERFORM pg_temp.t_expect('X09', 'QFact highlights', pg_temp.t_hl(s->'get', 'QF'), pg_temp.t_hl(was->'get', 'QF'));
    RAISE NOTICE 'PASS X09 Fact group Alpha, bFTeam false: 65 (Liability, in Alpha) passes through Alpha with its Team colour ff9163 and elements Liability + Alpha; 67 gets 0066FF; 70 out; QFacts as with no filter';
END $t$;

-- ------------------------------------------------------------------------------------------------ X12 (rewritten: ticked groups only)
DO $t$
DECLARE a jsonb := pg_temp.t_get(pg_temp.t_x('G12a')); b jsonb := pg_temp.t_get(pg_temp.t_x('G12b'));
    c jsonb := pg_temp.t_get(pg_temp.t_x('G12c'));
BEGIN
    -- Groups ticked for QFacts (Delta, which holds no Mark): the private-only 62, 63, 69 (their groups unticked) are
    -- Marks with no group now: they pass as Unassigned, by Contact 51 (69, as 64) and as "all Team Issues".
    PERFORM pg_temp.t_expect('X12', 'Unassigned and Delta: burned', pg_temp.t_burned(a), pg_temp.t_ids(ARRAY[62, 63, 64, 68, 69, 91]));
    PERFORM pg_temp.t_expect('X12', 'Delta, all Team Issues: burned QFacts', pg_temp.t_burned(b, 'QF'), pg_temp.t_ids(ARRAY[61, 62, 63, 64, 66, 68, 69, 91]));
    PERFORM pg_temp.t_expect('X12', 'Delta, all Team Issues: burned Facts', pg_temp.t_burned(b, 'F'), pg_temp.t_ids(ARRAY[65, 67, 70]));
    PERFORM pg_temp.t_expect('X12', 'Contact 51 and Delta: burned', pg_temp.t_burned(c), pg_temp.t_ids(ARRAY[64, 69]));
    PERFORM pg_temp.t_expect('X12', 'Unassigned and Delta: colours of 62, 63, 69 (stored, not a group''s)',
        jsonb_build_array(pg_temp.t_burn_colour(a, 62), pg_temp.t_burn_colour(a, 63), pg_temp.t_burn_colour(a, 69)), '["ffff00", "ffff00", "ffff00"]');
    RAISE NOTICE 'PASS X12 with only Delta ticked for QFacts, a private-only Mark whose groups are not ticked passes as a Mark with no group: through Unassigned, Contact 51 and "all Team Issues", in its stored colour';
END $t$;

-- ------------------------------------------------------------------------------------------------ X14 (the owner's case)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G14a')); f jsonb := pg_temp.t_snapshot(pg_temp.t_x('G14b'));
BEGIN
    PERFORM pg_temp.t_expect('X14', 'Alpha and Unassigned: burned', pg_temp.t_burned(s->'get'), pg_temp.t_ids(ARRAY[61, 62, 63, 64, 68, 69, 91]));
    PERFORM pg_temp.t_expect('X14', 'Alpha and Unassigned: preview', pg_temp.t_list_ids(s->'preview'->'factlinks'), pg_temp.t_ids(ARRAY[61, 62, 63, 64, 68, 69]));
    PERFORM pg_temp.t_expect('X14', 'appearances, colours and label of 69', jsonb_build_array(pg_temp.t_counts(s, 69),
        pg_temp.t_colours(s, 69), pg_temp.t_label(s, 69)),
        jsonb_build_array('[1, 1, 1]'::jsonb, '["ffff00", "ffff00", "ffff00"]'::jsonb,
            jsonb_build_array(pg_temp.t_issue_el(31, 'Unassigned', 'ffff00'))));
    PERFORM pg_temp.t_absent('X14', s, ARRAY['Beta', 'Delta', 'B group', 'Gone'], ARRAY['7C5CFF', 'CC00CC', '00AA00', 'AA0000']);
    PERFORM pg_temp.t_expect('X14', 'Fact Unassigned and Delta: burned', pg_temp.t_burned(f->'get'), pg_temp.t_ids(ARRAY[67, 70]));
    PERFORM pg_temp.t_expect('X14', 'colours and label of 67', jsonb_build_array(pg_temp.t_colours(f, 67), pg_temp.t_label(f, 67)),
        jsonb_build_array('["ffff00", "ffff00", "ffff00"]'::jsonb, jsonb_build_array(pg_temp.t_issue_el(31, 'Unassigned', 'ffff00'))));
    PERFORM pg_temp.t_absent('X14', f, ARRAY['Alpha', 'Beta', 'Delta', 'bPrivate'], ARRAY['0066FF', '7C5CFF', 'CC00CC']);
    RAISE NOTICE 'PASS X14 Alpha and Unassigned ticked: QFact 69 (only in the unticked Beta) exported as Unassigned, stored colour ffff00, Issue label, Beta named nowhere; Fact 67 (only in the unticked Alpha) passes Unassigned + Delta the same way';
END $t$;

-- ------------------------------------------------------------------------------------------------ X15 (like a Mark with no group)
DO $t$
DECLARE e record; s jsonb; k integer := 0;
BEGIN
    -- 69 (QF, Unassigned, Contact 51, in Beta) against 64 (QF, Unassigned, Contact 51, no group): in every export that
    -- does not tick Beta for QFacts, 69 is exported exactly when 64 is. 67 (F, Unassigned, in Alpha) against 70 (F,
    -- Unassigned, no group): in every export that does not tick Alpha for Facts.
    FOR e IN SELECT * FROM c_exports WHERE name NOT LIKE 'G03 %' AND name NOT LIKE 'G06 %' ORDER BY name LOOP
        s := pg_temp.t_snapshot(e.x);
        PERFORM pg_temp.t_expect('X15', '69 as 64 in "' || e.name || '"', pg_temp.t_in(s, 69), pg_temp.t_in(s, 64));
        IF e.name NOT LIKE 'G09 %' THEN
            PERFORM pg_temp.t_expect('X15', '67 as 70 in "' || e.name || '"', pg_temp.t_in(s, 67), pg_temp.t_in(s, 70));
        END IF;
        k := k + 1;
    END LOOP;
    PERFORM pg_temp.t_expect('X15', 'exports compared', to_jsonb(k), '21');
    -- It fails through an Issue tick it does not match, as 64 does (Liability and Delta ticked).
    s := pg_temp.t_snapshot(pg_temp.t_x('G02b'));
    PERFORM pg_temp.t_expect('X15', 'Liability and Delta: 69 and 64', jsonb_build_array(pg_temp.t_in(s, 69), pg_temp.t_in(s, 64)),
        '[[false, false, false], [false, false, false]]');
    RAISE NOTICE 'PASS X15 in all 21 exports that do not tick its group, a Mark in unticked groups passes or fails exactly as a Mark with no group (69 as 64, 67 as 70), through an Issue tick or not';
END $t$;

-- ------------------------------------------------------------------------------------------------ X16 (bQFTeam false)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G16'));
BEGIN
    -- Unassigned and Delta ticked with bQFTeam false: only Delta's QFacts (none). 62, 63, 69 (groups unticked) are out
    -- although Unassigned is ticked, as 64 and 68 are.
    PERFORM pg_temp.t_expect('X16', 'burned QFacts', pg_temp.t_burned(s->'get', 'QF'), '[]');
    PERFORM pg_temp.t_expect('X16', 'preview QFacts', pg_temp.t_list_ids(s->'preview'->'factlinks', 'QF'), '[]');
    PERFORM pg_temp.t_absent('X16', s, ARRAY['Alpha', 'Beta', 'Delta', 'bPrivate'], ARRAY['0066FF', '7C5CFF', 'CC00CC']);
    RAISE NOTICE 'PASS X16 bQFTeam false still means only the ticked groups'' QFacts: with Unassigned and the empty Delta ticked no QFact is exported (62, 63, 69 in unticked groups out)';
END $t$;

-- ------------------------------------------------------------------------------------------------ X17 (issuelist elements)
DO $t$
DECLARE s jsonb := pg_temp.t_snapshot(pg_temp.t_x('G03')); e record; el jsonb; n integer := 0;
BEGIN
    -- G03: one element per ticked group after the Issue elements, in name order, each with bPrivate true and its own
    -- colour (X03); every element is {nIssueid, cIssue, cClr} plus bPrivate only on a group element.
    FOR el IN SELECT x FROM jsonb_array_elements(s->'index'->'factlinks') r, jsonb_array_elements(COALESCE(r->'issuelist', '[]'::jsonb)) x LOOP
        IF el ? 'bPrivate' THEN
            PERFORM pg_temp.t_expect('X17', 'group element keys', to_jsonb(ARRAY(SELECT jsonb_object_keys(el) ORDER BY 1)),
                '["bPrivate", "cClr", "cIssue", "nIssueid"]');
            PERFORM pg_temp.t_expect('X17', 'group element bPrivate / nIssueid', jsonb_build_array(el->'bPrivate', el->'nIssueid'), '[true, null]');
            n := n + 1;
        ELSE
            PERFORM pg_temp.t_expect('X17', 'Issue element keys', to_jsonb(ARRAY(SELECT jsonb_object_keys(el) ORDER BY 1)),
                '["cClr", "cIssue", "nIssueid"]');
        END IF;
    END LOOP;
    PERFORM pg_temp.t_expect('X17', 'group elements in G03 (61: 2, 62: 2, 63: 2, 69: 1)', to_jsonb(n), '7');
    -- Another user's Mark never carries a group element, in any group export.
    FOR e IN SELECT * FROM c_exports WHERE kind = 'group' LOOP
        PERFORM pg_temp.t_expect('X17', 'label of 91 in "' || e.name || '"', pg_temp.t_label(pg_temp.t_snapshot(e.x), 91),
            jsonb_build_array(pg_temp.t_issue_el(31, 'Unassigned', 'ffff00')));
    END LOOP;
    RAISE NOTICE 'PASS X17 issuelist: one {nIssueid null, cIssue, cClr, bPrivate true} element per ticked group, Issue elements without bPrivate; B''s 91 has only its Issue element in every group export';
END $t$;

-- ------------------------------------------------------------------------------------------------ X18 (M4 tie-break)
DO $t$
BEGIN
    -- 62's memberships Beta (42) and Alpha (41) in the same microsecond, both ticked (G03): the larger id, Beta.
    PERFORM pg_temp.t_expect('X18', 'tie: colours of 62', pg_temp.t_tie_colours(pg_temp.t_x('G03')), '["7C5CFF", "7C5CFF", "7C5CFF"]');
    PERFORM pg_temp.t_expect('X18', 'stamps of 62 put back', (SELECT jsonb_agg("nGroupid"::text ORDER BY "dCreateDt")
        FROM public."FactPrivateGroup" WHERE "nFSid" = pg_temp.tid(62)), jsonb_build_array(pg_temp.tid(42)::text, pg_temp.tid(41)::text));
    PERFORM pg_temp.t_expect('X18', 'without the tie: colours of 62', pg_temp.t_colours(pg_temp.t_snapshot(pg_temp.t_x('G03')), 62),
        '["0066FF", "0066FF", "0066FF"]');
    RAISE NOTICE 'PASS X18 two ticked memberships of one microsecond: the burned colour is the larger group id''s (Beta 7C5CFF; 2026-11-14b gave Alpha 0066FF); without a tie the most recently added (Alpha) as before';
END $t$;

-- ------------------------------------------------------------------------------------------------ the answers after the up
CREATE TEMP TABLE c_after AS SELECT e.name, e.x, pg_temp.t_snapshot(e.x) AS snap FROM c_exports e;

-- ------------------------------------------------------------------------------------------------ X08 (the down)
\ir 2026-11-15_export_private_groups_ticked_only.down.sql

DO $t$
DECLARE b record; snap_now jsonb;
BEGIN
    PERFORM pg_temp.t_expect('X08', 'bodies and helpers after the down (the 2026-11-14b state)', pg_temp.t_norms(), pg_temp.t_14b_norms());
    PERFORM pg_temp.t_expect('X08', 'md5(prosrc) of the three bodies after the down', jsonb_build_array(pg_temp.t_fn_md5('et_export_get_data_1'),
        pg_temp.t_fn_md5('et_preview_document_list_1'), pg_temp.t_fn_md5('et_annotation_index_rows')),
        (SELECT jsonb_build_array(get_md5, preview_md5, index_md5) FROM c_14b));
    FOR b IN SELECT * FROM c_before ORDER BY name LOOP
        snap_now := pg_temp.t_snapshot(b.x);
        IF md5(pg_temp.t_canon(snap_now)::text) IS DISTINCT FROM b.snap_md5 THEN
            RAISE EXCEPTION 'FAIL X08 export "%" after the down: before %, after %', b.name, pg_temp.t_canon(b.snap), pg_temp.t_canon(snap_now);
        END IF;
    END LOOP;
    PERFORM pg_temp.t_expect('X08', 'index called without nMasterid / nExportid', pg_temp.t_canon(pg_temp.t_index_plain()),
        pg_temp.t_canon((SELECT index_plain FROM c_before_db)));
    FOR b IN SELECT * FROM c_red ORDER BY name LOOP
        PERFORM pg_temp.t_expect('X08', 'group export "' || b.name || '" answers as under 2026-11-14b',
            pg_temp.t_canon(pg_temp.t_snapshot(b.x)), pg_temp.t_canon(b.snap));
    END LOOP;
    RAISE NOTICE 'PASS X08 down: the three 2026-11-14b bodies restored verbatim, the new helper gone, 2026-11-14b''s helper kept; every export answers as under 2026-11-14b (% group exports)', (SELECT count(*) FROM c_red);
END $t$;

-- ------------------------------------------------------------------------------------------------ X13 (up again)
\ir 2026-11-15_export_private_groups_ticked_only.up.sql

DO $t$
DECLARE b record;
BEGIN
    PERFORM pg_temp.t_expect('X13', 'bodies and helpers after down then up', pg_temp.t_norms(), pg_temp.t_mine_norms());
    PERFORM pg_temp.t_expect('X13', 'function sources after down then up', pg_temp.t_fns(), (SELECT fns FROM c_first_up));
    FOR b IN SELECT * FROM c_after ORDER BY name LOOP
        PERFORM pg_temp.t_expect('X13', 'export "' || b.name || '" answers as after the first up',
            pg_temp.t_canon(pg_temp.t_snapshot(b.x)), pg_temp.t_canon(b.snap));
    END LOOP;
    RAISE NOTICE 'PASS X13 down then up: the same bodies as the first run and the same answers for all % exports', (SELECT count(*) FROM c_after);
END $t$;

\echo 'PASS all 19 checks'
