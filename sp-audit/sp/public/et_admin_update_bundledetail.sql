CREATE OR REPLACE FUNCTION public.et_admin_update_bundledetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    nUserid uuid;
    nBundledetailid uuid;
    cExhibitno text;
    cFilename text;
    cDescription text;
    dIntrestDt date;
    cTab text;
    cAuthor text;
BEGIN

    ------------------------------------------------------------------
    -- Safe UUID parsing (NO json ? operator)
    ------------------------------------------------------------------
    nUserid :=
        CASE 
            WHEN parameter ->> 'nMasterid' IS NOT NULL
                 AND parameter ->> 'nMasterid' <> ''
            THEN (parameter ->> 'nMasterid')::uuid
            ELSE NULL
        END;

    nBundledetailid :=
        CASE 
            WHEN parameter ->> 'nBundledetailid' IS NOT NULL
                 AND parameter ->> 'nBundledetailid' <> ''
            THEN (parameter ->> 'nBundledetailid')::uuid
            ELSE NULL
        END;

    ------------------------------------------------------------------
    -- Required validation
    ------------------------------------------------------------------
    IF nBundledetailid IS NULL THEN
        RAISE EXCEPTION 'nBundledetailid cannot be null';
    END IF;

    ------------------------------------------------------------------
    -- Text values (empty string -> NULL)
    ------------------------------------------------------------------
    cExhibitno   := NULLIF(parameter ->>'cExhibitno','');
    cFilename    := NULLIF(parameter ->>'cFilename','');
    cDescription := NULLIF(parameter ->>'cDescription','');
    cTab         := NULLIF(parameter ->>'cTab','');
    cAuthor      := NULLIF(parameter ->>'cAuthor','');

    ------------------------------------------------------------------
    -- Safe Date Conversion (DD-MM-YYYY)
    ------------------------------------------------------------------
dIntrestDt :=
CASE 
    WHEN parameter ->> 'dIntrestDt' IS NULL 
         OR parameter ->> 'dIntrestDt' = ''
    THEN NULL

    WHEN parameter ->> 'dIntrestDt' ~ '^\d{4}-\d{1,2}-\d{1,2}$'
    THEN (parameter ->> 'dIntrestDt')::date

    WHEN parameter ->> 'dIntrestDt' ~ '^\d{1,2}-\d{1,2}-\d{4}$'
    THEN to_date(parameter ->>'dIntrestDt','DD-MM-YYYY')

    ELSE NULL
END;

    ------------------------------------------------------------------
    -- Logging (non-blocking)
    ------------------------------------------------------------------
    BEGIN
        PERFORM public.log_bd_change(nBundledetailid, 'cTab', cTab, '43167e6f-62bc-46d0-bce4-0cce98edf5cb', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cFilename', cFilename, 'd4083fb9-a4e2-4e53-be25-09aba2aa1c5e', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cExhibitno', cExhibitno, '6761cde3-6036-4579-8740-ac6fe1577c3c', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cDesc', cDescription, 'b9075b3d-a037-4048-9485-e58e3dd4af94', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'dIntrestDt', dIntrestDt::text, '4b471fc7-9896-4043-9dbf-6fc9409fbcf5', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cAuthor', cAuthor, '99a4e29c-800d-4144-b2ca-872623a4e5de', nUserid);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Logging failed: %', SQLERRM;
    END;

    ------------------------------------------------------------------
    -- Main Update
    ------------------------------------------------------------------
    UPDATE "BundleDetail" bd
    SET 
        "cTab"       = cTab,
        "cExhibitno" = cExhibitno,
        "cFilename"  = TRIM(cFilename),
        "cDesc"      = cDescription,
        "dIntrestDt" = dIntrestDt,
        "cAuthor"    = cAuthor
    WHERE bd."nBundledetailid" = nBundledetailid;

    ------------------------------------------------------------------
    -- Attributes Update
    ------------------------------------------------------------------
    UPDATE "BDAttributes" ba
    SET "cDescription" = cDescription
    WHERE ba."nBundledetailid" = nBundledetailid;

    ------------------------------------------------------------------
    -- Return Cursor
    ------------------------------------------------------------------
    OPEN ref FOR 
        SELECT 1 AS msg, 'Updated' AS value;

    RETURN ref;

END;$function$
