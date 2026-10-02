-- 2026-10-01_rt_edge_08_sp_audit_orphans.sql
--
-- RT venue edge box: audit events and held-stream orphans (spec rev 3,
-- sections 4.4, 4.5, 4.9, 11; D3, D27, S-D8, S-D15).
--
--   et_rtedge_event_insert    any audited action the service records itself
--                             (online/offline/ready/alert/audit/split_route/
--                             opcode_issue/unlock_cat/release_held/...)
--   et_rtedge_orphan_insert   record or extend a held stream:
--                             'H' direct stream for an 'E' session (cloud),
--                             'C' concurrent CAT connection (box)
--   et_rtedge_orphan_resolve  dismiss ('D', super-admin, note; the session
--                             becomes 'F', watermarked with the interval) or
--                             addendum produced ('A')
--
-- Removed in rev 3 (D3, D27): the unclaimed-capture kind 'U' and the claim
-- path ('K'). 'F' (fenced edge tail) is Phase 4 (D1): the table accepts it,
-- this SP does not. 'M' (splice) is not implemented (S-D15).
-- The daily operator code (DR7) is never stored in the cloud: when RT
-- Production mints it, the service records only cType 'opcode_issue' with the
-- day and the issuer, never the code or a hash of it.
--
-- Conventions: see file 05. Lock order is session row, then orphan rows, as
-- in et_rtedge_session_forceseal (file 07).
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 04.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_08_sp_audit_orphans: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.rtedge_event(uuid, uuid, text, jsonb, uuid)') IS NULL
       OR to_regprocedure('public.rtedge_orphan_interval(timestamp with time zone, timestamp with time zone, bigint, bigint, text)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_08_sp_audit_orphans: apply 2026-10-01_rt_edge_04_helpers.sql first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- et_rtedge_event_insert
--   in : cType (lowercase, [a-z][a-z0-9_.-]{0,29}), nEdgeid?, nSesid?,
--        jData? (never a password, hash, code or token), nMasterid? (the
--        acting user; NULL for the device or the system)
--   out: msg, value, nId, dAt
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_event_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_type     text;
    v_edge_raw text;
    v_edge     uuid;
    v_ses_raw  text;
    v_ses      uuid;
    v_by_raw   text;
    v_by       uuid;
    v_data_raw text;
    v_data     jsonb;
    v_id       bigint;
BEGIN
    v_type     := lower(public.rtedge_text(parameter ->> 'cType'));
    v_edge_raw := public.rtedge_text(parameter ->> 'nEdgeid');
    v_edge     := public.rtedge_uuid(v_edge_raw);
    v_ses_raw  := public.rtedge_text(parameter ->> 'nSesid');
    v_ses      := public.rtedge_uuid(v_ses_raw);
    v_by_raw   := public.rtedge_text(parameter ->> 'nMasterid');
    v_by       := public.rtedge_uuid(v_by_raw);
    v_data_raw := public.rtedge_text(parameter ->> 'jData');
    v_data     := public.rtedge_jsonb(v_data_raw);

    IF v_type IS NULL OR v_type !~ '^[a-z][a-z0-9_.-]{0,29}$' THEN
        OPEN ref FOR SELECT -1 AS msg, 'cType must be 1-30 lowercase letters, digits, _ . or -' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_edge_raw IS NOT NULL AND v_edge IS NULL) OR (v_ses_raw IS NOT NULL AND v_ses IS NULL)
       OR (v_by_raw IS NOT NULL AND v_by IS NULL) OR (v_data_raw IS NOT NULL AND v_data IS NULL) THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid, nSesid and nMasterid must be ids; jData must be JSON' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    v_id := public.rtedge_event(v_edge, v_ses, v_type, v_data, v_by);

    OPEN ref FOR
        SELECT 1 AS msg, 'Event recorded' AS value, e."nId", e."dAt"
          FROM public."RtEdgeEvent" e
         WHERE e."nId" = v_id;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_orphan_insert
