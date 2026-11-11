-- 2026-11-13_private_group_colour.up.sql
--
-- Why
-- ---
-- Owner, 2026-11-11: a Private Analysis Group gets a colour, so the creator can tell their groups apart on the
-- QFACT panel and in lists. Until now a group has a name only.
--
-- What
-- ----
--   * public."PrivateFactGroup"."cColor" varchar(6) NULL: upper-case RRGGBB, no '#'. NULL = no colour chosen.
--   * Constraint private_fact_group_colour: "cColor" IS NULL OR "cColor" ~ '^[0-9A-F]{6}$'.
--   * et_workspace_private_groups (CREATE OR REPLACE; the 2026-11-12b body, copied from lines 78-144 of
--     2026-11-12b_private_groups_unassigned_only.up.sql, plus the colour rules below):
--       - new optional input key cColor (text).
--       - create: stores upper(cColor), or NULL when the key is absent, JSON null or ''.
--       - rename: sets cName; sets cColor only when the key is present ('' or JSON null stores NULL; test:
--         parameter->'cColor' IS NOT NULL); an absent key
--         keeps the stored colour.
--       - a value that is not six hex digits (after upper-casing; so no '#', no 3-digit form) or that is FFFF00
--         (yellow, kept for Unassigned) is refused with {msg:-1, value:'Choose a valid colour'}, before any write.
--       - every element of "groups" is now {id, name, color, count}; color is the stored value or JSON null.
--     Everything else (access, Advanced-mode, name and ownership refusals, counts, assignments, eligibleFactIds,
--     systemIssueIds, the duplicate-name refusal) is unchanged. A group is still listed to its creator only.
--   Unchanged: the other three functions of 2026-11-12b, the triggers, FactPrivateGroup.
--
-- Rows
-- ----
-- This script deletes and changes no row: ADD COLUMN (existing rows get NULL), ADD CONSTRAINT (NULL passes) and
-- CREATE OR REPLACE FUNCTION only. No DELETE, UPDATE, TRUNCATE or DROP.
--
-- Safety
-- ------
--   * One transaction; the same database guard as 2026-10-09, 2026-11-12 and 2026-11-12b: etabella_tech_uuid only,
--     unless the session setting etabella.expected_database names another database.
--   * ADD COLUMN of a nullable column without a default is a catalogue change (no table rewrite); ADD CONSTRAINT
--     scans the table once under a short lock (the table is small: one row per group).
--   * Needs 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql and
--     2026-11-12b_private_groups_unassigned_only.up.sql applied first.
--   * Rollback: 2026-11-13_private_group_colour.down.sql (it discards the colours chosen since this script).
--
-- Verify: 2026-11-13_private_group_colour.test.sql, in a new scratch database only.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-13_private_group_colour.up.sql

BEGIN;
-- ADD COLUMN / ADD CONSTRAINT take ACCESS EXCLUSIVE on "PrivateFactGroup": give up after 5 s instead of queueing.
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for Private Group colour migration';
  END IF;
END $$;

ALTER TABLE public."PrivateFactGroup" ADD COLUMN IF NOT EXISTS "cColor" varchar(6);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'private_fact_group_colour'
      AND conrelid = 'public."PrivateFactGroup"'::regclass) THEN
    ALTER TABLE public."PrivateFactGroup" ADD CONSTRAINT private_fact_group_colour
      CHECK ("cColor" IS NULL OR "cColor" ~ '^[0-9A-F]{6}$');
  END IF;
END $$;

-- IF NOT EXISTS above would let a pre-existing object with another definition through: assert the real shape.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = 'PrivateFactGroup' AND column_name = 'cColor'
      AND data_type = 'character varying' AND character_maximum_length = 6) THEN
    RAISE EXCEPTION 'PrivateFactGroup.cColor is missing or is not character varying(6)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'private_fact_group_colour'
      AND conrelid = 'public."PrivateFactGroup"'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%cColor%' AND pg_get_constraintdef(oid) LIKE '%0-9A-F%') THEN
    RAISE EXCEPTION 'Constraint private_fact_group_colour is missing or has another definition';
  END IF;
END $$;

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
COMMIT;
