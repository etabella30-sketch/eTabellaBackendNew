-- 2026-05-14 — add bHideBundleColumn flag on CaseMaster.
--
-- Drives whether the file-explorer evidence/bundle table renders the
-- "Bundle" column for a given case. Per-case, default false:
--   false — show the column (existing behaviour for every case)
--   true  — hide the column AND remove it from the column-picker dropdown
--
-- The flag is read by:
--   - shared/components/myfiles/files/files.component.ts → suppresses
--     reqcols.bundle.view so the table column doesn't render
--   - shared/components/myfiles/fileexplorer/fileexplorer.component.ts →
--     filters tablecols so the column-toggle dropdown can't re-enable it
--
-- The case-detail SP is the single read path (frontend's CasedetailService
-- calls /case/caseinfo → coreapi getCaseDetail → admin_case_getdetail), so
-- only that SP needs to be patched to surface the new column.
--
-- Apply order:
--   1. ADD COLUMN with DEFAULT false (NULL-safe; existing rows unaffected)
--   2. UPDATE the requested case to true
--   3. CREATE OR REPLACE et_admin_case_getdetail to include the new column
--
-- Pattern mirrors 2026-05-09_case_transcript_mode.sql.

BEGIN;

-- ── 1/3 ── add column ────────────────────────────────────────────────────
ALTER TABLE "CaseMaster"
  ADD COLUMN IF NOT EXISTS "bHideBundleColumn" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "CaseMaster"."bHideBundleColumn" IS
  'When true, the file-explorer evidence/bundle table for this case hides the "Bundle" column AND suppresses it from the column-picker dropdown. Per-case UI override; defaults to false.';

-- ── 2/3 ── flip the requested case ───────────────────────────────────────
UPDATE "CaseMaster"
   SET "bHideBundleColumn" = true
 WHERE "nCaseid" = '3aecc24a-98b8-46ca-8209-1f7a2584d679';

-- ── 3/3 ── patch et_admin_case_getdetail to return the new column ────────
-- Body copied verbatim from sp-audit/sp/public/et_admin_case_getdetail.sql
-- (post 2026-05-09 cTranscriptMode patch); only the OPEN ref FOR select
-- column list is extended with "bHideBundleColumn".
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
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode","bHideBundleColumn",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;
    END;
$function$;

COMMIT;

-- Rollback (manual):
--   ALTER TABLE "CaseMaster" DROP COLUMN IF EXISTS "bHideBundleColumn";
--   -- Restore prior et_admin_case_getdetail body from sp-audit history
--   -- (the only difference is the missing "bHideBundleColumn" in the SELECT).
