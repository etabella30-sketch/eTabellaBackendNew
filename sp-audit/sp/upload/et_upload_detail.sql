CREATE OR REPLACE FUNCTION upload.et_upload_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nUPid uuid;
nBatchsize INT default 10;nPageno int;
    nOffset INT;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nUPid := NULLIF(parameter ->>'nUPid','')::uuid;

nPageno := (parameter ->>'nPageno')::INTEGER;
nOffset := (coalesce(nPageno,1) - 1) * nBatchsize;

/*

select * from upload.et_upload_detail ('{""nUPid"":1,""nPageno"":1,""nMasterid"":464}','r1');fetch all in ""r1"";

	select * from upload."UploadMaster"

	select * from "BundleMaster"

	select * from "BundleDetail"

	select * from "SectionMaster"

	select * from upload."UploadDetail"
*/

open ref for

	select d."nUDid",d."nUPid",d."cName",d."cFiletype",d."cSize",d."cStatus",d."cConvert",d."identifier",d."nBundledetailid",b."cStatus" as "cBStatus"
	from upload."UploadDetail" d 
	left join "BundleDetail" b on b."nBundledetailid" = d."nBundledetailid"
	where d."nUPid" = nUPid and d."dDelDt" is null
	order by d."nUDid" LIMIT nBatchsize OFFSET nOffset;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
