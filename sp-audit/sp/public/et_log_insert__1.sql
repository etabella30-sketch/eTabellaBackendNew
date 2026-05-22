CREATE OR REPLACE FUNCTION public.et_log_insert(parameter jsonb, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_functionname text := '';
BEGIN
    BEGIN
        v_nLCatid := (parameter->>'nLCatid')::int;

        IF v_nLCatid IS NOT NULL AND v_nLCatid::text <> '00000000-0000-0000-0000-000000000000' THEN
            SELECT "function" INTO v_functionname FROM "LogCategory" WHERE "nLCatid" = v_nLCatid;

            IF v_functionname IS NULL THEN
                RAISE EXCEPTION 'Function not found for nLCatid %', v_nLCatid;
            END IF;

            EXECUTE format('SELECT %I($1::jsonb)', v_functionname) USING parameter;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred in et_log_insert: %', SQLERRM;
        -- You can optionally log the error to a table here if needed
    END;

    OPEN ref FOR SELECT 1;
    RETURN ref;
END;
$function$
