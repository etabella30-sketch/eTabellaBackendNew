-- 2026-11-12b_private_groups_unassigned_only.up.sql
--
-- Why
-- ---
-- Owner, 2026-11-11, after seeing the QFACT panel: "Same as Fact today". A Private Analysis Group may be on a mark
-- (QFact 'QF' or Full Fact 'F') only while the mark has no substantive Team Issue (Unassigned): Team Issue and Private
-- Group are mutually exclusive. This reverses D1 of 2026-11-12_private_groups_for_qfacts.up.sql (live since
-- 2026-11-11) and keeps its QFact rule.
--
-- What (four functions; no trigger, table, index or row is touched)
-- ----
--   et_fact_private_group_guard     also refuses a membership when the mark has a substantive Issue (2026-10-09 rule),
--                                   for 'F' and 'QF' alike.
--   et_fact_issue_private_cleanup   writing a substantive Issue row for a mark removes its membership again; a system
--                                   Unassigned row still gets impact / relevance 0 (the 2026-10-09 body, word for word).
--   et_private_group_assign         refuses a group for a mark with a substantive Issue, with the same text as the other
--                                   refusals; clearing (nPrivateGroupid null) stays allowed.
--   et_workspace_private_groups     count, assignments and eligibleFactIds cover only the actor's 'F' / 'QF' marks with
--                                   no substantive Issue.
--   Unchanged: et_fact_private_identity_cleanup (QF <-> F keeps a membership), et_is_system_unassigned, the three
--   trigger definitions, the tables.
--
-- Rows
-- ----
-- This script deletes and changes no row. Memberships on a mark that has a substantive Issue (possible only while
-- 2026-11-12 was live) stay in the table: they are not listed or counted, and the cleanup trigger removes one the next
-- time a substantive Issue row of that mark is written.
--
-- Safety
-- ------
--   * One transaction; the same database guard as 2026-10-09 and 2026-11-12: etabella_tech_uuid only, unless the
--     session setting etabella.expected_database names another database.
--   * Only CREATE OR REPLACE FUNCTION. No DROP / CREATE TRIGGER, so no lock is taken on FactMaster, FMIssue or
--     FactPrivateGroup.
--   * Needs 2026-10-09_private_fact_groups.up.sql and 2026-11-12_private_groups_for_qfacts.up.sql applied first.
--   * Rollback: 2026-11-12b_private_groups_unassigned_only.down.sql restores the 2026-11-12 bodies.
--
-- Verify: 2026-11-12b_private_groups_unassigned_only.test.sql, in a new scratch database only.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-12b_private_groups_unassigned_only.up.sql

BEGIN;
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for Private Groups Unassigned-only migration';
  END IF;
END $$;

-- An Unassigned QFact or Full Fact of the group's owner in the group's case.
CREATE OR REPLACE FUNCTION public.et_fact_private_group_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE f record; g record;
BEGIN
  SELECT * INTO f FROM public."FactMaster" WHERE "nFSid"=NEW."nFSid" FOR UPDATE;
  SELECT * INTO g FROM public."PrivateFactGroup" WHERE "nGroupid"=NEW."nGroupid" FOR SHARE;
  IF COALESCE(f."cFType",'') NOT IN ('F','QF') OR g."dDeletedDt" IS NOT NULL OR g."nGroupid" IS NULL
     OR f."nUserid" IS DISTINCT FROM g."nUserid" OR f."nCaseid" IS DISTINCT FROM g."nCaseid"
     OR EXISTS(SELECT 1 FROM public."FMIssue" WHERE "nFSid"=NEW."nFSid"
       AND NOT public.et_is_system_unassigned("nIssueid")) THEN
    RAISE EXCEPTION 'Private Group is available only to the creator of the mark';
  END IF;
  RETURN NEW;
END $$;

