CREATE OR REPLACE FUNCTION public.et_log_insert(parameter jsonb, OUT ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
  v_nLCatid      int;
  v_functionname text;
  v_logid        uuid;
  v_msg          text;
BEGIN
  RAISE NOTICE 'param=%', parameter;
  RAISE NOTICE 'nLCatid(raw)=%', parameter->>'nLCatid';
  RAISE NOTICE 'nMasterid(raw)=%', parameter->>'nMasterid';

  v_nLCatid := NULLIF(parameter->>'nLCatid','')::int;
  RAISE NOTICE 'v_nLCatid(after cast)=%', v_nLCatid;

  IF v_nLCatid IS NOT NULL THEN
    SELECT "function" INTO v_functionname
    FROM "LogCategory"
    WHERE "nLCatid" = v_nLCatid;

    RAISE NOTICE 'Resolved function name=%', v_functionname;

    IF v_functionname IS NULL THEN
      RAISE EXCEPTION 'Function not found for nLCatid %', v_nLCatid;
    END IF;

    -- IMPORTANT: capture the UUID returned by the inner function
    BEGIN
      EXECUTE format('SELECT %I($1::jsonb)', v_functionname)
        INTO v_logid
        USING parameter;

      RAISE NOTICE 'Returned nLogid=%', v_logid;

      OPEN ref FOR
        SELECT *
        FROM public."UserLog"
        WHERE "nLogid" = v_logid;

      RETURN;   -- (OUT ref)
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      RAISE NOTICE 'Inner EXECUTE failed: %', v_msg;
      RAISE;
    END;

  ELSE
    RAISE NOTICE 'v_nLCatid is NULL, skipping function call.';
  END IF;

  OPEN ref FOR SELECT 1;
  RETURN;
END;
$function$
