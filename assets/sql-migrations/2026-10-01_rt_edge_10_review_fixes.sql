-- 2026-10-01_rt_edge_10_review_fixes.sql
--
-- RT venue edge box: fixes from the 2026-10-02 review of files 01-09. Files
-- 01-09 are already applied on dev; their behaviour is not changed in place.
-- This file replaces four of their functions and adds one:
--
--   et_rtedge_session_bind        (file 06)  #12 the box row is read FOR SHARE, so
--                                            a bind serialises with revoke,
--                                            quarantine and case unassign (they
--                                            lock it FOR UPDATE) and never commits
--                                            onto a box that was revoked or lost
--                                            the case meanwhile.
--                                            G5 a confirmed box that has never
--                                            reported a parser version can take a
--                                            session: cParserVer stays NULL
--                                            ("pending") instead of refusing, and
--                                            is pinned at the box's first hello.
--   et_rtedge_session_parser_pin  (new)      G5 pin a pending session to the
--                                            parser version its box reports.
--   et_rtedge_orphan_insert       (file 08)  #11 the session row is locked (FOR NO
--                                            KEY UPDATE) before bEverEdge is read,
--                                            so a held stream and "Use direct
--                                            cloud instead" serialise: the orphan
--                                            either lands first (the re-bind then
--                                            answers CONFLICT) or sees the re-bound
--                                            'D' session (NOT_GATED).
--                                            #13 the same lock serialises two
--                                            first reports of one nOrphanid: the
--                                            second one finds the committed row and
--                                            extends it instead of answering RETRY.
--   et_rtedge_session_rebind_direct (file 09) #11 the session row is locked FOR
--                                            UPDATE first; the orphan check is a
--                                            separate statement after the lock (a
--                                            fresh snapshot), then the guarded
--                                            UPDATE. The guards are those of file 09.
--   et_rtedge_enroll              (file 05)  #15 a re-enrol keeps the replaced key in
--                                            the 'reenroll' event (cPrevPubKey,
--                                            bPrevTpmKey beside cPrevKeyFpr), so
--                                            seals signed before the re-enrol stay
--                                            verifiable from the database.
--
-- Lock order everywhere: the session row, then the box row (FOR SHARE), then
-- orphan rows (README).
--
-- Every function here is CREATE OR REPLACE of an rt_edge function (or new), so
-- 2026-10-01_rt_edge_99_rollback.sql removes them with the rest; no function
-- that existed before the rt_edge migrations is touched.
--
-- Apply to dev etabella_tech_uuid only (guard below), after files 01-09.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_10_review_fixes: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.et_rtedge_session_bind(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rtedge_orphan_insert(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rtedge_enroll(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rtedge_session_rebind_direct(json, refcursor)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_10_review_fixes: apply 2026-10-01_rt_edge_01 .. 09 first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- et_rtedge_session_bind   (spec 4.2 step 3, source E; replaces file 06)
--   in : nSesid, nEdgeid, nHearingOpid? (a case admin of the case, or a
--        global admin), cParserVer? (defaults to the box's reported version),
--        nMasterid (creator, audit)
--   out: msg, value, bAlready, nSesid, nCaseid, nEdgeid, nIngestEpoch,
--        cSyncState, cParserVer, nHearingOpid, cEdgeName, cLanIp, nCatPort,
--        dLastSeen, bEdgeOnline, bParserPending
--   Sets cFeedSource 'E', bEverEdge, nIngestEpoch 1, cSyncState 'L' and stamps
--   cParserVer: the given one, else the box's reported one. When neither is
--   known (a confirmed box that has not connected yet, G5) the session binds
--   with cParserVer NULL (bParserPending) and et_rtedge_session_parser_pin
--   pins it to what the box reports at its first hello; the box arms an
--   unpinned session under its own parser. Only a fresh session (no feed source
--   yet) of a case assigned to an active box binds; the box row is read
--   FOR SHARE (#12). Repeating the same bind is a no-op success.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_bind(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses    uuid;
    v_edge   uuid;
    v_op_raw text;
    v_op     uuid;
    v_pver   text;
    v_by     uuid;
    v_row    public."RSessionMaster"%ROWTYPE;
    v_node   public."RtEdgeNode"%ROWTYPE;
    v_again  boolean := false;
BEGIN
    v_ses    := public.rtedge_uuid(parameter ->> 'nSesid');
    v_edge   := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_op_raw := public.rtedge_text(parameter ->> 'nHearingOpid');
    v_op     := public.rtedge_uuid(v_op_raw);
    v_pver   := public.rtedge_text(parameter ->> 'cParserVer');
    v_by     := public.rtedge_uuid(parameter ->> 'nMasterid');

    IF v_ses IS NULL OR v_edge IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and nEdgeid are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_op_raw IS NOT NULL AND v_op IS NULL) OR length(v_pver) > 60 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nHearingOpid must be a user id; cParserVer is at most 60 characters' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND OR v_row."dDelDt" IS NOT NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    -- #12: FOR SHARE waits behind et_rtedge_revoke / _quarantine / _case_set (FOR UPDATE on this row) and then
    -- re-reads the committed status and case list; their aggregates in turn wait for this bind to commit.
    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_edge AND "dDelDt" IS NULL FOR SHARE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    v_again := COALESCE(v_row."cFeedSource" = 'E' AND v_row."nEdgeid" = v_edge AND v_row."cSyncState" = 'L', false);
    IF NOT v_again THEN
        IF v_node."cStatus" <> 'A' THEN
            OPEN ref FOR SELECT -2 AS msg, format('The venue box is not active (status %s)', v_node."cStatus") AS value,
                                CASE WHEN v_node."cStatus" = 'Q' THEN 'QUARANTINED' ELSE 'NOT_ACTIVE' END AS "cCode";
            RETURN ref;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public."RtEdgeCase" WHERE "nEdgeid" = v_edge AND "nCaseid" = v_row."nCaseid") THEN
            OPEN ref FOR SELECT -2 AS msg, 'This case is not assigned to the venue box' AS value, 'UNASSIGNED_CASE' AS "cCode";
            RETURN ref;
        END IF;
        IF v_row."cFeedSource" IS NOT NULL OR v_row."cSyncState" IS NOT NULL OR v_row."bEverEdge" THEN
            OPEN ref FOR SELECT -2 AS msg, format('The session already has a feed source (%s)', COALESCE(v_row."cFeedSource"::text, '-')) AS value,
                                'STATE' AS "cCode";
            RETURN ref;
        END IF;
        IF v_row."cStatus" = 'C' THEN
            OPEN ref FOR SELECT -2 AS msg, 'The session has ended' AS value, 'STATE' AS "cCode";
            RETURN ref;
        END IF;
        IF v_op IS NOT NULL AND NOT (public.rtedge_is_case_admin(v_row."nCaseid", v_op) OR public.rtedge_is_admin(v_op)) THEN
            OPEN ref FOR SELECT -1 AS msg, 'The hearing operator must be a case admin of this case' AS value, 'INVALID' AS "cCode";
            RETURN ref;
        END IF;
        -- G5: NULL when neither the caller nor the box knows the version yet (pinned at the first hello).
        v_pver := COALESCE(v_pver, v_node."cParserVer");

        UPDATE public."RSessionMaster"
           SET "cFeedSource"  = 'E',
               "bEverEdge"    = true,
               "nEdgeid"      = v_edge,
               "nIngestEpoch" = 1,
               "nRebaseSeq"   = NULL,
               "cApply"       = NULL,
               "cSyncState"   = 'L',
               "cParserVer"   = v_pver,
               "nHearingOpid" = v_op,
               "dUpdatedt"    = now()
         WHERE "nSesid" = v_ses;

        PERFORM public.rtedge_event(v_edge, v_ses, 'bind',
            jsonb_build_object('nCaseid', v_row."nCaseid", 'cParserVer', v_pver, 'bParserPending', v_pver IS NULL,
                               'nHearingOpid', v_op), v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, CASE WHEN v_again THEN 'Session already bound to this venue box' ELSE 'Session bound to the venue box' END AS value,
               v_again AS "bAlready", r."nSesid", r."nCaseid", r."nEdgeid", r."nIngestEpoch", r."cSyncState", r."cParserVer",
               r."nHearingOpid", n."cName" AS "cEdgeName", host(n."cLanIp") AS "cLanIp", n."nCatPort", n."dLastSeen",
               COALESCE(n."dLastSeen" > now() - interval '2 minutes', false) AS "bEdgeOnline",
               (r."cParserVer" IS NULL) AS "bParserPending"
          FROM public."RSessionMaster" r
          JOIN public."RtEdgeNode" n ON n."nEdgeid" = r."nEdgeid"
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_session_parser_pin   (G5; spec 4.2 "stamps cParserVer", DET-10)
--   in : nSesid, nEdgeid (the box that reported the version in its hello),
--        cParserVer (that box's FEED_PARSE_VERSION, <= 60)
--   out: msg, value, bPinned, nSesid, cParserVer (the session's version after
--        the call: the one just pinned, or one pinned before)
--   Pins only a session bound with no parser version ('E' on that box, not
--   sealed). Once pinned the version never changes here: a box reporting
--   another one is the service's PARSER_MISMATCH freeze (O-1). msg -1 INVALID /
--   NOT_FOUND, -2 NOT_BOUND (not an 'E' session of that box).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_parser_pin(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses    uuid;
    v_edge   uuid;
    v_pver   text;
    v_row    public."RSessionMaster"%ROWTYPE;
    v_pinned boolean := false;
BEGIN
    v_ses  := public.rtedge_uuid(parameter ->> 'nSesid');
    v_edge := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_pver := public.rtedge_text(parameter ->> 'cParserVer');

    IF v_ses IS NULL OR v_edge IS NULL OR v_pver IS NULL OR length(v_pver) > 60 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid, nEdgeid and a cParserVer of up to 60 characters are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF v_row."cFeedSource" IS DISTINCT FROM 'E' OR v_row."nEdgeid" IS DISTINCT FROM v_edge THEN
        OPEN ref FOR SELECT -2 AS msg, 'The session is not bound to this venue box' AS value, 'NOT_BOUND' AS "cCode";
        RETURN ref;
    END IF;

    IF v_row."cParserVer" IS NULL AND v_row."cSyncState" IN ('L', 'S') THEN
        UPDATE public."RSessionMaster"
           SET "cParserVer" = v_pver,
               "dUpdatedt"  = now()
         WHERE "nSesid" = v_ses;
        v_pinned := true;
        PERFORM public.rtedge_event(v_edge, v_ses, 'parser_pin', jsonb_build_object('cParserVer', v_pver), NULL);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, CASE WHEN v_pinned THEN 'Parser version pinned' ELSE 'Unchanged' END AS value,
               v_pinned AS "bPinned", r."nSesid", r."cParserVer"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_orphan_insert   (replaces file 08; contract unchanged)
--   in : nSesid (a gated session: ever-edge or cut mode), cKind ('H' | 'C'),
--        nOrphanid? (idempotency key: a repeat with the same id extends that
--        row instead of adding one), nEdgeid? (required for 'C': the holding
--        box, which must be the session's box), nEpoch?, bInTranscript?,
--        cUser?, cPeer?, nFromSeq?, nToSeq?, dFrom?, dTo?, cObjectKey?,
--        cLinesKey?, cSha256?, nBytes? (the stream's total held bytes so far)
--   out: msg, value, bDuplicate, bReopened, nOrphanid, nSesid, cKind,
--        cStatus, nBytes, nSessionHeldBytes, nTotalHeldBytes
--   As file 08, plus (#11, #13): the session row is locked FOR NO KEY UPDATE
--   before bEverEdge is read. A concurrent et_rtedge_session_rebind_direct
--   (FOR UPDATE on the same row) is serialised with it, and so is a second
--   first report of the same nOrphanid: it waits, then finds the committed row
--   and extends it. RETRY remains only for a key collision across sessions.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_orphan_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses       uuid;
    v_kind      text;
    v_oid_raw   text;
    v_oid       uuid;
    v_edge_raw  text;
    v_edge      uuid;
    v_epoch_raw text;
    v_epoch     integer;
    v_intx      boolean;
    v_user      text;
    v_peer_raw  text;
    v_peer      inet;
    v_from_raw  text;
    v_from      bigint;
    v_to_raw    text;
    v_to        bigint;
    v_dfrom_raw text;
    v_dfrom     timestamptz;
    v_dto_raw   text;
    v_dto       timestamptz;
    v_obj       text;
    v_lines     text;
    v_sha       text;
    v_bytes_raw text;
    v_bytes     bigint;
    v_row       public."RSessionMaster"%ROWTYPE;
    v_old       public."RtEdgeOrphan"%ROWTYPE;
    v_dup       boolean := false;
    v_grew      boolean := false;
    v_reopen    boolean := false;
BEGIN
    v_ses       := public.rtedge_uuid(parameter ->> 'nSesid');
    v_kind      := upper(public.rtedge_text(parameter ->> 'cKind'));
    v_oid_raw   := public.rtedge_text(parameter ->> 'nOrphanid');
    v_oid       := public.rtedge_uuid(v_oid_raw);
    v_edge_raw  := public.rtedge_text(parameter ->> 'nEdgeid');
    v_edge      := public.rtedge_uuid(v_edge_raw);
    v_epoch_raw := public.rtedge_text(parameter ->> 'nEpoch');
    v_epoch     := public.rtedge_int(v_epoch_raw);
    v_intx      := COALESCE(public.rtedge_bool(parameter ->> 'bInTranscript'), false);
    v_user      := public.rtedge_text(parameter ->> 'cUser');
    v_peer_raw  := public.rtedge_text(parameter ->> 'cPeer');
    v_peer      := public.rtedge_inet(v_peer_raw);
    v_from_raw  := public.rtedge_text(parameter ->> 'nFromSeq');
    v_from      := public.rtedge_bigint(v_from_raw);
    v_to_raw    := public.rtedge_text(parameter ->> 'nToSeq');
    v_to        := public.rtedge_bigint(v_to_raw);
    v_dfrom_raw := public.rtedge_text(parameter ->> 'dFrom');
    v_dto_raw   := public.rtedge_text(parameter ->> 'dTo');
    v_obj       := public.rtedge_text(parameter ->> 'cObjectKey');
    v_lines     := public.rtedge_text(parameter ->> 'cLinesKey');
    v_sha       := lower(public.rtedge_text(parameter ->> 'cSha256'));
    v_bytes_raw := public.rtedge_text(parameter ->> 'nBytes');
    v_bytes     := public.rtedge_bigint(v_bytes_raw);

    -- timestamptz parsing (ISO strings from JSON.stringify(Date)); NULL on garbage.
    BEGIN
        v_dfrom := v_dfrom_raw::timestamptz;
    EXCEPTION WHEN others THEN
        v_dfrom := NULL;
    END;
    BEGIN
        v_dto := v_dto_raw::timestamptz;
    EXCEPTION WHEN others THEN
        v_dto := NULL;
    END;

    IF v_ses IS NULL OR v_kind IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and cKind are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF v_kind NOT IN ('H', 'C') THEN
        OPEN ref FOR SELECT -1 AS msg,
                            CASE WHEN v_kind = 'F' THEN 'Fenced edge tails (F) belong to Phase-4 failover'
                                 WHEN v_kind = 'U' THEN 'Unclaimed captures (U) were removed (D3, D27)'
                                 ELSE 'cKind must be H or C' END AS value,
                            'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_oid_raw IS NOT NULL AND v_oid IS NULL) OR (v_edge_raw IS NOT NULL AND v_edge IS NULL)
       OR (v_epoch_raw IS NOT NULL AND v_epoch IS NULL) OR (v_peer_raw IS NOT NULL AND v_peer IS NULL)
       OR (v_from_raw IS NOT NULL AND (v_from IS NULL OR v_from < 0)) OR (v_to_raw IS NOT NULL AND (v_to IS NULL OR v_to < 0))
       OR (v_from IS NOT NULL AND v_to IS NOT NULL AND v_to < v_from)
       OR (v_dfrom_raw IS NOT NULL AND v_dfrom IS NULL) OR (v_dto_raw IS NOT NULL AND v_dto IS NULL)
       OR (v_bytes_raw IS NOT NULL AND (v_bytes IS NULL OR v_bytes < 0))
       OR (v_sha IS NOT NULL AND v_sha !~ '^[0-9a-f]{64}$')
       OR length(v_user) > 64 THEN
        OPEN ref FOR SELECT -1 AS msg, 'A field is malformed (ids, seqs, times, peer, byte count, sha256 hex, cUser <= 64)' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    -- #11 / #13: lock the session row first (lock order: session, then orphan rows). A concurrent re-bind to direct
    -- cloud or another first report of this nOrphanid waits here, and this read sees what they committed.
    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR NO KEY UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    -- Only the gate's sessions hold streams: an orphan on any other session
    -- would never block publish.
    IF NOT (v_row."bEverEdge" OR COALESCE(v_row."cApply" = 'C', false)) THEN
        OPEN ref FOR SELECT -2 AS msg, 'Held streams belong to venue (or cut-mode) sessions only' AS value, 'NOT_GATED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_kind = 'C' AND (v_edge IS NULL OR v_edge IS DISTINCT FROM v_row."nEdgeid") THEN
        OPEN ref FOR SELECT -2 AS msg, 'A held CAT connection must come from the session''s venue box' AS value, 'NOT_BOUND' AS "cCode";
        RETURN ref;
    END IF;
    v_edge := COALESCE(v_edge, v_row."nEdgeid");

    -- Idempotency: the same id extends its row (a held stream grows).
    IF v_oid IS NOT NULL THEN
        SELECT * INTO v_old FROM public."RtEdgeOrphan" WHERE "nOrphanid" = v_oid FOR UPDATE;
        IF FOUND THEN
            IF v_old."nSesid" IS DISTINCT FROM v_ses OR v_old."cKind" <> v_kind THEN
                OPEN ref FOR SELECT -2 AS msg, 'nOrphanid belongs to another session or kind' AS value, 'CONFLICT' AS "cCode";
                RETURN ref;
            END IF;
            v_grew := (v_to IS NOT NULL AND (v_old."nToSeq" IS NULL OR v_to > v_old."nToSeq"))
                   OR (v_dto IS NOT NULL AND (v_old."dTo" IS NULL OR v_dto > v_old."dTo"))
                   OR (v_bytes IS NOT NULL AND (v_old."nBytes" IS NULL OR v_bytes > v_old."nBytes"))
                   OR (v_sha IS NOT NULL AND v_old."cSha256" IS NOT NULL AND v_sha <> v_old."cSha256");
            v_reopen := v_old."cStatus" <> 'P' AND v_grew;
            IF v_old."cStatus" = 'P' OR v_reopen THEN
                UPDATE public."RtEdgeOrphan"
                   SET "nToSeq"      = GREATEST("nToSeq", v_to),
                       "dTo"         = GREATEST("dTo", v_dto),
                       "cObjectKey"  = COALESCE(v_obj, "cObjectKey"),
                       "cLinesKey"   = COALESCE(v_lines, "cLinesKey"),
                       "cSha256"     = COALESCE(v_sha, "cSha256"),
                       "nBytes"      = GREATEST("nBytes", v_bytes),
                       "cStatus"     = 'P',
                       "cNote"       = CASE WHEN v_reopen THEN NULL ELSE "cNote" END,
                       "nResolvedBy" = CASE WHEN v_reopen THEN NULL ELSE "nResolvedBy" END,
                       "dResolvedAt" = CASE WHEN v_reopen THEN NULL ELSE "dResolvedAt" END
                 WHERE "nOrphanid" = v_oid;
            ELSE
                -- Resolved and not grown: only fill in what was unknown.
                UPDATE public."RtEdgeOrphan"
                   SET "cObjectKey" = COALESCE("cObjectKey", v_obj),
                       "cLinesKey"  = COALESCE("cLinesKey", v_lines),
                       "cSha256"    = COALESCE("cSha256", v_sha)
                 WHERE "nOrphanid" = v_oid
                   AND (("cObjectKey" IS NULL AND v_obj IS NOT NULL) OR ("cLinesKey" IS NULL AND v_lines IS NOT NULL)
                        OR ("cSha256" IS NULL AND v_sha IS NOT NULL));
            END IF;
            IF v_reopen THEN
                PERFORM public.rtedge_event(v_edge, v_ses, 'orphan_reopen',
                    jsonb_build_object('nOrphanid', v_oid, 'cKind', v_kind, 'cPrevStatus', v_old."cStatus",
                                       'cPrevNote', v_old."cNote", 'nPrevResolvedBy', v_old."nResolvedBy",
                                       'nPrevToSeq', v_old."nToSeq", 'nToSeq', v_to, 'dPrevTo', v_old."dTo", 'dTo', v_dto,
                                       'nPrevBytes', v_old."nBytes", 'nBytes', v_bytes),
                    NULL);
            END IF;
            v_dup := true;
        END IF;
    ELSIF v_sha IS NOT NULL THEN
        -- A retried report of the same capture (same bytes) returns the existing row.
        SELECT o."nOrphanid" INTO v_oid
          FROM public."RtEdgeOrphan" o
         WHERE o."nSesid" = v_ses AND o."cKind" = v_kind AND o."cSha256" = v_sha
         ORDER BY o."dCreatedt"
         LIMIT 1;
        v_dup := v_oid IS NOT NULL;
    END IF;

    IF NOT v_dup THEN
        INSERT INTO public."RtEdgeOrphan"
               ("nOrphanid", "nSesid", "nEdgeid", "nEpoch", "cKind", "bInTranscript", "cUser", "cPeer",
                "nFromSeq", "nToSeq", "dFrom", "dTo", "cObjectKey", "cLinesKey", "cSha256", "nBytes")
        VALUES (COALESCE(v_oid, gen_random_uuid()), v_ses, v_edge, COALESCE(v_epoch, v_row."nIngestEpoch"), v_kind, v_intx, v_user, v_peer,
                v_from, v_to, v_dfrom, v_dto, v_obj, v_lines, v_sha, v_bytes)
        RETURNING "nOrphanid" INTO v_oid;

        PERFORM public.rtedge_event(v_edge, v_ses, 'orphan',
            jsonb_build_object('nOrphanid', v_oid, 'cKind', v_kind, 'cUser', v_user, 'cPeer', host(v_peer),
                               'nBytes', v_bytes, 'bInTranscript', v_intx),
            NULL);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg,
               CASE WHEN v_reopen THEN 'Orphan reopened: the held stream grew after it was resolved'
                    WHEN v_dup THEN 'Orphan already recorded'
                    ELSE 'Orphan recorded' END AS value,
               v_dup AS "bDuplicate", v_reopen AS "bReopened",
               o."nOrphanid", o."nSesid", o."cKind", o."cStatus", o."nBytes",
               (SELECT COALESCE(sum(x."nBytes"), 0) FROM public."RtEdgeOrphan" x
                 WHERE x."nSesid" = o."nSesid" AND x."cKind" = o."cKind" AND x."cStatus" = 'P')::bigint AS "nSessionHeldBytes",
               (SELECT COALESCE(sum(x."nBytes"), 0) FROM public."RtEdgeOrphan" x
                 WHERE x."cKind" = o."cKind" AND x."cStatus" = 'P')::bigint AS "nTotalHeldBytes"
          FROM public."RtEdgeOrphan" o
         WHERE o."nOrphanid" = v_oid;
    RETURN ref;
EXCEPTION
    WHEN unique_violation THEN
        -- The same nOrphanid already belongs to a row of another session (the session lock serialises reports of
        -- one session); the caller retries once and then gets CONFLICT.
        OPEN ref FOR SELECT -2 AS msg, 'The orphan was recorded concurrently; retry' AS value, 'RETRY' AS "cCode";
        RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_session_rebind_direct   (O-8 "Use direct cloud instead"; replaces
--                                    file 09, same contract and guards)
--   in : nSesid, nEdgeid (the box the session is bound to)
--   out: msg, value, nSesid, nCaseid
--        msg -1 INVALID (a missing or malformed id);
--        msg -2 CONFLICT when nothing was re-bound: the session is not (or no
--        longer) a live, never-fed 'E' session on that box.
--   #11: the session row is locked FOR UPDATE first; the orphan check is its
--   own statement after the lock (a fresh snapshot sees an orphan committed by
--   a held stream that got the lock first); then the guarded UPDATE (file 09's
--   SET list and guards). et_rtedge_orphan_insert locks the same row, so the two
--   always serialise: NOT_GATED for the stream or CONFLICT here.
--   bEverEdge IS CLEARED HERE, the documented exception of file 09's header.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_rebind_direct(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses  uuid;
    v_edge uuid;
    v_case uuid;
    v_row  public."RSessionMaster"%ROWTYPE;
BEGIN
    v_ses  := public.rtedge_uuid(parameter ->> 'nSesid');
    v_edge := public.rtedge_uuid(parameter ->> 'nEdgeid');

    IF v_ses IS NULL OR v_edge IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and nEdgeid are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND
       OR EXISTS (SELECT 1 FROM public."RtEdgeOrphan" o WHERE o."nSesid" = v_ses) THEN
        OPEN ref FOR SELECT -2 AS msg, 'The session is no longer a live, never-fed session on this venue box' AS value,
                            'CONFLICT' AS "cCode";
        RETURN ref;
    END IF;

    UPDATE public."RSessionMaster" r
       SET "cFeedSource"     = 'D',
           "cApply"          = 'L',
           "nEdgeid"         = NULL,
           "bEverEdge"       = false,   -- the documented exception to "never cleared" (file 09 header)
           "cSyncState"      = NULL,
           "nIngestEpoch"    = 1,
           "nRebaseSeq"      = NULL,
           "nAppliedRawSeq"  = NULL,
           "cAppliedRawHash" = NULL,
           "dUpdatedt"       = now()
     WHERE r."nSesid" = v_ses
       AND r."nEdgeid" = v_edge
       AND r."cFeedSource" = 'E'
       AND r."cSyncState" = 'L'
       AND r."dDelDt" IS NULL
       AND r."nAppliedRawSeq" IS NULL
       AND NOT EXISTS (SELECT 1 FROM public."RtEdgeOrphan" o WHERE o."nSesid" = r."nSesid")
    RETURNING r."nCaseid" INTO v_case;

    IF NOT FOUND THEN
        OPEN ref FOR SELECT -2 AS msg, 'The session is no longer a live, never-fed session on this venue box' AS value,
                            'CONFLICT' AS "cCode";
        RETURN ref;
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, 'The session now feeds the cloud directly' AS value, v_ses AS "nSesid", v_case AS "nCaseid";
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_enroll   (device; the route is public and rate-limited;
--                     replaces file 05, same contract)
--   in : cEnrollHash (sha256 hex of the code the box presents, computed by
--        the service), cPubKey (standard base64 P-256 SPKI), bTpmKey?,
--        cVersion?, cParserVer?, cLanIp?
--   out: msg, value, nEdgeid, cSlug, cKeyFpr, cStatus
--   As file 05, plus #15: the 'reenroll' event keeps the key it replaces
--   (cPrevPubKey, bPrevTpmKey beside cPrevKeyFpr). RtEdgeNode keeps the
--   current key; that key and the chain of 'reenroll' events verify every
--   seal the box ever signed (spec 5.7; et_rtedge_revoke keeps the key too).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_enroll(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_hash    text;
    v_pub     text;
    v_der     bytea;
    v_fpr     text;
    v_tpm     boolean;
    v_ver     text;
    v_pver    text;
    v_lan_raw text;
    v_lan     inet;
    v_node    public."RtEdgeNode"%ROWTYPE;
BEGIN
    v_hash    := lower(public.rtedge_text(parameter ->> 'cEnrollHash'));
    v_pub     := regexp_replace(COALESCE(parameter ->> 'cPubKey', ''), '[[:space:]]', '', 'g');
    v_tpm     := COALESCE(public.rtedge_bool(parameter ->> 'bTpmKey'), false);
    v_ver     := public.rtedge_text(parameter ->> 'cVersion');
    v_pver    := public.rtedge_text(parameter ->> 'cParserVer');
    v_lan_raw := public.rtedge_text(parameter ->> 'cLanIp');
    v_lan     := public.rtedge_inet(v_lan_raw);

    IF v_hash IS NULL OR v_hash !~ '^[0-9a-f]{64}$' THEN
        OPEN ref FOR SELECT -1 AS msg, 'Invalid or expired enrollment code' AS value, 'INVALID_CODE' AS "cCode";
        RETURN ref;
    END IF;
    v_der := public.rtedge_p256_spki(v_pub);
    IF v_der IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'cPubKey must be a base64 P-256 SubjectPublicKeyInfo' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_lan_raw IS NOT NULL AND v_lan IS NULL) OR length(v_ver) > 40 OR length(v_pver) > 60 THEN
        OPEN ref FOR SELECT -1 AS msg, 'cLanIp, cVersion (40) or cParserVer (60) is invalid' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode"
     WHERE "cEnrollHash" = v_hash AND "dDelDt" IS NULL
       FOR UPDATE;
    IF NOT FOUND OR v_node."cStatus" = 'X' THEN
        OPEN ref FOR SELECT -1 AS msg, 'Invalid or expired enrollment code' AS value, 'INVALID_CODE' AS "cCode";
        RETURN ref;
    END IF;
    IF v_node."dEnrollExp" IS NULL OR v_node."dEnrollExp" <= now() THEN
        UPDATE public."RtEdgeNode" SET "cEnrollHash" = NULL, "dEnrollExp" = NULL WHERE "nEdgeid" = v_node."nEdgeid";
        PERFORM public.rtedge_event(v_node."nEdgeid", NULL, 'enroll_expired', NULL, NULL);
        OPEN ref FOR SELECT -1 AS msg, 'Invalid or expired enrollment code' AS value, 'INVALID_CODE' AS "cCode";
        RETURN ref;
    END IF;

    v_fpr := encode(sha256(v_der), 'hex');

    UPDATE public."RtEdgeNode"
       SET "cPubKey"     = replace(encode(v_der, 'base64'), chr(10), ''),
           "cKeyFpr"     = v_fpr,
           "bTpmKey"     = v_tpm,
           "cStatus"     = 'C',
           "cEnrollHash" = NULL,
           "dEnrollExp"  = NULL,
           "cVersion"    = COALESCE(v_ver, "cVersion"),
           "cParserVer"  = COALESCE(v_pver, "cParserVer"),
           "cLanIp"      = COALESCE(v_lan, "cLanIp")
     WHERE "nEdgeid" = v_node."nEdgeid";

    -- Any re-enroll or key change raises an alert and needs the same confirmation (spec 3.4). The replaced key
    -- (a public key, never a secret) stays in the audit trail so the seals it signed stay verifiable (#15).
    PERFORM public.rtedge_event(v_node."nEdgeid", NULL,
        CASE WHEN v_node."cPubKey" IS NULL THEN 'enroll' ELSE 'reenroll' END,
        jsonb_build_object('cKeyFpr', v_fpr, 'cPrevKeyFpr', v_node."cKeyFpr", 'cPrevPubKey', v_node."cPubKey",
                           'bPrevTpmKey', CASE WHEN v_node."cPubKey" IS NULL THEN NULL ELSE v_node."bTpmKey" END,
                           'cPrevStatus', v_node."cStatus", 'bTpmKey', v_tpm, 'nEnrollBy', v_node."nEnrollBy",
                           'cVersion', v_ver, 'cParserVer', v_pver),
        NULL);

    OPEN ref FOR
        SELECT 1 AS msg, 'Key presented; an admin must confirm the fingerprint' AS value,
               n."nEdgeid", n."cSlug", n."cKeyFpr", n."cStatus"
          FROM public."RtEdgeNode" n
         WHERE n."nEdgeid" = v_node."nEdgeid";
    RETURN ref;
END
$function$;

COMMIT;
