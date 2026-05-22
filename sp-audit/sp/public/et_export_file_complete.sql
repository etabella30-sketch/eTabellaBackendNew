CREATE OR REPLACE FUNCTION public.et_export_file_complete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid; nEDid uuid; cToken text; cPath text;

BEGIN

nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
cPath := parameter->>'cPath';
/*
 select * from et_export_file_complete ('{""nEDid"":1,""cDoc"":""doc/case12/dc_111680504750324.pdf"",""cFilename"":""C.12. 2023.03.05 Judgment for case no. 2335-2022.pdf"",""nCaseid"":12,""nFolderid"":1,""nBundleid"":0,""isReplace"":""N"",""nExistsid"":0,""nUserid"":2}','refcursor'); FETCH All in ""refcursor"";
 select * from ""ExportDetail""
 select * from ""ExportMaster""
 */
 
 update "ExportDetail" set "cPath" = cPath where "nEDid" = nEDid;
 
 cToken := (select "cToken" From "UserMaster" where "nUserid" = nUserid);
 
 open ref for select e."nEDid",em."nCaseid",e."nBDid" "nBundledetailid",e."nBundleid",(case when e."nBundleid" IS NOT NULL then dm."cBundlename" else d."cFilename" end) "cFilename", cToken as "cToken",
 'Your file ' || (case when e."nBundleid" IS NOT NULL then dm."cBundlename" else d."cFilename" end) || ' ready for download' as "cMsg",'Export complete' as "cTitle",
  case when em."cType" = 'M' then e."cStatus" else em."cStatus" end "cStatus"
 from "ExportDetail" e
 join "ExportMaster" em on em."nExportid" = e."nExportid"
 left join "BundleDetail" d on d."nBundledetailid" = e."nBDid"
 left join "BundleMaster" dm on dm."nBundleid" = e."nBundleid"
 where "nEDid" = nEDid;
 
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
