CREATE OR REPLACE FUNCTION public.et_share_get_bundles_backupnow(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nSectionid uuid; nUserid uuid;
	nCaseid uuid;cFoldertype text;
	BEGIN
    -- Parse input JSON once
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
    nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
	
	select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;
-- select * from et_share_get_bundles('{""nMasterid"":29,""nSectionid"":9039,""nUserid"":367}','r1');fetch all in ""r1""
	-- select * from ""BundleMaster""
 if(cFoldertype ='CB') then
    OPEN ref1 FOR 
			with bundle as
		(  
			select ROW_NUMBER() OVER(ORDER BY substring("cBundletag", '\D+'),substring("cBundletag", '\d+')::numeric,"cBundletag",substring("cBundlename", '\D+'),substring("cBundlename", '\d+')::numeric,"cBundlename" ) serial, b."nBundleid",CASE WHEN b."nParentBundleid" IS NULL THEN null ELSE b."nParentBundleid" END "nParentBundleid",b."cBundlename",b."cBundletag" 
			from "BundleMaster" b
			join (select distinct "nSectionid","nBundleid" from "BDShare" where "nSectionid" = nSectionid and "nUserid" = nMasterid and "nMasterid" = nUserid and "nBundledetailid" is null) shared on  b."nSectionid" = shared."nSectionid" and (case when shared."nBundleid" IS NOT NULL then shared."nBundleid" = b."nBundleid" else b."nParentBundleid" is null end)
			left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"		
			where case when shared."nBundleid" IS NOT NULL then b."nBundleid" = shared."nBundleid" else b."nParentBundleid" is null end
			group by b."cBundletag",b."cBundlename",b."nParentBundleid",b."nBundleid"
		) select * from bundle
		order by serial;

elsif (cFoldertype ='CF' or cFoldertype ='TF') then
 OPEN ref1 FOR 
	with bundle as
		(  
			select ROW_NUMBER() OVER(ORDER BY substring("cBundletag", '\D+'),substring("cBundletag", '\d+')::numeric,"cBundletag",substring("cBundlename", '\D+'),substring("cBundlename", '\d+')::numeric,"cBundlename" ) serial, b."nBundleid",CASE WHEN b."nParentBundleid" IS NULL THEN null ELSE b."nParentBundleid" END "nParentBundleid",b."cBundlename",b."cBundletag" 
			from "BundleMaster" b
			left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"		
			where b."nSectionid" = nSectionid and  b."nParentBundleid" is null
			group by b."cBundletag",b."cBundlename",b."nParentBundleid",b."nBundleid"
		) select * from bundle
		order by serial;
end if;

    RETURN NEXT ref1;
END;
$function$
