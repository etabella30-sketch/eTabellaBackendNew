-- 2026-10-01_rt_edge_05_sp_device.sql
--
-- RT venue edge box: device lifecycle, case scoping and the box's assignment
-- pull (spec rev 3, sections 3.4 install, 4.9, 5.3, 8.4, 11).
--
--   et_rtedge_create        admin: new box ('P'), optional first enrollment code
--   et_rtedge_enroll_code   admin: issue / re-issue a 15-minute enrollment code
--   et_rtedge_enroll        device (public, rate-limited route): code + key -> 'C'
--   et_rtedge_confirm_key   admin confirms the fingerprint -> 'A'
--   et_rtedge_get           one box (2 cursors: box, cases)
--   et_rtedge_list          boxes, optionally those assigned to one case
--   et_rtedge_revoke        admin -> 'X' (terminal; the slug is retired)
--   et_rtedge_quarantine    'A' -> 'Q' (system or admin), 'Q' -> 'A' (admin re-approves)
--   et_rtedge_heartbeat     dLastSeen / egress / ASN / health, at most once a minute
--   et_rtedge_case_set      admin: assign ('I') or unassign ('D') a case
--   et_rtedge_assignments   the box's pull (5 cursors): header, cases, unsealed
--                           bound sessions, roster, global admins. No password data.
--
-- Conventions (executeRef, libs/global/src/db/pg): public.et_<name>(parameter
-- json, ref refcursor ...). Every result row has msg (1 ok, -1 invalid or not
-- found, -2 state conflict, -3 not allowed), value (text) and, on errors,
-- "cCode" (a stable machine code). The acting user is "nMasterid": the
-- service sets it from the verified token, never from the request body.
-- Nothing here stores or returns a password, an enrollment code or its hash.
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 04.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_05_sp_device: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regprocedure('public.rtedge_event(uuid, uuid, text, jsonb, uuid)') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_05_sp_device: apply 2026-10-01_rt_edge_04_helpers.sql first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- et_rtedge_create
--   in : nMasterid (super-admin), cName, cVenue?, cSlug? (generated when
--        absent), cEnrollHash? (sha256 hex of the first code), nScopeAdmin?
--        (defaults to the caller), nCatPort? (2500)
--   out: msg, value, nEdgeid, cName, cVenue, cSlug, cStatus, dEnrollExp,
--        nCatPort, nScopeAdmin, dCreatedt
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_create(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_by       uuid;
    v_name     text;
    v_venue    text;
    v_slug     text;
    v_hash     text;
    v_scope    uuid;
    v_port_raw text;
    v_port     integer;
    v_exp      timestamptz;
    v_id       uuid;
    v_try      integer := 0;
BEGIN
    v_by       := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_name     := public.rtedge_text(parameter ->> 'cName');
    v_venue    := public.rtedge_text(parameter ->> 'cVenue');
    v_slug     := lower(public.rtedge_text(parameter ->> 'cSlug'));
    v_hash     := lower(public.rtedge_text(parameter ->> 'cEnrollHash'));
    v_scope    := COALESCE(public.rtedge_uuid(parameter ->> 'nScopeAdmin'), v_by);
    v_port_raw := public.rtedge_text(parameter ->> 'nCatPort');
    v_port     := COALESCE(public.rtedge_int(v_port_raw), 2500);

    IF NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_name IS NULL OR length(v_name) > 120 THEN
        OPEN ref FOR SELECT -1 AS msg, 'A box name of up to 120 characters is required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF length(v_venue) > 200 THEN
        OPEN ref FOR SELECT -1 AS msg, 'The venue name is longer than 200 characters' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF (v_port_raw IS NOT NULL AND public.rtedge_int(v_port_raw) IS NULL) OR v_port NOT BETWEEN 1 AND 65535 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nCatPort must be a port number (1-65535)' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF v_hash IS NOT NULL AND v_hash !~ '^[0-9a-f]{64}$' THEN
        OPEN ref FOR SELECT -1 AS msg, 'cEnrollHash must be a sha256 hex digest' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    IF v_scope IS DISTINCT FROM v_by AND NOT public.rtedge_is_admin(v_scope) THEN
        OPEN ref FOR SELECT -1 AS msg, 'The scoping admin must be a super-admin' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    IF v_slug IS NOT NULL THEN
        IF v_slug !~ '^[a-z0-9]{6,40}$' THEN
            OPEN ref FOR SELECT -1 AS msg, 'cSlug must be 6-40 lowercase letters or digits' AS value, 'INVALID' AS "cCode";
            RETURN ref;
        END IF;
        IF EXISTS (SELECT 1 FROM public."RtEdgeNode" WHERE "cSlug" = v_slug) THEN
            OPEN ref FOR SELECT -2 AS msg, 'This slug is already used (slugs are never reused)' AS value, 'CONFLICT' AS "cCode";
            RETURN ref;
        END IF;
    ELSE
        -- Opaque slug (CT logs are public): 12 hex characters from a random uuid.
        LOOP
            v_try  := v_try + 1;
            v_slug := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public."RtEdgeNode" WHERE "cSlug" = v_slug);
            IF v_try >= 5 THEN
                RAISE EXCEPTION 'et_rtedge_create: could not draw a free slug';
            END IF;
        END LOOP;
    END IF;

    IF v_hash IS NOT NULL THEN
        v_exp := now() + interval '15 minutes';
    END IF;

    INSERT INTO public."RtEdgeNode"
           ("cName", "cVenue", "cSlug", "cEnrollHash", "dEnrollExp", "nEnrollBy", "cStatus", "nCatPort", "nScopeAdmin", "nCreatedBy")
    VALUES (v_name, v_venue, v_slug, v_hash, v_exp, CASE WHEN v_hash IS NOT NULL THEN v_by END, 'P', v_port, v_scope, v_by)
    RETURNING "nEdgeid" INTO v_id;

    PERFORM public.rtedge_event(v_id, NULL, 'create',
        jsonb_build_object('cName', v_name, 'cSlug', v_slug, 'nScopeAdmin', v_scope, 'bEnrollCode', v_hash IS NOT NULL), v_by);

    OPEN ref FOR
        SELECT 1 AS msg, 'Venue box created' AS value,
               n."nEdgeid", n."cName", n."cVenue", n."cSlug", n."cStatus", n."dEnrollExp", n."nCatPort", n."nScopeAdmin", n."dCreatedt"
          FROM public."RtEdgeNode" n
         WHERE n."nEdgeid" = v_id;
    RETURN ref;
