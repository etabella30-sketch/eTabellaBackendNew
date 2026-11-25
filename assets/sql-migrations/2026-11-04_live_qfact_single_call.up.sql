-- 2026-11-04 Instant QFACT capture in one write (user: "add and remove take a delay"; live Server-Timing: every
-- database call costs ~64 ms on etabella.net, and a mark made 12-19 of them — a new QFACT ~1.5 s, a join ~0.9 s).
--
-- With LIVE_QFACT_SINGLE_CALL=1 the realtime server reads what the capture rules need in one query
-- (realtime.live_qfact_owners + the receipt, historical rows and Unassigned issue), decides in the server, and makes
-- every change in one call to realtime.live_qfact_capture_apply: the per-user lock, a re-read (another write in
-- between answers "stale" and the server reads again), the SAME procedures a capture used before for a new QFACT
-- (et_fact_insert, et_fact_insert_detail, et_fact_insert_issues — unchanged), the coordinate updates and deletes the
-- capture made before, and the retry receipt. One statement: any step that raises rolls the whole capture back.
--
-- Adds functions only; changes nothing that exists. Without LIVE_QFACT_SINGLE_CALL=1 nothing calls them.
-- Down: 2026-11-04_live_qfact_single_call.down.sql.

-- The user's live (Express) QFACTs holding each line, by line identity: every identity asked for is a key (an empty
-- list when no QFACT holds it). Each group with its coordinates, pristine flag and issue rows [id, impact, relevance].
CREATE OR REPLACE FUNCTION realtime.live_qfact_owners(nsesid uuid, nuserid uuid, run text, identities text[])
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  SELECT coalesce(jsonb_object_agg(x.identity, x.groups), '{}'::jsonb)
    FROM (
      SELECT ident AS identity, coalesce((
        SELECT jsonb_agg(jsonb_build_object(
                 'nFSid', m."nFSid"::text,
                 'dCreateDt', m."dCreateDt",
                 'jCordinates', d."jCordinates",
                 'bLiveCapturePristine', d."bLiveCapturePristine",
                 'issues', (SELECT coalesce(jsonb_agg(jsonb_build_array(i."nIssueid"::text, i."nImpactid", i."nRelevanceid")
                                                      ORDER BY i."nIssueid"), '[]'::jsonb)
                              FROM public."FMIssue" i WHERE i."nFSid" = m."nFSid"))
               ORDER BY m."dCreateDt", m."nFSid")
          FROM public."FactMaster" m
          JOIN public."FactDetail" d ON d."nFSid" = m."nFSid"
         WHERE m."nSesid" = nsesid AND m."nUserid" = nuserid AND m."cFType" = 'QF'
           AND d."jCordinates" @> jsonb_build_array(jsonb_build_object('capture', 'live-instant', 'run', run, 'identity', ident))
      ), '[]'::jsonb) AS groups
        FROM unnest(identities) AS ident
    ) x;
$function$;

