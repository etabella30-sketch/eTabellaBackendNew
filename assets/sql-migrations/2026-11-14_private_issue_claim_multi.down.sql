-- 2026-11-14_private_issue_claim_multi.down.sql
--
-- Rollback of 2026-11-14_private_issue_claim_multi.up.sql.
-- DESTRUCTIVE: drops "FactPrivateGroup"."dCreateDt" (when each membership was added; that time cannot be recovered after
-- the DROP unless it was saved first), "PrivateFactGroup"."nICid" and the index fact_private_group_fact, and puts the
-- one-group-per-Mark primary key ("nFSid") back, under the name the key has now. This file itself never deletes a
-- membership (or any other row).
--
-- It REFUSES TO RUN (RAISE EXCEPTION with the counts; nothing is changed) while
--   * any Mark has more than one membership in "FactPrivateGroup", or
--   * any group in "PrivateFactGroup" (deleted groups included) has a non-null "nICid" (a claim), or
--   * any membership in "FactPrivateGroup" belongs to a Mark that has a substantive Team Issue (an "FMIssue" row that
--     is not the system Unassigned Issue). The restored 2026-11-12b rules hide such a membership and their Issue
--     cleanup trigger would delete it the next time an Issue row of that Mark is written: a silent, deferred deletion.
-- Making all three false (un-ticking the extra memberships or the memberships beside a Team Issue, clearing the claims)
-- changes user data and is NOT done here: each such step needs its own approval by the owner (Golden Rule 1), after a
-- backup. Backup step (run it BEFORE, in its own psql session; psql meta-commands, read-only):
--   \copy (SELECT "nFSid","nGroupid","dCreateDt" FROM public."FactPrivateGroup") TO '<file>-memberships.csv' CSV
--   \copy (SELECT "nGroupid","nICid" FROM public."PrivateFactGroup" WHERE "nICid" IS NOT NULL) TO '<file>-claims.csv' CSV
--
-- After the rollback the 2026-11-12b rules are back, including their Issue cleanup trigger: from then on, writing a
-- substantive Issue row for a Mark in a group removes that Mark's membership (the 2026-11-12b behaviour). Because of the
-- third refusal no membership sits beside a Team Issue at the moment of the rollback.
--
-- Restores et_fact_private_group_guard, et_fact_issue_private_cleanup, et_private_group_assign (the 2026-11-12b bodies)
-- and et_workspace_private_groups (the 2026-11-13 body), copied verbatim from the files and lines named in each
-- "-- ---- from" line. Order: the tables locked, the refusal checks, the primary key, the four functions (so nothing
-- reads "nICid" or "dCreateDt" when they go), then the index and the two columns.
--
-- Safety: one transaction; the same database guard as the up script (etabella_tech_uuid only, unless the session
-- setting etabella.expected_database names another database); lock_timeout 5 s. The checks run under an ACCESS
-- EXCLUSIVE lock on "PrivateFactGroup" and "FactPrivateGroup" and a SHARE lock on "FMIssue" (Issue rows can be read,
-- not written), so no membership, claim or Issue row can be written between the checks and the COMMIT. ADD PRIMARY KEY
-- ("nFSid") builds a unique index (it would fail, and roll everything back, on a Mark with two memberships). Dropping
-- the columns is a catalogue change.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-14_private_issue_claim_multi.down.sql

BEGIN;
-- The locks below, the primary key swap, DROP INDEX and DROP COLUMN: give up after 5 s instead of queueing.
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for Private Issues under Claims rollback';
  END IF;
END $$;

LOCK TABLE public."PrivateFactGroup", public."FactPrivateGroup" IN ACCESS EXCLUSIVE MODE;
-- No Issue row may be written between the checks and the COMMIT (third refusal); reads go on.
LOCK TABLE public."FMIssue" IN SHARE MODE;

-- Refusal (see the header).
DO $$
DECLARE multi bigint; claimed bigint; beside bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = 'PrivateFactGroup' AND column_name = 'nICid') THEN
    RAISE EXCEPTION 'Private Issues under Claims rollback: "PrivateFactGroup"."nICid" does not exist (the up script is not applied); nothing was changed';
  END IF;
  SELECT count(*) INTO multi FROM (SELECT 1 FROM public."FactPrivateGroup" GROUP BY "nFSid" HAVING count(*) > 1) m;
  SELECT count(*) INTO claimed FROM public."PrivateFactGroup" WHERE "nICid" IS NOT NULL;
  SELECT count(*) INTO beside FROM public."FactPrivateGroup" a WHERE EXISTS (SELECT 1 FROM public."FMIssue" i
    WHERE i."nFSid" = a."nFSid" AND NOT public.et_is_system_unassigned(i."nIssueid"));
  IF multi > 0 OR claimed > 0 OR beside > 0 THEN
    RAISE EXCEPTION 'Private Issues under Claims rollback refused: % Mark(s) with more than one membership, % group(s) with a claim, % membership(s) on a Mark with a substantive Team Issue; nothing was changed (see the header of this script)',
      multi, claimed, beside;
  END IF;
