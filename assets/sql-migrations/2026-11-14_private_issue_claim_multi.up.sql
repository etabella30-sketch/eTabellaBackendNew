-- 2026-11-14_private_issue_claim_multi.up.sql
--
-- Why
-- ---
-- Owner, 2026-11-12 (plan 2026-11-12-private-issues-under-claims, Task 1): a Private Analysis Group belongs to a Claim,
-- a Mark may be in several of its creator's groups, and a group may sit on a Mark beside the Mark's Team Issues. Until
-- now a group had no claim, a Mark could be in one group only (the primary key of "FactPrivateGroup" was "nFSid"), and
-- only while the Mark had no substantive Team Issue (2026-11-12b_private_groups_unassigned_only.up.sql).
--
-- What
-- ----
--   * public."PrivateFactGroup"."nICid" uuid NULL: the group's Claim, an "IssueCategory" row of the group's case.
--     NULL = the Unassigned Claim. No foreign key from "PrivateFactGroup" to it: one would either block deleting a claim
--     a group names or change the group row on that delete; a group whose claim row is gone lists claimId null.
--     ("IssueCategory" itself is referenced only by realtime."RClaimSequence"; this script adds no foreign key.)
--   * public."FactPrivateGroup": the primary key ("nFSid") becomes ("nFSid","nGroupid") (a Mark may be in several
--     groups, each once); new "dCreateDt" timestamptz NOT NULL DEFAULT now() (when the membership was added); new index
--     fact_private_group_fact on ("nFSid").
--   * et_fact_private_group_guard: the 2026-11-12b body without its "OR EXISTS(... "FMIssue" ...)" clause. A membership
--     needs a QFact or Full Fact of the group's owner in the group's case and a group that is not deleted; Team Issues
--     do not matter.
--   * et_fact_issue_private_cleanup: the 2026-11-12b body without its ELSE branch. A system Unassigned Issue row still
--     gets impact / relevance 0; a substantive Issue row no longer removes the Mark's memberships.
--   * et_private_group_assign(parameter json, ref): the 2026-11-12b body with the group part replaced:
--       - the list to keep: jPrivateGroupids (a JSON array of group ids; JSON null = []) when the key is present, else
--         the legacy nPrivateGroupid ([that id]; null or '' = []). When both are sent the array wins. An id listed twice
--         counts once.
--       - every id must be the actor's group in the Mark's case and not deleted, else {msg:-1, value:'Choose an
--         available Private Group'} and nothing changes. A jPrivateGroupids that is not an array, or an element that is
--         not a uuid string, gets the same answer.
--       - then the Mark's memberships not in the list are removed (the user's own un-tick, as nPrivateGroupid null did
--         before) and the missing ones are inserted ON CONFLICT ("nFSid","nGroupid") DO NOTHING. The k-th id of the list
--         gets "dCreateDt" = now() + (k-1) microseconds: one call stamps one time, so this keeps the list order, and the
--         last new id of a list is "the most recently added" (assignments below).
--       - unchanged: owner only, 'F' / 'QF', case access, Advanced mode, their refusal texts, the answer
--         {msg:1, nFSid}. No Team-Issue refusal.
--   * et_workspace_private_groups: the 2026-11-13 body plus
--       - a new optional key nICid, "present" like cColor: create stores it; rename changes it only when the key is
--         present; JSON null or '' stores NULL. A value must be an "IssueCategory" row of this case, else {msg:-1,
--         value:'Choose a valid Claim'} before any write; the case's system Unassigned claim (cICtype 'U' and cCategory
--         'Unassigned') is stored as NULL.
--       - group element {id, name, color, claimId, count}: claimId = the stored claim while its row exists in this case,
--         else null. count and eligibleFactIds: all the actor's 'F' / 'QF' marks (no Issue test).
--       - assignments {markId: groupId}: the most recently added membership per Mark (DISTINCT ON ("nFSid") ... ORDER BY
--         "dCreateDt" DESC, "nGroupid"), for callers that know one group per Mark.
--       - new memberships {markId: [groupId, ...]}: every membership of the Mark, oldest first (ORDER BY "dCreateDt",
--         "nGroupid").
--       - group order unchanged (lower(cName)); everything else (access, Advanced mode, name, colour and ownership
--         refusals, the duplicate-name refusal, delete with tombstone, systemIssueIds) unchanged.
--   Unchanged: et_fact_private_identity_cleanup, et_is_system_unassigned, the three trigger definitions, the
--   private_fact_group_name index (a group name stays unique per user and case, across claims).
--
-- Drift guard
-- -----------
-- Before changing anything the script hashes the four live bodies as md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g')))
-- (as 2026-11-13b_export_private_groups.up.sql does) and runs only when they are the bodies it was written for:
--   et_fact_private_group_guard      68db79541d6b61e6aa0ec0c5d2223496  (2026-11-12b up, lines 50-63)
--   et_fact_issue_private_cleanup    4a04cd6bca96b292d42969e91c826806  (2026-11-12b up, lines 66-76; = 2026-10-09 text)
--   et_private_group_assign          09cefd5b94604822a310ace6ca0d2f93  (2026-11-12b up, lines 146-177)
--   et_workspace_private_groups      5c2708642ce563d60ff4f2c145ac7bae  (2026-11-13 up, lines 78-152)
-- The hashes were computed from the file text (no database): prosrc is the text between the AS clause's dollar quotes;
-- every run of space, tab, CR, LF, VT or FF becomes one space; leading / trailing spaces are trimmed; md5 of the UTF-8
-- bytes. The same method reproduces all eight hashes written in 2026-11-13b_export_private_groups.up.sql. When the four
-- live bodies are already this script's own (guard 34835680af0de1df482445b3e5f41c34 and cleanup
-- a2a46569abc4f0d8ca666e344b88ea94, which normalise to the 2026-11-12 texts; assign b01a057ccf3318627aa28b70ec5e1c43;
-- list 3c0b0b063185ee8166896f1528f3c258) the script stops with "already applied"; any other combination stops with
-- "Drift". Either way nothing is changed.
--
-- Copied bodies
-- -------------
-- Each function below starts with a "-- ---- from <file>, lines a-b ----" line naming the body it was copied from
-- (CRLF on disk, LF as committed); that line says what differs from the source. 2026-11-14_private_issue_claim_multi.down.sql
-- restores the same source bodies verbatim.
--
-- Rows
-- ----
-- This script deletes and changes no row: ADD COLUMN (existing groups get "nICid" NULL; existing memberships get
-- "dCreateDt" = the time of the migration, one value for all), the primary key swap, CREATE INDEX and CREATE OR
-- REPLACE FUNCTION only. No DELETE, UPDATE, TRUNCATE, DROP TABLE or DROP COLUMN. Memberships left on a Mark with a
-- substantive Team Issue (possible while 2026-11-12 was live; hidden since 2026-11-12b) are listed and counted again.
--
-- Safety
-- ------
--   * One transaction; the same database guard as 2026-10-09 to 2026-11-13b: etabella_tech_uuid only, unless the session
--     setting etabella.expected_database names another database.
--   * lock_timeout 5 s: ADD COLUMN and the primary key swap take ACCESS EXCLUSIVE on "PrivateFactGroup" and
--     "FactPrivateGroup"; CREATE INDEX then runs under that lock.
--   * ADD COLUMN "nICid" (nullable, no default) is a catalogue change. ADD COLUMN "dCreateDt" NOT NULL DEFAULT now() is a
--     catalogue change too on PostgreSQL 11 or later (now() is stable: evaluated once, stored as the default of the
--     existing rows; no table rewrite).
--   * The primary key's name is looked up in pg_constraint, not assumed, and the new key is created under that same
--     name. The script refuses when that key is neither ("nFSid") nor ("nFSid","nGroupid"). The new key and the new
--     index are built over "FactPrivateGroup" (small: at most one row per Mark today).
--   * Needs 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql,
--     2026-11-12b_private_groups_unassigned_only.up.sql and 2026-11-13_private_group_colour.up.sql applied first (the
--     drift guard refuses otherwise), and public."IssueCategory" with uuid "nICid" / "nCaseid", "cCategory", "cICtype".
--   * Deploy order: the realtime-server and coreapi build of this branch is deployed BEFORE this script (its statements
--     work with both key shapes and with both versions of et_private_group_assign); the front end after it.
--     2026-11-14b must be applied together with this file: et_export_private_group (2026-11-13b) assumes at most one
--     membership per Mark.
--   * Rollback: 2026-11-14_private_issue_claim_multi.down.sql (DESTRUCTIVE; it refuses while a Mark has two
--     memberships, a group has a claim, or a membership sits on a Mark with a substantive Team Issue).
--
-- Verify: 2026-11-14_private_issue_claim_multi.test.sql, in a new scratch database only.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-14_private_issue_claim_multi.up.sql

