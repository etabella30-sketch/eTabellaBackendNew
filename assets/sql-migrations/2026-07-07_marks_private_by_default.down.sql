-- 2026-07-07 — marks private by default: remove the admin team-visibility
-- bypass from every mark-visibility SP (ROLLBACK — restores the exact live definitions dumped 2026-07-07).
--
-- Requirement: any annotation (QFact/Fact/DocLink/highlight, doc or transcript)
-- is visible ONLY to its creator until explicitly shared (FMShared/DMShared via
-- et_fact_insert_team etc.). Non-admin members already worked this way; global
-- admins (UserMaster.isAdmin) and case role nSrno=1 saw every teammate's marks
-- through an "or (case when isAdmin then X.nUserid = tr.nUserid)" branch.
--
-- This migration ONLY removes that visibility branch. Deliberately untouched:
--   - et_doc_annotations (already private: owner/FMShared/DMShared/LocationShare)
--   - public.et_navigate_* doc-mode family (already private)
--   - the "(isAdmin or nBDPid is null)" private-document gates (different feature)
--   - et_bundledetail's isAdmin gates (private-doc + BMPermission, not marks)
--   - realtime.et_factsheet_delete + factsheet bCanDelete (admin cleanup power)
--
-- Fixture-proven on a throwaway PG (see docs/marks-private-by-default.md).

-- ============ realtime.et_marks ============
CREATE OR REPLACE FUNCTION realtime.et_marks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;jFactids jsonb;

        isAdmin boolean default false;
        nRoleid uuid;nTeamid uuid;bTranscript boolean;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
jFactids := parameter ->>'jFactids';
bTranscript := parameter ->>'bTranscript';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;

 if(nCaseid is null) then
        select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSessionid;
 end if;


select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;

if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
        isAdmin := true;
end if;


    OPEN ref1 FOR
                select DISTINCT f."nFSid" as "id",f."cFType" as "cType",
                 CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates",
                d."nColorid",i."cColor" as "color"
                from "FactMaster" f
                join "FactDetail" d on d."nFSid" = f."nFSid"
                left join "RIssueMaster" i on i."nIid" = d."nColorid"
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
                where f."nSesid" = nSessionid
                  and ((f."nUserid" = nUserid or s."nUserid" = nUserid) or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end))
                  and (
                    COALESCE(bTranscript, false) = false
                    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
                  );

    RETURN NEXT ref1;

    OPEN ref2 FOR

          select DISTINCT h."nHid",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cPageno"  ELSE h."cTPageno" END AS "cPageno",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."cLineno"  ELSE h."cTLineno"  END AS "cLineno",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cTime"  ELSE h."cTTime"END AS "cTime",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."identity" ELSE h."tidentity" END AS "identity"
                  FROM "RHighlights" h
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                WHERE h."nSessionId" = nSessionid
                  AND (h."nUserid"  = nUserid or (case when isAdmin = true then  h."nUserid" = tr."nUserid" else false end))
                  AND (
                    COALESCE(bTranscript, false) = false
                    OR (h."cTransferStatus" IS DISTINCT FROM 'O' AND h."cTPageno" IS NOT NULL)
                  );

        RETURN NEXT ref2;

    OPEN ref3 FOR

        select DISTINCT m."nDocid" as "id",'D' as "cType" ,
        CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates"
        from "DocMaster" m
        join "DocDetail" d on d."nDocid" = m."nDocid"
        left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
        where m."nSesid" = nSessionid
          and (m."nUserid" = nUserid or s."nUserid" = nUserid or (case when isAdmin = true then  m."nUserid" = tr."nUserid" else false end))
          and (
            COALESCE(bTranscript, false) = false
            OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
          )
          and (
            COALESCE(bTranscript, false) = true
            OR d."jCordinates" IS NOT NULL
          );

        RETURN NEXT ref3;

END;
$function$;

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

-- ============ realtime.et_navigate_factlist ============
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

-- ============ realtime.et_navigate_fact_companies ============
CREATE OR REPLACE FUNCTION realtime.et_navigate_fact_companies(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;
isAdmin boolean default false;
conpanyids uuid[];
nBundledetailid uuid;

	nRoleid uuid;nTeamid uuid;nCaseid uuid;
-- fga_factids jsonb;

begin
-- select et_navigate_fact_companies('{ ""nBundledetailid"": 530060, ""cType"": ""N"", ""jFilter"": ""[]"", ""sortby"": {}, ""nMasterid"": 59 }','r');fetch all in ""r""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
-- fga_factids := parameter->>'jFactids';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
	
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

	open ref for
	select cm."nCompanyid" "nCompanyid",case when cm."nCompanyid" IS NOT NULL then cc."cCompany" else 'Unassigned' end "cCompany" from "FactMaster" f
    join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "ContactCompany" cc on cc."nCompanyid" = cm."nCompanyid"
	left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
    -- left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
     where (f."nSesid" = nSesid  or f."nBundledetailid" = nBundledetailid)
	 and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) -- and (isAdmin or "nBDPid" is null) --or fga_factids @> to_jsonb(fc."nFSid")
	group by cm."nCompanyid",cc."cCompany" ;

	 return ref;
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

