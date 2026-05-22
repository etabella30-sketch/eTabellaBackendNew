CREATE OR REPLACE FUNCTION public.et_fact_get_contact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;nMasterid uuid;
-- select * from "FactMaster" limit 0
-- select * from "FMContact" order by 1 desc limit 1
-- select * from "ContactMaster" order by 1 desc limit 1
-- update "FactDetail" f set "nColorid" = a."colorid" from "Annotations" a where a."nFSid" = f."nFSid"

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

	
	open ref for
   	
	 -- select * from "ContactMaster"
	select fc."nFSid",fc."nFMCid",fc."nContactid",cm."cFname",cm."cLname",cm."cProfile",cm."cEmail"
		 from "FMContact" fc
	join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
	 where fc."nFSid"  = nFSid;
	 
	 
	 RETURN ref;
	 
END;
$function$
