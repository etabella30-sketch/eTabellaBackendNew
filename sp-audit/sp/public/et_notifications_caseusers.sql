CREATE OR REPLACE FUNCTION public.et_notifications_caseusers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nCaseid uuid;nBundleid uuid;nBundledetailid uuid;nSectionid uuid; cBundlename text;cFilename text;cFolder text;
BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
/*
select * from et_notifications_caseusers ('{"nCaseid":1115,"nBundledetailid":165545}','r1');fetch all in "r1";
select * from "CaseMaster"
select * from "BundleMaster"
select * from "BundleDetail"
select * from "SectionMaster"
*/
if(nBundleid IS NOT NULL)then
	cBundlename = (select "cBundlename" From "BundleMaster" where "nBundleid" = nBundleid);
end if;
if(nBundledetailid IS NOT NULL)then
	cFilename = (select "cFilename" From "BundleDetail" where "nBundledetailid" = nBundledetailid);
end if;
if(nSectionid IS NOT NULL)then
	cFolder = (select "cFolder" From "SectionMaster" where "nSectionid" = nSectionid);
end if;
open ref for
select u."nUserid",c."nCaseid",u."cToken",'' as "cTitle",'' as "cMsg"	,c."cCasename",c."cCaseno",'I' as "cIndex",coalesce(cBundlename,'') as "cBundlename",
	coalesce(cFilename,'') as "cFilename",coalesce(cFolder,'') as "cFolder"
	from "TeamRelation" tr 
	join "CaseMaster" c on c."nCaseid" = tr."nCaseid"
	join "UserMaster" u on u."nUserid" = tr."nUserid"
	where c."nCaseid" = nCaseid  and nullif(u."cToken",'') is not null
	;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
    
	
$function$