-- ============ realtime.filter_marknav.v1 ============
CREATE OR REPLACE FUNCTION realtime.filter_marknav(jfilter jsonb, nsesid uuid, nuserid uuid, ctype text, nteamid uuid, isadmin boolean)
 RETURNS TABLE(id uuid, type text)
 LANGUAGE plpgsql
AS $function$

declare 
		jClaims jsonb;jIssues jsonb;jRels jsonb;jImps jsonb;
		IsNote boolean;IsFactlink boolean;IsComment boolean;
		jContacts jsonb;jCRoles jsonb;jCPartys jsonb;jCCompanies jsonb;IsContactNote boolean;
		jTasks jsonb;IsTaskDesc boolean;jTShared jsonb;jTStatus jsonb;jTPriority jsonb;
		jDate jsonb;jFiletypes jsonb;jStatus jsonb;createDate jsonb;createBy jsonb;dTDate timestamp;

		IsCreateByMe boolean;IsShared boolean;

		start_dt timestamp;end_dt timestamp;dateType text;
		cMainType text;
		

		
BEGIN

	jClaims := jFilter ->>'jClaims';
	jIssues := jFilter ->>'jIssues';
	jRels := jFilter ->>'jRels';
	jImps := jFilter ->>'jImps';
	
	IsNote := jFilter ->>'IsNote';
	IsFactlink := jFilter ->>'IsFactlink';
	IsComment := jFilter ->>'IsComment';

	jContacts := jFilter ->>'jContacts';
	jCRoles := jFilter ->>'jCRoles';
	jCPartys := jFilter ->>'jCPartys';
	jCCompanies := jFilter ->>'jCCompanies';
	IsContactNote := jFilter ->>'IsContactNote';
	dTDate := jFilter ->>'dTDate';
	
	jTasks := jFilter ->>'jTasks';
	IsTaskDesc := jFilter ->>'IsTaskDesc';
	jTShared := jFilter ->>'jTShared';
	jTStatus := jFilter ->>'jTStatus';
	jTPriority := jFilter ->>'jTPriority';
	
	jDate := jFilter ->>'jDate';
	jFiletypes := jFilter ->>'jFiletypes';
	jStatus := jFilter ->>'jStatus';
	createDate := jFilter ->>'createDate';
	createBy := jFilter ->>'createBy';

	IsCreateByMe := jFilter ->>'IsCreateByMe';
	IsShared := jFilter ->>'IsShared';
	cMainType := jFilter ->>'cType';
	
/*
select now()::date
t
where case when jFilter is not null then  exists  (
select * from realtime.filter_marknav('{"dTDate":"2025-08-30"}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL') m
where m."id" = t."nId"
)
select * from realtime.filter_marknav('{}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL')

2025-08-27

select * from realtime.filter_marknav_backup('{}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL')

select * from "FactMaster" order by "dCreateDt" desc

select * from "ContactMaster" order by "dCreateDt" desc

select * from "TaskDetail" where "nTaskid" = '009f3033-a347-42b2-b224-21f9c6ad9f8a'

select "jTimeline"->>'dEnd',* from "TaskDetail" 

select td."dEndDt",f.* From "FactMaster" f
left join "FMTasks" fm on fm."nFSid" = f."nFSid"
left join "TaskDetail" td on td."nTaskid" = fm."nTaskid"
 where f."nFSid" = 'b0f97b93-7d08-4fe8-a0f8-1e9cbdc674ca' and td."dEndDt"::date = ('2025-08-27')::date

select * from "FactDetail" limit 100

select * from realtime.filter_marknav('{"IsComment":true}'::jsonb,'f083ca63-1145-4711-aede-8d08a0260f68'::uuid,'fc2b2057-ac44-41c7-9058-64e8617ed3e5'::uuid,'ALL');

*/
start_dt := (SELECT fact_bound_ts_immutable(jDate, 'start'));
end_dt := (SELECT fact_bound_ts_immutable(jDate, 'end'));
dateType := (select ("jOther"->>'type')::text from "Codemaster" where "nCodeid" = (jDate->>'nValue')::int limit 1);

    /*RAISE NOTICE 'filter_marknav -> start_dt: %, end_dt: %, dateType: %',
      start_dt, end_dt, COALESCE(dateType, 'NULL');*/
    RETURN QUERY
 
