CREATE OR REPLACE FUNCTION public.et_unassign_contact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nContactid uuid;jBDids jsonb;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nContactid:= NULLIF(parameter ->>'nContactid','')::uuid;
jBDids:= parameter ->>'jBDids';
-- select * from "BDContacts" order by 1 desc
delete from "BDContacts" where "nContactid" = nContactid and jBDids @> to_jsonb("nBundledetailid") and "nUserid" = nMasterid;

open ref for select 1 as msg,'Unassinged' as value;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
