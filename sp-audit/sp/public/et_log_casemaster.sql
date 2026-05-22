CREATE OR REPLACE FUNCTION public.et_log_casemaster(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_nCaseid uuid;
    v_cRemark text;
    v_jOther jsonb;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    
    v_nCaseid := NULLIF(jData->>'nCaseid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    INSERT INTO "LogCaseMaster" ("nLCatid", "nCaseid", "nMasterid", "cRemark", "jOther")
    VALUES (v_nLCatid, v_nCaseid, v_nMasterid, v_cRemark, jData)
    RETURNING "nCLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
