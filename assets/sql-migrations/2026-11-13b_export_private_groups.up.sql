-- 2026-11-13b_export_private_groups.up.sql
--
-- Why
-- ---
-- Owner, 2026-11-11 (plan 2026-11-11-private-group-colour-three-categories, Task 9): the Reader "Export with Marks" PDF
-- is filtered and coloured on the server. Next to the Fact Issues and QFact Issues picked today, the exporting user may
-- now also pick their OWN Private Analysis Groups. Request contract: ruling R7 (fix round 1).
--
-- What
-- ----
--   * public."ExportMaster" gains four nullable columns without a default (existing rows get NULL):
--       "jFGroup" jsonb, "jQFGroup" jsonb   the ids (text) of the Private Groups ticked for Full Facts ('F') and for
--                                           QFacts ('QF'). NULL and [] both mean "no group ticked for that type".
--       "bFTeam" boolean, "bQFTeam" boolean sent only with that type's non-empty group array: true or NULL = that
--                                           type's Team marks are wanted too; false = only the ticked groups' marks.
--   * Rule, PER TYPE: a Fact row looks only at jFGroup / bFTeam, a QFact row only at jQFGroup / bQFTeam; a group ticked
--     for one type changes nothing for the other type.
--       - A type with no group ticked: the row test is EXACTLY today's expression, untouched (including how today's
--         expression decides whether a filter is on). Its flag is ignored. The actor's grouped marks of that type keep
--         today's behaviour (for example they export as Unassigned, yellow, when Unassigned or "all" is ticked).
--       - A type with groups ticked:
--           * the actor's own effectively-grouped mark passes only if its group is ticked for its type (never through
--             an Issue, Unassigned or a Contact). "Effectively grouped": the actor's own mark in the actor's own group,
--             not deleted, in the mark's case, and the mark has no substantive Issue (2026-11-12b; a leftover membership
--             on a mark with a Team Issue does not count, as in et_workspace_private_groups);
--           * every other row of that type: excluded when the flag is false; otherwise included when that type has no
--             Issue and no Contact ticked (the dialog sends [] for "all Team Issues"); otherwise today's Issue / Contact
--             test for that type.
--       - A row that passed through a ticked group gets the group colour COALESCE(group colour, '7C5CFF') and, in the
--         index, the group name as its Issue label.
--   * Three helpers (new; LANGUAGE sql without a SET clause, so the planner can inline them; every table and function
--     they name is schema-qualified or built in):
--       et_export_nonempty_array(j)          true when j is a JSON array with at least one element.
--       et_export_private_group(nFSid, actor, jFGroup, jQFGroup)
--                                            the actor's effectively-grouped mark, when its type has groups ticked; at
--                                            most one row: nGroupid, cName, cColor = COALESCE(group colour, '7C5CFF'),
--                                            bSelected = the group is ticked for the mark's type. Ids are compared in
--                                            lower case, so an upper-case id in the array matches too.
--       et_export_team_rule(cFType, jFGroup, jQFGroup, bFTeam, bQFTeam, jFIssue, jQFIssue, jFContact, jQFContact)
--                                            for a row that is not an effectively-grouped mark: NULL = "use today's
--                                            expression" (no group for its type, or an Issue / Contact is ticked for its
--                                            type), false = excluded (flag false), true = included (no Issue and no
--                                            Contact ticked for its type).
--   * et_export_insert_data_1: also stores jFGroup and jQFGroup (as jFIssue: coalesce to []) and bFTeam / bQFTeam (as
--     sent; NULL when absent).
--   * et_export_get_data_1 (the Fact rows of "allfacts" and of the burned "highlights") and et_preview_document_list_1
--     ("factlinks"): the filter becomes
--       case when <effectively grouped> then <its group is ticked> else coalesce(<team rule>, <today's expression>) end
--     The group colour goes to "highlights".color (get_data) and "cColor" (preview factlinks).
--   * et_annotation_index_rows: new optional inputs nMasterid and nExportid (the export service sends both). For a mark
--     whose group is ticked for its type on that export (the export must be nMasterid's own): "cColor" = the group
--     colour and "issuelist" = [{nIssueid: null, cIssue: group name, cClr: group colour}].
--   * With no group ticked for either type (every existing export, every caller that does not send them) all four
--     functions answer exactly as before: no new output column, no changed value.
--   * Other users' marks: their groups are invisible to the actor, so they are never "effectively grouped"; they follow
--     the team rule and today's expression like any Team mark.
--
-- Not changed (on purpose)
-- ------------------------
--   * The "factsheet" cursor of et_preview_document_list_1: the export service does not read it (the
--     generateAppendix(factslist) call in export-file.service.ts createIndexPages is commented out), its type test
--     compares FactDetail."cType" with 'F' / 'QF' (so with any Issue ticked it is already empty), and it carries no group
--     data, so it cannot show a group name.
--   * DocLink and WebLink rows.
--
-- Drift guard
-- -----------
-- The four bodies below are the bodies of the July files with the group additions. Before changing anything the script
-- hashes the live bodies as md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) and runs only when
--   * they are the bodies it was written for: et_export_insert_data_1 6bc7ff9c36d521d85c783415ce40031c,
--     et_export_get_data_1 ab0b07ed821582dce7ec7b8cf5726bb0, et_annotation_index_rows a4e420fb93a725210916a97c40177c23,
--     et_preview_document_list_1 c7ef247206452116cbed908159f56147 (the live text of the 2026-09-15 catalog dump,
--     migrations/rehearsal_etabella_tech_uuid_2026-09-15.sql on branch realtime-local) or
--     fa71e26cbc080a701058d5955d495367 (the 2026-07-08 file text: the same code, other comments); or
--   * they are already this script's own four bodies (a second run): it then says so and re-creates the same bodies and
--     nothing else changes (ADD COLUMN IF NOT EXISTS), so a second run is a no-op.
-- Any other combination is refused before anything is changed.
--
-- Copied bodies
-- -------------
-- Each function below is the newest body of that name found in this repository, copied verbatim (LF line ends, as
-- committed) with the group branch added; every line that differs from the source is a group addition. Each copy
-- starts with a "-- ---- from <file>, lines a-b ----" line. 2026-11-13b_export_private_groups.down.sql restores the same
-- source bodies.
--
-- Rows
-- ----
-- This script deletes and changes no row: ADD COLUMN (existing rows get NULL) and CREATE OR REPLACE FUNCTION only.
-- No DELETE, UPDATE, TRUNCATE or DROP.
--
-- Safety
-- ------
--   * One transaction; the same database guard as 2026-11-13_private_group_colour.up.sql: etabella_tech_uuid only,
--     unless the session setting etabella.expected_database names another database.
--   * ADD COLUMN of a nullable column without a default is a catalogue change (no table rewrite), under a short
--     ACCESS EXCLUSIVE lock on "ExportMaster" (lock_timeout 5 s).
--   * Needs 2026-10-09_private_fact_groups.up.sql, 2026-11-12_private_groups_for_qfacts.up.sql,
--     2026-11-12b_private_groups_unassigned_only.up.sql and 2026-11-13_private_group_colour.up.sql applied first; it
--     refuses to run without "FactPrivateGroup", et_is_system_unassigned and "PrivateFactGroup"."cColor".
--   * It refuses to run when public.annotations."color" is not text or character varying: the burned colour becomes
--     COALESCE(group colour, annotations.color).
--   * Deploy order: this script and the Nest export app first, the front end last. The export app may go before or
--     after this script (the old functions ignore the new keys; the new ones work without them). The Reader export
--     dialog must not send group ids before both are live: the old et_export_get_data_1 would read "groups only, no
--     Issue" as "no filter" and burn every mark, and the old DTO refuses the new keys.
--   * Rollback: 2026-11-13b_export_private_groups.down.sql.
--
-- Verify: 2026-11-13b_export_private_groups.test.sql, in a new scratch database only.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-13b_export_private_groups.up.sql

BEGIN;
-- ADD COLUMN takes ACCESS EXCLUSIVE on "ExportMaster": give up after 5 s instead of queueing.
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for export Private Groups migration';
  END IF;
END $$;

-- Drift guard (see the header).
DO $$
DECLARE live jsonb := jsonb_build_object(
    'insert', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_export_insert_data_1(json,refcursor)')),
    'get', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_export_get_data_1(json,refcursor)')),
    'preview', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_preview_document_list_1(json,refcursor)')),
    'index', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_annotation_index_rows(json,refcursor)')));
BEGIN
  IF live->>'insert' = '6bc7ff9c36d521d85c783415ce40031c' AND live->>'get' = 'ab0b07ed821582dce7ec7b8cf5726bb0'
     AND live->>'preview' IN ('c7ef247206452116cbed908159f56147', 'fa71e26cbc080a701058d5955d495367')
     AND live->>'index' = 'a4e420fb93a725210916a97c40177c23' THEN
    NULL;  -- the bodies this script was written for
  ELSIF live->>'insert' = 'c709859c0771bb7ffd67cb69743f0f68' AND live->>'get' = '4e153224b2e1927c0814afd5937f725c'
     AND live->>'preview' = '717ffc7a38a6285b45353a096bc0c931' AND live->>'index' = 'd960718d865d3c928dad4725b7fb7fa6' THEN
    RAISE NOTICE 'export Private Groups: already applied; the same bodies are created again (no change)';
  ELSE
    RAISE EXCEPTION 'Drift: the live export function bodies are not the ones this script was written for: %', live;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public."FactPrivateGroup"') IS NULL OR to_regprocedure('public.et_is_system_unassigned(uuid)') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
                      AND table_name = 'PrivateFactGroup' AND column_name = 'cColor') THEN
    RAISE EXCEPTION 'Apply 2026-10-09_private_fact_groups.up.sql to 2026-11-13_private_group_colour.up.sql first';
  END IF;
  -- The burned colour of a group row is COALESCE(group colour, annotations.color): that column must be a string.
  IF NOT COALESCE((SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a
                   WHERE a.attrelid = to_regclass('public.annotations') AND a.attname = 'color' AND NOT a.attisdropped)
                  ~ '^(text|character varying)', false) THEN
    RAISE EXCEPTION 'public.annotations.color is missing or is not text / character varying';
  END IF;
END $$;

ALTER TABLE public."ExportMaster" ADD COLUMN IF NOT EXISTS "jFGroup" jsonb, ADD COLUMN IF NOT EXISTS "jQFGroup" jsonb,
  ADD COLUMN IF NOT EXISTS "bFTeam" boolean, ADD COLUMN IF NOT EXISTS "bQFTeam" boolean;

-- IF NOT EXISTS above would let a pre-existing column of another shape through: assert the real shape.
DO $$ BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ExportMaster'
        AND is_nullable = 'YES' AND column_default IS NULL
        AND ((column_name IN ('jFGroup', 'jQFGroup') AND data_type = 'jsonb')
          OR (column_name IN ('bFTeam', 'bQFTeam') AND data_type = 'boolean'))) <> 4 THEN
    RAISE EXCEPTION 'ExportMaster.jFGroup / jQFGroup (jsonb) and bFTeam / bQFTeam (boolean) are missing or are not nullable without a default';
  END IF;
