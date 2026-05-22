CREATE OR REPLACE FUNCTION public.et_log_usermaster(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
	
	jData jsonb;
	
    v_nUserid uuid;
    v_cRemark text;
    v_jOther jsonb;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nUserid := NULLIF(parameter->>'nUserid','')::uuid;
	
	jData := parameter->>'jData';
	
    v_nMasterid := NULLIF(jData->>'nMasterid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    INSERT INTO "LogUserMaster" ("nLCatid", "nUserid", "nMasterid", "cRemark", "jOther")
    VALUES (v_nLCatid, v_nUserid, v_nMasterid, v_cRemark, jData)
    RETURNING "nULogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
