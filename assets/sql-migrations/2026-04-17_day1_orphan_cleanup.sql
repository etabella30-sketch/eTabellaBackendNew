-- 2026-04-17 — One-shot fix for orphaned Day-1 highlights showing on page 1
--
-- Context
-- -------
-- Draft Day-1 has highlights anchored to timestamps 08:18:53 – 08:35:54 on
-- mic-check / testing content. The published Day-1 feed starts at 08:43:35
-- — the whole mic-check segment was edited out during publish. So every
-- highlight the user made on that segment is now an "orphan": source
-- content deleted, no valid target line in the published feed.
--
-- What the user is seeing on the published view:
--   1.1  08:43:35  (9.00 am)                            -- orphan highlight
--   1.2  08:59:59  Introductions and procedural...       -- orphan highlight
--   1.3  09:00:19  PRESIDENT: Good morning...            -- orphan highlight
--
-- Root cause of the persistence (why re-publish didn't fix it)
-- -------------------------------------------------------------
-- The annotation-transfer pipeline in run3.py now (after my edits) writes
-- cTransferStatus='T' on successful transfers and ='O' on orphans, and
-- NULL-clears the transferred coord columns for orphans. BUT: if the
-- cTransferStatus column doesn't exist on the target tables yet, every
-- UPDATE throws "column does not exist" which gets swallowed by the loop's
-- try/except and the previous (wrong) coords stay in place — exactly what's
-- showing on Day-1 page 1 right now.
--
-- et_marks (the SP that powers the published view) also needs the
-- cTransferStatus='O' filter to exclude orphans from the response.
--
-- This one migration:
--   Step 1. Adds cTransferStatus on all four annotation tables (idempotent).
--   Step 2. Rewrites et_marks to filter orphans on the published view.
--   Step 3. Directly marks the Day-1 orphan highlights as 'O' and clears
--           their transferred coords so they stop rendering NOW, even
--           before the next re-publish (which will also correctly flag
--           future publishes thanks to the run3.py edits).
--
-- After running this, reload the Day-1 individual-doc view and the
-- published-view / export should no longer show the mic-check overlays
-- on page 1 lines 1-3.

-- =============================================================================
-- Step 1: ensure cTransferStatus exists on all annotation tables
-- =============================================================================
-- Safe to re-run; no-op if already applied via 2026-04-15_ctransferstatus_column.sql.
ALTER TABLE "RHighlights"   ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);
ALTER TABLE "RIssueDetail"  ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);
ALTER TABLE "FactDetail"    ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);
ALTER TABLE "DocDetail"     ADD COLUMN IF NOT EXISTS "cTransferStatus" character(1);


-- =============================================================================
-- Step 2: rewrite et_marks to filter orphans from the published view
-- =============================================================================
-- Same body as 2026-04-15_et_marks_hide_untransferred.sql. Safe to re-run;
-- CREATE OR REPLACE is idempotent.
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
                join "RIssueMaster" i on i."nIid" = d."nColorid"
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
-- Step 3: mark Day-1 mic-check-era orphans
-- =============================================================================
-- IMPORTANT: replace '<DAY-1-NSESID>' below with the nSesid for Day-1 before
-- running. You can look it up with:
--
--   SELECT "nSesid", "cName" FROM "RSessionMaster"
--    WHERE "cName" ILIKE 'Day-01%' OR "cName" ILIKE 'Day 1%';
--
-- The rule: every highlight whose ORIGINAL draft time (cTime) is before the
-- first valid published timestamp (08:43:35 for Day-1) is anchored to
-- content that was deleted during publish → orphan. Mark them 'O' and NULL
-- the transferred coords so et_marks and the export path both skip them.
-- Threshold time '08:43:35' is the first line of the published Day-1 feed;
-- any draft highlight before that has no valid published counterpart.

UPDATE "RHighlights"
SET "cTPageno"        = NULL,
    "cTLineno"        = NULL,
    "cTTime"          = NULL,
    "tidentity"       = NULL,
    "cTransferStatus" = 'O'
WHERE "nSessionId" = '<DAY-1-NSESID>'
  AND "cTime" < '08:43:35';

-- Same cleanup for facts / doc-links attached to Day-1. jCordinates stores
-- the draft coords as a JSON array of {t, p, l, ...} objects; check the
-- first element's timestamp. This uses jsonb ops; if your column type is
-- json (not jsonb), cast with ::jsonb.
UPDATE "FactDetail" d
SET "jTCordinates"    = NULL,
    "nTPage"          = NULL,
    "cTransferStatus" = 'O'
WHERE EXISTS (
    SELECT 1 FROM "FactMaster" f
     WHERE f."nFSid" = d."nFSid"
       AND f."nSesid" = '<DAY-1-NSESID>'
  )
  AND d."jCordinates" IS NOT NULL
  AND (d."jCordinates"::jsonb -> 0 ->> 't') < '08:43:35';

UPDATE "DocDetail" d
SET "jTCordinates"    = NULL,
    "nTPage"          = NULL,
    "cTransferStatus" = 'O'
WHERE EXISTS (
    SELECT 1 FROM "DocMaster" m
     WHERE m."nDocid" = d."nDocid"
       AND m."nSesid" = '<DAY-1-NSESID>'
  )
  AND d."jCordinates" IS NOT NULL
  AND (d."jCordinates"::jsonb -> 0 ->> 't') < '08:43:35';
