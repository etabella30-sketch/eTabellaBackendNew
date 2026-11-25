-- 2026-11-15_export_private_groups_ticked_only.up.sql
--
-- Why
-- ---
-- Owner decisions of 2026-11-13 (plan 2026-11-12-private-issues-under-claims), on top of
-- 2026-11-14_private_issue_claim_multi.up.sql and 2026-11-14b_export_private_issues_mixed.up.sql (both live):
--   * "Groups affect which Marks export only when explicitly ticked" (review finding I1). Under 2026-11-14b the helper
--     et_export_private_groups_mark returns a row for the exporter's own Mark in one of the exporter's live groups as
--     soon as ANY group is ticked for the Mark's type, whether or not one of THAT Mark's groups is ticked (bSelected
--     false), and such a "private-only" row passes only through a ticked group. So with group Alpha and Unassigned
--     ticked for QFacts, the exporter's private-only QFact that sits only in the unticked group Beta is dropped from the
--     Reader PDF (2026-11-14b test X12). Now a Mark none of whose groups is ticked is treated exactly as a Mark with no
--     group.
--   * Both exports mirror the MarkNav pills: each TICKED Private Analysis Group is its own pill (lock icon, the group's
--     colour) after the Mark's Team Issue pills. 2026-11-14b sends the ticked names as ONE "issuelist" element
--     ("Alpha, Beta") with one colour; the export app cannot draw one pill per group from it.
--   * Review finding M4 (tie-break of "most recently added"): 2026-11-14b orders the colour pick by the membership's
--     "dCreateDt" DESC, "nGroupid" (ASC), while a Mark's membership list ends with the largest id. Now
--     "dCreateDt" DESC, "nGroupid" DESC, in the functions this script replaces only.
--
-- What
-- ----
--   * New helper et_export_private_groups_ticked(nFSid, actor, jFGroup, jQFGroup): LANGUAGE sql STABLE without a SET
--     clause (the planner can inline it), the membership join and privacy test of et_export_private_groups_mark. It
--     returns AT MOST ONE ROW per Mark, and a row ONLY when at least one of the Mark's groups is ticked for the Mark's
--     type (HAVING bool_or(ticked)); the Mark is the actor's own and the groups are the actor's own live groups of the
--     Mark's case:
--       bSelected  true (kept as a column so the callers read as before);
--       cColor     COALESCE(colour, '7C5CFF') of the most recently added ticked membership (ORDER BY the membership's
--                  "dCreateDt" DESC, "nGroupid" DESC);
--       bHasTeam   the Mark has a substantive Issue (an "FMIssue" row that is not the system Unassigned Issue);
--       jGroups    one element per ticked group, in the group-list order (lower("cName"), then "nGroupid"):
--                  {nIssueid: null, cIssue: <group name>, cClr: <COALESCE(colour, '7C5CFF')>, bPrivate: true}.
--     An unticked group of the Mark is read by the join only; it reaches no output column.
--   * The filter of et_export_get_data_1 (the Fact rows of "allfacts" and of the burned "highlights") and of
--     et_preview_document_list_1 ("factlinks") becomes
--       (pg."bSelected" is true or coalesce(<team rule>, <today's expression>))
--     - a Mark with a ticked group passes (as under 2026-11-14b), whatever its Issues;
--     - every other Mark (no group, or only unticked groups) passes or fails through the 2026-11-13b team rule /
--       today's expression exactly as a Mark with no group: through an Issue tick (the system Unassigned Issue too), a
--       Contact tick or "all Team Issues";
--     - bFTeam / bQFTeam false still means "only the ticked groups' Marks" for that type: et_export_team_rule answers
--       false for it, so a Mark without a ticked group is out. True or NULL: that type's other Marks are wanted too.
--   * Colour (rule unchanged): a Mark with a substantive Issue keeps the Team colour these functions return today; a
--     private-only Mark that passed through a ticked group gets cColor ("cGroupColor" in get_data, "cColor" in preview
--     and index). A Mark whose groups are not ticked is not private-only here: it keeps its stored colour.
--   * Index (et_annotation_index_rows, which does not filter) "issuelist": with a ticked group, the Mark's Issue
--     elements (only for a Mark with a substantive Issue, as 2026-11-14b) followed by jGroups; otherwise the Issue
--     elements as today. The Issue elements gain nothing (no "bPrivate" key), so every answer without a ticked group is
--     md5-equal to the 2026-11-14b answer.
--   * With no group ticked for a type (NULL or [] in jFGroup / jQFGroup) the helper returns no row for that type's
--     Marks, and the three functions answer exactly as under 2026-11-13b / 2026-11-14b.
--
-- The export app (apps/export) against this script
-- ------------------------------------------------
--   * The app deployed on 2026-11-13 reads only "cIssue" / "cClr" of "issuelist" (index row: the first element's name
--     under the passage, the first element's cClr as the row tone). It runs against this script without error. For a
--     Mark with a Team Issue it prints the first Issue as before; for a private-only Mark it prints the FIRST ticked
--     group's name in name order instead of the joined names ("Alpha" instead of "Alpha, Beta") and tones the index row
--     in that group's colour (the burned highlight keeps cColor, the most recently added ticked group).
--   * The export app committed with this script prints every element as a pill (bPrivate true: lock pill).
--
-- Privacy (unchanged from 2026-11-13b / 2026-11-14b)
-- --------------------------------------------------
--   * Only the actor's own Marks in the actor's own live (not deleted) groups of the Mark's case can be selected through
--     a group. Another user's Mark never gets a helper row and never carries a group: it follows the team rule and
--     today's expression like any Team Mark. Another user's group id, a deleted group's id or an unknown id in the
--     arrays selects nothing.
--   * A group's name and colour leave the database only when that group is ticked in this export (jGroups and cColor
--     aggregate the ticked groups only).
--   * et_annotation_index_rows reads the export's arrays only when the export is nMasterid's own (unchanged).
--
-- Not changed (on purpose)
-- ------------------------
--   * et_export_private_groups_mark (2026-11-14b) and et_export_private_group (2026-11-13b): left in place, no longer
--     called. CREATE OR REPLACE FUNCTION cannot change a function's output columns, and jGroups is a new column, so -
--     as 2026-11-14b did with et_export_private_group - a new helper is added and the old one is neither changed nor
--     dropped (an old body calling it keeps working while the rollback runs).
--   * et_export_insert_data_1, et_export_team_rule, et_export_nonempty_array; the 2026-11-14 functions (the
--     "assignments" order of et_workspace_private_groups keeps its tie-break; M4 is fixed in this script's helper only).
--   * The "factsheet" cursor of et_preview_document_list_1, the DocLink and WebLink rows (see 2026-11-13b).
--   * The request keys and cursor columns: no Nest change is needed for this script to run.
--
-- Drift guard
-- -----------
-- Before changing anything the script hashes the live bodies as md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) (as
-- 2026-11-13b, 2026-11-14 and 2026-11-14b do) and runs only when
--   * they are the 2026-11-14b bodies this script was written for and the new helper does not exist yet:
--       et_export_get_data_1           fa3f9ddcdaa972a223625e060a87684e  (2026-11-14b up, lines 196-328)
--       et_preview_document_list_1     83e6f1bebf65216106dc8509732661fb  (2026-11-14b up, lines 334-491)
--       et_annotation_index_rows       0b28d7598121e6ac4f84811251607f88  (2026-11-14b up, lines 498-590)
--       et_export_private_groups_mark  ec2d72152aacff217a94ee587f62e792  (2026-11-14b up, lines 170-188; not replaced)
--     These are the "already applied" hashes 2026-11-14b documents for its own bodies; or
--   * they are already this script's own bodies (a second run); it then says so and re-creates the same bodies, nothing
--     else changes, so a second run is a no-op:
--       et_export_get_data_1             1a934edbc4906ab5c912ca0575da833c
--       et_preview_document_list_1       7e7744b2b6c2cf816b6a98b6e82be3f4
--       et_annotation_index_rows         76380882d387dcd967d284972cb0be17
--       et_export_private_groups_ticked  0dee20b9cebf3f3869c015a141c0b7a9
--       (et_export_private_groups_mark   ec2d72152aacff217a94ee587f62e792, unchanged)
-- Any other combination is refused before anything is changed. The hashes were computed from the file text (no
-- database): prosrc is the text between the AS clause's dollar quotes; every run of space, tab, CR, LF, VT or FF becomes
-- one space; leading / trailing spaces are trimmed; md5 of the UTF-8 bytes. The same method reproduces the hashes written
-- in 2026-11-14b_export_private_issues_mixed.up.sql and .down.sql.
--
-- Copied bodies
-- -------------
-- Each replaced function below is the 2026-11-14b body, copied verbatim (LF line ends, as committed) with only the
-- changes listed in its "-- ---- from <file>, lines a-b ----" line; every other line is unchanged.
-- 2026-11-15_export_private_groups_ticked_only.down.sql restores the same 2026-11-14b bodies verbatim.
--
-- Rows
-- ----
-- This script deletes and changes no row and no column: CREATE OR REPLACE FUNCTION only. No DELETE, UPDATE, TRUNCATE
-- or DROP.
--
-- Safety
-- ------
--   * One transaction; the same database guard as 2026-10-09 to 2026-11-14b: etabella_tech_uuid only, unless the
--     session setting etabella.expected_database names another database.
--   * Needs 2026-11-14_private_issue_claim_multi.up.sql ("FactPrivateGroup"."dCreateDt") and
--     2026-11-14b_export_private_issues_mixed.up.sql applied (the drift guard refuses otherwise), and the 2026-11-13b
--     helpers et_export_team_rule and et_export_nonempty_array.
--   * lock_timeout 5 s as in the rest of the series; CREATE OR REPLACE FUNCTION takes no table lock.
--   * Cost: as under 2026-11-14b (one helper call per Mark row through a LATERAL join, reused for the filter, the colour
--     and the label); the extra jsonb_agg runs over the Mark's own memberships only.
--   * Deploy: the database first or the export app first, either order works (see "The export app" above).
--   * Rollback: 2026-11-15_export_private_groups_ticked_only.down.sql (not destructive: it restores the three
--     2026-11-14b bodies and drops only the helper added here). Roll it back before the 2026-11-14b rollback.
--
-- Verify: 2026-11-15_export_private_groups_ticked_only.test.sql, in a new scratch database only.
-- Run (after reading it, with the owner's approval of this exact operation), after 2026-11-14b:
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-15_export_private_groups_ticked_only.up.sql

BEGIN;
-- No table lock is taken here; the 5 s limit is the series' convention.
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for export ticked groups migration';
  END IF;
END $$;

-- Drift guard (see the header).
DO $$
DECLARE live jsonb := jsonb_build_object(
    'get', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_export_get_data_1(json,refcursor)')),
    'preview', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_preview_document_list_1(json,refcursor)')),
    'index', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_annotation_index_rows(json,refcursor)')),
    'mark', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_export_private_groups_mark(uuid,uuid,jsonb,jsonb)')),
    'helper', (SELECT md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) FROM pg_proc
                WHERE oid = to_regprocedure('public.et_export_private_groups_ticked(uuid,uuid,jsonb,jsonb)')));
BEGIN
  IF live->>'get' = 'fa3f9ddcdaa972a223625e060a87684e' AND live->>'preview' = '83e6f1bebf65216106dc8509732661fb'
     AND live->>'index' = '0b28d7598121e6ac4f84811251607f88' AND live->>'mark' = 'ec2d72152aacff217a94ee587f62e792' AND live->>'helper' IS NULL THEN
    NULL;  -- the 2026-11-14b bodies this script was written for
  ELSIF live->>'get' = '1a934edbc4906ab5c912ca0575da833c' AND live->>'preview' = '7e7744b2b6c2cf816b6a98b6e82be3f4'
     AND live->>'index' = '76380882d387dcd967d284972cb0be17' AND live->>'mark' = 'ec2d72152aacff217a94ee587f62e792' AND live->>'helper' = '0dee20b9cebf3f3869c015a141c0b7a9' THEN
    RAISE NOTICE 'export ticked groups: already applied; the same bodies are created again (no change)';
  ELSE
    RAISE EXCEPTION 'Drift: the live export function bodies are not the ones this script was written for: %', live;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'FactPrivateGroup'
                   AND column_name = 'dCreateDt' AND data_type = 'timestamp with time zone') THEN
    RAISE EXCEPTION 'public."FactPrivateGroup"."dCreateDt" (timestamptz) is missing: apply 2026-11-14_private_issue_claim_multi.up.sql first';
  END IF;
  IF to_regprocedure('public.et_export_nonempty_array(jsonb)') IS NULL
     OR to_regprocedure('public.et_export_team_rule(text,jsonb,jsonb,boolean,boolean,jsonb,jsonb,jsonb,jsonb)') IS NULL
     OR to_regprocedure('public.et_is_system_unassigned(uuid)') IS NULL THEN
    RAISE EXCEPTION 'et_export_nonempty_array, et_export_team_rule or et_is_system_unassigned is missing: apply 2026-11-13b_export_private_groups.up.sql first';
  END IF;
END $$;

-- ---- new; the membership join and privacy test are 2026-11-14b_export_private_issues_mixed.up.sql lines 178-186 ----
-- One row at most per Mark, and only when one of its groups is ticked (see the header). "dCreateDt" is the
-- membership's (FactPrivateGroup), not the group's.
CREATE OR REPLACE FUNCTION public.et_export_private_groups_ticked(fsid uuid, actor uuid, fgroups jsonb, qfgroups jsonb)
RETURNS TABLE("bSelected" boolean, "cColor" text, "bHasTeam" boolean, "jGroups" jsonb)
LANGUAGE sql STABLE AS $$
  SELECT bool_or(s.ticked),
         (array_agg(s."cColor" ORDER BY s."dCreateDt" DESC, s."nGroupid" DESC) FILTER (WHERE s.ticked))[1],
         EXISTS (SELECT 1 FROM public."FMIssue" i WHERE i."nFSid" = fsid
                   AND NOT public.et_is_system_unassigned(i."nIssueid")),
         jsonb_agg(jsonb_build_object('nIssueid', NULL, 'cIssue', s."cName", 'cClr', s."cColor", 'bPrivate', true)
                   ORDER BY lower(s."cName"), s."nGroupid") FILTER (WHERE s.ticked)
  FROM (SELECT g."nGroupid", g."cName", COALESCE(g."cColor", '7C5CFF')::text AS "cColor", a."dCreateDt",
               EXISTS (SELECT 1 FROM jsonb_array_elements_text(t.picked) p WHERE lower(p) = g."nGroupid"::text) AS ticked
        FROM public."FactMaster" f
        CROSS JOIN LATERAL (SELECT CASE f."cFType" WHEN 'F' THEN fgroups WHEN 'QF' THEN qfgroups END AS picked) t
        JOIN public."FactPrivateGroup" a ON a."nFSid" = f."nFSid"
        JOIN public."PrivateFactGroup" g ON g."nGroupid" = a."nGroupid"
        WHERE f."nFSid" = fsid AND f."nUserid" = actor
          AND g."nUserid" = actor AND g."nCaseid" = f."nCaseid" AND g."dDeletedDt" IS NULL
          AND public.et_export_nonempty_array(t.picked)) s
  HAVING bool_or(s.ticked)
$$;
-- ---- end ----

-- ---- from 2026-11-14b_export_private_issues_mixed.up.sql, lines 196-328, verbatim, plus the ticked-only rule ----
-- Changes, in "allfacts" and in the Fact branch of "tbl": the lateral call is et_export_private_groups_ticked; the filter
-- "case when pg."bSelected" is not null and not pg."bHasTeam" then pg."bSelected" else pg."bSelected" is true or
-- coalesce(...) end" becomes "(pg."bSelected" is true or coalesce(...))" (the closing ")) end" becomes ")))").
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
left join lateral public.et_export_private_groups_ticked(fs."nFSid", nUserid, m."jFGroup", m."jQFGroup") pg on true
where "nCreateId" = nUserid and  fs."nBundledetailid" = bd."nBundledetailid"
	and
	(pg."bSelected" is true or coalesce(public.et_export_team_rule(fs."cFType", m."jFGroup", m."jQFGroup", m."bFTeam", m."bQFTeam", m."jFIssue", m."jQFIssue", m."jFContact", m."jQFContact"), (case when
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
	)))
