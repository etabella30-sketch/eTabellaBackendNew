CREATE OR REPLACE FUNCTION public.et_navigate_get_all(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
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
    
BEGIN
    -- Extract parameters
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := parameter ->>'jFilter';

	
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
    WHERE f."nBundledetailid" = ''' || nBundledetailid || '''::uuid
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid) ' ||
	(case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

	
    IF filter_string IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
        -- jFilter has content but no valid filter string generated - return empty
        factids := ARRAY[]::uuid[];
    ELSE
        -- No filters or valid filter applied - execute query
		raise notice 'sql_query %', sql_query;
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
	m."nBundledetailid" = ''' || nBundledetailid || '''::uuid
	-- and d."cType" != ''M''
	) ' || (case when filter_string_doc_links is not null then (' and (' || filter_string_doc_links || ') ') else '' end) || '    ))');
 --

	IF filter_string_doc_links IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
        -- jFilter has content but no valid filter string generated - return empty
        docids := ARRAY[]::uuid[];
    ELSE
        -- No filters or valid filter applied - execute query
        EXECUTE sql_query_doc_links INTO docids;
    END IF;

	-- raise notice 'sql_query_doc_links %', sql_query_doc_links;

 -- Filter for Weblinks
    filter_string_web_links := (select filter_whereclause(jFilter,'NWL'));
    -- raise notice 'filter_string_web_links - % ',filter_string_web_links;

sql_query_web_links := ('select (array (select distinct w."nWebid"
	from "WebMaster" w 
	JOIN "UserMaster" um ON um."nUserid" = w."nUserid" 
	left join "WebDetail" wd on wd."nWebid" = w."nWebid"
	LEFT join "WMShared" ws on ws."nWebid" = w."nWebid"
	where (
	w."nBundledetailid" = '''|| nBundledetailid ||'''::uuid
	and (w."nUserid" = ''' || nMasterid || '''::uuid or ws."nUserid" = ''' || nMasterid || '''::uuid )
	and wd."cType" != ''M''
	) ' ||  (case when filter_string_web_links is not null then (' and (' || filter_string_web_links || ') ') else '' end) || '))');

	-- raise notice 'webids %', sql_query_web_links;
	IF filter_string_web_links IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
        -- jFilter has content but no valid filter string generated - return empty
        webids := ARRAY[]::uuid[];
    ELSE
        -- No filters or valid filter applied - execute query
        EXECUTE sql_query_web_links INTO webids;
    END IF;

