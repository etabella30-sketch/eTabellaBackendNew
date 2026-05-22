CREATE OR REPLACE FUNCTION realtime.et_session_job(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare jSessions jsonb;
BEGIN

jSessions := parameter ->>'jSessions';

/*

select * from realtime.et_session_job ('{"jSessions":["3283b84b-8959-4de5-82a5-443d98c0a7e1","a512d3de-3caf-47a0-a6eb-95de9e1ddf90"]}','r1');fetch all in "r1";
	select * from "RSessionMaster"
*/

    
    OPEN ref1 FOR 
	select "nSesid","cName" from "RSessionMaster" r where jSessions @> to_jsonb(r."nSesid") and "cStatus" = 'C'
    ;    
        
    RETURN NEXT ref1;
    
END;
$function$
