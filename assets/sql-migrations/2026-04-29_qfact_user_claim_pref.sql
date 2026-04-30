-- 2026-04-29 — Per-user QFact CLAIM ordering (companion to RUserQFactPref)
--
-- Why
-- ---
-- Issue-level QFact ordering shipped earlier today (RUserQFactPref). The
-- Manage Claims & Issues dialog's QFact mode also lets the user drag the
-- *claim cards* themselves into a new order — and that order has to be
-- per-user so dragging in QFact does not rewrite the shared Fact-side
-- claim sequence (RClaimMaster.nSequence, written by /issue/claim/sequence).
--
-- This migration ships:
--   1. New table  "RUserQFactClaimPref"  — one row per (user, claim) the
--      user has touched. Untouched claims fall back to the shared
--      Fact-side order.
--   2. New SP     realtime.et_realtime_handle_qfact_claim_secquence — bulk
--      upsert called from POST /issue/qfact/claim/sequence (issued in the
--      same batch flush as the issue-level prefs on dialog close).
--   3. Note: modify public.et_realtime_issuelist_group to also project
--      "nQFactSequence" on each category row from "RUserQFactClaimPref"
--      so the LEFT QFact panel sorts claims by the user's QFact order
--      with Fact's nSequence as fallback.


-- ============================================================
-- 1.  New table: RUserQFactClaimPref
-- ============================================================
--
-- Mirrors RUserQFactPref's shape exactly so both the table and the SP look
-- familiar to anyone reading the diff. The FK target is the claim-master
-- table (whatever that's called in your DB — adjust the REFERENCES line if
-- it isn't "RClaimMaster"). Schema details intentionally kept identical
-- so future "QFact pref" entities can copy-paste.

CREATE TABLE IF NOT EXISTS "RUserQFactClaimPref" (
    "nUserid"        UUID        NOT NULL,
    "nICid"          UUID        NOT NULL,
    "nQFactSequence" INTEGER     NOT NULL,
    "dCreateDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "dModifyDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "RUserQFactClaimPref_pkey" PRIMARY KEY ("nUserid", "nICid")
    -- Add the FK if your claim-master table is RClaimMaster (or adapt):
    -- , CONSTRAINT "RUserQFactClaimPref_nICid_fkey"
    --     FOREIGN KEY ("nICid") REFERENCES "RClaimMaster" ("nICid") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ix_RUserQFactClaimPref_user_seq"
    ON "RUserQFactClaimPref" ("nUserid", "nQFactSequence");


-- ============================================================
-- 2.  Upsert SP: realtime.et_realtime_handle_qfact_claim_secquence
-- ============================================================
--
-- Input JSON shape:
--   {
--     "nUserid": "...uuid...",
--     "nCaseid": "...uuid...",
--     "jClaims": [
--       { "nICid": "...", "nQFactSequence": 1 },
--       { "nICid": "...", "nQFactSequence": 2 },
--       ...
--     ]
--   }
--
-- Returns one row: { "msg": 1, "count": <upserted-row-count> } on success.

CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_qfact_claim_secquence(
    parameter JSON,
    ref1 REFCURSOR
)
RETURNS SETOF REFCURSOR
LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    jClaims JSONB;
    upserted_count INTEGER;
BEGIN

    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
    jClaims := COALESCE((parameter ->> 'jClaims')::JSONB, '[]'::JSONB);

    IF nUserid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nUserid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    WITH upserted AS (
        INSERT INTO "RUserQFactClaimPref" (
            "nUserid", "nICid", "nQFactSequence", "dCreateDt", "dModifyDt"
        )
        SELECT
            nUserid,
            (item ->> 'nICid')::UUID,
            (item ->> 'nQFactSequence')::INTEGER,
            NOW(),
            NOW()
        FROM JSONB_ARRAY_ELEMENTS(jClaims) AS item
        ON CONFLICT ("nUserid", "nICid")
        DO UPDATE SET
            "nQFactSequence" = EXCLUDED."nQFactSequence",
            "dModifyDt"      = NOW()
        RETURNING 1
    )
    SELECT COUNT(*) INTO upserted_count FROM upserted;

    OPEN ref1 FOR SELECT 1 AS "msg", upserted_count AS "count";
    RETURN NEXT ref1;

EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$;


-- ============================================================
-- 3.  Apply to public.et_realtime_issuelist_group  (manual edit)
-- ============================================================
--
-- The category-list ref of the SP currently returns rows like
-- (nICid, cCategory, nSequence, ...). Add a LEFT JOIN to
-- "RUserQFactClaimPref" so each row also carries the user's per-claim
-- QFact sequence, and let the frontend pick which column drives ordering.
--
-- Snippet for the categories ref (typically ref0 / the first OPEN):
--
--     SELECT
--         c."nICid",
--         c."cCategory",
--         c."nSequence",
--         qcp."nQFactSequence" AS "nQFactSequence"   -- NEW (nullable)
--     FROM "RClaimMaster" c
--     LEFT JOIN "RUserQFactClaimPref" qcp                -- NEW
--            ON qcp."nUserid" = nUserid
--           AND qcp."nICid"   = c."nICid"
--     WHERE c."nCaseid" = nCaseid
--       AND ...
--     ORDER BY c."nSequence";   -- leave Fact-side order; the frontend
--                               -- reorders by nQFactSequence with this
--                               -- as fallback.
--
-- Frontend null-fallback: claims with no row in RUserQFactClaimPref
-- inherit their position from the existing nSequence — no behaviour
-- change for users who never touch QFact mode.


-- ============================================================
-- Rollback
-- ============================================================
-- DROP FUNCTION IF EXISTS realtime.et_realtime_handle_qfact_claim_secquence(JSON, REFCURSOR);
-- DROP TABLE     IF EXISTS "RUserQFactClaimPref";
