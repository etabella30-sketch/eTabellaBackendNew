-- 2026-09-14_home_bundle_sizes_team_users.down.sql
-- Drops et_case_bundle_sizes and restores the pre-migration
-- et_common_my_team_user body (as dumped from etabella_tech_uuid on 2026-09-14).

-- Safety guard: refuse to run against prod by accident (apply to dev etabella_tech_uuid first).
DO $guard$
BEGIN
    IF current_database() = 'etabella.com.uuid' THEN
        RAISE EXCEPTION 'Refusing to run on prod database % - apply via the release runbook', current_database();
    END IF;
END
$guard$;

BEGIN;

DROP FUNCTION IF EXISTS public.et_case_bundle_sizes(json, refcursor);

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


    OPEN ref1 FOR
    SELECT u."nUserid", u."cFname", u."cLname", u."cProfile",case when u."isAdmin" or rm."nSrno" = 1 then true else false end  "isAdmin"
    FROM "UserMaster" u
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid"
        join "RoleMaster" rm on rm."nRoleid" = tr."nRoleid"
    WHERE "nTeamid" = (
        SELECT "nTeamid"
        FROM "TeamRelation"
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid
    )
         order by u."cFname", u."cLname";

    RETURN NEXT ref1;
END;
$function$;

COMMIT;
