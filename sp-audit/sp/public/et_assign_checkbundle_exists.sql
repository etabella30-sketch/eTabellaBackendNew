CREATE OR REPLACE FUNCTION public.et_assign_checkbundle_exists(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nSectionid uuid;
nBundleid uuid; cPage text;
jFiles jsonb; jBDids jsonb;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := parameter ->>'nBundleid';
cPage := parameter ->>'cPage';
jFiles := parameter ->>'jFiles';
-- select * from "BDContacts"

-- select * from "BDAssignment" order by 1 desc
	if exists( select "nBundledetailid" from "BDAssignment" b,jsonb_array_elements(jFiles) f where case when coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000'::uuid then "nBundleid" = nBundleid else "nSectionid" = nSectionid end
			  and "cPage" = (f->>1)::text and "nBundledetailid" = (f->>0)::uuid and "nUserid" = nMasterid) then 
			  
			  select jsonb_agg(distinct "nBundledetailid") into jBDids 
			  from "BDAssignment"b,jsonb_array_elements(jFiles) f where case when coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000'::uuid then "nBundleid" = "nBundleid" else "nSectionid" = nSectionid end
			    and "cPage" = (f->>1)::text and "nBundledetailid" = (f->>0)::uuid and "nUserid" = nMasterid;
				
	open ref for select 1 as msg,jBDids ids;
	
	else 
		open ref for select -1 as msg;
	end if;

 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