BEGIN;
-- ADD COLUMN and the primary key swap take ACCESS EXCLUSIVE: give up after 5 s instead of queueing.
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for Private Issues under Claims migration';
  END IF;
END $$;

-- Drift guard (see the header).
DO $$
DECLARE live jsonb := jsonb_build_object(
    'guard', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_fact_private_group_guard()')),
    'cleanup', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_fact_issue_private_cleanup()')),
    'assign', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_private_group_assign(json,refcursor)')),
    'list', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_workspace_private_groups(json,refcursor)')));
BEGIN
  IF live->>'guard' = '68db79541d6b61e6aa0ec0c5d2223496' AND live->>'cleanup' = '4a04cd6bca96b292d42969e91c826806'
     AND live->>'assign' = '09cefd5b94604822a310ace6ca0d2f93' AND live->>'list' = '5c2708642ce563d60ff4f2c145ac7bae' THEN
    NULL;  -- the 2026-11-12b / 2026-11-13 bodies this script was written for
  ELSIF live->>'guard' = '34835680af0de1df482445b3e5f41c34' AND live->>'cleanup' = 'a2a46569abc4f0d8ca666e344b88ea94'
     AND live->>'assign' = 'b01a057ccf3318627aa28b70ec5e1c43' AND live->>'list' = '3c0b0b063185ee8166896f1528f3c258' THEN
    RAISE EXCEPTION 'Private Issues under Claims: already applied (the four bodies are this script''s own); nothing was changed';
  ELSE
    RAISE EXCEPTION 'Drift: the live Private Group function bodies are not the ones this script was written for: %', live;
  END IF;
END $$;

DO $$ BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'IssueCategory'
        AND ((column_name IN ('nICid', 'nCaseid') AND data_type = 'uuid') OR column_name IN ('cCategory', 'cICtype'))) <> 4 THEN
    RAISE EXCEPTION 'public."IssueCategory" with uuid "nICid" and "nCaseid", "cCategory" and "cICtype" is required';
  END IF;