with tbl as (
	select f."nFSid" as "id",f."cFType"::text "type",f."nSesid",f."nBundledetailid",f."nUserid" as "nCreateid",
	fi."nImpactid",fi."nRelevanceid",fi."nIssueid",i."nICid",
	jsonb_array_length(coalesce(fd."jTexts",'[]'::jsonb))>0 as "IsNote",
	coalesce(fl."nFMLid",'00000000-0000-0000-0000-000000000000'::uuid) != '00000000-0000-0000-0000-000000000000'::uuid as "IsFactlink",
	cm."nContactid",cm."nRoleid",cm."nCompanyid",cm."nPartyid",
	coalesce(cm."cNote",'') != '' as "IsContactNote",
	td."nTaskid",coalesce(td."cDesc",'') != '' as "IsTaskDesc",td."nStatus" as "nTStatus",td."nPriority",ts."nUserid" as "nTShareUserid",td."dEndDt" as "dTEndDt",
	fd."nFiletype",fd."nStatus",f."dCreateDt",fd."jDate",
	fs."nUserid" as "nShareUserid",fd."start_date",fd."end_date",case when (cmt."nFSid" is not null) then true else false end  "IsComment"
	from "FactMaster" f
	join "FactDetail" fd on fd."nFSid" = f."nFSid" and (case when cMainType ='M' then fd."cType" = 'M' when fd."cType" = 'S' then fd."cType" != 'M'   else true end)
	join "FMIssue" fi on fi."nFSid" = f."nFSid"
	join "RIssueMaster" i on i."nIid" = fi."nIssueid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "FMLinks" fl on fl."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	left join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
	left join "FMTasks" fm on fm."nFSid" = f."nFSid"
	left join "TaskDetail" td on td."nTaskid" = fm."nTaskid"
	left join "TaskShared" ts on ts."nTaskid" = fm."nTaskid"
	left join (
			select distinct c."nFSid",c."nSesid" from realtime."Comments" c  where c."dDelDt" is null
	) cmt on cmt."nFSid" = f."nFSid"
	where case when cType = 'ALL' then true else ("cFType" = cType) end
	union all
	select d."nDocid" as "id",'D'::text as "type",d."nSesid",d."nBundledetailid",d."nUserid" as "nCreateid",
	  NULL        as "nImpactid",
	  NULL        as "nRelevanceid",
	  NULL::uuid        as "nIssueid",
	  NULL::uuid        as "nICid",
	  NULL::boolean     as "IsNote",
	  NULL::boolean     as "IsFactlink",
	  NULL::uuid        as "nContactid",
	  NULL::uuid        as "nRoleid",
	  NULL::uuid        as "nCompanyid",
	  NULL        as "nPartyid",
	  NULL::boolean     as "IsContactNote",
	  NULL::uuid        as "nTaskid",
	  NULL::boolean     as "IsTaskDesc",
	  NULL::integer     as "nTStatus",
	  NULL::integer     as "nPriority",
	  NULL::uuid        as "nTShareUserid",
	  null      		as "dTEndDt",
	  NULL::integer     as "nFiletype",
	  NULL::integer     as "nStatus",
	  d."dCreateDt",
	  NULL::jsonb       as "jDate",
	  s."nUserid" as "nShareUserid",null "start_date",null "end_date", false "IsComment"
	From "DocMaster" d
	join "DocDetail" dd on dd."nDocid" = d."nDocid" and (case when cMainType ='M' then dd."cType" = 'M' when dd."cType" = 'S' then dd."cType" != 'M' else true end)
	left join "DMShared" s on s."nDocid" = d."nDocid"
	where case when cType = 'ALL' then true else cType = 'D' end
	
	union all

	select
	  rh."nHid" as "id",
	  'QF'::text as "type",
	  rh."nSessionId",
      null::uuid 			as "nBundledetailid",
	  rh."nUserid" 		as "nCreateid",
	  NULL        		as "nImpactid",
	  NULL       		as "nRelevanceid",
	  NULL::uuid        as "nIssueid",
	  NULL::uuid        as "nICid",
	  NULL::boolean     as "IsNote",
	  NULL::boolean     as "IsFactlink",
	  NULL::uuid        as "nContactid",
	  NULL::uuid        as "nRoleid",
	  NULL::uuid        as "nCompanyid",
	  NULL              as "nPartyid",
	  NULL::boolean     as "IsContactNote",
	  NULL::uuid        as "nTaskid",
	  NULL::boolean     as "IsTaskDesc",
	  NULL::integer     as "nTStatus",
	  NULL::integer     as "nPriority",
	  NULL::uuid        as "nTShareUserid",
	  null      		as "dTEndDt",
	  NULL::integer     as "nFiletype",
	  NULL::integer     as "nStatus",
	  rh."dCreatedt",
	  NULL::jsonb       as "jDate",
	  null as "nShareUserid",
	  null "start_date",
	  null "end_date",
	  false "IsComment"
	From "RHighlights" rh
	where case when cType = 'ALL' then true else cType = 'QM' end

) select t."id",t."type" 
	from tbl t
	 left join "TeamRelation" tr ON tr."nTeamid" = nTeamid 
	where ("nSesid" = nSesid   or "nBundledetailid" = nSesid)
	and 
	(
		(IsCreateByMe is null and IsShared is null and ("nCreateid" = nUserid or "nShareUserid" = nUserid 
		or (case when isAdmin = true then  "nCreateid" = tr."nUserid" else false end)) )
		or (
			(IsCreateByMe is not null and  "nCreateid" = nUserid)
			or 
			(IsShared is not null and "nShareUserid" = nUserid )
		)
	)