END $$;

-- Primary key ("nFSid","nGroupid") -> ("nFSid"). Its name is looked up, not assumed, and kept.
DO $$
DECLARE pk_name text; pk_cols text;
BEGIN
  SELECT c.conname, (SELECT string_agg(a.attname::text, ',' ORDER BY k.ord) FROM unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
                       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum)
    INTO pk_name, pk_cols
    FROM pg_constraint c WHERE c.conrelid = 'public."FactPrivateGroup"'::regclass AND c.contype = 'p';
  IF pk_cols = 'nFSid,nGroupid' THEN
    EXECUTE format('ALTER TABLE public."FactPrivateGroup" DROP CONSTRAINT %I', pk_name);
    EXECUTE format('ALTER TABLE public."FactPrivateGroup" ADD CONSTRAINT %I PRIMARY KEY ("nFSid")', pk_name);
  ELSIF pk_cols IS DISTINCT FROM 'nFSid' THEN
    RAISE EXCEPTION 'FactPrivateGroup primary key % is on (%), expected ("nFSid","nGroupid")', COALESCE(pk_name, '(none)'), pk_cols;
  END IF;
END $$;

-- ---- from 2026-11-12b_private_groups_unassigned_only.up.sql, lines 50-63, verbatim ----
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
-- ---- end ----

-- ---- from 2026-11-12b_private_groups_unassigned_only.up.sql, lines 66-76, verbatim ----
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
-- ---- end ----

-- ---- from 2026-11-13_private_group_colour.up.sql, lines 78-152, verbatim ----
CREATE OR REPLACE FUNCTION public.et_workspace_private_groups(parameter json, ref refcursor) RETURNS refcursor
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := (parameter->>'nMasterid')::uuid;
  cid uuid := (parameter->>'nCaseid')::uuid;
  gid uuid := NULLIF(parameter->>'nGroupid','')::uuid;
  op text := COALESCE(parameter->>'operation','list');
  label text := btrim(parameter->>'cName'); selected_group record;
  -- "->" yields the json value null (not SQL NULL) for a JSON null, so a JSON null counts as present and clears.
  has_colour boolean := ((parameter->'cColor') IS NOT NULL);
  colour text := NULLIF(upper(parameter->>'cColor'),'');
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
    -- Yellow is kept for Unassigned; anything that is not six hex digits is not a colour.
    IF op IN ('create','rename') AND colour IS NOT NULL AND (colour !~ '^[0-9A-F]{6}$' OR colour = 'FFFF00') THEN
      OPEN ref FOR SELECT -1 msg, 'Choose a valid colour' value; RETURN ref;
    END IF;
    IF op <> 'create' THEN
      SELECT * INTO selected_group FROM public."PrivateFactGroup" WHERE "nGroupid"=gid AND
        "nCaseid"=cid AND "nUserid"=actor AND "dDeletedDt" IS NULL FOR UPDATE;
      IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 msg, 'Private Group is unavailable' value; RETURN ref;
      END IF;
    END IF;
    IF op='create' THEN
      INSERT INTO public."PrivateFactGroup"("nCaseid","nUserid","cName","cColor") VALUES(cid,actor,label,colour)
        RETURNING "nGroupid" INTO gid;
    ELSIF op='rename' THEN
      UPDATE public."PrivateFactGroup" SET "cName"=label,
        "cColor"=CASE WHEN has_colour THEN colour ELSE "cColor" END,"dUpdateDt"=now() WHERE "nGroupid"=gid;
    ELSE
      -- Keep a tombstone so a saved view never reconnects to a same-name replacement.
      UPDATE public."PrivateFactGroup" SET "dDeletedDt"=now(),"dUpdateDt"=now() WHERE "nGroupid"=gid;
      DELETE FROM public."FactPrivateGroup" WHERE "nGroupid"=gid;
    END IF;
  END IF;
  -- The actor's own Unassigned QFacts and Full Facts in this case.
  OPEN ref FOR SELECT 1 msg, gid "nGroupid",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',g."nGroupid",'name',g."cName",'color',g."cColor",'count',
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
-- ---- end ----

-- ---- from 2026-11-12b_private_groups_unassigned_only.up.sql, lines 146-177, verbatim ----
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
-- ---- end ----

DROP INDEX IF EXISTS public.fact_private_group_fact;
ALTER TABLE public."FactPrivateGroup" DROP COLUMN IF EXISTS "dCreateDt";
ALTER TABLE public."PrivateFactGroup" DROP COLUMN IF EXISTS "nICid";
COMMIT;
