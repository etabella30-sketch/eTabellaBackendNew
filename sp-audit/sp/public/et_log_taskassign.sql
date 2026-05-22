CREATE OR REPLACE FUNCTION public.et_log_taskassign(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
	
	jData jsonb;
	
    v_nTaskid uuid;
	v_jFiles jsonb;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
	
	jData := parameter->>'jData';
	
    v_nTaskid := NULLIF(jData->>'nTaskid','')::uuid;
    v_jFiles := coalesce((jData->>'jFiles'),(jData->>'jBDids'));
-- select * from ""LogTaskAssign""
    -- Insert into the table

	if(jsonb_array_length(v_jFiles) > 0) then	
	    INSERT INTO "LogTaskAssign" ("nLCatid", "nTaskid","nBDid", "nMasterid",  "jOther")
	    select v_nLCatid, v_nTaskid, v_ID::uuid, v_nMasterid, jData from jsonb_array_elements_text(v_jFiles) v_ID
	    RETURNING "nTaskALogid" INTO inserted_id;
	end if;
    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