END $$;

ALTER TABLE public."PrivateFactGroup" ADD COLUMN IF NOT EXISTS "nICid" uuid;
ALTER TABLE public."FactPrivateGroup" ADD COLUMN IF NOT EXISTS "dCreateDt" timestamptz NOT NULL DEFAULT now();

-- Primary key ("nFSid") -> ("nFSid","nGroupid"). Its name is looked up, not assumed, and kept.
DO $$
DECLARE pk_name text; pk_cols text;
BEGIN
  SELECT c.conname, (SELECT string_agg(a.attname::text, ',' ORDER BY k.ord) FROM unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
                       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum)
    INTO pk_name, pk_cols
    FROM pg_constraint c WHERE c.conrelid = 'public."FactPrivateGroup"'::regclass AND c.contype = 'p';
  IF pk_cols = 'nFSid' THEN
    EXECUTE format('ALTER TABLE public."FactPrivateGroup" DROP CONSTRAINT %I', pk_name);
    EXECUTE format('ALTER TABLE public."FactPrivateGroup" ADD CONSTRAINT %I PRIMARY KEY ("nFSid", "nGroupid")', pk_name);
  ELSIF pk_cols IS DISTINCT FROM 'nFSid,nGroupid' THEN
    RAISE EXCEPTION 'FactPrivateGroup primary key % is on (%), expected ("nFSid")', COALESCE(pk_name, '(none)'), pk_cols;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS fact_private_group_fact ON public."FactPrivateGroup" ("nFSid");

