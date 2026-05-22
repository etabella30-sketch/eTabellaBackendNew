CREATE OR REPLACE FUNCTION public.et_admin_section_builder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
--select * From "SectionMaster"
declare nCaseid uuid;cFoldername character varying(300);nSectionid uuid;cPermission char(1);nUserid uuid;

BEGIN
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cFoldername := parameter ->>'cFoldername';
cPermission := parameter ->>'cPermission';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from et_admin_section_builder ('{"nCaseid":"uuid-value","nSectionid":"uuid-value","cFoldername":"F1","cPermission":"N","nMasterid":"uuid-value"}','refcursor'); FETCH All in "refcursor";
*/

if(cPermission='N') then 
if not exists(select * from "SectionMaster" where "nCaseid" = nCaseid and "cFoldername" = cFoldername)then 

insert into "SectionMaster"("nCaseid","cFolder","nUserid","dCreateDt")
values (nCaseid,cFoldername,nUserid,now());

	open ref for 
	select 1 as msg,'Section created.' as value;

else

	open ref for select  -1 as msg,'Section already exists for this case.' as value;

end if;
else
select -2 msg;

end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
