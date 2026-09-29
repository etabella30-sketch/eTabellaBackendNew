-- 2026-09-23_sec_fact_view_task_assignee (ROLLBACK - restores the exact dev bodies dumped 2026-09-23)
--
-- USER DECISION 2026-09-23: a user who is an ASSIGNEE of a task that is linked to a fact may VIEW that
-- fact - not edit, not reshare, not delete. Everything else about fact privacy stays as it is: owner, or an
-- FMShared recipient with that share's flags. The admin / nSrno = 1 bypass that the 2026-09-15 migration
-- removed from et_fact_permissions stays removed (isAdmin is still computed there and still unused).
--
-- Model (dev, 2026-09-23):
--   task -> fact link  "FMTasks"    (nFSid, nTaskid)   written by et_workspace_task_factlink,
--                                   et_fact_insert_task (public + realtime), et_fact_update, realtime.et_factsheet_submit
--   assignee           "TaskShared" (nTaskid, nUserid) written by et_task_insert_assign / _v2 (task/taskBuilder
--                                   jUsers); it is the workspace task list's jAssignees
--   live task          "TaskMaster" row exists. Tasks are hard-deleted (et_task_delete removes TaskMaster,
--                                   TaskDetail, TaskReminders, TaskShared but leaves FMTasks rows behind), so the
--                                   join through TaskMaster drops links of deleted tasks. There is no status /
--                                   soft-delete column; a completed task still grants view, as the workspace task
--                                   list still shows it to its assignees.
--
-- Rule added to bCanView (only that column; every other output column is byte-identical):
--     EXISTS FMTasks fmt JOIN TaskMaster tm ON tm.nTaskid = fmt.nTaskid JOIN TaskShared ts ON ts.nTaskid = tm.nTaskid
--            JOIN TeamRelation tr ON tr.nCaseid = tm.nCaseid AND tr.nUserid = ts.nUserid AND tr.cStatus = 'A'
--      WHERE fmt.nFSid = <fact> AND tm.nCaseid = <fact>.nCaseid AND ts.nUserid = <caller>
--   tm.nCaseid = fact nCaseid: a task only grants view of facts on its own case (dev has 0 cross-case links;
--   neither et_workspace_task_factlink nor et_fact_insert_task checks the fact's case).
--   TeamRelation cStatus 'A': the assignee must still be an active member of the fact's case. Both assign
--   pickers (workspace/tasks/users = et_workspace_task_users, legacy common/myteamusers =
--   et_common_my_team_user) offer only TeamRelation members, but removing or deactivating a member
--   (et_teambuilder, et_user_team_management, et_admin_case_teamsetup, et_pm_user/role_statusmanage) leaves
--   their TaskShared rows behind: on dev 40 of the 57 (fact, user) pairs the rule opens without this test
--   belong to non-members, 18 of them to users on no case at all. 'A' is the active-member test of
--   et_dashboard_v2 (case list) and et_workspace_view_list. It also keeps the taskBuilder hole below inside
--   the case team. A NULL caller still gets false.
--
--   public.et_fact_permissions     caller key nUserid   the read / edit gate of realtime-server factsheet/* and
--                                                       fact/* and of coreapi fact-access.ts
--   realtime.et_factsheet_detail   caller key nMasterid its own "bCanView" output column (same owner / FMShared
--                                                       rule); the legacy fact sheet (etabella-tech
--                                                       fact-sheet.component) shows its no-access screen when it
--                                                       is false, so without this an assignee passes the gate but
--                                                       still sees "no access". Its bCanDelete (owner or admin) and
--                                                       the other columns are untouched.
--
-- MIRROR (same deploy): apps/socket-app/src/events/socket-room-access.ts FACT_VIEW_SQL (FACT_ comment rooms)
-- carries the same bCanView rule in raw SQL and was updated with this file.
--
-- DEPLOY GATE (route holes this rule turns into fact-view escalation - fix before applying to prod):
--   * POST task/taskBuilder and task/taskBuilder/v2 with permission <> 'N' take nTaskid from the client;
--     et_task_insert does not check the owner and et_task_insert_assign(_v2) replaces TaskShared: any active
--     member of a case can make themselves an assignee of any task on it and, with this rule, view every
--     fact linked to it (the TeamRelation test keeps everyone else out).
--   * POST workspace/tasks/factlink (et_workspace_task_factlink links any nFSid to any nTaskid): gated in the
--     coreapi working tree (workspace.service linkTaskFacts: task visible to the caller + bCanEdit on every
--     fact, uncommitted 2026-09-23). Ship that coreapi change before or with this file.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
-- md5(pg_get_functiondef) of the dev bodies this pair was built from (= what .down.sql restores):
--     public.et_fact_permissions(json, refcursor)      0a0dc4c8f36f48358e6618b48c2e5b8f
--     realtime.et_factsheet_detail(json, refcursor)    da2f016b9ef3c116b05d0e66987aafb2
-- and after the .up.sql (dev, rollback-only test 2026-09-23):
--     public.et_fact_permissions(json, refcursor)      bf2ed6596edae72869e72f221ed74c35
--     realtime.et_factsheet_detail(json, refcursor)    2d9ad6db514531c951f4a41e9d12eb42
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.et_fact_permissions ============
CREATE OR REPLACE FUNCTION public.et_fact_permissions(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
	nFSid uuid;

	
	isAdmin boolean default false;
	nRoleid uuid;nCaseid uuid;
BEGIN
    nFSid := NULLIF(parameter ->> 'nFSid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;

	isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;
	
	select "nCaseid" into nCaseid from "FactMaster" where "nFSid" = nFSid;

	
	select "nRoleid" into nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

    OPEN ref FOR
        SELECT f."nFSid",f."nUserid",
		case when (f."nUserid" = nUserid) then true else s."bCanComment" end "bCanComment",
		case when (f."nUserid" = nUserid) then true else s."bCanEdit" end "bCanEdit",
		case when (f."nUserid" = nUserid) then true else s."bCanReshare" end "bCanReshare",
		case when (f."nUserid" = nUserid) then true else s."nFSid" is not null end "bCanView"
		from "FactMaster" f
		left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
		where f."nFSid" = nFSid; --and "nUserid" = nUserid;

		
    RETURN ref;
END;
$function$
;

-- ============ realtime.et_factsheet_detail ============
CREATE OR REPLACE FUNCTION realtime.et_factsheet_detail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;
bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

	select "nCaseid" into nCaseid from "FactMaster" where  "nFSid" =  nFSid;
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

    OPEN ref1 FOR
	select f."dCreateDt",f."cFType",f."nFSid",f."nUserid",
	d."jDate",d."nFiletype",d."nStatus",d."nReviewid",d."cType",d."jLinktype",d."jTexts",d."jOT",d."cIsNote",d."nColorid",
	-- CASE on bIsTranscipt so the published-view SP returns the transferred
	-- (page, line) written by run3.py during transferAnnotations. Mirrors the
	-- canonical pattern in et_marks.sql:57-58 for RHighlights.
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTPage" ELSE d."nPage" END AS "nPage",
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTLine" ELSE d."nLine" END AS "nLine",
	(u."cFname" || ' ' || coalesce(u."cLname", '')) AS "cCreatedBy",

	case when f."nUserid" = nMasterid then true else  fs."nFSid" is not null end as "bCanView",
	f."nUserid" = nMasterid or isAdmin as "bCanDelete",
	case when f."nUserid" = nMasterid then true else  fs."bCanComment" end as "bCanComment",
	case when f."nUserid" = nMasterid then true else  fs."bCanEdit" end as "bCanEdit",
	case when f."nUserid" = nMasterid then true else  fs."bCanReshare" end as "bCanReshare",
	rs."cName",
	b."cFilename",
	b."cTab",
	bm."cBundletag"
	From "FactMaster" f
	join "FactDetail" d on d."nFSid" = f."nFSid"
	join "UserMaster" u on u."nUserid" = f."nUserid"
	left join "RSessionMaster" rs on rs."nSesid" = f."nSesid"
	left join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
	left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid" and fs."nUserid" = nMasterid
	where f."nFSid" = nFSid
	  -- Orphan filter: on the published view, suppress facts whose annotation
	  -- could not be re-anchored (run3.py stamped 'O' and cleared jTCordinates).
	  AND (
	    COALESCE(bIsTranscipt, false) = false
	    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
	  );
    RETURN NEXT ref1;


END;
$function$
;

COMMIT;
