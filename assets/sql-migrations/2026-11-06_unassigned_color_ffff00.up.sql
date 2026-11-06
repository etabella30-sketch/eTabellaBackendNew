-- 2026-11-06 One Unassigned colour: FFFF00, issue and claim, every case.
--
-- Why
-- ---
-- User 2026-11-06: "the unassigned issue and the claim should be ... #FFFF00", in every case, and no other issue may
-- look like it. 2026-04-30_unassigned_issue_seed.sql seeded FFFF00 for new cases but deliberately left the legacy
-- Unassigned issues (e9e90e from the old sessionbuilder seed, FFA94D) untouched. The user now wants them all the
-- same: this script recolours ONLY the system Unassigned rows. User-created issues/claims keep their colour (the app
-- flags a yellow one in Manage as "Looks like Unassigned").
--
-- Scope (system rows only)
-- -------------------------
--   * Issue  : "RIssueMaster" with cIName = 'Unassigned' under the case's Unassigned claim.
--   * Claim  : "IssueCategory" with cICtype = 'U' AND cCategory = 'Unassigned' — only if the table has a cColor
--              column on this database (the claim colour came with the 2026-09 claim fields; checked first).
--   cColor is stored without '#', upper case (RIssueMaster.cColor is varchar(6)).
--
-- Safety
-- ------
--   * One transaction. Prints how many rows it will change before changing them.
--   * Every changed row's old colour is copied to "_bak_unassigned_color_20261106" first (kind, id, old colour);
--     2026-11-06_unassigned_color_ffff00.down.sql puts them back.
--   * Idempotent: rows already FFFF00 are not touched, a re-run changes nothing and adds no backup rows.
--
-- Run (after reading it):  psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-06_unassigned_color_ffff00.up.sql

BEGIN;

CREATE TABLE IF NOT EXISTS "_bak_unassigned_color_20261106" (
    "kind"      text        NOT NULL,          -- 'issue' | 'claim'
    "id"        uuid        NOT NULL,
    "old_color" text,
    "saved_at"  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("kind", "id")
);

-- ---------------------------------------------------------------- issues
WITH target AS (
    SELECT im."nIid", im."cColor"
      FROM "RIssueMaster" im
      JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
     WHERE ic."cICtype" = 'U'
       AND ic."cCategory" = 'Unassigned'
       AND im."cIName" = 'Unassigned'
       AND upper(coalesce(im."cColor", '')) <> 'FFFF00'
)
INSERT INTO "_bak_unassigned_color_20261106" ("kind", "id", "old_color")
SELECT 'issue', "nIid", "cColor" FROM target
ON CONFLICT ("kind", "id") DO NOTHING;

DO $$
DECLARE n integer;
BEGIN
    UPDATE "RIssueMaster" im
       SET "cColor" = 'FFFF00'
      FROM "IssueCategory" ic
     WHERE ic."nICid" = im."nICid"
       AND ic."cICtype" = 'U'
       AND ic."cCategory" = 'Unassigned'
       AND im."cIName" = 'Unassigned'
       AND upper(coalesce(im."cColor", '')) <> 'FFFF00';
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'Unassigned issues recoloured to FFFF00: %', n;
END $$;

-- ---------------------------------------------------------------- claims (only when the column exists)
DO $$
DECLARE n integer;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'IssueCategory' AND column_name = 'cColor'
    ) THEN
        INSERT INTO "_bak_unassigned_color_20261106" ("kind", "id", "old_color")
        SELECT 'claim', "nICid", "cColor"
          FROM "IssueCategory"
         WHERE "cICtype" = 'U' AND "cCategory" = 'Unassigned'
           AND upper(coalesce("cColor", '')) <> 'FFFF00'
        ON CONFLICT ("kind", "id") DO NOTHING;

        UPDATE "IssueCategory"
           SET "cColor" = 'FFFF00'
         WHERE "cICtype" = 'U' AND "cCategory" = 'Unassigned'
           AND upper(coalesce("cColor", '')) <> 'FFFF00';
        GET DIAGNOSTICS n = ROW_COUNT;
        RAISE NOTICE 'Unassigned claims recoloured to FFFF00: %', n;
    ELSE
        RAISE NOTICE 'IssueCategory has no cColor column on this database: claims left as they are (the app shows FFFF00).';
    END IF;
END $$;

-- ---------------------------------------------------------------- keep it so for new cases
-- et_admin_insertupdate_case (2026-05-09_case_transcript_mode.sql) seeds every NEW case's Unassigned issue as
-- 'FFA94D', and et_realtime_ensure_unassigned_issue then finds that row and leaves it. Rather than replace those
-- procedures, a trigger stores FFFF00 whenever a system Unassigned issue (cIName 'Unassigned' under the case's
-- Unassigned claim) is inserted or recoloured — by any procedure. User-created issues are never touched.
CREATE OR REPLACE FUNCTION public.et_unassigned_issue_color_ffff00()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW."cIName" = 'Unassigned' AND EXISTS (
        SELECT 1 FROM "IssueCategory" ic
         WHERE ic."nICid" = NEW."nICid" AND ic."cICtype" = 'U' AND ic."cCategory" = 'Unassigned'
    ) THEN
        NEW."cColor" := 'FFFF00';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS et_unassigned_issue_color_ffff00 ON "RIssueMaster";
CREATE TRIGGER et_unassigned_issue_color_ffff00
    BEFORE INSERT OR UPDATE OF "cColor", "cIName", "nICid" ON "RIssueMaster"
    FOR EACH ROW EXECUTE FUNCTION public.et_unassigned_issue_color_ffff00();

-- The same for the Unassigned claim, only where IssueCategory has a cColor column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'IssueCategory' AND column_name = 'cColor'
    ) THEN
        EXECUTE $f$
            CREATE OR REPLACE FUNCTION public.et_unassigned_claim_color_ffff00()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $body$
            BEGIN
                IF NEW."cICtype" = 'U' AND NEW."cCategory" = 'Unassigned' THEN
                    NEW."cColor" := 'FFFF00';
                END IF;
                RETURN NEW;
            END;
            $body$;
        $f$;
        EXECUTE 'DROP TRIGGER IF EXISTS et_unassigned_claim_color_ffff00 ON "IssueCategory"';
        EXECUTE 'CREATE TRIGGER et_unassigned_claim_color_ffff00
                     BEFORE INSERT OR UPDATE OF "cColor", "cICtype", "cCategory" ON "IssueCategory"
                     FOR EACH ROW EXECUTE FUNCTION public.et_unassigned_claim_color_ffff00()';
    END IF;
END $$;

-- What is left that is not FFFF00 (expect 0 issues; claims 0 or the column is absent).
SELECT 'issues not FFFF00' AS check, count(*)
  FROM "RIssueMaster" im
  JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
 WHERE ic."cICtype" = 'U' AND ic."cCategory" = 'Unassigned' AND im."cIName" = 'Unassigned'
   AND upper(coalesce(im."cColor", '')) <> 'FFFF00';

COMMIT;
