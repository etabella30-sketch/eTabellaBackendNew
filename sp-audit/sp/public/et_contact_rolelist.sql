CREATE OR REPLACE FUNCTION public.et_contact_rolelist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid UUID;
    nMasterid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;

    OPEN ref FOR
    SELECT 
        cr."nCRoleid",
        cr."cRole",
        cr."cIsdefault"
    FROM "ContactRole" cr
    WHERE cr."nCaseid" = nCaseid AND cr."nUserid" = nMasterid;

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
