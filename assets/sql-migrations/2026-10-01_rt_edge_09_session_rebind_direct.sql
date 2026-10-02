-- 2026-10-01_rt_edge_09_session_rebind_direct.sql
--
-- RT venue edge box: "Use direct cloud instead" (spec rev 3, section 4.2; open
-- item O-8) as a stored procedure.
--
--   et_rtedge_session_rebind_direct   re-bind a never-fed 'E' session to 'D'
--
-- Until this file, realtime-server ran this as one guarded UPDATE
-- (EDGE_REBIND_DIRECT_SQL in apps/realtime-server/src/edge/edge.types.ts). The
-- SP does exactly what that UPDATE did: the same SET list, the same WHERE
-- guards and the same result (nSesid, nCaseid), now in the executeRef shape of
-- files 05-08, so the edge module reaches the database only through SPs and
-- read-only constants.
--
-- bEverEdge IS CLEARED HERE. This is a deliberate, documented exception to
-- spec 4.1 ("set at the first bind, never cleared"). The rule exists so that a
-- split or a switch cannot bypass the publish gate once venue data exists.
-- Here no venue data exists: the box never received a byte of the session (no
-- applied round, no orphan; the service also checks the cloud raw store and
-- the box's own status), and the box confirmed the purge (c.assign op
-- 'purge'), or it was revoked and can no longer send anything. Keeping
-- bEverEdge would leave a 'D' session gated with cSyncState NULL, and the gate
-- would wait forever for a seal that no box will ever send. Once a single byte
-- has arrived, only the split (et_rtedge_session_split, D7) is allowed, and the
-- split keeps bEverEdge.
--
-- Conventions: see file 05 (msg 1 / -1 / -2, "cCode"). The service records the
-- audit event itself ('rebind_direct', with the box confirmation and route
-- outcome), after the route file is updated.
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 04.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_09_session_rebind_direct: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.rtedge_uuid(text)') IS NULL OR to_regclass('public."RtEdgeOrphan"') IS NULL
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'RSessionMaster' AND column_name = 'nAppliedRawSeq') THEN
        RAISE EXCEPTION 'rt_edge_09_session_rebind_direct: apply 2026-10-01_rt_edge_01 .. 04 first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- et_rtedge_session_rebind_direct   (O-8 "Use direct cloud instead")
--   in : nSesid, nEdgeid (the box the session is bound to)
--   out: msg, value, nSesid, nCaseid
--        msg -1 INVALID (a missing or malformed id);
--        msg -2 CONFLICT when nothing was re-bound: the session is not (or no
--        longer) a live, never-fed 'E' session on that box. The caller checked
--        all of this before calling, so a CONFLICT means the session changed
--        in between.
--   Sets cFeedSource 'D', cApply 'L' (legacy dispatch) and clears the edge
--   binding: nEdgeid, bEverEdge (see the header), cSyncState, nIngestEpoch 1,
--   nRebaseSeq, the applied watermark pair. Only when the session is still
--   'E' on that box, live ('L'), not deleted, has no applied round and holds
--   no orphan of any status.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_session_rebind_direct(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_ses  uuid;
    v_edge uuid;
    v_case uuid;
BEGIN
    v_ses  := public.rtedge_uuid(parameter ->> 'nSesid');
    v_edge := public.rtedge_uuid(parameter ->> 'nEdgeid');

    IF v_ses IS NULL OR v_edge IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and nEdgeid are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    UPDATE public."RSessionMaster" r
       SET "cFeedSource"     = 'D',
           "cApply"          = 'L',
           "nEdgeid"         = NULL,
           "bEverEdge"       = false,   -- the documented exception to "never cleared" (header)
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

COMMIT;
