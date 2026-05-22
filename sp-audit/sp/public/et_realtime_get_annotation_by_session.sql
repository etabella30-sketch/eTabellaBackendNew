CREATE OR REPLACE FUNCTION public.et_realtime_get_annotation_by_session(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
 	
    OPEN ref FOR
    	select  "nIDid","cONote","jCordinates", "cPageno" 
		From  "RIssueDetail" 
		where "nSessionid" = nSessionid and coalesce("cONote",'') !=''
		and "jTCordinates" is null 
		and "jCordinates" is not null 
		--and  "bTrf" = false
--and "dCreatedt"::date = now()::date
		--and "nIDid" in(699, 700)
		order by "nIDid";  

    RETURN ref;
END;
$function$
