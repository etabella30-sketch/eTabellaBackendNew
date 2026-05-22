CREATE OR REPLACE FUNCTION task.et_task_detail_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nTid uuid;jList jsonb;

BEGIN
	
nTid := NULLIF(parameter ->>'nTid','')::uuid;
jList := parameter ->>'jList';

/*
  select * from task.et_task_detail_update ('{""nTid"":1,""nCompleted"":66,""nFailed"":0,""isDeepscan"":true,""nBundleid"":1,""nBundledetailid"":0,""nCaseid"":289,""nMasterid"":59}','r1');fetch all in ""r1"";

select * from task."TaskMaster"
select * from task."TaskDetail"
select * from task."TaskRemarkDetail"
select * from task."HyperlinkMaster"

truncate table task."TaskMaster" restart identity cascade;
truncate table task."HyperlinkMaster" restart identity ;

 */

/*
with tbl as (
select * from jsonb_to_recordset(jList) as t(""id"" uuid,""nRid"" int,""startdt"" timestamp,""enddt"" timestamp,""status"" smallint)
) 	insert into task."TaskRemarkDetail"("nTDid","nRid","dStartDt","dEndDt","nStatus")
	select t."nTDid",tbl."nRid",tbl."startdt",tbl."enddt",tbl."status"
	from task."TaskDetail" t
	join tbl on tbl."id" = t."nBDid"
	where not exists (select * from task."TaskRemarkDetail" a where a."nTDid" = t."nTDid" and a."nRid" = tbl."nRid");*/

open ref for 
	select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
