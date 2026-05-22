CREATE OR REPLACE FUNCTION public.et_teams_users(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
 select * from et_teams_users('{"nMasterid":"2-uuid-format","pageNumber":1,"nCaseid":"22-uuid-format"}','r1');FETCH All in "r1"
 
 
*/

OPEN ref1 FOR 
select t."nTeamid",t."cTeamname",t."cFlag",t."cClr"
,case when count(u."nTeamid") > 0 then jsonb_agg(distinct u) else '[]'::jsonb  end as "users"
from "TeamMaster" t
left join (
        
    select u."nUserid",u."cFname",u."cLname",u."cProfile",tr."nTeamid"
    from "UserMaster" u
    --join "UserSetting" us on us."nCaseid" = nCaseid and us."nUserid" = u."nUserid"
    join "TeamRelation" tr on tr."nCaseid" = nCaseid and tr."nUserid" = u."nUserid"
) u on u."nTeamid" = t."nTeamid"
where t."nCaseid" = nCaseid
group by  t."nTeamid",t."cTeamname",t."cFlag"
;

RETURN NEXT ref1;
     
END;
$function$
