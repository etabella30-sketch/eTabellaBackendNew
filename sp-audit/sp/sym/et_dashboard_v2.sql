CREATE OR REPLACE FUNCTION sym.et_dashboard_v2(parameter jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Inputs
    nMasterid       uuid;
    nAdminRoleId    uuid;
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

    IF nMasterid IS NULL THEN
        RAISE EXCEPTION 'Invalid Parameter: nMasterid is required';
    END IF;

    IF nAdminRoleId IS NULL THEN
        RAISE EXCEPTION 'Configuration Error: nAdminRoleId is missing in parameters';
    END IF;

    /* ===================== 2. FETCH PAGINATED IDS & TOTAL COUNT ===================== */
    -- Optimized: Uses Window Function to get Count + IDs in single scan of the user's cases
    WITH UserCases AS (
        SELECT 
            t."nCaseid",
            -- Sort Key: Use Update Date, fall back to Create Date
            COALESCE(c."dUpdateDt", c."dCreateDt") as last_activity
        FROM "TeamRelation" t
        JOIN "CaseMaster" c
            ON c."nCaseid" = t."nCaseid"
           AND c."isArchived" = false
        WHERE t."nUserid" = nMasterid
          AND t."cStatus" = 'A'
        -- Grouping handles multiple roles per case
        GROUP BY t."nCaseid", c."dUpdateDt", c."dCreateDt" 
    ),
    PagedStats AS (
        SELECT 
            count(*) OVER() as total_cnt,
            "nCaseid"
        FROM UserCases
        ORDER BY last_activity DESC
        LIMIT perPage OFFSET offsetCount
    )
    SELECT 
        COALESCE(ARRAY_AGG("nCaseid" ORDER BY last_activity DESC) FILTER (WHERE "nCaseid" IS NOT NULL), '{}'),
        COALESCE(MAX(total_cnt), 0)
    FROM (
        -- We join back to UserCases to preserve sort order if needed, 
        -- but PagedStats already has IDs. 
        -- However, ARRAY_AGG order inside the select needs the sort key if we want strict ordering in the array.
        -- Since we limited in PagedStats, the order is preserved implicitly but let's be safe.
        SELECT p."nCaseid", p.total_cnt, uc.last_activity 
        FROM PagedStats p
        JOIN UserCases uc ON uc."nCaseid" = p."nCaseid"
    ) sub
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
                    'createdAt', x."dCreateDt", -- Added field for debug/display
                    'permissions', COALESCE(x.permissions, '[]'::jsonb)
                )
            )
            FROM (
                SELECT
                    c."nCaseid",
                    c."cCasename",
                    c."cCaseno",
                    c."dUpdateDt",
                    c."dCreateDt",
                    -- Permission Aggregation
                    jsonb_agg(pm."cType") FILTER (WHERE up."nPMid" IS NOT NULL) AS permissions
                FROM "CaseMaster" c
                LEFT JOIN "UserPermission" up
                    ON up."nCaseid" = c."nCaseid"
                   AND up."nUserid" = nMasterid
                   AND up."nPMid" IN (5, 15, 16)
                LEFT JOIN "PermissionModule" pm
                    ON pm."nPMid" = up."nPMid"
                WHERE c."nCaseid" = ANY(allcases)
                GROUP BY
                    c."nCaseid", c."cCasename", c."cCaseno", c."dUpdateDt", c."dCreateDt"
                -- Crucial: Sort the final JSON array to match the pagination order
                ORDER BY COALESCE(c."dUpdateDt", c."dCreateDt") DESC
            ) x
        ), '[]'::jsonb),

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
                    EXISTS (
                        SELECT 1 FROM "UserMaster"
                        WHERE "nUserid" = nMasterid AND "isAdmin" = true
                    )
                    OR 
                    EXISTS (
                        SELECT 1 FROM "TeamRelation" tr2
                        WHERE tr2."nUserid" = nMasterid
                          AND (
                              (t."nCaseid" = tr2."nCaseid" AND tr2."nRoleid" = nAdminRoleId)
                              OR 
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
