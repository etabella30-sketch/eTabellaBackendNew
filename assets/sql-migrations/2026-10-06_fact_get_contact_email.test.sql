-- 2026-10-06_fact_get_contact_email.test.sql
--
-- Regression check for 2026-10-06_fact_get_contact_email.sql: realtime.et_fact_get_contact answers cEmail next to
-- the realtime-only columns. Uses an existing FMContact row of dev (ids only), ONE transaction, ROLLS BACK. Fails
-- on the old body ("column cEmail does not exist" when read). Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'fact_get_contact_email test: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

DO $t$
DECLARE
    v_fsid uuid; v_contact uuid; v_email text; got_email text; got_tag text; n int;
    c refcursor := 'fctest_c'; rec record;
BEGIN
    SELECT fc."nFSid", fc."nContactid" INTO v_fsid, v_contact FROM "FMContact" fc ORDER BY fc."nFMCid" LIMIT 1;
    IF v_fsid IS NULL THEN RAISE EXCEPTION 'SKIP no FMContact row on this database'; END IF;
    UPDATE "ContactMaster" SET "cEmail" = 'fctest@example.test' WHERE "nContactid" = v_contact;

    PERFORM realtime.et_fact_get_contact(json_build_object('nFSid', v_fsid), c);
    n := 0;
    LOOP
        FETCH c INTO rec;
        EXIT WHEN NOT FOUND;
        n := n + 1;
        IF rec."nContactid" = v_contact THEN got_email := rec."cEmail"; got_tag := rec."cMentiontag"; END IF;
    END LOOP;
    CLOSE c;
    IF n < 1 THEN RAISE EXCEPTION 'FAIL no contact rows for fact %', v_fsid; END IF;
    IF got_email IS DISTINCT FROM 'fctest@example.test' THEN RAISE EXCEPTION 'FAIL cEmail not answered (got %)', got_email; END IF;

    RAISE NOTICE 'PASS fact_get_contact_email: % contact rows, cEmail present beside cMentiontag', n;
END
$t$;

ROLLBACK;
