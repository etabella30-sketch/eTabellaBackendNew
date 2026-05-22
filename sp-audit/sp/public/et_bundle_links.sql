CREATE OR REPLACE FUNCTION public.et_bundle_links(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$declare nMasterid uuid;nBundleid uuid;nSectionid uuid;
	isAdmin boolean default false; cFoldertype text;
	nCaseid uuid; nTeamid uuid;nRoleid uuid;
BEGIN
-- select * from et_bundle_links('{"nSectionid":8850,"nMasterid":"367","nBundleid":9298}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid',null)::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
	select "nCaseid" into nCaseid from "SectionMaster" where "nSectionid" = nSectionid;
	
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	-- raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;
	raise notice 'isAdmin % nSectionid %',isAdmin,nSectionid;
	-- select * from "BDShare"

	 select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;
	 raise notice 'cFoldertype %',cFoldertype;

 	open ref1 for select distinct fl."nBundledetailid" "nBDid",case when sum(total_qfact) > 0 then true else false end qf,case when sum(total_fact) > 0 then true else false end f
	,case when sum(total_doc) > 0 then true else false end d
	,case when sum(total_web) > 0 then true else false end w
	,case when sum(total_flink) > 0 then true else false end fl
	,case when sum(total_bslink) > 0 then true else false end sh
	from "BundleDetail" bd	
	join "file_links" fl on fl."nBundledetailid" = bd."nBundledetailid" --555364
	left join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid" and cFoldertype = 'CB' or  cFoldertype = 'CO'
	left join "TeamRelation" tr ON tr."nTeamid" = nTeamid  
	-- left join "SectionMaster" s on s."nSectionid" = (case when cFoldertype = 'CB' then ba."nSectionid" else  bd."nSectionid" end)
	left join lateral (select count("nLSid") total_bslink,bds."nBundledetailid" from "LocationShare" bds where bds."nBundledetailid" = bd."nBundledetailid" and (bds."nUserid"  = nMasterid or (case when  isAdmin = true then  bds."nUserid" = tr."nUserid" else false end)) group by bds."nBundledetailid" ) sh on sh."nBundledetailid" = bd."nBundledetailid"
	where (fl."nUserid"  = nMasterid or (case when  isAdmin = true then  tr."nUserid" = fl."nUserid" else false end)) and (CASE WHEN cFoldertype = 'CB'  or  cFoldertype = 'CO' THEN ba."nBundleid" ELSE bd."nBundleid" END) is not distinct from  coalesce(nBundleid,null)::uuid
	and (CASE WHEN cFoldertype = 'CB' or  cFoldertype = 'CO' THEN ba."nSectionid" ELSE bd."nSectionid" END) = nSectionid
	
	group by fl."nBundledetailid";
	 
	 -- select * from file_links where "nUserid"  = 59 and "nBundledetailid" =555364
RETURN NEXT ref1;
    
	 
END;$function$