END $$;

-- True when j is a JSON array with at least one element; NULL, a scalar or an object is "empty".
CREATE OR REPLACE FUNCTION public.et_export_nonempty_array(j jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN jsonb_typeof(j) = 'array' THEN jsonb_array_length(j) > 0 ELSE false END
$$;

-- The actor's effectively-grouped mark fsid, when groups are ticked for its type: at most one row (FactPrivateGroup holds
-- one row per mark). The actor's own mark in the actor's own group, not deleted, in the mark's case, and only while the
-- mark has no substantive Issue (Team Issue and Private Group exclude each other). Another user's mark or group never
-- yields a row. bSelected: the group is ticked for the mark's type (ids compared in lower case).
CREATE OR REPLACE FUNCTION public.et_export_private_group(fsid uuid, actor uuid, fgroups jsonb, qfgroups jsonb)
RETURNS TABLE("nGroupid" uuid, "cName" text, "cColor" text, "bSelected" boolean)
LANGUAGE sql STABLE AS $$
  SELECT g."nGroupid", g."cName", COALESCE(g."cColor", '7C5CFF')::text,
         EXISTS (SELECT 1 FROM jsonb_array_elements_text(t.picked) p WHERE lower(p) = g."nGroupid"::text)
  FROM public."FactMaster" f
  CROSS JOIN LATERAL (SELECT CASE f."cFType" WHEN 'F' THEN fgroups WHEN 'QF' THEN qfgroups END AS picked) t
  JOIN public."FactPrivateGroup" a ON a."nFSid" = f."nFSid"
  JOIN public."PrivateFactGroup" g ON g."nGroupid" = a."nGroupid"
  WHERE f."nFSid" = fsid AND f."nUserid" = actor
    AND g."nUserid" = actor AND g."nCaseid" = f."nCaseid" AND g."dDeletedDt" IS NULL
    AND public.et_export_nonempty_array(t.picked)
    AND NOT EXISTS (SELECT 1 FROM public."FMIssue" i WHERE i."nFSid" = f."nFSid"
                      AND NOT public.et_is_system_unassigned(i."nIssueid"))
