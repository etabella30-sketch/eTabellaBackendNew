CREATE OR REPLACE FUNCTION public.et_log_bundlepermission(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_nBundleid uuid;
    v_nBundledetailid uuid;
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
    v_nBundledetailid := NULLIF(jData->>'nBundledetailid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    
    INSERT INTO "LogBPermission" ("nLCatid", "nBundleid", "nBundledetailid", "nMasterid", "cRemark", "jOther")
    VALUES (v_nLCatid, v_nBundleid, v_nBundledetailid, v_nMasterid, v_cRemark, jData)
    RETURNING "nBPLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
