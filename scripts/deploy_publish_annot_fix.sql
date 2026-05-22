-- ============================================================================
-- Deployment script: full DB migration for the May 2026 RT/publish fixes.
-- ============================================================================
--
-- Single-transaction full deploy: schema change + SP redeploys + data
-- backfills in one go. If anything fails the entire transaction rolls back
-- and the database is left exactly as it was — no half-migrated state
-- possible.
--
-- Bundles the work from these 5 fix areas into one runnable script:
--   A. "Annotation page/line not updated after transcript publish"
--   B. "Admin 'Published' button forgot to set cStatus='P'"
--   C. "Upload-published sessions stuck at cStatus='C'"
--   D. "New facts on published view invisible (orphan-filter regression)"
--   E. "Bundle column hide per-case (CaseMaster.bHideBundleColumn)"
--
-- What this script does (all inside one BEGIN/COMMIT):
--   PART 1 — schema (DDL):
--              - ADD COLUMN CaseMaster.bHideBundleColumn (boolean, default false)
--   PART 2 — re-create 8 stored procedures:
--              - realtime.et_navigate_get_all         (read; CASE on bIsTranscipt)
--              - realtime.et_marknav_doclinks         (read; CASE on bIsTranscipt)
--              - realtime.et_factsheet_detail         (read; CASE on bIsTranscipt)
--              - realtime.et_navigate_factlist        (read; CASE on bIsTranscipt)
--              - realtime.et_fact_get_detail_single   (read; CASE on bIsTranscipt)
--              - realtime.et_navigate_facts_bycompany (read; CASE on bIsTranscipt)
--              - transcript.et_transcript_publish     (writer; sets cStatus='P')
--              - public.et_admin_case_getdetail       (returns bHideBundleColumn)
--   PART 3 — sanity check that all 8 SPs compiled.
--   PART 4 — backfill data (idempotent; re-running hits 0 rows):
--              - Step 1a: FactDetail.nTLine from jTCordinates[0].l
--              - Step 1b: DocDetail.nTLine  from jTCordinates[0].l
--              - Step 2 : RSessionMaster.cStatus = 'P' for upload-published
--                         stragglers (isTranscript+isUploaded but cStatus<>'P')
--              - Step 3a: FactDetail seed for facts created on published
--                         sessions but never seeded (jTCordinates IS NULL)
--              - Step 3b: DocDetail equivalent of step 3a
--   PART 5 — sanity counters confirming no rows are still in the broken state.
--
-- Why et_transcript_publish is in here:
--   The admin "Published" button (Transcript Import → File menu → Published)
--   calls this SP. The previous deployed version forgot to set cStatus='P'
--   alongside isTranscript/isUploaded, leaving the session in a half-
--   published state where the backend's narrow "is published" check
--   (cStatus='P') skipped the new-fact seeding helper. Without this SP
--   redeploy, the application-side fix to markAsTranscriptIfPublished is
--   only defensive — new sessions still need this SP to mark them
--   correctly so analytics, future SP authors, and any other narrow
--   cStatus='P' checks all see consistent data.
--
-- Why et_admin_case_getdetail is in here:
--   Returns the new bHideBundleColumn column to the frontend so the
--   per-case Bundle-column suppression takes effect. The new column
--   from PART 1 must be added before this SP runs (column reference in
--   the SELECT list); single transaction handles ordering.
--
-- How to run:
--   psql -h <host> -U <user> -d <db> -v ON_ERROR_STOP=1 -f scripts/deploy_publish_annot_fix.sql
--
-- Safety:
--   * Single transaction — if any DDL/SP/DML fails, the whole script rolls
--     back. Combine with `-v ON_ERROR_STOP=1` so psql aborts on the first
--     error rather than continuing past it.
--   * Schema change uses IF NOT EXISTS — re-runs are no-ops.
--   * SP redeploys use CREATE OR REPLACE — existing GRANTs and dependent
--     objects preserved.
--   * Backfills are gated on the broken-state predicate — re-running hits
--     0 rows.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1 — Schema (DDL)
-- ============================================================================

-- 1.1  CaseMaster.bHideBundleColumn — per-case flag that hides the "Bundle"
--      column from the Evidence file table AND from the column-picker
--      dropdown. Defaults to false so existing behaviour is unchanged on
--      every case until an admin explicitly flips it. Read by the patched
--      et_admin_case_getdetail SP in PART 2 below; consumed by the frontend
--      file-explorer + files components (deep-clones reqcols and overrides
--      bundle.view when true).
ALTER TABLE "CaseMaster"
  ADD COLUMN IF NOT EXISTS "bHideBundleColumn" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "CaseMaster"."bHideBundleColumn" IS
  'When true, the file-explorer evidence/bundle table for this case hides the "Bundle" column AND suppresses it from the column-picker dropdown. Per-case UI override; defaults to false.';


-- ============================================================================
-- PART 2 — Stored procedures (CREATE OR REPLACE × 8)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1/8  realtime.et_navigate_get_all
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION realtime.et_navigate_get_all(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
	nID uuid;

    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
	cSortby text;
	perPage int := 10;
	pageNumber int;
    offsetCount int;
	jFilter jsonb;
	sql_query TEXT;
	sql_query_doc_links TEXT;
	sql_query_qm TEXT;
	filter_string text default null;
    filter_string_doc_links text default null;
	filter_string_q_mark text default null;
	factids jsonb;
    docids jsonb;
	bIsTranscipt boolean default false;
	historyEnabled boolean;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	-- fga_factids jsonb;



BEGIN
    -- Extract parameters
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := parameter ->>'jFilter';
	-- jFilter := parameter -> 'jFilter';  -- returns jsonb directly
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;
	-- fga_factids := parameter->>'jFactids';

	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

	historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	-- create a temp table to dump data from history_marknav

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

 if(nBundledetailid is not null) then
 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
 else
 -- select * from "RSessionMaster" where "nSesid" = '3695e05a-b8bf-4b13-9e80-f38b10bf7cf1';
	select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
 end if;

select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
-- raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
	isAdmin := true;
end if;


	DROP TABLE IF EXISTS temp_history_marknav;
  IF historyEnabled THEN

	CREATE TEMP TABLE temp_history_marknav ON COMMIT DROP AS
	SELECT *
	FROM realtime.history_marknav(
	nSesid,
	nBundledetailid,
	nMasterid,
	'ALL',
	1
	);

  END IF;


	sql_query := '
	 SELECT jsonb_agg(distinct f."nFSid")
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
	left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
	LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
	LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
	LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
	 '|| (case when historyEnabled = true then
	'join temp_history_marknav his on his."id" = f."nFSid" '
	else '' end
	) ||'
	WHERE (f."nSesid" = ' || quote_nullable(nSesid) || '
		OR f."nBundledetailid" = ' || quote_nullable(nBundledetailid) || ')
	AND (f."nUserid" = ' || quote_nullable(nMasterid) || '
	OR s."nUserid" = ' || quote_nullable(nMasterid) || '
	or (case when ''' || isAdmin || '''::boolean = true then  f."nUserid" = tr."nUserid" else false end))';

	--or ('''|| coalesce(fga_factids,'[]')::text || ''')::jsonb @> to_jsonb(f."nFSid")
	-- IF jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
	IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN

    sql_query := sql_query || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                        ' || quote_nullable(nID) || ',
                                        ' || quote_nullable(nMasterid) || ',
                                        ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
          WHERE t."id" = f."nFSid"
      )';
