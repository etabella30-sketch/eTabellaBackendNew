-- 2026-10-01_rt_edge_04_helpers.sql
--
-- RT venue edge box: internal helpers for the et_rtedge_* stored procedures
-- (files 05-08). They carry the rtedge_ prefix WITHOUT et_, so executeRef
-- (which always calls public.et_<name>) can never reach them from a route.
--
-- Parameter parsing follows executeRef (libs/global/src/db/pg): the request
-- arrives as one json object; 'c' keys arrive as '' when empty, 'n' keys as
-- given, 'j' keys as a JSON string. The parsers below never raise: a malformed
-- value becomes NULL, and each SP turns a NULL required value into a
-- msg -1 row instead of an SQL error.
--
-- Apply to dev etabella_tech_uuid only (guard below), after files 01 and 02
-- (the SQL-language helpers are checked against those tables at CREATE time).
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_04_helpers: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regclass('public."RtEdgeEvent"') IS NULL
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'RSessionMaster' AND column_name = 'nPrevPartSesid') THEN
        RAISE EXCEPTION 'rt_edge_04_helpers: apply 2026-10-01_rt_edge_01_tables.sql and _02_session_columns.sql first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- Value parsers (never raise)
--------------------------------------------------------------------------

-- Trimmed text, NULL when empty (executeRef sends '' for an empty 'c' key).
CREATE OR REPLACE FUNCTION public.rtedge_text(p_text text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT NULLIF(btrim(p_text), '')
$function$;

CREATE OR REPLACE FUNCTION public.rtedge_uuid(p_text text)
 RETURNS uuid
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v text := btrim(p_text);
BEGIN
    IF v IS NULL OR v !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN NULL;
    END IF;
    RETURN v::uuid;
END
$function$;

CREATE OR REPLACE FUNCTION public.rtedge_int(p_text text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v text := btrim(p_text);
BEGIN
    IF v IS NULL OR v !~ '^-?[0-9]{1,9}$' THEN
        RETURN NULL;
    END IF;
    RETURN v::integer;
END
$function$;

CREATE OR REPLACE FUNCTION public.rtedge_bigint(p_text text)
 RETURNS bigint
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v text := btrim(p_text);
BEGIN
    IF v IS NULL OR v !~ '^-?[0-9]{1,18}$' THEN
        RETURN NULL;
    END IF;
    RETURN v::bigint;
END
$function$;

CREATE OR REPLACE FUNCTION public.rtedge_bool(p_text text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT CASE
             WHEN lower(btrim(p_text)) IN ('true', 't', '1', 'yes', 'y') THEN true
             WHEN lower(btrim(p_text)) IN ('false', 'f', '0', 'no', 'n') THEN false
           END
$function$;

-- A JSON value from a 'j' key: executeRef sends it as a JSON string, a direct
-- caller may nest it; a doubly-stringified value is unwrapped once.
CREATE OR REPLACE FUNCTION public.rtedge_jsonb(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v jsonb;
BEGIN
    IF p_text IS NULL OR btrim(p_text) = '' THEN
        RETURN NULL;
    END IF;
    v := p_text::jsonb;
    IF jsonb_typeof(v) = 'string' THEN
        BEGIN
            v := (v #>> '{}')::jsonb;
        EXCEPTION WHEN others THEN
            NULL; -- a plain string value stays a string
        END;
    END IF;
    RETURN v;
EXCEPTION WHEN others THEN
    RETURN NULL;
END
$function$;

CREATE OR REPLACE FUNCTION public.rtedge_inet(p_text text)
 RETURNS inet
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    IF p_text IS NULL OR btrim(p_text) = '' THEN
        RETURN NULL;
    END IF;
    RETURN btrim(p_text)::inet;
EXCEPTION WHEN others THEN
    RETURN NULL;
END
$function$;

-- Timestamps are hearing wall-clock values (timestamp without time zone), as
-- RSessionMaster."dStartDt" is everywhere else.
CREATE OR REPLACE FUNCTION public.rtedge_timestamp(p_text text)
 RETURNS timestamp
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    IF p_text IS NULL OR btrim(p_text) = '' THEN
        RETURN NULL;
    END IF;
    RETURN btrim(p_text)::timestamp;
EXCEPTION WHEN others THEN
    RETURN NULL;
END
$function$;

-- Digests and chain hashes: sha256 as lowercase hex (64) is expected; base64 /
-- base64url forms up to 64 characters are accepted as opaque values. They are
-- stored as given and compared byte for byte.
CREATE OR REPLACE FUNCTION public.rtedge_hash_ok(p_text text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT COALESCE(p_text ~ '^[0-9A-Za-z+/=_-]{16,64}$', false)
$function$;

-- The DER of a P-256 SubjectPublicKeyInfo (uncompressed point, 91 bytes) from
-- standard base64, or NULL when the text is anything else.
CREATE OR REPLACE FUNCTION public.rtedge_p256_spki(p_b64 text)
 RETURNS bytea
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v bytea;
BEGIN
    IF p_b64 IS NULL OR p_b64 = '' THEN
        RETURN NULL;
    END IF;
    v := decode(p_b64, 'base64');
    -- SEQUENCE { SEQUENCE { id-ecPublicKey, prime256v1 }, BIT STRING 0x04 || X || Y }
    IF octet_length(v) = 91
       AND substring(v FROM 1 FOR 27) = decode('3059301306072a8648ce3d020106082a8648ce3d03010703420004', 'hex') THEN
        RETURN v;
    END IF;
    RETURN NULL;
EXCEPTION WHEN others THEN
    RETURN NULL;
END
$function$;

--------------------------------------------------------------------------
-- Who may act
--------------------------------------------------------------------------

-- Global (super) admin: the UserMaster flag the realtime session's isAdmin comes from.
CREATE OR REPLACE FUNCTION public.rtedge_is_admin(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT p_user IS NOT NULL
       AND EXISTS (SELECT 1 FROM public."UserMaster" u WHERE u."nUserid" = p_user AND u."isAdmin" IS TRUE)
$function$;

-- RoleMaster id of the per-case "Case Admin" role (CASE_ADMIN_ROLE_ID in
-- libs/global case.admin.middleware.ts and realtime-auth.middleware.ts).
CREATE OR REPLACE FUNCTION public.rtedge_case_admin_role()
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid
$function$;

CREATE OR REPLACE FUNCTION public.rtedge_is_case_admin(p_case uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT p_case IS NOT NULL AND p_user IS NOT NULL
       AND EXISTS (SELECT 1 FROM public."TeamRelation" t
                    WHERE t."nCaseid" = p_case AND t."nUserid" = p_user
                      AND t."nRoleid" = public.rtedge_case_admin_role())
$function$;

--------------------------------------------------------------------------
-- Sessions
--------------------------------------------------------------------------

-- Hearing wall clock "now" in the session's zone (the zone is validated the
-- way LIVE_ROUTE_SESSIONS_SQL does); the DB zone for a legacy or unknown name.
CREATE OR REPLACE FUNCTION public.rtedge_local_now(p_tz text)
 RETURNS timestamp
 LANGUAGE sql
 STABLE
AS $function$
    SELECT COALESCE(
             (SELECT now() AT TIME ZONE z.name FROM pg_timezone_names z WHERE z.name = p_tz LIMIT 1),
             localtimestamp)
$function$;

-- The live next part of a split hearing (D7), or NULL.
CREATE OR REPLACE FUNCTION public.rtedge_successor(p_ses uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
    SELECT r."nSesid" FROM public."RSessionMaster" r
     WHERE r."nPrevPartSesid" = p_ses AND r."dDelDt" IS NULL
     LIMIT 1
$function$;

-- Warning-level incidents in a seal's incident list (spec 4.1). An element is
-- info only when it is not a known warning kind, does not say level
-- 'warning', and is a known info kind or says level 'info'. So a known warning
-- kind can never be downgraded, CAT_DISCONNECT can be upgraded by level
-- 'warning' (G0), and an unknown kind without a level counts as a warning.
CREATE OR REPLACE FUNCTION public.rtedge_incident_warnings(p_incidents jsonb)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT count(*)::integer
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_incidents) = 'array' THEN p_incidents ELSE '[]'::jsonb END) AS e(item)
     WHERE NOT (
               upper(COALESCE(e.item ->> 'kind', '')) <> ALL (ARRAY['ABORTED_WINDOW', 'DEGRADED_DURABILITY', 'JOURNAL_CORRUPT',
                                                                    'REBASE', 'REPLAY_DIVERGED', 'SHRINK_CONFIRMED',
                                                                    'AUDIT_MISMATCH', 'SWITCH_UNDRAINED', 'CONCURRENT_CAT',
                                                                    'CLOCK_UNVERIFIED'])
           AND lower(COALESCE(e.item ->> 'level', '')) NOT IN ('warning', 'warn')
           AND (upper(COALESCE(e.item ->> 'kind', '')) IN ('CAT_DISCONNECT', 'TAIL_TRUNCATED', 'LOCKOUT')
                OR lower(COALESCE(e.item ->> 'level', '')) = 'info')
           )
$function$;

-- The publish / export gate verdict for one session (spec 4.4). Ok verdicts:
-- NOT_GATED, COMPLETE, ACKED, FORCED; LIVE is ok for an export only (stamped
-- "Live - as of"). Order matters: a session still live or awaiting its seal
-- says so before pending orphans do.
CREATE OR REPLACE FUNCTION public.rtedge_gate_reason(p_gated boolean, p_state text, p_ack timestamptz, p_pending integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT CASE
             WHEN NOT COALESCE(p_gated, false)          THEN 'NOT_GATED'
             WHEN p_state = 'L'                         THEN 'LIVE'
             WHEN p_state = 'S'                         THEN 'AWAITING_SEAL'
             WHEN COALESCE(p_pending, 0) > 0            THEN 'PENDING_ORPHANS'
             WHEN p_state = 'K'                         THEN 'COMPLETE'
             WHEN p_state = 'W' AND p_ack IS NOT NULL   THEN 'ACKED'
             WHEN p_state = 'W'                         THEN 'NEEDS_ACK'
             WHEN p_state = 'F'                         THEN 'FORCED'
             ELSE 'NO_STATE'
           END
$function$;

-- The interval a dismissed held stream leaves out, for the 'F' watermark
-- "INCOMPLETE - venue data missing <interval>" (S-D8, S-D15): hearing wall
-- clock in the session's zone (the DB zone for a legacy or unknown name) when
-- the stream's times are known, else its raw seq range.
CREATE OR REPLACE FUNCTION public.rtedge_orphan_interval(p_from timestamptz, p_to timestamptz,
                                                         p_from_seq bigint, p_to_seq bigint, p_tz text)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
    SELECT CASE
             WHEN t.f IS NOT NULL AND t.e IS NOT NULL THEN
                  to_char(t.f, 'YYYY-MM-DD HH24:MI:SS') || '-'
                  || to_char(t.e, CASE WHEN t.f::date = t.e::date THEN 'HH24:MI:SS' ELSE 'YYYY-MM-DD HH24:MI:SS' END)
             WHEN t.f IS NOT NULL THEN 'from ' || to_char(t.f, 'YYYY-MM-DD HH24:MI:SS')
             WHEN t.e IS NOT NULL THEN 'until ' || to_char(t.e, 'YYYY-MM-DD HH24:MI:SS')
             WHEN p_from_seq IS NOT NULL OR p_to_seq IS NOT NULL THEN
                  'raw seq ' || COALESCE(p_from_seq::text, '?') || '-' || COALESCE(p_to_seq::text, '?')
             ELSE 'extent unknown'
           END
      FROM (SELECT p_from AT TIME ZONE z.tz AS f, p_to AT TIME ZONE z.tz AS e
              FROM (SELECT COALESCE((SELECT n.name FROM pg_timezone_names n WHERE n.name = p_tz LIMIT 1),
                                    current_setting('TimeZone')) AS tz) AS z) AS t
$function$;

--------------------------------------------------------------------------
-- Audit
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rtedge_event(p_edge uuid, p_ses uuid, p_type text, p_data jsonb, p_by uuid)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id bigint;
BEGIN
    INSERT INTO public."RtEdgeEvent" ("nEdgeid", "nSesid", "cType", "jData", "nByUser")
    VALUES (p_edge, p_ses, p_type, p_data, p_by)
    RETURNING "nId" INTO v_id;
    RETURN v_id;
END
$function$;

COMMIT;
