CREATE OR REPLACE FUNCTION public.et_activity_userls(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
isAdmin boolean;nTeamid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
-- select * from "TeamRelation"
select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
select "nTeamid" into nTeamid from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid;
raise notice 'nTeamid %',nTeamid;
	
    OPEN ref1 FOR 
	select  u."nUserid",u."cFname",u."cLname",u."cEmail"
    FROM  "UserMaster" u
	join "TeamRelation" t on t."nUserid" = u."nUserid"
	where t."nCaseid" = nCaseid and case when isAdmin = true then true else t."nTeamid" = nTeamid end
	group by  u."nUserid",u."cFname",u."cLname",u."cEmail"
	order by u."cFname";	
		
    RETURN NEXT ref1;
    
	
END;
$function$
