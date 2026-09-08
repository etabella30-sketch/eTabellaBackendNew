-- 2026-08-12 — et_admindashboard: add nUserid to the user cursor.
--
-- Cursor 3 (case users) never selected "nUserid" even though the coreapi
-- interface AdminDashboardUserRow declares it. Without the id, same-named
-- users collapse client-side and the admin UI cannot map displayed members
-- to TeamRelation rows for team-setup mutations (assignteam pairs need real
-- uuids). Additive column — legacy consumers read named properties and are
-- unaffected. Cursors 1 and 2 are unchanged.

-- Dev-only guard: this migration must never run on prod (etabella.com.uuid).
DO $$
BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Refusing to run on database % — dev (etabella_tech_uuid) only', current_database();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.et_admindashboard(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID; pageNumber int; offsetCount int; perPage int default 10; jCases jsonb;
allcases UUID[];
cSearch text;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
cSearch := parameter ->>'cSearch';
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;

/*
 select * from et_admindashboard('{"nMasterid":10,"pageNumber":1,"cSearch":"text"}','r1','r2','r3');FETCH All in "r1";
 FETCH All in "r2";
 FETCH All in "r3";
 select * from "TicketMaster"
*/

allcases = (array (
     select "nCaseid" from "CaseMaster"
    where "isArchived" = false
    and upper("cCasename" || "cCaseno") like ('%' || upper(cSearch) || '%')
    order by coalesce("dUpdateDt","dCreateDt") desc
        LIMIT perPage
        OFFSET offsetCount
));


    OPEN ref1 FOR
    select c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt",count(t."nTicketid")::int as "nTotaltickets"
    FROM "CaseMaster" c
    left join "TicketMaster" t on t."nCaseid" = c."nCaseid" and t."isCleared" = false
    where c."nCaseid" = ANY(allcases)
    group by c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
    order by c."dUpdateDt" desc
    ;

    RETURN NEXT ref1;


    OPEN ref2 FOR
    SELECT t."nTeamid", t."cTeamname", t."nCaseid"
    FROM "TeamMaster" t
    where t."nCaseid" = ANY(allcases)
    GROUP BY t."nTeamid", t."cTeamname", t."nCaseid";

    RETURN NEXT ref2;


    OPEN ref3 FOR
    SELECT jsonb_agg(DISTINCT t."nTeamid") AS "teams", u."nUserid", u."cFname", u."cLname", u."cProfile",t."nRoleid"
    FROM "TeamRelation" t
    JOIN "UserMaster" u ON u."nUserid" = t."nUserid"
    where t."nCaseid" = ANY(allcases)
    GROUP BY u."nUserid", u."cFname", u."cLname", u."cProfile",t."nRoleid";

     RETURN NEXT ref3;

END;
$function$;
