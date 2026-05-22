CREATE OR REPLACE FUNCTION public.et_admin_archivecase(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 10;jCases jsonb;allcases_uuid uuid[];
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int,1);
offsetCount := (pageNumber - 1) * perPage;
/*
 select * from et_admindashboard('{"nMasterid":"10-uuid-format","pageNumber":1}','r1','r2','r3');FETCH All in "r1"; 
 FETCH All in "r2";
 FETCH All in "r3";
 select * from "TicketMaster"
*/
allcases_uuid = (array (
     select "nCaseid" from "CaseMaster" where "isArchived" = true order by coalesce("dUpdateDt","dCreateDt") desc --select distinct "nCaseid" From "TeamRelation" --where "nUserid" = nMasterid
        LIMIT perPage
        OFFSET offsetCount
));
-- select * from "CaseMaster"
    
    OPEN ref1 FOR 
    select c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt" 
    FROM "CaseMaster" c
    where c."nCaseid" = ANY(allcases_uuid)
    group by c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
    order by c."dUpdateDt" desc;    
        
    RETURN NEXT ref1;
    
    
    
    
    
    OPEN ref2 FOR 
    SELECT t."nTeamid", t."cTeamname", t."nCaseid"
    FROM "TeamMaster" t 
    where t."nCaseid" = ANY(allcases_uuid)
    GROUP BY t."nTeamid", t."cTeamname", t."nCaseid";
    
    RETURN NEXT ref2;
    
    
    
    
    OPEN ref3 FOR 
    
    
    
     SELECT jsonb_agg(DISTINCT t."nTeamid") AS "teams", u."cFname", u."cLname", u."cProfile",t."nRoleid"
    FROM "TeamRelation" t
    JOIN "UserMaster" u ON u."nUserid" = t."nUserid"
    where t."nCaseid" = ANY(allcases_uuid)
    GROUP BY u."cFname", u."cLname", u."cProfile",t."nRoleid";
        
     RETURN NEXT ref3;
     
END;
$function$
