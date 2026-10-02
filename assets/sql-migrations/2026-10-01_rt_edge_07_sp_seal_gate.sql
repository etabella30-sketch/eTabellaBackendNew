-- 2026-10-01_rt_edge_07_sp_seal_gate.sql
--
-- RT venue edge box: seal record and the publish / export gate (spec rev 3,
-- sections 4.4, 5.7; D7, D16, S-D8, S-D15).
--
--   et_rtedge_session_seal        after the service verified the signed seal:
--                                 'L'/'S' -> 'K' or 'W'
--   et_rtedge_warn_ack            acknowledge a 'W' session before publish
--   et_rtedge_session_forceseal   super-admin 'S' -> 'F' (audited, watermarked),
--                                 dismissing pending orphans in the same action
--   et_rt_transcript_completeness the gate behind assertTranscriptComplete
--
-- The state machine on "RSessionMaster"."cSyncState" (gated sessions are
-- bEverEdge OR cApply = 'C', so a split cannot bypass the gate):
--
--   bind / direct('C')     -> L
--   end request / split    L -> S          (et_rtedge_session_end / _split)
--   seal                   L|S -> K | W    (K: no warning incidents, no pending orphans)
--   acknowledge            W stays W, dWarnAckAt set
--   forced close           S -> F          (super-admin, note, watermark; also L
--                                           for a soft-deleted session)
--   orphan dismissal       K|W|F -> F      (super-admin, et_rtedge_orphan_resolve 'D',
--                                           file 08: the dismissed interval is the watermark)
--
-- Gate (spec 4.4): publish and export need K, or W with dWarnAckAt, or F, and
-- no pending ('P') RtEdgeOrphan row. Exports of a live ('L') session stay
-- allowed and are stamped "Live - as of ..."; after the end request ('S')
-- they are blocked until the seal. How the gate combines across split parts
-- is open (O-4): the gate returns the whole part chain so the caller decides.
--
-- A soft-deleted session still seals and can be force-closed: the box was
-- told 'end' for it (et_rtedge_assignments r3) and it must reach a terminal
-- state. The gate never passes a deleted session (NOT_FOUND).
--
-- Conventions: see file 05.
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 04.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_07_sp_seal_gate: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.rtedge_gate_reason(boolean, text, timestamp with time zone, integer)') IS NULL
       OR to_regprocedure('public.rtedge_orphan_interval(timestamp with time zone, timestamp with time zone, bigint, bigint, text)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_07_sp_seal_gate: apply 2026-10-01_rt_edge_04_helpers.sql first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- et_rtedge_session_seal   (spec 5.7, after the service verified 1-6)
--   in : nSesid, nEdgeid (required for an 'E' session: the sealing box),
--        nEpoch, nRebaseSeq? (the lineage the seal names), nFinalRev,
--        cFinalDigest (root), nFinalLines, nRawFinalSeq, cRawFinalHash,
--        jIncidents (array of {kind, level, ...}; [] when none), cSealNote?,
--        jSeal (the signed seal JSON, stored in RtEdgeEvent 'seal')
--   out: msg, value, bAlready, nSesid, nCaseid, nEdgeid, cSyncState,
--        nWarnings, nPendingOrphans, dSealedAt
--   'W' when the incident list has a warning-level incident or the session
--   has pending orphans; 'K' otherwise; 'F' (watermarked with the dismissed
--   intervals) when the session has a dismissed orphan, a backstop: dismissal
--   is only allowed once the session is sealed or force-closed (file 08).
--   Records the final digest, lines, raw seq and hash, sets the applied
--   watermark to the exact final pair and closes a still-live cStatus 'R'.
--   A repeat with identical values is a no-op success, also after a
--   dismissal turned the sealed session into 'F'; different values on a
--   sealed session are refused. A soft-deleted session still seals.
--   Cut-mode 'D' sessions (cApply 'C') seal through the same SP without
--   nEdgeid / nEpoch.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_seal(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses        uuid;
    v_edge_raw   text;
    v_edge       uuid;
    v_epoch_raw  text;
    v_epoch      integer;
    v_rbs_raw    text;
    v_rbs        bigint;
    v_rev        bigint;
    v_digest     text;
    v_lines      integer;
    v_rawseq     bigint;
    v_rawhash    text;
    v_inc_raw    text;
    v_inc        jsonb;
    v_note       text;
    v_seal       jsonb;
    v_row        public."RSessionMaster"%ROWTYPE;
    v_warn       integer;
    v_pending    integer;
    v_dismissed  integer;
    v_fnote      text;
    v_state      text;
BEGIN
    v_ses       := public.rtedge_uuid(parameter ->> 'nSesid');
    v_edge_raw  := public.rtedge_text(parameter ->> 'nEdgeid');
    v_edge      := public.rtedge_uuid(v_edge_raw);
    v_epoch_raw := public.rtedge_text(parameter ->> 'nEpoch');
    v_epoch     := public.rtedge_int(v_epoch_raw);
    v_rbs_raw   := public.rtedge_text(parameter ->> 'nRebaseSeq');
    v_rbs       := public.rtedge_bigint(v_rbs_raw);
    v_rev       := public.rtedge_bigint(parameter ->> 'nFinalRev');
    v_digest    := public.rtedge_text(parameter ->> 'cFinalDigest');
    v_lines     := public.rtedge_int(parameter ->> 'nFinalLines');
    v_rawseq    := public.rtedge_bigint(parameter ->> 'nRawFinalSeq');
    v_rawhash   := public.rtedge_text(parameter ->> 'cRawFinalHash');
    v_inc_raw   := public.rtedge_text(parameter ->> 'jIncidents');
    v_inc       := COALESCE(public.rtedge_jsonb(v_inc_raw), '[]'::jsonb);
    v_note      := public.rtedge_text(parameter ->> 'cSealNote');
    v_seal      := public.rtedge_jsonb(parameter ->> 'jSeal');

    IF v_ses IS NULL
       OR v_lines IS NULL OR v_lines < 0
       OR v_rawseq IS NULL OR v_rawseq < 0
       OR NOT public.rtedge_hash_ok(v_digest) OR NOT public.rtedge_hash_ok(v_rawhash) THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid, cFinalDigest, nFinalLines, nRawFinalSeq and cRawFinalHash are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_edge_raw IS NOT NULL AND v_edge IS NULL) OR (v_epoch_raw IS NOT NULL AND v_epoch IS NULL)
       OR (v_rbs_raw IS NOT NULL AND v_rbs IS NULL)
       OR (v_inc_raw IS NOT NULL AND jsonb_typeof(public.rtedge_jsonb(v_inc_raw)) IS DISTINCT FROM 'array')
       OR length(v_note) > 200 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid, nEpoch or nRebaseSeq is malformed, jIncidents is not an array, or cSealNote exceeds 200 characters' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    -- A soft-deleted session still seals: its box got op 'end' for it
    -- (et_rtedge_assignments r3) and this is how it leaves 'L' / 'S'.
    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF NOT (v_row."bEverEdge" OR COALESCE(v_row."cApply" = 'C', false)) THEN
        OPEN ref FOR SELECT -2 AS msg, 'Not a venue or cut-mode session' AS value, 'NOT_GATED' AS "cCode";
        RETURN ref;
    END IF;

    -- A repeat of the same seal (lost ack) is a no-op success, also when a
    -- dismissal has since turned the sealed session into 'F'. A forced close
    -- without a seal has no final values, so a late seal is refused.
    IF v_row."cSyncState" IN ('K', 'W', 'F') THEN
        IF COALESCE(v_row."cFinalDigest" = v_digest AND v_row."nFinalLines" = v_lines
                    AND v_row."nRawFinalSeq" = v_rawseq AND v_row."cRawFinalHash" = v_rawhash, false) THEN
            OPEN ref FOR
                SELECT 1 AS msg, 'Already sealed' AS value, true AS "bAlready",
                       r."nSesid", r."nCaseid", r."nEdgeid", r."cSyncState",
                       public.rtedge_incident_warnings(r."jIncidents") AS "nWarnings",
                       (SELECT count(*) FROM public."RtEdgeOrphan" o WHERE o."nSesid" = r."nSesid" AND o."cStatus" = 'P')::integer AS "nPendingOrphans",
                       r."dSealedAt"
                  FROM public."RSessionMaster" r
                 WHERE r."nSesid" = v_ses;
            RETURN ref;
        END IF;
        IF v_row."cSyncState" = 'F' THEN
            OPEN ref FOR SELECT -2 AS msg, 'The session was force-closed' AS value, 'FORCED' AS "cCode";
            RETURN ref;
        END IF;
        OPEN ref FOR SELECT -2 AS msg, 'The session is already sealed with different values' AS value, 'SEALED' AS "cCode";
        RETURN ref;
    END IF;

    -- Edge sessions: the sealing box and lineage must be the current ones.
    IF v_row."cFeedSource" = 'E' THEN
        IF v_edge IS NULL OR v_edge IS DISTINCT FROM v_row."nEdgeid" THEN
            OPEN ref FOR SELECT -2 AS msg, 'The session is not bound to this venue box' AS value, 'NOT_BOUND' AS "cCode";
            RETURN ref;
        END IF;
        IF v_epoch IS DISTINCT FROM v_row."nIngestEpoch" OR v_rbs IS DISTINCT FROM v_row."nRebaseSeq" THEN
            OPEN ref FOR SELECT -2 AS msg, format('Lineage mismatch: the session is at epoch %s, rebaseSeq %s',
                                                  v_row."nIngestEpoch", COALESCE(v_row."nRebaseSeq"::text, 'none')) AS value,
                                'LINEAGE' AS "cCode";
            RETURN ref;
        END IF;
    END IF;
    IF v_row."nAppliedRawSeq" IS NOT NULL AND v_rawseq < v_row."nAppliedRawSeq" THEN
        OPEN ref FOR SELECT -2 AS msg, format('nRawFinalSeq %s is behind the applied watermark %s', v_rawseq, v_row."nAppliedRawSeq") AS value,
                            'REGRESS' AS "cCode";
        RETURN ref;
    END IF;

    v_warn := public.rtedge_incident_warnings(v_inc);
    SELECT count(*) FILTER (WHERE o."cStatus" = 'P'), count(*) FILTER (WHERE o."cStatus" = 'D')
      INTO v_pending, v_dismissed
      FROM public."RtEdgeOrphan" o
     WHERE o."nSesid" = v_ses;
    IF v_dismissed > 0 THEN
        -- Held data was left out (S-D15): never 'K' / 'W', always the watermark.
        v_state := 'F';
        SELECT left('venue data missing '
                    || string_agg(public.rtedge_orphan_interval(o."dFrom", o."dTo", o."nFromSeq", o."nToSeq", v_row."cTimezone"),
                                  '; ' ORDER BY o."dFrom", o."nFromSeq", o."dCreatedt"), 200)
          INTO v_fnote
          FROM public."RtEdgeOrphan" o
         WHERE o."nSesid" = v_ses AND o."cStatus" = 'D';
    ELSE
        v_state := CASE WHEN v_warn > 0 OR v_pending > 0 THEN 'W' ELSE 'K' END;
    END IF;

    UPDATE public."RSessionMaster"
       SET "cSyncState"      = v_state,
           "jIncidents"      = v_inc,
           "cFinalDigest"    = v_digest,
           "nFinalLines"     = v_lines,
           "nRawFinalSeq"    = v_rawseq,
           "cRawFinalHash"   = v_rawhash,
           "dSealedAt"       = now(),
           "nAppliedRawSeq"  = v_rawseq,
           "cAppliedRawHash" = v_rawhash,
           "dWarnAckAt"      = NULL,
           "nWarnAckBy"      = NULL,
           "cSealNote"       = CASE WHEN v_state = 'F' THEN v_fnote ELSE COALESCE(v_note, "cSealNote") END,
           "cStatus"         = CASE WHEN "cStatus" = 'R' THEN 'C' ELSE "cStatus" END,
           "dUpdatedt"       = now()
     WHERE "nSesid" = v_ses;

    PERFORM public.rtedge_event(v_row."nEdgeid", v_ses, 'seal',
        jsonb_build_object('cSyncState', v_state, 'nFinalRev', v_rev, 'nFinalLines', v_lines, 'cFinalDigest', v_digest,
                           'nRawFinalSeq', v_rawseq, 'cRawFinalHash', v_rawhash, 'nWarnings', v_warn,
                           'nPendingOrphans', v_pending, 'nDismissedOrphans', v_dismissed, 'cSealNote', v_note,
                           'bDeleted', v_row."dDelDt" IS NOT NULL, 'nIncidents', jsonb_array_length(v_inc), 'seal', v_seal),
        NULL);

    OPEN ref FOR
        SELECT 1 AS msg, CASE v_state WHEN 'K' THEN 'Venue upload complete'
                                      WHEN 'W' THEN 'Venue upload complete with warnings'
                                      ELSE 'Venue upload recorded; held data was dismissed, so the session is forced incomplete' END AS value,
               false AS "bAlready", r."nSesid", r."nCaseid", r."nEdgeid", r."cSyncState",
               v_warn AS "nWarnings", v_pending AS "nPendingOrphans", r."dSealedAt"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_warn_ack   (S-D8: 'W' needs a recorded acknowledgement)
--   in : nSesid, nMasterid (a global admin, a case admin of the session's
--        case, or its hearing operator), cNote?
--   out: msg, value, bAlready, nSesid, cSyncState, dWarnAckAt, nWarnAckBy
--   The session stays 'W'; the gate passes once dWarnAckAt is set (and no
--   orphan is pending).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_warn_ack(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses  uuid;
    v_by   uuid;
    v_note text;
    v_row  public."RSessionMaster"%ROWTYPE;
BEGIN
    v_ses  := public.rtedge_uuid(parameter ->> 'nSesid');
    v_by   := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_note := left(public.rtedge_text(parameter ->> 'cNote'), 400);

    IF v_ses IS NULL OR v_by IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and the acting user are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND OR v_row."dDelDt" IS NOT NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF NOT (public.rtedge_is_admin(v_by) OR public.rtedge_is_case_admin(v_row."nCaseid", v_by)
            OR COALESCE(v_by = v_row."nHearingOpid", false)) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin, case admin or hearing operator rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_row."cSyncState" IS DISTINCT FROM 'W' THEN
        OPEN ref FOR SELECT -2 AS msg, format('Nothing to acknowledge (state %s)', COALESCE(v_row."cSyncState"::text, '-')) AS value, 'STATE' AS "cCode";
        RETURN ref;
    END IF;

    IF v_row."dWarnAckAt" IS NULL THEN
        UPDATE public."RSessionMaster"
           SET "dWarnAckAt" = now(), "nWarnAckBy" = v_by
         WHERE "nSesid" = v_ses;
        PERFORM public.rtedge_event(v_row."nEdgeid", v_ses, 'warn_ack',
            jsonb_build_object('cNote', v_note, 'nWarnings', public.rtedge_incident_warnings(v_row."jIncidents")), v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, 'Warnings acknowledged' AS value, (v_row."dWarnAckAt" IS NOT NULL) AS "bAlready",
               r."nSesid", r."cSyncState", r."dWarnAckAt", r."nWarnAckBy"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_session_forceseal   (route session/forceseal; S-D8, S-D15; the
--                                nearest path for a Part 1 that never seals, O-3)
--   in : nSesid, nMasterid (super-admin), cSealNote (required, <= 200; the
--        watermark interval "INCOMPLETE - venue data missing <interval>")
--   out: msg, value, bAlready, nSesid, cSyncState, cSealNote, dSealedAt,
--        nDismissedOrphans
--   Only from 'S' (end requested or split): a live session is ended first,
--   so a forced close never races its uplink. A soft-deleted session can no
--   longer be ended from RT Production, so it may also be force-closed from
--   'L' (its box already got op 'end'). Pending orphans are dismissed in the
--   same audited action.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_forceseal(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses       uuid;
    v_by        uuid;
    v_note      text;
    v_row       public."RSessionMaster"%ROWTYPE;
    v_dismissed uuid[];
BEGIN
    v_ses  := public.rtedge_uuid(parameter ->> 'nSesid');
    v_by   := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_note := public.rtedge_text(parameter ->> 'cSealNote');

    IF NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Super-admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_ses IS NULL OR v_note IS NULL OR length(v_note) > 200 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and a cSealNote of up to 200 characters are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF NOT (v_row."bEverEdge" OR COALESCE(v_row."cApply" = 'C', false)) THEN
        OPEN ref FOR SELECT -2 AS msg, 'Not a venue or cut-mode session' AS value, 'NOT_GATED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_row."cSyncState" = 'F' THEN
        OPEN ref FOR
            SELECT 1 AS msg, 'Already force-closed' AS value, true AS "bAlready",
                   r."nSesid", r."cSyncState", r."cSealNote", r."dSealedAt", 0 AS "nDismissedOrphans"
              FROM public."RSessionMaster" r
             WHERE r."nSesid" = v_ses;
        RETURN ref;
    END IF;
    IF NOT COALESCE(v_row."cSyncState" = 'S' OR (v_row."cSyncState" = 'L' AND v_row."dDelDt" IS NOT NULL), false) THEN
        OPEN ref FOR SELECT -2 AS msg,
                            CASE WHEN v_row."cSyncState" = 'L' THEN 'End the session (or split it) before a forced close'
                                 ELSE format('The session is sealed (%s)', COALESCE(v_row."cSyncState"::text, '-')) END AS value,
                            'STATE' AS "cCode";
        RETURN ref;
    END IF;

    WITH d AS (
        UPDATE public."RtEdgeOrphan"
           SET "cStatus"     = 'D',
               "cNote"       = left('Dismissed by forced close: ' || v_note, 400),
               "nResolvedBy" = v_by,
               "dResolvedAt" = now()
         WHERE "nSesid" = v_ses AND "cStatus" = 'P'
        RETURNING "nOrphanid"
    )
    SELECT array_agg("nOrphanid") INTO v_dismissed FROM d;

    UPDATE public."RSessionMaster"
       SET "cSyncState" = 'F',
           "cSealNote"  = v_note,
           "dSealedAt"  = now(),
           "cStatus"    = CASE WHEN "cStatus" = 'R' THEN 'C' ELSE "cStatus" END,
           "dUpdatedt"  = now()
     WHERE "nSesid" = v_ses;

    PERFORM public.rtedge_event(v_row."nEdgeid", v_ses, 'forceseal',
        jsonb_build_object('cSealNote', v_note, 'cPrevSyncState', v_row."cSyncState", 'bDeleted', v_row."dDelDt" IS NOT NULL,
                           'dismissedOrphans', COALESCE(to_jsonb(v_dismissed), '[]'::jsonb)),
        v_by);

    OPEN ref FOR
        SELECT 1 AS msg, 'Force-closed as incomplete' AS value, false AS "bAlready",
               r."nSesid", r."cSyncState", r."cSealNote", r."dSealedAt",
               COALESCE(cardinality(v_dismissed), 0) AS "nDismissedOrphans"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rt_transcript_completeness   (ref: 2)  backs assertTranscriptComplete(nSesid, purpose)
--   in : nSesid, cPurpose? ('P' publish, default and strictest | 'X' export)
--   r1 : msg, value, nSesid, bOk (may this purpose proceed), bComplete,
--        cReason (NOT_GATED | COMPLETE | ACKED | FORCED | LIVE |
--        AWAITING_SEAL | PENDING_ORPHANS | NEEDS_ACK | NO_STATE), bGated,
--        cSyncState, nPendingOrphans, nWarnings, jIncidents, dWarnAckAt,
--        nWarnAckBy, bWatermark ('F': INCOMPLETE watermark), cSealNote,
--        bLiveStamp (export of a live session: "Live - as of" stamp),
--        bUploadPending (L or S: realtimedatabysesid uploadPending),
--        cFeedSource, cApply, bEverEdge, nEdgeid, nFinalLines, dSealedAt,
--        nPartNo, nPrevPartSesid, nNextPartSesid
--        (or one msg -1 row: msg, value, cCode NOT_FOUND, bOk false)
--   r2 : the split hearing's parts in order (Part 1 first; one row for an
--        unsplit session): nOrder, nSesid, nPartNo, cName, dStartDt,
--        cFeedSource, cSyncState, bGated, bComplete, cReason, nPendingOrphans,
--        bCurrent. How the gate combines across parts is open (O-4).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rt_transcript_completeness(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses     uuid;
    v_purpose text;
    v_found   boolean;
BEGIN
    v_ses     := public.rtedge_uuid(parameter ->> 'nSesid');
    v_purpose := COALESCE(upper(public.rtedge_text(parameter ->> 'cPurpose')), 'P');
    IF v_purpose NOT IN ('P', 'X') THEN
        v_purpose := 'P';
    END IF;
    v_found := v_ses IS NOT NULL
               AND EXISTS (SELECT 1 FROM public."RSessionMaster" WHERE "nSesid" = v_ses AND "dDelDt" IS NULL);

    IF v_found THEN
        OPEN ref1 FOR
            WITH s AS (
                SELECT r.*,
                       (r."bEverEdge" OR COALESCE(r."cApply" = 'C', false)) AS gated,
                       (SELECT count(*) FROM public."RtEdgeOrphan" o
                         WHERE o."nSesid" = r."nSesid" AND o."cStatus" = 'P')::integer AS pending
                  FROM public."RSessionMaster" r
                 WHERE r."nSesid" = v_ses
            ), v AS (
                SELECT s.*, public.rtedge_gate_reason(s.gated, s."cSyncState", s."dWarnAckAt", s.pending) AS reason
                  FROM s
            )
            SELECT 1 AS msg, v.reason AS value, v."nSesid",
                   (v.reason IN ('NOT_GATED', 'COMPLETE', 'ACKED', 'FORCED') OR (v.reason = 'LIVE' AND v_purpose = 'X')) AS "bOk",
                   (v.reason IN ('COMPLETE', 'ACKED', 'FORCED')) AS "bComplete",
                   v.reason AS "cReason", v.gated AS "bGated", v."cSyncState",
                   v.pending AS "nPendingOrphans", public.rtedge_incident_warnings(v."jIncidents") AS "nWarnings",
                   v."jIncidents", v."dWarnAckAt", v."nWarnAckBy",
                   COALESCE(v.gated AND v."cSyncState" = 'F', false) AS "bWatermark", v."cSealNote",
                   (v.reason = 'LIVE' AND v_purpose = 'X') AS "bLiveStamp",
                   COALESCE(v.gated AND v."cSyncState" IN ('L', 'S'), false) AS "bUploadPending",
                   v."cFeedSource", v."cApply", v."bEverEdge", v."nEdgeid", v."nFinalLines", v."dSealedAt",
                   v."nPartNo", v."nPrevPartSesid", public.rtedge_successor(v."nSesid") AS "nNextPartSesid"
              FROM v;
    ELSE
        OPEN ref1 FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode", false AS "bOk";
    END IF;
    RETURN NEXT ref1;

    -- Walk back to Part 1 (depth-capped against a corrupt cycle), then forward
    -- along the live successors.
    OPEN ref2 FOR
        WITH RECURSIVE up (id, prev, depth) AS (
            SELECT r."nSesid", r."nPrevPartSesid", 0
              FROM public."RSessionMaster" r
             WHERE v_found AND r."nSesid" = v_ses
            UNION ALL
            SELECT p."nSesid", p."nPrevPartSesid", up.depth + 1
              FROM up
              JOIN public."RSessionMaster" p ON p."nSesid" = up.prev AND p."dDelDt" IS NULL
             WHERE up.depth < 32
        ), root AS (
            SELECT id FROM up ORDER BY depth DESC LIMIT 1
        ), down (id, depth) AS (
            SELECT id, 0 FROM root
            UNION ALL
            SELECT c."nSesid", down.depth + 1
              FROM down
              JOIN public."RSessionMaster" c ON c."nPrevPartSesid" = down.id AND c."dDelDt" IS NULL
             WHERE down.depth < 32
        ), parts AS (
            SELECT down.depth, r.*,
                   (r."bEverEdge" OR COALESCE(r."cApply" = 'C', false)) AS gated,
                   (SELECT count(*) FROM public."RtEdgeOrphan" o
                     WHERE o."nSesid" = r."nSesid" AND o."cStatus" = 'P')::integer AS pending
              FROM down
              JOIN public."RSessionMaster" r ON r."nSesid" = down.id
        )
        SELECT (parts.depth + 1) AS "nOrder", parts."nSesid", parts."nPartNo", parts."cName", parts."dStartDt",
               parts."cFeedSource", parts."cSyncState", parts.gated AS "bGated",
               (public.rtedge_gate_reason(parts.gated, parts."cSyncState", parts."dWarnAckAt", parts.pending)
                    IN ('COMPLETE', 'ACKED', 'FORCED')) AS "bComplete",
               public.rtedge_gate_reason(parts.gated, parts."cSyncState", parts."dWarnAckAt", parts.pending) AS "cReason",
               parts.pending AS "nPendingOrphans", (parts."nSesid" = v_ses) AS "bCurrent"
          FROM parts
         ORDER BY parts.depth;
    RETURN NEXT ref2;
END
$function$;

COMMIT;
