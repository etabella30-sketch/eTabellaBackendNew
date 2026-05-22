CREATE OR REPLACE FUNCTION public.et_realtime_sync_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jDelete jsonb;jIssues jsonb;jHighlghts jsonb;
BEGIN
    jDelete := parameter ->> 'jDelete';
/* select * from et_realtime_sync_delete ('{"jDelete":"[{\"id\":1,\"table_name\":\"IssueCategory\",\"deleted_id\":4,\"isSynced\":0,\"deleted_at\":\"2024-09-25 10:23:57\"}]"}','r1');fetch all in "r1";

select * from "RIssueMaster"
select "nIDid","nUserid" from "RIssueDetail"
*/
    
    DELETE FROM "IssueCategory"
    WHERE "nICid" IN (
        SELECT "deleted_id"::uuid
        FROM jsonb_to_recordset(jDelete) AS (id int, table_name text, deleted_id text)
        WHERE table_name = 'IssueCategory'
    );

    DELETE FROM "RIssueMaster"
    WHERE "nIid" IN (
        SELECT "deleted_id"::uuid
        FROM jsonb_to_recordset(jDelete) AS (id int, table_name text, deleted_id text)
        WHERE table_name = 'RIssueMaster'
    );

	with tbl as (
    DELETE FROM "RIssueDetail"
    	WHERE "nIDid" IN (
        	SELECT "deleted_id"::uuid
        	FROM jsonb_to_recordset(jDelete) AS (id int, table_name text, deleted_id text)
        	WHERE table_name = 'RIssueDetail'
    	)
	returning "nIDid","nUserid"
	) select jsonb_agg(t.*) into jIssues
	From tbl t;

    DELETE FROM "RIssueMapid"
    WHERE "nMapid" IN (
        SELECT "deleted_id"::uuid
        FROM jsonb_to_recordset(jDelete) AS (id int, table_name text, deleted_id text)
        WHERE table_name = 'RIssueMapid'
    );

	with tbl as (
    DELETE FROM "RHighlights"
    WHERE "nHid" IN (
        SELECT "deleted_id"::uuid
        FROM jsonb_to_recordset(jDelete) AS (id int, table_name text, deleted_id text)
        WHERE table_name = 'RHighlights'
    )
	returning "cPageno","nSessionId" ,"nUserid" 
	) select jsonb_agg(distinct t.*) into jHighlghts from tbl t;

    DELETE FROM "RHighlightMapid"
    WHERE "nMapid" IN (
        SELECT "deleted_id"::uuid
        FROM jsonb_to_recordset(jDelete) AS (id int, table_name text, deleted_id text)
        WHERE table_name = 'RHighlightMapid'
    );

    OPEN ref FOR
        SELECT 1 AS msg,coalesce(jIssues,'[]'::jsonb) as "jIssues",coalesce(jHighlghts,'[]'::jsonb) as "jPages";

    RETURN ref;
END;
$function$
