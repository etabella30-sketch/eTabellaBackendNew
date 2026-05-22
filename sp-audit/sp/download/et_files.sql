CREATE OR REPLACE FUNCTION download.et_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nDPid uuid;
BEGIN
nDPid:= parameter ->>'nDPid';

-- select * from download.et_files ('{"nDPid":1}','r1');fetch all in "r1";
-- select * from download."ProcessBatchs" 

    OPEN ref FOR
				
		select "nBid","cPath","foldername","cFilename",
		"nBundledetailid","nBatchid","cSize" as "size","cStatus","isFileExists" as "isExists","cBatchType" 
		from download."ProcessBatchs" where "nDPid" = nDPid order by "nSerial";

		   
			   
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
