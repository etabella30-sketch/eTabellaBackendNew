-- 2026-09-23_sec_navigate_jfilter_sqli (apply)
--
-- Security remediation phase 4: client jFilter reached dynamic SQL unescaped.
--   realtime.et_navigate_get_all (x3), et_navigate_facts_bycompany, et_navigate_quick_mark,
--   et_marknav_doclinks built  filter_marknav(''' || jFilter::text || '''::jsonb, ...)  - the raw jsonb text
--   spliced between quotes. Now  filter_marknav(' || quote_literal(jFilter::text) || '::jsonb, ...)  - the form
--   realtime.et_navigate_factlist already uses. Identical SQL for any filter without quote / backslash.
--   public.filter_whereclause (14 callers: public.et_navigate_get_all / _doclist / _factlinks / _weblinks /
--   _get_all_links, et_workspace_issues_list, et_workspace_contacts_list, et_sidenav_filecontacts_list,
--   et_sidenave_tasks_filetasks, realtime.et_navigate_factlinks, plus test / backup copies): list values were
--   wrapped in quotes without escaping, and the type 'C' condition token was appended verbatim. Values are
--   now quote_literal()-escaped and the token must be AND / OR (the only values the clients send).
--
-- NOT covered here (same class, follow-up): public.filter_whereclause_2 - 24 callers incl. the live
--   et_bundledetail, et_bundledetail_search, et_workspace_fact_list / _fact_issues / _fact_files,
--   et_admin_bundles_filetypes, et_admin_searched_bundles, et_navigate_factlist - has the same unescaped IN list,
--   appends the 'C' token verbatim (3 places) and joins TASK jPriority / Timeline values unquoted; and
--   public.et_bundledetail splices  jFilter[0]->>'name'  between quotes in its dynamic SQL.
--
-- No service change needed. Unused copies with the same pattern are NOT patched:
--   public.et_bundledetail_with_filter, realtime.et_marknav_doclinks_test, realtime.et_navigate_get_all_backup.
-- All five bodies are identical on dev and in the 2026-09-22 prod backup.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ realtime.et_navigate_get_all ============
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
	)';

	--or ('''|| coalesce(fga_factids,'[]')::text || ''')::jsonb @> to_jsonb(f."nFSid")
	-- IF jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
	IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN

    sql_query := sql_query || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(' || quote_literal(jFilter::text) || '::jsonb,
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
	)
					AND (m."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
					OR  m."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
					';

				-- Append filter only if jFilter is a non-empty object
				IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
				sql_query_doc_links := sql_query_doc_links || '
					AND EXISTS (
					SELECT 1
					FROM realtime.filter_marknav(' || quote_literal(jFilter::text) || '::jsonb,
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
          FROM realtime.filter_marknav(' || quote_literal(jFilter::text) || '::jsonb,
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

-- ============ realtime.et_navigate_facts_bycompany ============
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
              OR s."nUserid" = ' || quote_nullable(nMasterid) || ')
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
				FROM realtime.filter_marknav(' || quote_literal(jFilter::text) || '::jsonb,
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

-- ============ realtime.et_navigate_quick_mark ============
CREATE OR REPLACE FUNCTION realtime.et_navigate_quick_mark(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;
bIsTranscipt boolean default false;
cSortby text;
historyEnabled boolean;
sql_query text;
  jFilter jsonb; 

begin
-- select et_navigate_fact_companies('{ ""nBundledetailid"": 530060, ""cType"": ""N"", ""jFilter"": ""[]"", ""sortby"": {}, ""nMasterid"": 59 }','r');fetch all in ""r""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;
cSortby := parameter->>'cSortby';
historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
 jFilter := parameter->>'jFilter';

-- select rh."nHid", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
-- 	rh."dCreatedt" "dCreateDt",
-- 	CASE WHEN bIsTranscipt THEN rh."tidentity" ELSE rh."identity" END AS "identity",
-- 	(CASE WHEN bIsTranscipt THEN rh."cTPageno" ELSE rh."cPageno" END)::INT AS "nPage",
-- 	(CASE WHEN bIsTranscipt THEN rh."cTLineno" ELSE rh."cLineno" END)::INT AS "nLine"
-- 	from "RHighlights" rh 
-- 	join "UserMaster" um on um."nUserid" = rh."nUserid"
-- 	where rh."nUserid" = nMasterid
-- 	and "nSessionId" = nSesid
-- 	 ORDER BY 
-- 		 	CASE WHEN cSortby = 'asc' THEN rh."dCreatedt" END ASC,
-- 			CASE WHEN cSortby = 'desc' THEN rh."dCreatedt" END DESC,
-- 			rh."dCreatedt" desc;

sql_query :=
			'SELECT rh."nHid",
			um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby",
			rh."dCreatedt" AS "dCreateDt",
			CASE WHEN ' || bIsTranscipt || ' THEN rh."tidentity" ELSE rh."identity" END AS "identity",
			(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTPageno" ELSE rh."cPageno" END)::INT AS "nPage",
			(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTLineno" ELSE rh."cLineno" END)::INT AS "nLine",
			(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTTime" ELSE rh."cTime" END) AS "cTime"
			FROM "RHighlights" rh
			JOIN "UserMaster" um ON um."nUserid" = rh."nUserid"
			'||(
                CASE WHEN historyEnabled = true 
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||',null,'|| quote_nullable(nMasterid) ||',''QM'','|| 1 || ') his ON his."id" = rh."nHid"'
                     ELSE '' END
              ) ||'
			WHERE rh."nUserid" = ' || quote_nullable(nMasterid) || '
			AND rh."nSessionId" = ' || quote_nullable(nSesid);
			
			IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
				sql_query := sql_query || '
					AND EXISTS (
						SELECT *
						FROM realtime.filter_marknav(' || quote_literal(jFilter::text) || '::jsonb,
													' || quote_nullable(nSesid) || ',
													' || quote_nullable(nMasterid) || ',
													''QM'') t
						WHERE t."id" = rh."nHid"
					)';
			END IF;
			
		sql_query := sql_query	 || '
				ORDER BY  "nPage", "nLine", ' ||
				CASE 
					WHEN cSortby = 'asc'  THEN 'rh."dCreatedt" ASC'
					WHEN cSortby = 'desc' THEN 'rh."dCreatedt" DESC'
					ELSE 'rh."dCreatedt" DESC'
				END;

raise notice 'sql_query %', sql_query;
    OPEN ref FOR EXECUTE sql_query;

	

	 return ref;
    END;
$function$;

-- ============ realtime.et_marknav_doclinks ============
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
				or s."nUserid" = ' || quote_nullable(nUserid)  || ')
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
                FROM realtime.filter_marknav(' || quote_literal(jFilter::text) || '::jsonb,
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

-- ============ public.filter_whereclause ============
CREATE OR REPLACE FUNCTION public.filter_whereclause(jfilters jsonb, ctype text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    result TEXT := '';
    current_filter JSONB;
    filter_name TEXT;
    actual_column_name TEXT;
    filter_type TEXT;
    filter_values JSONB;
    condition_type TEXT;
    i INT := 0;
	start_dt TIMESTAMP;
    end_dt TIMESTAMP;
    
BEGIN
    -- Loop through each filter in the JSONB array
    FOR i IN 0 .. jsonb_array_length(jfilters) - 1 LOOP
        current_filter := jfilters->i;
        filter_name := current_filter->>'name';
        filter_type := current_filter->>'type';
        filter_values := current_filter->'value';

		IF filter_name = 'DATE' THEN
			-- Get the column name for DATE
			actual_column_name := public.filter_columnnames(filter_name, ctype);
			start_dt := (filter_values->>'startDt')::timestamp;
			end_dt := (filter_values->>'endDt')::timestamp;
	
			IF actual_column_name IS NOT NULL THEN
				result := result || '(' || actual_column_name || ' BETWEEN ' || quote_literal(start_dt) || ' AND ' || quote_literal(end_dt) || ') ';
			END IF;
		
        ELSIF filter_name != 'TASK' then
            IF filter_type = 'V' THEN
                -- Get the actual column name
                actual_column_name := public.filter_columnnames(filter_name,ctype);
                
                -- Append filter values to the WHERE clause
                IF jsonb_typeof(filter_values) = 'array' THEN
                    if(jsonb_array_length(filter_values) > 0) then
                        -- 2026-09-23 sec: each value is quote_literal()-escaped; the generated text is unchanged for
                        -- ordinary values (an all-null list still yields IN ('')).
                        result := result || actual_column_name || ' IN (' || coalesce(nullif(array_to_string(array(SELECT quote_literal(sv) FROM jsonb_array_elements_text(filter_values) AS sv), ','), ''), '''''') || ') ';
				     elsif(filter_name in ('RELEVANCE','IMPACT')) then
                        result := result || actual_column_name || ' IN (' || array_to_string(array(SELECT jsonb_array_elements_text(filter_values)), ',') || ') ';
                    else 
                        result := result;
                    end if;
                ELSE
                    result := result || actual_column_name || ' = ' || quote_literal(filter_values) || ' ';
                END IF;
            ELSIF filter_type = 'C' THEN
                -- Append condition type (AND/OR) to the WHERE clause
                condition_type := filter_values::TEXT;
                -- 2026-09-23 sec: only AND / OR may be spliced into the WHERE clause; anything else voids the filter
                IF upper(replace(condition_type::text,'"','')) IN ('AND', 'OR') THEN
                    result := result || replace(condition_type::text,'"','') || ' ';
                ELSE
                    RETURN NULL;
                END IF;
            END IF;
        end if;
    END LOOP;

    -- Trim the trailing condition type if exists
    result := rtrim(rtrim(result, ' '), 'AND');
    result := rtrim(rtrim(result, ' '), 'OR');

    RETURN nullif(result,'');
END;
$function$;

COMMIT;
