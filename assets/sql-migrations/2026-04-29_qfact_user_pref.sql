-- 2026-04-29 — Per-user QFact preferences (visibility + ordering)
--
-- Why
-- ---
-- The LEFT QFact panel needs a per-user view of issues — by default the
-- first 2 issues per claim are visible, and the user can tick more (or
-- untick existing ones) and reorder them inside the Manage Claims & Issues
-- dialog's QFact mode. This must NOT touch RIssueMaster.nSequence, which
-- drives the shared Fact-side ordering for the whole case.
--
-- This migration ships:
--   1. New table  "RUserQFactPref"  — one row per (user, issue) the user
--      has touched. Untouched issues fall back to the default "first 2
--      per claim" rule, computed client-side in qfact-issue-panel.
--   2. New SP     realtime.et_realtime_handle_qfact_secquence  — bulk
--      upsert called from POST /issue/qfact/sequence (issued once when
--      the user closes the Manage dialog with pending QFact changes).
--   3. Notes for modifying public.et_realtime_issuelist_group to LEFT
--      JOIN "RUserQFactPref" so the existing GET /issue/issuelist_V2
--      response carries nQFactSequence and bQFactVisible per issue.
--      The function body lives in the database, not in source control,
--      so the SQL below shows the JOIN and SELECT diff to apply.


-- ============================================================
-- 1.  New table: RUserQFactPref
-- ============================================================

CREATE TABLE IF NOT EXISTS "RUserQFactPref" (
    "nUserid"        UUID        NOT NULL,
    "nIid"           UUID        NOT NULL,
    "nQFactSequence" INTEGER     NOT NULL,
    "bVisible"       BOOLEAN     NOT NULL DEFAULT TRUE,
    "dCreateDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "dModifyDt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "RUserQFactPref_pkey" PRIMARY KEY ("nUserid", "nIid"),
    CONSTRAINT "RUserQFactPref_nIid_fkey"
        FOREIGN KEY ("nIid") REFERENCES "RIssueMaster" ("nIid") ON DELETE CASCADE
);

-- Helps queries like "give me this user's prefs ordered by sequence",
-- and is the index ON CONFLICT (nUserid, nIid) DO UPDATE benefits from.
CREATE INDEX IF NOT EXISTS "ix_RUserQFactPref_user_seq"
    ON "RUserQFactPref" ("nUserid", "nQFactSequence");


-- ============================================================
-- 2.  Upsert SP: realtime.et_realtime_handle_qfact_secquence
-- ============================================================
--
-- Input JSON shape:
--   {
--     "nUserid": "...uuid...",
--     "nCaseid": "...uuid...",        // accepted but not stored — useful
--                                     //   for future case-level filtering /
--                                     //   audit logs without breaking the
--                                     //   contract.
--     "jIssues": [
--       { "nIid": "...", "nQFactSequence": 1, "bVisible": true  },
--       { "nIid": "...", "nQFactSequence": 2, "bVisible": false },
--       ...
--     ]
--   }
--
-- Returns one row: { "msg": 1, "count": <upserted-row-count> } on success.
-- A NULL / empty jIssues array is a no-op (count = 0) — frontend already
-- filters to changed rows only, but defensive on the backend keeps the
-- contract clean.

CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_qfact_secquence(
    parameter JSON,
    ref1 REFCURSOR
)
RETURNS SETOF REFCURSOR
LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    jIssues JSONB;
    upserted_count INTEGER;
BEGIN

    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
    jIssues := COALESCE((parameter ->> 'jIssues')::JSONB, '[]'::JSONB);

    IF nUserid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nUserid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    -- Bulk upsert. Pref rows live forever once the user has touched an
    -- issue; toggling bVisible to FALSE keeps the row so the order survives
    -- a hide/show cycle. ON DELETE CASCADE on RIssueMaster handles cleanup
    -- when an issue is removed.
    WITH upserted AS (
        INSERT INTO "RUserQFactPref" (
            "nUserid", "nIid", "nQFactSequence", "bVisible",
            "dCreateDt", "dModifyDt"
        )
        SELECT
            nUserid,
            (item ->> 'nIid')::UUID,
            (item ->> 'nQFactSequence')::INTEGER,
            COALESCE((item ->> 'bVisible')::BOOLEAN, TRUE),
            NOW(),
            NOW()
        FROM JSONB_ARRAY_ELEMENTS(jIssues) AS item
        ON CONFLICT ("nUserid", "nIid")
        DO UPDATE SET
            "nQFactSequence" = EXCLUDED."nQFactSequence",
            "bVisible"       = EXCLUDED."bVisible",
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
-- The existing SP is not in source control, so this section documents the
-- diff to apply rather than rewriting the function. Open the SP in the
-- target DB (\df+ public.et_realtime_issuelist_group) and edit ref1 — the
-- ref that returns the flat issues list — to:
--
--   a) accept the caller's nUserid (it already does, used elsewhere in the
--      SP for permission checks);
--   b) LEFT JOIN "RUserQFactPref" on (nUserid, nIid);
--   c) project two more columns into the SELECT.
--
-- Snippet to splice into ref1's SELECT / FROM:
--
--     SELECT
--         i."nIid",
--         i."cIName",
--         i."cColor",
--         i."nICid",
--         ic."cCategory",
--         ...                                        -- existing columns
--         i."nSequence",
--         qp."nQFactSequence" AS "nQFactSequence",   -- NEW (nullable)
--         qp."bVisible"       AS "bQFactVisible"     -- NEW (nullable)
--     FROM "RIssueMaster" i
--     JOIN "RIssueCategoryMaster" ic ON ic."nICid" = i."nICid"
--     LEFT JOIN "RUserQFactPref" qp                  -- NEW
--            ON qp."nUserid" = nUserid               -- (already in scope)
--           AND qp."nIid"    = i."nIid"
--     WHERE i."nCaseid" = nCaseid
--       AND ...                                      -- existing filters
--
-- After the edit, the response shape includes nQFactSequence and
-- bQFactVisible per issue. Both stay NULL for issues the user has never
-- touched — the frontend treats NULL as "use the first-2-per-claim
-- default rule" and shows the issue accordingly.
--
-- No frontend rollback needed if this column-level diff is missed: the
-- frontend reads `iss.nQFactSequence ?? Infinity` and `iss.bQFactVisible`
-- with a null-fallback, so an old SP returning neither column behaves as
-- "first 2 per claim everywhere" — exactly the pre-feature state.


-- ============================================================
-- Rollback
-- ============================================================
-- DROP FUNCTION IF EXISTS realtime.et_realtime_handle_qfact_secquence(JSON, REFCURSOR);
-- DROP TABLE     IF EXISTS "RUserQFactPref";
-- (Reverting the public.et_realtime_issuelist_group edit is a manual
--  re-edit — drop the LEFT JOIN and the two extra columns from ref1.)
