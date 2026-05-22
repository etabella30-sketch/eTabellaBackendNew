CREATE OR REPLACE FUNCTION public.et_activity_bundledata(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;isAdmin boolean;
nSesid uuid;nBDids int;nBids int;
BEGIN
-- select * from et_activity_bundledata('{"nMasterid":"367-uuid-format"}','r','r1');fetch all in "r"
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;

    -- select * from "TeamMaster"
    OPEN ref1 FOR 
    select count(distinct b."nBundledetailid") as "nTotal",coalesce(upper(trim(b."cFiletype")),'Other') "cType"
    from "BundleDetail" b 
    left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"    
    join "SectionMaster" s on s."nSectionid" = b."nSectionid" and s."cFoldertype" = 'MB'
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid and "cIsindex" = false
    and case when b."nBundleid" IS NOT NULL then bm."nBundleid" is not null else true end
    group by coalesce(upper(trim(b."cFiletype")),'Other'); 
        
    RETURN NEXT ref1;

    -- select * from "RTLogs"
        select count(distinct "nBundledetailid") into nBDids from "BundleDetail" b 
    join "SectionMaster" s on s."nSectionid" = b."nSectionid" and s."cFoldertype" = 'MB'
    left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"    
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid and "cIsindex" = false
    and case when b."nBundleid" IS NOT NULL then bm."nBundleid" is not null else true end;

    select count(distinct "nBundleid") into nBids from "BundleMaster" b 
    join "SectionMaster" s on s."nSectionid" = b."nSectionid"
    where s."nCaseid" = nCaseid;
    
    OPEN ref2 FOR 
        select nBids "nBids",nBDids "nBDids";
        
    RETURN NEXT ref2;
    
    
END;
$function$
