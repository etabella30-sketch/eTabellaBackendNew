CREATE OR REPLACE FUNCTION realtime.et_navigate_fact_companies(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;
isAdmin boolean default false;
conpanyids uuid[];
nBundledetailid uuid;

	nRoleid uuid;nTeamid uuid;nCaseid uuid;
-- fga_factids jsonb;

begin
-- select et_navigate_fact_companies('{ ""nBundledetailid"": 530060, ""cType"": ""N"", ""jFilter"": ""[]"", ""sortby"": {}, ""nMasterid"": 59 }','r');fetch all in ""r""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
-- fga_factids := parameter->>'jFactids';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
	
	 if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else 
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

	open ref for
	select cm."nCompanyid" "nCompanyid",case when cm."nCompanyid" IS NOT NULL then cc."cCompany" else 'Unassigned' end "cCompany" from "FactMaster" f
    join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "ContactCompany" cc on cc."nCompanyid" = cm."nCompanyid"
	left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
    -- left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
     where (f."nSesid" = nSesid  or f."nBundledetailid" = nBundledetailid)
	 and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) -- and (isAdmin or "nBDPid" is null) --or fga_factids @> to_jsonb(fc."nFSid")
	group by cm."nCompanyid",cc."cCompany" ;

	 return ref;
    END;
$function$
