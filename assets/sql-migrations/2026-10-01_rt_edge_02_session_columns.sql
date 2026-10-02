-- 2026-10-01_rt_edge_02_session_columns.sql
--
-- RT venue edge box: per-session columns on "RSessionMaster" (spec rev 3,
-- sections 4.1, 4.4, 4.5, 4.8). Every column is nullable or has a default, so
-- the pre-edge realtime-server release keeps working against this schema.
--
--   "cFeedSource"     NULL legacy/unknown (never refused), D direct to cloud,
--                     E venue edge, H legacy venue lane, W reserved (WSS plan)
--   "bEverEdge"       set at the first bind, never cleared: drives the publish
--                     gate after a split (D7), so a split cannot bypass it
--   "cApply"          cloud-direct only: C cut mode, L legacy dispatch
--   "nEdgeid"         the bound box ("RtEdgeNode")
--   "nIngestEpoch"    single-writer fence; only the cloud bumps it (Phase 4)
--   "nRebaseSeq"      seq of the current lineage's REBASE_BEGIN (NULL = genesis)
--   "nAppliedRawSeq"  throttled lineage watermark (<= 60 s lag; exact at split
--   "cAppliedRawHash"   and seal). The live (seq, hash) pair of D19 is in edge
--                     meta (D10, Redis + data/journal/<nSesid>/edge-meta.json);
--                     this pair is only the fallback after a cloud state loss.
--                     cAppliedRawHash is the O-7 storage (see README).
--   "nHearingOpid"    case admin who may split or unlock during the hearing
--   "cSyncState"      L live, S end requested / split Part 1 awaiting its box,
--                     K complete, W complete with warnings (publish needs an
--                     acknowledgement), F forced incomplete (super-admin)
--   "jIncidents" "dWarnAckAt" "nWarnAckBy" "cFinalDigest" "nFinalLines"
--   "nRawFinalSeq" "cRawFinalHash" "dSealedAt" "cSealNote"   seal record (5.7)
--   "cParserVer"      FEED_PARSE_VERSION pinned per session. tools/ci
--                     rt-deploy-check reads it for unsealed cFeedSource='E'
--                     sessions (D6).
--   "nPrevPartSesid"  D7: on a split's Part 2, the id of Part 1
--   "nPartNo"         D7: part order within a split hearing (Part 1 = 1, each
--                     split adds 1; numbering rule O-6, see README)
--
-- Back-fill: legacy venue rows (cSessionUnicId set) become 'H'. The INSERT of
-- realtime.et_sessions_builder is changed in file 03.
--
-- SymmetricDS: "RSessionMaster" carries sym capture triggers
-- (fsym_on_*_for_pblc_rsssnmstr_trg_lv_grp). The back-fill UPDATE fires them
-- once per legacy row (no-op row images for the old column list). Review the
-- sym_trigger config for RSessionMaster before applying anywhere SymmetricDS
-- runs (README, "SymmetricDS").
--
-- Apply to dev etabella_tech_uuid only (guard below), after file 01.
-- Idempotent: safe to re-run.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'rt_edge_02_session_columns: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
    IF to_regclass('public."RtEdgeNode"') IS NULL THEN
        RAISE EXCEPTION 'rt_edge_02_session_columns: apply 2026-10-01_rt_edge_01_tables.sql first';
    END IF;
END
$guard$;

--------------------------------------------------------------------------
-- Columns
--------------------------------------------------------------------------
ALTER TABLE public."RSessionMaster"
    ADD COLUMN IF NOT EXISTS "cFeedSource"     char(1)      NULL,
    ADD COLUMN IF NOT EXISTS "bEverEdge"       boolean      NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "cApply"          char(1)      NULL,
    ADD COLUMN IF NOT EXISTS "nEdgeid"         uuid         NULL REFERENCES public."RtEdgeNode" ("nEdgeid"),
    ADD COLUMN IF NOT EXISTS "nIngestEpoch"    integer      NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "nRebaseSeq"      bigint       NULL,
    ADD COLUMN IF NOT EXISTS "nAppliedRawSeq"  bigint       NULL,
    ADD COLUMN IF NOT EXISTS "cAppliedRawHash" varchar(64)  NULL,
    ADD COLUMN IF NOT EXISTS "nHearingOpid"    uuid         NULL,
    ADD COLUMN IF NOT EXISTS "cSyncState"      char(1)      NULL,
    ADD COLUMN IF NOT EXISTS "jIncidents"      jsonb        NULL,
    ADD COLUMN IF NOT EXISTS "dWarnAckAt"      timestamptz  NULL,
    ADD COLUMN IF NOT EXISTS "nWarnAckBy"      uuid         NULL,
    ADD COLUMN IF NOT EXISTS "cFinalDigest"    varchar(64)  NULL,
    ADD COLUMN IF NOT EXISTS "nFinalLines"     integer      NULL,
    ADD COLUMN IF NOT EXISTS "nRawFinalSeq"    bigint       NULL,
    ADD COLUMN IF NOT EXISTS "cRawFinalHash"   varchar(64)  NULL,
    ADD COLUMN IF NOT EXISTS "dSealedAt"       timestamptz  NULL,
    ADD COLUMN IF NOT EXISTS "cParserVer"      varchar(60)  NULL,
    ADD COLUMN IF NOT EXISTS "cSealNote"       varchar(200) NULL,
    ADD COLUMN IF NOT EXISTS "nPrevPartSesid"  uuid         NULL,
    ADD COLUMN IF NOT EXISTS "nPartNo"         smallint     NULL;

