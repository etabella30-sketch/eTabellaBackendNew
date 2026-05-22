CREATE OR REPLACE FUNCTION upload.et_upload_failed_by_tabid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE

  nMasterid uuid;
  cTabid text;
	
BEGIN
    -- Extract the tab id from the JSON parameter
      cTabid := parameter ->> 'cTabid';
	  nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
/*

select * from upload.et_upload_failed_by_tabid ('{""nUserid"":464,""cTabid"":""04b4cc9d-29e7-43f3-8fb5-bde1020f9b44""}','r1');fetch all in ""r1"";

select * from upload."UploadMaster" where "cTabid" = cTabid;
select * from upload."UploadDetail" where "nUPid" =2;
select * from "BundleDetail" where "nBundledetailid" = 187580;
select * from task."TaskMaster" 
*/

DROP TABLE IF EXISTS "TempUploads";

  CREATE TEMP TABLE "TempUploads" AS
  SELECT um."nUPid", um."nTid", ud."nBundledetailid"
  FROM upload."UploadMaster" um
  JOIN upload."UploadDetail" ud ON um."nUPid" = ud."nUPid"
  WHERE ud."cStatus" = 'P' AND um."cTabid" = cTabid;

  UPDATE upload."UploadMaster" um
  SET "cStatus" = 'F'
  from upload."UploadDetail" d
  where um."cTabid" = cTabid and um."cStatus" = 'P' and d."nUPid" = um."nUPid" and d."cStatus" = 'P';
  
  UPDATE upload."UploadDetail"
  SET "cStatus" = 'F'
  WHERE "nUPid" IN (SELECT "nUPid" FROM "TempUploads");

  UPDATE "BundleDetail"
  SET "cStatus" = 'F'
  WHERE "nBundledetailid" IN (SELECT "nBundledetailid" FROM "TempUploads");

  UPDATE task."TaskRemarkDetail" trd
  SET "nStatus" = 2,
  "dEndDt" = now(),
  "cRemark" = 'Forcefully canceled by uploder'
  FROM task."TaskDetail" td
  JOIN task."TaskMaster" tm ON td."nTid" = tm."nTid"
  JOIN "TempUploads" tu ON tu."nTid" = tm."nTid" OR tu."nTid" = tm."nLinkId"
  WHERE trd."nTDid" = td."nTDid";

    -- Open the refcursor for the caller
    OPEN ref FOR
         SELECT 1 AS msg, 'success' AS "value";

    RETURN ref;
END;
$function$
