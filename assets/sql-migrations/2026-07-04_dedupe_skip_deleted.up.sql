-- 2026-07-04  Fix "Already Downloaded" dedupe in et_insert_download_process:
-- 1) skip DELETED packages (pm."dDelDt" IS NULL) — a user who deleted an output
--    could never regenerate: the dedupe kept resurrecting the stale package.
-- 2) match the job KIND: the isHyperlink comparison was hardcoded "= false",
--    so a hyperlink request could dedupe against (and return) a PLAIN package.
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

    -- ✅ FIXED BOOLEAN PARSING
    isHyperlink := COALESCE(NULLIF(parameter ->> 'isHyperlink','')::boolean, false);
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
    -- FIND EXISTING PROCESS
    --------------------------------------------------
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
    ELSE
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
    -- RESPONSE
    --------------------------------------------------
    IF isExistingJob
       AND (SELECT "nCreateId"
            FROM download."ProcessMaster"
            WHERE "nDPid" = nDPid) = nMasterid THEN

        OPEN ref FOR
        SELECT -1 AS msg,
               CASE WHEN "cStatus" = 'C'
                    THEN 'Already Downloaded.'
                    ELSE 'Download Already Inprocess'
               END AS value,
               nDPid AS "nDPid",
               isExistingJob AS "isExistingJob"
        FROM download."ProcessMaster"
        WHERE "nDPid" = nDPid;

    ELSE
        INSERT INTO download."Users"
            ("nDPid","nUserid","dCreateDt")
        VALUES
            (nDPid,nMasterid,NOW());

        IF isExistingJob THEN
            OPEN ref FOR
            SELECT 1 AS msg,
                   CASE WHEN "cStatus" = 'C'
                        THEN 'Already Downloaded.'
                        ELSE 'Download Already Inprocess'
                   END AS value,
                   nDPid AS "nDPid",
                   isExistingJob AS "isExistingJob"
            FROM download."ProcessMaster"
            WHERE "nDPid" = nDPid;
        ELSE
            OPEN ref FOR
            SELECT 1 AS msg,
                   'Download Process Started' AS value,
                   nDPid AS "nDPid",
                   isExistingJob AS "isExistingJob";
        END IF;
    END IF;

    RETURN ref;
END;
$function$

;
