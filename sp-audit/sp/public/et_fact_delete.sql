CREATE OR REPLACE FUNCTION public.et_fact_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;nMasterid uuid;
-- select * from "FactMaster" limit 0
-- select * from "TaskMaster" order by 1 desc limit 1
-- select * from "FMTasks" order by 1 desc limit 1
-- select * from "TaskDetail" order by 1 desc limit 1
-- select * from "TaskReminders" order by 1 desc limit 1

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
-- select * from "Annotations"
	if exists(select * from "FactMaster" where "nUserid" = nMasterid and "nFSid" = nFSid)	then
		delete from "FactMaster"  where "nFSid" = nFSid;
		delete from "FactDetail"  where "nFSid" = nFSid;
		delete from "FMLinks"  where "nFSid" = nFSid;
		delete from "FMIssue"  where "nFSid" = nFSid;
		delete from "FMTasks"  where "nFSid" = nFSid;
		delete from "FMContact"  where "nFSid" = nFSid;
		delete from "FMShared"  where "nFSid" = nFSid;
		delete from "FMShared"  where "nFSid" = nFSid;
		delete from "Annotations" where "nFSid" = nFSid;
		open ref for select 1 msg,'Deleted' value; 
	else	
		open ref for select -1 msg,'You do not have a permission for delete' value; 
	end if;
	
	return ref;
	
END;
$function$
