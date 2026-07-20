-- 2026-07-01 — Outputs "Export Data": OutputDataExport table + tracking SPs (NEW)
-- Backs the export app's data-export pipeline (facts/tags/indexes -> pdf/xlsx/
-- csv/docx). One row per generated report; the file itself lives in the DO
-- Spaces download bucket (cKey), auto-deleted by that bucket's lifecycle rule.
-- Additive: new table + new public.et_output_data_export_* functions only.

BEGIN;

CREATE TABLE IF NOT EXISTS public."OutputDataExport" (
    "nExportid"  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "nCaseid"    uuid NOT NULL,
    "nCreateId"  uuid NOT NULL,
    "cType"      text NOT NULL,
    "cFormat"    text NOT NULL,
    "cStatus"    text NOT NULL DEFAULT 'P',   -- P processing | C complete | F failed | X expired
    "cKey"       text,                        -- S3 object key in the download bucket
    "cName"      text,                        -- friendly filename
    "dCreateDt"  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_outputdataexport_case_user
    ON public."OutputDataExport" ("nCaseid", "nCreateId", "dCreateDt" DESC);

-- Insert a queued export, return its id.
CREATE OR REPLACE FUNCTION public.et_output_data_export_insert(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
DECLARE nExportid uuid;
BEGIN
    INSERT INTO public."OutputDataExport" ("nCaseid","nCreateId","cType","cFormat","cStatus")
    VALUES (
        NULLIF(parameter->>'nCaseid','')::uuid,
        NULLIF(parameter->>'nMasterid','')::uuid,
        parameter->>'cType',
        parameter->>'cFormat',
        'P'
    )
    RETURNING "nExportid" INTO nExportid;

    OPEN ref FOR SELECT nExportid AS "nExportid";
    RETURN ref;
END;
$function$;

-- Finalize a job (complete or failed) with its object key + filename.
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

-- Fetch one export, owner-scoped (prevents cross-user access — no IDOR).
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

-- List a caller's exports for a case (newest first).
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

COMMIT;
