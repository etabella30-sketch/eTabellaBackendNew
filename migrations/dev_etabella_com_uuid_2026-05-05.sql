-- =============================================================================
-- Consolidated migration: etabella_tech_uuid → dev_etabella_com_uuid
-- Generated 2026-05-08 from assets/sql-migrations/ (17 source files).
-- Updated  2026-05-09 — appended block 13 (case_transcript_mode)
--                       and block 14 (upload_publish_cstatus +
--                       realtime.et_realtime_sessiondata isTrans fix).
--
-- Source files included (chronological, in apply order):
--   1.  2026-04-15  ctransferstatus_column                   schema (ALTER TABLE)
--   2.  2026-04-17  sweep_false_positive_transfers           data fix (global)
--   3.  2026-04-20  et_marks_left_join_issue                 SP (final et_marks)
--   4.  2026-04-21  export_issue_filter                      SP
--   5.  2026-04-29  admin_update_bundledetail_dintrestdt     SP
--   6.  2026-04-29  batchfile_update_blogid_guard            SP
--   7.  2026-04-29  qfact_user_pref                          table + SP
--                   • schema-qualified to public.* (was unqualified —
--                     broke on roles whose search_path begins with `sym`)
--                   • idempotent sym→public relocation block included
--   8.  2026-04-29  qfact_user_claim_pref                    table + SP
--                   • schema-qualified to public.* (same reason as 07)
--                   • idempotent sym→public relocation block included
--   9.  2026-04-30  unassigned_issue_seed                    SP + backfill
--                   • + colour normalization: forces every system Unassigned
--                     issue to cColor='FFFF00' (yellow) so highlights are
--                     consistent. Updates legacy 'e9e90e'/'FFA94D' rows.
--  10.  2026-04-30  unassigned_visibility_sp_patch           SP (issuelist_group)
--  11.  2026-05-05  notification_list_bundle_enrichment      SP
--  12.  2026-05-08  marknav_team_user_admin_visibility       SP (et_marknav_team_user)
--  13.  2026-05-09  case_transcript_mode                     schema (ALTER TABLE)
--                                                            + SP (et_admin_insertupdate_case)
--                                                            + SP (et_admin_case_getdetail)
--                   • adds CaseMaster."cTranscriptMode" — drives whether the
--                     file-explorer Transcript folder shows the new HTML
--                     session list or the legacy PDF file list. Existing rows
--                     backfilled to 'PDF' on first apply (column DEFAULT
--                     during ADD); column default then flipped to 'HTML' so
--                     future cases get the new behaviour.
--  14.  2026-05-09  upload_publish_cstatus                   SP (et_realtime_transcript_upload_status)
--                                                            + SP (realtime.et_realtime_sessiondata)
--                                                            + data backfill
--                   • Upload-publish SP previously set isUploaded+isTranscript
--                     on cFlag='P' but forgot cStatus='P', leaving every
--                     upload-published transcript half-published. Frontend
--                     gates on cStatus='P' for cover-page render / "Published"
--                     badge / isTrans resolution, so affected sessions
--                     rendered as "Draft" with no cover.
--                   • realtime.et_realtime_sessiondata declared
--                     `isTrans boolean default false` and selected it back
--                     unchanged at the bottom — every detail returned via
--                     /session/activesession/detail had isTrans=false.
--                     Replaced with a row-data computed expression so the
--                     SP returns the truth.
--                   • Backfills RSessionMaster rows already left in the
--                     half-published state by the upload-publish bug.
--
-- Source files INTENTIONALLY EXCLUDED:
--   ✗ 2026-04-15_et_marks_distinct.sql            superseded
--   ✗ 2026-04-15_et_marks_hide_orphans.sql        superseded
--   ✗ 2026-04-15_et_marks_hide_untransferred.sql  superseded
--   ✗ 2026-04-17_et_marks_revert_fallback.sql     superseded by left_join_issue
--   ✗ 2026-04-17_day1_orphan_cleanup.sql          source-DB-specific data fix
--                                                 (contains unfilled <DAY-1-NSESID>
--                                                  placeholder; the rows it
--                                                  targets do not exist in the
--                                                  target DB).
--
-- Idempotency: every block uses CREATE OR REPLACE, ADD COLUMN IF NOT EXISTS,
-- CREATE TABLE IF NOT EXISTS, or guarded UPDATE WHERE clauses. Re-running this
-- file after a partial failure is safe.
--
-- Transaction model: wrapped in a single BEGIN / COMMIT so any failure rolls
-- back the whole batch. The internal BEGIN/COMMIT that
-- 2026-04-17_sweep_false_positive_transfers.sql normally carries has been
-- stripped because nested transactions are not supported in plain psql.
--
-- Apply with:
--   PGPASSWORD='AVNS_VqdeFp4-sE6s4BCPhoU' psql \
--     -h public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com \
--     -p 16751 -U vultradmin -d 'dev.etabella.com.uuid' \
--     --set ON_ERROR_STOP=on \
--     -f migrations/dev_etabella_com_uuid_2026-05-05.sql 2>&1 \
--     | tee migrations/apply_log_$(date +%Y%m%d_%H%M%S).log
--
-- Note on DB name: the actual database is `dev.etabella.com.uuid` (with
-- dots, mirroring `etabella.com` and `etabella.legal` in production).
-- The filename uses underscores for filesystem-friendliness only.
--
-- pgAdmin users: line 48 (`\set ON_ERROR_STOP on`) is a psql meta-command
-- and pgAdmin's Query Tool will reject it with `syntax error at or near "\"`.
-- Comment that line out before pasting into pgAdmin — the BEGIN/COMMIT
-- below still gives you all-or-nothing rollback.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;


-- =============================================================================
-- ── 01/14  2026-04-15  ctransferstatus_column ──
-- =============================================================================
-- Adds cTransferStatus on annotation tables. Used by the orphan-aware et_marks
-- (block 03) and the run3.py annot-transfer pipeline.
--   NULL  — transfer hasn't run for this row
--   'T'   — transferred successfully
--   'O'   — orphan (source content removed during publish)
-- Additive: no data touched, default NULL preserves existing semantics.

ALTER TABLE "RHighlights"
  ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);

ALTER TABLE "RIssueDetail"
  ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);

ALTER TABLE "FactDetail"
  ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);

ALTER TABLE "DocDetail"
  ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);

COMMENT ON COLUMN "RHighlights"."cTransferStatus" IS
  'Annotation transfer state: NULL=not run, T=transferred, O=orphan (source content removed during publish)';
COMMENT ON COLUMN "RIssueDetail"."cTransferStatus" IS
  'Annotation transfer state: NULL=not run, T=transferred, O=orphan (source content removed during publish)';
