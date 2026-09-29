-- 2026-09-23_sec_issue_claim_owner (apply)
--
-- Security remediation phase 4: realtime-server issue / claim writes acted on a client-supplied id without
-- checking the caller. Rule adopted (same as the edit/delete flags et_realtime_issuelist_group already
-- returns to the UI): issue master + claim = owner OR global admin (UserMaster.isAdmin) OR Case Admin
-- (RoleMaster.nSrno = 1) of that case; issue detail (RIssueDetail, private realtime mark) = owner only.
-- Refusals come back as the SP's normal row with msg = -1 (the services already relay msg:-1 as-is).
--
--   public.et_realtime_handle_issue_master     U / D   caller key nUserid
--   realtime.et_realtime_handle_issue_delete   SD / MD caller key nMasterid (already read by the SP)
--   public.et_realtime_handle_issue_detail     U / D   caller key nUserid
--   realtime.et_realtime_handle_update_claim   update  caller key nUserid (and no longer sets the owner to the editor)
--   realtime.et_realtime_handle_claim_delete   SD      caller key nMasterid (new)
--
-- DEPLOY GATE: the realtime-server IssueService must pass the JWT user in those keys (the delete DTOs carry
-- no user id at all, and RealtimeAuthMiddleware only overwrites keys the client sent). Without that
-- service change every update/delete returns msg -1. apps/realtime (venue app) calls the two public SPs
-- too (incl. the 'D' path with only {nIid}) - do not apply to a DB the venue app uses without the same fix.
--
-- PROD PREREQUISITE: migrations/prod_etabella_com_uuid_2026-09-15.sql first. The bodies here are the
-- post-2026-09-07 ones (cPriority / cDispute / cDescription, cColor / cParty); the 2026-09-22 prod backup
-- still has the older public.et_realtime_handle_issue_master and realtime.et_realtime_handle_update_claim.
-- The other three bodies are identical on dev and in that backup.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.et_realtime_handle_issue_master ============
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
	v_sec_ok boolean; -- 2026-09-23 sec
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

    -- 2026-09-23 sec: update / delete only by the issue's owner, a global admin (UserMaster.isAdmin) or a
    -- Case Admin (RoleMaster.nSrno = 1) of the issue's case - the rule behind the edit/delete flags of
    -- et_realtime_issuelist_group. nUserid is the acting user (realtime-server must set it from the JWT).
    IF cPermission IN ('U', 'D') THEN
        v_sec_ok := nUserid IS NOT NULL AND EXISTS (
            SELECT 1 FROM "RIssueMaster" sim
            WHERE sim."nIid" = nIid
              AND (sim."nUserid" = nUserid
                   OR EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = nUserid AND su."isAdmin" = true)
                   OR EXISTS (SELECT 1 FROM "TeamRelation" tr JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
                              WHERE tr."nUserid" = nUserid AND rm."nSrno" = 1
                                AND tr."nCaseid" = COALESCE(sim."nCaseid", (SELECT ic."nCaseid" FROM "IssueCategory" ic WHERE ic."nICid" = sim."nICid")))));
    END IF;

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

        if not coalesce(v_sec_ok, false) then
            msg := -1;
            msg_text := 'You are not authorized to update this issue';
        elsif exists (select * from "RIssueMaster" where "nIid" = nIid and "nUserid" IS NOT NULL) then 

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
        IF NOT coalesce(v_sec_ok, false) THEN
            msg := -1;
            msg_text := 'You are not authorized to delete this issue';
        ELSIF NOT EXISTS (SELECT * FROM "RIssueMaster" WHERE "nIid" = nIid and "nUserid" IS NOT NULL) THEN
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

-- ============ realtime.et_realtime_handle_issue_delete ============
CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_issue_delete(parameter json, ref refcursor)
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
    cPermission CHAR(2);
    inserted_id UUID;
    msg_text TEXT;
    msg smallint;
    nCaseid UUID;
	v_factid uuid;
	jIids jsonb;
	v_sec_admin boolean; -- 2026-09-23 sec
