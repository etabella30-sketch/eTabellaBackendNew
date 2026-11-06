-- 2026-11-06 Undo 2026-11-06_unassigned_color_ffff00.up.sql: put every Unassigned issue / claim colour back to what
-- it was before (from "_bak_unassigned_color_20261106"). Rows the up script did not change are not touched. The backup
-- table is kept (drop it by hand once you are sure).

BEGIN;

-- The triggers first, or they would turn the restored colours straight back into FFFF00.
DROP TRIGGER IF EXISTS et_unassigned_issue_color_ffff00 ON "RIssueMaster";
DROP FUNCTION IF EXISTS public.et_unassigned_issue_color_ffff00();
DO $$
BEGIN
    IF to_regclass('public."IssueCategory"') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS et_unassigned_claim_color_ffff00 ON "IssueCategory"';
    END IF;
END $$;
DROP FUNCTION IF EXISTS public.et_unassigned_claim_color_ffff00();

UPDATE "RIssueMaster" im
   SET "cColor" = b."old_color"
  FROM "_bak_unassigned_color_20261106" b
 WHERE b."kind" = 'issue' AND b."id" = im."nIid";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'IssueCategory' AND column_name = 'cColor'
    ) THEN
        UPDATE "IssueCategory" ic
           SET "cColor" = b."old_color"
          FROM "_bak_unassigned_color_20261106" b
         WHERE b."kind" = 'claim' AND b."id" = ic."nICid";
    END IF;
END $$;

COMMIT;
