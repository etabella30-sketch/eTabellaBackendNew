-- 2026-10-01_rt_edge_01_tables.sql
--
-- RT venue edge box (spec docs/rt-local-edge-spec.md rev 3, section 4.8; plan
-- decision ledger D1-D34). Four new tables, nothing else:
--
--   "RtEdgeNode"   one row per venue box (device lifecycle P -> C -> A, Q, X).
--   "RtEdgeCase"   the cases a box may serve. Scopes the box dashboard (D32) and
--                  edge tokens in the cloud (D22). Sessions are created only in
--                  cloud admin (D27); there is no box-side creation.
--   "RtEdgeEvent"  append-only audit: online/offline/bind/ready/seal/split/
--                  enroll/confirm_key/quarantine/revoke/orphan/alert/...
--   "RtEdgeOrphan" held venue/cloud bytes that are NOT in the transcript lineage:
--                  'H' a direct stream for an 'E' session held by the cloud
--                  listener, 'C' a second CAT connection held by the box.
--                  'F' (fenced edge tail) is reserved for Phase-4 in-session
--                  failover (D1). Kind 'U' (unclaimed capture) and status 'K'
--                  (claimed) are gone with the capture store (D3, D27).
--
-- NOT here, on purpose:
--   * Venue-session sync metadata (appliedRev, appliedRawSeq/appliedRawHash,
--     digests, root) lives in Redis edge:meta:<nSesid> and in
--     data/journal/<nSesid>/edge-meta.json (D10). PG keeps only the throttled
--     fallback watermark on RSessionMaster (file 02).
--   * Room codes and the daily operator code live only in the box's SQLite
--     (spec 4.10, D33, DR7, DR10). The cloud never stores either, not even a
--     hash; minting the operator code is audited in "RtEdgeEvent" only.
--
-- Apply to dev etabella_tech_uuid only (guard below). Apply order and rollback:
-- 2026-10-01_rt_edge_README.md. Idempotent: safe to re-run.

BEGIN;

