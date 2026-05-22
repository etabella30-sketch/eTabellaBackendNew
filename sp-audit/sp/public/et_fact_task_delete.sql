CREATE OR REPLACE FUNCTION public.et_fact_task_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nTaskid uuid;nMasterid uuid;
nFSid uuid;

BEGIN
nTaskid := parameter ->>'nTaskid';
nFSid := parameter ->>'nFSid';
nMasterid := parameter ->>'nMasterid';
	if exists(select * from "FMTasks" where "nTaskid" = nTaskid  and "nFSid" = nFSid) then
		delete from "FMTasks" where "nTaskid" = nTaskid  and "nFSid" = nFSid;
		open ref for select 1 msg,'Deleted' value;
	
	else
	
		open ref for select -1 msg,'You do not have a permission for delete' value;

	end if;
 Return ref;
 -- Return the cursor to the caller
    END;
$function$
