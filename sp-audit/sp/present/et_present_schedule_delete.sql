CREATE OR REPLACE FUNCTION present.et_present_schedule_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid; nPCid uuid;

BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPCid := NULLIF(parameter ->>'nPCid','')::uuid;

if exists(select * from present."PMContact" where "nPCid" = nPCid)then 

-- select * from "PMContact"
	
		UPDATE present."PMContact"
		SET "dDelDt" = now()
		WHERE "nPCid" = nPCid;

	open ref for 
	select 1 as msg,'schedule deleted' as value;

else

	open ref for select  -1 as msg,'schedule not Exists' as value;

end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
