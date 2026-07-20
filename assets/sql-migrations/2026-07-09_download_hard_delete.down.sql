-- Revert 2026-07-09_download_hard_delete:
--   * et_delete → back to the per-user SOFT delete + last-holder teardown.
--   * et_insert_download_process → back to the 2026-07-08 body (dedupe excludes
--     'E','F' only; no 'X').

-- 1) -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION download.et_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail"
declare nDPid uuid;nMasterid uuid;cUrl text;isNeedToClear boolean;

BEGIN
nDPid:= parameter ->>'nDPid';
nMasterid := parameter ->>'nMasterid';

-- select * from download.et_delete ('{"nDPid":1}','r1');fetch all in "r1";
-- select * from download."ProcessMaster" where "cStatus" = 'C' order by "dCreateDt" desc


		update download."Users" set "dDelDt" = now() where "nDPid" = nDPid and "nUserid" = nMasterid;

		if not exists(select * from download."Users" where "nDPid" = nDPid and "dDelDt" is null )then
			delete from download."ProcessBatchs" where "nDPid" = nDPid;

			update download."ProcessMaster" set "dDelDt" = now() where "nDPid" = nDPid
			returning "cUrl" into cUrl;

			isNeedToClear = true;

		end if;


		OPEN ref FOR
			select 1 as msg,cUrl as "cUrl",'Deleted!' as value,isNeedToClear as  "isNeedToClear";

   return ref ;-- Return the cursor to the caller
    END;
$function$
;

-- 2) -------------------------------------------------------------------------
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
    IF NOT EXISTS (
        SELECT 1 FROM download."Users"
        WHERE "nDPid" = nDPid AND "nUserid" = nMasterid AND "dDelDt" IS NULL
    ) THEN
        INSERT INTO download."Users" ("nDPid","nUserid","dCreateDt")
        VALUES (nDPid,nMasterid,NOW());
    END IF;

    IF isExistingJob THEN
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
