CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_claim_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nICid UUID;jIssueids jsonb;
	msg int;msg_text text;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;

    msg := 1;
        -- Check if the issue name exists
	IF NOT EXISTS (SELECT * FROM "IssueCategory" WHERE "nICid" = nICid and "nUserid" IS NOT NULL) THEN
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
$function$