-- FMlinks 
	sql_query_fact_links := 'select (array (SELECT distinct f."nFSid"
    FROM "FMLinks" l
    JOIN "FactMaster" f ON l."nFSid" = f."nFSid"
    JOIN "FactDetail" d ON d."nFSid" = l."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = l."nFSid"
    LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = l."nFSid"
    LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = l."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = l."nFSid"
    WHERE l."nBundledetailid" = ''' || nBundledetailid || '''::uuid
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)' ||
	(case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

	
    IF filter_string IS NULL AND jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
        -- jFilter has content but no valid filter string generated - return empty
        factlinkids := ARRAY[]::uuid[];
    ELSE
        -- No filters or valid filter applied - execute query
        EXECUTE sql_query_fact_links INTO factlinkids;
    END IF;

	raise notice 'sql_query_fact_links %', sql_query_fact_links;

	
OPEN ref1 FOR 
		
	with bgroup AS (
		  SELECT 
		     row_number() OVER (ORDER BY m."nDocid" DESC) AS "nGId",  
    jsonb_agg(m."nDocid") AS "jDIds",
    max(m."dCreateDt") AS "dCreateDt",
    d."jLinktype" AS "grouplink",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby"
		  FROM "DocMaster" m
		  JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
		  JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
		  LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
		  WHERE m."nBundledetailid" = nBundledetailid 
		    AND (m."nUserid" = nMasterid OR ds."nUserid" = nMasterid)
			-- and d."cType" != 'M' 
			and m."nDocid" = ANY(docids)
		  GROUP BY d."jLinktype", um."cFname", um."cLname",m."nDocid"
		),
		combined_results AS (
		SELECT 
		distinct
		    'F' AS "cSource",
		    f."nFSid"::uuid,
		    NULL::uuid AS "nDocid",
		    NULL::uuid AS "nWebid",
		    NULL::jsonb AS "jDIds",
			NULL::uuid AS "nDMLids",
			NULL::int AS "nGId",
			NULL::jsonb AS "grouplink",   
		    f."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    fd."cType",
		    fd."jLinktype",
		    fd."jTexts" AS "jText",
		    NULL::text AS "cUrl",
		    NULL::text AS "cTitle",
		    NULL::text AS "cNote",
			NULL::text AS "cFilename",
			NULL::text AS "cTab",
			NULL::text AS "cBundletag",
			NULL::text AS "cExhibitno",
			NULL::uuid AS "nBundledetailid", 
           cm."cCodename" as "cDatetype", 
		   cl."cColor" AS "cColor", fd."jDate",f."cFType"
		FROM "FactMaster" f
		JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'type')::int
		WHERE f."nBundledetailid" = nBundledetailid
		  AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
		  AND f."nFSid" = ANY(factids)
		--   and fd."cType" != 'M'
		
		UNION ALL
		
		SELECT 
		    'D' AS "cSource",
		    NULL::uuid AS "nFSid",
		    d."nDocid"::uuid,
		    NULL::uuid AS "nWebid",
		    bg."jDIds",
			d."nDMLids",                 
			bg."nGId",                   
			bg."grouplink", 
		    bg."dCreateDt",
		    bg."cCreateby",
		    NULL::text AS "cType",
		    d."jLinktype",
		    d."jOTexts" AS "jText",
		    NULL::text AS "cUrl",
		    NULL::text AS "cTitle",
		    NULL::text AS "cNote",
			bs."cFilename",
			bs."cTab",
			bs."cBundletag",
			bs."cExhibitno",
			bs."nBundledetailid",
			null as "cDatetype",null "cColor",null "jDate",null "cFType"
		FROM bgroup bg
		JOIN "DMLinks" d ON bg."jDIds" @> to_jsonb(d."nDocid")
		JOIN "bundlesource" bs ON bs."nBundledetailid" = d."nBundledetailid"
-- select * from bundlesource limit 100
		UNION ALL
		
		SELECT 
		    'W' AS "cSource",
		    NULL::uuid AS "nFSid",
		    NULL::uuid AS "nDocid",
		    w."nWebid"::uuid,
		    NULL::jsonb AS "jDIds",
			NULL::uuid AS "nDMLids",
			NULL::int AS "nGId",
			NULL::jsonb AS "grouplink",   
		    w."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    wd."cType",
		    wd."jLinktype",
		    NULL::jsonb AS "jText",
		    wd."cUrl",
		    wd."cTitle",
		    wd."cNote",
			NULL::text AS "cFilename",
			NULL::text AS "cTab",
			NULL::text AS "cBundletag",
			NULL::text AS "cExhibitno",
			NULL::uuid AS "nBundledetailid", 
			null as "cDatetype",null "cColor",null "jDate",null "cFType"
		FROM "WebMaster" w
		JOIN "UserMaster" um ON um."nUserid" = w."nUserid"
		LEFT JOIN "WebDetail" wd ON wd."nWebid" = w."nWebid"
		LEFT JOIN "WMShared" ws ON ws."nWebid" = w."nWebid"
		
		WHERE w."nBundledetailid" = nBundledetailid
		  AND (w."nUserid" = nMasterid OR ws."nUserid" = nMasterid)
		  and wd."cType" != 'M'
		  AND w."nWebid" = ANY(webids)  

		UNION ALL

		SELECT 
		    'FL' AS "cSource",
		    f."nFSid"::uuid,
		    NULL::uuid AS "nDocid",
		    NULL::uuid AS "nWebid",
		    NULL::jsonb AS "jDIds",
			NULL::uuid AS "nDMLids",
			NULL::int AS "nGId",
			NULL::jsonb AS "grouplink",   
		    f."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    fd."cType",
		    fd."jLinktype",
		    fd."jTexts" AS "jText",
		    NULL::text AS "cUrl",
		    NULL::text AS "cTitle",
		    NULL::text AS "cNote",
			NULL::text AS "cFilename",
			NULL::text AS "cTab",
			NULL::text AS "cBundletag",
			NULL::text AS "cExhibitno", 
			NULL::uuid AS "nBundledetailid", 
           cm."cCodename" as "cDatetype", 
		   cl."cColor" AS "cColor", fd."jDate",f."cFType"
		FROM "FMLinks" fl
		JOIN "FactMaster" f ON fl."nFSid" = f."nFSid"
		JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'type')::int
		WHERE fl."nBundledetailid" = nBundledetailid
		  AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
		  AND f."nFSid" = ANY(factlinkids)
		)	
		SELECT * FROM combined_results	
		ORDER BY 
			CASE WHEN cSortby = 'asc' THEN "dCreateDt" END ASC,
			CASE WHEN cSortby = 'desc' THEN "dCreateDt" END DESC,
			"dCreateDt" DESC;

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
           fl."jLinktype", bd."cPage",b."cBundletag"
    FROM "FMLinks" fl
	JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid" 
	left JOIN "BundleMaster" b ON b."nBundleid" = bd."nBundleid" 
    WHERE fl."nFSid" = ANY(factids)

	union 

	 SELECT fl."nFSid",fl."nFMLid", bd."nBundledetailid", 
	 bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
	 fl."jLinktype", bd."cPage",b."cBundletag"
	 FROM "FMLinks" fl
	 join "FactMaster" f on f."nFSid" = fl."nFSid"
	 JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
	left JOIN "BundleMaster" b ON b."nBundleid" = bd."nBundleid" 
	 WHERE fl."nFSid" = ANY(factlinkids) and fl."nBundledetailid" = nBundledetailid;

   RETURN NEXT ref1;
   RETURN NEXT ref2;
   RETURN NEXT ref3;

END;
$function$