EXCEPTION
    WHEN unique_violation THEN
        OPEN ref FOR SELECT -2 AS msg, 'The slug or the enrollment code is already in use' AS value, 'CONFLICT' AS "cCode";
        RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_enroll_code
--   in : nMasterid (super-admin), nEdgeid, cEnrollHash (sha256 hex of the new
--        128-bit code; the service shows the code once as a QR)
--   out: msg, value, nEdgeid, cStatus, dEnrollExp
--   The box status is unchanged: an issued code alone never disables an
--   active box. Enrolling with it moves the box to 'C' (re-enroll alert).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_enroll_code(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_by   uuid;
    v_id   uuid;
    v_hash text;
    v_node public."RtEdgeNode"%ROWTYPE;
BEGIN
    v_by   := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_id   := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_hash := lower(public.rtedge_text(parameter ->> 'cEnrollHash'));

    IF NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_id IS NULL OR v_hash IS NULL OR v_hash !~ '^[0-9a-f]{64}$' THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid and a sha256 hex cEnrollHash are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF v_node."cStatus" = 'X' THEN
        OPEN ref FOR SELECT -2 AS msg, 'The venue box is revoked' AS value, 'REVOKED' AS "cCode";
        RETURN ref;
    END IF;

    UPDATE public."RtEdgeNode"
       SET "cEnrollHash" = v_hash,
           "dEnrollExp"  = now() + interval '15 minutes',
           "nEnrollBy"   = v_by
     WHERE "nEdgeid" = v_id;

    PERFORM public.rtedge_event(v_id, NULL, 'enroll_code',
        jsonb_build_object('cStatus', v_node."cStatus", 'bReplacedCode', v_node."cEnrollHash" IS NOT NULL), v_by);

    OPEN ref FOR
        SELECT 1 AS msg, 'Enrollment code issued' AS value, n."nEdgeid", n."cStatus", n."dEnrollExp"
          FROM public."RtEdgeNode" n
         WHERE n."nEdgeid" = v_id;
    RETURN ref;
EXCEPTION
    WHEN unique_violation THEN
        OPEN ref FOR SELECT -2 AS msg, 'The enrollment code is already in use' AS value, 'CONFLICT' AS "cCode";
        RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_enroll   (device; the route is public and rate-limited)
--   in : cEnrollHash (sha256 hex of the code the box presents, computed by
--        the service), cPubKey (standard base64 P-256 SPKI), bTpmKey?,
--        cVersion?, cParserVer?, cLanIp?
--   out: msg, value, nEdgeid, cSlug, cKeyFpr, cStatus
--   The code is single use: it is cleared on success and on expiry. A wrong
--   and an expired code get the same answer. The fingerprint is computed
--   here from the key, never taken from the client.
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

    -- Any re-enroll or key change raises an alert and needs the same confirmation (spec 3.4).
    PERFORM public.rtedge_event(v_node."nEdgeid", NULL,
        CASE WHEN v_node."cPubKey" IS NULL THEN 'enroll' ELSE 'reenroll' END,
        jsonb_build_object('cKeyFpr', v_fpr, 'cPrevKeyFpr', v_node."cKeyFpr", 'cPrevStatus', v_node."cStatus",
                           'bTpmKey', v_tpm, 'nEnrollBy', v_node."nEnrollBy", 'cVersion', v_ver, 'cParserVer', v_pver),
        NULL);

    OPEN ref FOR
        SELECT 1 AS msg, 'Key presented; an admin must confirm the fingerprint' AS value,
               n."nEdgeid", n."cSlug", n."cKeyFpr", n."cStatus"
          FROM public."RtEdgeNode" n
         WHERE n."nEdgeid" = v_node."nEdgeid";
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_confirm_key
--   in : nMasterid (super-admin), nEdgeid, cKeyFpr (the fingerprint the admin
--        compared with the box console; colons and spaces are ignored)
--   out: msg, value, nEdgeid, cStatus, cKeyFpr
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_confirm_key(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_by   uuid;
    v_id   uuid;
    v_fpr  text;
    v_node public."RtEdgeNode"%ROWTYPE;
BEGIN
    v_by  := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_id  := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_fpr := lower(regexp_replace(COALESCE(parameter ->> 'cKeyFpr', ''), '[^0-9A-Fa-f]', '', 'g'));

    IF NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_id IS NULL OR v_fpr !~ '^[0-9a-f]{64}$' THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid and the 64-hex-digit cKeyFpr are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF v_node."cStatus" <> 'C' THEN
        OPEN ref FOR SELECT -2 AS msg, format('There is no presented key to confirm (status %s)', v_node."cStatus") AS value, 'STATE' AS "cCode";
        RETURN ref;
    END IF;
    IF v_fpr IS DISTINCT FROM v_node."cKeyFpr" THEN
        PERFORM public.rtedge_event(v_id, NULL, 'confirm_key_mismatch',
            jsonb_build_object('cKeyFpr', v_node."cKeyFpr", 'cTypedFpr', v_fpr), v_by);
        OPEN ref FOR SELECT -2 AS msg, 'The fingerprint does not match the key the box presented' AS value, 'MISMATCH' AS "cCode";
        RETURN ref;
    END IF;

    UPDATE public."RtEdgeNode" SET "cStatus" = 'A' WHERE "nEdgeid" = v_id;
    PERFORM public.rtedge_event(v_id, NULL, 'confirm_key', jsonb_build_object('cKeyFpr', v_fpr, 'bTpmKey', v_node."bTpmKey"), v_by);

    OPEN ref FOR
        SELECT 1 AS msg, 'Venue box active' AS value, n."nEdgeid", n."cStatus", n."cKeyFpr"
          FROM public."RtEdgeNode" n
         WHERE n."nEdgeid" = v_id;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_get   (ref: 2)
--   in : nEdgeid
--   r1 : msg, value, nEdgeid, cName, cVenue, cSlug, cStatus, cPubKey, cKeyFpr,
--        bTpmKey, cLanIp, nCatPort, cVersion, cParserVer, dLastSeen, bOnline,
--        cLastEgress, cLastAsn, jHealth, dCertExp, nScopeAdmin, nCreatedBy,
--        dCreatedt, bEnrollPending, dEnrollExp
--        (or one msg -1 row)
--   r2 : the box's cases: nCaseid, cCaseno, cCasename, isArchived, dAssignedAt
--   Used by the /edge auth middleware (cPubKey, cStatus 'A') and admin screens.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_get(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id    uuid;
    v_found boolean;
BEGIN
    v_id := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_found := v_id IS NOT NULL AND EXISTS (SELECT 1 FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL);

    IF v_found THEN
        OPEN ref1 FOR
            SELECT 1 AS msg, 'Venue box' AS value,
                   n."nEdgeid", n."cName", n."cVenue", n."cSlug", n."cStatus", n."cPubKey", n."cKeyFpr", n."bTpmKey",
                   host(n."cLanIp") AS "cLanIp", n."nCatPort", n."cVersion", n."cParserVer", n."dLastSeen",
                   COALESCE(n."dLastSeen" > now() - interval '2 minutes', false) AS "bOnline",
                   host(n."cLastEgress") AS "cLastEgress", n."cLastAsn", n."jHealth", n."dCertExp",
                   n."nScopeAdmin", n."nCreatedBy", n."dCreatedt",
                   COALESCE(n."cEnrollHash" IS NOT NULL AND n."dEnrollExp" > now(), false) AS "bEnrollPending",
                   n."dEnrollExp"
              FROM public."RtEdgeNode" n
             WHERE n."nEdgeid" = v_id;
    ELSE
        OPEN ref1 FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
    END IF;
    RETURN NEXT ref1;

    OPEN ref2 FOR
        SELECT rc."nCaseid", c."cCaseno", c."cCasename", c."isArchived", rc."dCreatedt" AS "dAssignedAt"
          FROM public."RtEdgeCase" rc
          JOIN public."CaseMaster" c ON c."nCaseid" = rc."nCaseid"
         WHERE v_found AND rc."nEdgeid" = v_id
         ORDER BY c."cCaseno";
    RETURN NEXT ref2;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_list
--   in : nCaseid? (only boxes assigned to that case: the RT Production
--        feed-path picker), bAll? (also revoked boxes)
--   out: one row per box: msg, nEdgeid, cName, cVenue, cSlug, cStatus, cKeyFpr,
--        bTpmKey, cLanIp, nCatPort, cVersion, cParserVer, dLastSeen, bOnline,
--        cLastEgress, cLastAsn, dCertExp, nScopeAdmin, dCreatedt, bEnrollPending,
--        nCases, nLiveSessions
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_case_raw text;
    v_case     uuid;
    v_all      boolean;
BEGIN
    v_case_raw := public.rtedge_text(parameter ->> 'nCaseid');
    v_case     := public.rtedge_uuid(v_case_raw);
    v_all      := COALESCE(public.rtedge_bool(parameter ->> 'bAll'), false);

    IF v_case_raw IS NOT NULL AND v_case IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nCaseid is not a case id' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg,
               n."nEdgeid", n."cName", n."cVenue", n."cSlug", n."cStatus", n."cKeyFpr", n."bTpmKey",
               host(n."cLanIp") AS "cLanIp", n."nCatPort", n."cVersion", n."cParserVer", n."dLastSeen",
               COALESCE(n."dLastSeen" > now() - interval '2 minutes', false) AS "bOnline",
               host(n."cLastEgress") AS "cLastEgress", n."cLastAsn", n."dCertExp", n."nScopeAdmin", n."dCreatedt",
               COALESCE(n."cEnrollHash" IS NOT NULL AND n."dEnrollExp" > now(), false) AS "bEnrollPending",
               (SELECT count(*) FROM public."RtEdgeCase" rc WHERE rc."nEdgeid" = n."nEdgeid")::integer AS "nCases",
               (SELECT count(*) FROM public."RSessionMaster" r
                 WHERE r."nEdgeid" = n."nEdgeid" AND r."cFeedSource" = 'E'
                   AND r."cSyncState" IN ('L', 'S') AND r."dDelDt" IS NULL)::integer AS "nLiveSessions"
          FROM public."RtEdgeNode" n
         WHERE n."dDelDt" IS NULL
           AND (v_all OR n."cStatus" <> 'X')
           AND (v_case IS NULL
                OR EXISTS (SELECT 1 FROM public."RtEdgeCase" rc WHERE rc."nEdgeid" = n."nEdgeid" AND rc."nCaseid" = v_case))
         ORDER BY n."cName", n."cSlug";
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_revoke
--   in : nMasterid (super-admin), nEdgeid, cNote?
--   out: msg, value, bAlready, nEdgeid, cSlug, cStatus, nUnsealed, jUnsealed,
--        nUnsealedDeleted, jUnsealedDeleted
--   'X' is terminal. The key is kept so past signed seals stay verifiable;
--   the slug stays UNIQUE, so it is retired. The service disconnects the live
--   socket, revokes the certificate (ACME) and handles jUnsealed (split).
--   jUnsealedDeleted lists soft-deleted sessions still 'L' / 'S' on the box:
--   a revoked box never seals them, so they need a forced close.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_revoke(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_by       uuid;
    v_id       uuid;
    v_note     text;
    v_node     public."RtEdgeNode"%ROWTYPE;
    v_unsealed uuid[];
    v_deleted  uuid[];
BEGIN
    v_by   := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_id   := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_note := left(public.rtedge_text(parameter ->> 'cNote'), 400);

    IF NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_id IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid is required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    SELECT array_agg(r."nSesid" ORDER BY r."dStartDt") FILTER (WHERE r."dDelDt" IS NULL),
           array_agg(r."nSesid" ORDER BY r."dStartDt") FILTER (WHERE r."dDelDt" IS NOT NULL)
      INTO v_unsealed, v_deleted
      FROM public."RSessionMaster" r
     WHERE r."nEdgeid" = v_id AND r."cFeedSource" = 'E' AND r."cSyncState" IN ('L', 'S');

    IF v_node."cStatus" <> 'X' THEN
        UPDATE public."RtEdgeNode"
           SET "cStatus" = 'X', "cEnrollHash" = NULL, "dEnrollExp" = NULL
         WHERE "nEdgeid" = v_id;
        PERFORM public.rtedge_event(v_id, NULL, 'revoke',
            jsonb_build_object('cNote', v_note, 'cPrevStatus', v_node."cStatus", 'unsealed', COALESCE(to_jsonb(v_unsealed), '[]'::jsonb),
                               'unsealedDeleted', COALESCE(to_jsonb(v_deleted), '[]'::jsonb)),
            v_by);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, 'Venue box revoked' AS value, (v_node."cStatus" = 'X') AS "bAlready",
               v_id AS "nEdgeid", v_node."cSlug" AS "cSlug", 'X'::text AS "cStatus",
               COALESCE(cardinality(v_unsealed), 0) AS "nUnsealed",
               COALESCE(to_jsonb(v_unsealed), '[]'::jsonb) AS "jUnsealed",
               COALESCE(cardinality(v_deleted), 0) AS "nUnsealedDeleted",
               COALESCE(to_jsonb(v_deleted), '[]'::jsonb) AS "jUnsealedDeleted";
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_quarantine
--   in : nEdgeid, cAction ('Q' quarantine | 'A' re-approve), nMasterid
--        (optional for 'Q': the system quarantines a box seen on a new egress
--        ASN outside a hearing window; required super-admin for 'A'), cNote?
--   out: msg, value, bChanged, nEdgeid, cStatus
--   A 'Q' box may connect and report status but receives no assignments or
--   rosters, and its rounds are refused (spec 5.3).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_quarantine(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_by     uuid;
    v_by_raw text;
    v_id     uuid;
    v_action text;
    v_note   text;
    v_node   public."RtEdgeNode"%ROWTYPE;
BEGIN
    v_by_raw := public.rtedge_text(parameter ->> 'nMasterid');
    v_by     := public.rtedge_uuid(v_by_raw);
    v_id     := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_action := upper(public.rtedge_text(parameter ->> 'cAction'));
    v_note   := left(public.rtedge_text(parameter ->> 'cNote'), 400);

    IF v_id IS NULL OR v_action IS NULL OR v_action NOT IN ('Q', 'A') THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid and cAction (Q or A) are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;
    -- Re-approval is always an admin; a quarantine names an admin or no one (the system).
    IF (v_action = 'A' OR v_by_raw IS NOT NULL) AND NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    IF (v_action = 'Q' AND v_node."cStatus" = 'Q') OR (v_action = 'A' AND v_node."cStatus" = 'A') THEN
        OPEN ref FOR SELECT 1 AS msg, 'No change' AS value, false AS "bChanged", v_id AS "nEdgeid", v_node."cStatus"::text AS "cStatus";
        RETURN ref;
    END IF;
    IF (v_action = 'Q' AND v_node."cStatus" <> 'A') OR (v_action = 'A' AND v_node."cStatus" <> 'Q') THEN
        OPEN ref FOR SELECT -2 AS msg, format('Not possible from status %s', v_node."cStatus") AS value, 'STATE' AS "cCode";
        RETURN ref;
    END IF;

    UPDATE public."RtEdgeNode" SET "cStatus" = v_action WHERE "nEdgeid" = v_id;
    PERFORM public.rtedge_event(v_id, NULL, CASE WHEN v_action = 'Q' THEN 'quarantine' ELSE 'unquarantine' END,
        jsonb_build_object('cNote', v_note, 'cPrevStatus', v_node."cStatus", 'cLastEgress', host(v_node."cLastEgress"), 'cLastAsn', v_node."cLastAsn"),
        v_by);

    OPEN ref FOR SELECT 1 AS msg, CASE WHEN v_action = 'Q' THEN 'Venue box quarantined' ELSE 'Venue box re-approved' END AS value,
                        true AS "bChanged", v_id AS "nEdgeid", v_action AS "cStatus";
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_heartbeat
--   in : nEdgeid, cLastEgress?, cLastAsn?, jHealth?, cVersion?, cParserVer?,
--        cLanIp?, dCertExp? (expiry of the certificate the box has installed;
--        the "Venue box ready" gate refuses < 14 days), bForce? (hello: write
--        now, e.g. a new version or certificate)
--   out: msg, value, bWritten, nEdgeid, cStatus, dLastSeen, dCertExp,
--        cPrevEgress, cPrevAsn, cPrevVersion, cPrevParserVer
--   Writes at most once per ~minute (55 s, so a once-a-minute caller is never
--   skipped by jitter). Live status stays in Redis. The previous egress / ASN
--   come back so the service can apply the new-ASN quarantine rule.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_heartbeat(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id      uuid;
    v_egr_raw text;
    v_egr     inet;
    v_asn     text;
    v_health  jsonb;
    v_ver     text;
    v_pver    text;
    v_lan_raw text;
    v_lan     inet;
    v_crt_raw text;
    v_crt     timestamptz;
    v_force   boolean;
    v_due     boolean;
    v_node    public."RtEdgeNode"%ROWTYPE;
BEGIN
    v_id      := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_egr_raw := public.rtedge_text(parameter ->> 'cLastEgress');
    v_egr     := public.rtedge_inet(v_egr_raw);
    v_asn     := public.rtedge_text(parameter ->> 'cLastAsn');
    v_health  := public.rtedge_jsonb(parameter ->> 'jHealth');
    v_ver     := public.rtedge_text(parameter ->> 'cVersion');
    v_pver    := public.rtedge_text(parameter ->> 'cParserVer');
    v_lan_raw := public.rtedge_text(parameter ->> 'cLanIp');
    v_lan     := public.rtedge_inet(v_lan_raw);
    v_crt_raw := public.rtedge_text(parameter ->> 'dCertExp');
    v_force   := COALESCE(public.rtedge_bool(parameter ->> 'bForce'), false);
    BEGIN
        v_crt := v_crt_raw::timestamptz;
    EXCEPTION WHEN others THEN
        v_crt := NULL;
    END;

    IF v_id IS NULL
       OR (v_egr_raw IS NOT NULL AND v_egr IS NULL) OR (v_lan_raw IS NOT NULL AND v_lan IS NULL)
       OR (v_crt_raw IS NOT NULL AND v_crt IS NULL)
       OR length(v_asn) > 20 OR length(v_ver) > 40 OR length(v_pver) > 60 THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid is required; cLastEgress / cLanIp must be IP addresses, dCertExp a timestamp' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;

    v_due := v_force OR v_node."dLastSeen" IS NULL OR v_node."dLastSeen" <= now() - interval '55 seconds';
    IF v_due THEN
        UPDATE public."RtEdgeNode"
           SET "dLastSeen"   = now(),
               "cLastEgress" = COALESCE(v_egr, "cLastEgress"),
               "cLastAsn"    = COALESCE(v_asn, "cLastAsn"),
               "jHealth"     = COALESCE(v_health, "jHealth"),
               "cVersion"    = COALESCE(v_ver, "cVersion"),
               "cParserVer"  = COALESCE(v_pver, "cParserVer"),
               "cLanIp"      = COALESCE(v_lan, "cLanIp"),
               "dCertExp"    = COALESCE(v_crt, "dCertExp")
         WHERE "nEdgeid" = v_id;
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, CASE WHEN v_due THEN 'Heartbeat stored' ELSE 'Throttled' END AS value,
               v_due AS "bWritten", n."nEdgeid", n."cStatus", n."dLastSeen", n."dCertExp",
               host(v_node."cLastEgress") AS "cPrevEgress", v_node."cLastAsn" AS "cPrevAsn",
               v_node."cVersion" AS "cPrevVersion", v_node."cParserVer" AS "cPrevParserVer"
          FROM public."RtEdgeNode" n
         WHERE n."nEdgeid" = v_id;
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_case_set
--   in : nMasterid (super-admin; the box's scoping admin once one is set),
--        nEdgeid, nCaseid, permission ('I' assign | 'D' unassign)
--   out: msg, value, bChanged, bAssigned, nEdgeid, nCaseid
--   One scoping super-admin per box until tenancy is defined (Q5): the first
--   assignment claims an unset "nScopeAdmin". Unassigning a case that still
--   has an unsealed session on the box is refused (it would cut the room's
--   edge tokens off mid-hearing, D22).
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rtedge_case_set(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_by    uuid;
    v_id    uuid;
    v_case  uuid;
    v_perm  text;
    v_node  public."RtEdgeNode"%ROWTYPE;
    v_rows  integer;
    v_open  integer;
BEGIN
    v_by   := public.rtedge_uuid(parameter ->> 'nMasterid');
    v_id   := public.rtedge_uuid(parameter ->> 'nEdgeid');
    v_case := public.rtedge_uuid(parameter ->> 'nCaseid');
    v_perm := upper(public.rtedge_text(parameter ->> 'permission'));

    IF NOT public.rtedge_is_admin(v_by) THEN
        OPEN ref FOR SELECT -3 AS msg, 'Admin rights required' AS value, 'NOT_ALLOWED' AS "cCode";
        RETURN ref;
    END IF;
    IF v_id IS NULL OR v_case IS NULL OR v_perm IS NULL OR v_perm NOT IN ('I', 'D') THEN
        OPEN ref FOR SELECT -1 AS msg, 'nEdgeid, nCaseid and permission (I or D) are required' AS value, 'INVALID' AS "cCode";
        RETURN ref;
    END IF;

    SELECT * INTO v_node FROM public."RtEdgeNode" WHERE "nEdgeid" = v_id AND "dDelDt" IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 AS msg, 'Venue box not found' AS value, 'NOT_FOUND' AS "cCode";
        RETURN ref;
    END IF;
    IF v_node."nScopeAdmin" IS NOT NULL AND v_node."nScopeAdmin" <> v_by THEN
        OPEN ref FOR SELECT -3 AS msg, 'Only the box''s scoping admin may change its cases' AS value, 'NOT_SCOPE_ADMIN' AS "cCode";
        RETURN ref;
    END IF;

    IF v_perm = 'I' THEN
        IF v_node."cStatus" = 'X' THEN
            OPEN ref FOR SELECT -2 AS msg, 'The venue box is revoked' AS value, 'REVOKED' AS "cCode";
            RETURN ref;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public."CaseMaster" WHERE "nCaseid" = v_case) THEN
            OPEN ref FOR SELECT -1 AS msg, 'Case not found' AS value, 'NOT_FOUND' AS "cCode";
            RETURN ref;
        END IF;
        INSERT INTO public."RtEdgeCase" ("nEdgeid", "nCaseid", "nCreatedBy")
        VALUES (v_id, v_case, v_by)
        ON CONFLICT ("nEdgeid", "nCaseid") DO NOTHING;
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        IF v_node."nScopeAdmin" IS NULL THEN
            UPDATE public."RtEdgeNode" SET "nScopeAdmin" = v_by WHERE "nEdgeid" = v_id;
        END IF;
        IF v_rows > 0 THEN
            PERFORM public.rtedge_event(v_id, NULL, 'case_assign', jsonb_build_object('nCaseid', v_case), v_by);
        END IF;
        OPEN ref FOR SELECT 1 AS msg, 'Case assigned to the venue box' AS value, (v_rows > 0) AS "bChanged", true AS "bAssigned",
                            v_id AS "nEdgeid", v_case AS "nCaseid";
        RETURN ref;
    END IF;

    SELECT count(*) INTO v_open
      FROM public."RSessionMaster" r
     WHERE r."nEdgeid" = v_id AND r."nCaseid" = v_case AND r."cFeedSource" = 'E'
       AND r."cSyncState" IN ('L', 'S') AND r."dDelDt" IS NULL;
    IF v_open > 0 THEN
        OPEN ref FOR SELECT -2 AS msg, format('The case has %s unsealed session(s) on this box; end and seal them (or split) first', v_open) AS value,
                            'UNSEALED_SESSIONS' AS "cCode";
        RETURN ref;
    END IF;

    DELETE FROM public."RtEdgeCase" WHERE "nEdgeid" = v_id AND "nCaseid" = v_case;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
        PERFORM public.rtedge_event(v_id, NULL, 'case_unassign', jsonb_build_object('nCaseid', v_case), v_by);
    END IF;
    OPEN ref FOR SELECT 1 AS msg, 'Case unassigned from the venue box' AS value, (v_rows > 0) AS "bChanged", false AS "bAssigned",
                        v_id AS "nEdgeid", v_case AS "nCaseid";
    RETURN ref;
END
$function$;

--------------------------------------------------------------------------
-- et_rtedge_assignments   (ref: 5)  the box's pull on every e.hello
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
--        cHearingOpLname, nPartNo, nPrevPartSesid, nNextPartSesid, bDeleted,
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
