CREATE OR REPLACE FUNCTION public.et_realtime_issuelist_group_backup(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;nTeamid uuid;
isAdmin boolean default false;nRoleid uuid;
-- jIssueIds jsonb;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid; 
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;
nTeamid := NULLIF(parameter ->>'nTeamid','')::uuid;

--jIssueIds:= parameter ->>'jIssueIds';
-- select * from public.et_realtime_issuelist ('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","nSessionid":null,"nIDid":null,"nUserid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1');fetch all in "r1";

--  select * From "RIssueMaster"

/*
select * From issue_detail_count
 
select * from public.et_realtime_issuelist ('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","nSessionid":null,"nIDid":null,"nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

 select * from "RoleMaster"
select "nTeamid" into nTeamid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
*/

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;

select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
raise notice 'nRoleid %',nRoleid;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
	isAdmin := true;
end if;

open ref1 for
select ic."nICid","cCategory",
case when (ic."nUserid" = nUserid or isAdmin) then true else false end "edit",
case when ((ic."nUserid" = nUserid or isAdmin) and count(fi."nIssueid") = 0) then true else false end "delete"
From "RIssueMaster" im 
join "IssueCategory" ic on ic."nICid" = im."nICid"
join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid" 
left join realtime."RClaimSequence" rs on rs."nICid" = im."nICid" and rs."nUserid" = nUserid
where ic."nCaseid" = nCaseid
group by "nSequence",ic."nICid","cCategory"
order by "nSequence","cCategory";

open ref2 for

select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory"
,0 "nRelid",0 "nImpactid",im."nUserid",count(fi."nIssueid") "isFact",
case when (im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null then true else false end "edit",
case when ((im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null) then true else false end "delete",
um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",rs."nSequence"
From "RIssueMaster" im 
JOIN "UserMaster" um ON um."nUserid" = im."nUserid"
join "IssueCategory" ic on ic."nICid" = im."nICid"
join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
--left join issue_detail_count id on id."nIid" = im."nIid" 
left join "FMIssue" fi  on fi."nIssueid" = im."nIid" 
left join realtime."RIssueSequence" rs on rs."nIid" = im."nIid" and rs."nUserid" = nUserid
where ic."nCaseid" = nCaseid --and ((im."nUserid" = nUserid or (im."nUserid" is null and im."nCaseid" = nCaseid))) --or  (jIssueIds @> to_jsonb(im."nIid"))
group by rs."nSequence",im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", im."nUserid", fi."nIssueid" ,um."cFname",um."cLname"
order by "nSequence","cIName";

 RETURN next ref1;                  
 RETURN next ref2;  
    END;
$function$
