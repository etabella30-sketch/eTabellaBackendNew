CREATE OR REPLACE FUNCTION public.et_user_team_management(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid; nUserid uuid; nTeamid uuid; nRoleid uuid; nOldroleid uuid; nTRid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','00000000-0000-0000-0000-000000000000')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','00000000-0000-0000-0000-000000000000')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','00000000-0000-0000-0000-000000000000')::uuid;
nTeamid := NULLIF(parameter ->>'nTeamid','00000000-0000-0000-0000-000000000000')::uuid;
nRoleid := NULLIF(parameter ->>'nRoleid','00000000-0000-0000-0000-000000000000')::uuid;

/*
select * from "UserMaster" order by 1 desc
select * from "BMPermission"
select * from "BDPermission"
select * from "UserSetting" where "nUserid" = 304
110
select * from "TeamRelation" where "nCaseid" = 22 and "nUserid" = 2
select * from "TeamMaster"  where "nCaseid" = 22
"BDUserlinks" , 

select * from et_user_team_management ('{"nUserid":304,"cFname":"Action 4","cLname":"Kamen 3","cEmail":"Action2@gmail.com","cPassword":"","cProfile":"test2.png","nTZid":18,"nRoleid":1,"nCaseid":22,"nTeamid":109,"permission":"E","nMasterid":2}','r1');fetch all in "r1";

select * From "TeamRelation" where "nUserid" = 304
select * from "UserPermission" where "nUserid" = 304
select * From "BMPermission" where "nUserid" = 304;
select * From "BDPermission" where "nUserid" = 304;
delete from "UserPermission" where "nUserid" = 304;
drop sequence UserPermission_pkey 
SELECT setval('"TeamRelation_nTRid_seq"',(select max("nTRid") from "TeamRelation" ) )

*/

--delete from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nUserid;

if(nTeamid IS NOT NULL and nTeamid !='00000000-0000-0000-0000-000000000000') then 
	-- nOldroleid := (select "nRoleid" from "UserSetting" where  "nUserid" = nUserid and "nCaseid" = nCaseid);
	
	
	/*if( coalesce(nOldroleid,0) > 0 and nOldroleid != nRoleid)then 
	
		delete from "UserPermission" where "nUserid" = nUserid and "nCaseid" = nCaseid;
		
		if exists(select * from "RolePermission" where "nCaseid" = nCaseid and "nRoleid" =  nRoleid)then
			insert into "UserPermission"("nCaseid","nPMid","cType","nUserid","dCreateDt")
			select nCaseid,"nPMid","cType",nUserid,now() from "RolePermission" where "nCaseid" = nCaseid and "nRoleid" =  nRoleid;
		else
			insert into "UserPermission"("nCaseid","nPMid","cType","nUserid","dCreateDt")
			select nCaseid,"nPMid","cType",nUserid,now() From fun_defaultpermission(nRoleid);
		end if;
		
		update "UserSetting" set "nRoleid" = nRoleid where "nUserid" = nUserid and "nCaseid" = nCaseid;
		
	else
	
		insert into "UserPermission"("nCaseid","nPMid","cType","nUserid","dCreateDt")
		select nCaseid,"nPMid","cType",nUserid,now() From fun_defaultpermission(nRoleid);
	
	end if;*/

	
	nOldroleid := (select "nRoleid" from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nUserid limit 1);
	
	if(nOldroleid IS NOT NULL and nOldroleid != nRoleid) then 
		delete from "UserPermission" where "nUserid" = nUserid and "nCaseid" = nCaseid;
			
	end if;

	-- if(nRoleid is null) then 
	-- 	select "nRoleid" into nRoleid from "RoleMaster" where "nSrno" = 2 limit 1;
	-- end if;
	
	raise notice 'nRoleid %',nRoleid;
	if not exists (select 1 from "UserPermission" where "nUserid" = nUserid and "nCaseid" = nCaseid) then
		insert into "UserPermission" ("nCaseid","nPMid","nUserid")
		select nCaseid,"nPMid",nUserid from "PermissionDefault" where "bStatus" = false and "nRoleid" = nRoleid;	
	end if;

	
	if exists (select * from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nUserid) then
		update "TeamRelation" set "nTeamid" = nTeamid, "nRoleid" = nRoleid where "nCaseid" = nCaseid and "nUserid" = nUserid;
	else
		insert into "TeamRelation" ("nUserid","nTeamid","nCaseid","nRoleid")
		values(nUserid,nTeamid,nCaseid,nRoleid);
	end if;
	-- select * from "PermissionModule"
	-- select * from "UserPermission"
	-- values(nCaseid,15,nUserid);
	
	
	/*insert into "TeamRelation" ("nUserid","nTeamid","nCaseid","nRoleid")
	values(nUserid,nTeamid,nCaseid,nRoleid);*/
	
	--nTRid = (select max("nTRid") From "TeamRelation");
	
	/*
	insert into "BMPermission" ("nUserid","nBundleid","nTRid")
	select nUserid,"nBundleid" ,nTRid
	from "BundleMaster" bm
	join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
	where sm."nCaseid" = nCaseid;
	
	
	insert into "BDPermission" ("nUserid","nBundledetailid","nTRid")
	select nUserid,"nBundledetailid" ,nTRid
	from "BundleDetail" bm
	join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
	where sm."nCaseid" = nCaseid;
	
	
	if not exists(select * from "UserSetting" where "nUserid" = nUserid and "nCaseid" = nCaseid )then
		insert into "UserSetting"("nUserid","nCaseid","jNotification","cDef_noti","jShares_noti","cPresentation_noti","cText_noti","jNotify_byuser","cTwoway_auth","nQuota","nRoleid","jMfscolumn")
		values(nUserid,nCaseid,'{"email":"Y","online":"Y"}'::jsonb,'Y','{"fact": "Y","task": "Y","issue": "Y","doclink": "Y","weblink": "Y","f_location": "Y"}'::jsonb,'Y','Y','[]'::jsonb,'Y',1000000000000,nRoleid,'[1,2,3,4,5,6,7]'::jsonb);
	end if;*/

else
	
	delete from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nUserid;
	delete from "UserSetting" where "nUserid" = nUserid and "nCaseid" = nCaseid;
	delete from "UserPermission" where "nUserid" = nUserid and "nCaseid" = nCaseid;

end if;

open ref for 
select 1 as msg,'Success' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
