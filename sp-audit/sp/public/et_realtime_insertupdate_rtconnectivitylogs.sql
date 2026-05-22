CREATE OR REPLACE FUNCTION public.et_realtime_insertupdate_rtconnectivitylogs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nId SMALLINT;
    dDt TIMESTAMP;
    cMsg TEXT;
    nUserid UUID;
    nLogid int;
    cPermission CHAR(1); -- Permission to insert 'I' or delete 'D'
    inserted_id INT; -- Variable to store the inserted identity value
BEGIN
    nId := (parameter ->> 'nId')::SMALLINT;
    dDt := (parameter ->> 'date')::TIMESTAMP;
    cMsg := parameter ->> 'message';
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    cPermission := (parameter ->> 'cPermission')::CHAR(1);
    nLogid := (parameter ->> 'nLogid')::INT;
    IF cPermission = 'I' THEN
        -- Insert into the table and return the inserted identity value
        INSERT INTO "RTConnectivityLogs" ("nId", "dDt", "cMsg", "nUserid")
        VALUES (nId, dDt, cMsg, nUserid)
        RETURNING "nLogid" INTO inserted_id;
        
         OPEN ref FOR SELECT 1 AS msg, 'Success: Inserted' AS message, inserted_id AS "nLogid";
    ELSIF cPermission = 'D' THEN
        -- Delete the record based on nId and cMsg
        DELETE FROM "RTConnectivityLogs"
        WHERE "nLogid" = nLogid;
        OPEN ref FOR SELECT 1 AS msg, 'Success: Deletd' AS message, inserted_id AS "nLogid";
        -- Set inserted_id to NULL as the record is deleted
        inserted_id := NULL;
    ELSE
        -- Invalid permission provided
                OPEN ref FOR SELECT -1 AS msg, 'Success: Invalid permission' AS message, inserted_id AS "nLogid";
      
    END IF;

    -- Open the cursor with success message and inserted identity value
   
    RETURN ref;
END;
$function$