-- One capture's writes. p: nUserid, nSesid, nCaseid, nRequestid, cRun, cIdentity, cAction (the request); run and
-- identities (what was read) and owners (what the read saw); ops [{op:'create', ref, body} | {op:'update', id, jOT,
-- coordinates, nPage, nLine} | {op:'remove', id}] in order — a new QFACT's ref stands for its id until it has one;
-- result (the capture's answer, refs in place of new ids). Answers {status:'ok', result} with the real ids,
-- {status:'stale'} (read again) or {status:'gone'} (the session is no longer live).
CREATE OR REPLACE FUNCTION realtime.live_qfact_capture_apply(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  actor uuid := (p->>'nUserid')::uuid;
  ses uuid := (p->>'nSesid')::uuid;
  live record;
  op jsonb;
  body jsonb;
  c refcursor;
  fact record;
  step record;
  created uuid;
  target uuid;
  ids jsonb := '{}'::jsonb;
  ref text;
  answer text;
BEGIN
  -- The capture's per-user lock (the same key the step-by-step path takes) and its write flag (live_qfact_freeze).
  PERFORM pg_advisory_xact_lock(hashtextextended((p->>'nUserid') || ':' || (p->>'nSesid'), 0));
  PERFORM set_config('etabella.live_qfact_write', 'on', true);

  SELECT s."nSesid", s."nEntryEventid" INTO live
    FROM public."RSessionMaster" s
   WHERE s."nSesid" = ses AND s."nCaseid" = (p->>'nCaseid')::uuid
     AND s."cStatus" = 'R' AND NOT coalesce(s."isUploaded", false) AND s."dDelDt" IS NULL AND s."dEntryEndedAt" IS NULL
     FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'gone');
  END IF;
  -- A restarted run, a request already answered, or the lines' QFACTs changed since the read: read again.
  IF coalesce(NULLIF(live."nEntryEventid"::text, ''), 'session:' || ses::text) IS DISTINCT FROM p->>'cRun'
     OR EXISTS (SELECT 1 FROM public."LiveQfactRequest" r
                 WHERE r."nUserid" = actor AND r."nSesid" = ses AND r."nRequestid" = (p->>'nRequestid')::uuid) THEN
    RETURN jsonb_build_object('status', 'stale');
  END IF;
  PERFORM 1 FROM public."FactMaster" m JOIN public."FactDetail" d ON d."nFSid" = m."nFSid"
    WHERE m."nFSid" IN (SELECT (g->>'nFSid')::uuid FROM jsonb_each(p->'owners') e, jsonb_array_elements(e.value) g)
    FOR UPDATE OF m, d;
  IF realtime.live_qfact_owners(ses, actor, p->>'run', ARRAY(SELECT jsonb_array_elements_text(p->'identities')))
     IS DISTINCT FROM p->'owners' THEN
    RETURN jsonb_build_object('status', 'stale');
  END IF;

  FOR op IN SELECT value FROM jsonb_array_elements(p->'ops') LOOP
    IF op->>'op' = 'create' THEN
      -- A new QFACT: the procedures a capture always used, in the same order, with the same input.
      body := op->'body';
      c := realtime.et_fact_insert(body::json, 'lq_fact');
      FETCH c INTO fact;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'QFACT could not be saved.';
      END IF;
      CLOSE c;
      IF fact."nFSid" IS NULL OR coalesce(to_jsonb(fact)->>'msg', '1') <> '1' THEN
        RAISE EXCEPTION 'QFACT could not be saved.';
      END IF;
      created := fact."nFSid";
      body := body || jsonb_build_object('nFSid', created);
      c := realtime.et_fact_insert_detail(body::json, 'lq_detail');
      FETCH c INTO step;
      IF FOUND AND coalesce(to_jsonb(step)->>'msg', '1') <> '1' THEN
        RAISE EXCEPTION 'QFACT could not be saved.';
      END IF;
      CLOSE c;
      IF jsonb_array_length(coalesce(NULLIF(body->>'jIssues', '')::jsonb, '[]'::jsonb)) > 0 THEN
        c := realtime.et_fact_insert_issues(body::json, 'lq_issues');
        CLOSE c;
      END IF;
      ids := ids || jsonb_build_object(op->>'ref', created::text);
    ELSIF op->>'op' = 'update' THEN
      target := coalesce(ids->>(op->>'id'), op->>'id')::uuid;
      UPDATE public."FactDetail"
         SET "jOT" = op->'jOT', "jCordinates" = op->'coordinates',
             "nPage" = (op->>'nPage')::integer, "nLine" = (op->>'nLine')::integer, "bLiveCapturePristine" = true
       WHERE "nFSid" = target;
    ELSIF op->>'op' = 'remove' THEN
      target := coalesce(ids->>(op->>'id'), op->>'id')::uuid;
      -- Its issue rows go with it.
      DELETE FROM public."FMIssue" WHERE "nFSid" = target;
      DELETE FROM public."FactDetail" WHERE "nFSid" = target;
      DELETE FROM public."FactMaster" WHERE "nFSid" = target;
    ELSE
      RAISE EXCEPTION 'Unknown QFACT capture step %', op->>'op';
    END IF;
  END LOOP;

  answer := (p->'result')::text;
  FOR ref IN SELECT jsonb_object_keys(ids) LOOP
    answer := replace(answer, ref, ids->>ref);
  END LOOP;
  INSERT INTO public."LiveQfactRequest" ("nUserid", "nSesid", "nRequestid", "cRun", "cIdentity", "cAction", "jResult")
  VALUES (actor, ses, (p->>'nRequestid')::uuid, p->>'cRun', p->>'cIdentity', p->>'cAction', answer::jsonb);
  RETURN jsonb_build_object('status', 'ok', 'result', answer::jsonb);
END;
$function$;
