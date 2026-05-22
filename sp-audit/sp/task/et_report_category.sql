CREATE OR REPLACE FUNCTION task.et_report_category(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nCaseid uuid;
BEGIN
	nCaseid := NULLIF(parameter->> 'nCaseid','')::uuid;

/*
SELECT * FROM task.et_report_category('{"nTid": 1, "nPageno": 1, "nBatchsize": 10}', 'r1');
FETCH ALL IN "r1";

	
		select c.*
		from task.""TaskCategory""  c
 */

    OPEN ref FOR 
		select c.*,count(distinct t."nTid") as "nTotaltasks"
		from task."TaskCategory"  c
		left join task."TaskMaster" t on t."nTCatid" = c."nTCatid" and t."cStatus" = 'P' and 
		case when nCaseid IS NOT NULL then t."nCaseid" = nCaseid else true end
		group by c."nTCatid",c."cCategory",c."cICon"
	order by 1
	;
	
    RETURN ref; -- Return the cursor
END;
$function$
