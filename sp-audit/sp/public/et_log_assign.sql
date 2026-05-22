CREATE OR REPLACE FUNCTION public.et_log_assign(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    jData jsonb;
    
    v_jUsers jsonb;
    v_nCaseid uuid;
    v_cRemark text;
    v_jOther jsonb;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    
    v_jUsers := jData->>'jUsers';
    v_nCaseid := NULLIF(jData->>'nCaseid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    INSERT INTO "LogTeamRelation" ("nLCatid", "jUsers", "nCaseid", "nMasterid", "cRemark", "jOther")
    values (v_nLCatid, v_jUsers, v_nCaseid, v_nMasterid, v_cRemark, jData)
    RETURNING "nTRLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
