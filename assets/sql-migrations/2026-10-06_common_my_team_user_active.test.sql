-- 2026-10-06_common_my_team_user_active.test.sql
--
-- Regression check for 2026-10-06_common_my_team_user_active.sql (D3): a deactivated member (TeamRelation.cStatus
-- <> 'A') is listed to nobody and sees nobody on the case; active members, role or not, list each other as before;
-- never another team. Throwaway case in ONE transaction, asserts, ROLLS BACK. Fails on the roleless body
-- ("deactivated member still listed"). Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'common_my_team_user_active test: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

CREATE FUNCTION pg_temp.team_for(p_user uuid, p_case uuid) RETURNS TABLE ("nUserid" uuid, "cRole" text, "isAdmin" boolean) LANGUAGE plpgsql AS $f$
DECLARE c1 refcursor := 'actest_c1'; rec record;
BEGIN
    PERFORM public.et_common_my_team_user(json_build_object('nCaseid', p_case, 'nMasterid', p_user), c1);
    LOOP
        FETCH c1 INTO rec;
        EXIT WHEN NOT FOUND;
        "nUserid" := rec."nUserid"; "cRole" := rec."cRole"; "isAdmin" := rec."isAdmin";
        RETURN NEXT;
    END LOOP;
    CLOSE c1;
END
$f$;

DO $t$
DECLARE
    v_case uuid := gen_random_uuid();
    v_ta uuid := gen_random_uuid(); v_tb uuid := gen_random_uuid();
    v_a_role uuid := gen_random_uuid();   -- team A, active, has a role
    v_a_none uuid := gen_random_uuid();   -- team A, active, NO role
    v_a_off uuid := gen_random_uuid();    -- team A, DEACTIVATED (cStatus 'D')
    v_b_none uuid := gen_random_uuid();   -- team B, active, no role
    v_role uuid;
    n int;
BEGIN
    SELECT "nRoleid" INTO v_role FROM "RoleMaster" WHERE "nSrno" <> 1 ORDER BY "nSrno" LIMIT 1;
    IF v_role IS NULL THEN SELECT "nRoleid" INTO v_role FROM "RoleMaster" LIMIT 1; END IF;
    INSERT INTO public."UserMaster" ("nUserid", "cFname", "isAdmin") VALUES
        (v_a_role, 'actest a-role', false), (v_a_none, 'actest a-none', false),
        (v_a_off, 'actest a-off', false), (v_b_none, 'actest b-none', false);
    INSERT INTO public."TeamRelation" ("nCaseid", "nTeamid", "nUserid", "nRoleid", "cStatus") VALUES
        (v_case, v_ta, v_a_role, v_role, 'A'), (v_case, v_ta, v_a_none, NULL, 'A'),
        (v_case, v_ta, v_a_off, v_role, 'D'), (v_case, v_tb, v_b_none, NULL, 'A');

    -- active members of team A list each other (role or not) and never the deactivated one
    SELECT count(*) INTO n FROM pg_temp.team_for(v_a_role, v_case);
    IF n <> 2 THEN RAISE EXCEPTION 'FAIL team A list has % rows, expected 2 (active only)', n; END IF;
    SELECT count(*) INTO n FROM pg_temp.team_for(v_a_role, v_case) t WHERE t."nUserid" = v_a_off;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL deactivated member still listed'; END IF;
    SELECT count(*) INTO n FROM pg_temp.team_for(v_a_none, v_case) t WHERE t."nUserid" = v_a_role;
    IF n <> 1 THEN RAISE EXCEPTION 'FAIL role-less active member lost a teammate'; END IF;
    -- the deactivated member sees nobody on this case
    SELECT count(*) INTO n FROM pg_temp.team_for(v_a_off, v_case);
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL deactivated member still sees % teammates', n; END IF;
    -- never another team
    SELECT count(*) INTO n FROM pg_temp.team_for(v_a_role, v_case) t WHERE t."nUserid" = v_b_none;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL another team''s member listed'; END IF;
    SELECT count(*) INTO n FROM pg_temp.team_for(v_b_none, v_case);
    IF n <> 1 THEN RAISE EXCEPTION 'FAIL team B list has % rows, expected 1', n; END IF;

    RAISE NOTICE 'PASS common_my_team_user_active: team A lists % active members, the deactivated one is hidden both ways', 2;
END
$t$;

ROLLBACK;
