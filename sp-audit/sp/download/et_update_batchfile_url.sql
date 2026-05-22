CREATE OR REPLACE FUNCTION download.et_update_batchfile_url(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nDPid uuid;cPath text;nBundledetailid uuid;

BEGIN

nDPid := parameter ->> 'nDPid';
cPath := parameter ->> 'cPath';
nBundledetailid:= parameter ->> 'nBundledetailid';

/*

 select * from download.et_update_presign_url ('{"nDPid":"d4ed7930-b312-4c8f-8d76-6d4bdeac7d90","cStatus":"C"}','r1');fetch all in "r1";
select * From download."ProcessStatusLogs"

select * From download."ProcessMaster"

 
*/
 
nDPid := NULLIF(parameter ->>'nDPid','')::uuid;
cPath := parameter ->>'cPath';
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

update download."ProcessBatchs" set "cPath" = cPath where "nDPid" = nDPid and "nBundledetailid" = nBundledetailid;

open ref for select 1 as msg,'Status Updated' as value;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
