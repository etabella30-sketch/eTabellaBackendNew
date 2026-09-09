-- 2026-09-07 — Claim & Issue create/edit: optional Priority / Dispute status / Description
-- on "RIssueMaster" (the redesigned "Add Claims & Issues" form in the Document Reader,
-- Realtime and Fact Workspace). Plan: eTabella angular 21/docs/claim-issue-fields-plan.md
--
-- Codes are FE-owned, nullable (null = "not set"):
--   cPriority     H High | M Medium | L Low
--   cDispute      U Undisputed | P Partial | D Disputed
--   cDescription  free text, max 2000
--
-- Touches: table "RIssueMaster", SPs et_realtime_handle_issue_master (insert/update write the
-- three columns; update only when the key is present in the payload) and
-- et_realtime_issuelist_group (issuelist_V2 cursor 2 returns them).
-- Apply to the DEV database etabella_tech_uuid only (guarded below). Pure DDL + SP: no
-- service restart needed for the SPs; the realtime-server DTO change ships separately.
DO $g$ BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid', 'etabella_rg') THEN
    RAISE EXCEPTION 'ABORT: wrong database %', current_database();
  END IF;
END $g$;

ALTER TABLE public."RIssueMaster"
  ADD COLUMN IF NOT EXISTS "cPriority"    varchar(1),
  ADD COLUMN IF NOT EXISTS "cDispute"     varchar(1),
  ADD COLUMN IF NOT EXISTS "cDescription" varchar(2000);

ALTER TABLE public."RIssueMaster" DROP CONSTRAINT IF EXISTS "RIssueMaster_cPriority_chk";
ALTER TABLE public."RIssueMaster" ADD CONSTRAINT "RIssueMaster_cPriority_chk"
  CHECK ("cPriority" IS NULL OR "cPriority" IN ('H','M','L'));
ALTER TABLE public."RIssueMaster" DROP CONSTRAINT IF EXISTS "RIssueMaster_cDispute_chk";
ALTER TABLE public."RIssueMaster" ADD CONSTRAINT "RIssueMaster_cDispute_chk"
  CHECK ("cDispute" IS NULL OR "cDispute" IN ('U','P','D'));

