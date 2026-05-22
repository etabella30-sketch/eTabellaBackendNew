CREATE OR REPLACE FUNCTION public.et_log_task(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
	
	jData jsonb;
	
    v_nTaskid uuid;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
	
	jData := parameter->>'jData';
	
    v_nTaskid := NULLIF(jData->>'nTaskid','')::uuid;
-- select * from ""FactMaster""
    -- Insert into the table
    INSERT INTO "LogTaskMaster" ("nLCatid", "nTaskid", "nMasterid",  "jOther")
    VALUES (v_nLCatid, v_nTaskid, v_nMasterid, jData)
    RETURNING "nTaskLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
