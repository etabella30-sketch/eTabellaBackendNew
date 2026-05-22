CREATE OR REPLACE FUNCTION present.et_present_setup_files_serial_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;
	nPresentid uuid;
	jFiles jsonb;

	

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
jFiles := parameter ->>'jFiles';

/*
select * From "PMDocuments"

*/

 WITH tbl AS (
        SELECT 
            (value->>'nPDid')::uuid AS nPDid,
            (value->>'nSerial')::INT AS nSerial
        FROM jsonb_array_elements(jFiles) AS value
    )
    UPDATE present."PMDocuments" AS pm
    SET "nSerial" = tbl.nSerial
    FROM tbl
    WHERE pm."nPDid" = tbl.nPDid AND pm."nPresentid" = nPresentid
	AND pm."nSerial" IS DISTINCT FROM tbl.nSerial;

   OPEN ref FOR 
    SELECT 1 AS msg, 'updated' AS value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
