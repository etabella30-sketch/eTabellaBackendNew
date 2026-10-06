-- 2026-10-06_common_my_team_user_active.down.sql
--
-- Undo of 2026-10-06_common_my_team_user_active.sql: the roleless body of 2026-10-06_common_my_team_user_roleless
-- (no cStatus test). Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'common_my_team_user_active down: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
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
    OPEN ref1 FOR
    SELECT u."nUserid", u."cFname", u."cLname", u."cProfile",
           case when u."isAdmin" or rm."nSrno" = 1 then true else false end "isAdmin",
           u."cEmail", tr."nRoleid", rm."cRole", tr."nTeamid", tm."cTeamname", tm."cClr"
    FROM "UserMaster" u
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid"
    LEFT JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
    LEFT JOIN "TeamMaster" tm ON tm."nTeamid" = tr."nTeamid"
    WHERE tr."nTeamid" IN (
        SELECT "nTeamid"
        FROM "TeamRelation"
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid
    )
    ORDER BY u."cFname", u."cLname";

    RETURN NEXT ref1;
END;
$function$;

COMMIT;
