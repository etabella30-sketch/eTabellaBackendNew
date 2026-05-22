CREATE OR REPLACE FUNCTION public.et_pm_update_modules(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nRoleid uuid; nUserid uuid; bValue boolean; nPMid int;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
nRoleid := (parameter ->>'nRoleid')::uuid;
nUserid := (parameter ->>'nUserid')::uuid;
bValue := (parameter ->>'bValue')::boolean;
nPMid := (parameter ->>'nPMid')::int;

/*
 select * from et_pm_update_modules('{""nMasterid"":2,""nRoleid"":2,""cStatus"":""A"",""nCaseid"":22}','r1');FETCH All in ""r1""

select * From ""PermissionModule""
select * From ""RolePermission""
select * From ""UserPermission""
*/

if(nRoleid IS NOT NULL) then

	if(bValue) then
		delete from "RolePermission" where "nCaseid" = nCaseid and "nRoleid" = nRoleid and "nPMid" = nPMid;		
		delete from "UserPermission" where "nCaseid" = nCaseid and "nPMid" = nPMid and "nUserid" in (select "nUserid" from "TeamRelation" where "nRoleid" = nRoleid and "nCaseid" = nCaseid);		
	else
		if not exists(select * from "RolePermission" where "nCaseid" = nCaseid and "nRoleid" = nRoleid and "nPMid" = nPMid) then
				insert into "RolePermission"("nCaseid","nPMid","nRoleid","dModifydt")
				values(nCaseid,nPMid,nRoleid,now());
		end if;
		
		
		insert into "UserPermission" ("nCaseid","nPMid","nUserid","dCreateDt")
		select nCaseid,nPMid,tr."nUserid",now() 
		from "TeamRelation" tr where tr."nCaseid" = nCaseid and tr."nRoleid" = nRoleid and not exists (
			select * from "UserPermission" up where up."nCaseid" = nCaseid and up."nPMid" = nPMid and up."nUserid" = tr."nUserid"
		);
		
		
	end if;

else

	if(bValue) then
		delete from "UserPermission" where "nCaseid" = nCaseid and "nPMid" = nPMid and "nUserid" = nUserid;
	else
		if not exists(select * from "UserPermission" where "nCaseid" = nCaseid and "nPMid" = nPMid and "nUserid" = nUserid) then
			insert into "UserPermission"("nCaseid","nPMid","nUserid","dCreateDt")
			values(nCaseid,nPMid,nUserid,now());
		end if;
	end if;
end if;

OPEN ref1 FOR 

select 1 as msg,'Updated' as value;

RETURN NEXT ref1;
	 
END;
$function$
