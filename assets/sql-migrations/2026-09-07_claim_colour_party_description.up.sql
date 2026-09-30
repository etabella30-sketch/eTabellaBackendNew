-- 2026-09-07 — Claim create/edit: optional Colour / Asserting party / Description on
-- "IssueCategory" (the redesigned "Add Claims & Issues" form, Claim tab). Plan + status:
-- eTabella angular 21/docs/claim-issue-fields-plan.md. Depends on
-- 2026-09-07_issue_priority_dispute_description (issuelist_group body).
--
--   cColor        hex without '#', nullable
--   cParty        free text (Codemaster cat-22 names are offered, custom names allowed)
--   cDescription  free text, max 2000
--
-- Touches: table "IssueCategory"; public.et_realtime_handle_issue_category (insert/update),
-- realtime.et_realtime_handle_update_claim (updateClaimDetail; details only when the key is
-- present), public.et_realtime_issuelist_group (cursor 1 now DRIVES from IssueCategory so a
-- claim with no issue is listed, and returns the three columns).
-- Apply to the DEV database etabella_tech_uuid only (guarded below).
DO $g$ BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid', 'etabella_rg') THEN
    RAISE EXCEPTION 'ABORT: wrong database %', current_database();
  END IF;
END $g$;

ALTER TABLE public."IssueCategory"
  ADD COLUMN IF NOT EXISTS "cColor"       varchar(6),
  ADD COLUMN IF NOT EXISTS "cParty"       varchar(200),
  ADD COLUMN IF NOT EXISTS "cDescription" varchar(2000);

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
    cColor VARCHAR(6);
    cParty VARCHAR(200);
    cDescription VARCHAR(2000);
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
    -- optional claim details (2026-09-07): colour (hex, no #), asserting party (free text), description
    cColor := NULLIF(regexp_replace(coalesce(parameter ->> 'cColor',''), '^#', ''), '');
    cParty := NULLIF(btrim(parameter ->> 'cParty'), '');
    cDescription := NULLIF(btrim(parameter ->> 'cDescription'), '');
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
            INSERT INTO "IssueCategory" ("nCaseid", "cCategory", "nUserid", "dCreateDt", "cColor", "cParty", "cDescription")
            VALUES (nCaseid, cCategory, nUserid, dCreateDt, cColor, cParty, cDescription)
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
                "dUpdateDt" = dUpdateDt,
                -- only touch the details when the caller sent the key (legacy clients post the old body)
                "cColor" = CASE WHEN (parameter::jsonb) ? 'cColor' THEN cColor ELSE "cColor" END,
                "cParty" = CASE WHEN (parameter::jsonb) ? 'cParty' THEN cParty ELSE "cParty" END,
                "cDescription" = CASE WHEN (parameter::jsonb) ? 'cDescription' THEN cDescription ELSE "cDescription" END
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
    cColor VARCHAR(6); cParty VARCHAR(200); cDescription VARCHAR(2000);
	nUserid UUID;
	msg int;msg_text text;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
	nUserid:= NULLIF(parameter ->> 'nUserid','')::UUID;
	cCategory:= parameter ->> 'cCategory';
    -- optional claim details (2026-09-07): colour (hex, no #), asserting party (free text), description
    cColor := NULLIF(regexp_replace(coalesce(parameter ->> 'cColor',''), '^#', ''), '');
    cParty := NULLIF(btrim(parameter ->> 'cParty'), '');
    cDescription := NULLIF(btrim(parameter ->> 'cDescription'), '');
	
    msg := 1;
        -- Check if the issue name exists
	update "IssueCategory" set "cCategory" = cCategory,"nUserid" = nUserid,
                "cColor" = CASE WHEN (parameter::jsonb) ? 'cColor' THEN cColor ELSE "cColor" END,
                "cParty" = CASE WHEN (parameter::jsonb) ? 'cParty' THEN cParty ELSE "cParty" END,
                "cDescription" = CASE WHEN (parameter::jsonb) ? 'cDescription' THEN cDescription ELSE "cDescription" END
	where "nICid" = nICid;

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
select ic."nICid","cCategory", ic."cColor", ic."cParty", ic."cDescription",
case when (ic."nUserid" = nUserid or isAdmin) then true else false end "edit",
case when ((ic."nUserid" = nUserid or isAdmin) and count(fi."nIssueid") = 0) then true else false end "delete",
qcp."nQFactSequence" AS "nQFactSequence"
-- claims are the driving table so a claim with no issue yet is still listed (2026-09-07)
From "IssueCategory" ic
left join "RIssueMaster" im on im."nICid" = ic."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RClaimSequence" rs on rs."nICid" = ic."nICid" and rs."nUserid" = nUserid
left join public."RUserQFactClaimPref" qcp on qcp."nICid" = ic."nICid" and qcp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by "nSequence",ic."nICid","cCategory", ic."cColor", ic."cParty", ic."cDescription",qcp."nQFactSequence"
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