--   in : nSesid (a gated session: ever-edge or cut mode), cKind ('H' | 'C'),
--        nOrphanid? (idempotency key: a repeat with the same id extends that
--        row instead of adding one), nEdgeid? (required for 'C': the holding
--        box, which must be the session's box), nEpoch?, bInTranscript?,
--        cUser?, cPeer?, nFromSeq?, nToSeq?, dFrom?, dTo?, cObjectKey?,
--        cLinesKey?, cSha256?, nBytes? (the stream's total held bytes so far)
--   out: msg, value, bDuplicate, bReopened, nOrphanid, nSesid, cKind,
--        cStatus, nBytes, nSessionHeldBytes, nTotalHeldBytes (pending bytes
--        of this kind, for the 200 MB per session / 1 GB total caps, spec 4.5)
--   A pending orphan blocks publish (gate PENDING_ORPHANS) until resolved.
--   A repeat that grows a resolved row (a later nToSeq or dTo, more bytes, a
--   value that was unknown at resolution, or another sha256) reopens it to
--   'P': the dismissal or addendum did not cover the new bytes, so they block
--   publish again and count to the caps ('orphan_reopen' event). A repeat
--   that adds nothing only fills in a missing object key, lines key or hash.
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

    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_ses;
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
        -- Two concurrent first reports with the same nOrphanid: the other one won.
        OPEN ref FOR SELECT -2 AS msg, 'The orphan was recorded concurrently; retry' AS value, 'RETRY' AS "cCode";
        RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_orphan_resolve   (S-D8, S-D15: no splice into the transcript)
--   in : nOrphanid, cStatus ('D' dismissed, needs cNote | 'A' addendum
--        produced), cNote?, nMasterid
--   out: msg, value, bAlready, nOrphanid, nSesid, cStatus, nPendingLeft,
--        cSyncState, cSealNote (the session's, after the call)
--   'D' leaves held data out of the record, so it is a forced close: super-
--   admin only, and only once the session is sealed ('K' / 'W') or already
--   'F'. In the same action the session becomes 'F' with the dismissed
--   interval as its watermark note ("venue data missing <interval>", appended
--   when the session is already 'F'); 'D' is refused while the session is
--   live ('L': the stream may still grow) or awaiting its seal ('S': the
--   forced close dismisses its pending orphans instead).
--   'A' (the orphan lines published as a separate addendum) keeps the
--   session's state; a global admin, a case admin of the session's case or
--   its hearing operator may record it.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_orphan_resolve(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_oid      uuid;
    v_status   text;
    v_note     text;
    v_by       uuid;
    v_sesid    uuid;
    v_old      public."RtEdgeOrphan"%ROWTYPE;
    v_row      public."RSessionMaster"%ROWTYPE;
    v_gated    boolean := false;
    v_force    boolean := false;
    v_interval text;
    v_seal     text;
    v_left     integer;
BEGIN
    v_oid    := public.rtedge_uuid(parameter ->> 'nOrphanid');
    v_status := upper(public.rtedge_text(parameter ->> 'cStatus'));
    v_note   := public.rtedge_text(parameter ->> 'cNote');
    v_by     := public.rtedge_uuid(parameter ->> 'nMasterid');

    IF v_oid IS NULL OR v_by IS NULL OR v_status IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nOrphanid, cStatus and the acting user are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF v_status = 'M' THEN
        OPEN ref FOR SELECT -1 AS msg, 'Splicing orphans into the transcript is not implemented (S-D15)' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF v_status NOT IN ('D', 'A') OR (v_status = 'D' AND v_note IS NULL) OR length(v_note) > 400 THEN
        OPEN ref FOR SELECT -1 AS msg, 'cStatus is D (with a note of up to 400 characters) or A' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    -- Lock the session first (same order as the forced close), then the orphan.
    SELECT o."nSesid" INTO v_sesid FROM public."RtEdgeOrphan" o WHERE o."nOrphanid" = v_oid;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Orphan not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    SELECT * INTO v_row FROM public."RSessionMaster" WHERE "nSesid" = v_sesid FOR UPDATE;
    v_gated := FOUND AND (v_row."bEverEdge" OR COALESCE(v_row."cApply" = 'C', false));
    SELECT * INTO v_old FROM public."RtEdgeOrphan" WHERE "nOrphanid" = v_oid FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Orphan not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    IF v_status = 'D' AND NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Dismissing held data force-closes the session as incomplete: super-admin rights required' AS value,
                            'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_status = 'A' AND NOT (public.rtedge_is_admin(v_by) OR public.rtedge_is_case_admin(v_row."nCaseid", v_by)
                               OR COALESCE(v_by = v_row."nHearingOpid", false)) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin, case admin or hearing operator rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;

    IF v_old."cStatus" <> 'P' THEN
        IF v_old."cStatus" = v_status THEN
            OPEN ref FOR
                SELECT 1 AS msg, 'Already resolved' AS value, true AS "bAlready", v_oid AS "nOrphanid", v_old."nSesid" AS "nSesid",
                       v_old."cStatus"::text AS "cStatus",
                       (SELECT count(*) FROM public."RtEdgeOrphan" x WHERE x."nSesid" = v_old."nSesid" AND x."cStatus" = 'P')::integer AS "nPendingLeft",
                       v_row."cSyncState"::text AS "cSyncState", v_row."cSealNote"::text AS "cSealNote";
            RETURN ref;
        END IF;
        OPEN ref FOR SELECT -2 AS msg, format('The orphan is already resolved (%s)', v_old."cStatus") AS value, 'STATE' AS "cCode";
        RETURN ref;
    END IF;

    IF v_status = 'D' AND v_gated AND COALESCE(v_row."cSyncState" NOT IN ('K', 'W', 'F'), true) THEN
        OPEN ref FOR SELECT -2 AS msg,
                            CASE WHEN v_row."cSyncState" = 'L' THEN 'The session is live: end it (or split it) and let it seal before dismissing held data'
                                 WHEN v_row."cSyncState" = 'S' THEN 'The session awaits its venue seal: dismiss after the seal, or force-close it (which dismisses its pending orphans)'
                                 ELSE format('Nothing to close (state %s)', COALESCE(v_row."cSyncState"::text, '-')) END AS value,
                            'STATE' AS "cCode";
        RETURN ref;
    END IF;
    v_force := v_status = 'D' AND v_gated;

    UPDATE public."RtEdgeOrphan"
       SET "cStatus"     = v_status,
           "cNote"       = COALESCE(v_note, "cNote"),
           "nResolvedBy" = v_by,
           "dResolvedAt" = now()
     WHERE "nOrphanid" = v_oid;

    v_interval := public.rtedge_orphan_interval(v_old."dFrom", v_old."dTo", v_old."nFromSeq", v_old."nToSeq", v_row."cTimezone");
    IF v_force THEN
        v_seal := CASE WHEN v_row."cSyncState" = 'F' AND v_row."cSealNote" IS NOT NULL
                       THEN left(v_row."cSealNote" || '; ' || v_interval, 200)
                       ELSE left('venue data missing ' || v_interval, 200) END;
        UPDATE public."RSessionMaster"
           SET "cSyncState" = 'F',
               "cSealNote"  = v_seal,
               "dSealedAt"  = COALESCE("dSealedAt", now()),
               "dUpdatedt"  = now()
         WHERE "nSesid" = v_row."nSesid";
    END IF;

    PERFORM public.rtedge_event(v_old."nEdgeid", v_old."nSesid", 'orphan_resolve',
        jsonb_build_object('nOrphanid', v_oid, 'cKind', v_old."cKind", 'cStatus', v_status, 'cNote', v_note,
                           'nBytes', v_old."nBytes", 'cInterval', v_interval,
                           'cPrevSyncState', v_row."cSyncState",
                           'cSyncState', CASE WHEN v_force THEN 'F' ELSE v_row."cSyncState"::text END,
                           'cPrevSealNote', v_row."cSealNote", 'cSealNote', v_seal),
        v_by);

    SELECT count(*) INTO v_left FROM public."RtEdgeOrphan" x WHERE x."nSesid" = v_old."nSesid" AND x."cStatus" = 'P';

    OPEN ref FOR
        SELECT 1 AS msg,
               CASE WHEN v_force THEN 'Orphan dismissed; the session is force-closed as incomplete'
                    WHEN v_status = 'D' THEN 'Orphan dismissed'
                    ELSE 'Addendum recorded' END AS value,
               false AS "bAlready", v_oid AS "nOrphanid", v_old."nSesid" AS "nSesid", v_status AS "cStatus", v_left AS "nPendingLeft",
               (SELECT r."cSyncState"::text FROM public."RSessionMaster" r WHERE r."nSesid" = v_old."nSesid") AS "cSyncState",
               (SELECT r."cSealNote"::text FROM public."RSessionMaster" r WHERE r."nSesid" = v_old."nSesid") AS "cSealNote";
    RETURN ref;
END
$function$;

COMMIT;
