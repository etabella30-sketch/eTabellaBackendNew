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

    IF cPermission = 'SD' THEN
        -- Check if the issue name exists
        IF NOT EXISTS (SELECT * FROM "RIssueMaster" WHERE "nIid" = nIid and "nUserid" IS NOT NULL) THEN
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
$function$
