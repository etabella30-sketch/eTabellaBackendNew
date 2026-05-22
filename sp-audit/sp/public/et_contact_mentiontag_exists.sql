CREATE OR REPLACE FUNCTION public.et_contact_mentiontag_exists(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid    uuid;
    nCaseid      uuid;
	nContactid   uuid;
	cMentiontag text;
	cPermission text;
	tagExists boolean;

	
    
BEGIN
    nMasterid := (parameter ->> 'nMasterid')::uuid;
    nCaseid   := (parameter ->> 'nCaseid')::uuid;
	nContactid   := (parameter ->> 'nContactid')::uuid;
	cMentiontag   := (parameter ->> 'cMentiontag')::text;
	cPermission   := (parameter ->> 'cPermission')::text;
   
    SELECT EXISTS(
      SELECT 1 FROM "ContactMaster"
       WHERE UPPER(TRIM("cMentiontag")) = UPPER(TRIM(cMentiontag))
         AND "nCaseid" = nCaseid
         AND "nUserid" = nMasterid
         AND ("nContactid" <> nContactid OR cPermission = 'N')
    ) INTO tagExists;

    IF tagExists THEN
        OPEN ref FOR SELECT -1 AS msg,'Tag Already Exists' AS value;
   
    ELSE
   		OPEN ref FOR SELECT 1 AS msg,'Tag not exists' AS value;

	END IF;
  	RETURN ref;
END;
$function$