COMMENT ON COLUMN "FactDetail"."cTransferStatus" IS
  'Annotation transfer state: NULL=not run, T=transferred, O=orphan (source content removed during publish)';
COMMENT ON COLUMN "DocDetail"."cTransferStatus" IS
  'Annotation transfer state: NULL=not run, T=transferred, O=orphan (source content removed during publish)';


-- =============================================================================
-- ── 02/14  2026-04-17  sweep_false_positive_transfers ──
-- =============================================================================
-- Global data sweep: any annotation row whose draft and transferred timestamps
-- diverge by more than 60s was a false-positive fuzzy match — re-classify as
-- orphan and clear the bad transferred coords. Also repairs orphan rows whose
-- transferred coords were never NULL'd. Safe to re-run (no-op once clean).
-- (Inner BEGIN/COMMIT removed; this script wraps the whole batch in one txn.)

UPDATE "RHighlights"
   SET "cTPageno"        = NULL,
       "cTLineno"        = NULL,
       "cTTime"          = NULL,
       "tidentity"       = NULL,
       "cTransferStatus" = 'O'
 WHERE "cTTime" IS NOT NULL
   AND "cTime"  IS NOT NULL
   AND "cTTime" ~ '^\d{1,2}:\d{2}:\d{2}'
   AND "cTime"  ~ '^\d{1,2}:\d{2}:\d{2}'
   AND ABS(
         EXTRACT(EPOCH FROM
           SUBSTRING("cTTime" FROM '^\d{1,2}:\d{2}:\d{2}')::time
           - SUBSTRING("cTime" FROM '^\d{1,2}:\d{2}:\d{2}')::time
         )
       ) > 60;

UPDATE "RHighlights"
   SET "cTPageno"  = NULL,
       "cTLineno"  = NULL,
       "cTTime"    = NULL,
       "tidentity" = NULL
 WHERE "cTransferStatus" = 'O'
   AND ("cTPageno"  IS NOT NULL
     OR "cTLineno"  IS NOT NULL
     OR "cTTime"    IS NOT NULL
     OR "tidentity" IS NOT NULL);

UPDATE "FactDetail"
   SET "jTCordinates"    = NULL,
       "nTPage"          = NULL,
       "cTransferStatus" = 'O'
 WHERE "jCordinates"  IS NOT NULL
   AND "jTCordinates" IS NOT NULL
   AND ("jTCordinates"::jsonb -> 0 ->> 't') ~ '^\d{1,2}:\d{2}:\d{2}'
   AND ("jCordinates"::jsonb  -> 0 ->> 't') ~ '^\d{1,2}:\d{2}:\d{2}'
   AND ABS(
         EXTRACT(EPOCH FROM
           SUBSTRING(("jTCordinates"::jsonb -> 0 ->> 't') FROM '^\d{1,2}:\d{2}:\d{2}')::time
           - SUBSTRING(("jCordinates"::jsonb  -> 0 ->> 't') FROM '^\d{1,2}:\d{2}:\d{2}')::time
         )
       ) > 60;

UPDATE "FactDetail"
   SET "jTCordinates" = NULL,
       "nTPage"       = NULL
 WHERE "cTransferStatus" = 'O'
   AND ("jTCordinates" IS NOT NULL OR "nTPage" IS NOT NULL);

UPDATE "DocDetail"
   SET "jTCordinates"    = NULL,
       "nTPage"          = NULL,
       "cTransferStatus" = 'O'
 WHERE "jCordinates"  IS NOT NULL
   AND "jTCordinates" IS NOT NULL
   AND ("jTCordinates"::jsonb -> 0 ->> 't') ~ '^\d{1,2}:\d{2}:\d{2}'
   AND ("jCordinates"::jsonb  -> 0 ->> 't') ~ '^\d{1,2}:\d{2}:\d{2}'
   AND ABS(
         EXTRACT(EPOCH FROM
           SUBSTRING(("jTCordinates"::jsonb -> 0 ->> 't') FROM '^\d{1,2}:\d{2}:\d{2}')::time
           - SUBSTRING(("jCordinates"::jsonb  -> 0 ->> 't') FROM '^\d{1,2}:\d{2}:\d{2}')::time
         )
       ) > 60;

UPDATE "DocDetail"
   SET "jTCordinates" = NULL,
       "nTPage"       = NULL
 WHERE "cTransferStatus" = 'O'
   AND ("jTCordinates" IS NOT NULL OR "nTPage" IS NOT NULL);


-- =============================================================================
-- ── 03/14  2026-04-20  et_marks_left_join_issue ──
-- =============================================================================
-- Final et_marks definition (supersedes the four intermediate 04-15/04-17
-- rewrites). Adds DISTINCT to de-dupe the unbound TeamRelation join, hides
-- orphans + untransferred rows on the published view, and LEFT JOINs
-- RIssueMaster so facts without a linked issue still surface.

CREATE OR REPLACE FUNCTION realtime.et_marks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;jFactids jsonb;

        isAdmin boolean default false;
        nRoleid uuid;nTeamid uuid;bTranscript boolean;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
jFactids := parameter ->>'jFactids';
bTranscript := parameter ->>'bTranscript';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;

 if(nCaseid is null) then
        select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSessionid;
 end if;


select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;

if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
        isAdmin := true;
end if;


    OPEN ref1 FOR
                select DISTINCT f."nFSid" as "id",f."cFType" as "cType",
                 CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates",
                d."nColorid",i."cColor" as "color"
                from "FactMaster" f
                join "FactDetail" d on d."nFSid" = f."nFSid"
                left join "RIssueMaster" i on i."nIid" = d."nColorid"
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
                where f."nSesid" = nSessionid
                  and ((f."nUserid" = nUserid or s."nUserid" = nUserid) or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end))
                  and (
                    COALESCE(bTranscript, false) = false
                    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
                  );

    RETURN NEXT ref1;

    OPEN ref2 FOR

          select DISTINCT h."nHid",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cPageno"  ELSE h."cTPageno" END AS "cPageno",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."cLineno"  ELSE h."cTLineno"  END AS "cLineno",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cTime"  ELSE h."cTTime"END AS "cTime",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."identity" ELSE h."tidentity" END AS "identity"
                  FROM "RHighlights" h
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                WHERE h."nSessionId" = nSessionid
                  AND (h."nUserid"  = nUserid or (case when isAdmin = true then  h."nUserid" = tr."nUserid" else false end))
                  AND (
                    COALESCE(bTranscript, false) = false
                    OR (h."cTransferStatus" IS DISTINCT FROM 'O' AND h."cTPageno" IS NOT NULL)
                  );

        RETURN NEXT ref2;

    OPEN ref3 FOR

        select DISTINCT m."nDocid" as "id",'D' as "cType" ,
        CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates"
        from "DocMaster" m
        join "DocDetail" d on d."nDocid" = m."nDocid"
        left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
        where m."nSesid" = nSessionid
          and (m."nUserid" = nUserid or s."nUserid" = nUserid or (case when isAdmin = true then  m."nUserid" = tr."nUserid" else false end))
          and (
            COALESCE(bTranscript, false) = false
            OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
          )
          and (
            COALESCE(bTranscript, false) = true
            OR d."jCordinates" IS NOT NULL
          );

        RETURN NEXT ref3;

