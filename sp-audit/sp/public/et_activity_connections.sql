CREATE OR REPLACE FUNCTION public.et_activity_connections(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;isAdmin boolean;
nSesid uuid;nMasterid uuid;nTeamid uuid;
BEGIN
-- select * from et_activity_casels('{"nMasterid":"367-uuid-format"}','r');fetch all in "r"
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
select "nTeamid" into nTeamid from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid;

    -- select * from "TeamMaster"
    OPEN ref1 FOR 
    select t."nTeamid",t."cTeamname","cClr"
    FROM  "TeamMaster" t
    where "nCaseid" = nCaseid and case when isAdmin = true then true else t."nTeamid" = nTeamid end
    order by t."nTeamid";    
        
    RETURN NEXT ref1;

    -- select * from "RTLogs"
    OPEN ref2 FOR 
        with tm as(
            select distinct "nTeamid","cSource",rt."nUserid" from "RTLogs" rt
            join "TeamRelation" tr on tr."nUserid" = rt."nUserid" and "nCaseid" = nCaseid
            where "nSesid" = nSesid group by tr."nTeamid","cSource",rt."nUserid"
        ) select "nTeamid",sum(case when "cSource" = 'L' then 1 else 0 end) "nLUser",
        sum(case when "cSource" = 'O' then 1 else 0 end) "nOUser"
         from tm group by "nTeamid";

        
        
    RETURN NEXT ref2;
    
    
END;
$function$
