CREATE OR REPLACE FUNCTION public.et_task_insert_assign(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nTaskid UUID;
    jUsers jsonb;
	jNotify jsonb;
	nMasterid UUID;
	nCaseid UUID;
BEGIN
    nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
    jUsers := parameter ->> 'jUsers';
	nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
--  select * from "TaskMaster"

	nCaseid := (select "nCaseid" from "TaskMaster" where "nTaskid" = nTaskid);

   delete from "TaskShared" where "nTaskid" = nTaskid;

   	WITH inserted_users AS (
		insert into "TaskShared" ("nTaskid","nUserid")
		select nTaskid,userid::uuid
		from jsonb_array_elements_text(jUsers) userid
		RETURNING "nUserid"
	),
    notification_data AS (
    SELECT 
        u."nUserid",
        'Task shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared task with you' as "cMsg",
        nTaskid as "nTaskid",
        u."cToken",
        'TASK-SHARE' as "cType",
        nCaseid as "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr ON cr."nUserid" = nMasterid
	)
    SELECT jsonb_agg(t) INTO jNotify 
	FROM notification_data t;

    open ref for 
		select 1 as msg,'Assigned' as value, jNotify "jNotify";

    -- insert into "TaskShared" ("nTaskid","nUserid")
    -- select nTaskid,userid::uuid from jsonb_array_elements_text(jUsers) userid;    
        
    -- open ref for select 1 msg,'Assigned' value;

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
