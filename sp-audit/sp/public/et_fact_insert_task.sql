CREATE OR REPLACE FUNCTION public.et_fact_insert_task(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jTasks jsonb;

-- select * from "FMTasks" limit 0
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jTasks := parameter->>'jTasks';

	delete from "FMTasks" where "nFSid" = nFSid;
	
	insert into "FMTasks" ("nFSid","nTaskid")	
	SELECT nFSid,jsonb_array_elements_text(jTasks)::uuid AS i;
	
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$
