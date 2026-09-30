-- 2026-09-07 — DOWN: drop the claim details and restore the previous SP bodies
-- (captured verbatim from etabella_tech_uuid on 2026-09-07, after migration 1).
DO $g$ BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid', 'etabella_rg') THEN
    RAISE EXCEPTION 'ABORT: wrong database %', current_database();
  END IF;
END $g$;

CREATE OR REPLACE FUNCTION public.et_realtime_handle_issue_category(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nICid UUID;
    nCaseid UUID;
    cCategory VARCHAR(200);
    nUserid UUID;
    dCreateDt TIMESTAMP;
    dUpdateDt TIMESTAMP;
    cICtype CHAR(1);
    inserted_id UUID;
    msg_text TEXT;
    msg SMALLINT;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    cCategory := parameter ->> 'cCategory';
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    dCreateDt := (parameter ->> 'dCreateDt')::TIMESTAMP;
    dUpdateDt := (parameter ->> 'dUpdateDt')::TIMESTAMP;
    cICtype := (parameter ->> 'cICtype')::CHAR(1);
    msg := 1;

    IF cICtype = 'I' THEN
        -- Check if the category already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			 and "nUserid" =nUserid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            INSERT INTO "IssueCategory" ("nCaseid", "cCategory", "nUserid", "dCreateDt")
            VALUES (nCaseid, cCategory, nUserid, dCreateDt)
            RETURNING "nICid" INTO inserted_id;
            msg_text := 'Inserted';
        END IF;
    ELSIF cICtype = 'U' THEN
        -- Check if a different category with the same name already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			and "nUserid" =nUserid
            AND "nICid" != nICid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            UPDATE "IssueCategory"
            SET "cCategory" = cCategory,
                "nUserid" = nUserid,
                "dUpdateDt" = dUpdateDt
            WHERE "nICid" = nICid;
            msg_text := 'Updated';
        END IF;
    ELSIF cICtype = 'D' THEN
        -- Check if the category exists for the given case ID and category ID
        DELETE FROM "IssueCategory"
        WHERE "nICid" = nICid
        AND "nCaseid" = nCaseid;
        msg_text := 'Deleted';
    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    OPEN ref FOR
        SELECT msg, msg_text AS message, inserted_id AS "nICid";
    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_update_claim(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nICid UUID;cCategory text;
	nUserid UUID;
	msg int;msg_text text;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
	nUserid:= NULLIF(parameter ->> 'nUserid','')::UUID;
	cCategory:= parameter ->> 'cCategory';
	
    msg := 1;
        -- Check if the issue name exists
	update "IssueCategory" set "cCategory" = cCategory,"nUserid" = nUserid where "nICid" = nICid;

	msg_text := 'Updated';
	
    OPEN ref FOR SELECT msg, msg_text AS message;

    RETURN ref;
END;
$function$;

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

open ref2 for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory"
,im."cPriority", im."cDispute", im."cDescription"
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
group by rs."nSequence",im."nIid", im."cIName", im."cColor", im."cPriority", im."cDispute", im."cDescription",ic."nICid","cCategory", im."nUserid", fi."nIssueid" ,um."cFname",um."cLname",qp."nQFactSequence",qp."bVisible"
order by "nSequence","cIName";

 RETURN next ref1;
 RETURN next ref2;
END;
$function$;

ALTER TABLE public."IssueCategory"
  DROP COLUMN IF EXISTS "cColor",
  DROP COLUMN IF EXISTS "cParty",
  DROP COLUMN IF EXISTS "cDescription";
