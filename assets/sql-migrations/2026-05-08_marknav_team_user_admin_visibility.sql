-- 2026-05-08 — et_marknav_team_user: admin/top-role can see teammates in the picker
--
-- Symptom
-- -------
-- In the RT marknav user-filter dropdown, the caller only saw themselves
-- ("Me") even though the navigation list right below clearly listed
-- annotations created by other team members (e.g. "Created by Inder LM").
-- Repro: nCaseid ca881056-…, nSesid bfe1fbcc-…, nUserid 043c3b64-… —
-- Alok (admin/top-role) sees Inder's facts but not Inder in the picker.
--
-- Root cause
-- ----------
-- realtime.et_marks (the SP that paints highlights / fact rectangles) admits
-- a teammate's annotations for the caller when:
--   (a) caller is a global admin (UserMaster.isAdmin=true), OR
--   (b) caller holds the top-role for the case (RoleMaster.nSrno=1 via
--       TeamRelation).
-- It does this with a LEFT JOIN "TeamRelation" tr ON tr."nTeamid" = nTeamid
-- and the predicate `(isAdmin AND f."nUserid" = tr."nUserid")`.
--
-- realtime.et_marknav_team_user did NOT have any of that. Its WHERE clause
-- only included a user `u` when the caller either WAS that user, or had
-- received an explicit FMShared / DMShared row for one of u's annotations.
-- For an admin / top-role caller who sees teammates' annotations purely via
-- the team relation (no per-row share), the picker therefore came back
-- with only "Me" — even though the highlights showed up everywhere.
--
-- Fix
-- ---
-- 1. Resolve nCaseid from nSesid (or fall back to BundleDetail → BundleMaster
--    when only nBundledetailid is supplied — the SP accepts either).
-- 2. Resolve isAdmin and the caller's team the same way et_marks does.
-- 3. LEFT JOIN "TeamRelation" tr ON tr."nTeamid" = caller's team AND
--    tr."nUserid" = u."nUserid" — so for any candidate user u, tr is
--    non-null exactly when u shares the caller's team for this case.
-- 4. Add `(isAdmin AND tr."nUserid" IS NOT NULL)` to each branch's user-
--    visibility OR — non-admin callers behave exactly as before.
-- 5. While here, replace the f."nUserid" = nUserid / d."nUserid" = nUserid
--    self-checks with the equivalent u."nUserid" = nUserid. They are
--    logically identical (the outer joins bind f/d to u by nUserid) but
--    reading u directly is clearer and survives the row even when the
--    fact/doc join produced a NULL on that branch.
-- 6. Tighten the parenthesis grouping on the cType='D' and cType<>'A'/'D'
--    branches so the user-visibility OR-group binds inside the AND chain
--    rather than spilling out of it (a pre-existing, separate bug).
--
-- Apply with: psql … -f 2026-05-08_marknav_team_user_admin_visibility.sql
-- Idempotent: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION realtime.et_marknav_team_user(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid          UUID;
    nBundledetailid  UUID;
    nSesid           UUID;
    cType            text;
    nCaseid          UUID;
    nTeamid          UUID;
    nRoleid          UUID;
    isAdmin          boolean default false;
BEGIN
    -- convert blank string → NULL with explicit cast
    nUserid         := NULLIF(parameter ->> 'nUserid', '')::uuid;
    nSesid          := NULLIF(parameter ->> 'nSesid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    cType           := parameter ->> 'cType';

    -- ------------------------------------------------------------------
    -- Resolve nCaseid (needed for TeamRelation lookup). Prefer nSesid;
    -- fall back to nBundledetailid → BundleMaster when only the bundle
    -- form was supplied.
    -- ------------------------------------------------------------------
    IF nSesid IS NOT NULL THEN
        SELECT "nCaseid" INTO nCaseid
          FROM "RSessionMaster"
         WHERE "nSesid" = nSesid;
    END IF;

    IF nCaseid IS NULL AND nBundledetailid IS NOT NULL THEN
        SELECT bm."nCaseid" INTO nCaseid
          FROM "BundleDetail" bd
          JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
         WHERE bd."nBundledetailid" = nBundledetailid;
    END IF;

    -- ------------------------------------------------------------------
    -- Resolve admin / top-role status (mirrors et_marks). Either grants
    -- team-wide visibility for the rest of the picker.
    -- ------------------------------------------------------------------
    isAdmin := EXISTS (
        SELECT 1 FROM "UserMaster"
         WHERE "nUserid" = nUserid AND "isAdmin" = true
    );

    SELECT "nTeamid", "nRoleid"
      INTO nTeamid, nRoleid
      FROM "TeamRelation"
     WHERE "nUserid" = nUserid
       AND "nCaseid" = nCaseid
     LIMIT 1;

    IF NOT isAdmin
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1 THEN
        isAdmin := true;
    END IF;

    -- ------------------------------------------------------------------
    -- Pick list. tr is non-null exactly when candidate u shares the
    -- caller's team for this case — gated by isAdmin so non-admin callers
    -- still only see themselves + people who explicitly shared with them
    -- (existing behaviour preserved).
    -- ------------------------------------------------------------------
    OPEN ref1 FOR
    SELECT q."nUserid", q."cFname", q."cLname", q."cProfile"
    FROM (
      SELECT DISTINCT
        u."nUserid",
        u."cFname",
        u."cLname",
        u."cProfile",
        CASE WHEN u."nUserid" = nUserid THEN 0 ELSE 1 END AS _sort_first
      FROM "UserMaster" u
      LEFT JOIN "FactMaster" f
        ON f."nUserid" = u."nUserid"
       AND (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
       AND (COALESCE(cType,'A') = 'A' OR f."cFType" = cType)
      LEFT JOIN "FMShared" fs
        ON fs."nFSid" = f."nFSid"
      LEFT JOIN "DocMaster" d
        ON d."nUserid" = u."nUserid"
       AND (d."nSesid" = nSesid OR d."nBundledetailid" = nBundledetailid)
       AND (cType = 'A' OR cType = 'D')
      LEFT JOIN "DMShared" ds
        ON ds."nDocid" = d."nDocid"
      LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = nTeamid
       AND tr."nUserid" = u."nUserid"
       AND tr."nCaseid" = nCaseid
      WHERE (
            COALESCE(cType,'A') = 'A'
            AND (f."nFSid" IS NOT NULL OR d."nDocid" IS NOT NULL)
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType = 'D'
            AND d."nDocid" IS NOT NULL
            AND f."nFSid"  IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType NOT IN ('A','D')
            AND f."nFSid"  IS NOT NULL
            AND d."nDocid" IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
    ) q
    ORDER BY q._sort_first, q."cFname", q."nUserid";

    RETURN NEXT ref1;
END;
$function$;


-- ============================================================
-- Rollback
-- ============================================================
-- Restore the previous body from sp-audit/sp/realtime/et_marknav_team_user.sql
-- (the snapshot taken at branch new_selection_mode HEAD before this change).
-- The rollback is a CREATE OR REPLACE with the prior function text.
