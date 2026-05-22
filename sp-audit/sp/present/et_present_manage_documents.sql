CREATE OR REPLACE FUNCTION present.et_present_manage_documents(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nPresentid uuid;nBundledetailid uuid;cPermission text;nPDid uuid;jBd jsonb;

BEGIN
-- select * from present.et_present_manage_documents('{""nPresentid"":1,""jBd"":[1,2,4],""cPermission"":""N"", ""nMasterid"": 366}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cPermission := parameter ->>'cPermission';
jBd := parameter ->>'jBd';
/*
select *from present."PMDocuments"  where "nPresentid" = 1
select *from "Codemaster"  where "nCodeid" = 216
*/

	if(cPermission = 'N')then

	
			insert into present."PMDocuments"("nPresentid","nBundledetailid","cType")
			select nPresentid,t::uuid,'F' 
			from jsonb_array_elements_text(jBd) as t(value) 
			where not exists (select * from present."PMDocuments" p where p."nBundledetailid" = t::uuid and p."nPresentid" = nPresentid);

		update present."PMDocuments" p set "isActive" = true 
			from jsonb_array_elements_text(jBd) as t(value) 
			where t::uuid = p."nBundledetailid" and p."nPresentid" = nPresentid;

		
		
		/*nPDid = (select "nPDid" from present."PMDocuments" p where p."nPresentid" = nPresentid and p."nBundledetailid" = nBundledetailid limit 1);
		if (nPDid IS NULL)then
				
			insert into present."PMDocuments"("nPresentid","nBundledetailid","cType")
			values(nPresentid,nBundledetailid,'F');

		else 
			update present."PMDocuments" set "isActive" = true where "nPDid" = nPDid;

		end if;*/

	elsif(cPermission = 'D')then
		update present."PMDocuments" p set "isActive" = false 
			from jsonb_array_elements_text(jBd) as t(value) 
			where t::uuid = p."nBundledetailid" and p."nPresentid" = nPresentid;

			--update present."PMDocuments" p set "isActive" = false where p."nPresentid" = nPresentid and p."nBundledetailid" = nBundledetailid;
		
	end if;

open ref for
		select  1 as msg;

 RETURN ref;    
END;

$function$
