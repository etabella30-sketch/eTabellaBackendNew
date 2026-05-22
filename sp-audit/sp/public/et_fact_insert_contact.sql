CREATE OR REPLACE FUNCTION public.et_fact_insert_contact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jContacts jsonb;

-- select * from "FMContact" limit 0
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jContacts := parameter->>'jContacts';

	delete from "FMContact" where "nFSid" = nFSid;
	
	insert into "FMContact" ("nFSid","nContactid")	
	SELECT nFSid,jsonb_array_elements_text(jContacts)::uuid AS i;
	
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$