-- These writes join the same transaction as the Issue save, including legacy callers.
CREATE OR REPLACE FUNCTION public.et_fact_issue_private_cleanup() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  PERFORM 1 FROM public."FactMaster" WHERE "nFSid"=NEW."nFSid" FOR UPDATE;
  IF public.et_is_system_unassigned(NEW."nIssueid") THEN
    NEW."nImpactid" := 0; NEW."nRelevanceid" := 0;
  ELSE
    DELETE FROM public."FactPrivateGroup" WHERE "nFSid"=NEW."nFSid";
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.et_workspace_private_groups(parameter json, ref refcursor) RETURNS refcursor
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := (parameter->>'nMasterid')::uuid;
  cid uuid := (parameter->>'nCaseid')::uuid;
  gid uuid := NULLIF(parameter->>'nGroupid','')::uuid;
  op text := COALESCE(parameter->>'operation','list');
  label text := btrim(parameter->>'cName'); selected_group record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."CaseMaster" WHERE "nCaseid"=cid)
    OR NOT EXISTS(SELECT 1 FROM public."UserMaster" u WHERE u."nUserid"=actor AND
      (u."isAdmin" IS TRUE OR EXISTS(SELECT 1 FROM public."TeamRelation" t WHERE
        t."nUserid"=actor AND t."nCaseid"=cid AND t."cStatus"='A'))) THEN
    OPEN ref FOR SELECT -1 msg, 'Case access is required' value; RETURN ref;
  END IF;
  IF op NOT IN ('list','create','rename','delete') THEN
    OPEN ref FOR SELECT -1 msg, 'Invalid group operation' value; RETURN ref;
  END IF;
  IF op <> 'list' THEN
    IF COALESCE((SELECT "cUIMode" FROM public."UserCaseUiMode" WHERE "nUserid"=actor
        AND "nCaseid"=cid FOR SHARE),'E') <> 'A' THEN
      OPEN ref FOR SELECT -1 msg, 'Switch to Advanced to manage Private Groups' value; RETURN ref;
    END IF;
    IF op IN ('create','rename') AND (label IS NULL OR length(label) NOT BETWEEN 1 AND 80) THEN
      OPEN ref FOR SELECT -1 msg, 'Enter a group name of 1 to 80 characters' value; RETURN ref;
    END IF;
    IF op <> 'create' THEN
      SELECT * INTO selected_group FROM public."PrivateFactGroup" WHERE "nGroupid"=gid AND
        "nCaseid"=cid AND "nUserid"=actor AND "dDeletedDt" IS NULL FOR UPDATE;
      IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 msg, 'Private Group is unavailable' value; RETURN ref;
      END IF;
    END IF;
    IF op='create' THEN
      INSERT INTO public."PrivateFactGroup"("nCaseid","nUserid","cName") VALUES(cid,actor,label)
        RETURNING "nGroupid" INTO gid;
    ELSIF op='rename' THEN
      UPDATE public."PrivateFactGroup" SET "cName"=label,"dUpdateDt"=now() WHERE "nGroupid"=gid;
    ELSE
      -- Keep a tombstone so a saved view never reconnects to a same-name replacement.
      UPDATE public."PrivateFactGroup" SET "dDeletedDt"=now(),"dUpdateDt"=now() WHERE "nGroupid"=gid;
      DELETE FROM public."FactPrivateGroup" WHERE "nGroupid"=gid;
    END IF;
  END IF;
  -- The actor's own Unassigned QFacts and Full Facts in this case.
  OPEN ref FOR SELECT 1 msg, gid "nGroupid",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',g."nGroupid",'name',g."cName",'count',
      (SELECT count(*) FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
       WHERE a."nGroupid"=g."nGroupid" AND f."nUserid"=actor AND f."cFType" IN ('F','QF')
         AND NOT EXISTS(SELECT 1 FROM public."FMIssue" i WHERE i."nFSid"=f."nFSid"
           AND NOT public.et_is_system_unassigned(i."nIssueid")))) ORDER BY lower(g."cName"),g."nGroupid")
      FROM public."PrivateFactGroup" g WHERE g."nUserid"=actor AND g."nCaseid"=cid AND g."dDeletedDt" IS NULL),'[]'::jsonb) groups,
    COALESCE((SELECT jsonb_object_agg(a."nFSid"::text,a."nGroupid"::text)
      FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
      JOIN public."PrivateFactGroup" g USING("nGroupid") WHERE f."nUserid"=actor AND f."nCaseid"=cid
        AND f."cFType" IN ('F','QF') AND g."dDeletedDt" IS NULL AND g."nUserid"=actor
        AND NOT EXISTS(SELECT 1 FROM public."FMIssue" i WHERE i."nFSid"=f."nFSid"
          AND NOT public.et_is_system_unassigned(i."nIssueid"))),'{}'::jsonb) assignments,
    COALESCE((SELECT jsonb_agg(f."nFSid") FROM public."FactMaster" f
      WHERE f."nUserid"=actor AND f."nCaseid"=cid AND f."cFType" IN ('F','QF')
        AND NOT EXISTS(SELECT 1 FROM public."FMIssue" i WHERE i."nFSid"=f."nFSid"
          AND NOT public.et_is_system_unassigned(i."nIssueid"))),'[]'::jsonb) "eligibleFactIds",
    COALESCE((SELECT jsonb_agg(i."nIid") FROM public."RIssueMaster" i
      WHERE public.et_is_system_unassigned(i."nIid")),'[]'::jsonb) "systemIssueIds";
  RETURN ref;
