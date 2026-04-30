-- 2026-04-29 — public.et_admin_update_bundledetail: store dIntrestDt as text
--
-- Symptom
-- -------
-- POST /bundles-creations/updatebundledetail with body
--   { ... "dIntrestDt": "27 June 1888" ... }
-- returns success (msg=1, "Updated"), but a refresh shows the field empty.
-- Older path: typing "20-05-1905" inline saved as "1905-05-20".
--
-- Root cause
-- ----------
-- The SP declares dIntrestDt as `date` and then converts the JSON input via:
--
--   CASE
--     WHEN ... ~ '^\d{4}-\d{1,2}-\d{1,2}$' THEN (... )::date
--     WHEN ... ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN to_date(..., 'DD-MM-YYYY')
--     ELSE NULL
--   END
--
-- Two problems for the way users actually type dates here:
--   1. Anything that isn't ISO yyyy-mm-dd or DD-MM-YYYY (e.g. "27 June 1888",
--      "Undated", "November 2023") falls through the CASE and becomes NULL,
--      which then overwrites the column.
--   2. Inputs that DO match (e.g. "20-05-1905") are cast to `date` and
--      written back to the varchar column as ISO `1905-05-20`, losing the
--      user's authored format.
--
-- Fix
-- ---
-- The "BundleDetail"."dIntrestDt" column is varchar (verified via
-- information_schema), and other places (batch upload, fact import) already
-- store free-form strings like "23 February 1854" or "Undated" in it. So the
-- SP no longer needs to round-trip through the `date` type — store the
-- caller's value as text, with empty-string normalised to NULL.
--
-- Behaviour after this migration:
--   "27 June 1888"  → stored verbatim as "27 June 1888"
--   "20-05-1905"    → stored verbatim as "20-05-1905"
--   "Undated"       → stored verbatim as "Undated"
--   ""              → stored as NULL
--   absent key      → stored as NULL
--
-- The change-log call now records the same verbatim string instead of the
-- ISO-cast date, so the audit trail matches what the user typed.

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
    cIntrestDt text;       -- was: dIntrestDt date
    cTab text;
    cAuthor text;
BEGIN

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

    IF nBundledetailid IS NULL THEN
        RAISE EXCEPTION 'nBundledetailid cannot be null';
    END IF;

    cExhibitno   := NULLIF(parameter ->> 'cExhibitno', '');
    cFilename    := NULLIF(parameter ->> 'cFilename', '');
    cDescription := NULLIF(parameter ->> 'cDescription', '');
    cTab         := NULLIF(parameter ->> 'cTab', '');
    cAuthor      := NULLIF(parameter ->> 'cAuthor', '');

    -- dIntrestDt: store the caller's text verbatim. The column is varchar
    -- and other ingest paths put free-form strings in here ("Undated",
    -- "23 February 1854", etc.) — re-introducing a date cast here would
    -- silently drop or reformat anything that isn't ISO/DD-MM-YYYY.
    cIntrestDt := NULLIF(parameter ->> 'dIntrestDt', '');

    BEGIN
        PERFORM public.log_bd_change(nBundledetailid, 'cTab', cTab, '43167e6f-62bc-46d0-bce4-0cce98edf5cb', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cFilename', cFilename, 'd4083fb9-a4e2-4e53-be25-09aba2aa1c5e', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cExhibitno', cExhibitno, '6761cde3-6036-4579-8740-ac6fe1577c3c', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cDesc', cDescription, 'b9075b3d-a037-4048-9485-e58e3dd4af94', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'dIntrestDt', cIntrestDt, '4b471fc7-9896-4043-9dbf-6fc9409fbcf5', nUserid);
        PERFORM public.log_bd_change(nBundledetailid, 'cAuthor', cAuthor, '99a4e29c-800d-4144-b2ca-872623a4e5de', nUserid);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Logging failed: %', SQLERRM;
    END;

    UPDATE "BundleDetail" bd
    SET
        "cTab"       = cTab,
        "cExhibitno" = cExhibitno,
        "cFilename"  = TRIM(cFilename),
        "cDesc"      = cDescription,
        "dIntrestDt" = cIntrestDt,
        "cAuthor"    = cAuthor
    WHERE bd."nBundledetailid" = nBundledetailid;

    UPDATE "BDAttributes" ba
    SET "cDescription" = cDescription
    WHERE ba."nBundledetailid" = nBundledetailid;

    OPEN ref FOR
        SELECT 1 AS msg, 'Updated' AS value;

    RETURN ref;

END;$function$;