--- ISSUE _FILTER
	and 
	(
		jClaims is null
		or (jClaims is not null and jClaims @> to_jsonb("nICid"))
	)
	and 
	(
		jIssues is null
		or (jIssues is not null and jIssues @> to_jsonb("nIssueid"))
	)
	and 
	(
		jRels is null
		or (jRels is not null and jRels @> to_jsonb("nRelevanceid"))
	)
	and 
	(
		jImps is null
		or (jImps is not null and jImps @> to_jsonb("nImpactid"))
	)
	
--- OTHER FACT DETAIL

	and 
	(
		IsNote is null
		or (IsNote is not null and "IsNote" = true)
	)
	and 
	(
		IsFactlink is null
		or (IsFactlink is not null and "IsFactlink" = true)
	)
	and 
	(
		IsComment is null
		or (IsComment is not null and "IsComment" = true)
	)
	-- or (IsComment is not null and "IsComment" = true)

--------  CONTACT FILTER

	and 
	(
		jContacts is null
		or (jContacts is not null and jContacts @> to_jsonb("nContactid"))
	)
	and 
	(
		jCRoles is null
		or (jCRoles is not null and jCRoles @> to_jsonb(t."nRoleid"))
	)
	and 
	(
		jCPartys is null
		or (jCPartys is not null and jCPartys @> to_jsonb("nPartyid"))
	)
	and 
	(
		jCCompanies is null
		or (jCCompanies is not null and jCCompanies @> to_jsonb("nCompanyid"))
	)
	and 
	(
		IsContactNote is null
		or (IsContactNote is not null and "IsContactNote" = true)
	)
	
--------------- TASK FILTER
	and 
	(
		jTasks is null
		or (jTasks is not null and jTasks @> to_jsonb("nTaskid"))
	)
	and 
	(
		IsTaskDesc is null
		or (IsTaskDesc is not null and "IsTaskDesc"  = true)
	)
	and 
	(
		jTShared is null
		or (jTShared is not null and jTShared @> to_jsonb("nTShareUserid"))
	)
	and 
	(
		jTStatus is null
		or (jTStatus is not null and jTStatus @> to_jsonb("nTStatus"))
	)
	and 
	(
		jTPriority is null
		or (jTPriority is not null and jTPriority @> to_jsonb("nPriority"))
	)

	and 
	(
		dTDate is null
		or (dTDate is not null and ("dTEndDt")::date  =  (dTDate)::date )
	)
----------------------------- FACT DETAIL
	
	and 
	(
		jFiletypes is null
		or (jFiletypes is not null and jFiletypes @> to_jsonb("nFiletype"))
	)
	and 
	(
		jStatus is null
		or (jStatus is not null and jStatus @> to_jsonb("nStatus") )
	)
	and 
	(
		createDate is null
		or (createDate is not null and "dCreateDt"::date between (createDate->>'start')::date and  (createDate->>'end')::date )
	)
	and 
	(
		createBy is null
		or (createBy is not null and createBy @> to_jsonb("nCreateid"))
	)
	-- or jDate

	and 
	(
	 	jDate is null
		or (jDate is not null and 
			 case when (dateType = 'ON' or dateType = 'C' or dateType = 'BT') then
				(
					start_dt::date BETWEEN "start_date"::date AND "end_date"::date
         			OR end_dt::date   BETWEEN "start_date"::date AND "end_date"::date
          			OR "start_date"::date BETWEEN start_dt::date AND end_dt::date
        			OR "end_date"::date   BETWEEN start_dt::date AND end_dt::date
				)
				when  dateType = 'B' then
				start_date::date >= "start_date"::date
				when  dateType = 'A' then
				"start_date"::date >= start_date::date	
			 end 

		)
	)
	group by t."id",t."type" 
;
	
	  
END;
$function$;

