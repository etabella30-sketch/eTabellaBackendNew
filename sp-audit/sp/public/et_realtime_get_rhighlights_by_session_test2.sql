CREATE OR REPLACE FUNCTION public.et_realtime_get_rhighlights_by_session_test2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
 	

	
	
    OPEN ref FOR
    	select "nHid" ,"cNote","jCordinates","cPageno","cLineno" ,"cTime"	From "RHighlights"  
		where "nSessionId" = nSessionId  
		and  "nUserid" in ('29ff4a56-87a7-4777-9cc4-24635851eb5e');
		--and "nHid" in ('7269b75c-e2c8-44a1-8b8a-b5267e02ccaf');
		  

    RETURN ref;
END;
$function$