-- Safety guard: dev only. Inside the transaction on purpose: a RAISE here
-- aborts it, so every later statement is rejected until COMMIT rolls the whole
-- file back, even when psql runs without ON_ERROR_STOP.
DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_01_tables: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- RtEdgeNode: the venue boxes
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."RtEdgeNode" (
    "nEdgeid"     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "cName"       varchar(120) NOT NULL,
    "cVenue"      varchar(200),
    "cSlug"       varchar(40)  NOT NULL,          -- opaque: <slug>.etabella-edge.net (CT logs are public); never reused
    "cPubKey"     text,                           -- ECDSA P-256 SPKI, standard base64 (no line breaks), set at enroll
    "cKeyFpr"     varchar(64),                    -- sha256(SPKI DER) hex; the admin confirms it against the box console
    "bTpmKey"     boolean NOT NULL DEFAULT false, -- false = TPM-sealed software key (pilot boxes, D2)
    "cEnrollHash" varchar(128),                   -- sha256 hex of the one-time 128-bit enrollment code; never the code
    "dEnrollExp"  timestamptz,                    -- code expiry (15 minutes after issue)
    "nEnrollBy"   uuid,                           -- admin who issued the current code
    "cStatus"     char(1) NOT NULL DEFAULT 'P',   -- P pending enrollment, C key presented (await confirm), A active, Q quarantined, X revoked
    "cLanIp"      inet,                           -- box address on the transmitter (CAT) network, shown to the reporter
    "nCatPort"    integer NOT NULL DEFAULT 2500,
    "cVersion"    varchar(40),                    -- rt-edge image version (release manifest, D6)
    "cParserVer"  varchar(60),                    -- FEED_PARSE_VERSION the box runs (D6)
    "dLastSeen"   timestamptz,                    -- throttled heartbeat (<= once a minute); live status is in Redis
    "cLastEgress" inet,
    "cLastAsn"    varchar(20),
    "jHealth"     jsonb,
    "dCertExp"    timestamptz,
    "nScopeAdmin" uuid,                           -- the one super-admin who scopes this box's cases (single tenant until Q5)
    "nCreatedBy"  uuid,
    "dCreatedt"   timestamptz NOT NULL DEFAULT now(),
    "dDelDt"      timestamptz,
    CONSTRAINT "RtEdgeNode_cSlug_key"         UNIQUE ("cSlug"),
    CONSTRAINT "RtEdgeNode_cStatus_check"     CHECK ("cStatus" IN ('P', 'C', 'A', 'Q', 'X')),
    CONSTRAINT "RtEdgeNode_cSlug_check"       CHECK ("cSlug" ~ '^[a-z0-9]{6,40}$'),
    CONSTRAINT "RtEdgeNode_nCatPort_check"    CHECK ("nCatPort" BETWEEN 1 AND 65535),
    CONSTRAINT "RtEdgeNode_cEnrollHash_check" CHECK ("cEnrollHash" IS NULL OR "cEnrollHash" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "RtEdgeNode_cKeyFpr_check"     CHECK ("cKeyFpr" IS NULL OR "cKeyFpr" ~ '^[0-9a-f]{64}$')
);

-- Enrollment looks the node up by the code's hash.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_rtedgenode_cenrollhash"
    ON public."RtEdgeNode" ("cEnrollHash") WHERE "cEnrollHash" IS NOT NULL;

COMMENT ON TABLE public."RtEdgeNode" IS
  'RT venue edge boxes (spec 4.8). cStatus P pending enrollment, C key presented, A active, Q quarantined, X revoked.';
COMMENT ON COLUMN public."RtEdgeNode"."cEnrollHash" IS
  'sha256 hex of the one-time 128-bit enrollment code. The code itself is never stored.';

--------------------------------------------------------------------------
-- RtEdgeCase: the cases a box may serve (D22, D27, D32)
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."RtEdgeCase" (
    "nEdgeid"    uuid NOT NULL REFERENCES public."RtEdgeNode" ("nEdgeid"),
    -- et_admin_case_delete hard-deletes CaseMaster rows: the assignment goes with the case.
    "nCaseid"    uuid NOT NULL REFERENCES public."CaseMaster" ("nCaseid") ON DELETE CASCADE,
    "nCreatedBy" uuid,
    "dCreatedt"  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("nEdgeid", "nCaseid")
);

-- The edge-token case-scope check (D22) and the RT Production feed-path picker read by case.
CREATE INDEX IF NOT EXISTS "ix_rtedgecase_ncaseid" ON public."RtEdgeCase" ("nCaseid");

COMMENT ON TABLE public."RtEdgeCase" IS
  'Cases a venue box may serve: scopes the box dashboard (D32) and edge tokens in the cloud (D22).';

--------------------------------------------------------------------------
-- RtEdgeEvent: audit (append-only)
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."RtEdgeEvent" (
    "nId"     bigserial PRIMARY KEY,
    "nEdgeid" uuid,
    "nSesid"  uuid,
    "cType"   varchar(30) NOT NULL,
    "jData"   jsonb,                               -- never a password, password hash, code or code hash
    "nByUser" uuid,                                -- NULL = the device or the system
    "dAt"     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "RtEdgeEvent_cType_check" CHECK ("cType" ~ '^[a-z][a-z0-9_.-]{0,29}$')
);

CREATE INDEX IF NOT EXISTS "ix_rtedgeevent_ses"  ON public."RtEdgeEvent" ("nSesid", "dAt");
CREATE INDEX IF NOT EXISTS "ix_rtedgeevent_edge" ON public."RtEdgeEvent" ("nEdgeid", "dAt");

COMMENT ON TABLE public."RtEdgeEvent" IS
  'RT edge audit trail: lifecycle, bind, split, seal (signed seal JSON), orphans, alerts, admin actions.';

--------------------------------------------------------------------------
-- RtEdgeOrphan: held bytes outside the transcript lineage
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."RtEdgeOrphan" (
    "nOrphanid"     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "nSesid"        uuid NULL,
    "nEdgeid"       uuid,
    "nEpoch"        integer,
    "cKind"         char(1) NOT NULL,              -- H held direct stream (cloud), C concurrent CAT connection (box);
                                                   -- F fenced edge tail: Phase 4 (D1); U unclaimed capture: removed (D3, D27)
    "bInTranscript" boolean NOT NULL DEFAULT false, -- raw already reflected in pages (forensic copy only)
    "cUser"         varchar(64),
    "cPeer"         inet,
    "nFromSeq"      bigint,
    "nToSeq"        bigint,
    "dFrom"         timestamptz,
    "dTo"           timestamptz,
    "cObjectKey"    text,                          -- DO Spaces key of the raw bytes
    "cLinesKey"     text,                          -- DO Spaces key of rendered lines (addendum source)
    "cSha256"       varchar(64),
    "nBytes"        bigint,                        -- held byte count, for the 200 MB / 1 GB caps (spec 4.5)
    "cStatus"       char(1) NOT NULL DEFAULT 'P',  -- P pending, D dismissed (note), A addendum produced, M reserved (splice: not implemented)
    "cNote"         varchar(400),
    "nResolvedBy"   uuid,
    "dResolvedAt"   timestamptz,
    "dCreatedt"     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "RtEdgeOrphan_cKind_check"   CHECK ("cKind" IN ('H', 'C', 'F')),
    CONSTRAINT "RtEdgeOrphan_cStatus_check" CHECK ("cStatus" IN ('P', 'D', 'A', 'M')),
    CONSTRAINT "RtEdgeOrphan_nBytes_check"  CHECK ("nBytes" IS NULL OR "nBytes" >= 0),
    CONSTRAINT "RtEdgeOrphan_seq_check"     CHECK ("nFromSeq" IS NULL OR "nToSeq" IS NULL OR "nToSeq" >= "nFromSeq")
);

-- The publish gate counts pending orphans per session.
CREATE INDEX IF NOT EXISTS "ix_rtedgeorphan_ses" ON public."RtEdgeOrphan" ("nSesid", "cStatus");

COMMENT ON TABLE public."RtEdgeOrphan" IS
  'Held RT bytes outside the transcript lineage (kinds H, C; F reserved for Phase 4). A pending row blocks publish.';

COMMIT;
