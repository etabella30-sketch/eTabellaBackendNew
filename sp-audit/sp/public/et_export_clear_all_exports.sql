CREATE OR REPLACE FUNCTION public.et_export_clear_all_exports(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid uuid;
    nCaseid uuid;
    export_ids uuid[];
BEGIN
    -- Extract values from the JSON parameter
    nUserid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;

    -- Delete from ExportMaster table and store the deleted nExportid in an array
    WITH deleted_exports AS (
        DELETE FROM "ExportMaster"
        WHERE "nCaseid" = nCaseid
          AND "nUserid" = nUserid
        RETURNING "nExportid"
    )
    SELECT array_agg("nExportid") INTO export_ids FROM deleted_exports;

    -- Delete from ExportDetail table using the nExportid array
    DELETE FROM "ExportDetail"
    WHERE "nExportid" = ANY(export_ids);

    -- Open the cursor to return a confirmation message
    OPEN ref FOR SELECT 1 msg,'Clear' value;

    -- Return the cursor to the caller
    RETURN ref;
END;
$function$
