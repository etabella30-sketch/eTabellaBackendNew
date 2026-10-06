-- 2026-10-06_qmark_backfill_map_and_coordinates.sql
--
-- Data migration for Phase 7b item 6 / D8 (approved 2026-10-06), after 2026-10-06_qmark_handler_complete.sql: the
-- quick marks the bare realtime.et_qmark_handler wrote (on dev 2,113 of 11,858 rows had no RHighlightMapid row and
-- 1,333 no jCordinates on 2026-10-06) get what public.et_realtime_handle_rhighlights would have given them:
--  - one RHighlightMapid row (nHid -> nLID) when the row names its issue (nLID); the 112 rows with no nLID have no
--    issue to map and are left alone;
--  - jCordinates = [{t, text, otext, identity, refreshCount: 0, isMain: true}] from the row's own time, note and
--    identity (the transcript-side columns when the page-side ones are NULL).
-- Nothing is deleted or overwritten: only missing map rows and NULL jCordinates are filled. Idempotent.
--
-- Apply to dev etabella_tech_uuid only (guard below). Prod is the operator's (run AFTER the SP migration).

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'qmark_backfill: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

DO $b$
DECLARE n_map int; n_coord int;
BEGIN
    INSERT INTO "RHighlightMapid" ("nHid", "nIid")
    SELECT h."nHid", h."nLID"
    FROM "RHighlights" h
    WHERE h."nLID" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "RHighlightMapid" m WHERE m."nHid" = h."nHid");
    GET DIAGNOSTICS n_map = ROW_COUNT;

    UPDATE "RHighlights" h
       SET "jCordinates" = jsonb_build_array(jsonb_build_object(
               't', coalesce(h."cTime", h."cTTime"),
               'text', h."cNote",
               'otext', h."cNote",
               'identity', coalesce(h."identity", h."tidentity"),
               'refreshCount', 0,
               'isMain', true))
     WHERE h."jCordinates" IS NULL;
    GET DIAGNOSTICS n_coord = ROW_COUNT;

    RAISE NOTICE 'qmark_backfill: % map rows added, % jCordinates filled', n_map, n_coord;
END
$b$;

COMMIT;