CREATE OR REPLACE FUNCTION public.et_realtime_handle_issue_master(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nIid UUID;
    cIName VARCHAR(100);
    cColor VARCHAR(6);
    nICid UUID;
    dCreatedt TIMESTAMP;
    nUserid UUID;
    dUpdatedt TIMESTAMP;
    cPermission CHAR(1);
    cPriority VARCHAR(1);
    cDispute VARCHAR(1);
    cDescription VARCHAR(2000);
    inserted_id UUID;
    msg_text TEXT;
    msg smallint;
    nCaseid UUID;
	v_factid uuid;
BEGIN
    nIid := NULLIF(parameter ->> 'nIid','')::UUID;
    cIName := parameter ->> 'cIName';
    cColor := parameter ->> 'cColor';
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    dCreatedt := (parameter ->> 'dCreatedt')::TIMESTAMP;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    dUpdatedt := (parameter ->> 'dUpdatedt')::TIMESTAMP;
    cPermission := (parameter ->> 'cPermission')::CHAR(1);
    -- optional issue details (2026-09-07): H/M/L priority, U/P/D dispute status, free-text description
    cPriority := NULLIF(parameter ->> 'cPriority','');
    cDispute := NULLIF(parameter ->> 'cDispute','');
    cDescription := NULLIF(btrim(parameter ->> 'cDescription'),'');

    msg := 1;

    IF cPermission = 'I' THEN
        -- Check if the issue name already exists
        IF EXISTS (SELECT 1 FROM "RIssueMaster" WHERE "cIName" = cIName and "nCaseid" = nCaseid and "nUserid" = nUserid) THEN
            msg := -1;
            msg_text := 'Issue name already exists';
        ELSE
            INSERT INTO "RIssueMaster" ("cIName", "cColor", "nICid", "dCreatedt", "nUserid", "nCaseid", "cPriority", "cDispute", "cDescription")
            VALUES (cIName, cColor, nICid, dCreatedt, nUserid, nCaseid, cPriority, cDispute, cDescription)
            RETURNING "nIid" INTO inserted_id;
            msg_text := 'Inserted';
        END IF;
    ELSIF cPermission = 'U' THEN
        -- Check if the issue name exists

        if exists (select * from "RIssueMaster" where "nIid" = nIid and "nUserid" IS NOT NULL) then 

             IF EXISTS (SELECT 1 FROM "RIssueMaster" WHERE "cIName" = cIName and "nCaseid" = nCaseid and "nUserid" = nUserid and "nIid" != nIid) THEN
                msg := -1;
                msg_text := 'Issue name already exists';
            ELSE
                UPDATE "RIssueMaster"
                SET "cColor" = cColor, "nICid" = nICid, "dUpdatedt" = dUpdatedt, "cIName" = cIName, "nCaseid" = nCaseid,
                    -- only touch the optional details when the caller sent the key, so a legacy
                    -- client that still posts {cIName,cColor,nICid,...} cannot wipe them; an
                    -- explicit null / empty string clears the value.
                    "cPriority" = CASE WHEN (parameter::jsonb) ? 'cPriority' THEN cPriority ELSE "cPriority" END,
                    "cDispute" = CASE WHEN (parameter::jsonb) ? 'cDispute' THEN cDispute ELSE "cDispute" END,
                    "cDescription" = CASE WHEN (parameter::jsonb) ? 'cDescription' THEN cDescription ELSE "cDescription" END
                WHERE "nIid" = nIid;
                inserted_id := nIid;
                msg_text := 'Updated';
            END IF;
        else 
            msg := -1;
            msg_text := 'Issue can not be update';
        end if;
        

    ELSIF cPermission = 'D' THEN
        -- Check if the issue name exists
        IF NOT EXISTS (SELECT * FROM "RIssueMaster" WHERE "nIid" = nIid and "nUserid" IS NOT NULL) THEN
            msg := -1;
            msg_text := 'Issue can not be delete';
        ELSE

			DELETE FROM "RIssueMaster"
			WHERE "nIid" = nIid;
            msg_text := 'Deleted';
     -- select * from et_realtime_handle_issue_master ('{""nIid"":334,""cPermission"":""D""}','r1');fetch all in ""r1"";

        -- select * from ""RHighlightMapid"" limit 0

            delete from "RIssueMapid" where "nIid" = nIid;

            UPDATE "RIssueDetail" 
                SET "nLID" = COALESCE((SELECT m."nIid" FROM "RIssueMapid" m WHERE m."nIDid" = "RIssueDetail"."nIDid" ORDER BY m."serialno" ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid) 
                WHERE "nLID" = nIid;

            DELETE FROM "RIssueDetail" WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

            DELETE FROM "RHighlightMapid" WHERE "nIid" = nIid;

            UPDATE "RHighlights"
                      SET "nLID" = COALESCE((SELECT m."nIid" FROM "RHighlightMapid" m WHERE m."nHid" = "RHighlights"."nHid" ORDER BY m."serialno" ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
                      WHERE "nLID" = nIid;

            DELETE FROM "RHighlights" WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

            UPDATE "RSessionDetail" SET "nLID" = null WHERE "nLID" = nIid;

            UPDATE "RSessionDetail" SET "nLIid" = null WHERE "nLIid" = nIid;

			-- Remove nIid from cDefHIssues and cDefIssues in RSessionDetail
			UPDATE "RSessionDetail"
			SET "cDefHIssues" = (
				SELECT jsonb_agg(elem)
				FROM jsonb_array_elements("RSessionDetail"."cDefHIssues") AS elem
				WHERE elem->>'nIid' <> nIid::text
				)
			WHERE "cDefHIssues" @> ('[{"nIid": "' || nIid::text || '"}]')::jsonb;

			UPDATE "RSessionDetail"
			SET "cDefIssues" = (
				SELECT jsonb_agg(elem)
				FROM jsonb_array_elements("RSessionDetail"."cDefIssues") AS elem
				WHERE elem->>'nIid' <> nIid::text
				)
			WHERE "cDefIssues" @> ('[{"nIid": "' || nIid::text || '"}]')::jsonb;

			drop table if exists deleted_issues;

			CREATE TEMP TABLE deleted_issues as 
				with delete_op as (
					DELETE FROM "FMIssue"
					WHERE "nIssueid" = nIid
					-- RETURNING "nFSid"
					RETURNING "nFSid"
				) select * from delete_op;

			DELETE FROM "FactMaster"
			WHERE "nFSid" IN (
			SELECT df."nFSid"
			FROM deleted_issues df
			LEFT JOIN "FMIssue" fi ON fi."nFSid" = df."nFSid"
			WHERE fi."nFSid" IS NULL
			);

			/*WITH remaining_issues AS (
				select r."nSerialno", i."nSerialno", *
				from "FMIssue" fmi
				left join "Codemaster" r on r."nCodeid" = fmi."nRelevanceid"
				left join "Codemaster" i on i."nCodeid" = fmi."nImpactid" 
				INNER JOIN deleted_issues di ON fmi."nFSid" = di."nFSid"
				-- where fmi."nFSid" = '6d778adc-5da2-4e63-853b-1116cab41684'
				order by coalesce(r."nSerialno",999),coalesce(i."nSerialno",999) 
			
				),
			 	ranked_issues AS (
			 	SELECT DISTINCT ON (ri."nFSid")
			 		ri."nFSid",
			 		ri."nIssueid"
			 	FROM remaining_issues ri
			 	ORDER BY ri."nFSid", ri.relevance_serial, ri.impact_serial
			 	)*/
				with lastcolorissue as (
					SELECT DISTINCT ON (fmi."nFSid") 
					   fmi."nFSid",
					    fmi."nIssueid"
					FROM "FMIssue" fmi
					LEFT JOIN "Codemaster" r ON r."nCodeid" = fmi."nRelevanceid"
					LEFT JOIN "Codemaster" i ON i."nCodeid" = fmi."nImpactid"
					INNER JOIN deleted_issues di ON fmi."nFSid"::text = di."nFSid"::text
					ORDER BY fmi."nFSid", COALESCE(r."nSerialno", 999), COALESCE(i."nSerialno", 999)
					) 
					-- Step 4: Update Annotations colorid with top-priority issue
					UPDATE "Annotations" a
					SET "colorid" = ri."nIssueid"
					FROM lastcolorissue ri
					WHERE a."nFSid" = ri."nFSid";

        END IF;
    ELSE
        msg := -1;
        msg_text := 'Invalid permission';
    END IF;

    OPEN ref FOR SELECT msg, msg_text AS message, inserted_id AS "nIid";

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
