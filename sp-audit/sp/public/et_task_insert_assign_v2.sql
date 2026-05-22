CREATE OR REPLACE FUNCTION public.et_task_insert_assign_v2(parameter json, ref refcursor)
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

  WITH payload AS (
    SELECT
      (e->>'nUserid')::uuid AS "nUserid",
      COALESCE((e->>'bCanComment')::boolean, false)    AS "bCanComment",
       COALESCE((e->>'bCanCopy')::boolean, false)    AS "bCanCopy",
        COALESCE((e->>'bCanEdit')::boolean, false)    AS "bCanEdit",
         COALESCE((e->>'bCanReshare')::boolean, false)    AS "bCanReshare"
    FROM jsonb_array_elements(jUsers) e
    WHERE (e ? 'nUserid') AND (e->>'nUserid') IS NOT NULL
  ),
  inserted_users AS (
    INSERT INTO "TaskShared"
      ("nTaskid","nUserid","bCanComment","bCanCopy","bCanEdit","bCanReshare")
    SELECT
      nTaskid, p."nUserid", p."bCanComment", p."bCanCopy", p."bCanEdit", p."bCanReshare"
    FROM payload p
    RETURNING "nUserid"
  ),
--   upserted AS (
--     INSERT INTO "TaskShared" ("nTaskid","nUserid","bCanComment","bCanCopy","bCanEdit","bCanReshare")
--     SELECT
--       nTaskid, p."nUserid", p."bCanComment", p."bCanCopy", p."bCanEdit", p."bCanReshare"
--     FROM payload p
--     ON CONFLICT ("nTaskid","nUserid")
--     DO UPDATE
--     SET 
--         "bCanComment" = EXCLUDED."bCanComment",
--         "bCanCopy"    = EXCLUDED."bCanCopy",
--         "bCanEdit"    = EXCLUDED."bCanEdit",
--         "bCanReshare" = EXCLUDED."bCanReshare"
--     RETURNING "nUserid"
-- ),
  notification_data AS (
    SELECT
      u."nUserid",
      'Task shared' AS "cTitle",
      cr."cFname" || ' ' || cr."cLname" || ' has shared task with you' AS "cMsg",
      nTaskid AS "nTaskid",
      u."cToken",
      'TASK-SHARE' AS "cType",
      nCaseid AS "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr  ON cr."nUserid"  = nMasterid
  )
  SELECT jsonb_agg(t) INTO jNotify FROM notification_data t;
  
    open ref for 
		select 1 as msg,'Assigned' as value, jNotify "jNotify";

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
