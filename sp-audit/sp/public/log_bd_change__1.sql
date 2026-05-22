CREATE OR REPLACE FUNCTION public.log_bd_change(p_nbundledetailid integer, p_col_name text, p_new_value text, p_nbdacid integer, p_nuserid integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_value text;
BEGIN
    -- Retrieve the current (old) value from BundleDetail dynamically
    EXECUTE format(
        'SELECT TRIM(%I) FROM "BundleDetail" WHERE "nBundledetailid" = %L',
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
                 SELECT "nBundledetailid", %L, "nCreateId", %s
                   FROM "BundleDetail"
                  WHERE "nBundledetailid" = %L LIMIT 1',
                old_value, p_nBDACid, p_nBundledetailid);
        END IF;
        -- Log the new value
        EXECUTE format(
            'INSERT INTO "LogBDUpdate"("nBDid", "name", "nUserid", "nBDACid")
             VALUES (%L, %L, %L, %s)',
            p_nBundledetailid, TRIM(p_new_value), p_nUserid, p_nBDACid);
    END IF;
END;
$function$