END;
$function$;


-- =============================================================================
-- ── 04/14  2026-04-21  export_issue_filter ──
-- =============================================================================
-- et_realtime_get_issue_annotation_highlight_export now actually applies
-- jIssues / jHIssues filters from the export Advanced Setup. Empty array =
-- no filter (preserves existing callers).

CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_annotation_highlight_export(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSessionid UUID;
    nCaseid UUID;
    nUserid UUID;
    cTranscript text;
    jIssues jsonb;
    jHIssues jsonb;
    jPages jsonb;
    bQfact boolean;
    bQmark boolean;

BEGIN

    nSessionid := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    cTranscript := (parameter ->>'cTranscript')::text;
    jIssues := coalesce((parameter ->>'jIssues')::jsonb,'[]'::jsonb);
    jHIssues := coalesce((parameter ->>'jHIssues')::jsonb,'[]'::jsonb);
    jPages := coalesce((parameter ->>'jPages')::jsonb,'[]'::jsonb);

    bQfact := NULLIF(parameter ->> 'bQfact','')::boolean;
    bQmark := NULLIF(parameter ->> 'bQmark','')::boolean;


    /* ====================== FULL FACTS ====================== */

    OPEN ref1 FOR

    WITH tbl AS (
        SELECT
            f."nFSid" AS "nIDid",
            NULL::int AS "pageIndex",
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN d."jCordinates"
                ELSE d."jTCordinates"
            END AS "cordinates",
            i."cColor" AS "color",
            1 AS "nICount",
            NULL::text AS "cONote"
        FROM "FactMaster" f
        JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
        JOIN "RIssueMaster" i ON i."nIid" = d."nColorid"
        WHERE f."nSesid" = nSessionid
          AND (bQfact IS NULL OR bQfact = true)
          AND (
              jsonb_array_length(jIssues) = 0
              OR i."nIid"::text IN (SELECT jsonb_array_elements_text(jIssues))
          )
    )

    SELECT t.*
    FROM tbl t;

    RETURN NEXT ref1;



    /* ====================== QUICK MARKS ====================== */

    OPEN ref2 FOR

    WITH tbl AS (

        /* CASE 1 — JSON based highlights */
        SELECT
            h."nHid",
            h."nLID",
            t."t" AS "cTime",
            t."text" AS "cNote",
            t."otext" AS "cFNote",
            t."identity",
            t."refreshCount",
            h."nLID"::text AS "issueids"
        FROM "RHighlights" h,
        jsonb_to_recordset(
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN h."jCordinates"
                ELSE h."jTCordinates"
            END
        ) AS t(
            "t" text,
            "text" text,
            "otext" text,
            "identity" text,
            "refreshCount" int,
            "isMain" boolean
        )
        WHERE h."nUserid" = nUserid
          AND h."nSessionId" = nSessionid
          AND h."jCordinates" IS NOT NULL
          AND (
              jsonb_array_length(jHIssues) = 0
              OR h."nLID"::text IN (SELECT jsonb_array_elements_text(jHIssues))
          )


        UNION ALL


        /* CASE 2 — Column based highlights */
        SELECT
            h."nHid",
            h."nLID",
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN h."cTime"
                ELSE h."cTTime"
            END AS "cTime",
            h."cNote",
            h."cNote" AS "cFNote",
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN h."identity"
                ELSE h."tidentity"
            END AS "identity",
            0 AS "refreshCount",
            h."nLID"::text AS "issueids"
        FROM "RHighlights" h
        WHERE h."nUserid" = nUserid
          AND h."nSessionId" = nSessionid
          AND h."jCordinates" IS NULL
          AND (
              jsonb_array_length(jHIssues) = 0
              OR h."nLID"::text IN (SELECT jsonb_array_elements_text(jHIssues))
          )
    )

    SELECT t.*, m."cColor"
    FROM tbl t
    JOIN "RIssueMaster" m ON m."nIid" = t."nLID";

    RETURN NEXT ref2;

END;
$function$;


-- =============================================================================
-- ── 05/14  2026-04-29  admin_update_bundledetail_dintrestdt_text ──
-- =============================================================================
-- et_admin_update_bundledetail stops round-tripping dIntrestDt through `date`
-- (column is varchar). Free-form strings like "27 June 1888" or "Undated"
-- are stored verbatim instead of being silently NULL'd.

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
    cIntrestDt text;
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


-- =============================================================================
-- ── 06/14  2026-04-29  batchfile_update_blogid_guard ──
-- =============================================================================
-- et_batchfile_update bootstraps a Batchlog row when none exists for
-- (nCaseid, nSectionid, nCreateId). Without this, batch upload without a prior
-- template-download crashes on ''::uuid in the dynamic INSERT.

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

    UPDATE bundleimpfile SET "ID" = NULL WHERE COALESCE("ID", '') = '';
    UPDATE bundleimpfile SET "Date" = NULL WHERE COALESCE("Date", '') = '';

    ALTER TABLE bundleimpfile ADD COLUMN "nBundleid" uuid;

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


-- =============================================================================
-- ── 07/14  2026-04-29  qfact_user_pref ──
-- =============================================================================
-- Per-user QFact preferences — table + upsert SP. Drives the LEFT QFact
-- panel's per-user issue visibility + ordering. Must NOT touch
-- RIssueMaster.nSequence (shared Fact-side ordering).
--
-- IMPORTANT: every CREATE / INSERT / ALTER below is schema-qualified with
-- `public.`. The original revision of this block was unqualified, which
-- broke on dev.etabella.com.uuid because the connecting role's search_path
-- is `sym, public` (SymmetricDS replication is configured first), so the
-- tables silently landed in `sym` instead of `public`. The consumer SP
-- `et_realtime_issuelist_group` (block 10) references them as
-- `public."RUserQFactClaimPref"` and errored at runtime with
-- `relation "public.RUserQFactClaimPref" does not exist` — every call to
-- /realtimeapi/issue/issuelist_V2 failed and the UI showed no claims at
-- all, including the Unassigned seed from block 09.

CREATE TABLE IF NOT EXISTS public."RUserQFactPref" (
    "nUserid"        UUID        NOT NULL,
    "nIid"           UUID        NOT NULL,
    "nQFactSequence" INTEGER     NOT NULL,
    "bVisible"       BOOLEAN     NOT NULL DEFAULT TRUE,
    "dCreateDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "dModifyDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "RUserQFactPref_pkey" PRIMARY KEY ("nUserid", "nIid"),
    CONSTRAINT "RUserQFactPref_nIid_fkey"
        FOREIGN KEY ("nIid") REFERENCES public."RIssueMaster" ("nIid") ON DELETE CASCADE
);

-- Idempotent remediation: relocate the table from `sym` to `public` if a
-- prior unqualified migration run misplaced it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'sym'
           AND c.relname = 'RUserQFactPref'
    ) THEN
        EXECUTE 'ALTER TABLE sym."RUserQFactPref" SET SCHEMA public';
        RAISE NOTICE 'Relocated sym.RUserQFactPref -> public.RUserQFactPref';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ix_RUserQFactPref_user_seq"
    ON public."RUserQFactPref" ("nUserid", "nQFactSequence");

CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_qfact_secquence(
    parameter JSON,
    ref1 REFCURSOR
)
RETURNS SETOF REFCURSOR
LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    jIssues JSONB;
    upserted_count INTEGER;
BEGIN

    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
    jIssues := COALESCE((parameter ->> 'jIssues')::JSONB, '[]'::JSONB);

    IF nUserid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nUserid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    WITH upserted AS (
        INSERT INTO public."RUserQFactPref" (
            "nUserid", "nIid", "nQFactSequence", "bVisible",
            "dCreateDt", "dModifyDt"
        )
        SELECT
            nUserid,
            (item ->> 'nIid')::UUID,
            (item ->> 'nQFactSequence')::INTEGER,
            COALESCE((item ->> 'bVisible')::BOOLEAN, TRUE),
            NOW(),
            NOW()
        FROM JSONB_ARRAY_ELEMENTS(jIssues) AS item
        ON CONFLICT ("nUserid", "nIid")
        DO UPDATE SET
            "nQFactSequence" = EXCLUDED."nQFactSequence",
            "bVisible"       = EXCLUDED."bVisible",
            "dModifyDt"      = NOW()
        RETURNING 1
    )
    SELECT COUNT(*) INTO upserted_count FROM upserted;

    OPEN ref1 FOR SELECT 1 AS "msg", upserted_count AS "count";
    RETURN NEXT ref1;

EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$;


-- =============================================================================
-- ── 08/14  2026-04-29  qfact_user_claim_pref ──
-- =============================================================================
-- Companion to RUserQFactPref — per-user claim ordering for QFact mode.
-- Block 10 (unassigned_visibility_sp_patch) LEFT JOINs both tables into
-- et_realtime_issuelist_group, so this must run before that block.
--
-- Schema-qualified for the same reason as block 07 — see comment there.

CREATE TABLE IF NOT EXISTS public."RUserQFactClaimPref" (
    "nUserid"        UUID        NOT NULL,
    "nICid"          UUID        NOT NULL,
    "nQFactSequence" INTEGER     NOT NULL,
    "dCreateDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "dModifyDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "RUserQFactClaimPref_pkey" PRIMARY KEY ("nUserid", "nICid")
);

-- Idempotent remediation: relocate from `sym` to `public` if a prior
-- unqualified run of this migration put it in `sym`.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'sym'
           AND c.relname = 'RUserQFactClaimPref'
    ) THEN
        EXECUTE 'ALTER TABLE sym."RUserQFactClaimPref" SET SCHEMA public';
        RAISE NOTICE 'Relocated sym.RUserQFactClaimPref -> public.RUserQFactClaimPref';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ix_RUserQFactClaimPref_user_seq"
    ON public."RUserQFactClaimPref" ("nUserid", "nQFactSequence");

CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_qfact_claim_secquence(
    parameter JSON,
    ref1 REFCURSOR
)
RETURNS SETOF REFCURSOR
LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    jClaims JSONB;
    upserted_count INTEGER;
BEGIN

    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
    jClaims := COALESCE((parameter ->> 'jClaims')::JSONB, '[]'::JSONB);

    IF nUserid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nUserid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    WITH upserted AS (
        INSERT INTO public."RUserQFactClaimPref" (
            "nUserid", "nICid", "nQFactSequence", "dCreateDt", "dModifyDt"
        )
        SELECT
            nUserid,
            (item ->> 'nICid')::UUID,
            (item ->> 'nQFactSequence')::INTEGER,
            NOW(),
            NOW()
        FROM JSONB_ARRAY_ELEMENTS(jClaims) AS item
        ON CONFLICT ("nUserid", "nICid")
        DO UPDATE SET
            "nQFactSequence" = EXCLUDED."nQFactSequence",
            "dModifyDt"      = NOW()
        RETURNING 1
    )
    SELECT COUNT(*) INTO upserted_count FROM upserted;

    OPEN ref1 FOR SELECT 1 AS "msg", upserted_count AS "count";
    RETURN NEXT ref1;

EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$;


-- =============================================================================
-- ── 09/14  2026-04-30  unassigned_issue_seed ──
-- =============================================================================
-- Idempotent SP that ensures every case has an Unassigned CLAIM (cICtype='U')
-- and a default Unassigned ISSUE under it (cColor='FFFF00' = yellow, matches
-- pdf.service.ts default highlight). Followed by a one-shot backfill loop
-- over CaseMaster so legacy cases get the seed.

CREATE OR REPLACE FUNCTION public.et_realtime_ensure_unassigned_issue(
    parameter JSON,
    ref1 REFCURSOR
)
RETURNS SETOF REFCURSOR
LANGUAGE plpgsql
AS $function$
DECLARE
    v_nCaseid UUID;
    v_nICid   UUID;
    v_nIid    UUID;
