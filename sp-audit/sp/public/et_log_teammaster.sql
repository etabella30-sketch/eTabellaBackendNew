CREATE OR REPLACE FUNCTION public.et_log_teammaster(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
	
	jData jsonb;
	
    v_nTeamid uuid;
    v_cRemark text;
    v_jOther jsonb;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
	
	jData := parameter->>'jData';
	
    v_nTeamid := NULLIF(jData->>'nTeamid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    INSERT INTO "LogTeamMaster" ("nLCatid", "nTeamid", "nMasterid", "cRemark", "jOther")
    VALUES (v_nLCatid, v_nTeamid, v_nMasterid, v_cRemark, jData)
    RETURNING "nTLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
