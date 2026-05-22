CREATE OR REPLACE FUNCTION task.et_task_failed(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nTid uuid;

BEGIN
	
nTid := NULLIF(parameter ->>'nTid','')::uuid;

/*
  select * from task.et_task_failed ('{""nCaseid"":1122,""nMasterid"":464}','r1');fetch all in ""r1"";
 
select *  from task."TaskMaster"

*/

  update task."TaskMaster"
    set "cStatus" = 'F'
    where "nTid" = nTid; 

open ref for 
          SELECT 1 AS "msg", 'Task Failed' AS "value";
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
