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
$function$
