CREATE OR REPLACE FUNCTION public.et_rename_bundledetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nBundledetailid uuid;cFilename text;nSectionid uuid;nBundleid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFilename := parameter ->>'cFilename';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;

--  select * from et_bundlebuilder ('{""nBundleid"":1342379,""nSectionid"":92,""cBundlename"":""LOC D s"",""nParentBundleid"":0,""nCaseid"":22,""permission"":""E"",""nMasterid"":2}','r1');fetch all in ""r1"";

-- select * From ""BundleDetail"" order by 1 desc limit 10

if not exists(select * from "BundleDetail" where "nSectionid" = nSectionid and "nBundleid" = nBundleid and upper(trim("cFilename")) = upper(trim(cFilename)) and "nBundledetailid" !=nBundledetailid )then

	update "BundleDetail" set "cFilename" = cFilename where "nBundledetailid" = nBundledetailid;

	update "CaseMaster" set "dUpdateDt" = now() where "nCaseid" = nCaseid;
	
	open ref for 
		select 1 as msg,'Name changed' as value;

else
	open ref for
		select -1 as msg,'Name already exists' as value;
end if;

 
 

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
