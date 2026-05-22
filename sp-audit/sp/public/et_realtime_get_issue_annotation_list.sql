CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_annotation_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSessionid UUID;
    nCaseid UUID;
    nUserid UUID;
  begin

    nSessionid := NULLIF(parameter ->> 'nSessionid', '')::UUID;
	nCaseid := NULLIF(parameter ->> 'nCaseid', '')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
   
    OPEN ref FOR
		select "nIDid","cPageno" "pageIndex","jCordinates" cordinates,"cColor" color,"nICount" 
		From "RIssuesummary" id
		Where id."nCaseid" = nCaseid and id."nSessionid" = nSessionid and id."nUserid" = nUserid;
    RETURN ref;
END;
$function$
