CREATE OR REPLACE FUNCTION public.et_share_get_bundleusers(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nSectionid UUID; jUserids uuid[];
	cFtype text;jSectionids uuid[];
	nCaseid uuid;
	BEGIN
    -- Parse input JSON once
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::UUID;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::UUID;
-- select * from et_share_get_bundleusers('{"nMasterid":367,"nSectionid":9039}','r1','r2');fetch all in "r1"
	select "cFoldertype","nCaseid" into cFtype,nCaseid from "SectionMaster" where "nSectionid" = nSectionid;
	-- select * from "BDShare" -- truncate table "BDShare" restart identity
	-- select * from "SectionMaster"
	if(cFtype = 'CB') then
    OPEN ref1 FOR 
	select "nUserid","cFname" || ' ' || coalesce("cLname",'') "cSharedby","nSectionid" from "UserMaster" u
	join (select distinct "nMasterid","nSectionid" from "BDShare" where "nSectionid" in (select "nSectionid" from "SectionMaster" where "nCaseid" = nCaseid and "cFoldertype" = cFtype) and "nUserid" = nMasterid) t on t."nMasterid" = u."nUserid";

	elsif(cFtype = 'TF') then
	 OPEN ref1 FOR 
	select u."nUserid",case when  u."nUserid" = nMasterid then 'Me' else  ("cFname" || ' ' || coalesce("cLname",'')) end "cSharedby","nSectionid" from "UserMaster" u
		join (select "nUserid","nSectionid" from "SectionMaster" where "nCaseid" = nCaseid and "cFoldertype" = cFtype and "nUserid" != nMasterid) t on t."nUserid" = u."nUserid" order by case when u."nUserid" = nMasterid then 1 else 2 end ;
	
	elsif(cFtype = 'CF') then
	 OPEN ref1 FOR 
	select u."nUserid","cFname" || ' ' || coalesce("cLname",'') "cSharedby","nSectionid" from "UserMaster" u
		join (select "nUserid","nSectionid" from "SectionMaster" where "nCaseid" = nCaseid and "cFoldertype" = cFtype and "nUserid" != nMasterid ) t on t."nUserid" = u."nUserid";
	
	end if;

END;
$function$
