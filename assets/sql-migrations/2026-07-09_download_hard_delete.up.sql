-- 2026-07-09  Hard-delete case packages + dedupe stops matching expired jobs.
--
-- Bug (Outputs page, live): download a folder package → Ready → delete it →
-- re-request the SAME folder selection → "Bundle already downloaded" popup, and
-- the FE has to "Redownload fresh". Delete looked like it worked (the row left
-- the user's list) but a fresh download still deduped onto a surviving build.
--
-- Root cause: the three download SPs disagreed on scope.
--   * et_delete            — per-user SOFT: stamped only the caller's
--                            download."Users".dDelDt, and only tore the shared
--                            ProcessMaster down when the caller was the LAST
--                            holder.
--   * et_get_download_jobs — per-user: filters Users.dDelDt IS NULL, so the
--                            deleted row vanished from the caller's list.
--   * et_insert_download_process (dedupe) — NOT user-scoped: matched on
--                            nCaseid+nSectionid+isHyperlink+file-set only.
-- So a build any second holder still referenced (or one whose last-holder
-- teardown never ran) survived the caller's delete, and the unscoped dedupe kept
-- returning it → the popup.
--
-- Fix (case packages are PRIVATE / single-holder for this deployment — confirmed
-- 2026-07-09):
--   1) et_delete → a true HARD delete: physically remove every per-job row
--      (ProcessBatchs, ProcessStatusLogs, Users, ProcessMaster). The S3 <nDPid>/
--      tar is already cleared unconditionally by deleteJob's deleteTarQueue
--      (downloadapi.service.ts). With no surviving ProcessMaster, the dedupe can
--      no longer match → a fresh request rebuilds, no popup. DB reference + S3
--      object both gone, per the requirement.
--   2) et_insert_download_process dedupe → also exclude cStatus 'X' (expired).
--      et_expire_downloads flips aged jobs to 'X' WITHOUT clearing their batches
--      or setting dDelDt, so an expired package whose tar the lifecycle already
--      removed would otherwise still satisfy the dedupe and return a dead job.
--
-- ⚠️ SHARING CAVEAT: the hard delete removes the build for ANY holder. That is
-- safe only while packages stay single-holder. If package sharing is ever
-- enabled (two members download the same selection → one reused build), DO NOT
-- keep this hard delete — revert et_delete to the per-user soft version (see the
-- .down migration) and instead make the dedupe holder-aware by adding, inside
-- the "IF NOT bForceNew" block:
--     JOIN download."Users" u
--       ON u."nDPid" = pm."nDPid"
--      AND u."nUserid" = nMasterid
--      AND u."dDelDt" IS NULL
-- so a user who deleted their holder row rebuilds fresh while other holders keep
-- the shared build.

-- 1) -------------------------------------------------------------------------
--    et_delete — hard delete the whole job (private-package model).
CREATE OR REPLACE FUNCTION download.et_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nDPid uuid; nMasterid uuid; cUrl text; isNeedToClear boolean;
BEGIN
    nDPid     := parameter ->> 'nDPid';
    nMasterid := parameter ->> 'nMasterid';   -- injected by JwtMiddleware on every POST

    isNeedToClear := false;

    -- Only a holder of the package may delete it. The list SP is per-user
    -- scoped, so the FE only ever offers Delete on jobs the caller holds; this
    -- guard just stops a crafted request from nuking a job the caller never
    -- held. (dDelDt is intentionally NOT checked, so a holder whose row was
    -- soft-deleted by the OLD behavior can still hard-clear a lingering master.)
    IF EXISTS (
        SELECT 1 FROM download."Users"
        WHERE "nDPid" = nDPid AND "nUserid" = nMasterid
    ) THEN
        -- keep the URL in the response for parity with the old contract
        SELECT "cUrl" INTO cUrl FROM download."ProcessMaster" WHERE "nDPid" = nDPid;

        -- children first, then the master (safe under any FK mode)
        DELETE FROM download."ProcessBatchs"     WHERE "nDPid" = nDPid;
        DELETE FROM download."ProcessStatusLogs" WHERE "nDPid" = nDPid;
        DELETE FROM download."Users"             WHERE "nDPid" = nDPid;
        DELETE FROM download."ProcessMaster"     WHERE "nDPid" = nDPid;

        isNeedToClear := true;   -- deleteJob clears the <nDPid>/ S3 folder regardless
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, cUrl AS "cUrl", 'Deleted!' AS value, isNeedToClear AS "isNeedToClear";

    RETURN ref;
END;
$function$
;

-- 2) -------------------------------------------------------------------------
--    et_insert_download_process — identical to 2026-07-08_download_force_new,
--    except the dedupe now also excludes cStatus 'X' (expired) so a
--    lifecycle-removed tar is never returned as an existing job.
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
        WHERE pm."cStatus" NOT IN ('E','F','X')   -- 'X' (expired) added 2026-07-09
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
