CREATE OR REPLACE FUNCTION public.et_dashboard_v2(parameter jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Inputs
    nMasterid       uuid;
    nAdminRoleId    uuid; -- Passed from Backend Safe Constants
    pageNumber      int;
    perPage         int DEFAULT 10;
    offsetCount     int;

    -- Internal
    allcases        uuid[];
    totalCount      int DEFAULT 0;
    result          jsonb;
BEGIN
    /* ===================== 1. INPUT PARSING & VALIDATION ===================== */
    nMasterid    := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    nAdminRoleId := NULLIF(parameter ->> 'nAdminRoleId', '')::uuid;
    pageNumber   := COALESCE((parameter ->> 'pageNumber')::int, 1);
    perPage      := COALESCE((parameter ->> 'perPage')::int, 10);
    offsetCount  := (pageNumber - 1) * perPage;

    -- Enterprise Guard: Don't allow fetching without a valid User ID
    IF nMasterid IS NULL THEN
        RAISE EXCEPTION 'Invalid Parameter: nMasterid is required';
    END IF;

    -- Enterprise Guard: Check for Configuration Parameter
    IF nAdminRoleId IS NULL THEN
        -- Fallback WARN or ERROR depending on strictness. 
        -- ideally, this should be ERROR. For migration safety, ensure NestJS sends it.
        RAISE EXCEPTION 'Configuration Error: nAdminRoleId is missing in parameters';
    END IF;

    /* ===================== 2. FETCH PAGINATED IDS & TOTAL COUNT ===================== */
    -- Using a CTE to calculate count and fetch IDs in one logical step
    WITH UserCases AS (
        SELECT 
            t."nCaseid",
            -- Performance: Ensure index exists on this expression
            COALESCE(c."dUpdateDt", c."dCreateDt") as last_activity
        FROM "TeamRelation" t
        JOIN "CaseMaster" c
            ON c."nCaseid" = t."nCaseid"
           AND c."isArchived" = false
        WHERE t."nUserid" = nMasterid
          AND t."cStatus" = 'A'
        -- Optimization: Grouping early if duplicates are possible, 
        -- otherwise DISTINCT/GROUP BY is heavy if 1:1. 
        -- Assuming TeamRelation can have multiple entries for same case/user? 
        -- If (nUserid, nCaseid) is unique, GROUP BY is redundant here.
        -- We keep it safe:
        GROUP BY t."nCaseid", c."dUpdateDt", c."dCreateDt" 
    ),
    Total AS (
        SELECT count(*) as cnt FROM UserCases
    )
    SELECT 
        ARRAY(
            SELECT "nCaseid" 
            FROM UserCases 
            ORDER BY last_activity DESC 
            LIMIT perPage OFFSET offsetCount
        ),
        (SELECT cnt FROM Total)
    INTO allcases, totalCount;

    /* ===================== 3. BUILD JSON RESPONSE ===================== */
    SELECT jsonb_build_object(

        /* ------------------ SECTION: CASES ------------------ */
        'cases', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', x."nCaseid",
                    'name', x."cCasename",
                    'number', x."cCaseno",
                    'updatedAt', x."dUpdateDt",
                    'permissions', COALESCE(x.permissions, '[]'::jsonb)
                )
            )
            FROM (
                SELECT
                    c."nCaseid",
                    c."cCasename",
                    c."cCaseno",
                    c."dUpdateDt",
                    -- Permission Aggregation
                    jsonb_agg(pm."cType") FILTER (WHERE up."nPMid" IS NOT NULL) AS permissions
                FROM "CaseMaster" c
                LEFT JOIN "UserPermission" up
                    ON up."nCaseid" = c."nCaseid"
                   AND up."nUserid" = nMasterid
                   AND up."nPMid" IN (5, 15, 16) -- Specific Permission IDs
                LEFT JOIN "PermissionModule" pm
                    ON pm."nPMid" = up."nPMid"
                WHERE c."nCaseid" = ANY(allcases)
                GROUP BY
                    c."nCaseid", c."cCasename", c."cCaseno", c."dUpdateDt",
                    -- Ordering inside the JSON list matches the main sort order
                    COALESCE(c."dUpdateDt", c."dCreateDt")
                ORDER BY COALESCE(c."dUpdateDt", c."dCreateDt") DESC
            ) x
        ), '[]'::jsonb), -- Return empty array if no cases

        /* ------------------ SECTION: TEAMS ------------------ */
        'teamsById', COALESCE((
            SELECT jsonb_object_agg(
                t."nTeamid",
                jsonb_build_object(
                    'id', t."nTeamid",
                    'name', t."cTeamname",
                    'caseId', t."nCaseid"
                )
            )
            FROM "TeamMaster" t
            WHERE t."nCaseid" = ANY(allcases)
              AND (
                    -- Super Admin Access Check
                    EXISTS (
                        SELECT 1 FROM "UserMaster"
                        WHERE "nUserid" = nMasterid AND "isAdmin" = true
                    )
                    OR 
                    -- Team Membership Check
                    EXISTS (
                        SELECT 1 FROM "TeamRelation" tr2
                        WHERE tr2."nUserid" = nMasterid
                          AND (
                              -- If user is Admin of the CASE (using the param ID)
                              (t."nCaseid" = tr2."nCaseid" AND tr2."nRoleid" = nAdminRoleId)
                              OR 
                              -- Or user is member of THIS specific team
                              tr2."nTeamid" = t."nTeamid"
                          )
                    )
                )
        ), '{}'::jsonb),

        /* ------------------ SECTION: USERS ------------------ */
        'usersById', COALESCE((
            SELECT jsonb_object_agg(
                u."nUserid",
                jsonb_build_object(
                    'id', u."nUserid",
                    'fname', u."cFname",
                    'lname', u."cLname",
                    'profile', u."cProfile",
                    'roleId', u."nRoleid",
                    'teams', u.teams
                )
            )
            FROM (
                SELECT
                    u."nUserid",
                    u."cFname",
                    u."cLname",
                    u."cProfile",
                    tr."nRoleid",
                    jsonb_agg(DISTINCT tr."nTeamid") AS teams
                FROM "UserMaster" u
                JOIN "TeamRelation" tr ON tr."nUserid" = u."nUserid"
                WHERE tr."nCaseid" = ANY(allcases)
                GROUP BY u."nUserid", u."cFname", u."cLname", u."cProfile", tr."nRoleid"
            ) u
        ), '{}'::jsonb),

        /* ------------------ SECTION: METADATA ------------------ */
        'pagination', jsonb_build_object(
            'page', pageNumber,
            'perPage', perPage,
            'total', totalCount,
            'totalPages', CEIL(totalCount::numeric / perPage)
        )
    )
    INTO result;

    RETURN result;
END;
$function$
