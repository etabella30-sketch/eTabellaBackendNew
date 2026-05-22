CREATE OR REPLACE FUNCTION public.et_fact_get_shared(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;nMasterid uuid;
-- select * from "FactMaster" limit 0
-- select * from "FMShared" order by 1 desc limit 1
-- select * from "ContactMaster" order by 1 desc limit 1
-- update "FactDetail" f set "nColorid" = a."colorid" from "Annotations" a where a."nFSid" = f."nFSid"
-- select * from et_fact_get_shared('{""nFSid"":40}','r');fetch all in ""r""
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

	
	open ref for
   	
	 -- select * from "FMIssue"
	select fc."nFSid",fc."nFMSdid",fc."nUserid",um."cFname",um."cLname",um."cProfile"
	from "FMShared" fc
	join "UserMaster" um on um."nUserid" = fc."nUserid"
	 where fc."nFSid"  = nFSid;
	 
	 
	 RETURN ref;
	 
END;
$function$
