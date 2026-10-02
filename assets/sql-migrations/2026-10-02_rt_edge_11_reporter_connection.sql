-- 2026-10-02_rt_edge_11_reporter_connection.sql
--
-- RT venue edge box: the reporter connection of a venue session, typed in
-- cloud admin ("Start realtime session", feed path "Venue box") instead of at
-- the box. The admin gives the reporter machine's IP address and TCP port; they
-- are stored with the session, travel to the box in its assignment and the box
-- connects to that address by itself (its "dial" mode: plain TCP, no login).
-- Both are optional: left empty, nothing changes (the reporter's Eclipse
-- connects to the box and logs in with the session's Eclipse credentials).
--
--   "RSessionMaster"."cReporterIp"    the reporter machine's address (IPv4
--                                     dotted quad; varchar(45) leaves room for
--                                     an IPv6 literal later)
--   "RSessionMaster"."nReporterPort"  its TCP port, 1-65535
--                                     Both NULL, or both set.
--
--   et_rtedge_session_bind  (file 10)  reads the optional cReporterIp /
--                                      nReporterPort, stores them in the bind's
--                                      UPDATE and returns them; the 'bind' event
--                                      records them.
--   et_rtedge_assignments   (file 05)  cursor r3 returns both columns.
--
-- Both functions are the bodies of files 10 and 05 with lines added and none
-- changed (apps/realtime-server edge-sql-contract.spec.ts compares them), and
-- their signatures and return types are unchanged, so CREATE OR REPLACE is
-- enough. Re-running file 05, 06 or 10 after this file puts the older bodies
-- back: run this file again afterwards.
--
-- SymmetricDS: "RSessionMaster" carries sym capture triggers. Nothing here
-- updates a row, so they do not fire; the README note on new columns and the
-- sym_trigger configuration applies to these two as well.
--
-- Apply to dev etabella_tech_uuid only (guard below), after files 01-10.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_11_reporter_connection: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.et_rtedge_session_bind(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rtedge_session_parser_pin(json, refcursor)') IS NULL
       OR to_regprocedure('public.et_rtedge_assignments(json, refcursor, refcursor, refcursor, refcursor, refcursor)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_11_reporter_connection: apply 2026-10-01_rt_edge_01 .. 10 first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- Columns
--------------------------------------------------------------------------
ALTER TABLE public."RSessionMaster"
    ADD COLUMN IF NOT EXISTS "cReporterIp"   varchar(45) NULL,
    ADD COLUMN IF NOT EXISTS "nReporterPort" integer     NULL;

--------------------------------------------------------------------------
-- Constraint (added once; a re-run never replaces a later definition)
--------------------------------------------------------------------------
DO $cons$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'public."RSessionMaster"'::regclass
                      AND conname = 'RSessionMaster_nReporterPort_check') THEN
        ALTER TABLE public."RSessionMaster"
            ADD CONSTRAINT "RSessionMaster_nReporterPort_check"
            CHECK ("nReporterPort" IS NULL OR "nReporterPort" BETWEEN 1 AND 65535);
    END IF;
END
$cons$;

--------------------------------------------------------------------------
-- Column documentation
--------------------------------------------------------------------------
COMMENT ON COLUMN public."RSessionMaster"."cReporterIp" IS
  'Venue-box sessions: the reporter machine''s IP address typed in cloud admin; with nReporterPort the box connects to it by itself. NULL: the reporter connects to the box.';
COMMENT ON COLUMN public."RSessionMaster"."nReporterPort" IS
  'Venue-box sessions: the reporter machine''s TCP port (1-65535), set together with cReporterIp.';

--------------------------------------------------------------------------
-- et_rtedge_session_bind   (spec 4.2 step 3, source E; replaces file 10)
--   in : nSesid, nEdgeid, nHearingOpid? (a case admin of the case, or a
--        global admin), cParserVer? (defaults to the box's reported version),
--        cReporterIp? + nReporterPort? (the reporter connection: both or
--        neither; an IPv4 dotted quad without leading zeros, a port 1-65535),
--        nMasterid (creator, audit)
--   out: msg, value, bAlready, nSesid, nCaseid, nEdgeid, nIngestEpoch,
--        cSyncState, cParserVer, nHearingOpid, cEdgeName, cLanIp, nCatPort,
--        dLastSeen, bEdgeOnline, cReporterIp, nReporterPort, bParserPending
--   File 10's body with the reporter connection added: parsed and checked
--   (msg -1 INVALID for one key without the other or a malformed value),
--   stored in the same UPDATE as the rest of the bind (NULL when not given),
--   recorded in the 'bind' event and returned. A repeated bind stays a no-op
--   success and returns what the first one stored. Everything else is file
--   10's: the session row FOR UPDATE, then the box row FOR SHARE (#12), the
--   pending parser version (G5).
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
    v_rip    text;
    v_rp_raw text;
    v_rport  integer;
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
    v_rip    := public.rtedge_text(parameter ->> 'cReporterIp');
    v_rp_raw := public.rtedge_text(parameter ->> 'nReporterPort');
    v_rport  := public.rtedge_int(v_rp_raw);

    IF v_ses IS NULL OR v_edge IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nSesid and nEdgeid are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_op_raw IS NOT NULL AND v_op IS NULL) OR length(v_pver) > 60 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nHearingOpid must be a user id; cParserVer is at most 60 characters' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    -- The reporter connection is optional: both keys or neither; an IPv4 dotted quad without leading zeros and a
    -- TCP port 1-65535 (POST session/eclipse validates the same before it calls).
    IF (v_rip IS NULL) <> (v_rp_raw IS NULL)
       OR (v_rip IS NOT NULL AND v_rip !~ '^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])[.]){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$')
       OR (v_rp_raw IS NOT NULL AND (v_rport IS NULL OR v_rport NOT BETWEEN 1 AND 65535)) THEN
        OPEN ref FOR SELECT -1 AS msg, 'cReporterIp (an IPv4 address) and nReporterPort (1-65535) go together: both, or neither' AS value, 'INVALID' AS "cCode";
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
               "cReporterIp"   = v_rip,
               "nReporterPort" = v_rport,
               "dUpdatedt"    = now()
         WHERE "nSesid" = v_ses;

        PERFORM public.rtedge_event(v_edge, v_ses, 'bind',
            jsonb_build_object('nCaseid', v_row."nCaseid", 'cParserVer', v_pver, 'bParserPending', v_pver IS NULL,
                               'cReporterIp', v_rip, 'nReporterPort', v_rport,
                               'nHearingOpid', v_op), v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, CASE WHEN v_again THEN 'Session already bound to this venue box' ELSE 'Session bound to the venue box' END AS value,
               v_again AS "bAlready", r."nSesid", r."nCaseid", r."nEdgeid", r."nIngestEpoch", r."cSyncState", r."cParserVer",
               r."nHearingOpid", n."cName" AS "cEdgeName", host(n."cLanIp") AS "cLanIp", n."nCatPort", n."dLastSeen",
               COALESCE(n."dLastSeen" > now() - interval '2 minutes', false) AS "bEdgeOnline",
               r."cReporterIp", r."nReporterPort",
               (r."cParserVer" IS NULL) AS "bParserPending"
          FROM public."RSessionMaster" r
          JOIN public."RtEdgeNode" n ON n."nEdgeid" = r."nEdgeid"
         WHERE r."nSesid" = v_ses;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_assignments   (ref: 5)  the box's pull on every e.hello
--                         (replaces file 05)
--   in : nEdgeid
--   r1 : header: msg (1 active, -2 not active e.g. quarantined, -1 not found),
--        value, "cCode", nEdgeid, cStatus, dServerNow
--        Every other cursor is empty unless msg = 1 (a 'Q' box gets no
--        assignments or rosters, spec 5.3).
--   r2 : cases (feeds /edge/local/cases, D32): nCaseid, cCaseno, cCasename,
--        isArchived, dAssignedAt
--   r3 : unsealed bound sessions: nSesid, nCaseid, cName, dStartDt, cTimezone,
--        nLines, nPageno, nDays, cProtocol, cStatus, cSyncState, nIngestEpoch,
--        nRebaseSeq, cParserVer, nHearingOpid, cHearingOpFname,
--        cHearingOpLname, nPartNo, nPrevPartSesid, nNextPartSesid,
--        cReporterIp, nReporterPort (the reporter connection, both NULL when
--        none was given), bDeleted,
--        cOp ('upsert' live | 'end' end requested, split Part 1 or deleted).
--        A deleted row leaves r3 when the box seals it (the seal accepts a
--        soft-deleted session) or a super-admin force-closes it (file 07).
--   r4 : roster, mirroring SESSION_ACCESS_SQL (RS/events/realtime-socket-access.ts):
--        case team rows (cSource 'T', nSesid NULL, isCaseAdmin from the Case
--        Admin role) and session assignees of r3 sessions (cSource 'S'):
--        nCaseid, nSesid, nUserid, cFname, cLname, cUserStatus, isCaseAdmin, cSource
--   r5 : global admins (the "or admin" of the rule): nUserid, cFname, cLname
--   The Eclipse route (user, salt, hash, scryptN) comes from the route file,
--   never from here.
--   File 05's body with the two reporter columns added to r3.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_assignments(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor, ref4 refcursor, ref5 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id     uuid;
    v_status text;
    v_ok     boolean;
BEGIN
    v_id := public.rtedge_uuid(parameter ->> 'nEdgeid');
    SELECT n."cStatus" INTO v_status FROM public."RtEdgeNode" n WHERE n."nEdgeid" = v_id AND n."dDelDt" IS NULL;
    v_ok := COALESCE(v_status = 'A', false);

    OPEN ref1 FOR
        SELECT CASE WHEN v_ok THEN 1 WHEN v_status IS NULL THEN -1 ELSE -2 END AS msg,
               CASE WHEN v_ok THEN 'Assignments'
                    WHEN v_status IS NULL THEN 'Venue box not found'
                    ELSE format('Venue box is not active (status %s)', v_status) END AS value,
               CASE WHEN v_ok THEN NULL
                    WHEN v_status IS NULL THEN 'NOT_FOUND'
                    WHEN v_status = 'Q' THEN 'QUARANTINED'
                    WHEN v_status = 'X' THEN 'REVOKED'
                    ELSE 'NOT_ACTIVE' END AS "cCode",
               v_id AS "nEdgeid", v_status AS "cStatus", now() AS "dServerNow";
    RETURN NEXT ref1;

    OPEN ref2 FOR
        SELECT rc."nCaseid", c."cCaseno", c."cCasename", c."isArchived", rc."dCreatedt" AS "dAssignedAt"
          FROM public."RtEdgeCase" rc
          JOIN public."CaseMaster" c ON c."nCaseid" = rc."nCaseid"
         WHERE v_ok AND rc."nEdgeid" = v_id
         ORDER BY c."cCaseno";
    RETURN NEXT ref2;

    OPEN ref3 FOR
        SELECT r."nSesid", r."nCaseid", r."cName", r."dStartDt", r."cTimezone", r."nLines", r."nPageno", r."nDays",
               r."cProtocol", r."cStatus", r."cSyncState", r."nIngestEpoch", r."nRebaseSeq", r."cParserVer",
               r."nHearingOpid", op."cFname" AS "cHearingOpFname", op."cLname" AS "cHearingOpLname",
               r."nPartNo", r."nPrevPartSesid", public.rtedge_successor(r."nSesid") AS "nNextPartSesid",
               r."cReporterIp", r."nReporterPort",
               (r."dDelDt" IS NOT NULL) AS "bDeleted",
               CASE WHEN r."cSyncState" = 'L' AND r."dDelDt" IS NULL THEN 'upsert' ELSE 'end' END AS "cOp"
          FROM public."RSessionMaster" r
          LEFT JOIN public."UserMaster" op ON op."nUserid" = r."nHearingOpid"
         WHERE v_ok AND r."nEdgeid" = v_id AND r."cFeedSource" = 'E' AND r."cSyncState" IN ('L', 'S')
         ORDER BY r."dStartDt", r."nSesid";
    RETURN NEXT ref3;

    OPEN ref4 FOR
        SELECT t."nCaseid", NULL::uuid AS "nSesid", t."nUserid", u."cFname", u."cLname", u."cStatus" AS "cUserStatus",
               bool_or(COALESCE(t."nRoleid" = public.rtedge_case_admin_role(), false)) AS "isCaseAdmin", 'T'::text AS "cSource"
          FROM public."TeamRelation" t
          JOIN public."RtEdgeCase" rc ON rc."nCaseid" = t."nCaseid" AND rc."nEdgeid" = v_id
          LEFT JOIN public."UserMaster" u ON u."nUserid" = t."nUserid"
         WHERE v_ok AND t."nUserid" IS NOT NULL
         GROUP BY t."nCaseid", t."nUserid", u."cFname", u."cLname", u."cStatus"
        UNION ALL
        SELECT DISTINCT r."nCaseid", d."nSesid", d."nUserid", u."cFname", u."cLname", u."cStatus",
               false, 'S'::text
          FROM public."RSessionDetail" d
          JOIN public."RSessionMaster" r ON r."nSesid" = d."nSesid"
          LEFT JOIN public."UserMaster" u ON u."nUserid" = d."nUserid"
         WHERE v_ok AND r."nEdgeid" = v_id AND r."cFeedSource" = 'E' AND r."cSyncState" IN ('L', 'S')
           AND r."dDelDt" IS NULL AND d."nUserid" IS NOT NULL;
    RETURN NEXT ref4;

    OPEN ref5 FOR
        SELECT u."nUserid", u."cFname", u."cLname"
          FROM public."UserMaster" u
         WHERE v_ok AND u."isAdmin" IS TRUE;
    RETURN NEXT ref5;
END
$function$;

COMMIT;
