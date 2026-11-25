-- 2026-11-12b_private_groups_unassigned_only.down.sql
--
-- After a rollback, the 2026-11-12 rules are back: a mark may again have a Team Issue and a Private Group together. Memberships removed while 2026-11-12b was live (a substantive Issue added to a grouped mark) are not restored. No row is deleted by this script.
--
-- Rollback of 2026-11-12b_private_groups_unassigned_only.up.sql. Restores the four function bodies that the up script
-- replaces, copied verbatim from 2026-11-12_private_groups_for_qfacts.up.sql (that file's lines 50-61, 82-90, 95-155
-- and 157-186). et_fact_private_identity_cleanup, the trigger definitions and the tables are not touched.
--
-- Safety: one transaction; the same database guard as 2026-10-09 and 2026-11-12 (etabella_tech_uuid only, unless the
-- session setting etabella.expected_database names another database). Only CREATE OR REPLACE FUNCTION: no trigger is
-- dropped or created, so no lock is taken on FactMaster, FMIssue or FactPrivateGroup.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-12b_private_groups_unassigned_only.down.sql

BEGIN;
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for Private Groups Unassigned-only rollback';
  END IF;
END $$;

-- ---- from 2026-11-12_private_groups_for_qfacts.up.sql, lines 50-61, verbatim ----
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
-- ---- end ----

-- ---- from 2026-11-12_private_groups_for_qfacts.up.sql, lines 82-90, verbatim ----
CREATE OR REPLACE FUNCTION public.et_fact_issue_private_cleanup() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  PERFORM 1 FROM public."FactMaster" WHERE "nFSid"=NEW."nFSid" FOR UPDATE;
  IF public.et_is_system_unassigned(NEW."nIssueid") THEN
    NEW."nImpactid" := 0; NEW."nRelevanceid" := 0;
  END IF;
  RETURN NEW;
END $$;
-- ---- end ----

-- ---- from 2026-11-12_private_groups_for_qfacts.up.sql, lines 95-155, verbatim ----
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
-- ---- end ----

-- ---- from 2026-11-12_private_groups_for_qfacts.up.sql, lines 157-186, verbatim ----
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
-- ---- end ----
COMMIT;
