CREATE OR REPLACE FUNCTION realtime.et_annot_versions(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nIDid UUID;
BEGIN

nIDid := (parameter ->>'nIDid')::UUID;

/*

 select * from realtime.et_annot_versions ('{"nIDid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";
 

select * from "RSessionMaster" where "nSesid" = '518f6223-fe7a-436d-bb9c-613eb0bffc7e'

  select * from "RSessionMaster" where "cSessionUnicId" is not null order by "cSessionUnicId"

select * from "RealtimeServers"
*/

    
    OPEN ref1 FOR 
		select * from realtime."RIssueDetailLog" where "nIDid" = nIDid    ;    
        
    RETURN NEXT ref1;
    
    
END;
$function$
