CREATE OR REPLACE FUNCTION public.et_log_sectionmaster(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_nSectionid uuid;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    
    v_nSectionid := NULLIF(jData->>'nSectionid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    if(v_nSectionid IS NOT NULL) then 
        INSERT INTO "LogSectionMaster" ("nLCatid", "nSectionid",  "nMasterid", "cRemark", "jOther")
        VALUES (v_nLCatid, v_nSectionid,v_nMasterid, v_cRemark, jData)
        RETURNING "nSLogid" INTO inserted_id;
    end if;
    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
