CREATE OR REPLACE FUNCTION realtime.et_doc_get_shared(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nDocid uuid;nMasterid uuid;
-- select * from "FactMaster" limit 0
-- select * from "FMShared" order by 1 desc limit 1
-- select * from "ContactMaster" order by 1 desc limit 1
-- update "FactDetail" f set "nColorid" = a."colorid" from "Annotations" a where a."nFSid" = f."nFSid"
-- select * from et_fact_get_shared('{""nFSid"":40}','r');fetch all in ""r""
BEGIN
nDocid := NULLIF(parameter->>'nDocid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

	
	open ref for
   	
	  select ds."nDocid",ds."nUserid",um."cFname",um."cLname",um."cProfile",
	 ds."bCanComment", ds."bCanEdit", ds."bCanReshare"
	 from "DMShared" ds
	 join "UserMaster" um on um."nUserid" = ds."nUserid"
	 where ds."nDocid"  = nDocid;
	 
	 
	 RETURN ref;
	 
END;
$function$
