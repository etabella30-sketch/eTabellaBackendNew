-- 2026-04-30 — Patch et_realtime_issuelist_group to surface system Unassigned
--
-- Why
-- ---
-- The previous migration (2026-04-30_unassigned_issue_seed.sql) seeded the
-- default Unassigned issue under every case's Unassigned claim with
-- nUserid=NULL (matching the existing legacy seed convention). The frontend
-- QFact panel's fallback (`unassignedIssue` computed) expects to find that
-- issue in the GET /issue/issuelist_V2 response.
--
-- It doesn't. The SP backing that endpoint
-- (public.et_realtime_issuelist_group) has two INNER JOINs that drop any
-- issue whose nUserid is NULL:
--
--   ref1 (categories) and ref2 (issues):
--     JOIN team_issues ti ON ti."nIid" = im."nIid" AND ti."nTeamid" = nTeamid
--   ref2 also:
--     JOIN "UserMaster" um ON um."nUserid" = im."nUserid"
--
-- team_issues is a VIEW that joins RIssueMaster → IssueCategory → TeamRelation
-- via the issue's nUserid. Issues with nUserid IS NULL produce zero rows in
-- the view, and the inner join with team_issues then drops them entirely.
-- The UserMaster inner join would also drop them.
--
-- Net effect: the 65 legacy Unassigned issues (cColor 'e9e90e') AND the 38
-- new yellow seeds from this morning's migration are all invisible to every
-- user on every case. The Unassigned section never appears in the QFact
-- panel — which is the entire reason we did the seed in the first place.
--
-- Fix
-- ---
-- Change the two INNER JOINs to LEFT JOINs, and gate them with a WHERE
-- clause that explicitly admits system-owned issues (nUserid IS NULL) in
-- addition to the team-visible ones. This:
--   - Preserves current behaviour for user-created issues (still need a
--     team_issues row to be visible).
--   - Lets system Unassigned issues through the filter regardless of team.
--   - Keeps the UserMaster columns nullable for system issues (the frontend
--     already falls back to 'Unknown' for cCreateby).
--
-- Why a LEFT JOIN + WHERE rather than UNION
-- -----------------------------------------
-- Cleaner diff. The SP body stays one query per ref; only the join kind and
-- the WHERE filter change. UNION would double the body and force us to
-- duplicate the column list, which is risky given the SP isn't in source
-- control and any future column add has to be remembered in two places.

CREATE OR REPLACE FUNCTION public.et_realtime_issuelist_group(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;nTeamid uuid;
isAdmin boolean default false;nRoleid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;
nTeamid := NULLIF(parameter ->>'nTeamid','')::uuid;

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
raise notice 'nRoleid %',nRoleid;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
    isAdmin := true;
end if;

-- ref1: categories. LEFT JOIN team_issues so claims whose only issues are
-- system-owned (Unassigned seed, nUserid IS NULL) still surface. WHERE
-- clause requires either a real team link OR a system issue.
open ref1 for
select ic."nICid","cCategory",
case when (ic."nUserid" = nUserid or isAdmin) then true else false end "edit",
case when ((ic."nUserid" = nUserid or isAdmin) and count(fi."nIssueid") = 0) then true else false end "delete",
qcp."nQFactSequence" AS "nQFactSequence"
From "RIssueMaster" im
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RClaimSequence" rs on rs."nICid" = im."nICid" and rs."nUserid" = nUserid
left join public."RUserQFactClaimPref" qcp on qcp."nICid" = ic."nICid" and qcp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by "nSequence",ic."nICid","cCategory",qcp."nQFactSequence"
order by "nSequence","cCategory";

-- ref2: issues. LEFT JOIN team_issues + LEFT JOIN UserMaster for the same
-- reason. cCreateby will be NULL for system issues; the frontend already
-- falls back to 'Unknown'/'cCreateby || …' for that case.
open ref2 for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory"
,0 "nRelid",0 "nImpactid",im."nUserid",count(fi."nIssueid") "isFact",
case when (im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null then true else false end "edit",
case when ((im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null) then true else false end "delete",
um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",rs."nSequence",
qp."nQFactSequence" AS "nQFactSequence",
qp."bVisible"       AS "bQFactVisible"
From "RIssueMaster" im
LEFT JOIN "UserMaster" um ON um."nUserid" = im."nUserid"
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RIssueSequence" rs on rs."nIid" = im."nIid" and rs."nUserid" = nUserid
left join public."RUserQFactPref" qp on qp."nIid" = im."nIid" and qp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by rs."nSequence",im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", im."nUserid", fi."nIssueid" ,um."cFname",um."cLname",qp."nQFactSequence",qp."bVisible"
order by "nSequence","cIName";

 RETURN next ref1;
 RETURN next ref2;
END;
$function$;


-- ============================================================
-- Rollback
-- ============================================================
-- The previous SP definition (with INNER JOINs) is preserved verbatim in
-- public.et_realtime_issuelist_group_backup which already exists in the DB
-- (we saw it in pg_proc when locating this SP). Restore via:
--
--   CREATE OR REPLACE FUNCTION public.et_realtime_issuelist_group(...)
--     LANGUAGE plpgsql AS $function$ <copy from _backup> $function$;
--
-- Or pull the diff from this file's git history.
