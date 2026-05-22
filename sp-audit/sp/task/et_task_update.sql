CREATE OR REPLACE FUNCTION task.et_task_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nTid uuid;nCompleted int;nFailed int;dStartDt timestamp;dLastUpdateDt timestamp;jSteps jsonb;

BEGIN
	
nTid := NULLIF(parameter ->>'nTid','')::uuid;
nCompleted := parameter ->>'nCompleted';
nFailed := parameter ->>'nFailed';
dStartDt := nullif((parameter ->>'dStartDt')::text,'');
dLastUpdateDt := nullif((parameter ->>'dLastUpdateDt')::text,'');
jSteps := nullif((parameter ->>'jSteps')::text,'');

/*
  select * from task.et_task_update ('{""nTid"":1,""isDeepscan"":true,""nBundleid"":1,""nBundledetailid"":0,""nCaseid"":289,""nMasterid"":59}','r1');fetch all in ""r1"";

select * from task."TaskMaster"

select * from task."TaskQueueDetail"

select * from task."TaskQueueDetail"
 */

update task."TaskMaster" 
	set "nFailed"=nFailed, "nCompleted"=nCompleted,
	"cStatus" = 'C',"dStartDt" = dStartDt, "dLastDt" = dLastUpdateDt
	where "nTid" = nTid;

with tbl as (
select * from jsonb_to_recordset(jSteps) as t("total" int,"complete" int,"failed" int,"pending" int,"processing" int,"startDt" timestamp,"lastDt" timestamp,"nRid" int)
) insert into task."TaskQueueDetail"("nTid","nRid","nTotal","nCompleted","nFailed","dStartDt","dEndDt")
	select nTid,t."nRid",t."total",t."complete",t."failed",t."startDt",t."lastDt"
	from tbl t
	where not exists (select * from task."TaskQueueDetail" a where a."nTid" = nTid and a."nRid" = t."nRid");

open ref for 
	select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
