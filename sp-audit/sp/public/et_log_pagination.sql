CREATE OR REPLACE FUNCTION public.et_log_pagination(parameter jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_nMasterid uuid;
    
    jData jsonb;
    v_nLogid int;
    v_nPtaskid uuid;
    v_nBundledetailid uuid;
    v_cRemark text;
    inserted_id uuid;
BEGIN
    -- Extract values from the JSONB parameter
    v_nLCatid := parameter->>'nLCatid';
    v_nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    
    jData := parameter->>'jData';
    v_nLogid:= jData->>'nLogid';
    v_nPtaskid:= NULLIF(jData->>'nPtaskid','')::uuid;
    v_nBundledetailid:= NULLIF(jData->>'nBundledetailid','')::uuid;
    v_cRemark := jData->>'cRemark';

    -- Insert into the table
    -- select * from "Paginationtask"
    -- select * from "LogPagination"
        INSERT INTO "LogPagination" ("nLCatid","nLogid","nBundledetailid","nPtaskid", "nMasterid", "cRemark", "jOther")
        VALUES (v_nLCatid,v_nLogid,v_nBundledetailid,v_nPtaskid, v_nMasterid, v_cRemark, jData)
        RETURNING "nPGLogid" INTO inserted_id;

    

    -- Return the newly inserted id
    RETURN inserted_id;
END;
$function$
