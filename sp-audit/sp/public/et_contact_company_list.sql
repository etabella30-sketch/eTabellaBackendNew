CREATE OR REPLACE FUNCTION public.et_contact_company_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid uuid;
    nMasterid uuid;
BEGIN
    nCaseid := (parameter ->> 'nCaseid')::uuid;
    nMasterid := (parameter ->> 'nMasterid')::uuid;

    OPEN ref FOR
    SELECT 
        cc."nCompanyid",
        cc."cCompany"
    FROM "ContactCompany" cc
    WHERE cc."nCaseid" = nCaseid AND cc."nUserid" is null;

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
