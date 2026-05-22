CREATE OR REPLACE FUNCTION public.et_log_bundledetail(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nBundledetailid uuid;
    v_nMasterid uuid;
    
    jData jsonb;
    
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    
    v_nBundledetailid := NULLIF(jData->>'nBundledetailid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    INSERT INTO "LogBundleDetail" ("nLCatid", "nBundledetailid", "nMasterid", "cRemark", "jOther")
    VALUES (v_nLCatid, v_nBundledetailid, v_nMasterid, v_cRemark, jData)
    RETURNING "nBDLogid" INTO inserted_id;

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
