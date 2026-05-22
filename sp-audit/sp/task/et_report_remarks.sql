CREATE OR REPLACE FUNCTION task.et_report_remarks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nTCatid int;
BEGIN

nTCatid := NULLIF(parameter ->>'nTCatid','')::int;
	
/*
SELECT * FROM task.et_report_remarks('{"nTCatid": 2, "nPageno": 1, "nBatchsize": 10}', 'r1');
FETCH ALL IN "r1";
 */

    OPEN ref FOR 
		select * from task."TaskRemarks" where "nTCatid" = nTCatid order by "nSerial";
	
    RETURN ref; -- Return the cursor
END;
$function$
