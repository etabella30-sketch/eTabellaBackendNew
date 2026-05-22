CREATE OR REPLACE FUNCTION public.et_unassign_tag(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nTagid uuid;jBDids jsonb;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nTagid:= NULLIF(parameter ->>'nTagid','')::uuid;
jBDids:= parameter ->>'jBDids';

delete from "BDTags" where "nTagid" = nTagid and jBDids @> to_jsonb("nBundledetailid") and "nUserid" = nMasterid;

open ref for select 1 as msg,'Unassinged' as value;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
