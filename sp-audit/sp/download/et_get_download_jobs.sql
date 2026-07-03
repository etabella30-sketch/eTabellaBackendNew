CREATE OR REPLACE FUNCTION download.et_get_download_jobs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nMasterid uuid;pageNumber int;cSortBy text;

offsetCount int;perPage int default 10;nDPid uuid;
BEGIN
nCaseid := parameter ->>'nCaseid';
nMasterid := parameter ->>'nMasterid';
pageNumber := parameter ->>'PageNumber';
cSortBy := parameter ->>'cSortBy';
nDPid := parameter ->>'nDPid';

offsetCount := (pageNumber - 1) * perPage;

    OPEN ref FOR
		with tbl as (
		select p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename" as "cTitle",
		coalesce(nullif(p."cZipname",''), c."cCasename" || ' Package') || '.zip' as "cFilename",
		sum(coalesce(b."cSize",'0')::bigint) "totalSize",count(b."nBundledetailid") as "totalFiles",
		p."dStartDt"
		from download."ProcessMaster" p
		join "CaseMaster" c on c."nCaseid" = p."nCaseid"
		join download."Users" u on u."nDPid" = p."nDPid" and u."nUserid" = nMasterid and u."dDelDt" is null
		left join download."ProcessBatchs" b on b."nDPid" = p."nDPid" and b."isFileExists" = true
		where p."nCaseid" = nCaseid and p."dDelDt" is null
		and case when nDPid is not null then p."nDPid" = nDPid else true end
		group by p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename",p."cZipname",p."dStartDt"

		) select * from tbl  order by
  			CASE WHEN cSortBy = 'N' THEN "dCreateDt" END DESC,
  			CASE WHEN cSortBy <> 'N' THEN "dCreateDt" END ASC
		LIMIT perPage
        OFFSET offsetCount
		;

   return ref ;-- Return the cursor to the caller
    END;
$function$;
