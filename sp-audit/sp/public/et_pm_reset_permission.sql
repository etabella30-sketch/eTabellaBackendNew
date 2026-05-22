CREATE OR REPLACE FUNCTION public.et_pm_reset_permission(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nRoleid uuid; nUserid uuid;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
nRoleid := (parameter ->>'nRoleid')::uuid;
nUserid := (parameter ->>'nUserid')::uuid;

/*
select * from public.et_pm_reset_permission ('{"nCaseid":"e34e9201-d2bd-47b6-bdef-bde17892ad76","nRoleid":"8632ee5c-e854-411c-b83d-c21656ad39ac","nUserid":null,"nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1');fetch all in "r1";
 
insert into "PermissionDefault"("nPMid")
select * From "PermissionModule" order by 1
select * From "RolePermission"
select * From "UserPermission"
select * from   "PermissionDefault" ;
-- update "PermissionDefault" set "bStatus" = false where "nPMid" in (15,8)
create table "PermissionDefault"(
	"nPMid" int,
	"bStatus" boolean default true
);
*/
-- select * from "UserPermission"
if(nRoleid IS NOT NULL) then

	-- DELETE FROM "RolePermission" r
	-- USING "PermissionDefault" pd WHERE r."nCaseid" = nCaseid
	--   AND r."nRoleid" = nRoleid AND pd."nRoleid" = r."nRoleid" AND pd."bStatus" = false AND r."nPMid" <> pd."nPMid";
	  
	-- DELETE FROM "UserPermission" up
	-- USING "TeamRelation" tr
	-- LEFT JOIN "PermissionDefault" pd ON pd."nPMid" = up."nPMid" AND pd."nRoleid" = nRoleid AND pd."bStatus" = false
	-- WHERE up."nCaseid" = nCaseid AND tr."nCaseid" = nCaseid AND tr."nRoleid" = nRoleid AND up."nUserid" = tr."nUserid" AND pd."nPMid" IS NULL;
  
	delete from "RolePermission" r where "nCaseid" = nCaseid and "nRoleid" = nRoleid and "nPMid" not in (select "nPMid" from "PermissionDefault" pd where "bStatus" = false and r."nRoleid" = pd."nRoleid") ;	
	
	delete from "UserPermission" where "nCaseid" = nCaseid and "nPMid" not in (select "nPMid" from "PermissionDefault" where "bStatus" = false and "nRoleid" =nRoleid) and "nUserid" in (select "nUserid" from "TeamRelation" where "nRoleid" = nRoleid and "nCaseid" = nCaseid) ;	
	
			insert into "RolePermission"("nCaseid","nPMid","nRoleid","dModifydt")
			select nCaseid,"nPMid",nRoleid,now() from "PermissionDefault" where "bStatus" = false and "nRoleid" = nRoleid and 
			"nPMid" not in (select "nPMid" from "RolePermission" r where r."nCaseid" = nCaseid and r."nRoleid" = nRoleid) ;	
	
		
		
		insert into "UserPermission" ("nCaseid","nPMid","nUserid","dCreateDt")
		select nCaseid,pd."nPMid",tr."nUserid",now() 
		from "TeamRelation" tr 
		join "PermissionDefault" pd on pd."nRoleid" = tr."nRoleid"
		where  pd."bStatus" = false and  tr."nCaseid" = nCaseid and tr."nRoleid" = nRoleid;		
else
		
	delete from "UserPermission" where "nCaseid" = nCaseid and "nUserid" = nUserid ;
		
	insert into "UserPermission" ("nCaseid","nPMid","nUserid","dCreateDt")
		select nCaseid,pd."nPMid",tr."nUserid",now() 
		from "TeamRelation" tr 
		join "PermissionDefault" pd on pd."nRoleid" = tr."nRoleid"
		where  tr."nUserid" = nUserid and pd."bStatus" = false and  tr."nCaseid" = nCaseid ;		
end if;

OPEN ref1 FOR 

select 1 as msg,'Updated' as value;

RETURN NEXT ref1;
	 
END;
$function$