$$;

-- For a row that is not an effectively-grouped mark, by the row's type: NULL = use today's expression (no group ticked
-- for the type, or an Issue / Contact is ticked for it), false = excluded (the type's flag is false), true = included
-- (groups ticked, flag true or NULL, no Issue and no Contact ticked for the type: "all Team Issues").
CREATE OR REPLACE FUNCTION public.et_export_team_rule(cftype text, fgroups jsonb, qfgroups jsonb, fteam boolean,
  qfteam boolean, fissue jsonb, qfissue jsonb, fcontact jsonb, qfcontact jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN NOT public.et_export_nonempty_array(CASE cftype WHEN 'F' THEN fgroups WHEN 'QF' THEN qfgroups END) THEN NULL
    WHEN (CASE cftype WHEN 'F' THEN fteam ELSE qfteam END) IS FALSE THEN false
    WHEN NOT public.et_export_nonempty_array(CASE cftype WHEN 'F' THEN fissue ELSE qfissue END)
     AND NOT public.et_export_nonempty_array(CASE cftype WHEN 'F' THEN fcontact ELSE qfcontact END) THEN true
    ELSE NULL END
$$;

-- ---- from 2026-07-08_export_team_marks.up.sql, lines 18-72, verbatim, plus the group branch ----
-- Group additions: declare + read jFGroup / jQFGroup / bFTeam / bQFTeam; store them (the arrays coalesce to [], as
-- jFIssue; the flags as sent).
CREATE OR REPLACE FUNCTION public.et_export_insert_data_1(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;
nExportid uuid;
cType text;bPagination boolean;
bDoc boolean;bFact boolean;bQfact boolean;
bWeb boolean;
bCoverpg boolean;bFitpg boolean;
bTeamMarks boolean;

cDsize text;cFsize text; cQFsize text;
cOrientation text;cPgsize text;
jFiles jsonb;
jFContact jsonb;jFIssue jsonb;
jQFContact jsonb;jQFIssue jsonb;
jFGroup jsonb;jQFGroup jsonb;bFTeam boolean;bQFTeam boolean;
jPages jsonb;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid; nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

cType := parameter->>'cPdftype';

bPagination := parameter->>'bPagination';
bDoc := parameter->>'bDoc'; bFact := parameter->>'bFact'; bQfact := parameter->>'bQfact';
bCoverpg := parameter->>'bCoverpg';bFitpg := parameter->>'bFitpg';
bTeamMarks := coalesce((parameter->>'bTeamMarks')::boolean, false);

cDsize := parameter->>'cDsize'; cFsize := parameter->>'cFsize'; cQFsize := parameter->>'cQFsize';
cOrientation := parameter->>'cOrientation'; cPgsize := parameter->>'cPgsize';

jFContact := parameter->>'jFContact'; jFIssue := parameter->>'jFIssue';
jQFContact := parameter->>'jQFContact'; jQFIssue := parameter->>'jQFIssue';
jFGroup := parameter->>'jFGroup'; jQFGroup := parameter->>'jQFGroup';
bFTeam := (parameter->>'bFTeam')::boolean; bQFTeam := (parameter->>'bQFTeam')::boolean;
jPages := parameter->>'jPages';
bWeb := parameter ->>'bWeb';
jFiles := parameter ->>'jFiles';

	insert into "ExportMaster" ("nUserid","nCaseid","cType","dReqDt","cStatus","bPagination","bDoc","bFact","bQfact","bCoverpg","bFitpg",
							   "cDsize","cFsize","cQFsize","cOrientation","cPgsize","jFContact","jFIssue","jQFContact","jQFIssue","jPages","bWeb","bTeamMarks","jFGroup","jQFGroup","bFTeam","bQFTeam")

	values(nMasterid,nCaseid,cType,now(),'P',bPagination,bDoc,bFact,bQfact,bCoverpg,bFitpg,
		  cDsize,cFsize,cQFsize,cOrientation,cPgsize,coalesce(jFContact,'[]'::jsonb),coalesce(jFIssue,'[]'::jsonb),
		  coalesce(jQFContact,'[]'::jsonb),coalesce(jQFIssue,'[]'::jsonb),jPages,bWeb,bTeamMarks,coalesce(jFGroup,'[]'::jsonb),coalesce(jQFGroup,'[]'::jsonb),bFTeam,bQFTeam)
      RETURNING "nExportid" INTO nExportid;

	insert into "ExportDetail"("nExportid","nBDid")
	select distinct nExportid,NULLIF(t,'')::uuid from jsonb_array_elements_text(jFiles) t;

	open ref for select nExportid "nExportid";

RETURN ref;
    END;
$function$;
-- ---- end ----

-- ---- from 2026-07-08_export_team_marks.up.sql, lines 78-208, verbatim, plus the group branch ----
-- Group additions, in "allfacts" and in the Fact branch of "tbl": the lateral helper call pg; the filter is
-- "case when pg row then pg.bSelected else coalesce(et_export_team_rule(...), <today's expression>) end"; tbl carries
-- "cGroupColor" (the group colour of a row that passed through a ticked group, NULL otherwise; NULL in the DocLink /
-- WebLink branches) and the burned "color" is COALESCE("cGroupColor", annotations.color).
CREATE OR REPLACE FUNCTION public.et_export_get_data_1(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid; bIsRetry boolean;
        nCaseid uuid; isAdmin boolean default false; nTeamid uuid; nRoleid uuid;

BEGIN

nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
bIsRetry := (parameter ->>'bIsRetry')::boolean;

-- Visibility context (mirrors et_workspace_fact_list). Only consulted when the
-- export opted into team marks (m."bTeamMarks"); owner marks never need it.
select "nCaseid" into nCaseid from "ExportMaster" where "nExportid" = nExportid;
if nUserid is not null then
    select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
    select "nTeamid","nRoleid" into nTeamid, nRoleid
      from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
    if (coalesce(isAdmin,false) = false
        and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
        isAdmin := true;
    end if;
end if;

-- for retry
if(bIsRetry) then
        update "ExportMaster" set "cStatus" = 'P' where "nExportid" = nExportid;
        update "ExportDetail" set "cStatus" = 'P' where "nExportid" = nExportid;
end if;

open ref for

select
 m."nExportid",m."nUserid",m."cType",bd."nBundledetailid",d."nEDid",bd."cPath",
 m."bPagination",m."bDoc",m."bFact",m."bWeb",m."bQfact",m."bCoverpg",m."bFitpg",
m."cDsize",m."cFsize",m."cQFsize",m."cOrientation",m."cPgsize",m."jFContact",m."jFIssue",m."jQFContact",m."jQFIssue",m."jPages",
 coalesce(f."allfacts",'[]'::jsonb) as allfacts,
 jsonb_agg(h) filter (where h.id is not null)  "highlights"
 ,case when jsonb_array_length(m."jPages") > 0 then false else true end "isAllpage" from "ExportMaster" m
join "ExportDetail" d on d."nExportid" = m."nExportid"
join "BundleDetail" bd on bd."nBundledetailid" = d."nBDid"
left join lateral (
select jsonb_agg(distinct fs."nFSid") as "allfacts"
from "FactMaster" fs
left join "FMIssue" fi on fi."nFSid"  = fs."nFSid"
left join "FMContact" fc on fc."nFSid"  = fs."nFSid"
left join lateral public.et_export_private_group(fs."nFSid", nUserid, m."jFGroup", m."jQFGroup") pg on true
where "nCreateId" = nUserid and  fs."nBundledetailid" = bd."nBundledetailid"
	and
	case when pg."nGroupid" is not null then pg."bSelected" else coalesce(public.et_export_team_rule(fs."cFType", m."jFGroup", m."jQFGroup", m."bFTeam", m."bQFTeam", m."jFIssue", m."jQFIssue", m."jFContact", m."jQFContact"), (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) and fs."cFType"  =  'QF') or (  m."jFIssue" @> to_jsonb(fi."nIssueid"::text) and fs."cFType"  =  'F' )) when jsonb_array_length(m."jQFIssue") > 0 and  fs."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  fs."cFType"  =  'F' then m."jFIssue" @> to_jsonb(fi."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then ( (m."jQFContact" @> to_jsonb(fc."nContactid"::text)  and fs."cFType" = 'QF') or   (m."jFContact" @> to_jsonb(fc."nContactid"::text)  and fs."cFType" = 'F') ) when jsonb_array_length(m."jQFContact") > 0 and  fs."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  fs."cFType"  =  'F' then m."jFContact" @> to_jsonb(fc."nContactid"::text) else false end

	)
	else true end
	)) end
group by "nBundledetailid"
) f on true
left join lateral(
with tbl as (
	select distinct f."nFSid" as id,f."nFSid",null::uuid as "nDocid",null::uuid as "nWebid",coalesce("cFType",'F') as "linktype",case when pg."bSelected" then pg."cColor" end as "cGroupColor"
	from "FactMaster" f
	left join "FMIssue" fi on fi."nFSid"  = f."nFSid"
	left join "FMContact" fc on fc."nFSid"  = f."nFSid"
	left join lateral public.et_export_private_group(f."nFSid", nUserid, m."jFGroup", m."jQFGroup") pg on true
	where case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and ( f."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "FMShared" s where s."nFSid" = f."nFSid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = f."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and f."nBundledetailid" = bd."nBundledetailid"
	and case when pg."nGroupid" is not null then pg."bSelected" else coalesce(public.et_export_team_rule(f."cFType", m."jFGroup", m."jQFGroup", m."bFTeam", m."bQFTeam", m."jFIssue", m."jQFIssue", m."jFContact", m."jQFContact"), (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) and f."cFType" = 'QF') or   (m."jFIssue" @> to_jsonb(fi."nIssueid"::text) and f."cFType" = 'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  f."cFType"  =  'F' then m."jFIssue" @> to_jsonb(fi."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then (( m."jQFContact" @> to_jsonb(fc."nContactid"::text) and  f."cFType" = 'QF') or   (m."jFContact" @> to_jsonb(fc."nContactid"::text)  and f."cFType" = 'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  f."cFType"  =  'F' then m."jFContact" @> to_jsonb(fc."nContactid"::text) else false end

	)
	else true end
	)) end
	union all
	select "nDocid" as id ,null::uuid as  "nFSid",null::uuid as  "nWebid", "nDocid",'D' as "linktype",null::text as "cGroupColor"
	from "DocMaster" d
	where  m."bDoc" = true
	and ( d."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "DMShared" s where s."nDocid" = d."nDocid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = d."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and d."nBundledetailid" = bd."nBundledetailid"
	union all
	select "nWebid" as id ,null::uuid "nFSid",null::uuid "nDocid","nWebid",'W' as "linktype",null::text as "cGroupColor"
	from "WebMaster" d
	where m."bWeb" = true
	and ( d."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "WMShared" s where s."nWebid" = d."nWebid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = d."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and d."nBundledetailid" = bd."nBundledetailid"
) select t.id,a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",coalesce(t."cGroupColor", a."color") as "color",a."page",a."nFSid",a."nDocid", a."nWebid", t."linktype"
	from tbl t
	join annotations a on a."nFSid" = t."id" or a."nDocid" = t."id" or a."nWebid" = t."id"
) h on true
where m."nExportid" = nExportid
group by  m."nExportid",m."nUserid",bd."nBundledetailid",d."nEDid",bd."cPath", m."bPagination",m."bDoc",m."bFact",m."bQfact",m."bCoverpg",m."bFitpg",
m."cDsize",m."cFsize",m."cQFsize",m."cOrientation",m."cPgsize",m."jFContact",m."jFIssue",m."jQFContact",m."jQFIssue",m."jPages",
f."allfacts"
order by bd."sorted_tab";

 RETURN ref;
    END;
$function$;
-- ---- end ----

-- ---- from 2026-07-08_index_sp_page_color.up.sql, lines 13-169, verbatim, plus the group branch ----
-- Group additions, in "factlinks" only: the lateral helper call pg (after ExportMaster m, which it reads); the same
-- filter as et_export_get_data_1; "cColor" is the group colour of a row that passed through a ticked group.
CREATE OR REPLACE FUNCTION public.et_preview_document_list_1(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    nBundledetailid UUID;
    nCaseid UUID;
    nSectionid UUID;
    cUsername TEXT;
    factlinks JSONB;
    casedetail JSONB;
    factsheet JSONB;
	doclinks JSONB;
	weblinks JSONB;
	nExportid uuid;

    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    nUserid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->>'nBundledetailid', '')::uuid;
	nExportid := NULLIF(parameter ->>'nExportid', '')::uuid;

    SELECT "nSectionid" INTO nSectionid FROM "BundleDetail" WHERE "nBundledetailid" = nBundledetailid;
    SELECT "nCaseid" INTO nCaseid FROM "SectionMaster" WHERE "nSectionid" = nSectionid;
    SELECT "cFname" || ' ' || "cLname" INTO cUsername FROM "UserMaster" WHERE "nUserid" = nUserid;

    SELECT jsonb_agg(t) INTO casedetail FROM (
        SELECT c."nCaseid", c."cCasename", c."cDesc", c."cCaseno",
            to_char(now(), 'Mon dd,yyyy') AS "dExportdt"
        FROM "CaseMaster" c WHERE "nCaseid" = nCaseid
    ) t;

   select jsonb_agg(t) into factlinks from (
	  select f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage", fd."nPage" as "nPage", case when pg."bSelected" then pg."cColor" else clr."cColor" end as "cColor", null as "text", "jOT" as "jTexts", false as "isHighlight", fd."jLinktype",
	  bd."cTab", bm."cBundletag", bd."cExhibitno",
	  COALESCE(jsonb_agg(l) FILTER (WHERE l."nFSid" IS NOT NULL), '[]'::jsonb) as "jFiles"
	  from "FactMaster" f
	  join "FactDetail" fd on fd."nFSid" = f."nFSid"
	  join "BundleDetail" bd on bd."nBundledetailid" = f."nBundledetailid"
	  left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
	  left join "RIssueMaster" clr on clr."nIid" = fd."nColorid"
	  left join (
	    select f."nFSid", t."nBundledetailid", d."cFilename", d."cPage", d."cTab", bm1."cBundletag", t."jLinktype"
	    from "FactMaster" f
	    join "FMLinks" t on t."nFSid" = f."nFSid"
	    join "BundleDetail" d on d."nBundledetailid" = t."nBundledetailid"
	    left join "BundleMaster" bm1 on bm1."nBundleid" = d."nBundleid"
	  ) l on l."nFSid" = f."nFSid"
		left join "FMIssue" i on i."nFSid"  = f."nFSid"
		left join "FMContact" c on c."nFSid"  = f."nFSid"
	  left join "ExportMaster" m on m."nExportid" = nExportid
	  left join lateral public.et_export_private_group(f."nFSid", nUserid, m."jFGroup", m."jQFGroup") pg on true
	  where f."nUserid" = nUserid and f."nBundledetailid" = nBundledetailid and
	   case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and	 case when pg."nGroupid" is not null then pg."bSelected" else coalesce(public.et_export_team_rule(f."cFType", m."jFGroup", m."jQFGroup", m."bFTeam", m."bQFTeam", m."jFIssue", m."jQFIssue", m."jFContact", m."jQFContact"), (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) then
	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then ( (m."jQFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cFType"  =  'QF') or  ( m."jFIssue" @> to_jsonb(i."nIssueid"::text) and f."cFType"  =  'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(i."nIssueid"::text)
	when jsonb_array_length(m."jFIssue") > 0 and  f."cFType"  =  'F' then m."jFIssue" @> to_jsonb(i."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then ( (m."jQFContact" @> to_jsonb(c."nContactid"::text) and  f."cFType"  =  'QF') or  ( m."jFContact" @> to_jsonb(c."nContactid"::text) and  f."cFType"  =  'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(c."nContactid"::text)
	when jsonb_array_length(m."jFContact") > 0 and  f."cFType"  =  'F' then m."jFContact" @> to_jsonb(c."nContactid"::text) else false end
	)
	else true end
	)) end
	  group by f."nFSid", f."nBundledetailid", fd."cType", fd."jLinktype", "jOT", bd."cPage", fd."nPage", clr."cColor", bd."cTab", bm."cBundletag", bd."cExhibitno", pg."bSelected", pg."cColor"
	)t;

	select jsonb_agg(t) into doclinks from (
	  select  d."nDocid", d."nBundledetailid", dd."cType", bd."cPage", dd."nPage" as "nPage", null as "text", "jOText" as "jTexts", false as "isHighlight", dd."jLinktype", bd."cTab",
	  bm."cBundletag", bd."cExhibitno",
	  COALESCE(jsonb_agg(l) FILTER (WHERE l."nDocid" IS NOT NULL), '[]'::jsonb) as "jFiles"
	  from "DocMaster" d
	  join "DocDetail" dd on dd."nDocid" = d."nDocid"
	  join "BundleDetail" bd on bd."nBundledetailid" = d."nBundledetailid"
	  left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
	  left join (
	    select d."nDocid", t."nBundledetailid", bd2."cFilename", bd2."cPage", bd2."cTab", bm2."cBundletag", t."jLinktype"
	    from "DocMaster" d
	    join "DMLinks" t on t."nDocid" = d."nDocid"
	    join "BundleDetail" bd2 on bd2."nBundledetailid" = t."nBundledetailid"
	    left join "BundleMaster" bm2 on bm2."nBundleid" = bd2."nBundleid"
	  ) l on l."nDocid" = d."nDocid"
	  where d."nUserid" = nUserid and d."nBundledetailid" = nBundledetailid
	  group by d."nDocid", d."nBundledetailid", dd."cType", dd."jLinktype", "jOText", bd."cPage", dd."nPage", bd."cTab", bm."cBundletag", bd."cExhibitno"
	)t;

	select jsonb_agg(t) into weblinks from (
	  select w."nWebid", w."nBundledetailid", wd."cType", bd."cPage",
	  wd."cUrl", wd."cTitle", wd."cNote",
	  null as "text", "jOText" as "jTexts", false as "isHighlight", wd."jLinktype", bd."cTab", bm."cBundletag", bd."cExhibitno",
	  '[]'::jsonb as "webLinks"
	  from "WebMaster" w
	  join "WebDetail" wd on wd."nWebid" = w."nWebid"
	  join "BundleDetail" bd on bd."nBundledetailid" = w."nBundledetailid"
	  left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
	  where w."nUserid" = nUserid and w."nBundledetailid" = nBundledetailid
	)t;

    SELECT jsonb_agg(t) INTO factsheet FROM (
        WITH fdetail AS (
            	SELECT f."nFSid", "jTexts",
                CASE WHEN ("jLinktype"->>'pages')::jsonb IS NOT NULL AND jsonb_array_length(("jLinktype"->>'pages')::jsonb) > 0
                    THEN ("jLinktype"->>'pages')::jsonb ELSE '[]'::jsonb END AS "cPage",
                fd."cType"
            FROM "FactMaster" f JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
            WHERE "nBundledetailid" = nBundledetailid AND f."nUserid" = nUserid
        ),
        issuelist AS (
            SELECT i."nIssueid", f_1."nFSid", im."cIName" AS "cIssue", im."cColor" AS "cClr",
                r."cCodename" AS "cRelevance", imp."cCodename" AS "cImpact", ic."cCategory"
            FROM "fdetail" f_1
            JOIN "FMIssue" i ON i."nFSid" = f_1."nFSid"
            JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
            JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
            LEFT JOIN "Codemaster" r ON r."nCodeid" = i."nRelevanceid"
            LEFT JOIN "Codemaster" imp ON imp."nCodeid" = i."nImpactid"
        ),
        contacts AS (
            SELECT c_1."cFname", c_1."nContactid", f_1."nFSid", c_1."cProfile", c_1."cLname", c_1."cAlias", c_1."cEmail"
            FROM "fdetail" f_1
            JOIN "FMContact" fc ON fc."nFSid" = f_1."nFSid"
            JOIN "ContactMaster" c_1 ON c_1."nContactid" = fc."nContactid"
        )
        SELECT jsonb_agg(c) AS "jContacts", f."nFSid", f."jTexts", "cPage", f."cType", jsonb_agg(i) AS issuelist
        FROM fdetail f
		join "ExportMaster" m on m."nExportid" = nExportid
        JOIN issuelist i ON i."nFSid" = f."nFSid"
        LEFT JOIN contacts c ON c."nFSid" = f."nFSid"
		where  case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cType" = 'F' when  m."bQfact" = true then f."cType" = 'QF'  else false end
	and	 (case when
	(jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0) then
	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cType"  =  'QF') or  ( m."jFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cType"  =  'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cType"  =  'QF' then m."jQFIssue" @> to_jsonb(i."nIssueid"::text)
	when jsonb_array_length(m."jFIssue") > 0 and  f."cType"  =  'F' then m."jFIssue" @> to_jsonb(i."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then (( m."jQFContact" @> to_jsonb(c."nContactid"::text) and f."cType"  =  'QF') or   (m."jFContact" @> to_jsonb(c."nContactid"::text) and f."cType"  =  'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cType"  =  'QF' then m."jQFContact" @> to_jsonb(c."nContactid"::text)
	when jsonb_array_length(m."jFContact") > 0 and  f."cType"  =  'F' then m."jFContact" @> to_jsonb(c."nContactid"::text) else false end
	)
	else true end
	)
        GROUP BY f."nFSid", f."jTexts", "cPage", f."cType"
    ) t;

    OPEN ref FOR
    SELECT cUsername AS "cUsername",
        COALESCE(casedetail, '[]') AS casedetail,
        COALESCE(factsheet, '[]'::jsonb) AS "factsheet",
        COALESCE(factlinks, '[]'::jsonb) AS factlinks,
		coalesce(doclinks,'[]'::jsonb) as doclinks,
		coalesce(weblinks,'[]'::jsonb) as weblinks;

    RETURN ref;
END;
$function$;
-- ---- end ----

-- ---- from 2026-07-20_annotation_index_team_marks.up.sql, lines 6-91, verbatim, plus the group branch ----
-- Group additions: read nMasterid / nExportid and the export's jFGroup / jQFGroup (only when the export is nMasterid's
-- own); the lateral helper call pg; for a mark whose group is ticked "cColor" is the group colour and "issuelist" is the
-- group as its one entry.
CREATE OR REPLACE FUNCTION public.et_annotation_index_rows(parameter json, ref refcursor)
RETURNS refcursor
LANGUAGE plpgsql
AS $function$
DECLARE
    jFactIds jsonb := COALESCE(NULLIF(parameter->>'jFactIds', '')::jsonb, '[]'::jsonb);
    jDocIds  jsonb := COALESCE(NULLIF(parameter->>'jDocIds', '')::jsonb, '[]'::jsonb);
    nMasterid uuid := NULLIF(parameter->>'nMasterid', '')::uuid;
    nExportid uuid := NULLIF(parameter->>'nExportid', '')::uuid;
    jFGroup jsonb;
    jQFGroup jsonb;
    factlinks jsonb;
    doclinks jsonb;
BEGIN
    SELECT m."jFGroup", m."jQFGroup" INTO jFGroup, jQFGroup
    FROM "ExportMaster" m WHERE m."nExportid" = nExportid AND m."nUserid" = nMasterid;
    SELECT jsonb_agg(t ORDER BY t."nPage", t."nFSid") INTO factlinks
    FROM (
        SELECT
            f."nFSid", f."nBundledetailid", f."cFType", fd."cType",
            bd."cPage", fd."nPage", CASE WHEN pg."bSelected" THEN pg."cColor" ELSE clr."cColor" END AS "cColor", NULL::text AS "text",
            fd."jOT" AS "jTexts", false AS "isHighlight", fd."jLinktype",
            bd."cTab", bm."cBundletag", bd."cExhibitno",
            CASE WHEN pg."bSelected" THEN jsonb_build_array(jsonb_build_object('nIssueid', NULL, 'cIssue', pg."cName", 'cClr', pg."cColor")) ELSE issue."issuelist" END AS "issuelist",
            COALESCE(jsonb_agg(link) FILTER (WHERE link."nFSid" IS NOT NULL), '[]'::jsonb) AS "jFiles"
        FROM "FactMaster" f
        JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
        JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
        LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
        LEFT JOIN "RIssueMaster" clr ON clr."nIid" = fd."nColorid"
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(jsonb_build_object(
                'nIssueid', fi."nIssueid",
                'cIssue', im."cIName",
                'cClr', im."cColor"
            )) AS "issuelist"
            FROM "FMIssue" fi
            JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
            WHERE fi."nFSid" = f."nFSid"
        ) issue ON true
        LEFT JOIN LATERAL (
            SELECT
                f."nFSid", target."nBundledetailid", target."cFilename",
                target."cPage", target."cTab", target_bundle."cBundletag",
                relation."jLinktype"
            FROM "FMLinks" relation
            JOIN "BundleDetail" target ON target."nBundledetailid" = relation."nBundledetailid"
            LEFT JOIN "BundleMaster" target_bundle ON target_bundle."nBundleid" = target."nBundleid"
            WHERE relation."nFSid" = f."nFSid"
        ) link ON true
        LEFT JOIN LATERAL public.et_export_private_group(f."nFSid", nMasterid, jFGroup, jQFGroup) pg ON true
        WHERE f."nFSid"::text IN (SELECT jsonb_array_elements_text(jFactIds))
        GROUP BY
            f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage",
            fd."nPage", clr."cColor", fd."jOT", fd."jLinktype", bd."cTab",
            bm."cBundletag", bd."cExhibitno", issue."issuelist", pg."bSelected", pg."cName", pg."cColor"
    ) t;

    SELECT jsonb_agg(t ORDER BY t."nPage", t."nDocid") INTO doclinks
    FROM (
        SELECT
            d."nDocid", d."nBundledetailid", dd."cType", bd."cPage",
            dd."nPage", NULL::text AS "text", dd."jOText" AS "jTexts",
            false AS "isHighlight", dd."jLinktype", bd."cTab",
            bm."cBundletag", bd."cExhibitno",
            COALESCE(jsonb_agg(link) FILTER (WHERE link."nDocid" IS NOT NULL), '[]'::jsonb) AS "jFiles"
        FROM "DocMaster" d
        JOIN "DocDetail" dd ON dd."nDocid" = d."nDocid"
        JOIN "BundleDetail" bd ON bd."nBundledetailid" = d."nBundledetailid"
        LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
        LEFT JOIN LATERAL (
            SELECT
                d."nDocid", target."nBundledetailid", target."cFilename",
                target."cPage", target."cTab", target_bundle."cBundletag",
                relation."jLinktype"
            FROM "DMLinks" relation
            JOIN "BundleDetail" target ON target."nBundledetailid" = relation."nBundledetailid"
            LEFT JOIN "BundleMaster" target_bundle ON target_bundle."nBundleid" = target."nBundleid"
            WHERE relation."nDocid" = d."nDocid"
        ) link ON true
        WHERE d."nDocid"::text IN (SELECT jsonb_array_elements_text(jDocIds))
        GROUP BY
            d."nDocid", d."nBundledetailid", dd."cType", bd."cPage", dd."nPage",
            dd."jOText", dd."jLinktype", bd."cTab", bm."cBundletag", bd."cExhibitno"
    ) t;

    OPEN ref FOR
    SELECT
        COALESCE(factlinks, '[]'::jsonb) AS factlinks,
        COALESCE(doclinks, '[]'::jsonb) AS doclinks;
    RETURN ref;
END;
$function$;
-- ---- end ----
COMMIT;
