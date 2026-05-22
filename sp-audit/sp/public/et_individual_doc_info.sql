CREATE OR REPLACE FUNCTION public.et_individual_doc_info(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nBundledetailid uuid;
havePermission boolean;nCaseid uuid;
-- select * from et_individual_doc_info('{""nBundledetailid"":287419,""nUserid"":10}','r');fetch all in ""r""
-- select ""cFilesize"" from ""BundleDetail"" where 
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
nBundledetailid := (parameter ->>'nBundledetailid')::uuid;

	select "isAdmin" into havePermission from "UserMaster" where "nUserid" = nMasterid;
	
 IF NOT havePermission THEN
    SELECT s."nCaseid" INTO nCaseid FROM "SectionMaster" s
    JOIN "BundleDetail" b ON b."nSectionid" = s."nSectionid"
    WHERE b."nBundledetailid" = nBundledetailid;

    havePermission := EXISTS ( SELECT 1 FROM "TeamRelation" WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid );
  END IF;
	

open ref for
select bm."nBundleid", bm."cBundlename" "cBundle", b."nBundledetailid", b."cFilename", b."cPath", b."cTab",
b."cExhibitno", b."cFiletype", "cPage", "cRefpage", at."nRotate", at."bIsconvert", b."cFilesize",b."nSectionid", coalesce(nullif(at."cLVer", ''), at."cFVer") version,"cIsindex",bm."cBundletag",sm."cFoldertype"
from "BundleDetail" b 
left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
left join "SectionMaster" sm on sm."nSectionid" = b."nSectionid"
left join "BDPermission" p on p."nUserid" = nMasterid and p."nBundledetailid" = b."nBundledetailid"
left join "BDAttributes" at on at."nBundledetailid" = b."nBundledetailid"
where (p."nBDPid" is null and havePermission) and b."nBundledetailid" = nBundledetailid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
