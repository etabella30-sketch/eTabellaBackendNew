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
$function$
