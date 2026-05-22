CREATE OR REPLACE FUNCTION task.et_report_tasks_detail(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nTid uuid;
BEGIN

nTid := NULLIF(parameter ->>'nTid','')::uuid;
/*

SELECT * FROM task.et_report_tasks_detail('{"nTid": 1}', 'r1','r2');
FETCH ALL IN "r1";
FETCH ALL IN "r2";

select * from task."TaskRemarks"

select * from task."TaskMaster"
select * from task."TaskDetail"
select * from task."TaskQueueDetail"
select * from task."TaskRemarkDetail" where "nRid" = 2
*/

	
    OPEN ref1 FOR 
		select "nTid","nTotal","nCompleted","nFailed","cStatus","nTCatid"
		from task."TaskMaster" where "nTid" = nTid;
    RETURN NEXT ref1;
    
    OPEN ref2 FOR 
		
	select tr."nRid",tq."nTotal",tq."nCompleted",tq."nFailed",
		tq."dStartDt" as "startDt",tq."dEndDt" as "lastDt"
		from task."TaskMaster" t
		join task."TaskRemarks" tr on tr."nTCatid" = t."nTCatid"
		left join task."TaskQueueDetail" tq on tq."nTid" = t."nTid" and tq."nRid" = tr."nRid"
		where t."nTid" = nTid;
	
		/*SELECT 
    			tr."nRid",
   				COUNT(DISTINCT t."nTDid") AS "nTotal",  -- Total count
    			COUNT(DISTINCT CASE WHEN t."nStatus" = 1::smallint THEN t."nTDid" END) AS "nCompleted",
    			COUNT(DISTINCT CASE WHEN t."nStatus" = 2::smallint THEN t."nTDid" END) AS "nFailed",
    			COUNT(DISTINCT CASE WHEN t."nStatus" = 0::smallint THEN t."nTDid" END) AS "nPending"
			FROM task."TaskDetail" d
			join task."TaskMaster" tm on tm."nTid" = d."nTid"
			join task."TaskRemarks" tr on tr."nTCatid" = tm."nTCatid"
			left JOIN task."TaskRemarkDetail" t ON d."nTDid" = t."nTDid"
			WHERE d."nTid" = nTid
			GROUP BY tr."nRid";*/

 	RETURN NEXT ref2;
END;
$function$
