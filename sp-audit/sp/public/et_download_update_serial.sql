CREATE OR REPLACE FUNCTION public.et_download_update_serial(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
nBid uuid;nBDid uuid;nIndex int;nDTaskid uuid;
fIndex int;nPBid uuid;
BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
nBid := NULLIF(parameter ->>'nBundleid','')::uuid;
nBDid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nIndex := parameter ->>'nNIndex';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
nDTaskid:= NULLIF(parameter ->>'nDTaskid','')::uuid;

	select "nSerial","nPBid" into fIndex,nPBid from "DownloadTDetail" where "nBDid" = nBDid and "nBid" = nBid;
	
	update "DownloadTDetail" set "nSerial" = case when fIndex > nIndex then "nSerial" + 1 else "nSerial" - 1  end where "nDTaskid" =nDTaskid and "nBid" = nBid and "nPBid" = nPBid and case when fIndex < nIndex then "nSerial" between fIndex and (nIndex+1) else   "nSerial" between (nIndex-1) and fIndex end;

	update "DownloadTDetail" set "nSerial" = case when fIndex < nIndex then nIndex + 1 else nIndex - 1  end where  "nDTaskid" =nDTaskid and "nBid" = nBid and "nPBid" = nPBid and "nBDid" = nBDid;
open ref for select 1 msg;
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