BEGIN
    nIid := NULLIF(parameter ->> 'nIid','')::UUID;
    cIName := parameter ->> 'cIName';
    cColor := parameter ->> 'cColor';
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    dCreatedt := (parameter ->> 'dCreatedt')::TIMESTAMP;
    nUserid := NULLIF(parameter ->> 'nMasterid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    dUpdatedt := (parameter ->> 'dUpdatedt')::TIMESTAMP;
    cPermission := (parameter ->> 'cPermission')::CHAR(2);
	jIids := (parameter ->> 'jIids')::jsonb;

    msg := 1;

    -- 2026-09-23 sec: nMasterid (nUserid here) is the acting user - realtime-server must set it from the JWT.
    -- An issue may be deleted only by its owner, a global admin (UserMaster.isAdmin) or a Case Admin
    -- (RoleMaster.nSrno = 1) of the issue's case - the rule behind et_realtime_issuelist_group's delete flag.
    v_sec_admin := EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = nUserid AND su."isAdmin" = true);

    IF cPermission = 'SD' THEN
        -- Check if the issue name exists
        IF nUserid IS NULL OR NOT EXISTS (
            SELECT 1 FROM "RIssueMaster" sim
            WHERE sim."nIid" = nIid
              AND (sim."nUserid" = nUserid OR v_sec_admin
                   OR EXISTS (SELECT 1 FROM "TeamRelation" tr JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
                              WHERE tr."nUserid" = nUserid AND rm."nSrno" = 1
                                AND tr."nCaseid" = COALESCE(sim."nCaseid", (SELECT ic."nCaseid" FROM "IssueCategory" ic WHERE ic."nICid" = sim."nICid"))))) THEN
            msg := -1;
            msg_text := 'You are not authorized to delete this issue';
        ELSIF NOT EXISTS (SELECT * FROM "RIssueMaster" WHERE "nIid" = nIid and "nUserid" IS NOT NULL) THEN
            msg := -1;
            msg_text := 'Issue can not be delete';
        ELSE
			
			DELETE FROM "RIssueMaster" WHERE "nIid" = nIid;
            msg_text := 'Deleted';
            -- select * from et_realtime_handle_issue_master ('{""nIid"":334,""cPermission"":""D""}','r1');fetch all in ""r1"";

            -- select * from ""RHighlightMapid"" limit 0

            delete from "RIssueMapid" where "nIid" = nIid;

            UPDATE "RIssueDetail" 
                SET "nLID" = COALESCE((SELECT m."nIid"
				FROM "RIssueMapid" m WHERE m."nIDid" = "RIssueDetail"."nIDid"
				ORDER BY m."serialno" ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid) 
                WHERE "nLID" = nIid;

            DELETE FROM "RIssueDetail" WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

            DELETE FROM "RHighlightMapid" WHERE "nIid" = nIid;

            UPDATE "RHighlights"
                      SET "nLID" = COALESCE((SELECT m."nIid"
					  FROM "RHighlightMapid" m
					  WHERE m."nHid" = "RHighlights"."nHid"
					  ORDER BY m."serialno" ASC
					  LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
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

	-- 2026-09-23 sec: refuse the whole batch when any listed issue is not deletable by the caller
	ELSIF cPermission = 'MD' AND (nUserid IS NULL OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(jIids) AS sv
            JOIN "RIssueMaster" sim ON sim."nIid" = NULLIF(sv,'')::UUID
            WHERE sim."nUserid" IS DISTINCT FROM nUserid AND NOT v_sec_admin
              AND NOT EXISTS (SELECT 1 FROM "TeamRelation" tr JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
                             WHERE tr."nUserid" = nUserid AND rm."nSrno" = 1
                               AND tr."nCaseid" = COALESCE(sim."nCaseid", (SELECT ic."nCaseid" FROM "IssueCategory" ic WHERE ic."nICid" = sim."nICid"))))) THEN
        msg := -1;
        msg_text := 'You are not authorized to delete one or more of these issues';

	ELSIF cPermission = 'MD' THEN   
        
        -- 1. Create temp table with issue IDs
        DROP TABLE IF EXISTS tmp_issues_to_delete;
		
        CREATE TEMP TABLE tmp_issues_to_delete as
			SELECT NULLIF(value,'')::UUID as "nIid"
			FROM jsonb_array_elements_text(jIids) AS value;

        -- 2. Delete from RIssueMaster first
        DELETE FROM "RIssueMaster" rim
        USING tmp_issues_to_delete t
        WHERE rim."nIid" = t."nIid"
        AND rim."nUserid" IS NOT NULL;

        -- 3. Delete from RIssueMapid
        DELETE FROM "RIssueMapid" rimap
        USING tmp_issues_to_delete t
        WHERE rimap."nIid" = t."nIid";

        -- 4. Update RIssueDetail nLID -> first available or NULL UUID
        UPDATE "RIssueDetail" rid
        SET "nLID" = COALESCE((
            SELECT m."nIid"
            FROM "RIssueMapid" m
            WHERE m."nIDid" = rid."nIDid"
            ORDER BY m."serialno" ASC
            LIMIT 1
        ), '00000000-0000-0000-0000-000000000000'::uuid)
        WHERE "nLID" IN (SELECT "nIid" FROM tmp_issues_to_delete);

        -- 5. Delete orphan RIssueDetail
        DELETE FROM "RIssueDetail"
        WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

        -- 6. Delete from RHighlightMapid
        DELETE FROM "RHighlightMapid" rhmap
        USING tmp_issues_to_delete t
        WHERE rhmap."nIid" = t."nIid";

        -- 7. Update RHighlights nLID
        UPDATE "RHighlights" rh
        SET "nLID" = COALESCE((
            SELECT m."nIid"
            FROM "RHighlightMapid" m
            WHERE m."nHid" = rh."nHid"
            ORDER BY m."serialno" ASC
            LIMIT 1
        ), '00000000-0000-0000-0000-000000000000'::uuid)
        WHERE rh."nLID" IN (SELECT "nIid" FROM tmp_issues_to_delete);

        -- 8. Delete orphan RHighlights
        DELETE FROM "RHighlights"
        WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

        -- 9. Update RSessionDetail columns
        UPDATE "RSessionDetail"
        SET "nLID" = NULL
        WHERE "nLID" IN (SELECT "nIid" FROM tmp_issues_to_delete);

        UPDATE "RSessionDetail"
        SET "nLIid" = NULL
        WHERE "nLIid" IN (SELECT "nIid" FROM tmp_issues_to_delete);

        -- 10. Remove issue references from JSON arrays
        UPDATE "RSessionDetail" rs
        SET "cDefHIssues" = (
            SELECT jsonb_agg(elem)
            FROM jsonb_array_elements(rs."cDefHIssues") elem
            WHERE elem->>'nIid' IS NULL
            OR elem->>'nIid' NOT IN (SELECT "nIid"::text FROM tmp_issues_to_delete)
        )
        WHERE rs."cDefHIssues" IS NOT NULL;

        UPDATE "RSessionDetail" rs
        SET "cDefIssues" = (
            SELECT jsonb_agg(elem)
            FROM jsonb_array_elements(rs."cDefIssues") elem
            WHERE elem->>'nIid' IS NULL
            OR elem->>'nIid' NOT IN (SELECT "nIid"::text FROM tmp_issues_to_delete)
        )
        WHERE rs."cDefIssues" IS NOT NULL;

        -- 11. Handle FMIssue and FactMaster cascade
        DROP TABLE IF EXISTS deleted_issues;
        CREATE TEMP TABLE deleted_issues AS
        WITH delete_op AS (
            DELETE FROM "FMIssue" fmi
            USING tmp_issues_to_delete t
            WHERE fmi."nIssueid" = t."nIid"
            RETURNING fmi."nFSid"
        )
        SELECT * FROM delete_op;

        DELETE FROM "FactMaster" fm
        USING deleted_issues di
        WHERE fm."nFSid" = di."nFSid"
        AND NOT EXISTS (
            SELECT 1
            FROM "FMIssue" fmi
            WHERE fmi."nFSid" = di."nFSid"
        );

        -- 12. Update Annotations colorid
        WITH lastcolorissue AS (
            SELECT DISTINCT ON (fmi."nFSid") 
                fmi."nFSid",
                fmi."nIssueid"
            FROM "FMIssue" fmi
            LEFT JOIN "Codemaster" r ON r."nCodeid" = fmi."nRelevanceid"
            LEFT JOIN "Codemaster" i ON i."nCodeid" = fmi."nImpactid"
            INNER JOIN deleted_issues di ON fmi."nFSid"::text = di."nFSid"::text
            ORDER BY fmi."nFSid", COALESCE(r."nSerialno", 999), COALESCE(i."nSerialno", 999)
        )
        UPDATE "Annotations" a
        SET "colorid" = ri."nIssueid"
        FROM lastcolorissue ri
        WHERE a."nFSid" = ri."nFSid";

        msg := 1;
        msg_text := 'Multiple issues deleted successfully.';
  
    ELSE
        msg := -1;
        msg_text := 'Invalid permission';
    END IF;

    OPEN ref FOR SELECT msg, msg_text AS message, inserted_id AS "nIid";

    RETURN ref;
END;
$function$;

-- ============ public.et_realtime_handle_issue_detail ============
CREATE OR REPLACE FUNCTION public.et_realtime_handle_issue_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nIDid UUID;
    cNote TEXT;
    cUNote text;
    cONote TEXT;
  
    nSessionid UUID;
    nCaseid UUID;
    cPageno VARCHAR(50);
   
    jCordinates JSONb;
    nUserid UUID;
    dCreatedt TIMESTAMP;
    dUpdatedt TIMESTAMP;
    cPermission CHAR(1);
    inserted_id UUID;
    nIidStr jsonb;
    msg_text TEXT;
    msg SMALLINT;
    nLID uuid;
    cColor text;
    cTranscript char(1);
BEGIN
    nIDid := NULLIF(parameter ->> 'nIDid','')::UUID;
    cNote := parameter ->> 'cNote';
    cUNote := parameter ->> 'cUNote';
    cONote := parameter ->> 'cONote';
   
    nLID := NULLIF(parameter ->> 'nLID','')::uuid;
    nSessionid := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    cPageno := parameter ->> 'cPageno';
   
    jCordinates := (parameter ->> 'jCordinates')::JSONb;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    cPermission := (parameter ->> 'cPermission')::CHAR(1);
    cTranscript := (parameter ->> 'cTranscript')::CHAR(1);
    nIidStr := (parameter ->> 'cIidStr')::jsonb;
    msg := 1;

    IF cPermission = 'I' THEN
        INSERT INTO "RIssueDetail" ("cNote","cUNote","cONote", "nSessionid", "nCaseid", "cPageno", "jCordinates", "nUserid", "dCreatedt","nLID","jTCordinates","cTPageno")
        VALUES (cNote,cUNote,cONote, nSessionid, nCaseid, 
                case when cTranscript ='N' then cPageno else null end,  
                case when cTranscript ='N' then jCordinates else null end,
                nUserid, now(),nLID,
               case when cTranscript ='Y' then jCordinates else null end,
                case when cTranscript ='Y' then cPageno else null end
               )
        RETURNING "nIDid" INTO inserted_id;
        
      
 WITH cte AS (
        SELECT 
            NULLIF(jsonb_array_elements(nIidStr)->>'nIid','')::UUID AS nIid,
            (jsonb_array_elements(nIidStr)->>'nRelid')::SMALLINT AS nRelid,
            (jsonb_array_elements(nIidStr)->>'nImpactid')::SMALLINT AS nImpactid
    )
    INSERT INTO "RIssueMapid" ("nIDid", "nIid", "nRelid", "nImpactid")
    SELECT distinct inserted_id, nIid, nRelid, nImpactid
    FROM cte where not exists (select * from "RIssueMapid" t where t."nIDid" = inserted_id and t."nIid" = cte.nIid); 

        msg_text := 'Inserted';
    -- 2026-09-23 sec: an issue detail is changed / removed only by its owner. nUserid is the acting user
    -- (realtime-server must set it from the JWT - the D call used to drop it). A missing row keeps the old
    -- outcome (idempotent delete).
    ELSIF cPermission IN ('U', 'D') AND (nUserid IS NULL OR EXISTS (
            SELECT 1 FROM "RIssueDetail" sid WHERE sid."nIDid" = nIDid AND sid."nUserid" IS DISTINCT FROM nUserid)) THEN
        msg := -1;
        msg_text := 'You are not authorized to change this issue detail';
    ELSIF cPermission = 'U' THEN
        UPDATE "RIssueDetail"
        SET "cNote" = cNote,
            "cUNote" = cUNote,
            "cONote" = cONote,
            "nSessionid" = nSessionid,
            "nCaseid" = nCaseid,
            "cPageno" = case when cTranscript ='N' then cPageno else "cPageno" end,
            "jCordinates" = case when cTranscript ='N' then jCordinates else "jCordinates" end,
             "cTPageno" = case when cTranscript ='Y' then cPageno else "cTPageno" end,
            "jTCordinates" = case when cTranscript ='Y' then jCordinates else "jTCordinates" end,
            "nUserid" = nUserid,
            "dUpdatedt" = now(),
            "nLID" = nLID
        WHERE "nIDid" = nIDid;

        DELETE FROM "RIssueMapid"
        WHERE "nIDid" = nIDid;

 WITH cte AS (
        SELECT 
            NULLIF(jsonb_array_elements(nIidStr)->>'nIid','')::UUID AS nIid,
            (jsonb_array_elements(nIidStr)->>'nRelid')::SMALLINT AS nRelid,
            (jsonb_array_elements(nIidStr)->>'nImpactid')::SMALLINT AS nImpactid
    )
    INSERT INTO "RIssueMapid" ("nIDid", "nIid", "nRelid", "nImpactid")
    SELECT distinct nIDid, nIid, nRelid, nImpactid
    FROM cte where not exists (select * from "RIssueMapid" t where t."nIDid" = nIDid and t."nIid" = cte.nIid); 

        inserted_id := nIDid;
        msg_text := 'Updated';
    ELSIF cPermission = 'D' THEN
        DELETE FROM "RIssueDetail"
        WHERE "nIDid" = nIDid;

        msg_text := 'Deleted';
    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    select "cColor" into cColor From "RIssueMaster" where "nIid" = nLID;
    OPEN ref FOR
        SELECT msg, msg_text AS message, inserted_id AS "nIDid",cColor "cColor";
    RETURN ref;
END;
$function$;

-- ============ realtime.et_realtime_handle_update_claim ============
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
	-- 2026-09-23 sec: a claim is edited only by its owner, a global admin (UserMaster.isAdmin) or a Case
	-- Admin (RoleMaster.nSrno = 1) of the claim's case - et_realtime_issuelist_group's edit flag.
	-- nUserid is the acting user (realtime-server must set it from the JWT).
	IF nUserid IS NULL OR NOT EXISTS (
		SELECT 1 FROM "IssueCategory" sic
		WHERE sic."nICid" = nICid
		  AND (sic."nUserid" = nUserid
		       OR EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = nUserid AND su."isAdmin" = true)
		       OR EXISTS (SELECT 1 FROM "TeamRelation" tr JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
		                  WHERE tr."nUserid" = nUserid AND tr."nCaseid" = sic."nCaseid" AND rm."nSrno" = 1))) THEN
	    OPEN ref FOR SELECT -1 AS msg, 'You are not authorized to update this claim'::text AS message;
	    RETURN ref;
	END IF;

	-- 2026-09-23 sec: the owner ("nUserid") is no longer overwritten with the editor - an admin / Case Admin
	-- edit used to take the claim over (and turned the owner-less default claim into a deletable one).
	update "IssueCategory" set "cCategory" = cCategory,
                "cColor" = CASE WHEN (parameter::jsonb) ? 'cColor' THEN cColor ELSE "cColor" END,
                "cParty" = CASE WHEN (parameter::jsonb) ? 'cParty' THEN cParty ELSE "cParty" END,
                "cDescription" = CASE WHEN (parameter::jsonb) ? 'cDescription' THEN cDescription ELSE "cDescription" END
	where "nICid" = nICid;

	msg_text := 'Updated';
	
    OPEN ref FOR SELECT msg, msg_text AS message;

    RETURN ref;
END;
$function$;

-- ============ realtime.et_realtime_handle_claim_delete ============
CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_claim_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nICid UUID;jIssueids jsonb;
	msg int;msg_text text;
	v_caller uuid; -- 2026-09-23 sec
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    v_caller := NULLIF(parameter ->> 'nMasterid','')::UUID; -- 2026-09-23 sec: acting user, set by realtime-server from the JWT

    msg := 1;
        -- Check if the issue name exists
	-- 2026-09-23 sec: owner, global admin or Case Admin of the claim's case only (issuelist_group delete flag)
	IF v_caller IS NULL OR NOT EXISTS (
		SELECT 1 FROM "IssueCategory" sic
		WHERE sic."nICid" = nICid
		  AND (sic."nUserid" = v_caller
		       OR EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = v_caller AND su."isAdmin" = true)
		       OR EXISTS (SELECT 1 FROM "TeamRelation" tr JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
		                  WHERE tr."nUserid" = v_caller AND tr."nCaseid" = sic."nCaseid" AND rm."nSrno" = 1))) THEN
		msg := -1;
		msg_text := 'You are not authorized to delete this claim';
	ELSIF NOT EXISTS (SELECT * FROM "IssueCategory" WHERE "nICid" = nICid and "nUserid" IS NOT NULL) THEN
		msg := -1;
		msg_text := 'Claim can not be delete';
	ELSE

	if exists (select * from "FMIssue" fi 
	join "FactMaster" f on f."nFSid" = f."nFSid"
	join "RIssueMaster" im on im."nIid" = fi."nIssueid"
	where im."nICid" = nICid) then
		     msg := -1;
            msg_text := 'Claim Can not be deleted because issue assign any Fact';
	else
-- select * from "RIssueMapid"
			select jsonb_agg("nIid") into jIssueids FROM "RIssueMaster" WHERE "nICid" = nICid;
             delete from "RIssueMapid" where "nIid" in (select "nIid" FROM "RIssueMaster" WHERE "nICid" = nICid);

			delete from realtime."RClaimSequence" where "nICid" = nICid;
			 DELETE FROM "RIssueMaster" WHERE "nICid" = nICid;
			 DELETE FROM "IssueCategory" WHERE "nICid" = nICid;
			 
            msg_text := 'Deleted';
            -- select * from et_realtime_handle_issue_master ('{""nIid"":334,""cPermission"":""D""}','r1');fetch all in ""r1"";

            -- select * from ""RHighlightMapid"" limit 0

        END IF;
		end if;
	
    OPEN ref FOR SELECT msg, msg_text AS message;

    RETURN ref;
END;
$function$;

COMMIT;
