-- 2026-11-03 Mark capture speed, Phase 2 (user: "the highlight takes 3-6 s").
--
-- A QFact save made ~30 database round trips: every step (fact, detail, issues, contacts, team) went through
-- DbService.executeRef's own connect / BEGIN / permission checks / COMMIT, about 165 ms each (live Server-Timing:
-- fact=223 detail=167 issues=166 contacts=165 team=276 published=59, total 1,056 ms).
--
-- These two functions run the SAME existing procedures, unchanged and in the same order, as one statement: one round
-- trip, one transaction. Any step that raises rolls the whole save back (no half-saved fact - the old path committed
-- each step on its own). The server runs the permission checks once before calling them (FactService.saveFactSingleCall),
-- and only when FACT_SAVE_SINGLE_CALL=1; without it the old path is used.
--
-- Adds functions only; changes nothing that exists. Down: 2026-11-03_fact_save_single_call.down.sql.

CREATE OR REPLACE FUNCTION realtime.et_fact_save_published_flag(nfsid uuid, nsesid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- FactService.markAsTranscriptIfPublished: a mark made on a published day carries its transcript position at once.
  IF nfsid IS NULL OR nsesid IS NULL THEN RETURN; END IF;
  UPDATE "FactDetail" fd
     SET "jTCordinates"    = fd."jCordinates",
         "nTPage"          = fd."nPage",
         "nTLine"          = fd."nLine",
         "cTransferStatus" = 'T'
   WHERE fd."nFSid" = nfsid
     AND fd."jTCordinates" IS NULL
     AND EXISTS (
       SELECT 1 FROM "RSessionMaster" s
        WHERE s."nSesid" = nsesid
          AND (s."cStatus" = 'P' OR (s."isTranscript" = true AND s."isUploaded" = true)));
EXCEPTION WHEN OTHERS THEN
  -- As before: the flag never fails the save.
  RAISE WARNING 'et_fact_save_published_flag: %', SQLERRM;
END;
$function$;

-- QFact: fact, detail, issues, contacts, team, published flag.
CREATE OR REPLACE FUNCTION realtime.et_fact_save_quick(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  c refcursor;
  fact record;
  p jsonb := parameter::jsonb;
  saved uuid;
BEGIN
  c := realtime.et_fact_insert(p::json, 'fs_fact');
  FETCH c INTO fact;
  CLOSE c;
  saved := fact."nFSid";
  IF saved IS NULL THEN
    RAISE EXCEPTION 'Fact insert failed';
  END IF;
  p := p || jsonb_build_object('nFSid', saved);

  c := realtime.et_fact_insert_detail(p::json, 'fs_detail');   CLOSE c;
  c := realtime.et_fact_insert_issues(p::json, 'fs_issues');   CLOSE c;
  c := realtime.et_fact_insert_contact(p::json, 'fs_contact'); CLOSE c;
  c := realtime.et_fact_insert_team(p::json, 'fs_team');       CLOSE c;
  PERFORM realtime.et_fact_save_published_flag(saved, NULLIF(p->>'nSesid', '')::uuid);

  OPEN ref FOR SELECT 1 AS msg, saved AS "nFSid", fact.color AS color;
  RETURN ref;
END;
$function$;

-- Full Fact: fact, detail, review status, links, issues, contacts, tasks, team, published flag.
CREATE OR REPLACE FUNCTION realtime.et_fact_save_full(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  c refcursor;
  fact record;
  p jsonb := parameter::jsonb;
  saved uuid;
  review text := p->>'nRv';
BEGIN
  c := realtime.et_fact_insert(p::json, 'fs_fact');
  FETCH c INTO fact;
  CLOSE c;
  saved := fact."nFSid";
  IF saved IS NULL THEN
    RAISE EXCEPTION 'Fact insert failed';
  END IF;
  p := p || jsonb_build_object('nFSid', saved);

  c := realtime.et_fact_insert_detail(p::json, 'fs_detail');   CLOSE c;
  -- FactService.saveReviewStatus: a positive whole number only.
  IF review ~ '^[0-9]{1,9}$' AND review::int > 0 THEN
    UPDATE "FactDetail" SET "nReviewid" = review::int
     WHERE "nFSid" = saved AND "nReviewid" IS DISTINCT FROM review::int;
  END IF;
  c := realtime.et_fact_insert_links(p::json, 'fs_links');     CLOSE c;
  c := realtime.et_fact_insert_issues(p::json, 'fs_issues');   CLOSE c;
  c := realtime.et_fact_insert_contact(p::json, 'fs_contact'); CLOSE c;
  c := realtime.et_fact_insert_task(p::json, 'fs_task');       CLOSE c;
  c := realtime.et_fact_insert_team(p::json, 'fs_team');       CLOSE c;
  PERFORM realtime.et_fact_save_published_flag(saved, NULLIF(p->>'nSesid', '')::uuid);

  OPEN ref FOR SELECT 1 AS msg, saved AS "nFSid", fact.color AS color;
  RETURN ref;
END;
$function$;
