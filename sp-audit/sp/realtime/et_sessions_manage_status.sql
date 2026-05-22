CREATE OR REPLACE FUNCTION realtime.et_sessions_manage_status(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nSesid UUID;cStatus text;
BEGIN

nSesid := (parameter ->>'nSesid')::UUID;
cStatus := parameter ->>'cStatus';

/*

 select * from realtime.et_sessions_manage_status ('{"nSesid":"abf22dfe-8730-4bf6-808d-b32fb7dab234","cStatus":"C"}','r1');fetch all in "r1";
 
select * from "RSessionMaster" where "nSesid" = 'bf22dfe-8730-4bf6-808d-b32fb7dab234'

select * from "RealtimeServers"
*/

    
	update "RSessionMaster" set "cStatus" = cStatus where  "nSesid" = nSesid;
    OPEN ref1 FOR 
		select 1 as msg,'Session status updated' as value;
     
        
    RETURN NEXT ref1;
    
    
 
END;
$function$
