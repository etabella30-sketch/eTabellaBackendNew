-- QA DR-012 (Document Reader QA report, 2026-10-26): the Outputs grid labelled an annotated
-- PDF with the SOURCE document's size (BundleDetail.cFilesize, "429 KB") while the generated
-- final.pdf was 829,729 bytes. Record the generated artifact's byte length when an export
-- completes and expose it to the grid as "nSize"; the frontend prefers nSize over cFilesize.
-- Pure SP + column change: no service restart needed for the SPs, but the export app must be
-- redeployed to start sending nSize.

BEGIN;
DO $guard$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Export output size migration: verify the intended database first';
  END IF;
END $guard$;

ALTER TABLE public."ExportMaster" ADD COLUMN IF NOT EXISTS "nSize" bigint;
ALTER TABLE public."ExportDetail" ADD COLUMN IF NOT EXISTS "nSize" bigint;

-- Single / merged PDF completion: also store the generated file's size.
CREATE OR REPLACE FUNCTION public.et_export_update_single_pdf(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid;cPath text;nSize bigint;

BEGIN

nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
cPath := parameter ->>'cPath';
nSize := NULLIF(parameter ->>'nSize','')::bigint;

update "ExportMaster" set
"cExppath" = cPath,"cStatus" = 'C',"nSize" = COALESCE(nSize, "nSize")
where "nExportid" = nExportid;

open ref for select 1 as msg,"cType","cStatus","nUserid","nCaseid" from "ExportMaster" where "nExportid" = nExportid;

 RETURN ref;
    END;
$function$;

-- Per-file completion (multi-file exports): also store the generated file's size.
CREATE OR REPLACE FUNCTION public.et_export_file_complete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid; nEDid uuid; cToken text; cPath text; nSize bigint;

BEGIN

nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
cPath := parameter->>'cPath';
nSize := NULLIF(parameter ->>'nSize','')::bigint;

 update "ExportDetail" set "cPath" = cPath, "nSize" = COALESCE(nSize, "nSize") where "nEDid" = nEDid;

 cToken := (select "cToken" From "UserMaster" where "nUserid" = nUserid);

 open ref for select e."nEDid",em."nCaseid",e."nBDid" "nBundledetailid",e."nBundleid",(case when e."nBundleid" IS NOT NULL then dm."cBundlename" else d."cFilename" end) "cFilename", cToken as "cToken",
 'Your file ' || (case when e."nBundleid" IS NOT NULL then dm."cBundlename" else d."cFilename" end) || ' ready for download' as "cMsg",'Export complete' as "cTitle",
  case when em."cType" = 'M' then e."cStatus" else em."cStatus" end "cStatus"
 from "ExportDetail" e
 join "ExportMaster" em on em."nExportid" = e."nExportid"
 left join "BundleDetail" d on d."nBundledetailid" = e."nBDid"
 left join "BundleMaster" dm on dm."nBundleid" = e."nBundleid"
 where "nEDid" = nEDid;

 RETURN ref;
    END;
$function$;

-- Grid: expose the generated size as "nSize" (NULL for outputs made before this change;
-- "cFilesize" stays the source document's size as before).
CREATE OR REPLACE FUNCTION public.et_export_grid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid uuid;
    nCaseid uuid;
    nExportid uuid;
    nEDid uuid;
    cSortBy text;
    query text;
BEGIN
    nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
    nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
    nExportid := NULLIF(parameter->>'nExportid','')::uuid;
    nEDid := NULLIF(parameter->>'nEDid','')::uuid;
    cSortBy := coalesce(parameter->>'cSortby', 'N');

    query := 'WITH tbl AS (
        SELECT
            e."nExportid",
            e."cType",
            e."nUserid",
            e."nCaseid",
            e."dReqDt",
            TO_CHAR(e."dReqDt", ''dd/Mon/yyyy hh24:mi'') AS "dStartdt",
            e."cPgsize",
            ed."nEDid",
            bd."nBundledetailid",
            ed."cPath",
            ed."dStartDt",
            ed."cStatus",
            bd."cFilename",
            bd."cFilename" AS "cOUTname",
            ROUND(ed."nProgress") AS "comp_progres",
            100 AS "total_prog",
			COALESCE(NULLIF(bd."cFilesize", '''')::bigint, 0) AS "cFilesize",
			ed."nSize" AS "nSize",
			bd."cTab",
			bd."cExhibitno"
        FROM "ExportMaster" e
        JOIN "ExportDetail" ed ON ed."nExportid" = e."nExportid"
        JOIN "BundleDetail" bd ON bd."nBundledetailid" = ed."nBDid"
        WHERE e."nUserid" = ''' || nUserid || '''::uuid
            AND e."nCaseid" = ''' || nCaseid || '''::uuid
            AND "cType" = ''M''
        UNION ALL
        SELECT
            e."nExportid",
            e."cType",
            e."nUserid",
            e."nCaseid",
            e."dReqDt",
            TO_CHAR(e."dReqDt", ''dd/Mon/yyyy hh24:mi'') AS "dStartdt",
            e."cPgsize",
            NULL AS "nEDid",
            NULL AS "nBundledetailid",
            e."cExppath" AS "cPath",
            e."dReqDt" AS "dStartDt",
            e."cStatus",
            CASE
                WHEN ed."nBundleid" IS NOT NULL THEN STRING_AGG(DISTINCT "cFolder", '','' ORDER BY "cFolder")
                ELSE COALESCE(STRING_AGG(bd."cFilename", '','' ORDER BY trim(bd."cFilename")), '''')
            END AS "cFilename",
            CASE
                WHEN ed."nBundleid" IS NOT NULL THEN STRING_AGG(DISTINCT "cFolder", '','' ORDER BY "cFolder")
                WHEN COUNT(bd."nBundledetailid") > 1 THEN (cm."cCasename" || ''_'' || "dReqDt"::date)
                ELSE COALESCE(STRING_AGG((CASE
                        WHEN COALESCE(bd."cTab", '''') != '''' THEN COALESCE(bd."cTab", '''') || ''-''
                        ELSE ''''
                    END || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(bd."cFilename", ''/'', ''''), ''\'', ''''), ''"'', ''''), '':'', ''''), ''?'', ''''), ''<'', ''''), ''>'', '''')), '','' ORDER BY trim(bd."cTab"),trim(bd."cFilename")), '''')
            END AS "cOUTname",
            ROUND(e."nProgress" / COUNT(ed."nEDid")) AS "comp_progres",
            (100 * COUNT(ed."nEDid")) AS "total_prog",
			SUM(COALESCE(NULLIF(bd."cFilesize", '''')::bigint, 0)) AS "cFilesize",
			e."nSize" AS "nSize",
			STRING_AGG(bd."cTab", '','' ORDER BY bd."cTab") AS "cTab",
			STRING_AGG(bd."cExhibitno", '','' ORDER BY bd."cExhibitno") AS "cExhibitno"
			FROM "ExportMaster" e
        JOIN "ExportDetail" ed ON ed."nExportid" = e."nExportid"
        LEFT JOIN "BundleDetail" bd ON bd."nBundledetailid" = ed."nBDid"
        LEFT JOIN "BundleMaster" b ON b."nBundleid" = ed."nBundleid"
        LEFT JOIN "SectionMaster" f ON f."nSectionid" = b."nSectionid"
        JOIN "CaseMaster" cm ON cm."nCaseid" = e."nCaseid"
        WHERE e."nUserid" = ''' || nUserid || '''::uuid
            AND e."nCaseid" = ''' || nCaseid || '''::uuid
            AND "cType" = ''S''
        GROUP BY
            e."nExportid",
            e."nUserid",
            e."nCaseid",
            e."dReqDt",
            e."cPgsize",
            e."cExppath",
            e."dReqDt",
            e."cStatus",
            e."nSize",
            cm."cCasename",
            ed."nBundleid"
			)
    SELECT *
    FROM tbl t
    WHERE ' || CASE WHEN nExportid IS NULL THEN 'true' ELSE 't."nExportid" = ''' || nExportid || '''::uuid' END || '
      AND ' || CASE WHEN nEDid IS NULL THEN 'true' ELSE 't."nEDid" = ''' || nEDid || '''::uuid' END || '
    ORDER BY "dReqDt" ' || CASE WHEN cSortBy = 'N' THEN 'DESC NULLS LAST' ELSE 'ASC' END || ',trim(t."cFilename")';

    open ref for EXECUTE query;

    RETURN ref;
END;
$function$;

COMMIT;
