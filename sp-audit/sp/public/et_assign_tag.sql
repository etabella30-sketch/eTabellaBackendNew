CREATE OR REPLACE FUNCTION public.et_assign_tag(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;jFiles jsonb;nTagid uuid;

BEGIN

/*
select * from public.et_assign_tag ('{"nTagid":"d22556e9-122e-4e33-8a02-470116c9634f","jFiles":"[\"43b64dcf-7f5c-4e19-bed2-695bd001aea2\"]","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

*/

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';
nTagid := NULLIF(parameter ->>'nTagid','')::uuid;
-- select * from "BDContacts"
if not exists(select * from "BDTags" where "nTagid" = nTagid and "nUserid" = nMasterid and jFiles @> to_jsonb("nBundledetailid") ) then
insert into "BDTags" ("nBundledetailid","nUserid","nTagid")
select id::uuid,nMasterid,nTagid from jsonb_array_elements_text(jFiles) id;

open ref for select 1 as msg,'Assinged' as value;
else 
	open ref for select -1 as msg,'Already Assinged' as value;
end if;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
