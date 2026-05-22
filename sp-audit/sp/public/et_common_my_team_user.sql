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
$function$