group by "nBundledetailid"
) f on true
left join lateral(
with tbl as (
	select distinct f."nFSid" as id,f."nFSid",null::uuid as "nDocid",null::uuid as "nWebid",coalesce("cFType",'F') as "linktype",case when pg."bSelected" and not pg."bHasTeam" then pg."cColor" end as "cGroupColor"
	from "FactMaster" f
	left join "FMIssue" fi on fi."nFSid"  = f."nFSid"
	left join "FMContact" fc on fc."nFSid"  = f."nFSid"
	left join lateral public.et_export_private_groups_ticked(f."nFSid", nUserid, m."jFGroup", m."jQFGroup") pg on true
	where case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and ( f."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "FMShared" s where s."nFSid" = f."nFSid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = f."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and f."nBundledetailid" = bd."nBundledetailid"
	and (pg."bSelected" is true or coalesce(public.et_export_team_rule(f."cFType", m."jFGroup", m."jQFGroup", m."bFTeam", m."bQFTeam", m."jFIssue", m."jQFIssue", m."jFContact", m."jQFContact"), (case when
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
	)))
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

-- ---- from 2026-11-14b_export_private_issues_mixed.up.sql, lines 334-491, verbatim, plus the ticked-only rule ----
-- Changes, in "factlinks" only: the lateral call is et_export_private_groups_ticked; the same filter change as in
-- et_export_get_data_1.
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
	  select f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage", fd."nPage" as "nPage", case when pg."bSelected" and not pg."bHasTeam" then pg."cColor" else clr."cColor" end as "cColor", null as "text", "jOT" as "jTexts", false as "isHighlight", fd."jLinktype",
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
	  left join lateral public.et_export_private_groups_ticked(f."nFSid", nUserid, m."jFGroup", m."jQFGroup") pg on true
	  where f."nUserid" = nUserid and f."nBundledetailid" = nBundledetailid and
	   case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and	 (pg."bSelected" is true or coalesce(public.et_export_team_rule(f."cFType", m."jFGroup", m."jQFGroup", m."bFTeam", m."bQFTeam", m."jFIssue", m."jQFIssue", m."jFContact", m."jQFContact"), (case when
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
	)))
	  group by f."nFSid", f."nBundledetailid", fd."cType", fd."jLinktype", "jOT", bd."cPage", fd."nPage", clr."cColor", bd."cTab", bm."cBundletag", bd."cExhibitno", pg."bSelected", pg."bHasTeam", pg."cColor"
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

-- ---- from 2026-11-14b_export_private_issues_mixed.up.sql, lines 498-590, verbatim, plus one element per group ----
-- Changes: the lateral call is et_export_private_groups_ticked; the group element
-- "jsonb_build_array(jsonb_build_object('nIssueid', NULL, 'cIssue', pg."cName", 'cClr', pg."cColor"))" becomes
-- pg."jGroups"; pg."cName" in the GROUP BY becomes pg."jGroups".
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
            bd."cPage", fd."nPage", CASE WHEN pg."bSelected" AND NOT pg."bHasTeam" THEN pg."cColor" ELSE clr."cColor" END AS "cColor", NULL::text AS "text",
            fd."jOT" AS "jTexts", false AS "isHighlight", fd."jLinktype",
            bd."cTab", bm."cBundletag", bd."cExhibitno",
            CASE WHEN pg."bSelected" THEN CASE WHEN pg."bHasTeam" THEN COALESCE(issue."issuelist", '[]'::jsonb) ELSE '[]'::jsonb END || pg."jGroups" ELSE issue."issuelist" END AS "issuelist",
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
        LEFT JOIN LATERAL public.et_export_private_groups_ticked(f."nFSid", nMasterid, jFGroup, jQFGroup) pg ON true
        WHERE f."nFSid"::text IN (SELECT jsonb_array_elements_text(jFactIds))
        GROUP BY
            f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage",
            fd."nPage", clr."cColor", fd."jOT", fd."jLinktype", bd."cTab",
            bm."cBundletag", bd."cExhibitno", issue."issuelist", pg."bSelected", pg."bHasTeam", pg."jGroups", pg."cColor"
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
