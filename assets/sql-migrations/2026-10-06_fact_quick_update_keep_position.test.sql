-- 2026-10-06_fact_quick_update_keep_position.test.sql
--
-- Regression check for 2026-10-06_fact_quick_update_keep_position.sql: a quick update without nPage / nLine keeps
-- the stored position; one with them replaces it. Uses an existing FactDetail row of dev inside ONE transaction and
-- ROLLS BACK. Fails on the old body ("position wiped"). Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'fact_quick_update_keep_position test: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

DO $t$
DECLARE
    v_fsid uuid; v_color uuid; p int; l int; v_texts jsonb;
    c refcursor := 'qutest_c'; rec record;
BEGIN
    SELECT d."nFSid", d."nColorid", d."jTexts" INTO v_fsid, v_color, v_texts
      FROM "FactDetail" d WHERE d."nPage" IS NOT NULL AND d."nLine" IS NOT NULL ORDER BY d."nFSid" LIMIT 1;
    IF v_fsid IS NULL THEN RAISE EXCEPTION 'SKIP no positioned FactDetail row on this database'; END IF;
    UPDATE "FactDetail" SET "nPage" = 41, "nLine" = 17 WHERE "nFSid" = v_fsid;

    -- without nPage / nLine: the position stays
    PERFORM realtime.et_fact_quick_update(json_build_object('nFSid', v_fsid, 'nColorid', v_color, 'jTexts', coalesce(v_texts, '[]'::jsonb)::text,
        'jIssue', '[]', 'jContacts', '[]', 'cIsNote', 'N'), c);
    FETCH c INTO rec; CLOSE c;
    IF rec.msg <> 1 THEN RAISE EXCEPTION 'FAIL quick update answered msg %', rec.msg; END IF;
    SELECT d."nPage", d."nLine" INTO p, l FROM "FactDetail" d WHERE d."nFSid" = v_fsid;
    IF p IS DISTINCT FROM 41 OR l IS DISTINCT FROM 17 THEN RAISE EXCEPTION 'FAIL position wiped: nPage % nLine %', p, l; END IF;

    -- with nPage / nLine: the position moves
    PERFORM realtime.et_fact_quick_update(json_build_object('nFSid', v_fsid, 'nColorid', v_color, 'jTexts', coalesce(v_texts, '[]'::jsonb)::text,
        'jIssue', '[]', 'jContacts', '[]', 'cIsNote', 'N', 'nPage', 5, 'nLine', 9), c);
    FETCH c INTO rec; CLOSE c;
    SELECT d."nPage", d."nLine" INTO p, l FROM "FactDetail" d WHERE d."nFSid" = v_fsid;
    IF p IS DISTINCT FROM 5 OR l IS DISTINCT FROM 9 THEN RAISE EXCEPTION 'FAIL position not updated: nPage % nLine %', p, l; END IF;

    RAISE NOTICE 'PASS fact_quick_update_keep_position: absent nPage/nLine kept 41/17, sent ones moved to 5/9';
END
$t$;

ROLLBACK;
