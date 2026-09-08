-- 2026-04-15 — add cTransferStatus column for orphan detection on publish
--
-- Context: when Admin publishes a transcript, the live RT feed is edited into a
-- final transcript. Content can be deleted (mic-checks, off-record moments) so
-- annotations drawn on that content have no target line in the published view.
-- The annot-transfer Python script detects this case via text similarity: if the
-- best fuzzy match against the published feed scores below 60, the annotation is
-- classified as an ORPHAN rather than being snapped to an arbitrary nearby line.
--
-- Column values:
--   NULL  — transfer hasn't run yet for this row (default for legacy + fresh rows)
--   'T'   — transferred successfully (cTPageno/cTLineno/cTTime populated)
--   'O'   — orphan: source content was removed during publish (transferred fields
--           stay NULL; et_marks will hide these from the published-view response
--           so they don't render at wrong positions; a follow-up "Needs review"
--           UI panel surfaces them to the user)
--
-- Additive migration: no data touched, default NULL preserves existing semantics
-- (rows that were never transferred still read as not-transferred).

-- All four annotation-bearing tables that participate in et_marks's three
-- refcursors (ref1 facts -> FactDetail, ref2 highlights -> RHighlights,
-- ref3 doc-links -> DocDetail). RIssueDetail is also included for issue-style
-- annotations even though the current et_marks doesn't read from it directly —
-- the Python issuetransfer.py writes cTransferStatus there for consistency with
-- the orphan surface (the follow-up "Needs review" panel reads across tables).
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
