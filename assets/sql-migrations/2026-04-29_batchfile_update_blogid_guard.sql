-- 2026-04-29 — public.et_batchfile_update: create a Batchlog row if missing
--
-- Symptom
-- -------
-- POST /batch/uploadbatchfile fails with
--   ERROR: invalid input syntax for type uuid: ""
-- The frontend payload is well-formed: every filedata row has a valid UUID
-- in `ID`, the title row has been filtered out, and `nCaseid`/`nSectionid`/
-- `nMasterid` are all valid UUIDs.
--
-- Root cause
-- ----------
-- The SP looks up the most recent Batchlog row for
-- (nCaseid, nSectionid, nCreateId):
--
--   select "nBlogid" into nBlogid from "Batchlog"
--    where "nCaseid" = nCaseid and "nSectionid" = nSectionid
--      and "nCreateId" = nUserid order by "dCreateDt" desc limit 1;
--
-- If the user uploads a batch file *without first downloading a template*
-- (which is what creates the 'P' Batchlog row on a typical flow), the
-- SELECT returns nothing and `nBlogid` stays NULL. A few lines later the
-- per-column dynamic INSERT does:
--
--   EXECUTE format('INSERT INTO "BatchlogDetail" (... "nBlogid" ...)
--                   SELECT ...,''%s''::uuid, ...', nBlogid, ...);
--
-- `format('''%s''', NULL)` produces the literal `''` — and `''::uuid`
-- throws "invalid input syntax for type uuid".
--
-- Fix
-- ---
-- After the SELECT, if `nBlogid` is NULL, INSERT a new Batchlog row with
-- cStatus='P' and capture its id. The existing UPDATE on the next line
-- then promotes it to 'C', and the DELETE that clears stale 'P' rows for
-- this user no longer matches our newly-promoted row. All subsequent
-- BatchlogDetail INSERTs now have a non-null `nBlogid` to reference.
--
-- Everything else in the SP is preserved verbatim.

CREATE OR REPLACE FUNCTION public.et_batchfile_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    cPath text;
    nCaseid uuid;
    nUserid uuid; nSectionid uuid;
    filedata jsonb;
    cColumn text;
    columnMappings jsonb;
    columnMappingRecord jsonb;
    sqlUpdate text; nBlogid uuid;
BEGIN
    cPath := parameter ->> 'cPath';
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid', '')::uuid;
    nUserid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    filedata := (parameter ->> 'filedata')::jsonb;
    cColumn := (parameter ->> 'column');

    DROP TABLE IF EXISTS bundleimpfile;
    CREATE TEMP TABLE bundleimpfile AS
        SELECT *
        FROM jsonb_populate_recordset(NULL::record, filedata) AS (
            "ID" text,
            "Bundle" text,
            "Tab" text,
            "Name" text,
            "Date" text,
            "Description" text,
            "Page" text,
            "Exhibit" text,
            "Author" text
        );

    -- Handle empty IDs and Date
    UPDATE bundleimpfile SET "ID" = NULL WHERE COALESCE("ID", '') = '';
    UPDATE bundleimpfile SET "Date" = NULL WHERE COALESCE("Date", '') = '';

    -- Add nBundleid column
    ALTER TABLE bundleimpfile ADD COLUMN "nBundleid" uuid;

    -- Update nBundleid based on BundleDetail
    UPDATE bundleimpfile f
    SET "nBundleid" = bd."nBundleid"
    FROM "BundleDetail" bd
    WHERE bd."nBundledetailid" = f."ID"::uuid;

    SELECT "nBlogid" INTO nBlogid
    FROM "Batchlog"
    WHERE "nCaseid" = nCaseid
      AND "nSectionid" = nSectionid
      AND "nCreateId" = nUserid
    ORDER BY "dCreateDt" DESC
    LIMIT 1;

    -- ============================================================
    -- NEW guard: bootstrap a Batchlog row if the upload happened
    -- without a prior download/template step. Without this, the
    -- dynamic INSERTs below crash on ''::uuid.
    -- ============================================================
    IF nBlogid IS NULL THEN
        INSERT INTO "Batchlog" (
            "nBlogid", "nCaseid", "nSectionid", "nCreateId",
            "cStatus", "cColumn", "dCreateDt"
        )
        VALUES (
            gen_random_uuid(), nCaseid, nSectionid, nUserid,
            'P', cColumn, NOW()
        )
        RETURNING "nBlogid" INTO nBlogid;
    END IF;

    UPDATE "Batchlog"
    SET "cStatus" = 'C',
        "dUpdateDt" = NOW(),
        "cColumn" = cColumn,
        "nUpdateid" = nUserid
    WHERE "nBlogid" = nBlogid;

    DELETE FROM "Batchlog"
    WHERE "cStatus" = 'P'
      AND "nCaseid" = nCaseid
      AND "nSectionid" = nSectionid
      AND "nCreateId" = nUserid;

    DELETE FROM "BatchlogDetail" WHERE "nBlogid" = nBlogid;

    sqlUpdate := 'UPDATE "BundleDetail" b SET ';
    FOR columnMappingRecord IN SELECT value::jsonb FROM jsonb_array_elements(('[' || cColumn || ']')::jsonb) LOOP
        IF (columnMappingRecord->>1 != 'cBundletag' AND columnMappingRecord->>1 != 'kind') THEN

            EXECUTE format('INSERT INTO "BatchlogDetail" ("nBundledetailid","nBlogid", column_name, old_value, new_value,"isChange")
                            SELECT b."nBundledetailid",''%s''::uuid, %L, b.%I::text, f.%I::text, coalesce(b.%I,'''') IS DISTINCT FROM coalesce(f.%I,'''')
                            FROM "BundleDetail" b
                            JOIN bundleimpfile f ON b."nBundledetailid" = f."ID"::uuid',
                           nBlogid, columnMappingRecord->>0, columnMappingRecord->>1, columnMappingRecord->>0,
                           columnMappingRecord->>1, columnMappingRecord->>0);

            RAISE NOTICE 'Inserted log entry for column: %', columnMappingRecord->>1;

            sqlUpdate := sqlUpdate || format('%I = COALESCE(f.%I,''''), ',
                                             columnMappingRecord->>1, columnMappingRecord->>0, columnMappingRecord->>1);
        END IF;

        IF (columnMappingRecord->>1 = 'cBundletag') THEN
            EXECUTE format('INSERT INTO "BatchlogDetail" ("nBundledetailid","nBlogid", column_name, old_value, new_value,"isChange")
                            SELECT b."nBundledetailid",''%s''::uuid, %L, bm.%I::text, f.%I::text, coalesce(bm.%I,'''') IS DISTINCT FROM coalesce(f.%I,'''')
                            FROM "BundleDetail" b
                            JOIN "BundleMaster" bm ON bm."nBundleid" = b."nBundleid"
                            JOIN bundleimpfile f ON b."nBundledetailid" = f."ID"::uuid',
                           nBlogid, columnMappingRecord->>0, columnMappingRecord->>1, columnMappingRecord->>0,
                           columnMappingRecord->>1, columnMappingRecord->>0);
        END IF;
    END LOOP;

    sqlUpdate := LEFT(sqlUpdate, LENGTH(sqlUpdate) - 2);
    sqlUpdate := sqlUpdate || ' FROM bundleimpfile f WHERE b."nBundledetailid" = f."ID"::uuid;';

    RAISE NOTICE 'sqlUpdate %', sqlUpdate;
    EXECUTE sqlUpdate;

    -- Update the BundleMaster table and log changes
    UPDATE "BundleMaster" b
    SET "cBundletag" = t."Bundle"
    FROM (
        SELECT "Bundle", "nBundleid"
        FROM bundleimpfile
        WHERE "nBundleid" IS NOT NULL AND COALESCE("Bundle", '') != ''
        GROUP BY "nBundleid", "Bundle"
    ) t
    WHERE t."nBundleid" = b."nBundleid"
    AND b."cBundletag" IS DISTINCT FROM t."Bundle";

    INSERT INTO "BatchlogDetail" ("nBundledetailid","nBlogid", column_name, old_value, new_value)
    SELECT "nBundledetailid", nBlogid, 'cBundletag', b."cBundletag"::text, t."Bundle"::text
    FROM "BundleMaster" b
    JOIN (
        SELECT "ID"::uuid "nBundledetailid", "Bundle", "nBundleid"
        FROM bundleimpfile
        WHERE "nBundleid" IS NOT NULL AND COALESCE("Bundle", '') != ''
        GROUP BY "ID", "nBundleid", "Bundle"
    ) t ON t."nBundleid" = b."nBundleid"
    WHERE b."cBundletag" IS DISTINCT FROM t."Bundle";

    OPEN ref FOR SELECT 1 msg, jsonb_array_elements(('[' || cColumn || ']')::jsonb), format('INSERT INTO bundle_update_log (nBundledetailid, column_name, old_value, new_value)
                        SELECT b."nBundledetailid", %L, b.%I::text, f.%I::text
                        FROM "BundleDetail" b
                        JOIN bundleimpfile f ON b."nBundledetailid" = f."ID"::uuid
                        WHERE b.%I IS DISTINCT FROM f.%I',
                       columnMappingRecord->>0, columnMappingRecord->>1, columnMappingRecord->>0,
                       columnMappingRecord->>1, columnMappingRecord->>0);

    RETURN ref;
END;
$function$;
