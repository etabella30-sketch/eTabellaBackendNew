CREATE OR REPLACE FUNCTION download.et_get_download_presigned_url(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nMasterid uuid;nDPid uuid;
BEGIN
nMasterid := parameter ->>'nMasterid';
nDPid := parameter ->>'nDPid';
/*

select * from download.et_get_download_presigned_url ('{"nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","cSortBy":"N","nDPid":"2a0df4fc-301a-4e2c-8b21-2b9f8cd6f0ca"}','r1');fetch all in "r1";

select * from download."ProcessMaster"  order by "dCreateDt"
select * from download."ProcessBatchs" 
select * from "SectionMaster"  limit 1
select * from download."ProcessBatchs" 

select * from download."ProcessMaster" 
select * from "BundleMaster"  limit 1

select * From download."ProcessStatusLogs"

*/

    OPEN ref FOR
		select "cUrl"
		from download."ProcessMaster" where "nDPid" = nDPid
		
		;

		   
			   
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
