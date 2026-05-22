CREATE OR REPLACE FUNCTION upload.et_update_detail_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE

  cStatus text;
  nUDid uuid;
  nBDid uuid;
  cRemark text;

  nUPid uuid;

  nComplete int;
  nFailed int;
  nPending int;
  nTotal int;
  
	
BEGIN
    -- Extract the tab id from the JSON parameter
    cStatus := parameter ->> 'cStatus';
	nUDid := NULLIF(parameter ->>'nUDid','')::uuid;
	cRemark := parameter ->>'cRemark';
/*

select * from upload.et_update_detail_status ('{""nUserid"":464,""cStatus"":""C"", ""nUDid"": 5}','r1');fetch all in ""r1"";

select * from upload."UploadDetail" 

select * from upload."UploadMaster" 

select * from task."TaskRemarkDetail"

select * from task."TaskDetail"

select * from upload."UploadLogs" limit 1

select * from upload.summary where "nUPid" = 1
*/

if cStatus in  ('F', 'C') then

	  nBDid := (select "nBundledetailid" from upload."UploadDetail" where "nUDid" = nUDid limit 1);
	  
	  update task."TaskRemarkDetail" trd
	  set "nStatus"  = case when cStatus = 'F' then 2 else 1 end, "dEndDt" = now(), "cRemark" = cRemark
	  where trd."nTDid" in (select "nTDid" from task."TaskDetail" where "nBDid" = nBDid);
	
	  if(cStatus = 'F') then 
		  update "BundleDetail" 
		  set "cStatus" = cStatus
		  where "nBundledetailid" = nBDid;
	
	  end if;

	  nUPid := (select "nUPid" from upload."UploadDetail" where "nUDid" = nUDid limit 1);

end if;

  update upload."UploadDetail"
  set "cStatus" = cStatus
  where "nUDid" = nUDid;

  	 select "nComplete", "nFailed", "nPending", "nTotal" into nComplete, nFailed, nPending, nTotal from upload.summary where "nUPid" = nUPid;

		IF nTotal = nComplete + nFailed THEN
		    -- Update uploadmaster table
		    UPDATE upload."UploadMaster"
		    SET "cStatus" = 'C'
		    WHERE "nUPid" = nUPid;
		
		END IF;
	
     insert into upload."UploadLogs"("nUDid", "cStatus") values(nUDid, cStatus);
	 
    -- Open the refcursor for the caller
    OPEN ref FOR
         SELECT 1 AS msg, 'success' AS "value", nComplete as "nComplete", nFailed as "nFailed", nPending as "nPending";

    RETURN ref;
END;
$function$
