CREATE OR REPLACE FUNCTION public.et_insert_rtusers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    cUserid VARCHAR(10);
   
    nUserid UUID;
BEGIN
    cUserid := (parameter ->> 'cUnicuserid')::VARCHAR(10);
    

     -- Check if user already exists
    SELECT "nUserid" INTO nUserid FROM "RTUsers" WHERE "cUserid" = cUserid LIMIT 1;

    -- If user doesn't exist, insert new user
    IF NOT FOUND THEN
        INSERT INTO "RTUsers" ("cUserid", "dCreatedt")
        VALUES (cUserid, now())
        RETURNING "nUserid" INTO nUserid;
    END IF;

    IF FOUND THEN
        OPEN ref FOR SELECT nUserid AS "nUserid", 1 AS status, 'Success: User inserted' AS message;
    ELSE
        OPEN ref FOR SELECT '00000000-0000-0000-0000-000000000000'::uuid AS "nUserid", -1 AS status, 'Error: User not inserted' AS message;
    END IF;

    RETURN ref;
END;
$function$
