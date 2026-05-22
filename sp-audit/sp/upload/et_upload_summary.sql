CREATE OR REPLACE FUNCTION upload.et_upload_summary(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nUPid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUPid := NULLIF(parameter ->>'nUPid','')::uuid;

/*

SELECT * FROM upload.et_upload_summary (
  '{
    ""nCaseid"": 1131,
    ""nUPid"": 1,
    ""nMasterid"": 464
  }',
  'r1'
);
FETCH ALL IN ""r1"";

	select * from upload."UploadMaster"

	select * from "BundleMaster"

	select * from "SectionMaster"

*/

open ref for
	
	select u."nUPid", u."nUPid" || '_' || to_char(u."dCreateDt",'yyyy_mm_dd') as "cUnicid",u."cTabid",coalesce(b."cBundlename",s."cFolder") as "cName",
	d."nTotal",d."nComplete",d."nFailed",d."nPending",u."cStatus"
	from upload."UploadMaster" u 
	left join "BundleMaster" b on b."nBundleid" = u."nBundleid"
	join "SectionMaster" s on s."nSectionid" = u."nSectionid"
	
	join upload.summary d on d."nUPid" = u."nUPid"
	
	where u."nCaseid" = nCaseid  
	and u."nUserid" = nMasterid
	and case when nUPid IS NOT NULL then u."nUPid" = nUPid else true end
	order by u."dCreateDt" desc;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
