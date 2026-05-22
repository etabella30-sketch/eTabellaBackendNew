CREATE OR REPLACE FUNCTION task.et_report_export(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nTid uuid; nRid uuid;
BEGIN

	nTid := NULLIF(parameter ->>'nTid','')::uuid;
	nRid := NULLIF(parameter ->>'nRid','')::uuid;
	
/*
SELECT * FROM task.et_report_export('{"nTid":71, "nRid":4}', 'r1'); FETCH ALL IN "r1";
 */

    OPEN ref FOR 
		SELECT bd."cFilename", bd."cFilesize", trd."dStartDt", trd."dEndDt", 
			CASE trd."nStatus"
				WHEN 0 THEN 'Pending'
				WHEN 1 THEN 'Success'
				WHEN 2 THEN 'Failed'
	        ELSE 'Unknown'
	    	END AS "Status"
		FROM task."TaskRemarkDetail" trd
		JOIN task."TaskDetail" td ON td."nTDid" = trd."nTDid"
		JOIN "BundleDetail" bd ON bd."nBundledetailid" = td."nBDid"
		WHERE "nTid" = nTid
		AND "nRid" = nRid;
	
    RETURN ref; -- Return the cursor
END;
$function$
