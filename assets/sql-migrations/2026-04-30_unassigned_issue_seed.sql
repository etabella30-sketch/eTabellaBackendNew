-- 2026-04-30 — Default Unassigned issue per case
--
-- Why
-- ---
-- Every case already has an "Unassigned" CLAIM seeded on case creation
-- (admin_insertupdate_case writes a row to "IssueCategory" with
-- cICtype='U' / cCategory='Unassigned'). The frontend QFact panel falls
-- back to "the first issue of the Unassigned claim" when the user
-- captures a quick fact without picking an issue explicitly — see
-- qfact-issue-panel.component.ts → unassignedIssue computed.
--
-- 35 of 98 cases on prod today have an Unassigned CLAIM but no issue
-- under it named 'Unassigned'. For those cases, the frontend fallback
-- returns null and QFacts captured with no explicit issue selection
-- get submitted with an empty jIssues array (RtFactService accepts it),
-- producing orphan QFacts that no panel surfaces by issue.
--
-- This migration ships:
--   1. New SP  public.et_realtime_ensure_unassigned_issue(json, refcursor)
--      — idempotently ensures the Unassigned CLAIM exists (defensive —
--      it should already, but 3 cases on prod don't have one) and
--      ensures a default Unassigned ISSUE exists under it with
--      cColor='FFFF00' (yellow — matches pdf.service.ts defaultColor so
--      a QFact with no explicit issue paints the same colour as a free
--      PDF highlight).
--   2. One-time backfill DO block that calls the SP for every existing
--      case missing the default issue, so legacy cases get it
--      retroactively without users having to do anything.
--
-- Companion code change
-- ---------------------
-- apps/coreapi/src/services/case/case.service.ts — casebuilder() calls
-- this SP after admin_insertupdate_case succeeds for new cases
-- (permission='N'), so every newly-created case has the default issue
-- from day 1. The SP is idempotent so a future re-call is a no-op.
--
-- Why a new SP instead of editing admin_insertupdate_case
-- -------------------------------------------------------
-- The case-creation SP isn't in source control and is touched by every
-- admin flow. A separate, single-purpose SP keeps the diff small,
-- reviewable, and rollback-able. The cost of one extra round trip at
-- case creation is negligible compared to the risk of regressing the
-- existing case-creation path.
--
-- What we do NOT touch
-- --------------------
-- Existing Unassigned issues: 65 cases already have an Unassigned issue
-- with cColor='e9e90e' (legacy from the old sessionbuilder seed) or
-- 'FFA94D'. We deliberately don't recolour those because their nIid is
-- already the FK target of any QFacts the user captured — changing the
-- colour would silently repaint historical QFacts, which is jarring.
-- New seeds (35 cases below + every future case) get the yellow that
-- matches the PDF default highlight; legacy data keeps its colour.


-- ============================================================
-- 1.  New SP: et_realtime_ensure_unassigned_issue
-- ============================================================
--
-- Input JSON shape:
--   { "nCaseid": "...uuid..." }
--
-- Returns one row: { "msg": 1, "nICid": <uuid>, "nIid": <uuid> } on
-- success — both the resolved (or freshly created) Unassigned claim id
-- and the resolved (or freshly created) Unassigned issue id, so the
-- caller can use them immediately if needed.
--
-- The seeded rows mirror the existing Unassigned data shape exactly:
-- nUserid NULL (system-owned), no row in RIssueSequence /
-- RClaimSequence (existing Unassigned rows don't have one either —
-- frontend treats missing nSequence as 0 via `?? 0`).

CREATE OR REPLACE FUNCTION public.et_realtime_ensure_unassigned_issue(
    parameter JSON,
    ref1 REFCURSOR
)
RETURNS SETOF REFCURSOR
LANGUAGE plpgsql
AS $function$
DECLARE
    v_nCaseid UUID;
    v_nICid   UUID;
    v_nIid    UUID;
BEGIN
    v_nCaseid := NULLIF(parameter ->> 'nCaseid', '')::UUID;

    IF v_nCaseid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nCaseid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    -- Locate the Unassigned claim for this case. Match by cICtype='U'
    -- (the system marker — set on the original seed and on the legacy
    -- sessionbuilder seed) AND cCategory='Unassigned' (defensive,
    -- because the cICtype column is also written by the
    -- handle_issue_category SP's permission='U' branch which means
    -- "update", not Unassigned — the data is consistent on prod today
    -- but the AND keeps us safe from collisions).
    SELECT "nICid"
      INTO v_nICid
      FROM "IssueCategory"
     WHERE "nCaseid"   = v_nCaseid
       AND "cICtype"   = 'U'
       AND "cCategory" = 'Unassigned'
     LIMIT 1;

    -- Defensive: 3 cases on prod have no Unassigned claim at all.
    -- Create one. admin_insertupdate_case normally seeds it, but never
    -- assume.
    IF v_nICid IS NULL THEN
        INSERT INTO "IssueCategory" (
            "nCaseid", "cCategory", "cICtype", "dCreateDt"
        ) VALUES (
            v_nCaseid, 'Unassigned', 'U', NOW()
        )
        RETURNING "nICid" INTO v_nICid;
    END IF;

    -- Already-seeded check. Match by cIName='Unassigned' under this
    -- specific Unassigned claim — keeps the seed unique per case
    -- without depending on a flag column on RIssueMaster (which doesn't
    -- have one). Existing Unassigned issues with other names (e.g. the
    -- 14 'test' rows the user dropped into Unassigned claims) don't
    -- count; they're real issues.
    SELECT "nIid"
      INTO v_nIid
      FROM "RIssueMaster"
     WHERE "nICid"  = v_nICid
       AND "cIName" = 'Unassigned'
     LIMIT 1;

    IF v_nIid IS NULL THEN
        -- cColor 'FFFF00' (no '#', matching the codebase's storage
        -- convention — RIssueMaster.cColor is varchar(6)) → yellow,
        -- identical to PDF default highlight (pdf.service.ts:20).
        INSERT INTO "RIssueMaster" (
            "nICid", "nCaseid", "cIName", "cColor", "dCreatedt"
        ) VALUES (
            v_nICid, v_nCaseid, 'Unassigned', 'FFFF00', NOW()
        )
        RETURNING "nIid" INTO v_nIid;
    END IF;

    OPEN ref1 FOR SELECT 1 AS "msg", v_nICid AS "nICid", v_nIid AS "nIid";
    RETURN NEXT ref1;

EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$;


-- ============================================================
-- 2.  Backfill: seed Unassigned issue for every existing case
-- ============================================================
--
-- Loops every case in CaseMaster that doesn't already have an
-- Unassigned issue under an Unassigned claim. The SP is idempotent
-- AND creates the claim if missing, so this single LEFT-JOIN-NOT-EXISTS
-- check catches all three flavours of legacy drift in one pass:
--   (a) case has Unassigned claim with no Unassigned issue
--   (b) case has other claims but no Unassigned claim at all
--   (c) case has no claims at all (empty test cases — 3 on prod)
--
-- The cursor name is suffixed with a counter so each iteration opens a
-- unique portal — refcursors can't be reopened by name within the same
-- transaction, and the DO block runs in one. They're auto-cleaned at
-- transaction end.

DO $$
DECLARE
    rec RECORD;
    cnt INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT cm."nCaseid"
          FROM "CaseMaster" cm
         WHERE NOT EXISTS (
               SELECT 1
                 FROM "IssueCategory" c
                 JOIN "RIssueMaster" i ON i."nICid" = c."nICid"
                WHERE c."nCaseid"   = cm."nCaseid"
                  AND c."cICtype"   = 'U'
                  AND c."cCategory" = 'Unassigned'
                  AND i."cIName"    = 'Unassigned'
           )
    LOOP
        cnt := cnt + 1;
        PERFORM public.et_realtime_ensure_unassigned_issue(
            json_build_object('nCaseid', rec."nCaseid")::json,
            ('rb_' || cnt)::refcursor
        );
    END LOOP;
END $$;


-- ============================================================
-- Rollback
-- ============================================================
-- DROP FUNCTION IF EXISTS public.et_realtime_ensure_unassigned_issue(JSON, REFCURSOR);
--
-- The backfilled rows are NOT auto-removed on rollback. To remove them,
-- check first that no QFacts reference them as nColorid:
--
--   SELECT i."nIid", COUNT(d."nFSid") AS facts
--     FROM "RIssueMaster" i
--     LEFT JOIN "FactDetail" d ON d."nColorid" = i."nIid"
--    WHERE i."cIName" = 'Unassigned' AND i."cColor" = 'FFFF00'
--    GROUP BY i."nIid";
--
-- Then DELETE the unreferenced ones.
