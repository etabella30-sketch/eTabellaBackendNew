CREATE OR REPLACE FUNCTION public.et_fact_convert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid; nMasterid uuid; jLinktype jsonb;

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jLinktype := parameter->>'jLinktype';
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

update "FactDetail" set "jLinktype"=jLinktype,"cType"='M' 
where "nFSid" = nFSid;

-- select * from "Annotations" 
delete from "Annotations" where "nFSid" = nFSid;
	
open ref for
	select 1 as msg,'Updated' as value;

	return ref;
	
END;
$function$
