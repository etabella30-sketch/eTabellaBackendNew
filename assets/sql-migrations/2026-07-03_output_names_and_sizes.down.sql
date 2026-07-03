-- Revert 2026-07-03_output_names_and_sizes: restore the pre-change SPs.
-- The OutputDataExport."nSize" column is left in place (harmless, additive).

BEGIN;

CREATE OR REPLACE FUNCTION public.et_output_data_export_complete(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
BEGIN
    UPDATE public."OutputDataExport"
       SET "cStatus" = parameter->>'cStatus',
           "cKey"    = NULLIF(parameter->>'cKey',''),
           "cName"   = NULLIF(parameter->>'cName','')
     WHERE "nExportid" = NULLIF(parameter->>'nExportid','')::uuid;

    OPEN ref FOR SELECT 1 AS msg;
    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_output_data_export_get(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
BEGIN
    OPEN ref FOR
    SELECT "nExportid","nCaseid","cType","cFormat","cStatus","cKey","cName","dCreateDt"
      FROM public."OutputDataExport"
     WHERE "nExportid" = NULLIF(parameter->>'nExportid','')::uuid
       AND "nCreateId" = NULLIF(parameter->>'nMasterid','')::uuid;
    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_output_data_export_list(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
BEGIN
    OPEN ref FOR
    SELECT "nExportid","nCaseid","cType","cFormat","cStatus","cName","dCreateDt"
      FROM public."OutputDataExport"
     WHERE "nCaseid"   = NULLIF(parameter->>'nCaseid','')::uuid
       AND "nCreateId" = NULLIF(parameter->>'nMasterid','')::uuid
     ORDER BY "dCreateDt" DESC;
    RETURN ref;
END;
$function$;

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
		c."cCasename" as "cTitle",sum(coalesce(b."cSize",'0')::bigint) "totalSize",count(b."nBundledetailid") as "totalFiles",
		p."dStartDt"
		from download."ProcessMaster" p
		join "CaseMaster" c on c."nCaseid" = p."nCaseid"
		join download."Users" u on u."nDPid" = p."nDPid" and u."nUserid" = nMasterid and u."dDelDt" is null
		left join download."ProcessBatchs" b on b."nDPid" = p."nDPid" and b."isFileExists" = true
		where p."nCaseid" = nCaseid and p."dDelDt" is null
		and case when nDPid is not null then p."nDPid" = nDPid else true end
		group by p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename",p."dStartDt"

		) select * from tbl  order by
  			CASE WHEN cSortBy = 'N' THEN "dCreateDt" END DESC,
  			CASE WHEN cSortBy <> 'N' THEN "dCreateDt" END ASC
		LIMIT perPage
        OFFSET offsetCount
		;

   return ref ;-- Return the cursor to the caller
    END;
$function$;

COMMIT;
