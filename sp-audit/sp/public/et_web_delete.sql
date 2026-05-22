CREATE OR REPLACE FUNCTION public.et_web_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nWebid uuid; nMasterid uuid;

BEGIN
nWebid := NULLIF(parameter ->>'nWebid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_web_delete ('{"nWebid":"86","nMasterid":"43"}','r');fetch all in "r";

	if exists(select * from "WebMaster" where "nWebid" = nWebid and "nUserid" = nMasterid) then
		delete from "WebMaster" where "nWebid" = nWebid;
		delete from "WebDetail" where "nWebid" = nWebid;
		delete from "WMShared" where "nWebid" = nWebid;
		open ref for select 1 msg,'Deleted' value;
	
	else
	
		open ref for select -1 msg,'You do not have a permission for delete' value;

	end if;
 Return ref;
 -- Return the cursor to the caller
    END;
$function$
