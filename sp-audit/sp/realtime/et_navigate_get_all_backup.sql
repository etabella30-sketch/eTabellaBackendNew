CREATE OR REPLACE FUNCTION realtime.et_navigate_get_all_backup(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
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
	sql_query_web_links TEXT;
	sql_query_fact_links TEXT;
	filter_string text default null;
    filter_string_doc_links text default null;
	filter_string_web_links text default null;
	factids uuid[];
    docids uuid[];
	webids uuid[];
	factlinkids uuid[];
	bIsTranscipt boolean default false;

    
BEGIN
    -- Extract parameters
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := parameter ->>'jFilter';
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

	
filter_string := (select filter_whereclause(jFilter,'FCH'));

  sql_query := 'select (array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
        LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
    WHERE (f."nSesid" = ''' || coalesce(nSesid,'00000000-0000-0000-0000-000000000000') || '''::uuid OR f."nBundledetailid" = ''' || coalesce(nBundledetailid,'00000000-0000-0000-0000-000000000000') || '''::uuid)
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid) ' ||
	(case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

	
    IF filter_string IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
        -- jFilter has content but no valid filter string generated - return empty
        factids := ARRAY[]::uuid[];
    ELSE
        -- No filters or valid filter applied - execute query
		-- raise notice 'sql_query %', sql_query;
        EXECUTE sql_query INTO factids;
    END IF;

	-- raise notice 'sql_query %', sql_query;

          
filter_string_doc_links := (select filter_whereclause(jFilter,'DL'));

sql_query_doc_links := ('select (array (  select distinct m."nDocid" 
	From "DocMaster" m
	join "DocDetail" d on d."nDocid" = m."nDocid"
	left join "DMLinks" l on l."nDocid" = m."nDocid" 
	left join "DMShared" ds on ds."nDocid" = m."nDocid" 
	where (
	(m."nUserid" = ''' || nMasterid || '''::uuid
	or ds."nUserid" = ''' || nMasterid || '''::uuid
	)
	and
	(m."nSesid" = ''' || coalesce(nSesid,'00000000-0000-0000-0000-000000000000') || '''::uuid OR m."nBundledetailid" = ''' || coalesce(nBundledetailid,'00000000-0000-0000-0000-000000000000') || '''::uuid)
	and d."cType" != ''M''
	) ' || (case when filter_string_doc_links is not null then (' and (' || filter_string_doc_links || ') ') else '' end) || '    ))');
 

	IF filter_string_doc_links IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
        docids := ARRAY[]::uuid[];
    ELSE
        -- No filters or valid filter applied - execute query
        EXECUTE sql_query_doc_links INTO docids;
    END IF;

	raise notice 'sql_query_doc_links %', sql_query_doc_links;

 -- Filter for Weblinks
    -- filter_string_web_links := (select filter_whereclause(jFilter,'NWL'));
    -- raise notice 'filter_string_web_links - % ',filter_string_web_links;