-- ============ realtime.et_marknav_team_user ============
CREATE OR REPLACE FUNCTION realtime.et_marknav_team_user(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid          UUID;
    nBundledetailid  UUID;
    nSesid           UUID;
    cType            text;
    nCaseid          UUID;
    nTeamid          UUID;
    nRoleid          UUID;
    isAdmin          boolean default false;
BEGIN
    nUserid         := NULLIF(parameter ->> 'nUserid', '')::uuid;
    nSesid          := NULLIF(parameter ->> 'nSesid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    cType           := parameter ->> 'cType';

    IF nSesid IS NOT NULL THEN
        SELECT "nCaseid" INTO nCaseid
          FROM "RSessionMaster"
         WHERE "nSesid" = nSesid;
    END IF;

    IF nCaseid IS NULL AND nBundledetailid IS NOT NULL THEN
        SELECT bm."nCaseid" INTO nCaseid
          FROM "BundleDetail" bd
          JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
         WHERE bd."nBundledetailid" = nBundledetailid;
    END IF;

    isAdmin := EXISTS (
        SELECT 1 FROM "UserMaster"
         WHERE "nUserid" = nUserid AND "isAdmin" = true
    );

    SELECT "nTeamid", "nRoleid"
      INTO nTeamid, nRoleid
      FROM "TeamRelation"
     WHERE "nUserid" = nUserid
       AND "nCaseid" = nCaseid
     LIMIT 1;

    IF NOT isAdmin
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1 THEN
        isAdmin := true;
    END IF;

    OPEN ref1 FOR
    SELECT q."nUserid", q."cFname", q."cLname", q."cProfile"
    FROM (
      SELECT DISTINCT
        u."nUserid",
        u."cFname",
        u."cLname",
        u."cProfile",
        CASE WHEN u."nUserid" = nUserid THEN 0 ELSE 1 END AS _sort_first
      FROM "UserMaster" u
      LEFT JOIN "FactMaster" f
        ON f."nUserid" = u."nUserid"
       AND (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
       AND (COALESCE(cType,'A') = 'A' OR f."cFType" = cType)
      LEFT JOIN "FMShared" fs
        ON fs."nFSid" = f."nFSid"
      LEFT JOIN "DocMaster" d
        ON d."nUserid" = u."nUserid"
       AND (d."nSesid" = nSesid OR d."nBundledetailid" = nBundledetailid)
       AND (cType = 'A' OR cType = 'D')
      LEFT JOIN "DMShared" ds
        ON ds."nDocid" = d."nDocid"
      LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = nTeamid
       AND tr."nUserid" = u."nUserid"
       AND tr."nCaseid" = nCaseid
      WHERE (
            COALESCE(cType,'A') = 'A'
            AND (f."nFSid" IS NOT NULL OR d."nDocid" IS NOT NULL)
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType = 'D'
            AND d."nDocid" IS NOT NULL
            AND f."nFSid"  IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType NOT IN ('A','D')
            AND f."nFSid"  IS NOT NULL
            AND d."nDocid" IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
    ) q
    ORDER BY q._sort_first, q."cFname", q."nUserid";

    RETURN NEXT ref1;
END;
$function$;

-- ============ public.et_get_bundle_links ============
CREATE OR REPLACE FUNCTION public.et_get_bundle_links(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$declare nUserid uuid;nBundledetailid uuid;cFlag text;
isAdmin boolean default false; 
	nCaseid uuid; nTeamid uuid;nRoleid uuid;

BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFlag := parameter ->>'cFlag';

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	 raise notice 'nCaseid , nRoleid  %,%,% nTeamid &',nCaseid,nRoleid,nTeamid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

-- select * from "DocDetail" where 
if(cFlag='DL')then

open ref1 for 
select  d."nDocid",dd."jLinktype",
jsonb_agg(distinct jsonb_build_object('nBundledetailid',dl."nBundledetailid",'nDMLid',dl."nDMLids",'jLinktype',dl."jLinktype",
											'cTab',bdl."cTab",'cExhibitno',bdl."cExhibitno",'cFilename',bdl."cFilename",'cBundletag',bm."cBundletag",'cPath',bdl."cPath")) sublist
from "DocMaster" d
join "DocDetail" dd on dd."nDocid" = d."nDocid"
join "DMLinks" dl on dl."nDocid" = d."nDocid"
join "BundleDetail" bd on bd."nBundledetailid" = d."nBundledetailid"
join "BundleDetail" bdl on bdl."nBundledetailid" = dl."nBundledetailid"
left join "DMShared" ds on ds."nDocid" = d."nDocid"  and ds."nUserid" = nUserid
left join "LocationShare" ls on ls."nBundledetailid" = d."nBundledetailid" and ls."nUserid" = nUserid
left join "BundleMaster" bm on bm."nBundleid" = bdl."nBundleid"
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
where d."nBundledetailid" = nBundledetailid  and (d."nUserid" = nUserid or ls."nUserid" = d."nUserid" or ds."nUserid" = nUserid  or (case when  isAdmin = true then  d."nUserid" = tr."nUserid" else false end)) 
group by d."nDocid",dd."jLinktype"
;
elsif(cFlag='FL') then
-- select * from "FactMaster"

open ref1 for 
select f."nFSid",fd."jLinktype",
jsonb_agg(distinct jsonb_build_object('nBundledetailid',fl."nBundledetailid",'nDMLid',fl."nFMLid",'jLinktype',fl."jLinktype",
											'cTab',bd."cTab",'cExhibitno',bd."cExhibitno",'cFilename',bd."cFilename",'cBundletag',bm."cBundletag",'cPath',bd."cPath",'nPage',fd."nPage")) sublist
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
join "FMLinks" fl on fl."nFSid" = f."nFSid"
join "BundleDetail" bd on bd."nBundledetailid" = fl."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
left join "LocationShare" ls on ls."nBundledetailid" = fl."nBundledetailid" and ls."nUserid" = nUserid
left join "FMShared" fs on fs."nFSid" = f."nFSid"  and fs."nUserid" = nUserid
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid or ls."nUserid" = f."nUserid" or fs."nUserid" = nUserid  or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) 
 group by f."nFSid",fd."jLinktype";
 elsif(cFlag='WL') then
-- select * from "FactMaster"

open ref1 for 
select w."nWebid",wd."cUrl",wd."cTitle",wd."cNote",wd."cUrl",wd."jLinktype"
from "WebMaster" w
join "WebDetail" wd on wd."nWebid" = w."nWebid"
left join "WMShared" ws on ws."nWebid" = w."nWebid"  and ws."nUserid" = nUserid
 where  w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nUserid or ws."nUserid" = nUserid );

 elsif(cFlag='F') then
-- select "bIsHighlighted",* from "FactDetail"

open ref1 for 
with tm as 
(select f."nFSid",fd."jLinktype",fd."jTexts",fd."cTooltype",fd."jOT",fd."bIsHighlighted",fd."nPage",
jsonb_agg(distinct jsonb_build_object('nIid',im."nIid",'cIName',im."cIName",'cCategory',ic."cCategory",'cColor',im."cColor",'cRel',rl."cCodename",'nImpactid',fi."nImpactid",'nSerialno',rl."nSerialno",'nISerialno',impct."nSerialno")  ) "jIssue"
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid" 
LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid" 
 left join "FMShared" fs on fs."nFSid" = f."nFSid"  and fs."nUserid" = nUserid
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
left join "LocationShare" ls on ls."nBundledetailid" = f."nBundledetailid" and ls."nUserid" = nUserid
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid  or  ls."nUserid" = f."nUserid" or fs."nUserid" = nUserid or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end))  and f."cFType" = 'F'
 group by f."nFSid",fd."jLinktype",fd."jTexts",fd."jOT",fd."bIsHighlighted",fd."cTooltype",fd."nPage")
select t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage",jsonb_agg(issue order by issue->>'nSerialno',issue->>'nISerialno') "jIssue" from tm t,jsonb_array_elements(t."jIssue") issue
 group by t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage"
 ;
 
 
 elsif(cFlag='QF') then
-- select "bIsHighlighted",* from "FactDetail"

open ref1 for 
with tm as 
(select f."nFSid",fd."jLinktype",fd."jTexts",fd."cTooltype",fd."jOT",fd."bIsHighlighted",fd."nPage",
jsonb_agg(distinct jsonb_build_object('nIid',im."nIid",'cIName',im."cIName",'cCategory',ic."cCategory",'cColor',im."cColor",'cRel',rl."cCodename",'nImpactid',fi."nImpactid",'nSerialno',rl."nSerialno",'nISerialno',impct."nSerialno")  ) "jIssue"
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid" 
LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid" 
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid  or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) and f."cFType" = 'QF'
 group by f."nFSid",fd."jLinktype",fd."jTexts",fd."jOT",fd."bIsHighlighted",fd."cTooltype",fd."nPage")
