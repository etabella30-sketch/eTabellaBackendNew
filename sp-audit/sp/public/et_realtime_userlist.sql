CREATE OR REPLACE FUNCTION public.et_realtime_userlist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;cSearch text;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cSearch := parameter ->>'cSearch';

/*
select * from et_realtime_userlist('{"nCaseid":22}','r');fetch all in "r"

select * from "UserMaster"
select * from "TeamRelation"
*/

open ref for
select tm."nTeamid",tm."cTeamname" ,jsonb_agg(distinct u) as "userlist"
from "TeamMaster" tm 
join (
select tr."nTeamid",um."nUserid",um."cFname",um."cLname" ,um."cProfile"
from "TeamRelation" tr
join "UserMaster" um on um."nUserid" = tr."nUserid"
) u on u."nTeamid" = tm."nTeamid"
where tm."nCaseid" = nCaseid
group by tm."nTeamid",tm."cTeamname"
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
