CREATE OR REPLACE FUNCTION public.et_log_permission(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$

DECLARE
    v_nLCatid int;
    v_nMasterid uuid;

    jData jsonb;
    
    v_nUserid uuid;
    v_nUPid uuid;
    v_nCaseid uuid;
    v_nPMid int;
    v_cRemark text;
    v_jOther jsonb;
    inserted_id uuid;
    v_nRoleid uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

    jData := parameter->>'jData';
    
    v_nUserid := NULLIF(jData->>'nUserid','')::uuid;
    v_nUPid := NULLIF(jData->>'nUPid','')::uuid;
    v_nCaseid := NULLIF(jData->>'nCaseid','')::uuid;
    v_nPMid := jData->>'nPMid';
    v_cRemark := jData->>'cRemark';
    v_jOther := jData->'jOther';
    v_nRoleid:= NULLIF(jData->>'nRoleid','')::uuid;

    -- Insert into the table
    INSERT INTO "LogUserPermission" ("nLCatid", "nUserid", "nUPid", "nCaseid", "nPMid",  "nMasterid", "cRemark", "jOther","nRoleid")
    VALUES (v_nLCatid, v_nUserid,v_nUPid,v_nCaseid,v_nPMid,v_nMasterid, v_cRemark, v_jOther,v_nRoleid)
    RETURNING "nUPLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