select t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage",jsonb_agg(issue order by issue->>'nSerialno',issue->>'nISerialno') "jIssue" from tm t,jsonb_array_elements(t."jIssue") issue
 group by t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage"
 ;
 
 
 
 
else

-- select * from "WebDetail"
open ref1 for 
select w."nWebid",w."nBundledetailid" "nId",wd."jLinktype",wd."cUrl",wd."cTitle",wd."cNote",wd."cImg",wd."cFavicon"
from "WebMaster" w
join "WebDetail" wd on wd."nWebid" = w."nWebid"
left join "LocationShare" ls on ls."nBundledetailid" = w."nBundledetailid" and ls."nUserid" = nUserid
left join "BundleDetail" bd on bd."nBundledetailid" = w."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
 where  w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nUserid or ls."nUserid" = nUserid) 
;
end if;

RETURN next ref1 ; 

open ref2 for select 1 msg;
RETURN next ref2 ; 
-- select * from "bundlelist"

                                                      -- Return the cursor to the caller
    END;$function$;

-- ============ public.et_workspace_fact_list ============
CREATE OR REPLACE FUNCTION public.et_workspace_fact_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nMasterid uuid;
    cFacttype text;
    nCaseid uuid;
    nContactid uuid;
    nIssueid uuid;
    jFilter jsonb;

    filter_string text;
    sql_query TEXT;

    isAdmin boolean default false;
    nRoleid uuid;
    nTeamid uuid;

BEGIN

    ------------------------------------------------------------
    -- PARAMETERS
    ------------------------------------------------------------

    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    cFacttype := parameter ->>'cFacttype';
    nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;
    nContactid:= NULLIF(parameter ->>'nContactid','')::uuid;
    nIssueid  := NULLIF(parameter ->>'nIssueid','')::uuid;

    jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

    IF nCaseid IS NULL THEN
        RAISE EXCEPTION 'nCaseid is required';
    END IF;

    ------------------------------------------------------------
    -- ADMIN / TEAM
    ------------------------------------------------------------

    IF nMasterid IS NOT NULL THEN

        SELECT "isAdmin"
        INTO isAdmin
        FROM "UserMaster"
        WHERE "nUserid" = nMasterid;

        SELECT "nTeamid","nRoleid"
        INTO nTeamid,nRoleid
        FROM "TeamRelation"
        WHERE "nUserid" = nMasterid
          AND "nCaseid" = nCaseid
        LIMIT 1;

        IF (
            isAdmin = false
            AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1
        ) THEN
            isAdmin := true;
        END IF;

    END IF;

    filter_string :=
        (SELECT filter_whereclause_2(jFilter,'WRK'));

    ------------------------------------------------------------
    -- MAIN QUERY
    ------------------------------------------------------------

