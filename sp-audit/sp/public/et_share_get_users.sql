CREATE OR REPLACE FUNCTION public.et_share_get_users(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nSectionid uuid; jUserids uuid[];
	cFtype text;jSectionids uuid[];
	nCaseid uuid;
	BEGIN
    -- Parse input JSON once
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
-- select * from et_share_get_bundles('{""nMasterid"":29,""nSectionid"":9043}','r1','r2');fetch all in ""r1""
	select "cFoldertype","nCaseid" into cFtype,nCaseid from "SectionMaster" where "nSectionid" = nSectionid;
	-- select * from ""BDShare"" -- truncate table ""BDShare"" restart identity
	
	
    OPEN ref1 FOR 
	select "nUserid","cFname" || ' ' || coalesce("cLname",'') "cSharedby","nSectionid" from "UserMaster"  u
	join (select distinct "nMasterid","nSectionid" from "BDShare" where "nSectionid"  in (select "nSectionid" from "SectionMaster" where "nCaseid" = nCaseid and "cFoldertype" = cFtype) and "nUserid" = nMasterid) t on t."nMasterid" = u."nUserid";

END;
$function$
