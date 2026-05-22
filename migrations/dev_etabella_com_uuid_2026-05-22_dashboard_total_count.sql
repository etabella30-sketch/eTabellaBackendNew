-- =============================================================================
-- Migration: dashboard_total_count
-- Target DB: dev.etabella.com.uuid (Vultr Postgres, see .env.development)
-- Date:      2026-05-22
-- =============================================================================
-- Adds a 4th refcursor (`ref4`) to `public.et_dashboard` returning a single
-- row `{ "nTotalCount": <int> }` — the unpaginated count of the user's active
-- cases. The frontend uses it to render "Total N active cases" without
-- walking every page (previously the header counted only the cases loaded
-- into the client, which capped at one page = 10).
--
-- Companion backend change: `apps/coreapi/src/services/user-dashboard/
-- user-dashboard.service.ts` bumps `body.ref` from 3 → 4 so the executeRef
-- layer allocates the fourth cursor.
--
-- Idempotency: single CREATE OR REPLACE FUNCTION — safe to re-run.
--
-- Apply with:
--   PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' psql \
--     -h public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
--     -p 16751 -U vultradmin -d 'dev.etabella.com.uuid' \
--     --set ON_ERROR_STOP=on \
--     -f migrations/dev_etabella_com_uuid_2026-05-22_dashboard_total_count.sql 2>&1 \
--     | tee migrations/apply_log_dashboard_total_count_$(date +%Y%m%d_%H%M%S).log
--
-- pgAdmin users: comment out the `\set ON_ERROR_STOP on` line below — it's
-- a psql meta-command. The BEGIN/COMMIT still gives all-or-nothing rollback.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- The function signature is changing (3 refcursors → 4). PostgreSQL treats
-- different arg lists as distinct overloads, so a bare CREATE OR REPLACE
-- would leave the old 3-cursor function in place alongside the new one and
-- the backend service (which now requests 4 refs) would never hit it. Drop
-- the old signature first; the new one is recreated below.
DROP FUNCTION IF EXISTS public.et_dashboard(json, refcursor, refcursor, refcursor);

CREATE OR REPLACE FUNCTION public.et_dashboard(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor, ref4 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 10;jCases jsonb;allcases uuid[];
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;

/*
 select * from et_dashboard('{"nMasterid":285,"pageNumber":1}','r1','r2','r3','r4');
 FETCH All in "r1"; FETCH All in "r2"; FETCH All in "r3"; FETCH All in "r4";
 -- r1=cases page, r2=teams, r3=users, r4=single row { "nTotalCount" } across the full active-case set
select * from et_admindashboard ('{\"pageNumber\":1,\"nMasterid\":2}','r1','r2','r3');fetch all in \"r1\";fetch all in \"r2\";fetch all in \"r3\";
*/

allcases = (array (
	select t."nCaseid" From "TeamRelation" t
	join "CaseMaster" c on c."nCaseid" = t."nCaseid" and "isArchived" = false
	where t."nUserid" = nMasterid and t."cStatus" = 'A'
group by t."nCaseid",c."dUpdateDt",c."dCreateDt" order by  coalesce(c."dUpdateDt",c."dCreateDt") desc
        LIMIT perPage
        OFFSET offsetCount
));


    OPEN ref1 FOR
	select  c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
	,jsonb_agg(pm."cType") filter (where up."nPMid" is not null ) "jPermission"
    FROM  "CaseMaster" c
	-- NOTE: PermissionModule IDs (5,15,16) are still integers in the database, not UUIDs
	-- If these are converted to UUIDs, this line should be updated with the UUID values
	left join "UserPermission" up on up."nCaseid" = c."nCaseid" and  up."nPMid" in (5,15,16) and up."nUserid" = nMasterid
	left join "PermissionModule" pm on pm."nPMid" = up."nPMid"
	where c."nCaseid" = ANY(allcases)
	group by c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
	order by c."dUpdateDt" desc;

    RETURN NEXT ref1;


    OPEN ref2 FOR
	SELECT t."nTeamid", t."cTeamname", t."nCaseid"
    FROM  "TeamMaster" t
    JOIN "TeamRelation" tr ON tr."nTeamid" = t."nTeamid"
	where t."nCaseid" = ANY(allcases)

	 AND (
        EXISTS (
            SELECT 1
            FROM "UserMaster" um
            WHERE um."nUserid" = nMasterid AND um."isAdmin" = true
        )
        OR EXISTS (
            SELECT 1
            FROM "TeamRelation" tr
            WHERE tr."nUserid" = nMasterid
              AND (
                  (t."nCaseid" = tr."nCaseid" AND tr."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid)
                  OR tr."nTeamid" = t."nTeamid"
              )
        )
    )
    GROUP BY t."nTeamid", t."cTeamname", t."nCaseid";

 	RETURN NEXT ref2;


    OPEN ref3 FOR

	 SELECT jsonb_agg(DISTINCT t."nTeamid") AS "teams",u."nUserid", u."cFname", u."cLname", u."cProfile",t."nRoleid"
    FROM "TeamRelation" t
    JOIN "UserMaster" u ON u."nUserid" = t."nUserid"
	where t."nCaseid" = ANY(allcases)
	 AND (
        EXISTS (
            SELECT 1
            FROM "UserMaster" um
            WHERE um."nUserid" = nMasterid AND um."isAdmin" = true
        )
        OR EXISTS (
            SELECT 1
            FROM "TeamRelation" tr
            WHERE tr."nUserid" = nMasterid
              AND (
                  (t."nCaseid" = tr."nCaseid" AND tr."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid)
                  OR tr."nTeamid" = t."nTeamid"
              )
        )
    )
    GROUP BY u."nUserid",u."cFname", u."cLname", u."cProfile",t."nRoleid"
	;

	 RETURN NEXT ref3;


    -- Total active-case count for the user (ignores LIMIT/OFFSET). Single row,
    -- single column "nTotalCount" so the frontend can display "Total N active
    -- cases" without paging through the entire result set.
    OPEN ref4 FOR
    SELECT COUNT(DISTINCT t."nCaseid")::int AS "nTotalCount"
    FROM "TeamRelation" t
    JOIN "CaseMaster" c ON c."nCaseid" = t."nCaseid" AND c."isArchived" = false
    WHERE t."nUserid" = nMasterid AND t."cStatus" = 'A';

    RETURN NEXT ref4;

END;
$function$;

COMMIT;

-- =============================================================================
-- Post-apply verification
-- =============================================================================
-- Replace <your-user-uuid> with an actual nUserid that has known active cases
-- to confirm ref4 reports the expected count.
--
-- BEGIN;
--   SELECT * FROM public.et_dashboard(
--     '{"nMasterid":"<your-user-uuid>","pageNumber":1}'::json,
--     'r1','r2','r3','r4'
--   );
--   FETCH ALL IN "r4";    -- expect a single row { nTotalCount: <count> }
-- ROLLBACK;