-- IF NOT EXISTS above would let a pre-existing object of another shape through: assert the real shape.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PrivateFactGroup'
      AND column_name = 'nICid' AND data_type = 'uuid' AND is_nullable = 'YES' AND column_default IS NULL) THEN
    RAISE EXCEPTION 'PrivateFactGroup.nICid is missing or is not a nullable uuid without a default';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'FactPrivateGroup'
      AND column_name = 'dCreateDt' AND data_type = 'timestamp with time zone' AND is_nullable = 'NO'
      AND column_default = 'now()') THEN
    RAISE EXCEPTION 'FactPrivateGroup.dCreateDt is missing or is not timestamptz NOT NULL DEFAULT now()';
  END IF;
  IF (SELECT string_agg(a.attname::text, ',' ORDER BY k.ord) FROM pg_constraint c
        CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
       WHERE c.conrelid = 'public."FactPrivateGroup"'::regclass AND c.contype = 'p') IS DISTINCT FROM 'nFSid,nGroupid' THEN
    RAISE EXCEPTION 'FactPrivateGroup primary key is not ("nFSid","nGroupid")';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
      WHERE i.indexrelid = to_regclass('public.fact_private_group_fact') AND i.indrelid = 'public."FactPrivateGroup"'::regclass
        AND i.indnatts = 1 AND a.attname = 'nFSid' AND i.indpred IS NULL AND i.indexprs IS NULL) THEN
    RAISE EXCEPTION 'Index fact_private_group_fact is missing or is not on ("nFSid")';
  END IF;
END $$;

-- ---- from 2026-11-12b_private_groups_unassigned_only.up.sql, lines 50-63, without the "OR EXISTS(... "FMIssue" ...)" clause ----
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
-- ---- end ----

-- ---- from 2026-11-12b_private_groups_unassigned_only.up.sql, lines 66-76, without the ELSE DELETE branch ----
-- These writes join the same transaction as the Issue save, including legacy callers. An Issue no longer removes a
-- membership (a Mark may have Team Issues and Private Groups together).
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

