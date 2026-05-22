CREATE OR REPLACE FUNCTION public.et_unassign_task(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nTaskid uuid;jBDids jsonb;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nTaskid:= NULLIF(parameter ->>'nTaskid','')::uuid;
jBDids:= parameter ->>'jBDids';
-- select * from "BDContacts"
delete from "BDTasks" where "nTaskid" = nTaskid and jBDids @> to_jsonb("nBundledetailid") and "nUserid" = nMasterid;

open ref for select 1 as msg,'Unassinged' as value;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
