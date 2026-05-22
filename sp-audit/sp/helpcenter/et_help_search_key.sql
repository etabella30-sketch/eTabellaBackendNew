CREATE OR REPLACE FUNCTION helpcenter.et_help_search_key(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nSMid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSMid := NULLIF(parameter ->>'nSMid','')::uuid;

		update helpcenter."SubModule" set "nCount" = coalesce("nCount",0) + 1 where "nSMid" = nSMid;

open ref for select 1 msg;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
