CREATE OR REPLACE FUNCTION public.et_log_fact(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_jFSids jsonb;
    v_nFSid uuid;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    
    v_jFSids := jData->>'jFSids';
    v_nFSid := NULLIF(jData->>'nFSid','')::uuid;
-- select * from "LogFactMaster"
    -- Insert into the table
    if(v_nFSid IS NOT NULL) then
        INSERT INTO "LogFactMaster" ("nLCatid", "nFSid", "nMasterid",  "jOther")
        VALUES (v_nLCatid, v_nFSid, v_nMasterid, jData)
        RETURNING "nFSLogid" INTO inserted_id;
    end if;
    
    if(jsonb_array_length(v_jFSids) > 0) then
        INSERT INTO "LogFactMaster" ("nLCatid", "nFSid", "nMasterid")
        select distinct v_nLCatid, nFSid::uuid, v_nMasterid from jsonb_array_elements_text(v_jFSids) nFSid;
    end if;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
