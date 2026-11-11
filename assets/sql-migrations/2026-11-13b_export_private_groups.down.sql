-- 2026-11-13b_export_private_groups.down.sql
--
-- Rollback of 2026-11-13b_export_private_groups.up.sql.
-- DESTRUCTIVE: drops ExportMaster."jFGroup", "jQFGroup", "bFTeam" and "bQFTeam", which discards the Private Groups and
-- Team flags picked for the exports made since the up. No row is deleted, but that data cannot be recovered after the
-- DROP unless it was saved first: see the commented backup step before the DROP (needs owner approval). A retry of such
-- an export after this rollback runs the old rules without its groups: one made with groups only (no Issue picked)
-- would then burn every visible mark.
--
-- Restores et_export_insert_data_1, et_export_get_data_1, et_preview_document_list_1 and et_annotation_index_rows to
-- the bodies the up script started from, copied verbatim (LF line ends, as committed) from the files named in each
-- "-- ---- from" line. The functions are restored first, so nothing calls the helpers or reads the columns when they go;
-- then the three helpers et_export_private_group, et_export_team_rule and et_export_nonempty_array are dropped, then the
-- four columns.
--
-- et_preview_document_list_1 is restored to the 2026-07-08 file text. The live body before the up may differ from it
-- in comments only (the up's drift guard accepts both: the 2026-09-15 catalog dump has the same code with other
-- comments). The exact pre-migration copy of all four bodies is the pg_get_functiondef output saved by the read-only
-- pre-apply check; restore from that copy instead when it differs from the text below.
--
-- Safety: one transaction; the same database guard as the up script (etabella_tech_uuid only, unless the session
-- setting etabella.expected_database names another database). Dropping the columns is a catalogue change.
-- Run (after reading it, with the owner's approval of this exact operation):
--   psql ... -d etabella_tech_uuid -v ON_ERROR_STOP=1 -f 2026-11-13b_export_private_groups.down.sql

BEGIN;
-- DROP COLUMN takes ACCESS EXCLUSIVE on "ExportMaster": give up after 5 s instead of queueing.
SET LOCAL lock_timeout = '5s';
DO $$ BEGIN
  IF current_database() <> COALESCE(NULLIF(current_setting('etabella.expected_database', true), ''), 'etabella_tech_uuid') THEN
    RAISE EXCEPTION 'Wrong database for export Private Groups rollback';
  END IF;
END $$;

-- ---- from 2026-07-08_export_team_marks.up.sql, lines 18-72, verbatim ----
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
jPages := parameter->>'jPages';
bWeb := parameter ->>'bWeb';
jFiles := parameter ->>'jFiles';

	insert into "ExportMaster" ("nUserid","nCaseid","cType","dReqDt","cStatus","bPagination","bDoc","bFact","bQfact","bCoverpg","bFitpg",
							   "cDsize","cFsize","cQFsize","cOrientation","cPgsize","jFContact","jFIssue","jQFContact","jQFIssue","jPages","bWeb","bTeamMarks")

	values(nMasterid,nCaseid,cType,now(),'P',bPagination,bDoc,bFact,bQfact,bCoverpg,bFitpg,
		  cDsize,cFsize,cQFsize,cOrientation,cPgsize,coalesce(jFContact,'[]'::jsonb),coalesce(jFIssue,'[]'::jsonb),
		  coalesce(jQFContact,'[]'::jsonb),coalesce(jQFIssue,'[]'::jsonb),jPages,bWeb,bTeamMarks)
      RETURNING "nExportid" INTO nExportid;

	insert into "ExportDetail"("nExportid","nBDid")
	select distinct nExportid,NULLIF(t,'')::uuid from jsonb_array_elements_text(jFiles) t;

	open ref for select nExportid "nExportid";

RETURN ref;
    END;
$function$;
-- ---- end ----

-- ---- from 2026-07-08_export_team_marks.up.sql, lines 78-208, verbatim ----
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
where "nCreateId" = nUserid and  fs."nBundledetailid" = bd."nBundledetailid"
	and
	(case when
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
	)
group by "nBundledetailid"
) f on true
left join lateral(
with tbl as (
	select distinct f."nFSid" as id,f."nFSid",null::uuid as "nDocid",null::uuid as "nWebid",coalesce("cFType",'F') as "linktype"
	from "FactMaster" f
	left join "FMIssue" fi on fi."nFSid"  = f."nFSid"
	left join "FMContact" fc on fc."nFSid"  = f."nFSid"
	where case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and ( f."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "FMShared" s where s."nFSid" = f."nFSid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = f."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and f."nBundledetailid" = bd."nBundledetailid"
	and (case when
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
	)
	union all
	select "nDocid" as id ,null::uuid as  "nFSid",null::uuid as  "nWebid", "nDocid",'D' as "linktype"
	from "DocMaster" d
	where  m."bDoc" = true
	and ( d."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "DMShared" s where s."nDocid" = d."nDocid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = d."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and d."nBundledetailid" = bd."nBundledetailid"
	union all
	select "nWebid" as id ,null::uuid "nFSid",null::uuid "nDocid","nWebid",'W' as "linktype"
	from "WebMaster" d
	where m."bWeb" = true
	and ( d."nUserid" = nUserid
	      or ( m."bTeamMarks" = true and (
	           exists(select 1 from "WMShared" s where s."nWebid" = d."nWebid" and s."nUserid" = nUserid)
	           or (coalesce(isAdmin,false) and exists(select 1 from "TeamRelation" tr where tr."nTeamid" = nTeamid and tr."nUserid" = d."nUserid" and tr."nCaseid" = nCaseid))
	      ) ) )
	and d."nBundledetailid" = bd."nBundledetailid"
) select t.id,a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",a."nFSid",a."nDocid", a."nWebid", t."linktype"
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

-- ---- from 2026-07-08_index_sp_page_color.up.sql, lines 13-169, verbatim ----
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
	  select f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage", fd."nPage" as "nPage", clr."cColor" as "cColor", null as "text", "jOT" as "jTexts", false as "isHighlight", fd."jLinktype",
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
	  where f."nUserid" = nUserid and f."nBundledetailid" = nBundledetailid and
	   case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and	 (case when
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
	)
	  group by f."nFSid", f."nBundledetailid", fd."cType", fd."jLinktype", "jOT", bd."cPage", fd."nPage", clr."cColor", bd."cTab", bm."cBundletag", bd."cExhibitno"
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

-- ---- from 2026-07-20_annotation_index_team_marks.up.sql, lines 6-91, verbatim ----
CREATE OR REPLACE FUNCTION public.et_annotation_index_rows(parameter json, ref refcursor)
RETURNS refcursor
LANGUAGE plpgsql
AS $function$
DECLARE
    jFactIds jsonb := COALESCE(NULLIF(parameter->>'jFactIds', '')::jsonb, '[]'::jsonb);
    jDocIds  jsonb := COALESCE(NULLIF(parameter->>'jDocIds', '')::jsonb, '[]'::jsonb);
    factlinks jsonb;
    doclinks jsonb;
BEGIN
    SELECT jsonb_agg(t ORDER BY t."nPage", t."nFSid") INTO factlinks
    FROM (
        SELECT
            f."nFSid", f."nBundledetailid", f."cFType", fd."cType",
            bd."cPage", fd."nPage", clr."cColor", NULL::text AS "text",
            fd."jOT" AS "jTexts", false AS "isHighlight", fd."jLinktype",
            bd."cTab", bm."cBundletag", bd."cExhibitno",
            issue."issuelist",
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
        WHERE f."nFSid"::text IN (SELECT jsonb_array_elements_text(jFactIds))
        GROUP BY
            f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage",
            fd."nPage", clr."cColor", fd."jOT", fd."jLinktype", bd."cTab",
            bm."cBundletag", bd."cExhibitno", issue."issuelist"
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

DROP FUNCTION IF EXISTS public.et_export_private_group(uuid, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.et_export_team_rule(text, jsonb, jsonb, boolean, boolean, jsonb, jsonb, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.et_export_nonempty_array(jsonb);

-- Backup step (run it BEFORE this script, in its own psql session, only if the picked groups and flags should be kept;
-- psql meta-command):
--   \copy (SELECT "nExportid","jFGroup","jQFGroup","bFTeam","bQFTeam" FROM public."ExportMaster" WHERE "jFGroup" IS NOT NULL OR "jQFGroup" IS NOT NULL OR "bFTeam" IS NOT NULL OR "bQFTeam" IS NOT NULL) TO '<file>.csv' CSV
-- To restore after re-running 2026-11-13b_export_private_groups.up.sql: load the CSV into a scratch table and
--   UPDATE public."ExportMaster" m SET "jFGroup" = s."jFGroup", "jQFGroup" = s."jQFGroup", "bFTeam" = s."bFTeam", "bQFTeam" = s."bQFTeam" FROM <scratch table> s WHERE m."nExportid" = s."nExportid";
-- (that UPDATE is itself a data change: ask the owner for approval first).
ALTER TABLE public."ExportMaster" DROP COLUMN IF EXISTS "jFGroup", DROP COLUMN IF EXISTS "jQFGroup",
  DROP COLUMN IF EXISTS "bFTeam", DROP COLUMN IF EXISTS "bQFTeam";
COMMIT;
