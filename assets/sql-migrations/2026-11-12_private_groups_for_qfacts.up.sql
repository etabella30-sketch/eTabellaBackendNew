-- 2026-11-12_private_groups_for_qfacts.up.sql
--
-- Why
-- ---
-- ETHEAR 3.0 QFACT Issue Panel brief, sections 7-9: a lawyer files a QFACT in one of their own Private Analysis
-- Groups, and a Team Issue and a Private Group are independent. 2026-10-09_private_fact_groups.up.sql allows a
-- membership only for the creator's Unassigned Full Fact. Owner, 2026-11-11 (plan 2026-11-11-qfact-private-analysis-
-- groups, D1-D3): a QFact ('QF') or a Full Fact ('F') may be in a Private Group, with or without a Team Issue; one
-- group per mark (the table is unchanged); group writes need Advanced mode ('A'), as today.
--
-- What (five functions and their three triggers; no table, index or row is touched)
-- ----
--   et_fact_private_group_guard       a membership needs: cFType 'F' or 'QF', a group that is not deleted, the same
--                                     owner and the same case as the group. The "no substantive Issue" rule is gone.
--   et_fact_private_identity_cleanup  removes a membership when the mark's owner or case changes, or when its type
--                                     becomes anything other than 'F' / 'QF'. A change between 'QF' and 'F' keeps it.
--   et_fact_issue_private_cleanup     still stores impact / relevance 0 on a system Unassigned Issue row; no longer
--                                     removes the membership when a substantive Issue is added.
--   et_private_group_assign           owner only; 'F' or 'QF'; case access; Advanced mode; the actor's own group in
--                                     the mark's case, not deleted. Clearing (nPrivateGroupid null) under the same
--                                     conditions. Refusal: "Private Group is available only to the creator of the
--                                     mark" (the Advanced-mode refusal keeps its 2026-10-09 text).
--   et_workspace_private_groups       count, assignments and eligibleFactIds cover the actor's 'F' and 'QF' marks in
--                                     the case, with or without Issues. The answer has the same shape.
--   Unchanged: et_is_system_unassigned, the tables, list / create / rename / delete of groups (with the group-delete
--   tombstone), the cascade when a mark is deleted, the trigger definitions.
--
-- Safety
-- ------
--   * One transaction; the same database guard as 2026-10-09: etabella_tech_uuid only, unless the session setting
--     etabella.expected_database names another database.
--   * Only CREATE OR REPLACE FUNCTION and DROP TRIGGER IF EXISTS / CREATE TRIGGER. This script deletes and changes no
--     row. The new rules delete less than the old ones: a membership goes only when its mark's owner or case changes,
--     its mark stops being a QFact or Full Fact, its group is deleted, or its mark is deleted.
--   * Needs 2026-10-09_private_fact_groups.up.sql applied first (its tables and et_is_system_unassigned).
--   * Rollback: 2026-11-12_private_groups_for_qfacts.down.sql restores the 2026-10-09 bodies.
--
-- Verify: 2026-11-12_private_groups_for_qfacts.test.sql, in a new scratch database only.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-12_private_groups_for_qfacts.up.sql

BEGIN;
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for Private Groups for QFacts migration';
  END IF;
END $$;

-- A QFact or a Full Fact of the group's owner in the group's case; Team Issues do not matter.
CREATE OR REPLACE FUNCTION public.et_fact_private_group_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE f record; g record;
BEGIN
  SELECT * INTO f FROM public."FactMaster" WHERE "nFSid"=NEW."nFSid" FOR UPDATE;
  SELECT * INTO g FROM public."PrivateFactGroup" WHERE "nGroupid"=NEW."nGroupid" FOR SHARE;
  IF COALESCE(f."cFType",'') NOT IN ('F','QF') OR g."dDeletedDt" IS NOT NULL OR g."nGroupid" IS NULL
     OR f."nUserid" IS DISTINCT FROM g."nUserid" OR f."nCaseid" IS DISTINCT FROM g."nCaseid" THEN
    RAISE EXCEPTION 'Private Group is available only to the creator of the mark';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fact_private_group_guard ON public."FactPrivateGroup";