-- FMlinks 
	-- sql_query_fact_links := 'select (array (SELECT distinct f."nFSid"
    -- FROM "FMLinks" l
    -- JOIN "FactMaster" f ON l."nFSid" = f."nFSid"
    -- JOIN "FactDetail" d ON d."nFSid" = l."nFSid"
    -- LEFT JOIN "FMTasks" t ON t."nFSid" = l."nFSid"
    -- LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    -- LEFT JOIN "FMIssue" i ON i."nFSid" = l."nFSid"
    -- LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    -- LEFT JOIN "FMShared" s ON s."nFSid" = l."nFSid"
    -- LEFT JOIN "FMContact" c ON c."nFSid" = l."nFSid"
    -- WHERE l."nBundledetailid" = ''' || nBundledetailid || '''::uuid
    -- AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)' ||
	-- (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

	
    -- IF filter_string IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
    --     -- jFilter has content but no valid filter string generated - return empty
    --     factlinkids := ARRAY[]::uuid[];
    -- ELSE
    --     -- No filters or valid filter applied - execute query
    --     EXECUTE sql_query_fact_links INTO factlinkids;
    -- END IF;

	-- raise notice 'sql_query_fact_links %', sql_query_fact_links;

	
OPEN ref1 FOR 
		
	-- with bgroup AS (
	-- 	  SELECT 
	-- 	     row_number() OVER (ORDER BY m."nDocid" DESC) AS "nGId",  
    -- jsonb_agg(m."nDocid") AS "jDIds",
    -- max(m."dCreateDt") AS "dCreateDt",
    -- d."jLinktype" AS "grouplink",
	-- 	    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby"
	-- 	  FROM "DocMaster" m
	-- 	  JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
	-- 	  JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
	-- 	  LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
	-- 	  WHERE m."nBundledetailid" = nBundledetailid 
	-- 	    AND (m."nUserid" = nMasterid OR ds."nUserid" = nMasterid)
	-- 		and d."cType" != 'M' and m."nDocid" = ANY(docids)
	-- 	  GROUP BY d."jLinktype", um."cFname", um."cLname",m."nDocid"
	-- 	),
		with links as (
		    select 	l."nDocid",l."nDMLids" ,l."jLinktype",l."nBundledetailid",d.*
			from "DMLinks" l
		    -- join tbl m on m."nDocid" = l."nDocid"
			join bundlesource d on d."nBundledetailid" = l."nBundledetailid"
			where l."nDocid" = ANY(docids)
		),
		 combined_results AS (
		SELECT distinct
			case when f."cFType" = 'F' then 'F' else 'QF' end as "cSource",
		    f."nFSid"::uuid as "id",
			f."nFSid",
		 -- null::uuid as "nHid",
		 --    NULL::uuid AS "nDocid",
		 --    NULL::uuid AS "nWebid",
		 --    NULL::jsonb AS "jDIds",
			-- NULL::uuid AS "nDMLids",
			-- NULL::int AS "nGId",
			-- NULL::jsonb AS "grouplink",   
		    f."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    fd."cType",
		    fd."jLinktype",
		    fd."jTexts" AS "jTexts",
			fd."jCordinates",
			fd."nPage",
			fd."nLine",
		 --    NULL::text AS "cUrl",
		 --    NULL::text AS "cTitle",
		 --    NULL::text AS "cNote",
			-- NULL::text AS "cFilename",
			-- NULL::text AS "cTab",
			-- NULL::text AS "cBundletag",
			-- NULL::text AS "cExhibitno",
			-- NULL::uuid AS "nBundledetailid", 
        --    cm."cCodename" as "cDatetype", 
		   cl."cColor" AS "cColor",
		    fd."jDate",
			null::jsonb as list
		   -- null::text as "identity",
		--    null::int as "nPage",
		--    null::int as "nLine"
		FROM "FactMaster" f
		JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'nValue')::int
		WHERE (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
		  AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
		  AND f."nFSid" = ANY(factids)

-- UNION ALL
		-- SELECT 
		--     'D' AS "cSource",
		--     NULL::uuid AS "nFSid",
		--     d."nDocid"::uuid,
		--     NULL::uuid AS "nWebid",
		--     bg."jDIds",
		-- 	d."nDMLids",                 
		-- 	bg."nGId",                   
		-- 	bg."grouplink", 
		--     bg."dCreateDt",
		--     bg."cCreateby",
		--     NULL::text AS "cType",
		--     d."jLinktype",
		--     d."jOTexts" AS "jText",
		--     NULL::text AS "cUrl",
		--     NULL::text AS "cTitle",
		--     NULL::text AS "cNote",
		-- 	bs."cFilename",
		-- 	bs."cTab",
		-- 	bs."cBundletag",
		-- 	bs."cExhibitno",
		-- 	bs."nBundledetailid",
		-- 	null as "cDatetype",null "cColor",null "jDate",null "cFType"
		-- FROM bgroup bg
		-- JOIN "DMLinks" d ON bg."jDIds" @> to_jsonb(d."nDocid")
		-- JOIN "bundlesource" bs ON bs."nBundledetailid" = d."nBundledetailid"
	
		
		UNION ALL
		SELECT 
		    'D' AS "cSource",
			m."nDocid"::uuid as "id",
		    m."nDocid"::uuid,
		   m."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    NULL::text AS "cType",
		    dd."jLinktype",
		    dd."jTexts" AS "jText",
			dd."jCordinates",
			dd."nPage",
			dd."nLine",
			null "cColor",
			null "jDate",
			jsonb_agg(distinct l.*) as list
		-- FROM bgroup bg
		  FROM "DocMaster" m
		  JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
		  JOIN "DocDetail" dd ON dd."nDocid" = m."nDocid"
		  JOIN "links" l ON l."nDocid" = m."nDocid"
		  LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
		  where  (m."nSesid" = nSesid OR m."nBundledetailid" = nBundledetailid) and
		  m."nDocid" = ANY(docids) AND (m."nUserid" = nMasterid OR ds."nUserid" = nMasterid)	
		  group by m."nDocid", m."dCreateDt",um."cFname",um."cLname",dd."jLinktype",dd."jTexts",dd."jCordinates",dd."nPage",
		  dd."nLine"
		-- UNION ALL
		
		-- SELECT 
		--     'FL' AS "cSource",
		--     f."nFSid"::uuid,
		--     NULL::uuid AS "nDocid",
		--     NULL::uuid AS "nWebid",
		--     NULL::jsonb AS "jDIds",
		-- 	NULL::uuid AS "nDMLids",
		-- 	NULL::int AS "nGId",
		-- 	NULL::jsonb AS "grouplink",   
		--     f."dCreateDt",
		--     um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		--     fd."cType",
		--     fd."jLinktype",
		--     fd."jTexts" AS "jText",
		--     NULL::text AS "cUrl",
		--     NULL::text AS "cTitle",
		--     NULL::text AS "cNote",
		-- 	NULL::text AS "cFilename",
		-- 	NULL::text AS "cTab",
		-- 	NULL::text AS "cBundletag",
		-- 	NULL::text AS "cExhibitno", 
		-- 	NULL::uuid AS "nBundledetailid", 
        --    cm."cCodename" as "cDatetype", 
		--    cl."cColor" AS "cColor", fd."jDate",f."cFType"
		-- FROM "FMLinks" fl
		-- JOIN "FactMaster" f ON fl."nFSid" = f."nFSid"
		-- JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		-- JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	-- JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		-- LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		-- LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'type')::int
		-- WHERE fl."nBundledetailid" = nBundledetailid
		--   AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
		--   AND f."nFSid" = ANY(factlinkids)
		union all 
			select 
			'QM' AS "cSource",
			rh."nHid" as "id",
			null::uuid as "nFSid",
			rh."dCreatedt" "dCreateDt",
			um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
			NULL::text AS "cType",
			NULL::jsonb AS "jLinktype",
			NULL::jsonb AS "jTexts",
			NULL::jsonb AS "jCordinates",
			-- (CASE WHEN bIsTranscipt THEN rh."tidentity" ELSE rh."identity" END) AS "identity",
			(CASE WHEN bIsTranscipt THEN rh."cTPageno" ELSE rh."cPageno" END)::int AS "nPage",
			(CASE WHEN bIsTranscipt THEN rh."cTLineno" ELSE rh."cLineno" END)::int AS "nLine",
			-- NULL::text as "cDatetype", 
			NULL::text AS "cColor",
			NULL::jsonb AS "jDate",
			null list
			from "RHighlights" rh 
			join "UserMaster" um on um."nUserid" = rh."nUserid"
			where rh."nUserid" = nMasterid
			and "nSessionId" = nSesid
			
		)	
		SELECT * FROM combined_results	
		ORDER BY 
		"nPage" asc,
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
    WHERE f."nFSid" = ANY(factids)
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid", 
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";
			 
raise notice 'factlinkids % factids %',factlinkids,factids;

OPEN ref3 FOR

    SELECT fl."nFSid",fl."nFMLid", bd."nBundledetailid", 
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
	JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid" 
    WHERE fl."nFSid" = ANY(factids);

	-- union 

	--  SELECT fl."nFSid",fl."nFMLid", bd."nBundledetailid", 
	--  bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
	--  fl."jLinktype", bd."cPage"
	--  FROM "FMLinks" fl
	--  join "FactMaster" f on f."nFSid" = fl."nFSid"
	--  JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
	--  WHERE fl."nFSid" = ANY(factlinkids) and fl."nBundledetailid" = nBundledetailid;

   RETURN NEXT ref1;
   RETURN NEXT ref2;
   RETURN NEXT ref3;

END;
$function$
