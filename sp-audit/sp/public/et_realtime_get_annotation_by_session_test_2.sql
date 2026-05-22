CREATE OR REPLACE FUNCTION public.et_realtime_get_annotation_by_session_test_2(parameter json, ref refcursor)
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
		--and "jTCordinates" is null 
		and "jCordinates" is not null
		--and  "bTrf" = false
--and "dCreatedt"::date = now()::date
	--and "nIDid" in('3648fc86-8b37-40e7-a03d-0b4476e18b8b') -- in(699, 700) ,'01e76041-42c7-4d5d-94ba-741cd61a26f7'
		order by "nIDid";  

    RETURN ref;
END;
$function$
