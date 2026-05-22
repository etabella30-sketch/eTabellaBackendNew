CREATE OR REPLACE FUNCTION realtime.et_factsheet_issues(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

/*
 select * from realtime.et_factsheet_issues ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";

 select * From "RIssueMaster"
*/
    OPEN ref1 FOR
	select f."nIssueid",f."nImpactid",f."nRelevanceid",
	rel."cCodename" as "cRelevance",imp."cCodename" as "cImpact",
	i."cIName",i."cColor"
	from "FMIssue" f 
	join "RIssueMaster" i on i."nIid" = f."nIssueid"
	left join "Codemaster" rel on rel."nCodeid" = f."nRelevanceid"
	left join "Codemaster" imp on imp."nCodeid" = f."nImpactid"
	where f."nFSid" = nFSid ;

	
    RETURN NEXT ref1;
    
    
END;
$function$
