CREATE OR REPLACE FUNCTION realtime.et_fact_get_shared(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;nMasterid uuid;--jPermittedUsers jsonb;
-- select * from "FactMaster" limit 0
-- select * from "FMShared" order by 1 desc limit 1
-- select * from "ContactMaster" order by 1 desc limit 1
-- update "FactDetail" f set "nColorid" = a."colorid" from "Annotations" a where a."nFSid" = f."nFSid"
-- select * from et_fact_get_shared('{"nFSid":"d412181f-1c0c-4a35-a17f-cbba6f8d8f51"}','r');fetch all in "r"

-- select * from "FMShared"
/*

*/

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
--jPermittedUsers :=parameter->'jPermittedUsers';
	
	open ref for
   	
	 -- select * from "FMIssue"
	 select fc."nFSid",fc."nFMSdid",fc."nUserid",um."cFname",um."cLname",um."cProfile",
	 fc."bCanComment", fc."bCanEdit", fc."bCanReshare"
	 from "FMShared" fc
	 join "UserMaster" um on um."nUserid" = fc."nUserid"
	 where fc."nFSid"  = nFSid;
	    /*
		OPEN ref FOR
        SELECT 
            nFSid AS "nFSid",
            NULL::uuid AS "nFMSdid",      -- placeholder since FMShared is removed
            j."userId"::uuid AS "nUserid",
            um."cFname",
            um."cLname",
            um."cProfile",
            j."bCanComment",   -- or keep as "view" if preferred
            j."bCanEdit",
            j."bCanReshare"
        FROM (
            SELECT *
            FROM jsonb_to_recordset((parameter->>'jPermittedUsers')::jsonb) AS x(
                "userId" text,
                "view" boolean,
                "bCanEdit" boolean,
                "bCanReshare" boolean,
                "bCanComment" boolean
            ) where "userId" != '*'
        ) j
        JOIN "UserMaster" um 
            ON um."nUserid" = j."userId"::uuid;
	 */
	 RETURN ref;
	 
END;
$function$
