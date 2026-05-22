CREATE OR REPLACE FUNCTION realtime.et_factsheet_contacts(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

/*
 select * from realtime.et_factsheet_issues ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";

 select * From "ContactMaster" order by "dCreateDt" desc
 
 select * From "FMContact" where "nFSid" = '33eacf84-6455-4213-b4a4-3226a04f1336'
*/
    OPEN ref1 FOR
	select c."nContactid",m."cFname",m."cLname",m."cNote",m."dCreateDt",
	m."nCompanyid",m."nRoleid",m."cType",m."cMentiontag",m."cOccupation",m."nPartyid",m."cProfile",
	com."cCompany",	rol."cRole"
	from "FMContact" c 
	join "ContactMaster" m on m."nContactid" = c."nContactid"
	left join "ContactCompany" com on com."nCompanyid" = m."nCompanyid"
	left join "ContactRole" rol on rol."nCRoleid" = m."nRoleid" 
	where c."nFSid" = nFSid ;

	
    RETURN NEXT ref1;
    
    
END;
$function$
