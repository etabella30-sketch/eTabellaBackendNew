CREATE OR REPLACE FUNCTION public.et_log_user(parameter jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_nUserid  uuid;
    v_cRemark  varchar(250);
    v_nLogid   uuid;
    v_nLCatid  int;
    v_jOther   jsonb;
BEGIN
    v_nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
    v_cRemark := parameter->>'cRemark';
    v_nLCatid := NULLIF(parameter->>'nLCatid','')::int;
    v_jOther  := parameter->'jData';

    INSERT INTO public."UserLog"
        ("nUserid","cRemark","dCreateDt","nLCatid","jOther")
    VALUES
        (v_nUserid, v_cRemark, now(), v_nLCatid, v_jOther)
    RETURNING "nLogid" INTO v_nLogid;

    RETURN v_nLogid;  -- ✅ return the UUID
END;
$function$
