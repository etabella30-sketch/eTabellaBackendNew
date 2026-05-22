CREATE OR REPLACE FUNCTION realtime.et_factsheet_delete(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

/*
 select * from realtime.et_factsheet_delete ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";

 select * From "FMShared"
 
*/

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
 
	select "nCaseid" into nCaseid from "FactMaster" where  "nFSid" =  nFSid;
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

	
if exists (select * from "FactMaster" where "nFSid" = nFSid and "nUserid" = nMasterid) OR COALESCE(isAdmin, FALSE) then

	delete from "FactMaster" where "nFSid" = nFSid;
	delete from "FactDetail" where "nFSid" = nFSid;
	delete from "FMIssue" where "nFSid" = nFSid;
	delete from "FMShared" where "nFSid" = nFSid;
	delete from "FMTasks" where "nFSid" = nFSid;
	delete from "FMLinks" where "nFSid" = nFSid;
	delete from "FMContact" where "nFSid" = nFSid;

    OPEN ref1 FOR
	select 1 as msg,'Deleted' as value;

else 

    OPEN ref1 FOR
	select -1 as msg,'You are not authorized to delete this.' as value;
	

end if;

RETURN NEXT ref1;
    
    
END;
$function$
