-- 2026-04-17 — Global sweep: clear false-positive annotation transfers
--
-- Context
-- -------
-- The old annot-transfer Python (run3.py) would fuzzy-match draft annotations
-- onto the published feed and write the target coords into jTCordinates /
-- cTPageno / cTLineno / cTTime / tidentity — without any sanity check on how
-- far the draft timestamp was from the matched published timestamp. When the
-- original draft content was edited out during publish (the canonical
-- mic-check case), the fuzzy matcher happily landed on an unrelated line
-- with some word overlap (e.g. "good morning" matching "PRESIDENT: Good
-- morning...") and stamped cTransferStatus='T' as if it had succeeded.
-- Those rows then render as orphan highlights on the wrong content.
--
-- Day-1 example on d5bb2972-...: draft highlight at 15:05:03 got "transferred"
-- to the published line at 09:00:55 — a 6-hour gap, obviously a wrong match.
--
-- This sweep applies a simple integrity rule across every session on the DB:
-- any row where the draft timestamp and the transferred timestamp differ by
-- more than TIME_GAP_TOLERANCE_SECONDS (60s) was a false-positive transfer
-- and must be treated as an orphan. It also repairs any orphan rows whose
-- transferred coord columns were never NULL'd (inconsistent state left over
-- from an earlier publish run that stamped 'O' but didn't clear the coords).
--
-- Note on time format: cTime / cTTime / jCordinates.t / jTCordinates.t are
-- stored as VARCHAR in "HH:MM:SS" or "HH:MM:SS:FF" form (frames appended by
-- the capture layer). We build a helper CTE that extracts the first three
-- ":"-separated components and casts to the `time` type so we can do
-- EXTRACT(EPOCH ...) arithmetic on them.
--
-- Safe to re-run: the WHERE clauses only touch rows that meet the "bad"
-- criteria; rerunning is a no-op once the DB is clean. Apply to both
-- dev.etabella.com.uuid and etabella_tech_uuid.
--
-- Paired with assets/pythons/annot-transfer/run3.py which now refuses to
-- write a transfer when the timestamp gap exceeds this same threshold —
-- so once this sweep is run, future publishes cannot reintroduce the same
-- bad rows.

BEGIN;

-- --------------------------------------------------------------------------
-- Helper: normalize a VARCHAR timestamp ("HH:MM:SS" or "HH:MM:SS:FF") to time
-- Using a SQL function scoped to this script would be ideal; inlining with
-- substring() keeps it self-contained.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. RHighlights: orphan any row whose draft/transferred times diverge > 60s
-- --------------------------------------------------------------------------
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

-- Also: any row already stamped 'O' but with transferred columns not cleared.
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


-- --------------------------------------------------------------------------
-- 2. FactDetail: same rule using first coord's timestamp in the JSON arrays
-- --------------------------------------------------------------------------
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


-- --------------------------------------------------------------------------
-- 3. DocDetail: same rule as FactDetail
-- --------------------------------------------------------------------------
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

COMMIT;
