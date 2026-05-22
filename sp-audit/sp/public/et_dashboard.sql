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
	
	
	-- select * from "UserMaster"
	
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
$function$