--------------------------------------------------------------------------
-- Constraints (added once; a re-run never replaces a later definition)
--------------------------------------------------------------------------
DO $cons$
DECLARE
    v_rel regclass := 'public."RSessionMaster"'::regclass;
    v_def record;
BEGIN
    FOR v_def IN
        SELECT * FROM (VALUES
            ('RSessionMaster_cFeedSource_check',
             'CHECK ("cFeedSource" IS NULL OR "cFeedSource" IN (''D'', ''E'', ''H'', ''W''))'),
            ('RSessionMaster_cApply_check',
             'CHECK ("cApply" IS NULL OR "cApply" IN (''C'', ''L''))'),
            ('RSessionMaster_cSyncState_check',
             'CHECK ("cSyncState" IS NULL OR "cSyncState" IN (''L'', ''S'', ''K'', ''W'', ''F''))'),
            ('RSessionMaster_nIngestEpoch_check',
             'CHECK ("nIngestEpoch" >= 1)'),
            -- An edge session is always bound to a box and always ever-edge.
            ('RSessionMaster_edge_bound_check',
             'CHECK ("cFeedSource" IS DISTINCT FROM ''E'' OR ("nEdgeid" IS NOT NULL AND "bEverEdge"))'),
            -- Parts: Part 1 is 1; a part with a predecessor is >= 2 and never its own predecessor.
            ('RSessionMaster_nPartNo_check',
             'CHECK ("nPartNo" IS NULL OR "nPartNo" >= 1)'),
            ('RSessionMaster_nPrevPartSesid_check',
             'CHECK ("nPrevPartSesid" IS NULL OR ("nPartNo" IS NOT NULL AND "nPartNo" >= 2 AND "nPrevPartSesid" <> "nSesid"))'),
            ('RSessionMaster_seal_seq_check',
             'CHECK ("nRawFinalSeq" IS NULL OR "nRawFinalSeq" >= 0)'),
            ('RSessionMaster_nFinalLines_check',
             'CHECK ("nFinalLines" IS NULL OR "nFinalLines" >= 0)')
        ) AS c(cname, cdef)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = v_rel AND conname = v_def.cname) THEN
            EXECUTE format('ALTER TABLE public."RSessionMaster" ADD CONSTRAINT %I %s', v_def.cname, v_def.cdef);
        END IF;
    END LOOP;
END
$cons$;

--------------------------------------------------------------------------
-- Indexes
--------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "ix_rsessionmaster_nedgeid"
    ON public."RSessionMaster" ("nEdgeid")
 WHERE "nEdgeid" IS NOT NULL AND "dDelDt" IS NULL;

-- One live successor per part: a double split cannot create two Part 2s.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_rsessionmaster_nprevpartsesid"
    ON public."RSessionMaster" ("nPrevPartSesid")
 WHERE "nPrevPartSesid" IS NOT NULL AND "dDelDt" IS NULL;

-- Unsealed gated sessions: rt-deploy-check (cFeedSource='E'), the box
-- assignments pull and the end/split paths.
CREATE INDEX IF NOT EXISTS "ix_rsessionmaster_unsealed"
    ON public."RSessionMaster" ("cFeedSource", "cParserVer")
 WHERE "cSyncState" IN ('L', 'S') AND "dDelDt" IS NULL;

--------------------------------------------------------------------------
-- Back-fill: legacy venue rows keep flowing through the 'H' lane
--------------------------------------------------------------------------
UPDATE public."RSessionMaster"
   SET "cFeedSource" = 'H'
 WHERE "cSessionUnicId" IS NOT NULL
   AND "cFeedSource" IS NULL;

--------------------------------------------------------------------------
-- Column documentation
--------------------------------------------------------------------------
COMMENT ON COLUMN public."RSessionMaster"."cFeedSource" IS
  'Feed provenance: NULL legacy/unknown, D direct to cloud, E venue edge box, H legacy venue lane, W reserved.';
COMMENT ON COLUMN public."RSessionMaster"."bEverEdge" IS
  'Set at the first edge bind and never cleared; keys the publish gate (a split cannot bypass it).';
COMMENT ON COLUMN public."RSessionMaster"."cApply" IS
  'Cloud-direct sessions only: C cut mode (gated like an edge session), L legacy dispatch.';
COMMENT ON COLUMN public."RSessionMaster"."nAppliedRawSeq" IS
  'Throttled fallback of the last applied round''s rawSeqThrough (<= 60 s lag; exact at split and seal). Edge meta (D10) is authoritative.';
COMMENT ON COLUMN public."RSessionMaster"."cAppliedRawHash" IS
  'Raw chain hash at nAppliedRawSeq, stored with it as a pair (D19 fallback after a cloud state loss, O-7).';
COMMENT ON COLUMN public."RSessionMaster"."cSyncState" IS
  'Edge-fed and cut-mode sessions: L live, S end requested / split Part 1 awaiting its box, K complete, W complete with warnings, F forced incomplete.';
COMMENT ON COLUMN public."RSessionMaster"."cParserVer" IS
  'FEED_PARSE_VERSION pinned for the session; rt-deploy-check refuses a cloud deploy that differs from any unsealed E session.';
COMMENT ON COLUMN public."RSessionMaster"."nPrevPartSesid" IS
  'Split hearings (D7): set on Part N (N >= 2) to the id of Part N-1.';
COMMENT ON COLUMN public."RSessionMaster"."nPartNo" IS
  'Split hearings (D7): 1 for Part 1, previous part + 1 for each later part; NULL for an unsplit session.';

COMMIT;