sql_query := '

WITH

issue_ct AS (
   SELECT "nFSid", count(*) as issues
   FROM "FMIssue"
   GROUP BY "nFSid"
),

contact_ct AS (
   SELECT "nFSid", count(*) as contacts
   FROM "FMContact"
   GROUP BY "nFSid"
),

task_ct AS (
   SELECT "nFSid", count(*) as tasks
   FROM "FMTasks"
   GROUP BY "nFSid"
),

link_ct AS (
   SELECT "nFSid", count(*) as links
   FROM "FMLinks"
   GROUP BY "nFSid"
),

shared_ct AS (
   SELECT "nFSid", count(*) as shared
   FROM "FMShared"
   GROUP BY "nFSid"
),

contact_email AS (
   SELECT 
       fc."nFSid",
       STRING_AGG(DISTINCT cm."cEmail", '', '') AS "cEmails"
   FROM "FMContact" fc
   JOIN "ContactMaster" cm 
        ON cm."nContactid" = fc."nContactid"
   GROUP BY fc."nFSid"
)

SELECT

    ----------------------------------------------------
    -- BASE FACT
    ----------------------------------------------------

    f."nFSid",
    f."nBundledetailid",
    f."dCreateDt",
    f."cFType",

    d."cFact",
    d."nTZid",
    d."jDate",
    d."nFiletype",
    d."nStatus",
    d."cType",
    d."jLinktype",
    d."jTexts",
    d."bIsHighlighted",
    d."jOT",

    ----------------------------------------------------
    -- CATEGORY SAFE CODEMASTER JOIN
    ----------------------------------------------------

    cs."cCodename" AS "cStatus",
    cf."cCodename" AS "cFiletype",

    ----------------------------------------------------
    -- BUNDLE INFO
    ----------------------------------------------------

    bd."cFilename",
    bd."cTab",
    bd."cExhibitno",
    bd."cBundletag",

    ----------------------------------------------------
    -- COUNTERS
    ----------------------------------------------------

    COALESCE(issue_ct.issues,0)     AS "nIssues",
    COALESCE(contact_ct.contacts,0) AS "nContactcount",
    COALESCE(task_ct.tasks,0)       AS "nTaskcount",
    COALESCE(link_ct.links,0)       AS "nLinkscount",
    COALESCE(shared_ct.shared,0)    AS "nSUsers",

    ----------------------------------------------------
    -- EMAILS
    ----------------------------------------------------

    ce."cEmails",

    ----------------------------------------------------

    um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby"

FROM "FactMaster" f

JOIN "FactDetail" d
  ON d."nFSid" = f."nFSid"

--------------------------------------------------------
-- FIXED PART: CATEGORY SAFE JOINS
--------------------------------------------------------

LEFT JOIN "Codemaster" cs
  ON cs."nCodeid" = d."nStatus"
 AND cs."nCategoryid" = 24          -- STATUS CATEGORY

LEFT JOIN "Codemaster" cf
  ON cf."nCodeid" = d."nFiletype"
 AND cf."nCategoryid" = 23          -- FILETYPE CATEGORY

--------------------------------------------------------

JOIN "UserMaster" um
  ON um."nUserid" = f."nUserid"

JOIN "bundlesource" bd
  ON bd."nBundledetailid" = f."nBundledetailid"

LEFT JOIN issue_ct   ON issue_ct."nFSid"   = f."nFSid"
LEFT JOIN contact_ct ON contact_ct."nFSid" = f."nFSid"
LEFT JOIN task_ct    ON task_ct."nFSid"    = f."nFSid"
LEFT JOIN link_ct    ON link_ct."nFSid"    = f."nFSid"
LEFT JOIN shared_ct  ON shared_ct."nFSid"  = f."nFSid"

LEFT JOIN contact_email ce 
    ON ce."nFSid" = f."nFSid"

WHERE
(
    f."nFSid" IS NOT NULL

    AND f."nCaseid" = ''' || nCaseid || '''::uuid

    AND (
        ' || quote_literal(cFacttype) || ' = ''ALL''
        OR f."cFType" = ' || quote_literal(cFacttype) || '
    )

    ----------------------------------------------------
    -- PERMISSION LOGIC
    ----------------------------------------------------

    AND (
        ' || CASE
             WHEN nMasterid IS NULL THEN 'true'
             ELSE '
             (
                f."nUserid" = ''' || nMasterid || '''::uuid

                OR EXISTS (
                    SELECT 1 FROM "FMShared" s
                    WHERE s."nFSid" = f."nFSid"
                      AND s."nUserid" = ''' || nMasterid || '''::uuid
                )

                OR (
                    ' || isAdmin || '::boolean = true
                    AND EXISTS (
                        SELECT 1
                        FROM "TeamRelation" tr
                        WHERE tr."nTeamid" = ''' || nTeamid || '''
                          AND tr."nUserid" = f."nUserid"
                          AND tr."nCaseid" = ''' || nCaseid || '''
                    )
                )
             )'
             END || '
    )

    ' || CASE WHEN filter_string IS NOT NULL
              THEN ' AND (' || filter_string || ') '
              ELSE '' END || '
)

