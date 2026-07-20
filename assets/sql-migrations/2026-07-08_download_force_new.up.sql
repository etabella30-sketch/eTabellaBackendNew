-- 2026-07-08  "Redownload fresh" force-new + creator no-500.
--
-- Two problems in et_insert_download_process the Outputs "Redownload fresh"
-- button tripped over:
--
-- 1) No way to force a brand-new build. "Redownload fresh" soft-deletes the
--    caller's download."Users" holder row (et_delete is per-user), but the
--    shared ProcessMaster survives whenever another holder remains — so the
--    immediate rebuild re-matched the dedupe and the FE aborted with
--    "the previous one is still registered". New param bForceNew skips the
--    dedupe lookup entirely, so the caller always gets a fresh package.
--
-- 2) Creator re-request returned msg = -1, which downloadapi.service.ts throws
--    as a 500 (generic error, no modal). Existing packages now always return
--    msg = 1 with isExistingJob = true, for creator and non-creator alike, so
--    the FE shows the "already downloaded" prompt instead of erroring. Holder
--    registration is unified + made idempotent (was: unconditional INSERT on
--    the non-creator path only, which could dup rows on repeat requests).
CREATE OR REPLACE FUNCTION download.et_insert_download_process(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$DECLARE
    nMasterid uuid;
    nCaseid uuid;
    nSectionid uuid;

    jFolder jsonb;
    jFiles jsonb;

    nDPid uuid;
    isExistingJob boolean DEFAULT false;

    batch_ids uuid[];
    isHyperlink boolean;
    bForceNew boolean;
    jIncludeVal jsonb;
BEGIN

    --------------------------------------------------
    -- READ PARAMETERS
    --------------------------------------------------
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid   := NULLIF(parameter ->> 'nCaseid','')::uuid;
    nSectionid:= NULLIF(parameter ->> 'nSectionid','')::uuid;

    jFolder := COALESCE((parameter ->> 'jFolders')::jsonb, '[]'::jsonb);
    jFiles  := COALESCE((parameter ->> 'jFiles')::jsonb,  '[]'::jsonb);

    isHyperlink := COALESCE(NULLIF(parameter ->> 'isHyperlink','')::boolean, false);
    -- bForceNew: "Redownload fresh" — skip the dedupe and always build anew.
    bForceNew   := COALESCE(NULLIF(parameter ->> 'bForceNew','')::boolean, false);
    jIncludeVal := NULLIF(parameter ->> 'jInclude','')::jsonb;

    --------------------------------------------------
    -- BUILD BUNDLE TREE
    --------------------------------------------------
    WITH RECURSIVE bdl_tree AS (
        SELECT bm."nBundleid", bm."cBundlename", bm."nParentBundleid"
        FROM "BundleMaster" bm
        JOIN "SectionMaster" sm
          ON sm."nSectionid" = bm."nSectionid"
        LEFT JOIN "BMPermission" bp
          ON bp."nBundleid" = bm."nBundleid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid
          AND sm."nCaseid" = nCaseid
          AND bm."nSectionid" = nSectionid
          AND (
                (jsonb_array_length(jFolder) = 0
                 AND jsonb_array_length(jFiles) = 0
                 AND bm."nParentBundleid" IS NULL)
             OR (jsonb_array_length(jFolder) > 0
                 AND jFolder @> to_jsonb(bm."nBundleid"))
          )

        UNION ALL

        SELECT c."nBundleid", c."cBundlename", c."nParentBundleid"
        FROM "BundleMaster" c
        JOIN bdl_tree p
          ON c."nParentBundleid" = p."nBundleid"
        LEFT JOIN "BMPermission" bp
          ON bp."nBundleid" = c."nBundleid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid
    ),

    --------------------------------------------------
    -- FINAL FILE SET
    --------------------------------------------------
    final_data AS (
        SELECT bd."nBundledetailid"
        FROM "BundleDetail" bd
        JOIN bdl_tree t ON t."nBundleid" = bd."nBundleid"
        LEFT JOIN "BDPermission" bp
          ON bp."nBundledetailid" = bd."nBundledetailid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid

        UNION

        SELECT bd."nBundledetailid"
        FROM "BundleDetail" bd
        JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid"
        JOIN bdl_tree p ON ba."nBundleid" = p."nBundleid"
        LEFT JOIN "BDPermission" bp
          ON bp."nBundledetailid" = bd."nBundledetailid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid

        UNION

        SELECT bd."nBundledetailid"
        FROM "BundleDetail" bd
        LEFT JOIN "BDPermission" bp
          ON bp."nBundledetailid" = bd."nBundledetailid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid
          AND bd."nSectionid" = nSectionid
          AND (
                (jsonb_array_length(jFolder) = 0
                 AND jsonb_array_length(jFiles) = 0
                 AND bd."nBundleid" IS NULL)
             OR (jsonb_array_length(jFiles) > 0
                 AND jFiles @> to_jsonb(bd."nBundledetailid"))
          )
    )

    SELECT array_agg("nBundledetailid" ORDER BY "nBundledetailid")
    INTO batch_ids
    FROM final_data;

    --------------------------------------------------
    -- FIND EXISTING PROCESS  (skipped when bForceNew)
    --------------------------------------------------
    IF NOT bForceNew THEN
        SELECT pb."nDPid"
        INTO nDPid
        FROM download."ProcessBatchs" pb
        JOIN download."ProcessMaster" pm
          ON pm."nDPid" = pb."nDPid"
        WHERE pm."cStatus" NOT IN ('E','F')
          AND pm."dDelDt" IS NULL          -- deleted packages must NOT satisfy the dedupe
          AND pm."nCaseid" = nCaseid
          AND pm."nSectionid" = nSectionid
          AND COALESCE(pm."isHyperlink",false) = COALESCE(isHyperlink,false)
        GROUP BY pb."nDPid"
        HAVING COUNT(DISTINCT pb."nBundledetailid") = cardinality(batch_ids)
           AND bool_and(pb."nBundledetailid" = ANY(batch_ids))
        LIMIT 1;

        IF FOUND THEN
            isExistingJob := true;
        END IF;
    END IF;

    IF NOT isExistingJob THEN
        INSERT INTO download."ProcessMaster"
            ("nCaseid","nSectionid","nCreateId","jFiles","jFolders","isHyperlink","jInclude")
        VALUES
            (nCaseid,nSectionid,nMasterid,jFiles,jFolder,isHyperlink,jIncludeVal)
        RETURNING "nDPid" INTO nDPid;

        INSERT INTO download."ProcessStatusLogs"
            ("nDPid","cStatus","dLogDt")
        VALUES
            (nDPid,'Q',NOW());
    END IF;

    --------------------------------------------------
    -- REGISTER HOLDER (idempotent) + RESPONSE
    --------------------------------------------------
    -- Ensure the caller holds this package so it shows in their list. Creator
    -- of an existing job already holds it, so this is a no-op for them.
    IF NOT EXISTS (
        SELECT 1 FROM download."Users"
        WHERE "nDPid" = nDPid AND "nUserid" = nMasterid AND "dDelDt" IS NULL
    ) THEN
        INSERT INTO download."Users" ("nDPid","nUserid","dCreateDt")
        VALUES (nDPid,nMasterid,NOW());
    END IF;

    IF isExistingJob THEN
        -- Existing package (creator or non-creator): report it so the FE can
        -- offer "Redownload fresh". msg is 1 (was -1 for the creator, which the
        -- service threw as a 500).
        OPEN ref FOR
        SELECT 1 AS msg,
               CASE WHEN "cStatus" = 'C'
                    THEN 'Already Downloaded.'
                    ELSE 'Download Already Inprocess'
               END AS value,
               nDPid AS "nDPid",
               true AS "isExistingJob"
        FROM download."ProcessMaster"
        WHERE "nDPid" = nDPid;
    ELSE
        OPEN ref FOR
        SELECT 1 AS msg,
               'Download Process Started' AS value,
               nDPid AS "nDPid",
               false AS "isExistingJob";
    END IF;

    RETURN ref;
END;
$function$
;
