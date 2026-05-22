CREATE OR REPLACE FUNCTION public.et_realtime_get_rhighlights_by_session_test1(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
 	
    OPEN ref FOR
    	select "nHid" ,"cNote","jCordinates","cPageno","cLineno" ,"cTime"	From "RHighlights"  
		where "nSessionId" = nSessionId; -- and "nHid" in ('a3e0d404-4ae7-4068-a132-757c0e91c23c');
		  

    RETURN ref;
END;
$function$
