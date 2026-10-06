-- 2026-10-06_qmark_handler_complete.test.sql
--
-- Regression check for 2026-10-06_qmark_handler_complete.sql: an insert through realtime.et_qmark_handler leaves a
-- RHighlights row WITH its RHighlightMapid row and jCordinates and answers pageData; a delete removes the row. Uses
-- an existing session of dev (ids only), everything in ONE transaction, ROLLS BACK. Fails on the bare body ("no map
-- row"). Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'qmark_handler_complete test: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

DO $t$
DECLARE
    v_case uuid; v_ses uuid; v_user uuid; v_iid uuid;
    v_hid uuid; n int; v_coord jsonb; v_page jsonb;
    c refcursor := 'qmtest_c'; rec record;
BEGIN
    SELECT r."nCaseid", r."nSesid" INTO v_case, v_ses FROM "RSessionMaster" r WHERE r."dDelDt" IS NULL ORDER BY r."nSesid" LIMIT 1;
    SELECT u."nUserid" INTO v_user FROM "UserMaster" u ORDER BY u."nUserid" LIMIT 1;
    SELECT i."nIid" INTO v_iid FROM "RIssueMaster" i WHERE i."nCaseid" = v_case ORDER BY i."nIid" LIMIT 1;
    IF v_case IS NULL OR v_user IS NULL THEN RAISE EXCEPTION 'SKIP no session or user on this database'; END IF;

    PERFORM realtime.et_qmark_handler(json_build_object(
        'nCaseid', v_case, 'nSessionid', v_ses, 'nUserid', v_user, 'cNote', 'qmtest note', 'cTime', '10:11:12:13',
        'cPageno', '7', 'cLineno', '3', 'cTranscript', 'N', 'oP', 7, 'oL', 3, 'identity', 'qmtest-id',
        'nLID', v_iid, 'permission', 'I'), c);
    FETCH c INTO rec;
    CLOSE c;
    IF rec.msg <> 1 OR rec."nHid" IS NULL THEN RAISE EXCEPTION 'FAIL insert answered msg % nHid %', rec.msg, rec."nHid"; END IF;
    v_hid := rec."nHid";
    v_page := rec."pageData";
    IF v_page IS NULL THEN RAISE EXCEPTION 'FAIL insert answered no pageData'; END IF;

    IF v_iid IS NOT NULL THEN
        SELECT count(*) INTO n FROM "RHighlightMapid" m WHERE m."nHid" = v_hid AND m."nIid" = v_iid;
        IF n <> 1 THEN RAISE EXCEPTION 'FAIL no map row for the new quick mark (got %)', n; END IF;
    END IF;
    SELECT h."jCordinates" INTO v_coord FROM "RHighlights" h WHERE h."nHid" = v_hid;
    IF v_coord IS NULL OR jsonb_typeof(v_coord) <> 'array' OR (v_coord->0->>'text') <> 'qmtest note' OR (v_coord->0->>'t') <> '10:11:12:13' THEN
        RAISE EXCEPTION 'FAIL jCordinates not written as [{t, text, ...}]: %', v_coord;
    END IF;

    PERFORM realtime.et_qmark_handler(json_build_object('nHid', v_hid, 'cTranscript', 'N', 'permission', 'D'), c);
    FETCH c INTO rec;
    CLOSE c;
    IF rec.msg <> 1 THEN RAISE EXCEPTION 'FAIL delete answered msg %', rec.msg; END IF;
    SELECT count(*) INTO n FROM "RHighlights" h WHERE h."nHid" = v_hid;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL quick mark still there after delete'; END IF;

    RAISE NOTICE 'PASS qmark_handler_complete: insert wrote map row + jCordinates + pageData, delete removed the row';
END
$t$;

ROLLBACK;