ORDER BY
    coalesce((d."jDate"->>''date1''), f."dCreateDt"::text) DESC
';

OPEN ref FOR EXECUTE sql_query;

RETURN ref;

END;
$function$;

-- ============ public.et_bundledetail_with_filter ============
CREATE OR REPLACE FUNCTION public.et_bundledetail_with_filter(parameter jsonb, ref1 refcursor DEFAULT NULL::refcursor)
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

-- SELECT jsonb_agg(distinct m."nDocid") into docids
-- 	From "DocMaster" m
-- 	join "DocDetail" d on d."nDocid" = m."nDocid"
-- 	left join "DMLinks" l on l."nDocid" = m."nDocid" 
-- 	left join "DMShared" ds on ds."nDocid" = m."nDocid" 
-- 	where
-- 	(m."nUserid" =  nMasterid or ds."nUserid" = nMasterid)
-- 	and
-- 	(m."nSesid" is not distinct from nSesid OR m."nBundledetailid" is not distinct from nBundledetailid)
-- 	and d."cType" != 'M'
-- 	and case when jFilter is not null then 	
-- 		 exists (
-- 			select * from realtime.filter_marknav(jFilter,nID,nMasterid,'ALL') t
-- 		where t."id" = m."nDocid"
-- 		 ) 
-- 	else true end
-- 	;

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
			fd."nPage",
			fd."nLine",
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
		   group by f."cFType", f."nFSid",  um."cFname",um."cLname",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts",
			fd."jOT",
			fd."jCordinates",
			fd."nPage",
			fd."nLine",
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
			dd."nPage",
			dd."nLine",
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
		  group by m."nDocid", m."dCreateDt",um."cFname",um."cLname", dd."cType",
		  m."nBundledetailid" ,dd."jLinktype",dd."jTexts",dd."jOText" ,dd."jCordinates",dd."nPage",
		  dd."nLine",cmt."total"
		
		union all 
			-- select 
			-- 'QM' AS "cSource",
			-- rh."nHid" as "id",
			-- null::uuid as "nFSid",
			-- rh."dCreatedt" "dCreateDt",
			-- um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
			-- NULL::text AS "cType",
			-- NULL::jsonb AS "jLinktype",
			-- NULL::jsonb AS "jTexts",
			-- NULL::jsonb AS "jCordinates",
			-- (CASE WHEN bIsTranscipt THEN rh."cTPageno" ELSE rh."cPageno" END)::int AS "nPage",
			-- (CASE WHEN bIsTranscipt THEN rh."cTLineno" ELSE rh."cLineno" END)::int AS "nLine",
			-- NULL::text AS "cColor",
			-- NULL::jsonb AS "jDate",
			-- null list,
			--  rh."nUserid"
			-- from "RHighlights" rh 
			-- join "UserMaster" um on um."nUserid" = rh."nUserid"
			-- where rh."nUserid" = nMasterid
			-- and "nSessionId" = nSesid
			-- and case when jFilter is not null then 	
			-- exists (
			-- select * from realtime.filter_marknav(jFilter,nID,nMasterid,'ALL') t
			-- where t."id" = rh."nHid"
			-- ) 
	 	-- 	else true end			
		 select  *	from qmarktable
		)	
		SELECT * FROM combined_results	
		ORDER BY 
			CASE WHEN cSortby = 'asc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END ASC,
			CASE WHEN cSortby = 'desc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END DESC,
			CASE WHEN cSortby = 'asc' THEN "dCreateDt" END ASC,
			CASE WHEN cSortby = 'desc' THEN "dCreateDt" END DESC;
			-- ,"dCreateDt" DESC;

	
-- DROP TABLE IF EXISTS temp_history_marknav;
-- DROP TABLE IF EXISTS qmarktable;

   RETURN NEXT ref1;

END;
$function$;

-- ============ public.et_fact_permissions ============
CREATE OR REPLACE FUNCTION public.et_fact_permissions(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
	nFSid uuid;

	
	isAdmin boolean default false;
	nRoleid uuid;nCaseid uuid;
BEGIN
    nFSid := NULLIF(parameter ->> 'nFSid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;

	isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;
	
	select "nCaseid" into nCaseid from "FactMaster" where "nFSid" = nFSid;

	
	select "nRoleid" into nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

    OPEN ref FOR
        SELECT f."nFSid",f."nUserid",
		case when (f."nUserid" = nUserid or isAdmin) then true else s."bCanComment" end "bCanComment",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."bCanEdit" end "bCanEdit",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."bCanReshare" end "bCanReshare",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."nFSid" is not null end "bCanView"
		from "FactMaster" f
		left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
		where f."nFSid" = nFSid; --and "nUserid" = nUserid;

		
    RETURN ref;
END;
$function$;

-- ============ realtime.et_factsheet_detail ============
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
