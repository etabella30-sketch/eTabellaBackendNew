CREATE OR REPLACE FUNCTION public.et_realtime_sync_logs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jLogs jsonb;jInserted jsonb;
BEGIN
    jLogs := parameter ->> 'jLogs';

	with tbl as (
	select * from jsonb_to_recordset(jLogs) as ("nRTLid" int,"nUserid" uuid,"nSesid" uuid,"cStatus" text,"dCreateDt" timestamp,"dLeaveDt" timestamp,"nRefRTLid" uuid) 
	),insert_op as (insert into "RTLogs"("nUserid","nSesid","cStatus","dCreateDt","dLeaveDt","cSource","nTempid")
	select "nUserid","nSesid","cStatus","dCreateDt","dLeaveDt",'O',"nRTLid" From tbl where "nRefRTLid" is null
	returning *
	),update_op as (
		update "RTLogs" r set "dLeaveDt" = t."dLeaveDt" from tbl t where t."nRefRTLid" = r."nRTLid"
		returning *
	),dt as (
		select "nRTLid","nTempid" as "nORTLid" from insert_op i
	)select jsonb_agg(i.*) into jInserted from dt i;

    OPEN ref FOR
        SELECT 1 AS msg,coalesce(jInserted,'[]'::jsonb) as "jInserted";

    RETURN ref;
END;
$function$
