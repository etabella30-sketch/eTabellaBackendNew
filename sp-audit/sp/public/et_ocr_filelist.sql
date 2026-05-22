CREATE OR REPLACE FUNCTION public.et_ocr_filelist(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;
nCaseid uuid;nUserid uuid;
BEGIN
	nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
	nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
	nUserid := NULLIF(parameter->>'nUserid','')::uuid;

	-- select * from et_ocr_filelist('{""nCaseid"":1079}','r');fetch all in ""r""
	-- select * from ""OCRLog""
	-- select * from ""UploadDetail""
open ref1 for
		/* select bd.""nBundledetailid"" id,bd.""cFilename"",
	        '' ""message"" ,o.""dStartDt"",o.""dEndDt"",o.""cStatus"",u.""nUserid"",""cFname"",""cLname""
			from ""BundleDetail"" bd
			join ""OCRLog"" o on bd.""nBundledetailid"" = o.""nBundledetailid""
			-- left join ""UploadDetail"" up on up.
			join ""UserMaster"" u on u.""nUserid"" = o.""nUserid""
			where ""nCaseid"" = nCaseid and case when nUserid > 0 then ""nUserid"" = nUserid else true end;
		*/

		select o."nUDid",b."nBundledetailid" id,case when coalesce(o."nUDid",'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000' then u."cName" else b."cFilename" end "cName",
		case when o."nUDid" IS NOT NULL then u."dCreateDt" else null end "dCreateDt",coalesce("nFiles",1) "nFiles",count("nOLid") "nOCRFiles",
		sum(case when o."cStatus"='C' then 1 else 0 end) "nCompleted",sum(case when o."cStatus" = 'OCR' then 1 else 0 end) "nOProgress",
		um."nUserid","cFname","cLname",min(o."dStartDt") "dStartDt",max(o."dEndDt") "dEndDt"
		from "OCRLog" o 
		left join "UploadDetail" u on u."nUDid" = o."nUDid"
		left join "BundleDetail" b on case when coalesce(o."nUDid",'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000' then o."nBundledetailid" = b."nBundledetailid" else false end		
		join "UserMaster" um on um."nUserid" = o."nUserid"
		where "nCaseid" = nCaseid and case when coalesce(nUserid,'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000' then o."nUserid" = nUserid else true end and o."cStatus" not in ('C','F')
		group by o."nUDid",b."nBundledetailid",u."cName",b."cFilename",u."dCreateDt","nFiles",um."nUserid","cFname","cLname"
		
		;

		
	
	END;
$function$