-- ---- from 2026-11-13_private_group_colour.up.sql, lines 78-152, plus the claim, memberships and the latest membership ----
-- Changed: declare and check nICid (create / rename store it); claimId in each group element; no Issue test in count,
-- assignments and eligibleFactIds; assignments takes the latest membership per Mark; the new memberships column.
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
  -- The claim follows the colour's rule: present (JSON null or '' = Unassigned) or absent (rename keeps the stored one).
  has_claim boolean := ((parameter->'nICid') IS NOT NULL);
  claim_text text := NULLIF(parameter->>'nICid','');
  claim uuid; claim_row record;
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
    -- A claim must be an "IssueCategory" row of this case; the case's system Unassigned claim is stored as NULL.
    IF op IN ('create','rename') AND claim_text IS NOT NULL THEN
      IF claim_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        OPEN ref FOR SELECT -1 msg, 'Choose a valid Claim' value; RETURN ref;
      END IF;
      SELECT c."nICid", (c."cICtype"='U' AND c."cCategory"='Unassigned') is_unassigned INTO claim_row
        FROM public."IssueCategory" c WHERE c."nICid"=claim_text::uuid AND c."nCaseid"=cid;
      IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 msg, 'Choose a valid Claim' value; RETURN ref;
      END IF;
      claim := CASE WHEN claim_row.is_unassigned THEN NULL ELSE claim_row."nICid" END;
    END IF;
    IF op <> 'create' THEN
      SELECT * INTO selected_group FROM public."PrivateFactGroup" WHERE "nGroupid"=gid AND
        "nCaseid"=cid AND "nUserid"=actor AND "dDeletedDt" IS NULL FOR UPDATE;
      IF NOT FOUND THEN
        OPEN ref FOR SELECT -1 msg, 'Private Group is unavailable' value; RETURN ref;
      END IF;
    END IF;
    IF op='create' THEN
      INSERT INTO public."PrivateFactGroup"("nCaseid","nUserid","cName","cColor","nICid") VALUES(cid,actor,label,colour,claim)
        RETURNING "nGroupid" INTO gid;
    ELSIF op='rename' THEN
      UPDATE public."PrivateFactGroup" SET "cName"=label,
        "cColor"=CASE WHEN has_colour THEN colour ELSE "cColor" END,
        "nICid"=CASE WHEN has_claim THEN claim ELSE "nICid" END,"dUpdateDt"=now() WHERE "nGroupid"=gid;
    ELSE
      -- Keep a tombstone so a saved view never reconnects to a same-name replacement.
      UPDATE public."PrivateFactGroup" SET "dDeletedDt"=now(),"dUpdateDt"=now() WHERE "nGroupid"=gid;
      DELETE FROM public."FactPrivateGroup" WHERE "nGroupid"=gid;
    END IF;
  END IF;
  -- The actor's own QFacts and Full Facts in this case, with or without Team Issues.
  OPEN ref FOR SELECT 1 msg, gid "nGroupid",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',g."nGroupid",'name',g."cName",'color',g."cColor",
      'claimId',(SELECT c."nICid" FROM public."IssueCategory" c WHERE c."nICid"=g."nICid" AND c."nCaseid"=cid),'count',
      (SELECT count(*) FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
       WHERE a."nGroupid"=g."nGroupid" AND f."nUserid"=actor AND f."cFType" IN ('F','QF'))) ORDER BY lower(g."cName"),g."nGroupid")
      FROM public."PrivateFactGroup" g WHERE g."nUserid"=actor AND g."nCaseid"=cid AND g."dDeletedDt" IS NULL),'[]'::jsonb) groups,
    -- One group per Mark (callers that know one): the most recently added membership.
    COALESCE((SELECT jsonb_object_agg(l."nFSid"::text,l."nGroupid"::text) FROM (
      SELECT DISTINCT ON (a."nFSid") a."nFSid",a."nGroupid"
      FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
      JOIN public."PrivateFactGroup" g USING("nGroupid") WHERE f."nUserid"=actor AND f."nCaseid"=cid
        AND f."cFType" IN ('F','QF') AND g."dDeletedDt" IS NULL AND g."nUserid"=actor
      ORDER BY a."nFSid",a."dCreateDt" DESC,a."nGroupid") l),'{}'::jsonb) assignments,
    -- Every group of a Mark, oldest first.
    COALESCE((SELECT jsonb_object_agg(m."nFSid"::text,m.ids) FROM (
      SELECT a."nFSid",jsonb_agg(a."nGroupid"::text ORDER BY a."dCreateDt",a."nGroupid") ids
      FROM public."FactPrivateGroup" a JOIN public."FactMaster" f USING("nFSid")
      JOIN public."PrivateFactGroup" g USING("nGroupid") WHERE f."nUserid"=actor AND f."nCaseid"=cid
        AND f."cFType" IN ('F','QF') AND g."dDeletedDt" IS NULL AND g."nUserid"=actor
      GROUP BY a."nFSid") m),'{}'::jsonb) memberships,
    COALESCE((SELECT jsonb_agg(f."nFSid") FROM public."FactMaster" f
      WHERE f."nUserid"=actor AND f."nCaseid"=cid AND f."cFType" IN ('F','QF')),'[]'::jsonb) "eligibleFactIds",
    COALESCE((SELECT jsonb_agg(i."nIid") FROM public."RIssueMaster" i
      WHERE public.et_is_system_unassigned(i."nIid")),'[]'::jsonb) "systemIssueIds";
  RETURN ref;