BEGIN
    v_nCaseid := NULLIF(parameter ->> 'nCaseid', '')::UUID;

    IF v_nCaseid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nCaseid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    SELECT "nICid"
      INTO v_nICid
      FROM "IssueCategory"
     WHERE "nCaseid"   = v_nCaseid
       AND "cICtype"   = 'U'
       AND "cCategory" = 'Unassigned'
     LIMIT 1;

    IF v_nICid IS NULL THEN
        INSERT INTO "IssueCategory" (
            "nCaseid", "cCategory", "cICtype", "dCreateDt"
        ) VALUES (
            v_nCaseid, 'Unassigned', 'U', NOW()
        )
        RETURNING "nICid" INTO v_nICid;
    END IF;

    SELECT "nIid"
      INTO v_nIid
      FROM "RIssueMaster"
     WHERE "nICid"  = v_nICid
       AND "cIName" = 'Unassigned'
     LIMIT 1;

    IF v_nIid IS NULL THEN
        INSERT INTO "RIssueMaster" (
            "nICid", "nCaseid", "cIName", "cColor", "dCreatedt"
        ) VALUES (
            v_nICid, v_nCaseid, 'Unassigned', 'FFFF00', NOW()
        )
        RETURNING "nIid" INTO v_nIid;
    END IF;

    OPEN ref1 FOR SELECT 1 AS "msg", v_nICid AS "nICid", v_nIid AS "nIid";
    RETURN NEXT ref1;

EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$;

-- Backfill: seeds Unassigned for every case missing it. Idempotent — re-runs
-- are a no-op once every case is covered.
DO $$
DECLARE
    rec RECORD;
    cnt INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT cm."nCaseid"
          FROM "CaseMaster" cm
         WHERE NOT EXISTS (
               SELECT 1
                 FROM "IssueCategory" c
                 JOIN "RIssueMaster" i ON i."nICid" = c."nICid"
                WHERE c."nCaseid"   = cm."nCaseid"
                  AND c."cICtype"   = 'U'
                  AND c."cCategory" = 'Unassigned'
                  AND i."cIName"    = 'Unassigned'
           )
    LOOP
        cnt := cnt + 1;
        PERFORM public.et_realtime_ensure_unassigned_issue(
            json_build_object('nCaseid', rec."nCaseid")::json,
            ('rb_' || cnt)::refcursor
        );
    END LOOP;
    RAISE NOTICE 'Unassigned-issue backfill: seeded % cases', cnt;
END $$;

-- Color normalization: prior seed flows used inconsistent default colors
-- ('e9e90e', 'FFA94D') for the system Unassigned issue, so highlights tagged
-- with Unassigned showed as different shades depending on which historical
-- code path created the case. Force every system-owned Unassigned issue
-- (cICtype='U' claim, cIName='Unassigned') to the canonical 'FFFF00' yellow
-- so the highlight colour is consistent across cases AND matches
-- pdf.service.ts' defaultColor (#FFFF00). User-created issues that happen
-- to live under an Unassigned claim are NOT touched — only the system seed
-- (the one paired with the Unassigned claim) is normalized.
DO $$
DECLARE
    updated_cnt INTEGER;
BEGIN
    UPDATE "RIssueMaster" i
       SET "cColor" = 'FFFF00'
      FROM "IssueCategory" c
     WHERE i."nICid" = c."nICid"
       AND c."cICtype" = 'U'
       AND c."cCategory" = 'Unassigned'
       AND i."cIName" = 'Unassigned'
       AND i."cColor" IS DISTINCT FROM 'FFFF00';
    GET DIAGNOSTICS updated_cnt = ROW_COUNT;
    RAISE NOTICE 'Unassigned-issue colour normalization: updated % rows -> FFFF00', updated_cnt;
END $$;


-- =============================================================================
-- ── 10/14  2026-04-30  unassigned_visibility_sp_patch ──
-- =============================================================================
-- Patches et_realtime_issuelist_group so system-owned issues (nUserid IS NULL)
-- — i.e. the Unassigned seeds from block 09 — are visible to every user.
-- Changes the team_issues + UserMaster joins from INNER → LEFT with an
-- explicit "OR im.nUserid IS NULL" gate. Also LEFT JOINs the two QFact-pref
-- tables from blocks 07 + 08 so the response carries nQFactSequence /
-- bQFactVisible per row.

