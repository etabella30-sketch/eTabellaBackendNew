CREATE OR REPLACE FUNCTION public.et_realtime_get_rhighlights_by_session(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
 	

	
	
    OPEN ref FOR
    	select "nHid" ,"cNote","jCordinates","cPageno","cLineno" ,"cTime"	From "RHighlights"  
		where "nSessionId" = nSessionId ;-- and "nHid" in (70);
		  

    RETURN ref;
END;
$function$
