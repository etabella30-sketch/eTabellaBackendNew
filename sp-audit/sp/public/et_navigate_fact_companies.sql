CREATE OR REPLACE FUNCTION public.et_navigate_fact_companies(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nBundledetailid uuid;
isAdmin boolean default false;
conpanyids uuid[];

begin
-- select et_navigate_fact_companies('{ ""nBundledetailid"": 530060, ""cType"": ""N"", ""jFilter"": ""[]"", ""sortby"": {}, ""nMasterid"": 59 }','r');fetch all in ""r""

nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

	open ref for
	select cm."nCompanyid" "nCompanyid",case when cm."nCompanyid" IS NOT NULL then cc."cCompany" else 'Unassigned' end "cCompany" from "FactMaster" f
    join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "ContactCompany" cc on cc."nCompanyid" = cm."nCompanyid"
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
     where f."nBundledetailid" = nBundledetailid and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid) and (isAdmin or "nBDPid" is null)
	group by cm."nCompanyid",cc."cCompany" ;

	 return ref;
    END;
$function$
