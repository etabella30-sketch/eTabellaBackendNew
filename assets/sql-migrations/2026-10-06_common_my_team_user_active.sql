-- 2026-10-06_common_my_team_user_active.sql
--
-- Decision D3 of the shared-libraries plan (2026-10-06, approved): a deactivated member of a case is on no team.
-- TeamRelation.cStatus is 'A' while a member is active on the case; the per-case user switch (coreapi
-- POST permission/usermanage -> et_pm_user_statusmanage) sets another value to deactivate them. Until now the team
-- lists (coreapi GET common/myteamusers: Case Home team list, the Fact "Share with my team" picker; realtime-server
-- GET factsheet/teamusers, also relayed by the venue box) still listed deactivated members, and a deactivated caller
-- still saw their old team, while the fact create gates (coreapi FACT_CREATE_ACCESS_SQL, realtime-server
-- FACT_CREATE_TARGET_SQL) already required cStatus = 'A'.
--
-- Fix: the roster keeps active rows only, on both sides: the caller's team subquery and the listed members. The
-- shared rule in libs/permissions/src/team-scope.ts (CALLER_TEAMS_SQL / OUTSIDE_CALLER_TEAMS_SQL) changes the same
-- way in the same commit, so a share to a deactivated member is refused as cross_team_recipient. Everything else
-- (LEFT JOIN "RoleMaster" of 2026-10-06_common_my_team_user_roleless, columns, order) is unchanged. Same signature:
-- CREATE OR REPLACE, no restart.
--
-- Apply to dev etabella_tech_uuid only (guard below). Idempotent. Prod is the operator's.
-- Check: 2026-10-06_common_my_team_user_active.test.sql (fixtures in a transaction, rolled back).
-- Undo: 2026-10-06_common_my_team_user_active.down.sql (the roleless body).

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'common_my_team_user_active: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.et_common_my_team_user(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    nTeamid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    -- select * from "RoleMaster"

    -- 2026-09-14: + cEmail / nRoleid / cRole / nTeamid / cTeamname / cClr for
    -- Case Home's "Team users" list; the team lookup tolerates a caller who
    -- sits in more than one team of the case. Existing columns unchanged.
    -- 2026-10-06: LEFT JOIN "RoleMaster" so a member with no role on the case
    -- is still listed to their own team (nRoleid / cRole NULL, isAdmin false).
    -- 2026-10-06 (D3): active rows only ("cStatus" = 'A') on both sides: a
    -- deactivated member is listed to nobody and sees nobody on this case.
    OPEN ref1 FOR
    SELECT u."nUserid", u."cFname", u."cLname", u."cProfile",
           case when u."isAdmin" or rm."nSrno" = 1 then true else false end "isAdmin",
           u."cEmail", tr."nRoleid", rm."cRole", tr."nTeamid", tm."cTeamname", tm."cClr"
    FROM "UserMaster" u
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid" AND tr."cStatus" = 'A'
    LEFT JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
    LEFT JOIN "TeamMaster" tm ON tm."nTeamid" = tr."nTeamid"
    WHERE tr."nTeamid" IN (
        SELECT "nTeamid"
        FROM "TeamRelation"
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid AND "cStatus" = 'A'
    )
    ORDER BY u."cFname", u."cLname";

    RETURN NEXT ref1;
END;
$function$;

COMMIT;
