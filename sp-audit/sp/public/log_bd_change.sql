CREATE OR REPLACE FUNCTION public.log_bd_change(p_nbundledetailid uuid, p_col_name text, p_new_value text, p_nbdacid uuid, p_nuserid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_value text;
BEGIN
    -- Retrieve the current (old) value from BundleDetail dynamically
    EXECUTE format(
        'SELECT TRIM(%I) FROM "BundleDetail" WHERE "nBundledetailid" = ''%s''::uuid',
        p_col_name, p_nBundledetailid)
    INTO old_value;
    
    -- Compare old and new values (using COALESCE to handle nulls)
    IF COALESCE(old_value, '') <> COALESCE(TRIM(p_new_value), '') THEN
        -- Log the old value if not already logged for this attribute
        PERFORM 1 FROM "LogBDUpdate"
         WHERE "nBDid" = p_nBundledetailid 
           AND "nBDACid" = p_nBDACid;
        IF NOT FOUND THEN
            EXECUTE format(
                'INSERT INTO "LogBDUpdate"("nBDid", "name", "nUserid", "nBDACid")
                 SELECT "nBundledetailid", ''%s'', "nCreateId", ''%s''::uuid
                   FROM "BundleDetail"
                  WHERE "nBundledetailid" = ''%s''::uuid LIMIT 1',
                old_value, p_nBDACid, p_nBundledetailid);
        END IF;
        -- Log the new value
        EXECUTE format(
            'INSERT INTO "LogBDUpdate"("nBDid", "name", "nUserid", "nBDACid")
             VALUES (''%s''::uuid, ''%s'', ''%s''::uuid, ''%s''::uuid)',
            p_nBundledetailid, TRIM(p_new_value), p_nUserid, p_nBDACid);
    END IF;
END;
$function$
