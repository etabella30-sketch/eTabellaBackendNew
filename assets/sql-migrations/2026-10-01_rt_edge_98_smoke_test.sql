-- 2026-10-01_rt_edge_98_smoke_test.sql
--
-- Self-checking smoke test of the rt_edge migrations (files 01-10). NOT a
-- migration: it creates throwaway fixtures (users, cases, team rows, sessions,
-- venue boxes), drives every SP through its happy path and its failure paths,
-- RAISEs on the first failed check, and ends with ROLLBACK, so it leaves
-- nothing behind (sequence values aside). Section 10 checks the review fixes
-- of file 10 (locks, parser pin, re-enrol key history).
--
-- Run it after files 01-10, on dev etabella_tech_uuid only (guard below), or on
-- a local throwaway Postgres whose database is named etabella_tech_uuid and
-- holds a schema-only restore of dev (README, "How to test"):
--   psql -v ON_ERROR_STOP=1 -d etabella_tech_uuid -f 2026-10-01_rt_edge_98_smoke_test.sql
-- Success ends with NOTICE "rt_edge smoke test: all checks passed".

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_98_smoke_test: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.et_rtedge_orphan_resolve(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rt_transcript_completeness(json, refcursor, refcursor)') IS NULL
       OR to_regprocedure('public.rtedge_orphan_interval(timestamp with time zone, timestamp with time zone, bigint, bigint, text)') IS NULL
       OR to_regprocedure('public.et_rtedge_session_rebind_direct(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rtedge_session_parser_pin(json, refcursor)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_98_smoke_test: apply 2026-10-01_rt_edge_01 .. 10 first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- Session-local helpers (pg_temp; gone at ROLLBACK)
--------------------------------------------------------------------------

-- First row of a single-cursor SP as jsonb (NULL when the cursor is empty).
CREATE FUNCTION pg_temp.smoke_call(p_fn text, p_param jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_fn  text := CASE WHEN position('.' IN p_fn) > 0 THEN p_fn ELSE 'public.et_' || p_fn END;
    v_c   refcursor;
    v_row record;
    v_out jsonb;
BEGIN
    EXECUTE format('SELECT %s($1::json, %L::refcursor)', v_fn, 'smoke_c') INTO v_c USING p_param::text;
    FETCH v_c INTO v_row;
    IF FOUND THEN
        v_out := to_jsonb(v_row);
    END IF;
    CLOSE v_c;
    RETURN v_out;
END
$function$;

-- Every row of every cursor of a multi-cursor SP: [[r1 rows], [r2 rows], ...].
CREATE FUNCTION pg_temp.smoke_multi(p_fn text, p_param jsonb, p_n integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_fn    text := CASE WHEN position('.' IN p_fn) > 0 THEN p_fn ELSE 'public.et_' || p_fn END;
    v_names text[] := ARRAY[]::text[];
    v_name  text;
    v_c     refcursor;
    v_row   record;
    v_rows  jsonb;
    v_all   jsonb := '[]'::jsonb;
    i       integer;
BEGIN
    FOR i IN 1 .. p_n LOOP
        v_names := v_names || ('smoke_m' || i);
    END LOOP;
    EXECUTE format('SELECT count(*) FROM %s($1::json, %s)', v_fn,
                   (SELECT string_agg(quote_literal(n) || '::refcursor', ', ') FROM unnest(v_names) AS n))
      USING p_param::text;
    FOREACH v_name IN ARRAY v_names LOOP
        v_c := v_name;
        v_rows := '[]'::jsonb;
        LOOP
            FETCH v_c INTO v_row;
            EXIT WHEN NOT FOUND;
            v_rows := v_rows || to_jsonb(v_row);
        END LOOP;
        CLOSE v_c;
        v_all := v_all || jsonb_build_array(v_rows);
    END LOOP;
    RETURN v_all;
END
$function$;

CREATE FUNCTION pg_temp.smoke_expect(p_label text, p_ok boolean, p_got jsonb DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NOT COALESCE(p_ok, false) THEN
        RAISE EXCEPTION 'rt_edge smoke FAIL: % (got %)', p_label, COALESCE(p_got::text, 'n/a');
    END IF;
    RAISE NOTICE 'ok  %', p_label;
END
$function$;

--------------------------------------------------------------------------
-- The test
--------------------------------------------------------------------------
DO $smoke$
DECLARE
    v_key    text := 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEA4lwqPGeyKUOIUKUY0Ga8fbTmaRIDyq7xSJ6ilwTNs1ByGR7AWn6Xc21mZlnPZS3ga+RTecBybW+DjdjFHZEcg==';
    v_fpr    text := '4b6ca3403346cf6e5e5d28198ff8686aa5e5b26694523ab32baf95793f2f4913'; -- sha256(SPKI DER), computed offline
    v_code   text := encode(sha256(convert_to('rtedge-smoke-code', 'UTF8')), 'hex');
    v_tag    text := substr(md5(random()::text), 1, 8);
    v_admin  uuid;
    v_cadmin uuid;
    v_other  uuid;
    v_case   uuid;
    v_case2  uuid;
    v_caseno text;
    v_edge   uuid;
    v_s1     uuid;
    v_s2     uuid;
    v_s4     uuid;
    v_s5     uuid;
    v_s6     uuid;
    v_s7     uuid;
    v_s8     uuid;
    v_s9     uuid;
    v_s10    uuid;
    v_s11    uuid;
    v_s12    uuid;
    v_s13    uuid;
    v_s14    uuid;
    v_s15    uuid;
    v_s16    uuid;
    v_s17    uuid;
    v_s18    uuid;
    v_edge2  uuid;
    -- File 10 (review fixes): a second box, enrolled without a parser version, then re-enrolled with a new key.
    v_key2   text := 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhLlqTsuTsAEPhfv5D4AQj4OycgWlSyWP1T0itOUcY8l9J3voD0jpAkbc9tQ58aAtS+mCWUdsw4DsXrJe0PdcIQ==';
    v_fpr2   text := '9abb9f7ea2bbb2372a3b8cd44be159ba64370a07507c5355e82874d0abf25af9';
    v_key3   text := 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE0NFOz92o4EZLlkZRMa5ac4Eu+CveGc3ciK4BlfIL14+nRNPVUIi80F8eZy0oxBAmqgPyBs4K2tKcc2x/xr0gBA==';
    v_fpr3   text := '154a0616b110b55747794ab3f37ecfe7723a1f272907b1e2ec678a29ccb3421b';
    v_code2  text := encode(sha256(convert_to('rtedge-smoke-box2-code', 'UTF8')), 'hex');
    v_code3  text := encode(sha256(convert_to('rtedge-smoke-box2-rekey', 'UTF8')), 'hex');
    v_orph4  uuid := gen_random_uuid();
    v_def    text;
    v_hs     uuid;
    v_p2     uuid;
    v_orph   uuid := gen_random_uuid();
    v_orph2  uuid := gen_random_uuid();
    v_orph3  uuid := gen_random_uuid();
    v_r      jsonb;
    v_m      jsonb;
    v_h      text;
    v_d4     text := encode(sha256(convert_to('root-4', 'UTF8')), 'hex');
    v_h4     text := encode(sha256(convert_to('raw-4', 'UTF8')), 'hex');
    v_d12    text := encode(sha256(convert_to('root-12', 'UTF8')), 'hex');
    v_h12    text := encode(sha256(convert_to('raw-12', 'UTF8')), 'hex');
BEGIN
    ----------------------------------------------------------------------
    -- Fixtures
    ----------------------------------------------------------------------
    INSERT INTO public."UserMaster" ("cFname", "cLname", "cEmail", "isAdmin", "cStatus")
    VALUES ('Smoke', 'Admin', 'rtedge-smoke-admin-' || v_tag || '@example.invalid', true, 'A') RETURNING "nUserid" INTO v_admin;
    INSERT INTO public."UserMaster" ("cFname", "cLname", "cEmail", "isAdmin", "cStatus")
    VALUES ('Smoke', 'CaseAdmin', 'rtedge-smoke-cadmin-' || v_tag || '@example.invalid', false, 'A') RETURNING "nUserid" INTO v_cadmin;
    INSERT INTO public."UserMaster" ("cFname", "cLname", "cEmail", "isAdmin", "cStatus")
    VALUES ('Smoke', 'Member', 'rtedge-smoke-member-' || v_tag || '@example.invalid', false, 'A') RETURNING "nUserid" INTO v_other;

    v_caseno := 'RTEDGE-SMOKE-' || v_tag;
    INSERT INTO public."CaseMaster" ("cCaseno", "cCasename") VALUES (v_caseno, 'RT edge smoke 1') RETURNING "nCaseid" INTO v_case;
    INSERT INTO public."CaseMaster" ("cCaseno", "cCasename") VALUES (v_caseno || '-2', 'RT edge smoke 2') RETURNING "nCaseid" INTO v_case2;
    INSERT INTO public."TeamRelation" ("nCaseid", "nUserid", "nRoleid", "cStatus") VALUES (v_case, v_cadmin, public.rtedge_case_admin_role(), 'A');
    INSERT INTO public."TeamRelation" ("nCaseid", "nUserid", "cStatus") VALUES (v_case, v_other, 'A');

    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke day 1', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s1;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke split', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s2;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke orphans', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s4;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke quarantine', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s5;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case2, 'Smoke cut mode', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s6;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke warnings', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s7;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case2, 'Smoke cut warning', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s8;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke legacy', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s9;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke deleted seal', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s10;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke deleted force', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s11;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke backstop', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s12;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke revoked deleted', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s13;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke rebind direct', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s14;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke rebind fed', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s15;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke rebind held', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s16;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke parser pin', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s17;
    INSERT INTO public."RSessionMaster" ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cTimezone", "cProtocol")
    VALUES (v_case, 'Smoke re-enrolled box', localtimestamp, 1, 25, 1, 'sess:' || gen_random_uuid(), 'R', 'Europe/London', 'B') RETURNING "nSesid" INTO v_s18;
    INSERT INTO public."RSessionDetail" ("nSesid", "nUserid", "cUsertype") VALUES (v_s2, v_other, 'U');

    ----------------------------------------------------------------------
    -- Helpers
    ----------------------------------------------------------------------
    PERFORM pg_temp.smoke_expect('rtedge_uuid rejects garbage', public.rtedge_uuid('not-a-uuid') IS NULL);
    PERFORM pg_temp.smoke_expect('rtedge_jsonb unwraps a stringified array', public.rtedge_jsonb('"[1,2]"') = '[1,2]'::jsonb);
    PERFORM pg_temp.smoke_expect('rtedge_p256_spki accepts the sample key', public.rtedge_p256_spki(v_key) IS NOT NULL);
    PERFORM pg_temp.smoke_expect('rtedge_p256_spki rejects a non-key', public.rtedge_p256_spki('bm90IGEga2V5') IS NULL);
    PERFORM pg_temp.smoke_expect('incident levels (3 warnings of 5)',
        public.rtedge_incident_warnings('[{"kind":"ABORTED_WINDOW","level":"info"},{"kind":"CAT_DISCONNECT","level":"warning"},
                                          {"kind":"LOCKOUT"},{"kind":"NEW_KIND"},{"kind":"NEW_KIND","level":"info"}]') = 3);
    PERFORM pg_temp.smoke_expect('orphan interval in the hearing zone (BST)',
        public.rtedge_orphan_interval('2026-10-01T10:00:00Z', '2026-10-01T10:05:00Z', NULL, NULL, 'Europe/London') = '2026-10-01 11:00:00-11:05:00');
    PERFORM pg_temp.smoke_expect('orphan interval falls back to the raw seq range',
        public.rtedge_orphan_interval(NULL, NULL, 40, 90, 'Not/AZone') = 'raw seq 40-90');

    ----------------------------------------------------------------------
    -- 1. Device lifecycle
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_create', jsonb_build_object('nMasterid', v_other, 'cName', 'Smoke box'));
    PERFORM pg_temp.smoke_expect('create refuses a non-admin', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_create', jsonb_build_object('nMasterid', v_admin, 'cName', 'Smoke box', 'cVenue', 'Court 1', 'cEnrollHash', v_code));
    PERFORM pg_temp.smoke_expect('create', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cStatus' = 'P' AND (v_r ->> 'cSlug') ~ '^[a-z0-9]{12}$', v_r);
    v_edge := (v_r ->> 'nEdgeid')::uuid;

    v_r := pg_temp.smoke_call('rtedge_enroll', jsonb_build_object('cEnrollHash', encode(sha256(convert_to('wrong', 'UTF8')), 'hex'), 'cPubKey', v_key));
    PERFORM pg_temp.smoke_expect('enroll refuses a wrong code', v_r ->> 'cCode' = 'INVALID_CODE', v_r);
    v_r := pg_temp.smoke_call('rtedge_enroll', jsonb_build_object('cEnrollHash', v_code, 'cPubKey', 'bm90IGEga2V5'));
    PERFORM pg_temp.smoke_expect('enroll refuses a non-P-256 key', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_enroll', jsonb_build_object('cEnrollHash', v_code, 'cPubKey', v_key, 'bTpmKey', false,
                                                                  'cParserVer', 'smoke-1', 'cLanIp', '10.20.0.5'));
    PERFORM pg_temp.smoke_expect('enroll -> C with the computed fingerprint', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cStatus' = 'C' AND v_r ->> 'cKeyFpr' = v_fpr, v_r);
    v_r := pg_temp.smoke_call('rtedge_enroll', jsonb_build_object('cEnrollHash', v_code, 'cPubKey', v_key));
    PERFORM pg_temp.smoke_expect('an enrollment code is single use', v_r ->> 'cCode' = 'INVALID_CODE', v_r);
    v_r := pg_temp.smoke_call('rtedge_confirm_key', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge, 'cKeyFpr', repeat('0', 64)));
    PERFORM pg_temp.smoke_expect('confirm_key refuses a wrong fingerprint', v_r ->> 'cCode' = 'MISMATCH', v_r);
    v_r := pg_temp.smoke_call('rtedge_confirm_key', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge,
                                                                       'cKeyFpr', upper(substr(v_fpr, 1, 32)) || ':' || substr(v_fpr, 33)));
    PERFORM pg_temp.smoke_expect('confirm_key -> A (case and separators ignored)', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cStatus' = 'A', v_r);

    v_m := pg_temp.smoke_multi('rtedge_get', jsonb_build_object('nEdgeid', v_edge), 2);
    PERFORM pg_temp.smoke_expect('get returns the key, never the enroll hash',
        v_m -> 0 -> 0 ->> 'cPubKey' = v_key AND NOT (v_m -> 0 -> 0 ? 'cEnrollHash') AND v_m -> 0 -> 0 ->> 'cLanIp' = '10.20.0.5', v_m);

    v_r := pg_temp.smoke_call('rtedge_heartbeat', jsonb_build_object('nEdgeid', v_edge, 'cLastEgress', '203.0.113.7', 'cLastAsn', 'AS64500',
                                                                     'jHealth', '{"disk":"ok"}', 'dCertExp', '2027-01-01T00:00:00Z'));
    PERFORM pg_temp.smoke_expect('heartbeat writes', (v_r ->> 'bWritten')::boolean AND v_r ->> 'dCertExp' IS NOT NULL, v_r);
    v_r := pg_temp.smoke_call('rtedge_heartbeat', jsonb_build_object('nEdgeid', v_edge, 'cLastAsn', 'AS64501'));
    PERFORM pg_temp.smoke_expect('heartbeat throttles within a minute', NOT (v_r ->> 'bWritten')::boolean AND v_r ->> 'cPrevAsn' = 'AS64500', v_r);
    v_r := pg_temp.smoke_call('rtedge_heartbeat', jsonb_build_object('nEdgeid', v_edge, 'cLastAsn', 'AS64501', 'bForce', true));
    PERFORM pg_temp.smoke_expect('heartbeat bForce writes', (v_r ->> 'bWritten')::boolean, v_r);

    ----------------------------------------------------------------------
    -- 2. Case scoping
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_case_set', jsonb_build_object('nMasterid', v_other, 'nEdgeid', v_edge, 'nCaseid', v_case, 'permission', 'I'));
    PERFORM pg_temp.smoke_expect('case_set refuses a non-admin', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_case_set', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge, 'nCaseid', v_case, 'permission', 'I'));
    PERFORM pg_temp.smoke_expect('case_set assigns', (v_r ->> 'bChanged')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_case_set', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge, 'nCaseid', v_case, 'permission', 'I'));
    PERFORM pg_temp.smoke_expect('case_set is idempotent', (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bChanged')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_list', jsonb_build_object('nCaseid', v_case));
    PERFORM pg_temp.smoke_expect('list by case finds the box', v_r ->> 'nEdgeid' = v_edge::text AND (v_r ->> 'nCases')::int = 1, v_r);

    ----------------------------------------------------------------------
    -- 3. Bind
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s6, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind refuses an unassigned case', v_r ->> 'cCode' = 'UNASSIGNED_CASE', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nHearingOpid', v_other, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind refuses a hearing operator who is not case admin', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nHearingOpid', v_cadmin, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind -> L, parser version from the box, LAN host',
        (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'L' AND v_r ->> 'cParserVer' = 'smoke-1' AND v_r ->> 'cLanIp' = '10.20.0.5', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind is idempotent', (v_r ->> 'bAlready')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_direct', jsonb_build_object('nSesid', v_s1, 'cApply', 'L'));
    PERFORM pg_temp.smoke_expect('direct refuses an edge session', v_r ->> 'cCode' = 'STATE', v_r);

    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge), 5);
    PERFORM pg_temp.smoke_expect('assignments: header, case, live session, roster, admins',
        (v_m -> 0 -> 0 ->> 'msg')::int = 1
        AND jsonb_array_length(v_m -> 1) = 1
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 2) e WHERE e ->> 'nSesid' = v_s1::text AND e ->> 'cOp' = 'upsert')
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 3) e WHERE e ->> 'nUserid' = v_cadmin::text AND (e ->> 'isCaseAdmin')::boolean)
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 3) e WHERE e ->> 'nUserid' = v_other::text AND NOT (e ->> 'isCaseAdmin')::boolean)
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 4) e WHERE e ->> 'nUserid' = v_admin::text), v_m);

    ----------------------------------------------------------------------
    -- 4. Applied watermark
    ----------------------------------------------------------------------
    v_h := encode(sha256(convert_to('raw-10', 'UTF8')), 'hex');
    v_r := pg_temp.smoke_call('rtedge_applied', jsonb_build_object('nSesid', v_s1, 'nAppliedRawSeq', 10, 'cAppliedRawHash', v_h, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('applied advances', (v_r ->> 'bAdvanced')::boolean AND (v_r ->> 'nAppliedRawSeq')::bigint = 10, v_r);
    v_r := pg_temp.smoke_call('rtedge_applied', jsonb_build_object('nSesid', v_s1, 'nAppliedRawSeq', 5));
    PERFORM pg_temp.smoke_expect('applied never moves back', NOT (v_r ->> 'bAdvanced')::boolean AND (v_r ->> 'nAppliedRawSeq')::bigint = 10, v_r);
    v_r := pg_temp.smoke_call('rtedge_applied', jsonb_build_object('nSesid', v_s1, 'nAppliedRawSeq', 10,
                                                                   'cAppliedRawHash', encode(sha256(convert_to('other', 'UTF8')), 'hex')));
    PERFORM pg_temp.smoke_expect('applied flags a fork at the same seq', v_r ->> 'cCode' = 'FORK', v_r);

    ----------------------------------------------------------------------
    -- 5. End and seal (K), gate
    ----------------------------------------------------------------------
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s1), 2);
    PERFORM pg_temp.smoke_expect('gate: live session blocks publish', v_m -> 0 -> 0 ->> 'cReason' = 'LIVE' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s1, 'cPurpose', 'X'), 2);
    PERFORM pg_temp.smoke_expect('gate: live export allowed with stamp', (v_m -> 0 -> 0 ->> 'bOk')::boolean AND (v_m -> 0 -> 0 ->> 'bLiveStamp')::boolean, v_m);

    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s1, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end -> S pending', (v_r ->> 'bPending')::boolean AND v_r ->> 'cSyncState' = 'S' AND v_r ->> 'nEdgeid' = v_edge::text, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s1, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end is idempotent', (v_r ->> 'bPending')::boolean AND NOT (v_r ->> 'bChanged')::boolean, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s1, 'cPurpose', 'X'), 2);
    PERFORM pg_temp.smoke_expect('gate: awaiting seal blocks export', v_m -> 0 -> 0 ->> 'cReason' = 'AWAITING_SEAL' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    v_h := encode(sha256(convert_to('raw-20', 'UTF8')), 'hex');
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s1, 'nEdgeid', gen_random_uuid(), 'nEpoch', 1,
        'cFinalDigest', encode(sha256(convert_to('root-1', 'UTF8')), 'hex'), 'nFinalLines', 120, 'nRawFinalSeq', 20, 'cRawFinalHash', v_h));
    PERFORM pg_temp.smoke_expect('seal refuses another box', v_r ->> 'cCode' = 'NOT_BOUND', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nEpoch', 2,
        'cFinalDigest', encode(sha256(convert_to('root-1', 'UTF8')), 'hex'), 'nFinalLines', 120, 'nRawFinalSeq', 20, 'cRawFinalHash', v_h));
    PERFORM pg_temp.smoke_expect('seal refuses a stale lineage', v_r ->> 'cCode' = 'LINEAGE', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', encode(sha256(convert_to('root-1', 'UTF8')), 'hex'), 'nFinalLines', 120, 'nRawFinalSeq', 9, 'cRawFinalHash', v_h));
    PERFORM pg_temp.smoke_expect('seal refuses a regress', v_r ->> 'cCode' = 'REGRESS', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nEpoch', 1, 'nFinalRev', 42,
        'cFinalDigest', encode(sha256(convert_to('root-1', 'UTF8')), 'hex'), 'nFinalLines', 120, 'nRawFinalSeq', 20, 'cRawFinalHash', v_h,
        'jIncidents', '[{"kind":"CAT_DISCONNECT","level":"info"}]', 'jSeal', '{"sig":"smoke"}'));
    PERFORM pg_temp.smoke_expect('seal -> K (info incident only)', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'K', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nEpoch', 1, 'nFinalRev', 42,
        'cFinalDigest', encode(sha256(convert_to('root-1', 'UTF8')), 'hex'), 'nFinalLines', 120, 'nRawFinalSeq', 20, 'cRawFinalHash', v_h,
        'jIncidents', '[]'));
    PERFORM pg_temp.smoke_expect('a repeated seal is a no-op', (v_r ->> 'bAlready')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s1, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', encode(sha256(convert_to('root-other', 'UTF8')), 'hex'), 'nFinalLines', 121, 'nRawFinalSeq', 20, 'cRawFinalHash', v_h));
    PERFORM pg_temp.smoke_expect('a seal with other values is refused', v_r ->> 'cCode' = 'SEALED', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s1), 2);
    PERFORM pg_temp.smoke_expect('gate: K publishes', v_m -> 0 -> 0 ->> 'cReason' = 'COMPLETE' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean
                                 AND jsonb_array_length(v_m -> 1) = 1, v_m);
    PERFORM pg_temp.smoke_expect('seal closed the live status and set the exact watermark',
        EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s1 AND "cStatus" = 'C' AND "nAppliedRawSeq" = 20 AND "cAppliedRawHash" = v_h));

    ----------------------------------------------------------------------
    -- 6. Split to direct cloud (D7) and forced close
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s2, 'nEdgeid', v_edge, 'nHearingOpid', v_cadmin, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind the session to split', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_split', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_other));
    PERFORM pg_temp.smoke_expect('split refuses a non-operator', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_split', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_cadmin, 'cEclipseUsername', 'smoke-user'));
    PERFORM pg_temp.smoke_expect('split by the hearing operator',
        (v_r ->> 'msg')::int = 1 AND (v_r ->> 'nPartNo')::int = 2 AND v_r ->> 'cApply' = 'L' AND (v_r ->> 'nAssigneesCopied')::int = 1
        AND v_r ->> 'cName' = 'Smoke split (Part 2)' AND v_r ->> 'nEdgeid' = v_edge::text, v_r);
    v_p2 := (v_r ->> 'nPart2Sesid')::uuid;
    v_r := pg_temp.smoke_call('rtedge_session_split', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('a repeated split returns the same Part 2', (v_r ->> 'bAlready')::boolean AND v_r ->> 'nPart2Sesid' = v_p2::text, v_r);
    PERFORM pg_temp.smoke_expect('Part 1 ended awaiting its box; Part 2 live direct and linked',
        EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s2 AND "cSyncState" = 'S' AND "cStatus" = 'C' AND "nPartNo" = 1)
        AND EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_p2 AND "cFeedSource" = 'D' AND "cStatus" = 'R'
                       AND "nPrevPartSesid" = v_s2 AND NOT "bEverEdge" AND "cUnicuserid" LIKE 'sess:%')
        AND EXISTS (SELECT 1 FROM public."RSessionDetail" WHERE "nSesid" = v_p2 AND "nUserid" = v_other));

    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge), 5);
    PERFORM pg_temp.smoke_expect('the box gets op end for Part 1 with the Part 2 pointer',
        EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 2) e
                 WHERE e ->> 'nSesid' = v_s2::text AND e ->> 'cOp' = 'end' AND e ->> 'nNextPartSesid' = v_p2::text), v_m);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_p2), 2);
    PERFORM pg_temp.smoke_expect('gate: Part 2 (legacy direct) is not gated; parts listed in order',
        v_m -> 0 -> 0 ->> 'cReason' = 'NOT_GATED' AND jsonb_array_length(v_m -> 1) = 2
        AND v_m -> 1 -> 0 ->> 'nSesid' = v_s2::text AND v_m -> 1 -> 1 ->> 'nSesid' = v_p2::text
        AND (v_m -> 1 -> 1 ->> 'bCurrent')::boolean, v_m);

    -- Bytes the cloud listener held before the split stay an orphan of Part 1.
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s2, 'cKind', 'H', 'nOrphanid', v_orph2,
        'cPeer', '198.51.100.10', 'dFrom', '2026-10-01T13:55:00Z', 'dTo', '2026-10-01T14:01:00Z', 'nBytes', 50));
    PERFORM pg_temp.smoke_expect('held bytes before the split are an orphan of Part 1', (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bDuplicate')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph2, 'cStatus', 'D', 'cNote', 'n', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('dismiss refuses a session awaiting its seal (the forced close dismisses instead)', v_r ->> 'cCode' = 'STATE', v_r);

    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_cadmin, 'cSealNote', 'x'));
    PERFORM pg_temp.smoke_expect('forceseal is super-admin only', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('forceseal needs a note', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_admin, 'cSealNote', 'venue data missing 14:02-14:09'));
    PERFORM pg_temp.smoke_expect('forceseal -> F, dismissing the pending orphan',
        (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'F' AND (v_r ->> 'nDismissedOrphans')::int = 1, v_r);
    PERFORM pg_temp.smoke_expect('the forced close dismissed the orphan in the same audited action',
        EXISTS (SELECT 1 FROM public."RtEdgeOrphan"
                 WHERE "nOrphanid" = v_orph2 AND "cStatus" = 'D' AND "nResolvedBy" = v_admin AND "dResolvedAt" IS NOT NULL
                   AND "cNote" LIKE 'Dismissed by forced close:%')
        AND EXISTS (SELECT 1 FROM public."RtEdgeEvent"
                     WHERE "nSesid" = v_s2 AND "cType" = 'forceseal' AND "nByUser" = v_admin AND "jData" -> 'dismissedOrphans' ? v_orph2::text));
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s2), 2);
    PERFORM pg_temp.smoke_expect('gate: F publishes watermarked, nothing pending',
        v_m -> 0 -> 0 ->> 'cReason' = 'FORCED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean AND (v_m -> 0 -> 0 ->> 'bWatermark')::boolean
        AND (v_m -> 0 -> 0 ->> 'nPendingOrphans')::int = 0, v_m);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s2, 'nMasterid', v_admin, 'cSealNote', 'again'));
    PERFORM pg_temp.smoke_expect('forceseal is idempotent', (v_r ->> 'bAlready')::boolean AND v_r ->> 'cSealNote' = 'venue data missing 14:02-14:09', v_r);

    ----------------------------------------------------------------------
    -- 7. Orphans: dismissal is a super-admin forced close ('F', S-D15)
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s4, 'nEdgeid', v_edge, 'nHearingOpid', v_cadmin, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind the orphan session', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_case_set', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge, 'nCaseid', v_case, 'permission', 'D'));
    PERFORM pg_temp.smoke_expect('unassign refuses a case with an unsealed session', v_r ->> 'cCode' = 'UNSEALED_SESSIONS', v_r);

    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s4, 'cKind', 'U'));
    PERFORM pg_temp.smoke_expect('orphan kind U is gone', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s4, 'cKind', 'C'));
    PERFORM pg_temp.smoke_expect('orphan C needs the session''s box', v_r ->> 'cCode' = 'NOT_BOUND', v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s9, 'cKind', 'H', 'nBytes', 10));
    PERFORM pg_temp.smoke_expect('orphans only on gated sessions (else they would never block publish)', v_r ->> 'cCode' = 'NOT_GATED', v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s4, 'cKind', 'H', 'nOrphanid', v_orph,
        'cPeer', '198.51.100.9', 'cUser', 'smoke-user', 'dFrom', '2026-10-01T10:00:00Z', 'dTo', '2026-10-01T10:05:00Z', 'nBytes', 100));
    PERFORM pg_temp.smoke_expect('orphan H recorded', (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bDuplicate')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s4, 'cKind', 'H', 'nOrphanid', v_orph, 'nBytes', 300));
    PERFORM pg_temp.smoke_expect('orphan repeat extends the row', (v_r ->> 'bDuplicate')::boolean AND NOT (v_r ->> 'bReopened')::boolean
                                 AND (v_r ->> 'nBytes')::bigint = 300 AND (v_r ->> 'nSessionHeldBytes')::bigint = 300, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'cNote', 'early', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('dismiss refuses a live session (the stream may still grow)', v_r ->> 'cCode' = 'STATE', v_r);

    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s4, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end the orphan session', (v_r ->> 'bPending')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s4, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', v_d4, 'nFinalLines', 30, 'nRawFinalSeq', 7, 'cRawFinalHash', v_h4, 'jIncidents', '[]'));
    PERFORM pg_temp.smoke_expect('seal with a pending orphan -> W', v_r ->> 'cSyncState' = 'W' AND (v_r ->> 'nPendingOrphans')::int = 1, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s4), 2);
    PERFORM pg_temp.smoke_expect('gate: pending orphan blocks', v_m -> 0 -> 0 ->> 'cReason' = 'PENDING_ORPHANS' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('dismiss needs a note', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'cNote', 'n', 'nMasterid', v_other));
    PERFORM pg_temp.smoke_expect('dismiss refuses a plain member', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'cNote', 'n', 'nMasterid', v_cadmin));
    PERFORM pg_temp.smoke_expect('dismiss refuses the case admin and hearing operator (super-admin only)', v_r ->> 'cCode' = 'NOT_ALLOWED', v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'cNote', 'reporter resent', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('dismissed by the super-admin: W -> F with the interval in the hearing zone',
        (v_r ->> 'msg')::int = 1 AND (v_r ->> 'nPendingLeft')::int = 0 AND v_r ->> 'cSyncState' = 'F'
        AND v_r ->> 'cSealNote' = 'venue data missing 2026-10-01 11:00:00-11:05:00', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s4), 2);
    PERFORM pg_temp.smoke_expect('gate: a dismissal publishes only watermarked',
        v_m -> 0 -> 0 ->> 'cReason' = 'FORCED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean AND (v_m -> 0 -> 0 ->> 'bWatermark')::boolean
        AND v_m -> 0 -> 0 ->> 'cSealNote' = 'venue data missing 2026-10-01 11:00:00-11:05:00', v_m);
    PERFORM pg_temp.smoke_expect('the dismissal and the forced close are one audit event',
        EXISTS (SELECT 1 FROM public."RtEdgeEvent"
                 WHERE "nSesid" = v_s4 AND "cType" = 'orphan_resolve' AND "nByUser" = v_admin
                   AND "jData" ->> 'cPrevSyncState' = 'W' AND "jData" ->> 'cSyncState' = 'F' AND "jData" ->> 'cNote' = 'reporter resent'));
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'cNote', 'again', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('a repeated dismissal is a no-op', (v_r ->> 'bAlready')::boolean AND v_r ->> 'cSyncState' = 'F', v_r);
    v_r := pg_temp.smoke_call('rtedge_warn_ack', jsonb_build_object('nSesid', v_s4, 'nMasterid', v_cadmin));
    PERFORM pg_temp.smoke_expect('a force-closed session has nothing to acknowledge', v_r ->> 'cCode' = 'STATE', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s4, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', v_d4, 'nFinalLines', 30, 'nRawFinalSeq', 7, 'cRawFinalHash', v_h4, 'jIncidents', '[]'));
    PERFORM pg_temp.smoke_expect('a repeated seal after the dismissal is still a no-op', (v_r ->> 'bAlready')::boolean AND v_r ->> 'cSyncState' = 'F', v_r);

    -- The held stream grows after the dismissal: the row reopens.
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s4, 'cKind', 'H', 'nOrphanid', v_orph, 'nBytes', 300));
    PERFORM pg_temp.smoke_expect('a repeat without growth keeps the dismissal',
        (v_r ->> 'bDuplicate')::boolean AND NOT (v_r ->> 'bReopened')::boolean AND v_r ->> 'cStatus' = 'D', v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s4, 'cKind', 'H', 'nOrphanid', v_orph,
        'dTo', '2026-10-01T10:07:00Z', 'nBytes', 500));
    PERFORM pg_temp.smoke_expect('growth after the dismissal reopens the row and counts to the caps',
        (v_r ->> 'bReopened')::boolean AND v_r ->> 'cStatus' = 'P' AND (v_r ->> 'nSessionHeldBytes')::bigint = 500
        AND (v_r ->> 'nTotalHeldBytes')::bigint >= 500, v_r);
    PERFORM pg_temp.smoke_expect('the reopen is audited and clears the resolution',
        EXISTS (SELECT 1 FROM public."RtEdgeEvent" WHERE "nSesid" = v_s4 AND "cType" = 'orphan_reopen' AND "jData" ->> 'cPrevStatus' = 'D')
        AND EXISTS (SELECT 1 FROM public."RtEdgeOrphan" WHERE "nOrphanid" = v_orph AND "nResolvedBy" IS NULL AND "dResolvedAt" IS NULL AND "cNote" IS NULL));
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s4), 2);
    PERFORM pg_temp.smoke_expect('gate: the reopened orphan blocks again', v_m -> 0 -> 0 ->> 'cReason' = 'PENDING_ORPHANS' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph, 'cStatus', 'D', 'cNote', 'resent again', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('a second dismissal appends its interval to the watermark',
        (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'F'
        AND v_r ->> 'cSealNote' = 'venue data missing 2026-10-01 11:00:00-11:05:00; 2026-10-01 11:00:00-11:07:00', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s4), 2);
    PERFORM pg_temp.smoke_expect('gate: forced again', v_m -> 0 -> 0 ->> 'cReason' = 'FORCED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    ----------------------------------------------------------------------
    -- 7b. Warning incidents -> W, the acknowledgement, addenda
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s7, 'nEdgeid', v_edge, 'nHearingOpid', v_cadmin, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind the warnings session', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s7, 'nMasterid', v_admin, 'cSealNote', 'too early'));
    PERFORM pg_temp.smoke_expect('forceseal refuses a live session', v_r ->> 'cCode' = 'STATE', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s7, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end the warnings session', (v_r ->> 'bPending')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s7, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', encode(sha256(convert_to('root-7', 'UTF8')), 'hex'), 'nFinalLines', 40, 'nRawFinalSeq', 11,
        'cRawFinalHash', encode(sha256(convert_to('raw-7', 'UTF8')), 'hex'), 'jIncidents', '[{"kind":"ABORTED_WINDOW"}]'));
    PERFORM pg_temp.smoke_expect('seal with a warning incident and no orphan -> W',
        (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'W' AND (v_r ->> 'nWarnings')::int = 1 AND (v_r ->> 'nPendingOrphans')::int = 0, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s7), 2);
    PERFORM pg_temp.smoke_expect('gate: W needs the acknowledgement',
        v_m -> 0 -> 0 ->> 'cReason' = 'NEEDS_ACK' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean AND (v_m -> 0 -> 0 ->> 'nWarnings')::int = 1, v_m);
    v_r := pg_temp.smoke_call('rtedge_warn_ack', jsonb_build_object('nSesid', v_s7, 'nMasterid', v_other));
    PERFORM pg_temp.smoke_expect('warn_ack refuses a plain member', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_warn_ack', jsonb_build_object('nSesid', v_s7, 'nMasterid', v_cadmin));
    PERFORM pg_temp.smoke_expect('warn_ack by the case admin', (v_r ->> 'msg')::int = 1 AND v_r ->> 'dWarnAckAt' IS NOT NULL AND NOT (v_r ->> 'bAlready')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_warn_ack', jsonb_build_object('nSesid', v_s7, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('warn_ack is idempotent', (v_r ->> 'bAlready')::boolean, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s7), 2);
    PERFORM pg_temp.smoke_expect('gate: acknowledged W publishes, no watermark',
        v_m -> 0 -> 0 ->> 'cReason' = 'ACKED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean AND NOT (v_m -> 0 -> 0 ->> 'bWatermark')::boolean, v_m);

    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s7, 'cKind', 'C', 'nOrphanid', v_orph3, 'nEdgeid', v_edge,
        'cPeer', '10.20.0.77', 'nFromSeq', 40, 'nToSeq', 60, 'nBytes', 40));
    PERFORM pg_temp.smoke_expect('a late held CAT connection after the seal', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cStatus' = 'P', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s7), 2);
    PERFORM pg_temp.smoke_expect('gate: it blocks the acknowledged session', v_m -> 0 -> 0 ->> 'cReason' = 'PENDING_ORPHANS', v_m);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph3, 'cStatus', 'A', 'nMasterid', v_other));
    PERFORM pg_temp.smoke_expect('addendum refuses a plain member', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph3, 'cStatus', 'A', 'nMasterid', v_cadmin));
    PERFORM pg_temp.smoke_expect('addendum by the hearing operator keeps W', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'W', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s7), 2);
    PERFORM pg_temp.smoke_expect('gate: acknowledged again after the addendum', v_m -> 0 -> 0 ->> 'cReason' = 'ACKED', v_m);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s7, 'cKind', 'C', 'nOrphanid', v_orph3, 'nEdgeid', v_edge,
        'nToSeq', 75, 'nBytes', 90));
    PERFORM pg_temp.smoke_expect('growth after the addendum reopens the row',
        (v_r ->> 'bReopened')::boolean AND v_r ->> 'cStatus' = 'P' AND (v_r ->> 'nSessionHeldBytes')::bigint = 90, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s7), 2);
    PERFORM pg_temp.smoke_expect('gate: the new bytes block publish', v_m -> 0 -> 0 ->> 'cReason' = 'PENDING_ORPHANS', v_m);
    v_r := pg_temp.smoke_call('rtedge_orphan_resolve', jsonb_build_object('nOrphanid', v_orph3, 'cStatus', 'A', 'nMasterid', v_cadmin));
    PERFORM pg_temp.smoke_expect('a new addendum resolves it', (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bAlready')::boolean, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s7), 2);
    PERFORM pg_temp.smoke_expect('gate: acknowledged W publishes again', v_m -> 0 -> 0 ->> 'cReason' = 'ACKED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    ----------------------------------------------------------------------
    -- 8. Cut-mode direct sessions (D29) and the legacy lane mark
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_direct', jsonb_build_object('nSesid', v_s6, 'cApply', 'C'));
    PERFORM pg_temp.smoke_expect('cut mode needs a parser version', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_direct', jsonb_build_object('nSesid', v_s6, 'cApply', 'C', 'cParserVer', 'smoke-1'));
    PERFORM pg_temp.smoke_expect('direct C -> gated L', v_r ->> 'cFeedSource' = 'D' AND v_r ->> 'cSyncState' = 'L', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_split', jsonb_build_object('nSesid', v_s6, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('split refuses a direct session', v_r ->> 'cCode' = 'STATE', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s6));
    PERFORM pg_temp.smoke_expect('cut-mode end is gated', (v_r ->> 'bGated')::boolean AND (v_r ->> 'bPending')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s6,
        'cFinalDigest', encode(sha256(convert_to('root-6', 'UTF8')), 'hex'), 'nFinalLines', 5, 'nRawFinalSeq', 3,
        'cRawFinalHash', encode(sha256(convert_to('raw-6', 'UTF8')), 'hex')));
    PERFORM pg_temp.smoke_expect('cut-mode seal without a box -> K', v_r ->> 'cSyncState' = 'K', v_r);

    v_r := pg_temp.smoke_call('rtedge_session_direct', jsonb_build_object('nSesid', v_s8, 'cApply', 'C', 'cParserVer', 'smoke-1'));
    PERFORM pg_temp.smoke_expect('second cut-mode session', v_r ->> 'cSyncState' = 'L', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s8));
    PERFORM pg_temp.smoke_expect('end it', (v_r ->> 'bPending')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s8,
        'cFinalDigest', encode(sha256(convert_to('root-8', 'UTF8')), 'hex'), 'nFinalLines', 6, 'nRawFinalSeq', 4,
        'cRawFinalHash', encode(sha256(convert_to('raw-8', 'UTF8')), 'hex'), 'jIncidents', '[{"kind":"CAT_DISCONNECT","level":"warning"}]'));
    PERFORM pg_temp.smoke_expect('CAT_DISCONNECT upgraded to warning level (G0) -> W',
        v_r ->> 'cSyncState' = 'W' AND (v_r ->> 'nWarnings')::int = 1 AND (v_r ->> 'nPendingOrphans')::int = 0, v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s8, 'cPurpose', 'X'), 2);
    PERFORM pg_temp.smoke_expect('gate: an unacknowledged W blocks export too', v_m -> 0 -> 0 ->> 'cReason' = 'NEEDS_ACK' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    v_m := pg_temp.smoke_multi('realtime.et_sessions_builder', jsonb_build_object('permission', 'N', 'cSessionUnicId', 'smoke-' || v_tag,
        'cCaseno', v_caseno, 'cName', 'Legacy lane', 'cProtocol', 'B', 'dStartDt', '2026-10-01 10:00:00', 'nDays', 1, 'nLines', 25,
        'nPageno', 1, 'nUserid', v_admin), 1);
    v_hs := (v_m -> 0 -> 0 ->> 'nSesid')::uuid;
    PERFORM pg_temp.smoke_expect('legacy venue lane sessions are marked H',
        EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_hs AND "cFeedSource" = 'H'), v_m);

    ----------------------------------------------------------------------
    -- 8b. D16: non-venue sessions end and publish as today
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s9, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end of a legacy (NULL feed) session: not gated, nothing changes',
        (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bGated')::boolean AND NOT (v_r ->> 'bChanged')::boolean
        AND NOT (v_r ->> 'bPending')::boolean AND v_r ->> 'cSyncState' IS NULL, v_r);
    PERFORM pg_temp.smoke_expect('the legacy row is untouched and nothing is audited',
        EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s9 AND "cStatus" = 'R' AND "cSyncState" IS NULL AND "cFeedSource" IS NULL)
        AND NOT EXISTS (SELECT 1 FROM public."RtEdgeEvent" WHERE "nSesid" = v_s9));
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s9, 'cPurpose', 'P'), 2);
    PERFORM pg_temp.smoke_expect('gate: a legacy session publishes (not gated)',
        v_m -> 0 -> 0 ->> 'cReason' = 'NOT_GATED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean
        AND NOT (v_m -> 0 -> 0 ->> 'bUploadPending')::boolean AND NOT (v_m -> 0 -> 0 ->> 'bWatermark')::boolean, v_m);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s9, 'cPurpose', 'X'), 2);
    PERFORM pg_temp.smoke_expect('gate: a legacy session exports, unstamped',
        v_m -> 0 -> 0 ->> 'cReason' = 'NOT_GATED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean AND NOT (v_m -> 0 -> 0 ->> 'bLiveStamp')::boolean, v_m);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_hs, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end of an H lane session: not gated, nothing changes',
        (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bGated')::boolean AND NOT (v_r ->> 'bChanged')::boolean AND v_r ->> 'cSyncState' IS NULL, v_r);
    PERFORM pg_temp.smoke_expect('the H row keeps its status',
        EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_hs AND "cStatus" = 'P' AND "cSyncState" IS NULL));
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_hs), 2);
    PERFORM pg_temp.smoke_expect('gate: an H lane session publishes', v_m -> 0 -> 0 ->> 'cReason' = 'NOT_GATED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_hs, 'cPurpose', 'X'), 2);
    PERFORM pg_temp.smoke_expect('gate: an H lane session exports', v_m -> 0 -> 0 ->> 'cReason' = 'NOT_GATED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    ----------------------------------------------------------------------
    -- 8c. Soft-deleted venue sessions still reach a terminal state
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s10, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind the session to delete', (v_r ->> 'msg')::int = 1, v_r);
    v_m := pg_temp.smoke_multi('realtime.et_sessions_builder', jsonb_build_object('permission', 'D', 'nSesid', v_s10), 1);
    PERFORM pg_temp.smoke_expect('delete it while live', (v_m -> 0 -> 0 ->> 'msg')::int = 1, v_m);
    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge), 5);
    PERFORM pg_temp.smoke_expect('the box gets op end for the deleted session',
        EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 2) e
                 WHERE e ->> 'nSesid' = v_s10::text AND e ->> 'cOp' = 'end' AND (e ->> 'bDeleted')::boolean), v_m);
    v_r := pg_temp.smoke_call('rtedge_applied', jsonb_build_object('nSesid', v_s10, 'nAppliedRawSeq', 4,
        'cAppliedRawHash', encode(sha256(convert_to('raw-10d', 'UTF8')), 'hex'), 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('its drained rounds still advance the watermark', (v_r ->> 'bAdvanced')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s10, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', encode(sha256(convert_to('root-10d', 'UTF8')), 'hex'), 'nFinalLines', 12, 'nRawFinalSeq', 4,
        'cRawFinalHash', encode(sha256(convert_to('raw-10d', 'UTF8')), 'hex'), 'jIncidents', '[]'));
    PERFORM pg_temp.smoke_expect('the box seals the deleted session', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'K', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s10), 2);
    PERFORM pg_temp.smoke_expect('gate: a deleted session never publishes', v_m -> 0 -> 0 ->> 'cCode' = 'NOT_FOUND' AND NOT (v_m -> 0 -> 0 ->> 'bOk')::boolean, v_m);

    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s11, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind a session whose box will never seal', (v_r ->> 'msg')::int = 1, v_r);
    v_m := pg_temp.smoke_multi('realtime.et_sessions_builder', jsonb_build_object('permission', 'D', 'nSesid', v_s11), 1);
    PERFORM pg_temp.smoke_expect('delete it while live too', (v_m -> 0 -> 0 ->> 'msg')::int = 1, v_m);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s11, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('a deleted session cannot be ended any more', v_r ->> 'cCode' = 'NOT_FOUND', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s11, 'nMasterid', v_admin, 'cSealNote', 'venue box lost; session deleted'));
    PERFORM pg_temp.smoke_expect('the super-admin force-closes it from L', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'F', v_r);
    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge), 5);
    PERFORM pg_temp.smoke_expect('both deleted sessions left the box''s list',
        NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 2) e WHERE e ->> 'nSesid' IN (v_s10::text, v_s11::text)), v_m);

    ----------------------------------------------------------------------
    -- 8d. Backstop: a session holding a dismissed orphan never seals K / W
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s12, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind the backstop session', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s12, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end it', (v_r ->> 'bPending')::boolean, v_r);
    -- Written directly on purpose: the SPs never dismiss before the seal.
    INSERT INTO public."RtEdgeOrphan" ("nSesid", "nEdgeid", "cKind", "cStatus", "cNote", "dFrom", "dTo", "nResolvedBy", "dResolvedAt")
    VALUES (v_s12, v_edge, 'H', 'D', 'smoke backstop', '2026-10-01T09:00:00Z', '2026-10-01T09:30:00Z', v_admin, now());
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s12, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', v_d12, 'nFinalLines', 8, 'nRawFinalSeq', 5, 'cRawFinalHash', v_h12, 'jIncidents', '[]'));
    PERFORM pg_temp.smoke_expect('seal with a dismissed orphan -> F, watermarked', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'F', v_r);
    PERFORM pg_temp.smoke_expect('the watermark names the dismissed interval',
        EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s12 AND "cSealNote" = 'venue data missing 2026-10-01 10:00:00-10:30:00'));
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s12), 2);
    PERFORM pg_temp.smoke_expect('gate: FORCED with the watermark', v_m -> 0 -> 0 ->> 'cReason' = 'FORCED' AND (v_m -> 0 -> 0 ->> 'bWatermark')::boolean, v_m);
    v_r := pg_temp.smoke_call('rtedge_session_seal', jsonb_build_object('nSesid', v_s12, 'nEdgeid', v_edge, 'nEpoch', 1,
        'cFinalDigest', v_d12, 'nFinalLines', 8, 'nRawFinalSeq', 5, 'cRawFinalHash', v_h12, 'jIncidents', '[]'));
    PERFORM pg_temp.smoke_expect('its repeated seal is a no-op', (v_r ->> 'bAlready')::boolean AND v_r ->> 'cSyncState' = 'F', v_r);

    ----------------------------------------------------------------------
    -- 8e. "Use direct cloud instead" (O-8, file 09): a never-fed 'E'
    --     session re-binds to 'D'; anything fed, held or ended does not
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s14, 'nEdgeid', v_edge, 'nHearingOpid', v_cadmin, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind the session to re-bind', (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'L', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s14, 'nEdgeid', 'not-a-box'));
    PERFORM pg_temp.smoke_expect('rebind_direct validates its ids', (v_r ->> 'msg')::int = -1 AND v_r ->> 'cCode' = 'INVALID', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s14, 'nEdgeid', gen_random_uuid()));
    PERFORM pg_temp.smoke_expect('rebind_direct refuses another box and changes nothing',
        v_r ->> 'cCode' = 'CONFLICT'
        AND EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s14 AND "cFeedSource" = 'E' AND "bEverEdge" AND "nEdgeid" = v_edge), v_r);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s14, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('rebind_direct: a never-fed E session becomes D, returning nSesid and nCaseid',
        (v_r ->> 'msg')::int = 1 AND v_r ->> 'nSesid' = v_s14::text AND v_r ->> 'nCaseid' = v_case::text, v_r);
    PERFORM pg_temp.smoke_expect('rebind_direct clears the edge binding, bEverEdge included (the documented exception)',
        EXISTS (SELECT 1 FROM public."RSessionMaster"
                 WHERE "nSesid" = v_s14 AND "cFeedSource" = 'D' AND "cApply" = 'L' AND "nEdgeid" IS NULL AND NOT "bEverEdge"
                   AND "cSyncState" IS NULL AND "nIngestEpoch" = 1 AND "nRebaseSeq" IS NULL AND "nAppliedRawSeq" IS NULL
                   AND "cAppliedRawHash" IS NULL AND "cStatus" = 'R' AND "dDelDt" IS NULL));
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s14, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('a repeated rebind_direct is a CONFLICT (no longer E)', v_r ->> 'cCode' = 'CONFLICT', v_r);
    v_m := pg_temp.smoke_multi('rt_transcript_completeness', jsonb_build_object('nSesid', v_s14), 2);
    PERFORM pg_temp.smoke_expect('gate: the re-bound session publishes as today (not gated, no seal awaited)',
        v_m -> 0 -> 0 ->> 'cReason' = 'NOT_GATED' AND (v_m -> 0 -> 0 ->> 'bOk')::boolean AND NOT (v_m -> 0 -> 0 ->> 'bUploadPending')::boolean, v_m);
    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge), 5);
    PERFORM pg_temp.smoke_expect('the re-bound session left the box''s list',
        NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 2) e WHERE e ->> 'nSesid' = v_s14::text), v_m);

    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s15, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind a session that gets fed', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_applied', jsonb_build_object('nSesid', v_s15, 'nAppliedRawSeq', 1,
        'cAppliedRawHash', encode(sha256(convert_to('raw-15', 'UTF8')), 'hex'), 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('one round applied', (v_r ->> 'bAdvanced')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s15, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('rebind_direct refuses a fed session (split instead)',
        v_r ->> 'cCode' = 'CONFLICT' AND EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s15 AND "cFeedSource" = 'E' AND "bEverEdge"), v_r);

    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s16, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind a session whose direct stream is held', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s16, 'cKind', 'H', 'cPeer', '198.51.100.16', 'nBytes', 16));
    PERFORM pg_temp.smoke_expect('held stream recorded', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s16, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('rebind_direct refuses a session holding an orphan', v_r ->> 'cCode' = 'CONFLICT', v_r);

    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s12, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('rebind_direct refuses a sealed session', v_r ->> 'cCode' = 'CONFLICT', v_r);

    -- Close both refused sessions so the revoke below finds no unsealed live session.
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s15, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end the fed session', (v_r ->> 'bPending')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s15, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('rebind_direct refuses an ended session (S)', v_r ->> 'cCode' = 'CONFLICT', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s15, 'nMasterid', v_admin, 'cSealNote', 'smoke'));
    PERFORM pg_temp.smoke_expect('force-close the fed session', v_r ->> 'cSyncState' = 'F', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_end', jsonb_build_object('nSesid', v_s16, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('end the held session', (v_r ->> 'bPending')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s16, 'nMasterid', v_admin, 'cSealNote', 'smoke'));
    PERFORM pg_temp.smoke_expect('force-close the held session', v_r ->> 'cSyncState' = 'F' AND (v_r ->> 'nDismissedOrphans')::int = 1, v_r);

    ----------------------------------------------------------------------
    -- 9. Quarantine, revoke, audit, anchors
    ----------------------------------------------------------------------
    v_r := pg_temp.smoke_call('rtedge_quarantine', jsonb_build_object('nEdgeid', v_edge, 'cAction', 'Q', 'cNote', 'new ASN'));
    PERFORM pg_temp.smoke_expect('system quarantine', (v_r ->> 'bChanged')::boolean AND v_r ->> 'cStatus' = 'Q', v_r);
    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge), 5);
    PERFORM pg_temp.smoke_expect('a quarantined box gets no assignments',
        v_m -> 0 -> 0 ->> 'cCode' = 'QUARANTINED' AND jsonb_array_length(v_m -> 2) = 0 AND jsonb_array_length(v_m -> 3) = 0, v_m);
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s5, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind refuses a quarantined box', v_r ->> 'cCode' = 'QUARANTINED', v_r);
    v_r := pg_temp.smoke_call('rtedge_quarantine', jsonb_build_object('nEdgeid', v_edge, 'cAction', 'A', 'nMasterid', v_other));
    PERFORM pg_temp.smoke_expect('re-approval is admin only', (v_r ->> 'msg')::int = -3, v_r);
    v_r := pg_temp.smoke_call('rtedge_quarantine', jsonb_build_object('nEdgeid', v_edge, 'cAction', 'A', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('re-approved', v_r ->> 'cStatus' = 'A', v_r);

    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s13, 'nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('bind a session before the revoke', (v_r ->> 'msg')::int = 1, v_r);
    v_m := pg_temp.smoke_multi('realtime.et_sessions_builder', jsonb_build_object('permission', 'D', 'nSesid', v_s13), 1);
    PERFORM pg_temp.smoke_expect('delete it while live', (v_m -> 0 -> 0 ->> 'msg')::int = 1, v_m);
    v_r := pg_temp.smoke_call('rtedge_session_rebind_direct', jsonb_build_object('nSesid', v_s13, 'nEdgeid', v_edge));
    PERFORM pg_temp.smoke_expect('rebind_direct refuses a deleted (live, never-fed) session',
        v_r ->> 'cCode' = 'CONFLICT' AND EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_s13 AND "cFeedSource" = 'E' AND "cSyncState" = 'L'), v_r);
    v_r := pg_temp.smoke_call('rtedge_revoke', jsonb_build_object('nEdgeid', v_edge, 'nMasterid', v_admin, 'cNote', 'smoke'));
    PERFORM pg_temp.smoke_expect('revoke -> X, listing the deleted unsealed session for a forced close',
        v_r ->> 'cStatus' = 'X' AND NOT (v_r ->> 'bAlready')::boolean AND (v_r ->> 'nUnsealed')::int = 0
        AND (v_r ->> 'nUnsealedDeleted')::int = 1 AND (v_r -> 'jUnsealedDeleted') ? v_s13::text, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_forceseal', jsonb_build_object('nSesid', v_s13, 'nMasterid', v_admin, 'cSealNote', 'venue box revoked'));
    PERFORM pg_temp.smoke_expect('it is force-closed', v_r ->> 'cSyncState' = 'F', v_r);
    v_r := pg_temp.smoke_call('rtedge_revoke', jsonb_build_object('nEdgeid', v_edge, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('revoke is idempotent', (v_r ->> 'bAlready')::boolean AND (v_r ->> 'nUnsealedDeleted')::int = 0, v_r);
    v_r := pg_temp.smoke_call('rtedge_enroll_code', jsonb_build_object('nEdgeid', v_edge, 'nMasterid', v_admin,
                                                                       'cEnrollHash', encode(sha256(convert_to('rtedge-smoke-code-2', 'UTF8')), 'hex')));
    PERFORM pg_temp.smoke_expect('no enrollment code for a revoked box', v_r ->> 'cCode' = 'REVOKED', v_r);

    v_r := pg_temp.smoke_call('rtedge_event_insert', jsonb_build_object('cType', 'Bad Type'));
    PERFORM pg_temp.smoke_expect('event type is validated', (v_r ->> 'msg')::int = -1, v_r);
    v_r := pg_temp.smoke_call('rtedge_event_insert', jsonb_build_object('cType', 'opcode_issue', 'nEdgeid', v_edge,
                                                                        'jData', '{"dDay":"2026-10-01"}', 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('event recorded', (v_r ->> 'msg')::int = 1 AND v_r ->> 'nId' IS NOT NULL, v_r);
    v_r := pg_temp.smoke_call('rtedge_anchor_ids', jsonb_build_object('nSesid', v_s1));
    PERFORM pg_temp.smoke_expect('anchor ids of a session without marks: none', v_r IS NULL, v_r);

    ----------------------------------------------------------------------
    -- 10. Review fixes (file 10)
    ----------------------------------------------------------------------
    -- #12: bind reads the box row FOR SHARE (serialises with revoke / quarantine / case_set, which lock it FOR UPDATE).
    v_def := pg_get_functiondef('public.et_rtedge_session_bind(json, refcursor)'::regprocedure);
    PERFORM pg_temp.smoke_expect('#12 bind reads the box row FOR SHARE, after locking the session',
        position('FROM public."RtEdgeNode" WHERE "nEdgeid" = v_edge AND "dDelDt" IS NULL FOR SHARE' IN v_def) > 0
        AND position('FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE' IN v_def)
            < position('FROM public."RtEdgeNode" WHERE "nEdgeid" = v_edge AND "dDelDt" IS NULL FOR SHARE' IN v_def));
    -- #11 / #13: orphan_insert locks the session row before reading bEverEdge or the orphan row.
    v_def := pg_get_functiondef('public.et_rtedge_orphan_insert(json, refcursor)'::regprocedure);
    PERFORM pg_temp.smoke_expect('#11/#13 orphan_insert locks the session row (FOR NO KEY UPDATE) before bEverEdge and the orphan row',
        position('WHERE "nSesid" = v_ses FOR NO KEY UPDATE' IN v_def) > 0
        AND position('WHERE "nSesid" = v_ses FOR NO KEY UPDATE' IN v_def) < position('v_row."bEverEdge" OR' IN v_def)
        AND position('WHERE "nSesid" = v_ses FOR NO KEY UPDATE' IN v_def) < position('WHERE "nOrphanid" = v_oid FOR UPDATE' IN v_def));
    -- #11: rebind_direct locks the session row, then checks orphans in their own statement, then updates.
    v_def := pg_get_functiondef('public.et_rtedge_session_rebind_direct(json, refcursor)'::regprocedure);
    PERFORM pg_temp.smoke_expect('#11 rebind_direct locks the session FOR UPDATE, then checks orphans, then updates',
        position('WHERE "nSesid" = v_ses FOR UPDATE' IN v_def) > 0
        AND position('WHERE "nSesid" = v_ses FOR UPDATE' IN v_def) < position('EXISTS (SELECT 1 FROM public."RtEdgeOrphan" o WHERE o."nSesid" = v_ses)' IN v_def)
        AND position('EXISTS (SELECT 1 FROM public."RtEdgeOrphan" o WHERE o."nSesid" = v_ses)' IN v_def) < position('UPDATE public."RSessionMaster" r' IN v_def));

    -- G5: a confirmed box that never reported a parser version takes a session; the first hello pins it.
    v_r := pg_temp.smoke_call('rtedge_create', jsonb_build_object('nMasterid', v_admin, 'cName', 'Smoke box 2', 'cEnrollHash', v_code2));
    PERFORM pg_temp.smoke_expect('create a second box', (v_r ->> 'msg')::int = 1, v_r);
    v_edge2 := (v_r ->> 'nEdgeid')::uuid;
    v_r := pg_temp.smoke_call('rtedge_enroll', jsonb_build_object('cEnrollHash', v_code2, 'cPubKey', v_key2));
    PERFORM pg_temp.smoke_expect('enrol it without a parser version', v_r ->> 'cStatus' = 'C' AND v_r ->> 'cKeyFpr' = v_fpr2, v_r);
    v_r := pg_temp.smoke_call('rtedge_confirm_key', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge2, 'cKeyFpr', v_fpr2));
    PERFORM pg_temp.smoke_expect('confirm it (A)', v_r ->> 'cStatus' = 'A', v_r);
    v_r := pg_temp.smoke_call('rtedge_case_set', jsonb_build_object('nMasterid', v_admin, 'nEdgeid', v_edge2, 'nCaseid', v_case, 'permission', 'I'));
    PERFORM pg_temp.smoke_expect('assign the case to it', (v_r ->> 'bAssigned')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s17, 'nEdgeid', v_edge2, 'nHearingOpid', v_cadmin, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('G5 bind before the box reported a parser version: L, cParserVer pending',
        (v_r ->> 'msg')::int = 1 AND v_r ->> 'cSyncState' = 'L' AND v_r ->> 'cParserVer' IS NULL AND (v_r ->> 'bParserPending')::boolean, v_r);
    PERFORM pg_temp.smoke_expect('G5 the bind event says the version is pending, and names the creator',
        EXISTS (SELECT 1 FROM public."RtEdgeEvent" e WHERE e."nSesid" = v_s17 AND e."cType" = 'bind'
                   AND (e."jData" ->> 'bParserPending')::boolean AND e."nByUser" = v_admin));
    v_r := pg_temp.smoke_call('rtedge_session_parser_pin', jsonb_build_object('nSesid', v_s17, 'nEdgeid', v_edge2));
    PERFORM pg_temp.smoke_expect('G5 parser_pin needs a version', v_r ->> 'cCode' = 'INVALID', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_parser_pin', jsonb_build_object('nSesid', v_s17, 'nEdgeid', v_edge, 'cParserVer', 'smoke-2'));
    PERFORM pg_temp.smoke_expect('G5 parser_pin refuses another box', v_r ->> 'cCode' = 'NOT_BOUND', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_parser_pin', jsonb_build_object('nSesid', v_s17, 'nEdgeid', v_edge2, 'cParserVer', 'smoke-2'));
    PERFORM pg_temp.smoke_expect('G5 the first hello pins the box''s version',
        (v_r ->> 'msg')::int = 1 AND (v_r ->> 'bPinned')::boolean AND v_r ->> 'cParserVer' = 'smoke-2', v_r);
    v_r := pg_temp.smoke_call('rtedge_session_parser_pin', jsonb_build_object('nSesid', v_s17, 'nEdgeid', v_edge2, 'cParserVer', 'smoke-3'));
    PERFORM pg_temp.smoke_expect('G5 a pinned version never changes (the service freezes on a mismatch)',
        (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bPinned')::boolean AND v_r ->> 'cParserVer' = 'smoke-2', v_r);
    PERFORM pg_temp.smoke_expect('G5 one parser_pin event',
        (SELECT count(*) FROM public."RtEdgeEvent" e WHERE e."nSesid" = v_s17 AND e."cType" = 'parser_pin') = 1);
    v_m := pg_temp.smoke_multi('rtedge_assignments', jsonb_build_object('nEdgeid', v_edge2), 5);
    PERFORM pg_temp.smoke_expect('G5 the box''s pull carries the pinned version',
        EXISTS (SELECT 1 FROM jsonb_array_elements(v_m -> 2) e WHERE e ->> 'nSesid' = v_s17::text AND e ->> 'cParserVer' = 'smoke-2'), v_m);

    -- #13 (sequential form): a repeated report of one nOrphanid extends its row.
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s17, 'cKind', 'H', 'nOrphanid', v_orph4, 'nBytes', 0));
    PERFORM pg_temp.smoke_expect('#13 held stream opened', (v_r ->> 'msg')::int = 1 AND NOT (v_r ->> 'bDuplicate')::boolean, v_r);
    v_r := pg_temp.smoke_call('rtedge_orphan_insert', jsonb_build_object('nSesid', v_s17, 'cKind', 'H', 'nOrphanid', v_orph4, 'nBytes', 70,
                                                                          'cSha256', repeat('c', 64), 'dTo', '2026-10-01T10:05:00Z'));
    PERFORM pg_temp.smoke_expect('#13 its close extends the same row (bytes, hash, end)',
        (v_r ->> 'bDuplicate')::boolean AND (v_r ->> 'nBytes')::bigint = 70
        AND EXISTS (SELECT 1 FROM public."RtEdgeOrphan" WHERE "nOrphanid" = v_orph4 AND "cSha256" = repeat('c', 64) AND "dTo" IS NOT NULL), v_r);

    -- #15: a re-enrol keeps the replaced key in the audit trail.
    v_r := pg_temp.smoke_call('rtedge_enroll_code', jsonb_build_object('nEdgeid', v_edge2, 'nMasterid', v_admin, 'cEnrollHash', v_code3));
    PERFORM pg_temp.smoke_expect('#15 new enrolment code for the active box', (v_r ->> 'msg')::int = 1, v_r);
    v_r := pg_temp.smoke_call('rtedge_enroll', jsonb_build_object('cEnrollHash', v_code3, 'cPubKey', v_key3, 'cParserVer', 'smoke-2'));
    PERFORM pg_temp.smoke_expect('#15 re-enrol with a new key -> C', v_r ->> 'cStatus' = 'C' AND v_r ->> 'cKeyFpr' = v_fpr3, v_r);
    PERFORM pg_temp.smoke_expect('#15 the reenroll event keeps the replaced key (cPrevPubKey, cPrevKeyFpr, bPrevTpmKey)',
        EXISTS (SELECT 1 FROM public."RtEdgeEvent" e
                 WHERE e."nEdgeid" = v_edge2 AND e."cType" = 'reenroll'
                   AND e."jData" ->> 'cPrevPubKey' = v_key2 AND e."jData" ->> 'cPrevKeyFpr' = v_fpr2
                   AND e."jData" ->> 'cKeyFpr' = v_fpr3 AND NOT (e."jData" ->> 'bPrevTpmKey')::boolean));
    PERFORM pg_temp.smoke_expect('#15 a first enrolment has no previous key',
        EXISTS (SELECT 1 FROM public."RtEdgeEvent" e
                 WHERE e."nEdgeid" = v_edge2 AND e."cType" = 'enroll' AND e."jData" -> 'cPrevPubKey' = 'null'::jsonb));
    -- #12 (sequential form): the box awaiting its new key's confirmation takes no session.
    v_r := pg_temp.smoke_call('rtedge_session_bind', jsonb_build_object('nSesid', v_s18, 'nEdgeid', v_edge2, 'nMasterid', v_admin));
    PERFORM pg_temp.smoke_expect('#12 bind refuses a box that is not active (C)', v_r ->> 'cCode' = 'NOT_ACTIVE', v_r);

    RAISE NOTICE 'rt_edge smoke test: all checks passed';
END
$smoke$;

ROLLBACK;
