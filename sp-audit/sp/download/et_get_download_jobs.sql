CREATE OR REPLACE FUNCTION download.et_get_download_jobs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nCaseid uuid;nMasterid uuid;pageNumber int;cSortBy text;

offsetCount int;perPage int default 10;nDPid uuid;
BEGIN
nCaseid := parameter ->>'nCaseid';
nMasterid := parameter ->>'nMasterid';
pageNumber := parameter ->>'PageNumber';
cSortBy := parameter ->>'cSortBy';
nDPid := parameter ->>'nDPid';

offsetCount := (pageNumber - 1) * perPage;
/*

select * from download.et_get_download_jobs ('{"nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212"}','r1');fetch all in "r1";

 select * from download.et_get_download_jobs ('{"nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","PageNumber":2,"cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";
 
select * from download."ProcessMaster"  order by "dCreateDt"
select * from download."ProcessBatchs" 
select * from "SectionMaster"  limit 1
select * from download."ProcessBatchs" 

select * from download."ProcessMaster" 
select * from download."Users" 
select * from "BundleMaster"  limit 1

select * From download."ProcessStatusLogs"

*/

    OPEN ref FOR
		with tbl as (	
		select p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename" as "cTitle",sum(coalesce(b."cSize",'0')::bigint) "totalSize",count(b."nBundledetailid") as "totalFiles",
		p."dStartDt"
		from download."ProcessMaster" p
		join "CaseMaster" c on c."nCaseid" = p."nCaseid"
		join download."Users" u on u."nDPid" = p."nDPid" and u."nUserid" = nMasterid and u."dDelDt" is null
		left join download."ProcessBatchs" b on b."nDPid" = p."nDPid" and b."isFileExists" = true
		where p."nCaseid" = nCaseid and p."dDelDt" is null --and p."nCreateId" = nMasterid 
		and case when nDPid is not null then p."nDPid" = nDPid else true end
		group by p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename" ,p."dStartDt"
		
		) select * from tbl  order by
  			CASE WHEN cSortBy = 'N' THEN "dCreateDt" END DESC,
  			CASE WHEN cSortBy <> 'N' THEN "dCreateDt" END ASC
		LIMIT perPage
        OFFSET offsetCount
		;

		   
			   
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
