-- 2026-07-01 — public.et_output_data_export_delete (NEW)
-- Owner-scoped delete of a data-export row; returns its cKey so the caller can
-- also remove the S3 object. Backs the Outputs row "Delete" action.
BEGIN;

CREATE OR REPLACE FUNCTION public.et_output_data_export_delete(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
BEGIN
    OPEN ref FOR
    WITH del AS (
        DELETE FROM public."OutputDataExport"
         WHERE "nExportid" = NULLIF(parameter->>'nExportid','')::uuid
           AND "nCreateId" = NULLIF(parameter->>'nMasterid','')::uuid
        RETURNING "cKey"
    )
    SELECT "cKey" FROM del;
    RETURN ref;
END;
$function$;

COMMIT;
