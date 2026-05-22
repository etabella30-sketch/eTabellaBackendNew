CREATE OR REPLACE FUNCTION public.et_assign_task(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;jFiles jsonb;nTaskid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;

if not exists(select * from "BDTasks" where "nTaskid" = nTaskid and "nUserid" = nMasterid and jFiles @> to_jsonb("nBundledetailid") ) then
insert into "BDTasks" ("nBundledetailid","nUserid","nTaskid")
select id::uuid,nMasterid,nTaskid from jsonb_array_elements_text(jFiles) id;

open ref for select 1 as msg,'Assinged' as value;
else 
	open ref for select -1 as msg,'Already Assinged' as value;
end if;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
