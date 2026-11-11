-- 2026-11-13b_export_private_groups.up.sql
--
-- Why
-- ---
-- Owner, 2026-11-11 (plan 2026-11-11-private-group-colour-three-categories, Task 9): the Reader "Export with Marks" PDF
-- is filtered and coloured on the server. Next to the Fact Issues and QFact Issues picked today, the exporting user may
-- now also pick their OWN Private Analysis Groups.
--
-- What
-- ----
--   * public."ExportMaster"."jFGroup" jsonb NULL and "jQFGroup" jsonb NULL: the ids (text) of the Private Groups picked
--     for Full Facts ('F') and for QFacts ('QF'). Existing rows get NULL. NULL and [] both mean "no group picked".
--   * Two helpers (new):
--       et_export_has_private_groups(jFGroup, jQFGroup): true when either is a non-empty array ("group mode").
--       et_export_private_group(nFSid, actor, jFGroup, jQFGroup): in group mode, the actor's Private Group of the mark,
--         at most one row. Only when the mark is the actor's own (FactMaster.nUserid), the group is the actor's, not
--         deleted, in the mark's case, and the mark has no substantive Issue (2026-11-12b: a leftover membership on a
--         mark with a Team Issue does not count, as in et_workspace_private_groups). Columns: nGroupid, cName,
--         cColor = COALESCE(group colour, '7C5CFF'), bSelected = the group id is in jFGroup (an 'F' mark) or in
--         jQFGroup (a 'QF' mark). Another user's mark or group never yields a row.
--   * et_export_insert_data_1: also stores jFGroup and jQFGroup (as jFIssue: coalesce to []).
--   * et_export_get_data_1 (the Fact rows of "allfacts" and of the burned "highlights") and et_preview_document_list_1
--     ("factlinks"): in group mode a Fact / QFact row passes the filter when
--       - the mark is in one of the actor's groups (the helper returns a row): only if that group is picked
--         (bSelected). The Issue and Contact tests are not applied to it, so it never passes as Unassigned;
--       - otherwise: the existing Issue / Contact test, which group mode switches on (so with no Issue and no Contact
--         picked, only the marks of the picked groups pass).
--     A row that passed through a picked group gets the group colour: "highlights".color (get_data), "cColor"
--     (preview factlinks). Neither cursor has an Issue label column.
--   * et_annotation_index_rows: new optional inputs nMasterid and nExportid (the export service sends both). For a mark
--     in a group picked on that export (the export must be nMasterid's own): "cColor" = the group colour and
--     "issuelist" = [{nIssueid: null, cIssue: group name, cClr: group colour}].
--   * When jFGroup and jQFGroup are both NULL or [] (every existing export, every caller that does not send them) the
--     four functions answer exactly as before: no new output column, no changed value.
--   * Other users' marks: their groups are invisible to the actor, so they keep today's rules (a colleague's shared mark
--     in the colleague's group still passes as Unassigned, in Unassigned yellow).
--
-- Not changed (on purpose)
-- ------------------------
--   * The "factsheet" cursor of et_preview_document_list_1: the export service does not read it (the
--     generateAppendix(factslist) call in export-file.service.ts createIndexPages is commented out), its type test
--     compares FactDetail."cType" with 'F' / 'QF' (so with any Issue picked it is already empty), and it carries no group
--     data, so it cannot show a group name.
--   * DocLink and WebLink rows.
--
-- Copied bodies
-- -------------
-- Each function below is the newest body of that name found in this repository, copied verbatim (LF line ends, as
-- committed) with the group branch added; every line that differs from the source is a group addition. Each copy
-- starts with a "-- ---- from <file>, lines a-b ----" line. 2026-11-13b_export_private_groups.down.sql restores the same
-- source bodies. Compare them with the live bodies (pg_get_functiondef) before applying.
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
--   * Deploy order: the export service may be deployed before or after this script (the old functions ignore the new
--     keys; the new ones work without them). The Reader export dialog must not send group ids before this script is
--     applied: the old et_export_get_data_1 would read "groups only, no Issue" as "no filter" and burn every mark.
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

ALTER TABLE public."ExportMaster" ADD COLUMN IF NOT EXISTS "jFGroup" jsonb, ADD COLUMN IF NOT EXISTS "jQFGroup" jsonb;

-- IF NOT EXISTS above would let a pre-existing column of another shape through: assert the real shape.
DO $$ BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ExportMaster'
        AND column_name IN ('jFGroup', 'jQFGroup') AND data_type = 'jsonb' AND is_nullable = 'YES'
        AND column_default IS NULL) <> 2 THEN
    RAISE EXCEPTION 'ExportMaster.jFGroup / jQFGroup are missing or are not nullable jsonb without a default';
  END IF;
END $$;

-- Group mode: the export picked at least one Private Group (jFGroup or jQFGroup is a non-empty array). Anything that is
-- not an array (NULL, a scalar, an object) is "no group". No SET clause, so the planner can inline the helper into the
-- export queries; it uses built-in functions only.
CREATE OR REPLACE FUNCTION public.et_export_has_private_groups(fgroups jsonb, qfgroups jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN jsonb_typeof(fgroups) = 'array' THEN jsonb_array_length(fgroups) > 0 ELSE false END
      OR CASE WHEN jsonb_typeof(qfgroups) = 'array' THEN jsonb_array_length(qfgroups) > 0 ELSE false END
$$;

-- In group mode, the Private Group of mark fsid as the actor sees it: at most one row (FactPrivateGroup holds one row per
-- mark). The actor's own mark in the actor's own group, not deleted, in the mark's case, and only while the mark has no
-- substantive Issue (Team Issue and Private Group exclude each other). bSelected: the group is picked for the mark's
-- type. No SET clause, so the planner can inline it (every table and function it names is schema-qualified).
CREATE OR REPLACE FUNCTION public.et_export_private_group(fsid uuid, actor uuid, fgroups jsonb, qfgroups jsonb)
RETURNS TABLE("nGroupid" uuid, "cName" text, "cColor" text, "bSelected" boolean)
LANGUAGE sql STABLE AS $$
  SELECT g."nGroupid", g."cName", COALESCE(g."cColor", '7C5CFF')::text,
         COALESCE((CASE f."cFType" WHEN 'F' THEN fgroups WHEN 'QF' THEN qfgroups END) @> to_jsonb(g."nGroupid"::text), false)
  FROM public."FactMaster" f
  JOIN public."FactPrivateGroup" a ON a."nFSid" = f."nFSid"
  JOIN public."PrivateFactGroup" g ON g."nGroupid" = a."nGroupid"
  WHERE f."nFSid" = fsid AND f."nUserid" = actor
    AND g."nUserid" = actor AND g."nCaseid" = f."nCaseid" AND g."dDeletedDt" IS NULL
    AND public.et_export_has_private_groups(fgroups, qfgroups)
    AND NOT EXISTS (SELECT 1 FROM public."FMIssue" i WHERE i."nFSid" = f."nFSid"
                      AND NOT public.et_is_system_unassigned(i."nIssueid"))
$$;

-- ---- from 2026-07-08_export_team_marks.up.sql, lines 18-72, verbatim, plus the group branch ----
-- Group additions: declare + read jFGroup / jQFGroup; store both (coalesce to [], as jFIssue).
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
jFGroup jsonb;jQFGroup jsonb;
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
jPages := parameter->>'jPages';
bWeb := parameter ->>'bWeb';
jFiles := parameter ->>'jFiles';

	insert into "ExportMaster" ("nUserid","nCaseid","cType","dReqDt","cStatus","bPagination","bDoc","bFact","bQfact","bCoverpg","bFitpg",
							   "cDsize","cFsize","cQFsize","cOrientation","cPgsize","jFContact","jFIssue","jQFContact","jQFIssue","jPages","bWeb","bTeamMarks","jFGroup","jQFGroup")

	values(nMasterid,nCaseid,cType,now(),'P',bPagination,bDoc,bFact,bQfact,bCoverpg,bFitpg,
		  cDsize,cFsize,cQFsize,cOrientation,cPgsize,coalesce(jFContact,'[]'::jsonb),coalesce(jFIssue,'[]'::jsonb),
		  coalesce(jQFContact,'[]'::jsonb),coalesce(jQFIssue,'[]'::jsonb),jPages,bWeb,bTeamMarks,coalesce(jFGroup,'[]'::jsonb),coalesce(jQFGroup,'[]'::jsonb))
      RETURNING "nExportid" INTO nExportid;

	insert into "ExportDetail"("nExportid","nBDid")
	select distinct nExportid,NULLIF(t,'')::uuid from jsonb_array_elements_text(jFiles) t;

	open ref for select nExportid "nExportid";

RETURN ref;
    END;
$function$;
-- ---- end ----

-- ---- from 2026-07-08_export_team_marks.up.sql, lines 78-208, verbatim, plus the group branch ----
-- Group additions, in "allfacts" and in the Fact branch of "tbl": the lateral helper call pg; a mark the helper returns
-- passes only when pg."bSelected"; group mode switches the Issue / Contact filter on; tbl carries "cGroupColor" (the
-- group colour of a row that passed through a picked group, NULL otherwise; NULL in the DocLink / WebLink branches) and
-- the burned "color" is COALESCE("cGroupColor", annotations.color).
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
	case when pg."nGroupid" is not null then pg."bSelected" else (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) or public.et_export_has_private_groups(m."jFGroup", m."jQFGroup") then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) and fs."cFType"  =  'QF') or (  m."jFIssue" @> to_jsonb(fi."nIssueid"::text) and fs."cFType"  =  'F' )) when jsonb_array_length(m."jQFIssue") > 0 and  fs."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  fs."cFType"  =  'F' then m."jFIssue" @> to_jsonb(fi."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then ( (m."jQFContact" @> to_jsonb(fc."nContactid"::text)  and fs."cFType" = 'QF') or   (m."jFContact" @> to_jsonb(fc."nContactid"::text)  and fs."cFType" = 'F') ) when jsonb_array_length(m."jQFContact") > 0 and  fs."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  fs."cFType"  =  'F' then m."jFContact" @> to_jsonb(fc."nContactid"::text) else false end

	)
	else true end
	) end
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
	and case when pg."nGroupid" is not null then pg."bSelected" else (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) or public.et_export_has_private_groups(m."jFGroup", m."jQFGroup") then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) and f."cFType" = 'QF') or   (m."jFIssue" @> to_jsonb(fi."nIssueid"::text) and f."cFType" = 'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  f."cFType"  =  'F' then m."jFIssue" @> to_jsonb(fi."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then (( m."jQFContact" @> to_jsonb(fc."nContactid"::text) and  f."cFType" = 'QF') or   (m."jFContact" @> to_jsonb(fc."nContactid"::text)  and f."cFType" = 'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  f."cFType"  =  'F' then m."jFContact" @> to_jsonb(fc."nContactid"::text) else false end

	)
	else true end
	) end
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
-- filter rule as et_export_get_data_1; "cColor" is the group colour of a row that passed through a picked group.
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
	and	 case when pg."nGroupid" is not null then pg."bSelected" else (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) or public.et_export_has_private_groups(m."jFGroup", m."jQFGroup") then
	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then ( (m."jQFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cFType"  =  'QF') or  ( m."jFIssue" @> to_jsonb(i."nIssueid"::text) and f."cFType"  =  'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(i."nIssueid"::text)
	when jsonb_array_length(m."jFIssue") > 0 and  f."cFType"  =  'F' then m."jFIssue" @> to_jsonb(i."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then ( (m."jQFContact" @> to_jsonb(c."nContactid"::text) and  f."cFType"  =  'QF') or  ( m."jFContact" @> to_jsonb(c."nContactid"::text) and  f."cFType"  =  'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(c."nContactid"::text)
	when jsonb_array_length(m."jFContact") > 0 and  f."cFType"  =  'F' then m."jFContact" @> to_jsonb(c."nContactid"::text) else false end
	)
	else true end
	) end
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
-- own); the lateral helper call pg; for a mark in a picked group "cColor" is the group colour and "issuelist" is the
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
