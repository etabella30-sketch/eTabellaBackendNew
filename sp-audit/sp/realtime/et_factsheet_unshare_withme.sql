CREATE OR REPLACE FUNCTION realtime.et_factsheet_unshare_withme(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

/*
 select * from realtime.et_factsheet_unshare_withme ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";

 select * From "FMShared"
*/

	delete from "FMShared" where "nFSid" = nFSid and "nUserid"  = nMasterid;

    OPEN ref1 FOR
	select 1 as msg,'Unshared' as value;
    RETURN NEXT ref1;
    
    
END;
$function$