END IF;

RAISE NOTICE 'Fact SQL: %', sql_query;
EXECUTE sql_query INTO factids;

RAISE NOTICE 'Fact SQL Result: %', factids;

IF factids IS NULL THEN
    factids := '[]'::jsonb;
END IF;
/*IF (coalesce(historyEnabled,false) = false) THEN
factids := coalesce(fga_factids, '[]'::jsonb) || coalesce(factids, '[]'::jsonb);
END IF;*/

sql_query_doc_links := '
				SELECT jsonb_agg(DISTINCT m."nDocid")
				FROM "DocMaster"  m
				JOIN "DocDetail"  d  ON d."nDocid" = m."nDocid"
				left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
				LEFT JOIN "DMLinks"  l  ON l."nDocid" = m."nDocid"
				LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
				'|| (case when historyEnabled = true then
				'join temp_history_marknav his on his."id" = m."nDocid" '
				else '' end
				) ||'
				WHERE
						(m."nUserid" = ' || quote_nullable(nMasterid) || '
					OR  ds."nUserid" = ' || quote_nullable(nMasterid) || '
	or (case when ''' || isAdmin || '''::boolean = true then  m."nUserid" = tr."nUserid" else false end))
					AND (m."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
					OR  m."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
					';

				-- Append filter only if jFilter is a non-empty object
				IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
				sql_query_doc_links := sql_query_doc_links || '
					AND EXISTS (
					SELECT 1
					FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
													' || quote_nullable(nID) || ',
													' || quote_nullable(nMasterid) || ',
													''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
					WHERE t."id" = m."nDocid"
					)';
				END IF;

-- Execute and capture into docids (jsonb)
RAISE NOTICE 'Fact SQL: %', sql_query_doc_links;
EXECUTE sql_query_doc_links INTO docids;
RAISE NOTICE 'docids: %', docids;
-- Normalize to empty array when no rows
IF docids IS NULL THEN
  docids := '[]'::jsonb;
END IF;

-- Build dynamic SQL for QM
sql_query_qm := '
    SELECT
        ''QM'' AS "cSource",
        rh."nHid" as "id",
        null::uuid as "nFSid",
        rh."dCreatedt" AS "dCreateDt",
        um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby",
        NULL::text AS "cType",
		NULL::uuid AS "nBundledetailid",
        NULL::jsonb AS "jLinktype",
        NULL::jsonb AS "jTexts",
		NULL::jsonb AS "jOT",
        NULL::jsonb AS "jCordinates",
        (CASE WHEN '|| bIsTranscipt ||' THEN rh."cTPageno" ELSE rh."cPageno" END)::int AS "nPage",
        (CASE WHEN '|| bIsTranscipt ||' THEN rh."cTLineno" ELSE rh."cLineno" END)::int AS "nLine",
		(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTTime" ELSE rh."cTime" END) AS "cTime",
        NULL::text AS "cColor",
        NULL::jsonb AS "jDate",
        NULL::jsonb AS list,
        rh."nUserid",
		null::bigint as "t_shared",
		null::bigint as "t_tasks",
		null::bigint as "t_contact",
		null::bigint as "total"
    FROM "RHighlights" rh
    JOIN "UserMaster" um ON um."nUserid" = rh."nUserid" '
    || (CASE WHEN historyEnabled THEN
        ' JOIN temp_history_marknav his ON his."id" = rh."nHid" '
       ELSE '' END) || '
    WHERE rh."nUserid" = ' || quote_nullable(nMasterid) || '
      AND rh."nSessionId" = ' || quote_nullable(nSesid);

-- Append filter only if jFilter present
IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
    sql_query_qm := sql_query_qm || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                        ' || quote_nullable(nID) || ',
                                        ' || quote_nullable(nMasterid) || ',
                                        ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
          WHERE t."id" = rh."nHid"
      )';
END IF;

DROP TABLE IF EXISTS qmarktable;
 EXECUTE 'CREATE TEMP TABLE qmarktable ON COMMIT DROP AS ' || sql_query_qm;

OPEN ref1 FOR
		with links as (
		    select 	l."nDocid",l."nDMLids" ,l."jLinktype",l."nBundledetailid",d.*
			from "DMLinks" l
			join bundlesource d on d."nBundledetailid" = l."nBundledetailid"
			where docids @> to_jsonb(l."nDocid")
		),
		 combined_results AS (
		SELECT distinct
			case when f."cFType" = 'F' then 'F' else 'QF' end as "cSource",
		    f."nFSid"::uuid as "id",
			f."nFSid",
		    f."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts" AS "jTexts",
			fd."jOT",
			fd."jCordinates",
			-- CASE on bIsTranscipt so the published view picks up the
			-- nTPage/nTLine values written by run3.py during transferAnnotations.
			-- Mirrors the canonical pattern in et_marks.sql:57-58 for RHighlights.
			CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
			CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTLine" ELSE fd."nLine" END AS "nLine",
			null as "cTime",
		   cl."cColor" AS "cColor",
		    fd."jDate",
			null::jsonb as list,
			f."nUserid",
			count(fs."nFMSdid") as "t_shared",
			count(ft."nFMTsid") as "t_tasks",
			count(fc."nFMCid") as "t_contact",
			cmt."total" as "t_comments"
		FROM "FactMaster" f
		JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		left join "FMTasks" ft on ft."nFSid" = f."nFSid"
		left join "FMContact" fc on fc."nFSid" = f."nFSid"
		LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'nValue')::int
		left join realtime."comments" cmt on cmt."nFSid" = f."nFSid"
 		WHERE (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
		   and factids @> to_jsonb(f."nFSid")
		   -- Orphan filter: on the published view, suppress facts whose
		   -- annotation could not be re-anchored (run3.py stamped 'O' and
		   -- cleared jTCordinates). Mirrors et_marks.sql:48-50.
		   AND (
		     COALESCE(bIsTranscipt, false) = false
		     OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
		   )
		   group by f."cFType", f."nFSid",  um."cFname",um."cLname",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts",
			fd."jOT",
			fd."jCordinates",
			fd."nPage", fd."nTPage",
			fd."nLine", fd."nTLine",
			 cl."cColor",
		    fd."jDate",
			f."nUserid",
			cmt."total"

		UNION ALL
		SELECT
		    'D' AS "cSource",
			m."nDocid"::uuid as "id",
		    m."nDocid"::uuid,
		   m."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    dd."cType",
			m."nBundledetailid",
		    dd."jLinktype",
		    dd."jTexts" AS "jText",
			dd."jOText" as "jOT",
			dd."jCordinates",
			-- Same CASE pattern as the FactDetail arm above; published view
			-- reads the transferred coords from nTPage/nTLine.
			CASE WHEN COALESCE(bIsTranscipt,false) THEN dd."nTPage" ELSE dd."nPage" END AS "nPage",
			CASE WHEN COALESCE(bIsTranscipt,false) THEN dd."nTLine" ELSE dd."nLine" END AS "nLine",
			null as "cTime",
			null "cColor",
			null "jDate",
			jsonb_agg(distinct l.*) as list,
			m."nUserid",
			count(ds."nDMSid") as "t_shared",
			null::bigint as "t_tasks",
			null::bigint as "t_contact",
			cmt."total" as "t_comments"
		  FROM "DocMaster" m
		  JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
		  JOIN "DocDetail" dd ON dd."nDocid" = m."nDocid"
		  JOIN "links" l ON l."nDocid" = m."nDocid"
		  LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
		  left join realtime."comments" cmt on cmt."nDocid" = m."nDocid"
		  where  (m."nSesid" = nSesid OR m."nBundledetailid" = nBundledetailid)
		  and docids @> to_jsonb(m."nDocid")
		  -- Orphan filter for the doc-link arm; same rationale as the FactDetail
		  -- WHERE above.
		  AND (
		    COALESCE(bIsTranscipt, false) = false
		    OR (dd."cTransferStatus" IS DISTINCT FROM 'O' AND dd."jTCordinates" IS NOT NULL)
		  )
		  group by m."nDocid", m."dCreateDt",um."cFname",um."cLname", dd."cType",
		  m."nBundledetailid" ,dd."jLinktype",dd."jTexts",dd."jOText" ,dd."jCordinates",
		  dd."nPage", dd."nTPage", dd."nLine", dd."nTLine", cmt."total"

		union all
		 select  *	from qmarktable
		)
		SELECT * FROM combined_results
		ORDER BY
			CASE WHEN cSortby = 'asc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END ASC,
			CASE WHEN cSortby = 'desc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END DESC,
			CASE WHEN cSortby = 'asc' THEN "dCreateDt" END ASC,
			CASE WHEN cSortby = 'desc' THEN "dCreateDt" END DESC;
			-- ,"dCreateDt" DESC;

	OPEN ref2 FOR
    SELECT jsonb_agg(f."nFSid") AS "jFSids",
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor",
           rl."cCodename" AS "cRelevance",
           impct."cCodename" AS "cImpact"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid"
    LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid"
	  WHERE  (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid) and factids @> to_jsonb(f."nFSid")
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";

OPEN ref3 FOR

    SELECT fl."nFSid",fl."nFMLid", bd."nBundledetailid",
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab",
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
	JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid"
	  WHERE factids @> to_jsonb(fl."nFSid");

   RETURN NEXT ref1;
   RETURN NEXT ref2;
   RETURN NEXT ref3;

END;
$function$;


-- ----------------------------------------------------------------------------
-- 2/8  realtime.et_marknav_doclinks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION realtime.et_marknav_doclinks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;nBundledetailid uuid;
    sql_query TEXT;
	historyEnabled boolean;
	cSortby text;


	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	jFilter jsonb;
	nID uuid;
	bIsTranscipt boolean default false;

BEGIN
	nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
	nUserid := parameter ->>'nUserid';
	nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
	historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	cSortby := parameter->>'cSortby';
	jFilter := parameter ->>'jFilter';
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;
 	if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

sql_query := 'WITH tbl AS (
				SELECT m."dCreateDt",
				m."nDocid",
				u."cFname" || '' '' || COALESCE(u."cLname", '''') AS "cCreateby",
				d."jLinktype",
				d."jOText" as "jOT",
				d."jTexts",
				d."cType",
				m."nBundledetailid",
				-- CASE on bIsTranscipt so the published view picks up nTPage/nTLine
				-- written by run3.py during transferAnnotations. Inline the
				-- boolean since this SELECT is built via string-concat dynamic SQL.
				CASE WHEN '||COALESCE(bIsTranscipt,false)||' THEN d."nTPage" ELSE d."nPage" END AS "nPage",
				CASE WHEN '||COALESCE(bIsTranscipt,false)||' THEN d."nTLine" ELSE d."nLine" END AS "nLine",
				m."nUserid",
				d."jCordinates",
				cmt."total" as "t_comments",count(s."nDMSid") as "t_shared"
				FROM "DocMaster" m
				JOIN "UserMaster" u ON u."nUserid" = m."nUserid"
				JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
			  	left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
				LEFT JOIN "DMShared" s ON s."nDocid" = m."nDocid" -- AND s."nUserid" = ' || quote_nullable(nUserid) || '
				left join realtime."comments" cmt on cmt."nDocid" = m."nDocid"
				 '||(
                CASE WHEN historyEnabled = true
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||','|| quote_nullable(nBundledetailid) ||','|| quote_nullable(nUserid) ||',''D'','|| 1 || ') his ON his."id" = m."nDocid"'
                     ELSE '' END
              ) ||'
				WHERE (m."nSesid" = ' || quote_nullable(nSesid) || '
				or  m."nBundledetailid" = ' || quote_nullable(nBundledetailid) || ')
				AND (m."nUserid" = ' || quote_nullable(nUserid)  || '
				or s."nUserid" = ' || quote_nullable(nUserid)  || '  or (case when ''' || isAdmin || '''::boolean = true then  m."nUserid" = tr."nUserid" else false end))
				-- Orphan filter: on the published view, suppress doc-links whose
				-- annotation could not be re-anchored. Mirrors et_marks.sql:48-50.
				AND (
				  '||COALESCE(bIsTranscipt,false)||' = false
				  OR (d."cTransferStatus" IS DISTINCT FROM ''O'' AND d."jTCordinates" IS NOT NULL)
				)
				group by m."dCreateDt", m."nDocid", u."cFname",u."cLname",d."jLinktype", d."jOText", d."jTexts", d."cType", m."nBundledetailid",
				d."nPage", d."nTPage", d."nLine", d."nTLine", m."nUserid", d."jCordinates", cmt."total"
				),
				links AS (
				SELECT l."nDocid",
				l."nDMLids",
				l."jLinktype",
				l."nBundledetailid",
				d.*
				FROM "DMLinks" l
				JOIN tbl m ON m."nDocid" = l."nDocid"
				JOIN bundlesource d ON d."nBundledetailid" = l."nBundledetailid"

				)
				SELECT t.*,
					jsonb_agg(DISTINCT l.*) AS "list"
				FROM tbl t
				JOIN links l ON l."nDocid" = t."nDocid"
				where '||(
                CASE WHEN jFilter IS NOT NULL AND jFilter <> '{}'::jsonb
                     THEN ' EXISTS (
                SELECT *
                FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                            ' || quote_nullable(nID) || ',
                                            ' || quote_nullable(nUserid) || ',
                                            ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') filter
                WHERE  filter."id" = t."nDocid"
            )'
                     ELSE ' true ' END
              ) ||'
				GROUP BY t."dCreateDt",
						t."nDocid",
						t."cCreateby",
						t."jLinktype",
						t."jOT",
						t."jTexts",
						t."cType",
						t."nBundledetailid",
						t."nPage",
						t."nLine",
						t."nUserid",
						t."jCordinates",
						t."t_comments",t.t_shared
						' ||
						(
							CASE
							WHEN cSortby = 'asc'  THEN ' ORDER BY t."nPage" ASC,t."dCreateDt" ASC'
							WHEN cSortby = 'desc' THEN ' ORDER BY t."nPage" DESC,t."dCreateDt" DESC'
							ELSE ''
							END
						)
						|| '
						';



raise notice 'sql_query %',sql_query;
    OPEN ref FOR EXECUTE sql_query;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;


-- ----------------------------------------------------------------------------
-- 3/8  realtime.et_factsheet_detail
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION realtime.et_factsheet_detail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;
bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

	select "nCaseid" into nCaseid from "FactMaster" where  "nFSid" =  nFSid;
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

    OPEN ref1 FOR
	select f."dCreateDt",f."cFType",f."nFSid",f."nUserid",
	d."jDate",d."nFiletype",d."nStatus",d."cType",d."jLinktype",d."jTexts",d."jOT",d."cIsNote",d."nColorid",
	-- CASE on bIsTranscipt so the published-view SP returns the transferred
	-- (page, line) written by run3.py during transferAnnotations. Mirrors the
	-- canonical pattern in et_marks.sql:57-58 for RHighlights.
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTPage" ELSE d."nPage" END AS "nPage",
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTLine" ELSE d."nLine" END AS "nLine",
	(u."cFname" || ' ' || coalesce(u."cLname", '')) AS "cCreatedBy",

	case when f."nUserid" = nMasterid or isAdmin then true else  fs."nFSid" is not null end as "bCanView",
	f."nUserid" = nMasterid or isAdmin as "bCanDelete",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanComment" end as "bCanComment",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanEdit" end as "bCanEdit",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanReshare" end as "bCanReshare",
	rs."cName",
	b."cFilename",
	b."cTab",
	bm."cBundletag"
	From "FactMaster" f
	join "FactDetail" d on d."nFSid" = f."nFSid"
	join "UserMaster" u on u."nUserid" = f."nUserid"
	left join "RSessionMaster" rs on rs."nSesid" = f."nSesid"
	left join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
	left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid" and fs."nUserid" = nMasterid
	where f."nFSid" = nFSid
	  -- Orphan filter: on the published view, suppress facts whose annotation
	  -- could not be re-anchored (run3.py stamped 'O' and cleared jTCordinates).
	  AND (
	    COALESCE(bIsTranscipt, false) = false
	    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
	  );
    RETURN NEXT ref1;


END;
$function$;


-- ----------------------------------------------------------------------------
-- 4/8  realtime.et_navigate_factlist
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION realtime.et_navigate_factlist(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids jsonb;
    sql_query TEXT;

    jFilter jsonb;
    cFType text;
    nID uuid;
    historyEnabled boolean;

    isAdmin boolean default false;
    nRoleid uuid;
    nTeamid uuid;
    nCaseid uuid;
    bIsTranscipt boolean default false;

BEGIN
    --------------------------------------------------
    -- PARAMETERS
    --------------------------------------------------
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;

    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';

    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    jFilter := parameter->>'jFilter';

    offsetCount := (pageNumber - 1) * perPage;

    cFType := NULLIF(parameter->>'cFType','');
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

    historyEnabled := COALESCE(parameter->>'historyEnabled','false')::boolean;
    bIsTranscipt := COALESCE(parameter->>'bIsTranscipt','false')::boolean;

    nID := (CASE WHEN nSesid IS NULL THEN nBundledetailid ELSE nSesid END);

    --------------------------------------------------
    -- ADMIN / TEAM LOGIC
    --------------------------------------------------

    isAdmin :=
        CASE WHEN EXISTS (
            SELECT 1 FROM "UserMaster"
            WHERE "nUserid" = nMasterid
              AND "isAdmin" = true
        )
        THEN true ELSE false END;

    IF nBundledetailid IS NOT NULL THEN
        SELECT "nCaseid"
        INTO nCaseid
        FROM bundlesource
        WHERE "nBundledetailid" = nBundledetailid;
    ELSE
        SELECT "nCaseid"
        INTO nCaseid
        FROM "RSessionMaster"
        WHERE "nSesid" = nSesid;
    END IF;

    SELECT "nTeamid","nRoleid"
    INTO nTeamid,nRoleid
    FROM "TeamRelation"
    WHERE "nUserid" = nMasterid
      AND "nCaseid" = nCaseid
    LIMIT 1;

    IF isAdmin = false
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1
    THEN
        isAdmin := true;
    END IF;

    --------------------------------------------------
    -- COLLECT FACT IDS
    --------------------------------------------------

    sql_query := '
    SELECT jsonb_agg(DISTINCT f."nFSid")
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"

    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"

    LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = ' || quote_literal(nTeamid) || '

    WHERE
    (
        f."nSesid" = ' || quote_nullable(nSesid) || '
        OR
        f."nBundledetailid" = ' || quote_nullable(nBundledetailid) || '
    )

    AND
    (
        f."nUserid" = ' || quote_nullable(nMasterid) || '
        OR s."nUserid" = ' || quote_nullable(nMasterid) || '

        OR
        (
            ' || isAdmin || '::boolean = true
            AND f."nUserid" = tr."nUserid"
        )
    )
    ';

    IF cFType IS NOT NULL THEN
        sql_query := sql_query ||
            ' AND f."cFType" = ' || quote_literal(cFType);
    END IF;

    IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
        sql_query := sql_query || '
        AND EXISTS (
            SELECT 1
            FROM realtime.filter_marknav(
                ' || quote_literal(jFilter::text) || '::jsonb,
                ' || quote_nullable(nID) || ',
                ' || quote_nullable(nMasterid) || ',
                ''ALL'',
                ' || quote_nullable(nTeamid) || ',
                ' || isAdmin || '
            ) t
            WHERE t."id" = f."nFSid"
        )';
    END IF;

    EXECUTE sql_query INTO factids;

    IF factids IS NULL THEN
        factids := '[]'::jsonb;
    END IF;

    --------------------------------------------------
    -- REF1 – MAIN FACT LIST (DEDUP FIXED)
    --------------------------------------------------

    OPEN ref1 FOR

    WITH
    shared_ct AS (
        SELECT "nFSid", COUNT(*) AS t_shared
        FROM "FMShared"
        GROUP BY "nFSid"
    ),

    task_ct AS (
        SELECT "nFSid", COUNT(*) AS t_tasks
        FROM "FMTasks"
        GROUP BY "nFSid"
    ),

    contact_ct AS (
        SELECT "nFSid", COUNT(*) AS t_contact
        FROM "FMContact"
        GROUP BY "nFSid"
    )

    SELECT DISTINCT ON (f."nFSid")

        CASE WHEN f."cFType" = 'F' THEN 'F' ELSE 'QF' END AS "cSource",

        f."nFSid",
        f."dCreateDt",

        um."cFname" || ' ' || COALESCE(um."cLname",'') AS "cCreateby",
        um."nUserid",

        f."nBundledetailid",

        fd."nFiletype",
        fd."nTZid",
        tz."cCodename" AS "cTimezone",

        fd."jLinktype",
        fd."cType",
        f."cFType",

        fd."jTexts",
        fd."jOT",

        fd."nColorid",
        fd."nStatus",

        fd."jCordinates",
        -- CASE on bIsTranscipt so the published view picks up nTPage written by
        -- run3.py during transferAnnotations. Mirrors et_marks.sql:57-58.
        CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",

        cl."cColor",

        fd."jDate",

        cm."cCodename" as "cDatetype",
        st."cCodename" as "cStatus",
        ftp."cCodename" as "cFiletype",

        COALESCE(s.t_shared,0)  as "t_shared",
        COALESCE(ft.t_tasks,0)  as "t_tasks",
        COALESCE(fc.t_contact,0) as "t_contact",

        cmt."total" as "t_comments"

    FROM "FactMaster" f

    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"

    LEFT JOIN shared_ct s ON s."nFSid" = f."nFSid"
    LEFT JOIN task_ct ft ON ft."nFSid" = f."nFSid"
    LEFT JOIN contact_ct fc ON fc."nFSid" = f."nFSid"

    LEFT JOIN "Codemaster" cm
        ON cm."nCodeid" = (fd."jDate"->>'nValue')::int

    LEFT JOIN "Codemaster" tz
        ON tz."nCodeid" = fd."nTZid"

    LEFT JOIN "Codemaster" st
        ON st."nCodeid" = fd."nStatus"
		AND st."nCategoryid" = 24

    LEFT JOIN "Codemaster" ftp
        ON ftp."nCodeid" = fd."nFiletype"
		AND ftp."nCategoryid" = 23

    JOIN "RIssueMaster" cl
        ON cl."nIid" = fd."nColorid"

    LEFT JOIN realtime."comments" cmt
        ON cmt."nFSid" = f."nFSid"

    WHERE factids @> to_jsonb(f."nFSid")
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )

    ORDER BY
        f."nFSid",
        f."dCreateDt" DESC;

    --------------------------------------------------
    -- REF2 – ISSUES
    --------------------------------------------------

    OPEN ref2 FOR
    SELECT jsonb_agg(f."nFSid") AS "jFSids",
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    WHERE factids @> to_jsonb(f."nFSid")
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
             im."nICid", ic."cCategory", im."cIName", im."cColor";

    --------------------------------------------------
    -- REF3 – LINKS
    --------------------------------------------------

    OPEN ref3 FOR
    SELECT fl."nFSid", fl."nFMLid",
           fl."nBundledetailid",
           bd."cFilename" AS "cName",
           bd."cExhibitno", bd."cTab",
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd
      ON bd."nBundledetailid" = fl."nBundledetailid"
    WHERE factids @> to_jsonb(fl."nFSid");

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;

END;
$function$;


-- ----------------------------------------------------------------------------
-- 5/8  realtime.et_fact_get_detail_single
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION realtime.et_fact_get_detail_single(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nFSid uuid;
    isAdmin boolean;
    bIsTranscipt boolean default false;

BEGIN
    -- Extract parameters
    nFSid := NULLIF(parameter->>'nFSid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

    -- Open ref1
OPEN ref1 FOR
    SELECT f."nFSid", f."dCreateDt",
           um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		   um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone",
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus",
		   fd."jCordinates",
		   fd."jCordinates",
		   -- CASE on bIsTranscipt so the published-view single-fact lookup
		   -- returns nTPage/nTLine written by run3.py during transferAnnotations.
		   -- Mirrors et_marks.sql:57-58 for RHighlights.
		   CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
		   CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTLine" ELSE fd."nLine" END AS "nLine",
           cl."cColor" AS "cColor", fd."jDate",
           cm."cCodename" as "cDatetype",
           st."cCodename" as "cStatus",
           ftp."cCodename" as "cFiletype",
	count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"

    LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'type')::int
    LEFT JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
    LEFT JOIN "Codemaster" st ON st."nCodeid" = fd."nStatus"
    LEFT JOIN "Codemaster" ftp ON ftp."nCodeid" = fd."nFiletype"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = nFSid
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )
	group by f."nFSid", f."dCreateDt",
           um."cFname" ,um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename",
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus",
		    fd."jCordinates",
			fd."nPage", fd."nTPage", fd."nLine", fd."nTLine",
           cl."cColor", fd."jDate",cm."cCodename",st."cCodename", ftp."cCodename";

    -- Open ref2
    OPEN ref2 FOR
    SELECT jsonb_agg(f."nFSid") AS "jFSids",
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor",
           rl."cCodename" AS "cRelevance",
           impct."cCodename" AS "cImpact"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid"
    LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid"
    WHERE f."nFSid" = nFSid
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";

    -- Open ref3
    OPEN ref3 FOR
    SELECT fl."nFSid",fl."nFMLid", fl."nBundledetailid",
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab",
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid"
    WHERE fl."nFSid" = nFSid;

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;
END;
$function$;


-- ----------------------------------------------------------------------------
-- 6/8  realtime.et_navigate_facts_bycompany
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION realtime.et_navigate_facts_bycompany(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;nCompanyid uuid;
isAdmin boolean default false;
cSortby text;cSorttype text;
factids jsonb;
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
    nBundledetailid uuid;
	historyEnabled boolean;
	nID uuid;
	fga_factids jsonb;

	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
begin

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nCompanyid := NULLIF(parameter ->>'nCompanyid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
cSorttype := parameter ->>'cSorttype';
cSortby := parameter ->>'cSortby';
	jFilter := coalesce(parameter ->>'jFilter','[]')::jsonb;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
 	if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

sql_query := 'SELECT jsonb_agg(distinct f."nFSid")
			  FROM "FactMaster" f
			  JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
			  LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
			  LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
			  LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
			  LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
			  LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
			  LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
			  left join "ContactMaster" cm on cm."nContactid" = c."nContactid"
			  LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
			  '||(
                CASE WHEN historyEnabled = true
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||','|| quote_nullable(nBundledetailid) ||','|| quote_nullable(nMasterid) ||',''F'','|| 1 || ') his ON his."id" = f."nFSid"'
                     ELSE '' END
              ) ||'
			  left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
			 WHERE (f."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
              OR f."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
              AND (f."nUserid" = ' || quote_nullable(nMasterid) || '
              OR s."nUserid" = ' || quote_nullable(nMasterid) || ' or (case when ''' || isAdmin || '''::boolean = true then  f."nUserid" = tr."nUserid" else false end))
			  '||(
                    CASE WHEN nCompanyid IS NULL
                    THEN 'AND cm."nCompanyid" IS NULL'
                    ELSE 'AND cm."nCompanyid" = ' || quote_nullable(nCompanyid)
                    END
                );


			IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN

				sql_query := sql_query || '
				AND EXISTS (
				SELECT *
				FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
				' || quote_nullable(nID) || ',
				' || quote_nullable(nMasterid) || ',
				''F'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
				WHERE t."id" = f."nFSid"
				)';
			END IF;

raise notice 'sql_query %', sql_query;
EXECUTE sql_query INTO factids;

IF factids IS NULL THEN
    factids := '[]'::jsonb;
END IF;

raise notice 'factids %', factids;

	open ref1 for
	  SELECT f."nFSid", f."dCreateDt", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",um."nUserid",
        fd."nFiletype", fd."nTZid", "jLinktype", fd."cType", f."cFType", --tz."cCodename" AS "cTimezone",
        fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", cl."cColor" AS "cColor", fd."jDate", cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus", ftp."cCodename" as "cFiletype",
		fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",
		fd."jCordinates",
		-- CASE on bIsTranscipt so the published view picks up nTPage written by
		-- run3.py during transferAnnotations. Mirrors et_marks.sql:57-58.
		CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
		cr."cRole",
		pr."cCodename" "cPartyname",
		cf."cMentiontag",
		f."nBundledetailid" ,
		count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact",
	cmt."total" as "t_comments"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
 	join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cf on cf."nContactid" = fc."nContactid" and cf."nCompanyid" = nCompanyid
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"

	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"

	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'nValue')::int
    -- JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
	LEFT JOIN "Codemaster" pr ON pr."nCodeid" = cf."nPartyid"
	LEFT JOIN "ContactRole" cr ON cr."nCRoleid" = cf."nRoleid"
	left join realtime."comments" cmt on cmt."nFSid" = f."nFSid"
    WHERE  factids @> to_jsonb(f."nFSid")
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",um."nUserid",
        fd."nFiletype",fd."nTZid", -- tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		fd."jCordinates",
		fd."nPage", fd."nTPage",
		cm."cCodename",st."cCodename",ftp."cCodename",fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",
		cf."cMentiontag",
		f."nBundledetailid",
		cr."cRole",
		pr."cCodename",
		cmt."total"
	order by
		f."dCreateDt" DESC;

	 RETURN next ref1;

	open ref2 for
		select jsonb_agg(f."nFSid") "jFSids",fi."nIssueid",fi."nImpactid",fi."nRelevanceid",im."nICid",ic."cCategory",im."cIName",im."cColor",
		rl."cCodename",impct."cCodename"
		from "FactMaster" f
		join "FMIssue" fi on fi."nFSid" = f."nFSid"
		join "RIssueMaster" im on im."nIid" = fi."nIssueid"
		join "IssueCategory" ic on ic."nICid" = im."nICid"
		left join "Codemaster" rl on rl."nCodeid" = fi."nRelevanceid"
		left join "Codemaster" impct on impct."nCodeid" = fi."nImpactid"
		WHERE  factids @> to_jsonb(f."nFSid")
		 group by fi."nIssueid",fi."nImpactid",fi."nRelevanceid" ,im."nICid",ic."cCategory",im."cIName",im."cColor",rl."cCodename",impct."cCodename" ;


	 RETURN next ref2;


	 open ref3 for
		select fl."nFMLid",fl."nBundledetailid",bd."cFilename" "cName",bd."cExhibitno",bd."cTab",fl."jLinktype","cPage"
		from  "FMLinks" fl
		join "BundleDetail" bd on bd."nBundledetailid" = fl."nBundledetailid"
		  		WHERE  factids @> to_jsonb(fl."nFSid") ;

	 RETURN next ref3;

    END;
$function$;


-- ----------------------------------------------------------------------------
-- 7/8  transcript.et_transcript_publish
-- ----------------------------------------------------------------------------
-- Wired to the admin Transcript Import page → File menu → "Published" action.
-- The previous deployed version updated isTranscript/isUploaded but FORGOT
-- cStatus, leaving the session in (cStatus='C', isTranscript=t, isUploaded=t)
-- — a half-published state. Frontend treats this as "published" via the
-- canonical OR expression (cStatus='P' OR (isTranscript AND isUploaded)),
-- but any backend code using the narrow check (just cStatus='P') silently
-- skips it. The most painful symptom: markAsTranscriptIfPublished in
-- FactService skipped seeding new facts' jTCordinates, so they were dropped
-- by the orphan filter and invisible on the published view.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION transcript.et_transcript_publish(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$-- PATCHED et_transcript_publish
declare
  nSesid uuid;
  nCaseid uuid;
  cTransid uuid;
  cPath text;
  cNewpath text;
BEGIN
  nSesid   := parameter->>'nSesid';
  nCaseid  := parameter->>'nCaseid';
  cTransid := parameter->>'cTransid';

  cNewpath := 's_' || nSesid || '.json';

  select "cPath" into cPath
  from transcript."Transcripts"
  where "cTransid" = cTransid;

  update transcript."Transcripts"
    set "dPublishDt" = now(),
        "nSesid" = nSesid
    where "cTransid" = cTransid;

  update "RSessionMaster"
    set "isTranscript" = true,
        "isUploaded"   = true,
        "cStatus"      = 'P'          -- ← NEW: move session to "Published"
    where "nSesid" = nSesid;

  OPEN ref FOR
    select 1 msg, 'Published' value, cPath "cPath", cNewpath "cNewpath";

  RETURN ref;
END;$function$;


-- ----------------------------------------------------------------------------
-- 8/8  public.et_admin_case_getdetail
-- ----------------------------------------------------------------------------
-- Returns full case detail to the frontend file-explorer; the SELECT list now
-- includes "bHideBundleColumn" (added in PART 1 above) so the per-case Bundle
-- column suppression takes effect. Body otherwise unchanged from the
-- 2026-05-09 cTranscriptMode patch.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_admin_case_getdetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;
isPresent boolean = false;
nPresentid uuid;
nSesid text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;

 select "nSesid"::text into nSesid From "RSessionMaster" where "nCaseid" = nCaseid and "dCreatedt"::date=now()::date and  "cStatus" ='R' order by "dCreatedt" desc limit  1;

if exists(select 1 from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A') then
    isPresent = true;

    select p."nPresentid" into nPresentid from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A';
 end if;

open ref for
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode","bHideBundleColumn",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;
    END;
$function$;


-- ============================================================================
-- PART 3 — Sanity check: verify all 8 functions exist and compiled cleanly
-- ============================================================================
SELECT
    n.nspname AS "schema",
    p.proname AS "function",
    'OK'      AS "status"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname = 'realtime' AND p.proname IN (
        'et_navigate_get_all',
        'et_marknav_doclinks',
        'et_factsheet_detail',
        'et_navigate_factlist',
        'et_fact_get_detail_single',
        'et_navigate_facts_bycompany'
      ))
   OR (n.nspname = 'transcript' AND p.proname = 'et_transcript_publish')
   OR (n.nspname = 'public'     AND p.proname = 'et_admin_case_getdetail')
ORDER BY n.nspname, p.proname;
-- Expected: 8 rows, all status = 'OK'.


-- ============================================================================
-- PART 4 — Data backfills (all idempotent; re-running hits 0 rows).
--
--   Why all five steps live here together:
--     The new SPs (PART 2) and the application-side fixes
--     (markAsTranscriptIfPublished + handleSequence) only correct the
--     forward path — newly-created or newly-published rows are written
--     correctly. Rows that were created or transferred BEFORE this deploy
--     still need their columns brought into the new shape, otherwise the
--     published view returns NULL nLine, hides legitimate annotations as
--     "orphans", or shows wrong toolbar page counts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1a — FactDetail.nTLine
--   Old run3.py wrote only nTPage during transcript publish. Pull the line
--   number from jTCordinates[0].l (which run3.py DID populate) so the new
--   read SPs return correct nLine without re-running the full Python transfer.
-- ----------------------------------------------------------------------------
WITH backfilled AS (
    UPDATE "FactDetail"
    SET "nTLine" = NULLIF(("jTCordinates"->0->>'l'), '')::int
    WHERE "jTCordinates" IS NOT NULL
      AND jsonb_typeof("jTCordinates") = 'array'
      AND jsonb_array_length("jTCordinates") > 0
      AND "nTLine" IS NULL
      AND "cTransferStatus" = 'T'
    RETURNING 1
)
SELECT COUNT(*) AS "Step 1a: FactDetail.nTLine rows backfilled" FROM backfilled;

-- ----------------------------------------------------------------------------
-- STEP 1b — DocDetail.nTLine (mirror of 1a for doc-links)
-- ----------------------------------------------------------------------------
WITH backfilled AS (
    UPDATE "DocDetail"
    SET "nTLine" = NULLIF(("jTCordinates"->0->>'l'), '')::int
    WHERE "jTCordinates" IS NOT NULL
      AND jsonb_typeof("jTCordinates") = 'array'
      AND jsonb_array_length("jTCordinates") > 0
      AND "nTLine" IS NULL
      AND "cTransferStatus" = 'T'
    RETURNING 1
)
SELECT COUNT(*) AS "Step 1b: DocDetail.nTLine rows backfilled" FROM backfilled;

-- ----------------------------------------------------------------------------
-- STEP 2 — RSessionMaster.cStatus = 'P' for upload-published stragglers.
--   Predicate matches the canonical "is published" OR expression used by
--   et_realtime_sessiondata. Sessions in this state were published via the
--   admin "Published" button while the OLD et_transcript_publish SP was
--   deployed (it set isTranscript/isUploaded but forgot cStatus='P').
--   The fixed SP from PART 2 prevents this state going forward; this
--   step cleans up any rows already stuck.
-- ----------------------------------------------------------------------------
WITH backfilled AS (
    UPDATE "RSessionMaster"
       SET "cStatus" = 'P'
     WHERE "isTranscript" = true
       AND "isUploaded"   = true
       AND ("cStatus" IS NULL OR "cStatus" <> 'P')
       AND "dDelDt" IS NULL
    RETURNING "nSesid"
)
SELECT COUNT(*) AS "Step 2: RSessionMaster rows flipped to cStatus='P'" FROM backfilled;

-- ----------------------------------------------------------------------------
-- STEP 3a — FactDetail seed for facts created on published sessions but never
--   seeded (jTCordinates IS NULL). The orphan filter in the new read SPs
--   would otherwise drop these rows on the published view. Sets the four
--   columns the filter + published-view CASE both need:
--     jTCordinates    ← jCordinates  (live coords ARE pub coords when the
--                                      user is on a published session)
--     nTPage          ← nPage
--     nTLine          ← nLine
--     cTransferStatus ← 'T'
--   Restricted to sessions where the canonical OR check is true so we never
--   seed a fact on an unpublished session.
-- ----------------------------------------------------------------------------
WITH backfilled AS (
    UPDATE "FactDetail" fd
    SET "jTCordinates"    = fd."jCordinates",
        "nTPage"          = fd."nPage",
        "nTLine"          = fd."nLine",
        "cTransferStatus" = 'T'
    FROM "FactMaster" f
    JOIN "RSessionMaster" s ON s."nSesid" = f."nSesid"
    WHERE fd."nFSid" = f."nFSid"
      AND fd."jTCordinates" IS NULL
      AND fd."jCordinates"  IS NOT NULL
      AND (
        s."cStatus" = 'P'
        OR (s."isTranscript" = true AND s."isUploaded" = true)
      )
    RETURNING fd."nFSid"
)
SELECT COUNT(*) AS "Step 3a: FactDetail rows seeded as transferred" FROM backfilled;

-- ----------------------------------------------------------------------------
-- STEP 3b — DocDetail equivalent of step 3a.
-- ----------------------------------------------------------------------------
WITH backfilled AS (
    UPDATE "DocDetail" dd
    SET "jTCordinates"    = dd."jCordinates",
        "nTPage"          = dd."nPage",
        "nTLine"          = dd."nLine",
        "cTransferStatus" = 'T'
    FROM "DocMaster" m
    JOIN "RSessionMaster" s ON s."nSesid" = m."nSesid"
    WHERE dd."nDocid" = m."nDocid"
      AND dd."jTCordinates" IS NULL
      AND dd."jCordinates"  IS NOT NULL
      AND (
        s."cStatus" = 'P'
        OR (s."isTranscript" = true AND s."isUploaded" = true)
      )
    RETURNING dd."nDocid"
)
SELECT COUNT(*) AS "Step 3b: DocDetail rows seeded as transferred" FROM backfilled;


-- ============================================================================
-- PART 5 — Final sanity counters. Inspect before COMMIT (or ROLLBACK if
--          anything looks off).
-- ============================================================================

-- Should show 0 in "rows_still_missing_nTLine" (apart from legit orphans).
SELECT
    'FactDetail' AS "table",
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T') AS "transferred_rows",
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T' AND "nTLine" IS NOT NULL) AS "rows_with_nTLine",
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T' AND "nTLine" IS NULL) AS "rows_still_missing_nTLine"
FROM "FactDetail"
UNION ALL
SELECT
    'DocDetail',
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T'),
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T' AND "nTLine" IS NOT NULL),
    COUNT(*) FILTER (WHERE "cTransferStatus" = 'T' AND "nTLine" IS NULL)
FROM "DocDetail";

-- Should show only one row, with cStatus='P' and the count of all
-- upload-published sessions.
SELECT "cStatus", COUNT(*) AS "upload_published_sessions"
FROM "RSessionMaster"
WHERE "isTranscript" = true
  AND "isUploaded"   = true
  AND "dDelDt" IS NULL
GROUP BY "cStatus";

COMMIT;

-- ============================================================================
-- Done. Next steps (outside this script):
--   1. Sync assets/pythons/annot-transfer/run3.py to the server filesystem
--      (no restart needed — Python is interpreted; spawned per publish).
--   2. Rebuild + restart realtime-server, coreapi, export microservices.
--   3. Frontend: ng build + redeploy.
-- ============================================================================
