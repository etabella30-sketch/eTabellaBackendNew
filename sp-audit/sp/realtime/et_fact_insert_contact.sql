CREATE OR REPLACE FUNCTION realtime.et_fact_insert_contact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jContacts jsonb;

-- select * from "FMContact" limit 0
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jContacts := parameter->>'jContacts';

-- select * from public.et_fact_insert_contact_v2 ('{"nColorid":"f3de7dc9-4509-4583-a192-73db940bead4","jIssues":"[[\"f3de7dc9-4509-4583-a192-73db940bead4\",0,0]]","cFtype":"QF","cFFrom":"RT","nCaseid":"e0cd23d4-12fa-4b80-bdc0-88ec4287957b","jContacts":"[]","nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699","nFSid":"1bb8454a-64d3-43d0-8bba-afbaf3004b85"}','r1');fetch all in "r1";

	delete from "FMContact" where "nFSid" = nFSid;
	
	insert into "FMContact" ("nFSid","nContactid")	
	SELECT nFSid,jsonb_array_elements_text(jContacts)::uuid AS i;
	
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$
