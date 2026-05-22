CREATE OR REPLACE FUNCTION public.et_bundle_parentids(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nBundleid uuid;
nSectionid uuid;nUPid uuid;
ids jsonb; nBundledetailids jsonb;isAdmin boolean default false;
BEGIN

nMasterid  := NULLIF(NULLIF(parameter ->>'nMasterid',''),'null')::uuid;
nSectionid := NULLIF(NULLIF(parameter ->>'nSectionid',''),'null')::uuid;
nUPid      := NULLIF(NULLIF(parameter ->>'nUPid',''),'null')::uuid;
nBundleid  := NULLIF(NULLIF(parameter ->>'nBundleid',''),'null')::uuid;



-- select * from et_bundle_parentids('{"nSectionid": 8850, "nBundleid": 9325,"nUPid": 128,"nMasterid":367}','r');fetch all in "r"
 
	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

 nBundledetailids := (select jsonb_agg(ud."nBundledetailid") from  "UploadDetail" ud 
 						join "BundleDetail" bd on  ud."nBundledetailid" = bd."nBundledetailid"
 						where "nUPid" = nUPid 
						 -- and bd."nBundleid" = nBundleid
						 );
if(nBundleid IS NOT NULL) then
open ref for
WITH RECURSIVE bdl_tree AS ( select ROW_NUMBER() OVER(ORDER BY substring("cBundletag", '\D+'),substring("cBundletag", '\d+')::numeric,"cBundletag",substring("cBundlename", '\D+'),substring("cBundlename", '\d+')::numeric,"cBundlename" ) serial, b."nBundleid",coalesce(b."nParentBundleid",'00000000-0000-0000-0000-000000000000'::uuid) "nParentBundleid",b."cBundlename",b."cBundletag" ,nBundledetailids "nBundledetailids",1 level1
	from "BundleMaster" b
	left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
	where-- case when isAdmin then true else p."nBMPid" is null end  and 
	b."nSectionid" = nSectionid and b."nBundleid" = nBundleid 
    UNION ALL

    -- Recursive case: Find the parent of the current bundle
   select ROW_NUMBER() OVER(ORDER BY substring(b."cBundletag", '\D+'),substring(b."cBundletag", '\d+')::numeric,b."cBundletag",substring(b."cBundlename", '\D+'),substring(b."cBundlename", '\d+')::numeric,b."cBundlename" ) serial, b."nBundleid",coalesce(b."nParentBundleid",'00000000-0000-0000-0000-000000000000'::uuid) "nParentBundleid",b."cBundlename",b."cBundletag" ,nBundledetailids "nBundledetailids" ,child_b.level1+ 1 level1
	from "BundleMaster" b
    JOIN bdl_tree child_b ON child_b."nParentBundleid" = b."nBundleid"
    LEFT JOIN "BMPermission" bp ON b."nBundleid" = bp."nBundleid" AND bp."nUserid" = nMasterid
    WHERE bp."nBMPid" IS NULL ) select ROW_NUMBER() OVER(ORDER BY level1 desc) level,* from bdl_tree order by level1 desc;
else 
open ref for select nBundledetailids "nBundledetailids";
end if;
RETURN ref;
    
	 
END;
$function$