CREATE OR REPLACE FUNCTION public.et_realtime_issuelist_group(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;nTeamid uuid;
isAdmin boolean default false;nRoleid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;
nTeamid := NULLIF(parameter ->>'nTeamid','')::uuid;

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
raise notice 'nRoleid %',nRoleid;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
    isAdmin := true;
end if;

open ref1 for
select ic."nICid","cCategory",
case when (ic."nUserid" = nUserid or isAdmin) then true else false end "edit",
case when ((ic."nUserid" = nUserid or isAdmin) and count(fi."nIssueid") = 0) then true else false end "delete",
qcp."nQFactSequence" AS "nQFactSequence"
From "RIssueMaster" im
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RClaimSequence" rs on rs."nICid" = im."nICid" and rs."nUserid" = nUserid
left join public."RUserQFactClaimPref" qcp on qcp."nICid" = ic."nICid" and qcp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by "nSequence",ic."nICid","cCategory",qcp."nQFactSequence"
order by "nSequence","cCategory";

open ref2 for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory"
,0 "nRelid",0 "nImpactid",im."nUserid",count(fi."nIssueid") "isFact",
case when (im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null then true else false end "edit",
case when ((im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null) then true else false end "delete",
um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",rs."nSequence",
qp."nQFactSequence" AS "nQFactSequence",
qp."bVisible"       AS "bQFactVisible"
From "RIssueMaster" im
LEFT JOIN "UserMaster" um ON um."nUserid" = im."nUserid"
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RIssueSequence" rs on rs."nIid" = im."nIid" and rs."nUserid" = nUserid
left join public."RUserQFactPref" qp on qp."nIid" = im."nIid" and qp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by rs."nSequence",im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", im."nUserid", fi."nIssueid" ,um."cFname",um."cLname",qp."nQFactSequence",qp."bVisible"
order by "nSequence","cIName";

 RETURN next ref1;
 RETURN next ref2;
END;
$function$;


-- =============================================================================
-- ── 11/14  2026-05-05  notification_list_bundle_enrichment ──
-- =============================================================================
-- et_notification_list now resolves bundle context via COALESCE across the
-- four candidate nBundledetailid sources (notification row, FactMaster,
-- DocMaster, WebMaster) and projects cBundletag + cPage so the redesigned
-- bell-icon dropdown can render the breadcrumb (filename | tag | page).

CREATE OR REPLACE FUNCTION public.et_notification_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;

open ref for
    select
        n."nNTid", n."nUserid", n."cTitle", n."cMsg", n."dDate", n."cStatus",
        n."nFSid", n."nDocid", n."nWebid", n."cType", n."nBundledetailid",
        fm."nBundledetailid" as "nFBundledetailid",
        dm."nBundledetailid" as "nDBundledetailid",
        wm."nBundledetailid" as "nWBundledetailid",
        b."cFilename", b."cTab", b."cBundletag", b."cPage",
        n."nUPid", up."nCaseid", n."bIsseen",
        um."cFname", um."cLname", um."cProfile",
        n."nRefuserid", n."nPresentid",
        pr."cStatus" as "cPresentStatus"
    from "Notifications" n
    left join "UserMaster"  um on um."nUserid" = n."nRefuserid"
    left join "FactMaster"  fm on fm."nFSid"   = n."nFSid"
    left join "DocMaster"   dm on dm."nDocid"  = n."nDocid"
    left join "WebMaster"   wm on wm."nWebid"  = n."nWebid"
    left join "UploadMaster" up on up."nUPid"  = n."nUPid"
    left join "bundlesource" b on b."nBundledetailid" = COALESCE(
        n."nBundledetailid",
        fm."nBundledetailid",
        dm."nBundledetailid",
        wm."nBundledetailid"
    )
    left join present."PresentationMaster" pr on pr."nPresentid" = n."nPresentid"
    where n."nCaseid" = nCaseid
      and n."nUserid" = nMasterid
    order by n."dDate" desc;

RETURN ref;
END;
$function$
;


-- =============================================================================
-- ── 12/14  2026-05-08  marknav_team_user_admin_visibility ──
-- =============================================================================
-- realtime.et_marknav_team_user (the SP that powers the RT marknav user-filter
-- dropdown) was missing the team-relation logic that et_marks already has, so
-- admin / top-role callers saw teammates' annotations rendered on the page but
-- only "Me" inside the picker. This rewrite mirrors et_marks exactly:
--   - resolves nCaseid from nSesid (or BundleDetail when only nBundledetailid
--     is supplied);
--   - computes isAdmin = UserMaster.isAdmin OR top-role for the case
--     (RoleMaster.nSrno=1 via TeamRelation);
--   - LEFT JOINs TeamRelation tr on (tr.nTeamid = caller's team AND
--     tr.nUserid = u.nUserid AND tr.nCaseid = nCaseid);
--   - admits a candidate user u when `(isAdmin AND tr.nUserid IS NOT NULL)`,
--     in addition to the existing self / FMShared / DMShared paths.
-- Non-admin callers behave exactly as before — they still only see themselves
-- + people who explicitly shared an annotation with them.
-- Also tightens parens around the user-visibility OR-group on the cType='D'
-- and cType<>'A','D' branches (pre-existing operator-precedence bug).

CREATE OR REPLACE FUNCTION realtime.et_marknav_team_user(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid          UUID;
    nBundledetailid  UUID;
    nSesid           UUID;
    cType            text;
    nCaseid          UUID;
    nTeamid          UUID;
    nRoleid          UUID;
    isAdmin          boolean default false;
BEGIN
    nUserid         := NULLIF(parameter ->> 'nUserid', '')::uuid;
    nSesid          := NULLIF(parameter ->> 'nSesid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    cType           := parameter ->> 'cType';

    IF nSesid IS NOT NULL THEN
        SELECT "nCaseid" INTO nCaseid
          FROM "RSessionMaster"
         WHERE "nSesid" = nSesid;
    END IF;

    IF nCaseid IS NULL AND nBundledetailid IS NOT NULL THEN
        SELECT bm."nCaseid" INTO nCaseid
          FROM "BundleDetail" bd
          JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
         WHERE bd."nBundledetailid" = nBundledetailid;
    END IF;

    isAdmin := EXISTS (
        SELECT 1 FROM "UserMaster"
         WHERE "nUserid" = nUserid AND "isAdmin" = true
    );

    SELECT "nTeamid", "nRoleid"
      INTO nTeamid, nRoleid
      FROM "TeamRelation"
     WHERE "nUserid" = nUserid
       AND "nCaseid" = nCaseid
     LIMIT 1;

    IF NOT isAdmin
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1 THEN
        isAdmin := true;
    END IF;

    OPEN ref1 FOR
    SELECT q."nUserid", q."cFname", q."cLname", q."cProfile"
    FROM (
      SELECT DISTINCT
        u."nUserid",
        u."cFname",
        u."cLname",
        u."cProfile",
        CASE WHEN u."nUserid" = nUserid THEN 0 ELSE 1 END AS _sort_first
      FROM "UserMaster" u
      LEFT JOIN "FactMaster" f
        ON f."nUserid" = u."nUserid"
       AND (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
       AND (COALESCE(cType,'A') = 'A' OR f."cFType" = cType)
      LEFT JOIN "FMShared" fs
        ON fs."nFSid" = f."nFSid"
      LEFT JOIN "DocMaster" d
        ON d."nUserid" = u."nUserid"
       AND (d."nSesid" = nSesid OR d."nBundledetailid" = nBundledetailid)
       AND (cType = 'A' OR cType = 'D')
      LEFT JOIN "DMShared" ds
        ON ds."nDocid" = d."nDocid"
      LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = nTeamid
       AND tr."nUserid" = u."nUserid"
       AND tr."nCaseid" = nCaseid
      WHERE (
            COALESCE(cType,'A') = 'A'
            AND (f."nFSid" IS NOT NULL OR d."nDocid" IS NOT NULL)
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType = 'D'
            AND d."nDocid" IS NOT NULL
            AND f."nFSid"  IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType NOT IN ('A','D')
            AND f."nFSid"  IS NOT NULL
            AND d."nDocid" IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
    ) q
    ORDER BY q._sort_first, q."cFname", q."nUserid";

    RETURN NEXT ref1;
END;
$function$;


-- =============================================================================
-- ── 13/14  2026-05-09  case_transcript_mode ──
-- =============================================================================
-- Adds CaseMaster."cTranscriptMode" so each case carries its own choice of
-- transcript representation. Value semantics:
--   'PDF'  — legacy file list (default for ALL rows existing at first apply)
--   'HTML' — new published-transcript session list (default for any case
--            inserted after the SP update lands)
--
-- The HTML/PDF tab strip in the file-explorer was removed; the case flag is
-- the sole driver of which view the user sees.
--
-- Apply order inside this block:
--   13a. ADD COLUMN with DEFAULT 'PDF' so existing rows backfill to legacy
--   13b. ALTER ... SET DEFAULT 'HTML' so future inserts get the new behaviour
--   13c. CHECK constraint 'HTML'/'PDF' to keep typos out
--   13d. CREATE OR REPLACE et_admin_insertupdate_case to write 'HTML' on
--        new-case insert (update path unchanged — write-once at create time)
--   13e. CREATE OR REPLACE et_admin_case_getdetail to return cTranscriptMode

-- 13a. add column, backfill existing rows to legacy
ALTER TABLE "CaseMaster"
  ADD COLUMN IF NOT EXISTS "cTranscriptMode" varchar(8) NOT NULL DEFAULT 'PDF';

COMMENT ON COLUMN "CaseMaster"."cTranscriptMode" IS
  'Transcript representation for this case: PDF=legacy file list, HTML=published transcript session list. Set once at case creation.';

-- 13b. new cases default to HTML
ALTER TABLE "CaseMaster"
  ALTER COLUMN "cTranscriptMode" SET DEFAULT 'HTML';

-- 13c. constrain to known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CaseMaster_cTranscriptMode_chk'
  ) THEN
    ALTER TABLE "CaseMaster"
      ADD CONSTRAINT "CaseMaster_cTranscriptMode_chk"
      CHECK ("cTranscriptMode" IN ('HTML','PDF'));
  END IF;
END $$;

-- 13d. et_admin_insertupdate_case: write 'HTML' on new-case insert.
--      Update path is unchanged — transcript mode is fixed at create time.
CREATE OR REPLACE FUNCTION public.et_admin_insertupdate_case(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid       uuid;
    nCaseid       uuid;
    cCasename     text;
    cDesc         text;
    permission    text;
    cCaseno       text;
    cClaimant     text;
    cRespondent   text;
    cTClaimant    text;
    cTRespondent  text;
    cIndexheader  text;
    nICid         uuid;
BEGIN
    nUserid      := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid      := NULLIF(parameter ->> 'nCaseid','')::uuid;
    cCasename    :=  parameter ->> 'cCasename';
    cDesc        :=  parameter ->> 'cDesc';
    permission   :=  parameter ->> 'permission';
    cCaseno      :=  parameter ->> 'cCaseno';
    cClaimant    :=  parameter ->> 'cClaimant';
    cRespondent  :=  parameter ->> 'cRespondent';
    cTClaimant   :=  parameter ->> 'cTClaimant';
    cTRespondent :=  parameter ->> 'cTRespondent';
    cIndexheader :=  parameter ->> 'cIndexheader';

    IF permission = 'N' THEN
        IF NOT EXISTS (
            SELECT *
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        ELSE
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
            ) THEN
                INSERT INTO "CaseMaster"(
                    "cCasename","dCreateDt","nCreateId","cDesc","cCaseno",
                    "cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader",
                    "cTranscriptMode"
                )
                VALUES(
                    cCasename, now(), nUserid, cDesc, cCaseno,
                    cClaimant, cRespondent, cTClaimant, cTRespondent, cIndexheader,
                    'HTML'
                )
                RETURNING "nCaseid" INTO nCaseid;

                INSERT INTO "TeamMaster"(
                    "cTeamname","dCreateDt","nCreateId","nCaseid","cFlag","cClr"
                )
                SELECT
                    "cCodename", now(), nUserid, nCaseid,
                    COALESCE(("jOther"->>'flag')::text, ''),
                    ("jOther"->>'cClr')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 11
              ORDER BY "nSerialno";

                INSERT INTO "SectionMaster"(
                    "cFolder","cIcon","nCaseid","nUserid","cFoldertype","cMsg"
                )
                SELECT
                    "cCodename", "jOther"->>'icon', nCaseid, NULL,
                    "jOther"->>'cFlag', ("jOther"->>'cMsg')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 13
                   AND ("jOther"->>'cFlag')::text IN ('MB','TS')
              ORDER BY "nSerialno";

                INSERT INTO "IssueCategory"(
                    "nCaseid","cCategory","nUserid","dCreateDt","cICtype"
                )
                VALUES(
                    nCaseid, 'Unassigned',
                    null,
                    now(), 'U'
                )
                RETURNING "nICid" INTO nICid;

                INSERT INTO "RIssueMaster"(
                    "cIName","cColor","nICid","nUserid","dCreatedt","nCaseid"
                )
                VALUES(
                    'Unassigned', 'FFA94D',
                    nICid,
                    null,
                    now(), nCaseid
                );

                insert into "RolePermission" ("nPMid","cType","nCaseid","nRoleid","dModifydt")
                select "nPMid",'R',nCaseid,r."nRoleid",now() from "RoleMaster" r
                join "PermissionDefault" pd on pd."nRoleid" = r."nRoleid" where "bStatus" = false ;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case Created' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;

                INSERT INTO public."LogCaseMaster"(
                    "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
                )
                SELECT
                    7, "nCaseid", "cCasename", "cCaseno", nUserid
                  FROM "CaseMaster"
                 WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;
        END IF;
    END IF;

    IF permission = 'E' THEN
        IF EXISTS (
            SELECT 1
              FROM "TeamRelation" t
             WHERE t."nCaseid" = nCaseid
               AND t."nUserid" = nUserid
               AND t."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid
            UNION
            SELECT 1
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE (
                       upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
                   )
                   AND "nCaseid" <> nCaseid
            ) THEN
                UPDATE "CaseMaster"
                   SET "cCasename"  = cCasename,
                       "cCaseno"    = cCaseno,
                       "cDesc"      = cDesc,
                       "cClaimant"  = cClaimant,
                       "cRespondent"= cRespondent,
                       "cTClaimant" = cTClaimant,
                       "cTRespondent"= cTRespondent,
                       "cIndexheader"= cIndexheader,
                       "dUpdateDt"  = now(),
                       "nUpdateId"  = nUserid
                 WHERE "nCaseid"   = nCaseid;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case updated' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;

            INSERT INTO public."LogCaseMaster"(
                "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
            )
            SELECT
                8, "nCaseid", "cCasename", "cCaseno", nUserid
              FROM "CaseMaster"
             WHERE "nCaseid" = nCaseid;
        ELSE
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        END IF;
    END IF;

    RETURN ref;
END;
$function$;

-- 13e. et_admin_case_getdetail: include cTranscriptMode in the response so
--      the frontend file-explorer can pick the right transcript view per case.
CREATE OR REPLACE FUNCTION public.et_admin_case_getdetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;
isPresent boolean = false;
nPresentid uuid;
nSesid text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;

 select "nSesid"::text into nSesid From "RSessionMaster" where "nCaseid" = nCaseid and "dCreatedt"::date=now()::date and  "cStatus" ='R' order by "dCreatedt" desc limit  1;

if exists(select 1 from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A') then
    isPresent = true;

    select p."nPresentid" into nPresentid from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A';
 end if;

open ref for
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;
    END;
$function$;


-- =============================================================================
-- ── 14/14  2026-05-09  upload_publish_cstatus ──
-- =============================================================================
-- Two transcript-publish data inconsistencies fixed in this block, plus a
-- one-shot backfill for rows already affected.
--
-- (1) Upload-publish SP missing cStatus='P'.
--     Two transcript-publish paths exist:
--       A. RT publish (et_transcript_publish) — sets cStatus='P' AND
--          isTranscript=true AND isUploaded=true.
--       B. Direct transcript-file upload with the Publish flag (cFlag='P')
--          — calls et_realtime_transcript_upload_status, which set
--          isUploaded and isTranscript but NOT cStatus.
--     Frontend (transcript-session-list badge, individual-doc isTrans
--     resolution, feed-display cover-page render and data-fetch) gates
--     "this transcript is published" on cStatus='P', so path B sessions
--     displayed as "Draft" with no cover page even though every other
--     column on the row indicated they were published.
--
-- (2) realtime.et_realtime_sessiondata returning isTrans=false always.
--     The SP declared `isTrans boolean default false` and selected it
--     back at the end without ever flipping it. /session/activesession/
--     detail therefore returned isTrans=false for every session, so
--     downstream callers had to override the detail client-side. Patch
--     replaces the local-var read with a row-data computed expression
--     `r.cStatus='P' OR (r.isTranscript AND r.isUploaded)`.
--
-- Repro: AM1 - 9 May 2026 in eBundle Demo Case
-- (nSesid=d51864ab-9d9b-4640-b2f7-66f81546a470). cStatus='C' yet
-- transcript.Transcripts had dPublishDt set with full cover fields.
--
-- Apply order:
--   14a. CREATE OR REPLACE et_realtime_transcript_upload_status with the
--        missing cStatus='P' update on the cFlag='P' branch.
--   14b. CREATE OR REPLACE realtime.et_realtime_sessiondata with isTrans
--        computed from row data instead of the always-false local var.
--   14c. Backfill RSessionMaster rows already in the half-published
--        state. Predicate matches the diagnostic SELECT used to
--        surface the bug. Idempotent.

-- 14a. patch upload-publish SP so future cFlag='P' sets cStatus='P'
CREATE OR REPLACE FUNCTION public.et_realtime_transcript_upload_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;cFlag text;

BEGIN

nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
cFlag := parameter ->>'cFlag';

if(cFlag = 'C')then
update "RSessionMaster" r set "isUploaded" = true,"isTranscript" = false where "nSesid" = nSesid;

insert into "RSessionTranscripts"("nSesid","nUserid")
values(nSesid,nUserid);

elsif(cFlag = 'P')then
update "RSessionMaster" r set "isUploaded" = true,"isTranscript" = true,"cStatus" = 'P' where "nSesid" = nSesid;
end if;

 open ref for
 select 1 as msg;

 RETURN ref;
 END;
$function$;

-- 14b. patch sessiondata SP so isTrans is computed from row data, not from
--      a local var that defaulted to false and was never flipped.
--      Without this, /session/activesession/detail returned isTrans=false
--      for every session and the frontend (right-pane preview AND
--      individual-doc) had to compensate by overriding the detail
--      object client-side. Computing on the row makes the workaround
--      unnecessary while staying compatible with it.
CREATE OR REPLACE FUNCTION realtime.et_realtime_sessiondata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;totalissues int;nCaseid uuid; cDefHIssues jsonb;nLID uuid;cColor char(6);
nDefaultid int;cDefIssues jsonb;nLIid uuid;cAColor text;

BEGIN

nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;

select "nCaseid" into nCaseid From "RSessionMaster" Where "nSesid" = nSesid;

select count(*) into totalissues From "RIssueMaster" Where ("nUserid" =nUserid) and "nCaseid" = nCaseid;

select jsonb_agg(distinct i.*),lid."nIid",lid."cColor" into  cDefHIssues ,nLID ,cColor
from "RSessionDetail" sd
left join "RIssueMaster" lid on lid."nIid" = sd."nLID"
,jsonb_to_recordset("cDefHIssues") as i("nIid" uuid,serialno int)
join "RIssueMaster" r on r."nIid" = i."nIid"
	where sd."nUserid" =nUserid and sd."nSesid" =nSesid
group by lid."nIid";

select jsonb_agg(distinct i.*),lid."nIid",lid."cColor" into  cDefIssues ,nLIid ,cAColor
from "RSessionDetail" sd
left join "RIssueMaster" lid on lid."nIid" = sd."nLIid"
,jsonb_to_recordset("cDefIssues") as i("nIid" uuid,"nRelid" int,"nImpactid" int,serialno int)
join "RIssueMaster" r on r."nIid" = i."nIid"
	where sd."nUserid" =nUserid and sd."nSesid" =nSesid
group by lid."nIid";

if(coalesce(cDefHIssues,'[]'::jsonb) = '[]'::jsonb )then
select ('[{"nIid": "' || "nIid" || '"}]')::jsonb,"cColor","nIid" into cDefHIssues,cColor,nLID
	From "RIssueMaster"
	where "nCaseid" = nCaseid and "nUserid" IS NULL limit 1;
end if;

open ref for

select c."nCaseid",r."nSesid",r."nRTSid",coalesce(r."cName",'') as "cName",r."dStartDt",r."nDays",coalesce(r."nLines",25) as "nLines",
	 coalesce(r."nPageno",1) as "nPageno",r."cUnicuserid" ,r."cStatus",
	 r."cNotifytype",r."dCreatedt",c."cCaseno",
rs."cUrl",rs."nPort",c."cCasename" ,coalesce(totalissues,0) "totaIssues",coalesce(cDefHIssues,'[]'::jsonb) as "cDefHIssues", nLID as "nLID" ,cColor as "cColor"
,coalesce(cDefIssues,'[]'::jsonb) as "cDefIssues", nLIid as "nLIid" ,cAColor as "cAColor"
,COALESCE(r."cStatus" = 'P' OR (r."isTranscript" AND r."isUploaded"), false) as "isTrans",1 as "nDemoid",coalesce(r."cProtocol",'C') as "cProtocol"
	from "CaseMaster" c
	left join "RSessionMaster" r on r."nCaseid" = c."nCaseid" and r."nSesid" = nSesid  and r."dDelDt" is null
	left join "RealtimeServers" rs on rs."nRTSid" = r."nRTSid"
	where c."nCaseid" = nCaseid
  order by r."nSesid" desc ;

 RETURN ref;
    END;
$function$;

-- 14c. backfill rows already left half-published by the bug
UPDATE "RSessionMaster"
   SET "cStatus" = 'P'
 WHERE "isTranscript" = true
   AND "isUploaded"   = true
   AND ("cStatus" IS NULL OR "cStatus" <> 'P')
   AND "dDelDt" IS NULL;


-- =============================================================================
-- All blocks queued. Commit (or roll back if any block raised).
-- =============================================================================
COMMIT;
