CREATE OR REPLACE FUNCTION task.et_task_detail_log_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare jList jsonb;

BEGIN
	
jList := parameter ->>'jList';

with tbl as (
select * from jsonb_to_recordset(jList) as t("nTid" uuid,"nRid" int,"nBDid" uuid,"value" text,"date" timestamp)
)
	insert into task."TaskRemarkDetail"("nTDid","nRid")
	select distinct d."nTDid",t."nRid"
	from tbl t 
	join task."TaskDetail" d on d."nTid" = t."nTid" and d."nBDid" = t."nBDid"
	left join task."TaskRemarkDetail" r on r."nTDid" = d."nTDid" and r."nRid" = t."nRid"
	where r."nTDid" is null;

with tbl as (
select * from jsonb_to_recordset(jList) as t("nTid" uuid,"nRid" int,"nBDid" uuid,"value" text,"date" timestamp)
)	update task."TaskRemarkDetail" s set  "dStartDt" = t."date"  
	from tbl t
	join task."TaskDetail" d on d."nTid" = t."nTid" and d."nBDid" = t."nBDid" 
	where d."nTDid" = s."nTDid" and s."nRid" = t."nRid" and t."value" ='S';

with tbl as (
select * from jsonb_to_recordset(jList) as t("nTid" uuid,"nRid" int,"nBDid" uuid,"value" text,"date" timestamp)
		where t."value" in ('C','F')
) update task."TaskRemarkDetail" s set  "dEndDt" = t."date"  ,
	"nStatus" = (case t."value" when 'C' then 1 when 'F' then 2 else s."nStatus" end) 
	from tbl t
	join task."TaskDetail" d on d."nTid" = t."nTid" and d."nBDid" = t."nBDid" 
	where d."nTDid" = s."nTDid" and s."nRid" = t."nRid";

	
open ref for 
	select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