EXCEPTION WHEN unique_violation THEN
  OPEN ref FOR SELECT -1 msg, 'A Private Group with that name already exists' value; RETURN ref;
END $$;

CREATE OR REPLACE FUNCTION public.et_private_group_assign(parameter json, ref refcursor) RETURNS refcursor
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := (parameter->>'nMasterid')::uuid;
  fid uuid := (parameter->>'nFSid')::uuid;
  gid uuid := NULLIF(parameter->>'nPrivateGroupid','')::uuid; f record;
BEGIN
  SELECT * INTO f FROM public."FactMaster" WHERE "nFSid"=fid FOR UPDATE;
  IF f."nFSid" IS NULL OR f."nUserid" IS DISTINCT FROM actor OR COALESCE(f."cFType",'') NOT IN ('F','QF')
    OR NOT EXISTS(SELECT 1 FROM public."UserMaster" u WHERE u."nUserid"=actor AND
      (u."isAdmin" IS TRUE OR EXISTS(SELECT 1 FROM public."TeamRelation" t WHERE t."nCaseid"=f."nCaseid"
        AND t."nUserid"=actor AND t."cStatus"='A'))) THEN
    OPEN ref FOR SELECT -1 msg, 'Private Group is available only to the creator of the mark' value; RETURN ref;
  END IF;
  IF COALESCE((SELECT "cUIMode" FROM public."UserCaseUiMode" WHERE "nUserid"=actor
    AND "nCaseid"=f."nCaseid" FOR SHARE),'E') <> 'A' THEN
    OPEN ref FOR SELECT -1 msg, 'Switch to Advanced to modify this Fact' value; RETURN ref;
  END IF;
  IF gid IS NULL THEN
    DELETE FROM public."FactPrivateGroup" WHERE "nFSid"=fid;
  ELSE
    -- Another user's, another case's or a deleted group, or a mark with a substantive Team Issue, gets the same
    -- answer as someone else's mark.
    PERFORM 1 FROM public."PrivateFactGroup" WHERE "nGroupid"=gid AND "nUserid"=actor
      AND "nCaseid"=f."nCaseid" AND "dDeletedDt" IS NULL FOR SHARE;
    IF NOT FOUND OR EXISTS(SELECT 1 FROM public."FMIssue" WHERE "nFSid"=fid
      AND NOT public.et_is_system_unassigned("nIssueid")) THEN
      OPEN ref FOR SELECT -1 msg, 'Private Group is available only to the creator of the mark' value; RETURN ref;
    END IF;
    INSERT INTO public."FactPrivateGroup" VALUES(fid,gid) ON CONFLICT("nFSid") DO UPDATE SET "nGroupid"=EXCLUDED."nGroupid";
  END IF;
  OPEN ref FOR SELECT 1 msg, fid "nFSid"; RETURN ref;
END $$;
COMMIT;
