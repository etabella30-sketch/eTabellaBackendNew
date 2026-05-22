CREATE OR REPLACE FUNCTION public.et_assign_contact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;jFiles jsonb;nContactid uuid;

BEGIN
/*
 
 select * from public.et_assign_contact ('{"nContactid":"2311665b-71b9-4aa0-8b22-3e979864d489","jFiles":"[\"43b64dcf-7f5c-4e19-bed2-695bd001aea2\"]","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";
 
 select * from "BDContacts"
 */
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
-- select * from "BDContacts"
if not exists(select * from "BDContacts" where "nContactid" = nContactid and "nUserid" = nMasterid and jFiles @> to_jsonb("nBundledetailid") ) then
insert into "BDContacts" ("nBundledetailid","nUserid","nContactid")
select id::uuid,nMasterid,nContactid from jsonb_array_elements_text(jFiles) id;

open ref for select 1 as msg,'Assinged' as value;
else 
	open ref for select -1 as msg,'Already Assinged' as value;
end if;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
