CREATE OR REPLACE FUNCTION public.et_doc_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nDocid uuid;nMasterid uuid;nDMLids uuid;

BEGIN
nDocid := NULLIF(parameter->>'nDocid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
nDMLids := NULLIF(parameter->>'nDMLids','')::uuid;

if exists (select * from "DocMaster" where "nDocid" = nDocid and  "nUserid" = nMasterid) then

   delete from "DMLinks" where "nDMLids" = nDMLids;

	if not exists(select * from "DMLinks" where "nDocid" = nDocid)	then
		delete from "DocMaster"  where "nDocid" = nDocid;
		delete from "DocDetail"  where "nDocid" = nDocid;
		delete from "DMLinks"  where "nDocid" = nDocid;
		delete from "DMShared"  where "nDocid" = nDocid;
		delete from "Annotations" where "nDocid" = nDocid;
	end if;

		open ref for select 1 msg,'Deleted' value; 

	else 

		open ref for select -1 msg,'You do not have a permission for delete' value; 

end if;

	return ref;
	
END;
$function$
