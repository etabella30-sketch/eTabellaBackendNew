CREATE OR REPLACE FUNCTION realtime.et_factsheet_tasks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nFSid uuid; nMasterid uuid;

BEGIN
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

-- select * from et_factsheet_tasks ('{"nFSid":"33eacf84-6455-4213-b4a4-3226a04f1336"}','r1','r2','r3');fetch all in "r1";
-- select * from realtime.et_factsheet_tasks ('{"nFSid":"33eacf84-6455-4213-b4a4-3226a04f1336"}','r1','r2','r3');fetch all in "r1";fetch all in "r2";fetch all in "r3";

open ref1 for 

-- select * from "FMTasks" where "nFSid" = '33eacf84-6455-4213-b4a4-3226a04f1336'

	select distinct  t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
	td."nProgress",td."cTasktype", td."nStatus", td."dStartDt",
	td."dEndDt", td."cAssign", td."cRemind",td."cStatusChange",
	c."cCodename" "cPriority",
	cm."cCodename" "cStatustext"
	from "TaskMaster" t
	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	left join "Codemaster" c on c."nCodeid"= "nPriority"
	left join "Codemaster" cm on cm."nCodeid"= "nStatus"
	join "FMTasks" ft on ft."nTaskid" = t."nTaskid"
	where ft."nFSid" = nFSid;
	
 RETURN next ref1;    
 
 open ref2 for 
	select distinct t."nTaskid", t."nUserid",
	"cFname","cLname","cProfile"
	from "TaskShared" t
	join "TaskMaster" tm on tm."nTaskid" = t."nTaskid"
	join "FMTasks" ft on ft."nTaskid" = tm."nTaskid"
	join "UserMaster" u on u."nUserid" = t."nUserid"
	where ft."nFSid" = nFSid 
	;
 RETURN next ref2;   
 
 open ref3 for 
	select t."nTaskid","nTRid","dReminderDt"
	from "TaskReminders" t
	join "TaskMaster" tm on tm."nTaskid" = t."nTaskid"
	join "FMTasks" ft on ft."nTaskid" = tm."nTaskid"
	where ft."nFSid" = nFSid ;
 RETURN next ref3;   
 
    END;
$function$