CREATE TRIGGER fact_private_group_guard BEFORE INSERT OR UPDATE ON public."FactPrivateGroup"
  FOR EACH ROW EXECUTE FUNCTION public.et_fact_private_group_guard();

-- An owner or case change, or a type other than QFact / Full Fact, cannot retain the association.
CREATE OR REPLACE FUNCTION public.et_fact_private_identity_cleanup() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF COALESCE(NEW."cFType",'') NOT IN ('F','QF') OR NEW."nUserid" IS DISTINCT FROM OLD."nUserid"
     OR NEW."nCaseid" IS DISTINCT FROM OLD."nCaseid" THEN
    DELETE FROM public."FactPrivateGroup" WHERE "nFSid"=NEW."nFSid";
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fact_private_identity_cleanup ON public."FactMaster";
CREATE TRIGGER fact_private_identity_cleanup AFTER UPDATE OF "nUserid","nCaseid","cFType" ON public."FactMaster"
  FOR EACH ROW EXECUTE FUNCTION public.et_fact_private_identity_cleanup();

-- These writes join the same transaction as the Issue save, including legacy callers. An Issue no longer removes
-- the association (a mark may have a Team Issue and a Private Group together).
CREATE OR REPLACE FUNCTION public.et_fact_issue_private_cleanup() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  PERFORM 1 FROM public."FactMaster" WHERE "nFSid"=NEW."nFSid" FOR UPDATE;
  IF public.et_is_system_unassigned(NEW."nIssueid") THEN
    NEW."nImpactid" := 0; NEW."nRelevanceid" := 0;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fact_issue_private_cleanup ON public."FMIssue";
CREATE TRIGGER fact_issue_private_cleanup BEFORE INSERT OR UPDATE ON public."FMIssue"
  FOR EACH ROW EXECUTE FUNCTION public.et_fact_issue_private_cleanup();

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
  -- The actor's own QFacts and Full Facts in this case, with or without Team Issues.
  OPEN ref FOR SELECT 1 msg, gid "nGroupid",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',g."nGroupid",'name',g."cName",'count',
      (SELECT count(*) FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
       WHERE a."nGroupid"=g."nGroupid" AND f."nUserid"=actor AND f."cFType" IN ('F','QF'))) ORDER BY lower(g."cName"),g."nGroupid")
      FROM public."PrivateFactGroup" g WHERE g."nUserid"=actor AND g."nCaseid"=cid AND g."dDeletedDt" IS NULL),'[]'::jsonb) groups,
    COALESCE((SELECT jsonb_object_agg(a."nFSid"::text,a."nGroupid"::text)
      FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
      JOIN public."PrivateFactGroup" g USING("nGroupid") WHERE f."nUserid"=actor AND f."nCaseid"=cid
        AND f."cFType" IN ('F','QF') AND g."dDeletedDt" IS NULL AND g."nUserid"=actor),'{}'::jsonb) assignments,
    COALESCE((SELECT jsonb_agg(f."nFSid") FROM public."FactMaster" f
      WHERE f."nUserid"=actor AND f."nCaseid"=cid AND f."cFType" IN ('F','QF')),'[]'::jsonb) "eligibleFactIds",
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
    -- Another user's, another case's or a deleted group gets the same answer as someone else's mark.
    PERFORM 1 FROM public."PrivateFactGroup" WHERE "nGroupid"=gid AND "nUserid"=actor
      AND "nCaseid"=f."nCaseid" AND "dDeletedDt" IS NULL FOR SHARE;
    IF NOT FOUND THEN
      OPEN ref FOR SELECT -1 msg, 'Private Group is available only to the creator of the mark' value; RETURN ref;
    END IF;
    INSERT INTO public."FactPrivateGroup" VALUES(fid,gid) ON CONFLICT("nFSid") DO UPDATE SET "nGroupid"=EXCLUDED."nGroupid";
  END IF;
  OPEN ref FOR SELECT 1 msg, fid "nFSid"; RETURN ref;
END $$;
COMMIT;
