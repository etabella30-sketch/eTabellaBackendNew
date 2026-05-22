CREATE OR REPLACE FUNCTION public.et_log_dashboard(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    -- Insert into the table
    INSERT INTO "LogDashboard" ("nLCatid", "nMasterid")
    VALUES (v_nLCatid, v_nMasterid)
    RETURNING "nDLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
