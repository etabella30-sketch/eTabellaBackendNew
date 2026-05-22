CREATE OR REPLACE FUNCTION public.et_log_bundlemaster(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_nBundleid uuid;
    v_nsectionid uuid;
    v_cRemark text;
    v_jOther jsonb;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    v_nsectionid := NULLIF(jData->>'nSectionid','')::uuid;
    v_nBundleid := NULLIF(jData->>'nBundleid','')::uuid;
    v_cRemark := jData->>'cRemark';
    v_jOther := jData->'jOther';
-- select * from "LogBundleMaster"
    -- Insert into the table
    if(v_nLCatid = 17 and (v_nBundleid IS NULL OR v_nBundleid = '00000000-0000-0000-0000-000000000000'::uuid)) then
        INSERT INTO "LogSectionMaster" ("nLCatid", "nSectionid", "nMasterid", "cRemark", "jOther")
        VALUES (37, v_nSectionid, v_nMasterid, v_cRemark, jData)
        RETURNING "nSLogid" INTO inserted_id;
    else 
        INSERT INTO "LogBundleMaster" ("nLCatid", "nBundleid", "nMasterid", "cRemark", "jOther")
        VALUES (v_nLCatid, v_nBundleid, v_nMasterid, v_cRemark, jData)
        RETURNING "nBLogid" INTO inserted_id;
    end if;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