EXCEPTION WHEN unique_violation THEN
  OPEN ref FOR SELECT -1 msg, 'A Private Group with that name already exists' value; RETURN ref;
END $$;
-- ---- end ----

-- ---- from 2026-11-12b_private_groups_unassigned_only.up.sql, lines 146-177, the single group replaced by a list ----
-- Changed: the list to keep (jPrivateGroupids, else nPrivateGroupid) is read and checked; the Mark leaves the groups
-- not in it and joins the missing ones; no Team-Issue refusal. Owner, type, access and Advanced-mode checks unchanged.
CREATE OR REPLACE FUNCTION public.et_private_group_assign(parameter json, ref refcursor) RETURNS refcursor
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := (parameter->>'nMasterid')::uuid;
  fid uuid := (parameter->>'nFSid')::uuid;
  gid uuid := NULLIF(parameter->>'nPrivateGroupid','')::uuid; f record;
  -- jPrivateGroupids, when the key is present, is the whole list (JSON null = none); it wins over nPrivateGroupid.
  picked json := parameter->'jPrivateGroupids';
  gids uuid[]; n_ok bigint;
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
  IF picked IS NULL THEN
    gids := CASE WHEN gid IS NULL THEN '{}'::uuid[] ELSE ARRAY[gid] END;
  ELSIF json_typeof(picked) = 'null' THEN
    gids := '{}'::uuid[];
  ELSIF json_typeof(picked) <> 'array' THEN
    OPEN ref FOR SELECT -1 msg, 'Choose an available Private Group' value; RETURN ref;
  ELSIF EXISTS(SELECT 1 FROM json_array_elements(picked) e(v)
      WHERE e.v::text !~* '^"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"$') THEN
    -- An element that is not a uuid string.
    OPEN ref FOR SELECT -1 msg, 'Choose an available Private Group' value; RETURN ref;
  ELSE
    -- Each id once, in list order.
    SELECT COALESCE(array_agg(x.id ORDER BY x.first_ord), '{}'::uuid[]) INTO gids
      FROM (SELECT e.v::uuid id, min(e.ord) first_ord FROM json_array_elements_text(picked) WITH ORDINALITY e(v, ord)
            GROUP BY e.v::uuid) x;
  END IF;
  -- Another user's, another case's or a deleted group: nothing changes. The listed groups stay locked until commit.
  SELECT count(*) INTO n_ok FROM (SELECT 1 FROM public."PrivateFactGroup" WHERE "nGroupid"=ANY(gids) AND "nUserid"=actor
    AND "nCaseid"=f."nCaseid" AND "dDeletedDt" IS NULL FOR SHARE) ok;
  IF n_ok <> cardinality(gids) THEN
    OPEN ref FOR SELECT -1 msg, 'Choose an available Private Group' value; RETURN ref;
  END IF;
  -- The user's own un-tick: the Mark leaves every group that is not in the list.
  DELETE FROM public."FactPrivateGroup" WHERE "nFSid"=fid AND "nGroupid"<>ALL(gids);
  -- The k-th id of the list is stamped k-1 microseconds after the first, so the last new id is the most recently added.
  INSERT INTO public."FactPrivateGroup"("nFSid","nGroupid","dCreateDt")
    SELECT fid, x.id, now() + (x.ord - 1) * interval '1 microsecond' FROM unnest(gids) WITH ORDINALITY x(id, ord)
    ON CONFLICT ("nFSid","nGroupid") DO NOTHING;
  OPEN ref FOR SELECT 1 msg, fid "nFSid"; RETURN ref;
END $$;
-- ---- end ----
COMMIT;
