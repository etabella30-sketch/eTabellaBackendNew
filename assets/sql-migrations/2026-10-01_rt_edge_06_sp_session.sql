-- 2026-10-01_rt_edge_06_sp_session.sql
--
-- RT venue edge box: session lifecycle (spec rev 3, sections 4.2-4.5, 4.7, 4.9,
-- 5.5; D1, D7, D19, D27, D29).
--
--   et_rtedge_session_bind    create path 'E': bind a fresh session to a box
--   et_rtedge_session_direct  create path 'D': cFeedSource 'D' + cApply C/L
--   et_rtedge_session_end     RT Production Stop on a gated session: 'L' -> 'S'
--   et_rtedge_session_split   D7 "Split to direct cloud": Part 1 -> 'S', new
--                             linked Part 2 'D' in the same transaction
--   et_rtedge_applied         throttled (appliedRawSeq, appliedRawHash) watermark
--   et_rtedge_anchor_ids      mark identities of a session (REBASE, DET-12)
--
-- Sessions are created only in cloud admin (D27): there is no box-side create,
-- adopt or capture-claim SP. In-session failover (et_rtedge_session_switch)
-- is Phase 4 (D1) and is not part of this migration.
--
-- Conventions: see file 05 (msg 1 / -1 / -2 / -3, "cCode", "nMasterid" is the
-- verified acting user).
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 04.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_06_sp_session: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.rtedge_event(uuid, uuid, text, jsonb, uuid)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_06_sp_session: apply 2026-10-01_rt_edge_04_helpers.sql first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- et_rtedge_session_bind   (spec 4.2 step 3, source E)
--   in : nSesid, nEdgeid, nHearingOpid? (a case admin of the case, or a
--        global admin), cParserVer? (defaults to the box's reported version),
--        nMasterid (creator, audit)
--   out: msg, value, bAlready, nSesid, nCaseid, nEdgeid, nIngestEpoch,
--        cSyncState, cParserVer, nHearingOpid, cEdgeName, cLanIp, nCatPort,
--        dLastSeen, bEdgeOnline
--   Sets cFeedSource 'E', bEverEdge, nIngestEpoch 1, cSyncState 'L' and pins
--   cParserVer. Only a fresh session (no feed source yet) of a case assigned
--   to an active box binds. Repeating the same bind is a no-op success.
--   The response feeds cHost = cLanIp, nPort = nCatPort.
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
    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_edge AND "dDelDt" IS NULL;
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
        v_pver := COALESCE(v_pver, v_node."cParserVer");
        IF v_pver IS NULL THEN
            OPEN ref FOR SELECT -1 AS msg, 'The parser version is unknown: the box has not reported one' AS value, 'INVALID' AS "cCode";
            RETURN ref;
        END IF;

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
            jsonb_build_object('nCaseid', v_row."nCaseid", 'cParserVer', v_pver, 'nHearingOpid', v_op), v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, CASE WHEN v_again THEN 'Session already bound to this venue box' ELSE 'Session bound to the venue box' END AS value,
               v_again AS "bAlready", r."nSesid", r."nCaseid", r."nEdgeid", r."nIngestEpoch", r."cSyncState", r."cParserVer",
               r."nHearingOpid", n."cName" AS "cEdgeName", host(n."cLanIp") AS "cLanIp", n."nCatPort", n."dLastSeen",
               COALESCE(n."dLastSeen" > now() - interval '2 minutes', false) AS "bEdgeOnline"
          FROM public."RSessionMaster" r
          JOIN public."RtEdgeNode" n ON n."nEdgeid" = r."nEdgeid"
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_session_direct   (spec 4.1, 4.2 step 3, source D)
--   in : nSesid, cApply ('C' cut mode | 'L' legacy; from ECLIPSE_CUT_APPLY at
--        create), cParserVer (required for 'C'), nMasterid (audit)
--   out: msg, value, bAlready, nSesid, cFeedSource, cApply, cSyncState, cParserVer
--   'C' sessions are gated like edge sessions (cSyncState 'L'), which is why
--   cut mode stays off in production until this migration and the gate are
--   deployed (D29). A session never changes mode mid-hearing.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_direct(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses   uuid;
    v_apply text;
    v_pver  text;
    v_by    uuid;
    v_row   public."RSessionMaster"%ROWTYPE;
    v_again boolean := false;
BEGIN
    v_ses   := public.rtedge_uuid(parameter ->> 'nSesid');
    v_apply := upper(public.rtedge_text(parameter ->> 'cApply'));
    v_pver  := public.rtedge_text(parameter ->> 'cParserVer');
    v_by    := public.rtedge_uuid(parameter ->> 'nMasterid');

    IF v_ses IS NULL OR v_apply IS NULL OR v_apply NOT IN ('C', 'L') THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and cApply (C or L) are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_apply = 'C' AND v_pver IS NULL) OR length(v_pver) > 60 THEN
        OPEN ref FOR SELECT -1 AS msg, 'Cut mode needs cParserVer (at most 60 characters)' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND OR v_row."dDelDt" IS NOT NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    v_again := COALESCE(v_row."cFeedSource" = 'D' AND v_row."cApply" = v_apply, false);
    IF NOT v_again THEN
        IF v_row."cFeedSource" IS NOT NULL OR v_row."cSyncState" IS NOT NULL OR v_row."bEverEdge" THEN
            OPEN ref FOR SELECT -2 AS msg, format('The session already has a feed source (%s)', COALESCE(v_row."cFeedSource"::text, '-')) AS value,
                                'STATE' AS "cCode";
            RETURN ref;
        END IF;

        UPDATE public."RSessionMaster"
           SET "cFeedSource" = 'D',
               "cApply"      = v_apply,
               "cSyncState"  = CASE WHEN v_apply = 'C' THEN 'L' END,
               "cParserVer"  = v_pver,
               "dUpdatedt"   = now()
         WHERE "nSesid" = v_ses;

        PERFORM public.rtedge_event(NULL, v_ses, 'direct', jsonb_build_object('cApply', v_apply, 'cParserVer', v_pver), v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, 'Direct-to-cloud session' AS value, v_again AS "bAlready",
               r."nSesid", r."cFeedSource", r."cApply", r."cSyncState", r."cParserVer"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_session_end   (spec 4.4 "End from the cloud")
--   in : nSesid, nMasterid (audit)
--   out: msg, value, bGated, bPending, bSealed, bChanged, nSesid, cSyncState,
--        cFeedSource, cApply, nEdgeid
--   Not gated (neither ever-edge nor cut mode): nothing changes, bGated false,
--   and the caller runs today's end path. Gated and live: cStatus 'C' (lane
--   and liveness show "ended"), cSyncState 'S', bPending true; the caller
--   pushes c.assign{op:'end'} to nEdgeid and DEFERS feedData.sessionEnd, route
--   removal and on-notification 'E' until the seal. Calling the legacy SP 'C'
--   as well is harmless. Already sealed: bSealed true.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_end(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses     uuid;
    v_by      uuid;
    v_row     public."RSessionMaster"%ROWTYPE;
    v_gated   boolean;
    v_changed boolean := false;
BEGIN
    v_ses := public.rtedge_uuid(parameter ->> 'nSesid');
    v_by  := public.rtedge_uuid(parameter ->> 'nMasterid');

    IF v_ses IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid is required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND OR v_row."dDelDt" IS NOT NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    v_gated := v_row."bEverEdge" OR COALESCE(v_row."cApply" = 'C', false);

    IF v_gated AND (v_row."cSyncState" IS NULL OR v_row."cSyncState" = 'L') THEN
        UPDATE public."RSessionMaster"
           SET "cSyncState" = 'S',
               "cStatus"    = 'C',
               "dUpdatedt"  = now()
         WHERE "nSesid" = v_ses;
        v_changed := true;
        PERFORM public.rtedge_event(v_row."nEdgeid", v_ses, 'end_request',
            jsonb_build_object('cFeedSource', v_row."cFeedSource", 'cApply', v_row."cApply", 'cPrevStatus', v_row."cStatus"), v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg,
               CASE WHEN NOT v_gated THEN 'Not a venue or cut-mode session: end it as today'
                    WHEN r."cSyncState" = 'S' THEN 'End requested; waiting for the venue seal'
                    ELSE 'Already sealed' END AS value,
               v_gated AS "bGated",
               (v_gated AND r."cSyncState" = 'S') AS "bPending",
               (v_gated AND r."cSyncState" IN ('K', 'W', 'F')) AS "bSealed",
               v_changed AS "bChanged",
               r."nSesid", r."cSyncState", r."cFeedSource", r."cApply", r."nEdgeid"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_session_split   (D7 "Split to direct cloud"; name and numbering
--                            settle O-6, see README)
--   in : nSesid (Part 1, a box session in 'L' or 'S'), nMasterid (a global
--        admin or the session's hearing operator), cUnicuserid? (Part 2's
--        per-session id, S-D10; 'sess:<uuid>' generated when absent),
--        cApply? ('L' default | 'C' from ECLIPSE_CUT_APPLY), cParserVer?
--        (required for 'C'), cName? (default "<Part 1 name> (Part N)"),
--        dStartDt? (hearing wall clock; default now in the session's zone),
--        cEclipseUsername? (audit only), cNote?
--   out: msg, value, bAlready, nSesid (Part 1), nPart2Sesid, nPartNo (Part 2),
--        nCaseid, cName, dStartDt, cUnicuserid, cApply, cSyncState, nLines,
--        cTimezone, cProtocol, nEdgeid (Part 1's box: push op 'end'),
--        nAssigneesCopied
--   One transaction: Part 1 -> cSyncState 'S', cStatus 'C', nPartNo 1 when
--   unset; Part 2 inserted live ('R') as cFeedSource 'D', linked by
--   nPrevPartSesid / nPartNo, with Part 1's session assignees (RSessionDetail)
--   copied so nobody loses the live transcript. The Eclipse username and
--   password HASH are copied in the route file by the service (they are not
--   in the DB); the copy is audited here ('split', bCredentialCopy) and the
--   service records the route outcome with et_rtedge_event_insert. A repeat
--   returns the existing Part 2 (bAlready).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_split(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses       uuid;
    v_by        uuid;
    v_apply     text;
    v_pver      text;
    v_name      text;
    v_start_raw text;
    v_start     timestamp;
    v_unic      text;
    v_user      text;
    v_note      text;
    v_p1        public."RSessionMaster"%ROWTYPE;
    v_next      uuid;
    v_p1no      smallint;
    v_p2        uuid;
    v_copied    integer := 0;
BEGIN
    v_ses       := public.rtedge_uuid(parameter ->> 'nSesid');
    v_by        := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_apply     := COALESCE(upper(public.rtedge_text(parameter ->> 'cApply')), 'L');
    v_pver      := public.rtedge_text(parameter ->> 'cParserVer');
    v_name      := public.rtedge_text(parameter ->> 'cName');
    v_start_raw := public.rtedge_text(parameter ->> 'dStartDt');
    v_start     := public.rtedge_timestamp(v_start_raw);
    v_unic      := public.rtedge_text(parameter ->> 'cUnicuserid');
    v_user      := left(public.rtedge_text(parameter ->> 'cEclipseUsername'), 128);
    v_note      := left(public.rtedge_text(parameter ->> 'cNote'), 400);

    IF v_ses IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid is required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF v_apply NOT IN ('C', 'L') OR (v_apply = 'C' AND v_pver IS NULL) OR length(v_pver) > 60
       OR (v_start_raw IS NOT NULL AND v_start IS NULL) THEN
        OPEN ref FOR SELECT -1 AS msg, 'cApply is C or L (C needs cParserVer); dStartDt must be a timestamp' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_p1 FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND OR v_p1."dDelDt" IS NOT NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF NOT (public.rtedge_is_admin(v_by) OR COALESCE(v_by = v_p1."nHearingOpid", false)) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Only a super-admin or the session''s hearing operator may split it' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_p1."cFeedSource" IS DISTINCT FROM 'E' THEN
        OPEN ref FOR SELECT -2 AS msg, 'Only a venue-box session can be split to direct cloud' AS value, 'STATE' AS "cCode";
        RETURN ref;
    END IF;

    -- A repeat (double click, retried request) returns the existing Part 2.
    v_next := public.rtedge_successor(v_ses);
    IF v_next IS NOT NULL THEN
        OPEN ref FOR
            SELECT 1 AS msg, 'Already split' AS value, true AS "bAlready",
                   v_ses AS "nSesid", p2."nSesid" AS "nPart2Sesid", p2."nPartNo", p2."nCaseid", p2."cName", p2."dStartDt",
                   p2."cUnicuserid", p2."cApply", p2."cSyncState", p2."nLines", p2."cTimezone", p2."cProtocol",
                   v_p1."nEdgeid" AS "nEdgeid", 0 AS "nAssigneesCopied"
              FROM public."RSessionMaster" p2
             WHERE p2."nSesid" = v_next;
        RETURN ref;
    END IF;

    IF v_p1."cSyncState" IS NULL OR v_p1."cSyncState" NOT IN ('L', 'S') THEN
        OPEN ref FOR SELECT -2 AS msg, format('The session is sealed (%s); create a new session instead', COALESCE(v_p1."cSyncState"::text, '-')) AS value,
                            'SEALED' AS "cCode";
        RETURN ref;
    END IF;

    v_p1no  := COALESCE(v_p1."nPartNo", 1);
    v_start := COALESCE(v_start, public.rtedge_local_now(v_p1."cTimezone"));
    v_name  := COALESCE(v_name, COALESCE(v_p1."cName", 'Session') || ' (Part ' || (v_p1no + 1)::text || ')');
    v_unic  := COALESCE(v_unic, 'sess:' || gen_random_uuid()::text);

    -- Part 1: ended in the cloud, awaiting its box's tail and seal (the box gets op 'end' on its next hello).
    UPDATE public."RSessionMaster"
       SET "cSyncState" = 'S',
           "cStatus"    = 'C',
           "nPartNo"    = v_p1no,
           "dUpdatedt"  = now()
     WHERE "nSesid" = v_ses;

    -- Part 2: direct to cloud, live now, same case and hearing settings.
    INSERT INTO public."RSessionMaster"
           ("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cStatus", "cNotifytype",
            "cTimezone", "cSType", "cProtocol", "nRTSid", "bRefresh",
            "cFeedSource", "bEverEdge", "cApply", "nIngestEpoch", "cSyncState", "cParserVer", "nHearingOpid",
            "nPrevPartSesid", "nPartNo")
    VALUES (v_p1."nCaseid", v_name, v_start, v_p1."nDays", v_p1."nLines", v_p1."nPageno", v_unic, 'R', v_p1."cNotifytype",
            v_p1."cTimezone", COALESCE(v_p1."cSType", 'R'), v_p1."cProtocol", v_p1."nRTSid", v_p1."bRefresh",
            'D', false, v_apply, 1, CASE WHEN v_apply = 'C' THEN 'L' END, v_pver, v_p1."nHearingOpid",
            v_ses, v_p1no + 1)
    RETURNING "nSesid" INTO v_p2;

    INSERT INTO public."RSessionDetail" ("nSesid", "nUserid", "cUsertype", "cDefIssues", "cDefHIssues")
    SELECT v_p2, d."nUserid", d."cUsertype", d."cDefIssues", d."cDefHIssues"
      FROM public."RSessionDetail" d
     WHERE d."nSesid" = v_ses AND d."dDelDt" IS NULL AND d."nUserid" IS NOT NULL;
    GET DIAGNOSTICS v_copied = ROW_COUNT;

    PERFORM public.rtedge_event(v_p1."nEdgeid", v_ses, 'split',
        jsonb_build_object('nPart2Sesid', v_p2, 'nPartNo', v_p1no + 1, 'cApply', v_apply,
                           'cPrevSyncState', v_p1."cSyncState", 'cEclipseUsername', v_user,
                           'bCredentialCopy', true, 'nAssigneesCopied', v_copied, 'cNote', v_note),
        v_by);
    PERFORM public.rtedge_event(NULL, v_p2, 'split_part',
        jsonb_build_object('nPrevPartSesid', v_ses, 'nPartNo', v_p1no + 1), v_by);

    OPEN ref FOR
        SELECT 1 AS msg, 'Split to direct cloud' AS value, false AS "bAlready",
               v_ses AS "nSesid", p2."nSesid" AS "nPart2Sesid", p2."nPartNo", p2."nCaseid", p2."cName", p2."dStartDt",
               p2."cUnicuserid", p2."cApply", p2."cSyncState", p2."nLines", p2."cTimezone", p2."cProtocol",
               v_p1."nEdgeid" AS "nEdgeid", v_copied AS "nAssigneesCopied"
          FROM public."RSessionMaster" p2
         WHERE p2."nSesid" = v_p2;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_applied   (spec 5.5 step 6; D19)
--   in : nSesid, nAppliedRawSeq, cAppliedRawHash? (the raw chain hash at that
--        seq), nEdgeid? (when given it must be the session's box)
--   out: msg, value, bAdvanced, nSesid, nAppliedRawSeq, cAppliedRawHash
--        (or msg -2 "cCode" FORK when the same seq arrives with another hash)
--   Monotonic: never moves backwards and stores the pair together (a new seq
--   without a hash clears the old hash rather than mispair it). Sealed
--   sessions keep their exact seal values. A soft-deleted session still
--   takes its box's drained rounds (op 'end'), so it can seal (file 07).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_applied(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses      uuid;
    v_seq      bigint;
    v_hash     text;
    v_edge_raw text;
    v_edge     uuid;
    v_row      public."RSessionMaster"%ROWTYPE;
    v_adv      boolean := false;
BEGIN
    v_ses      := public.rtedge_uuid(parameter ->> 'nSesid');
    v_seq      := public.rtedge_bigint(parameter ->> 'nAppliedRawSeq');
    v_hash     := public.rtedge_text(parameter ->> 'cAppliedRawHash');
    v_edge_raw := public.rtedge_text(parameter ->> 'nEdgeid');
    v_edge     := public.rtedge_uuid(v_edge_raw);

    IF v_ses IS NULL OR v_seq IS NULL OR v_seq < 0 OR (v_hash IS NOT NULL AND NOT public.rtedge_hash_ok(v_hash))
       OR (v_edge_raw IS NOT NULL AND v_edge IS NULL) THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and a non-negative nAppliedRawSeq are required; cAppliedRawHash must be a hash' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Session not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF NOT (COALESCE(v_row."cFeedSource" = 'E', false) OR COALESCE(v_row."cApply" = 'C', false)) THEN
        OPEN ref FOR SELECT -2 AS msg, 'Not a venue or cut-mode session' AS value, 'NOT_GATED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_edge IS NOT NULL AND v_edge IS DISTINCT FROM v_row."nEdgeid" THEN
        OPEN ref FOR SELECT -2 AS msg, 'The session is not bound to this venue box' AS value, 'NOT_BOUND' AS "cCode";
        RETURN ref;
    END IF;

    IF v_row."cSyncState" IN ('K', 'W', 'F') THEN
        NULL; -- sealed: the seal wrote the exact final pair
    ELSIF v_row."nAppliedRawSeq" IS NULL OR v_seq > v_row."nAppliedRawSeq" THEN
        UPDATE public."RSessionMaster"
           SET "nAppliedRawSeq" = v_seq, "cAppliedRawHash" = v_hash
         WHERE "nSesid" = v_ses;
        v_adv := true;
    ELSIF v_seq = v_row."nAppliedRawSeq" AND v_hash IS NOT NULL THEN
        IF v_row."cAppliedRawHash" IS NULL THEN
            UPDATE public."RSessionMaster" SET "cAppliedRawHash" = v_hash WHERE "nSesid" = v_ses;
        ELSIF v_row."cAppliedRawHash" <> v_hash THEN
            PERFORM public.rtedge_event(v_row."nEdgeid", v_ses, 'alert',
                jsonb_build_object('kind', 'FORK', 'nAppliedRawSeq', v_seq, 'cStored', v_row."cAppliedRawHash", 'cGiven', v_hash), NULL);
            OPEN ref FOR SELECT -2 AS msg, 'Another raw hash is already stored for this seq' AS value, 'FORK' AS "cCode";
            RETURN ref;
        END IF;
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, CASE WHEN v_adv THEN 'Watermark advanced' ELSE 'Unchanged' END AS value, v_adv AS "bAdvanced",
               r."nSesid", r."nAppliedRawSeq", r."cAppliedRawHash"
          FROM public."RSessionMaster" r
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_anchor_ids   (DET-12; used by REBASE, which is Phase 4 for
--                         failover and open for recovery, O-1)
--   in : nSesid
--   out: one row per distinct mark identity: msg, cIdentity
--        Sources: RHighlights "identity" / "tidentity" and every "identity"
--        inside "jCordinates" / "jTCordinates" of the session's highlights
--        and of the facts (FactMaster.nSesid -> FactDetail).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_anchor_ids(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses uuid;
BEGIN
    v_ses := public.rtedge_uuid(parameter ->> 'nSesid');
    IF v_ses IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid is required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    OPEN ref FOR
        WITH ids AS (
            SELECT h."identity" AS id FROM public."RHighlights" h WHERE h."nSessionId" = v_ses
            UNION ALL
            SELECT h."tidentity" FROM public."RHighlights" h WHERE h."nSessionId" = v_ses
            UNION ALL
            SELECT v.val #>> '{}'
              FROM public."RHighlights" h
             CROSS JOIN LATERAL jsonb_path_query(COALESCE(h."jCordinates", '[]'::jsonb) || COALESCE(h."jTCordinates", '[]'::jsonb),
                                                 'lax $.**.identity') AS v(val)
             WHERE h."nSessionId" = v_ses AND jsonb_typeof(v.val) IN ('string', 'number')
            UNION ALL
            SELECT v.val #>> '{}'
              FROM public."FactMaster" f
              JOIN public."FactDetail" d ON d."nFSid" = f."nFSid"
             CROSS JOIN LATERAL jsonb_path_query(COALESCE(d."jCordinates", '[]'::jsonb) || COALESCE(d."jTCordinates", '[]'::jsonb),
                                                 'lax $.**.identity') AS v(val)
             WHERE f."nSesid" = v_ses AND jsonb_typeof(v.val) IN ('string', 'number')
        )
        SELECT DISTINCT 1 AS msg, btrim(id) AS "cIdentity"
          FROM ids
         WHERE id IS NOT NULL AND btrim(id) <> ''
         ORDER BY 2;
    RETURN ref;
END
$function$;

COMMIT;
