CREATE OR REPLACE FUNCTION public.et_contact_case_rolelist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid UUID;
    nMasterid UUID;
BEGIN
    -- Apply P-1: Blank string → NULL conversion
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;

    OPEN ref FOR
    SELECT 
        cr."nCRoleid",
        cr."cRole",
        cr."cIsdefault",
		 CASE 
            WHEN cr."nCaseid" IS NOT NULL AND cr."nUserid" IS NOT NULL THEN true
            ELSE false
        END AS "canEdit"
    FROM "ContactRole" cr
    WHERE 
	(cr."nCaseid" = nCaseid AND cr."nUserid" = nMasterid)
	 OR (cr."nCaseid" IS NULL AND cr."nUserid" IS NULL);

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
