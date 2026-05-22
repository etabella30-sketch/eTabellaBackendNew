CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_issue_master(parameter json, ref refcursor)
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
    nUserid := NULLIF(parameter ->> 'nMasterid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    dUpdatedt := (parameter ->> 'dUpdatedt')::TIMESTAMP;
    cPermission := (parameter ->> 'cPermission')::CHAR(1);

    msg := 1;

    IF cPermission = 'I' THEN
        -- Check if the issue name already exists
        IF EXISTS (SELECT 1 FROM "RIssueMaster" WHERE "cIName" = cIName and "nCaseid" = nCaseid and "nUserid" = nUserid) THEN
            msg := -1;
            msg_text := 'Issue name already exists';
        ELSE
            INSERT INTO "RIssueMaster" ("cIName", "cColor", "nICid", "dCreatedt", "nUserid", "nCaseid")
            VALUES (cIName, cColor, nICid, dCreatedt, nUserid, nCaseid)
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
                SET "cColor" = cColor, "nICid" = nICid, "dUpdatedt" = dUpdatedt, "cIName" = cIName, "nCaseid" = nCaseid
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
$function$
