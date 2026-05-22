CREATE OR REPLACE FUNCTION public.et_log_contactassign(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_nContactid uuid;
    v_jFiles jsonb;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    
    v_nContactid := NULLIF(jData->>'nContactid','')::uuid;
    v_jFiles := coalesce((jData->>'jFiles'),(jData->>'jBDids'));
-- select * from "LogContactAssign"
    -- Insert into the table

    if(jsonb_array_length(v_jFiles) > 0) then    
        INSERT INTO "LogContactAssign" ("nLCatid", "nContactid", "nBDid", "nMasterid", "jOther")
        select v_nLCatid, v_nContactid, v_ID::uuid, v_nMasterid, jData from jsonb_array_elements_text(v_jFiles) v_ID
        RETURNING "nCALogid" INTO inserted_id;
    end if;
    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
